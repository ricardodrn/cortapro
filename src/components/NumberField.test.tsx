// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NumberField from './NumberField.tsx'

const setup = (props: Partial<Parameters<typeof NumberField>[0]> = {}) => {
  const onCommit = vi.fn()
  render(<NumberField value={100} onCommit={onCommit} aria-label="field" {...props} />)
  return { onCommit, input: screen.getByLabelText('field') }
}

describe('NumberField', () => {
  it('commits the parsed number on each edit', async () => {
    const user = userEvent.setup()
    const { onCommit, input } = setup()
    await user.clear(input)
    await user.type(input, '580.5')
    expect(onCommit).toHaveBeenLastCalledWith(580.5)
  })

  it('commits 0 for empty or unparseable text', async () => {
    const user = userEvent.setup()
    const { onCommit, input } = setup()
    await user.clear(input)
    expect(onCommit).toHaveBeenLastCalledWith(0)
    await user.type(input, 'abc')
    expect(onCommit).toHaveBeenLastCalledWith(0)
  })

  it('truncates to an integer when integer is set', async () => {
    const user = userEvent.setup()
    const { onCommit, input } = setup({ integer: true })
    await user.clear(input)
    await user.type(input, '12.9')
    expect(onCommit).toHaveBeenLastCalledWith(12)
  })

  it('resets mid-edit text to the committed value on blur', async () => {
    const user = userEvent.setup()
    const { input } = setup()
    await user.clear(input)
    await user.type(input, '42x')
    expect(input).toHaveValue('42x')
    fireEvent.blur(input)
    expect(input).toHaveValue('100')
  })

  it('renders 0 as empty when zeroAsEmpty is set', () => {
    const { input } = setup({ value: 0, zeroAsEmpty: true })
    expect(input).toHaveValue('')
  })

  it('marks the field invalid and exposes the error as title', () => {
    const { input } = setup({ error: 'Width must be a positive number' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('title', 'Width must be a positive number')
  })

  it('is not marked invalid without an error', () => {
    const { input } = setup()
    expect(input).not.toHaveAttribute('aria-invalid')
  })
})
