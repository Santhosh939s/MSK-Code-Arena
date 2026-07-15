const statsService = require('./statsService');

const MAX_CONCURRENT_COMPILATIONS = parseInt(process.env.MAX_CONCURRENT_COMPILATIONS || '2', 10);
const MAX_QUEUE_LENGTH = parseInt(process.env.MAX_QUEUE_LENGTH || '20', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.QUEUE_TIMEOUT_MS || '30000', 10);

class QueueService {
  constructor() {
    this.running = 0;
    this.queue = [];
    this.onQueueUpdated = null;
  }

  enqueue(taskFn, submissionId, onStart) {
    if (this.queue.length >= MAX_QUEUE_LENGTH) {
      statsService.recordQueueRejection();
      const err = new Error('Server busy. Too many submissions in queue. Please try again.');
      err.statusCode = 429;
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      const queuedTime = Date.now();
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex(item => item.submissionId === submissionId);
        if (index !== -1) {
          this.queue.splice(index, 1);
          statsService.recordQueueTimeout();
          this.notifyQueueChanged();
          const err = new Error('Request timed out in compilation queue. Please try again.');
          err.statusCode = 504;
          reject(err);
        }
      }, QUEUE_TIMEOUT_MS);

      this.queue.push({ taskFn, resolve, reject, timeout, submissionId, queuedTime, onStart });
      this.notifyQueueChanged();
      this.processNext();
    });
  }

  async processNext() {
    if (this.running >= MAX_CONCURRENT_COMPILATIONS || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { taskFn, resolve, reject, timeout, submissionId, queuedTime, onStart } = this.queue.shift();
    clearTimeout(timeout);
    this.notifyQueueChanged();

    const waitTime = Date.now() - queuedTime;
    statsService.recordWaitTime(waitTime);
    if (onStart) onStart(waitTime);

    try {
      const result = await taskFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      this.processNext();
    }
  }

  getQueuePosition(submissionId) {
    const index = this.queue.findIndex(item => item.submissionId === submissionId);
    return index === -1 ? null : index + 1;
  }

  notifyQueueChanged() {
    if (this.onQueueUpdated) {
      this.onQueueUpdated();
    }
  }

  getStatus() {
    return {
      running: this.running,
      waiting: this.queue.length
    };
  }
}

module.exports = new QueueService();
