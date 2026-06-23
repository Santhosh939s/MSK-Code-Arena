const { v4: uuidv4 } = require('uuid');

/**
 * In-memory store: problemId -> problem data
 * Auto-expires entries after 2 hours.
 */
const store = new Map();
const EXPIRY_MS = 2 * 60 * 60 * 1000;

// Cleanup interval every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now - val.createdAt > EXPIRY_MS) store.delete(key);
  }
}, 30 * 60 * 1000);

module.exports = {
  set(id, data) {
    store.set(id, { ...data, createdAt: Date.now() });
  },
  get(id) {
    return store.get(id);
  },
  has(id) {
    return store.has(id);
  },
  generateId() {
    return uuidv4();
  },
};
