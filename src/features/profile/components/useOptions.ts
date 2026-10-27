import { useTranslation } from 'react-i18next'

/** Translate an option list into the shape the design-system Select expects. */
export function useOptions(prefix: string, values: readonly string[], placeholder?: string) {
  const { t } = useTranslation()
  return [
    ...(placeholder ? [{ value: '', label: placeholder }] : []),
    ...values.map((v) => ({ value: v, label: t(`${prefix}${v}`) })),
  ]
}
