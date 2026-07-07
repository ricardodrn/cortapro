/**
 * A translatable message produced by pure core logic (validation, CSV, project
 * parsing). Core stays free of any i18n dependency: it only names a translation
 * `key` and the `values` to interpolate. The React layer turns it into text via
 * `t(msg.key, msg.values)` — see `useMsg` in `src/i18n/useMsg.ts`.
 */
export interface TransMsg {
  key: string
  values?: Record<string, string | number>
}

/** Small helper so producers read as `msg('key', { ... })`. */
export function msg(key: string, values?: Record<string, string | number>): TransMsg {
  return values ? { key, values } : { key }
}
