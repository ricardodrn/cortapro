// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../i18n/index.ts'
import { useAppStore } from '../state/store.ts'
import { resetStore } from '../test/storeUtils.ts'
import PanelForm from './PanelForm.tsx'

beforeEach(resetStore)

const renderForm = (issues = {}) => render(<PanelForm issues={issues} />)

describe('PanelForm', () => {
  it('reflects the current panel, kerf and packer values', () => {
    useAppStore.setState({
      panel: { width: 2300, height: 1800, material: 'MDF', thickness: 18 },
      kerf: 3,
      packer: 'guillotine',
    })
    renderForm()
    expect(screen.getByLabelText('Panel width in mm')).toHaveValue('2300')
    expect(screen.getByLabelText('Panel height in mm')).toHaveValue('1800')
    expect(screen.getByDisplayValue('MDF')).toBeInTheDocument()
    expect(screen.getByLabelText('Panel thickness in mm')).toHaveValue('18')
    expect(screen.getByLabelText('Saw kerf in mm')).toHaveValue('3')
    expect(screen.getByRole('combobox')).toHaveValue('guillotine')
  })

  it('updates panel width and height', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.clear(screen.getByLabelText('Panel width in mm'))
    await user.type(screen.getByLabelText('Panel width in mm'), '2500')
    await user.clear(screen.getByLabelText('Panel height in mm'))
    await user.type(screen.getByLabelText('Panel height in mm'), '1900')
    expect(useAppStore.getState().panel.width).toBe(2500)
    expect(useAppStore.getState().panel.height).toBe(1900)
  })

  it('sets material to undefined when cleared', async () => {
    const user = userEvent.setup()
    useAppStore.setState({ panel: { width: 2300, height: 1800, material: 'MDF' } })
    renderForm()
    const materialInput = screen.getByDisplayValue('MDF')
    await user.clear(materialInput)
    expect(useAppStore.getState().panel.material).toBeUndefined()
  })

  it('treats a zero/blank thickness as undefined, positive as set', async () => {
    const user = userEvent.setup()
    renderForm()
    const thickness = screen.getByLabelText('Panel thickness in mm')
    expect(thickness).toHaveValue('') // zeroAsEmpty
    await user.type(thickness, '18')
    expect(useAppStore.getState().panel.thickness).toBe(18)
    await user.clear(thickness)
    expect(useAppStore.getState().panel.thickness).toBeUndefined()
  })

  it('updates kerf', async () => {
    const user = userEvent.setup()
    renderForm()
    const kerf = screen.getByLabelText('Saw kerf in mm')
    await user.clear(kerf)
    await user.type(kerf, '4')
    expect(useAppStore.getState().kerf).toBe(4)
  })

  it('changes the packing algorithm', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.selectOptions(screen.getByRole('combobox'), 'maxrects')
    expect(useAppStore.getState().packer).toBe('maxrects')
  })

  it('marks fields invalid and shows the error as title', () => {
    renderForm({
      width: { key: 'validation.panelWidthPositive' },
      height: { key: 'validation.panelHeightPositive' },
    })
    expect(screen.getByLabelText('Panel width in mm')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Panel width in mm')).toHaveAttribute(
      'title',
      'Width must be a positive number',
    )
    expect(screen.getByLabelText('Panel height in mm')).toHaveAttribute('aria-invalid', 'true')
  })
})
