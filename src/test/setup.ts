import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(cleanup)

// The `node` test environment has no `localStorage`, which zustand's persist
// middleware (src/state/store.ts) needs to hydrate/save. Without this, every
// store mutation logs "[zustand persist middleware] Unable to update item…".
if (typeof localStorage === 'undefined') {
  const data = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
    clear: () => data.clear(),
    key: (index) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size
    },
  } satisfies Storage
}
