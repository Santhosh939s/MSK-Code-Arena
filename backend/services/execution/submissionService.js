const queueService = require('./queueService');

class SubmissionService {
  constructor() {
    this.submissions = new Map();
    this.listeners = new Map();

    // Periodically clean up completed or failed submissions older than 5 minutes
    setInterval(() => this.cleanupStale(), 60000);

    // Bind queue position update listener
    queueService.onQueueUpdated = () => this.updateQueuedPositions();
  }

  createSubmission(submissionId) {
    const sub = {
      submissionId,
      status: 'queued',
      position: queueService.getQueuePosition(submissionId),
      estimatedWait: 0,
      timestamp: Date.now()
    };
    this.calculateEstimatedWait(sub);
    this.submissions.set(submissionId, sub);
    return sub;
  }

  calculateEstimatedWait(sub) {
    if (sub.status === 'queued' && sub.position !== null) {
      const concurrency = parseInt(process.env.MAX_CONCURRENT_COMPILATIONS || '2', 10);
      sub.estimatedWait = Math.ceil(sub.position / concurrency) * 3;
    }
  }

  updateStatus(submissionId, status, details = {}) {
    const sub = this.submissions.get(submissionId);
    if (!sub) return;

    sub.status = status;
    Object.assign(sub, details);

    if (status === 'queued') {
      sub.position = queueService.getQueuePosition(submissionId);
      this.calculateEstimatedWait(sub);
    } else {
      delete sub.position;
      delete sub.estimatedWait;
    }

    this.notifyListeners(submissionId, sub);
  }

  updateQueuedPositions() {
    for (const [id, sub] of this.submissions.entries()) {
      if (sub.status === 'queued') {
        const newPos = queueService.getQueuePosition(id);
        if (newPos !== null) {
          sub.position = newPos;
          this.calculateEstimatedWait(sub);
          this.notifyListeners(id, sub);
        }
      }
    }
  }

  getSubmission(submissionId) {
    return this.submissions.get(submissionId);
  }

  addListener(submissionId, listenerFn) {
    if (!this.listeners.has(submissionId)) {
      this.listeners.set(submissionId, []);
    }
    this.listeners.get(submissionId).push(listenerFn);
  }

  removeListener(submissionId, listenerFn) {
    const list = this.listeners.get(submissionId);
    if (list) {
      const index = list.indexOf(listenerFn);
      if (index !== -1) {
        list.splice(index, 1);
      }
      if (list.length === 0) {
        this.listeners.delete(submissionId);
      }
    }
  }

  notifyListeners(submissionId, update) {
    const list = this.listeners.get(submissionId);
    if (list) {
      // Send a shallow copy to prevent mutation bugs
      const copy = { ...update };
      list.forEach(fn => fn(copy));
    }
    // Clean up listeners on terminal states
    if (update.status === 'completed' || update.status === 'failed') {
      this.listeners.delete(submissionId);
    }
  }

  cleanupStale() {
    const now = Date.now();
    for (const [id, sub] of this.submissions.entries()) {
      if (now - sub.timestamp > 300000) { // 5 minutes
        this.submissions.delete(id);
        this.listeners.delete(id);
      }
    }
  }
}

module.exports = new SubmissionService();
