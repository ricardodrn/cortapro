import { useTranslation } from 'react-i18next'
import type { TransMsg } from '../core/i18nMsg.ts'

/**
 * Turns core `TransMsg` objects (from validation / CSV / project parsing) into
 * localized strings. Returns a stable translator plus the raw `t` for inline use.
 */
export function useMsg() {
  const { t } = useTranslation()
  const tMsg = (m: TransMsg | undefined): string | undefined =>
    m ? t(m.key, m.values) : undefined
  return { t, tMsg }
}
