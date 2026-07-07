import { useEffect, useRef, useState } from 'react'

interface NumberFieldProps {
  value: number
  onCommit: (value: number) => void
  /** Parse as integer instead of float. */
  integer?: boolean
  /** Render 0 as an empty field (for optional values). */
  zeroAsEmpty?: boolean
  error?: string
  placeholder?: string
  className?: string
  'aria-label'?: string
}

const toText = (value: number, zeroAsEmpty: boolean) =>
  zeroAsEmpty && value === 0 ? '' : String(value)

/**
 * Numeric input that keeps free-form text while focused (so clearing or
 * mid-edit states don't fight the store) and commits parsed numbers upward.
 * Unparseable / empty text commits 0, which validation flags.
 */
export default function NumberField({
  value,
  onCommit,
  integer = false,
  zeroAsEmpty = false,
  error,
  placeholder,
  className = '',
  'aria-label': ariaLabel,
}: NumberFieldProps) {
  const [text, setText] = useState(() => toText(value, zeroAsEmpty))
  const focused = useRef(false)

  useEffect(() => {
    if (!focused.current) setText(toText(value, zeroAsEmpty))
  }, [value, zeroAsEmpty])

  const handleChange = (raw: string) => {
    setText(raw)
    const parsed = integer ? parseInt(raw, 10) : parseFloat(raw)
    onCommit(Number.isFinite(parsed) ? parsed : 0)
  }

  return (
    <input
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={error ? true : undefined}
      title={error}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={() => {
        focused.current = false
        setText(toText(value, zeroAsEmpty))
      }}
      onChange={(e) => handleChange(e.target.value)}
      className={`w-full rounded-md border bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition-colors focus:ring-2 ${
        error
          ? 'border-red-400 focus:ring-red-200'
          : 'border-slate-300 focus:border-sky-400 focus:ring-sky-100'
      } ${className}`}
    />
  )
}
