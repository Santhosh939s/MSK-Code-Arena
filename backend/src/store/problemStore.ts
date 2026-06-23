import { StoredProblem } from '../types';

// In-memory store — data lives for the lifetime of the server process
const store = new Map<string, StoredProblem>();

// Auto-cleanup: remove entries older than 2 hours
const EXPIRY_MS = 2 * 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now - value.createdAt.getTime() > EXPIRY_MS) {
      store.delete(key);
    }
  }
}, 15 * 60 * 1000); // run cleanup every 15 min

export const problemStore = {
  set(id: string, problem: StoredProblem): void {
    store.set(id, problem);
  },

  get(id: string): StoredProblem | undefined {
    return store.get(id);
  },

  has(id: string): boolean {
    return store.has(id);
  },

  size(): number {
    return store.size;
  },
};
