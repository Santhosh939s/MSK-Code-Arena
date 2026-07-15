const os = require('os');

const startTime = Date.now();
let lastCpuUsage = process.cpuUsage();
let lastTime = Date.now();

class StatsService {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.totalWaitTimeMs = 0;
    this.totalWaitCount = 0;
    this.queueRejections = 0;
    this.queueTimeouts = 0;

    this.verdicts = {
      accepted: 0,
      wrongAnswer: 0,
      compilationErrors: 0,
      runtimeErrors: 0,
      timeouts: 0
    };
  }

  recordHit() { this.hits++; }
  recordMiss() { this.misses++; }
  recordQueueRejection() { this.queueRejections++; }
  recordQueueTimeout() { this.queueTimeouts++; }
  
  recordWaitTime(ms) {
    this.totalWaitTimeMs += ms;
    this.totalWaitCount++;
  }

  recordVerdict(verdict) {
    if (verdict === 'Accepted') this.verdicts.accepted++;
    else if (verdict === 'Wrong Answer') this.verdicts.wrongAnswer++;
    else if (verdict === 'Compilation Error') this.verdicts.compilationErrors++;
    else if (verdict === 'Runtime Error') this.verdicts.runtimeErrors++;
    else if (verdict === 'Time Limit Exceeded') this.verdicts.timeouts++;
  }

  getUptimeString() {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  getCpuUsagePercent() {
    const elapsedMs = Date.now() - lastTime;
    const currentUsage = process.cpuUsage();
    
    const userDiff = currentUsage.user - lastCpuUsage.user;
    const sysDiff = currentUsage.system - lastCpuUsage.system;
    
    lastCpuUsage = currentUsage;
    lastTime = Date.now();
    
    const totalCpuTime = userDiff + sysDiff;
    const cpus = os.cpus().length;
    const totalMs = elapsedMs * 1000 * cpus;
    
    if (totalMs === 0) return '0%';
    const percent = Math.min(100, Math.max(0, (totalCpuTime / totalMs) * 100));
    return percent.toFixed(0) + '%';
  }

  getStatsReport(cacheSize, queueStatus) {
    const totalRequests = this.hits + this.misses;
    const hitRatePercent = totalRequests > 0 ? Math.round((this.hits / totalRequests) * 100) : 0;
    const averageWaitSec = this.totalWaitCount > 0 ? (this.totalWaitTimeMs / this.totalWaitCount / 1000).toFixed(1) : '0.0';
    const memoryMB = Math.round(process.memoryUsage().rss / (1024 * 1024)) + 'MB';

    return {
      cache: {
        hits: this.hits,
        misses: this.misses,
        hitRate: `${hitRatePercent}%`,
        size: cacheSize
      },
      queue: {
        running: queueStatus.running,
        waiting: queueStatus.waiting,
        averageWait: `${averageWaitSec}s`,
        rejections: this.queueRejections,
        timeouts: this.queueTimeouts
      },
      execution: {
        accepted: this.verdicts.accepted,
        wrongAnswer: this.verdicts.wrongAnswer,
        compilationErrors: this.verdicts.compilationErrors,
        runtimeErrors: this.verdicts.runtimeErrors,
        timeouts: this.verdicts.timeouts
      },
      system: {
        uptime: this.getUptimeString(),
        memory: memoryMB,
        cpu: this.getCpuUsagePercent()
      }
    };
  }
}

module.exports = new StatsService();
