import { createSessionStore } from './sessionStore.ts'

export const sessionStore = createSessionStore({
  now: () => Date.now(),
  storage: typeof localStorage === 'undefined' ? undefined : localStorage,
})
