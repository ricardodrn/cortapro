// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n, { setLanguage } from '../i18n/index.ts'
import LanguageSwitcher from './LanguageSwitcher.tsx'

afterEach(() => setLanguage('en'))

describe('LanguageSwitcher', () => {
  it('offers the supported languages', () => {
    render(<LanguageSwitcher />)
    const select = screen.getByLabelText('Language')
    expect(select).toHaveValue('en')
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Spanish' })).toBeInTheDocument()
  })

  it('switches the language and persists the choice', async () => {
    const user = userEvent.setup()
    render(<LanguageSwitcher />)
    await user.selectOptions(screen.getByLabelText('Language'), 'es')
    expect(i18n.language).toBe('es')
    expect(localStorage.getItem('cortapro-lang')).toBe('es')
    // The switcher itself re-renders in the new language.
    expect(screen.getByLabelText('Idioma')).toHaveValue('es')
  })
})
