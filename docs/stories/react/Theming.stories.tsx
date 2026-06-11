import type { Meta, StoryObj } from '@storybook/react'
import { PdfSigner } from '@pdf-sign/react'
import { THEME_PRESETS } from '../shared/theme-presets.js'

function ThemingDemo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, height: '100vh', boxSizing: 'border-box' }}>
      {Object.entries(THEME_PRESETS).map(([name, theme]) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', fontSize: 11, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
            Theme: {name}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PdfSigner mode="prepare" pdf={null} theme={theme} />
          </div>
        </div>
      ))}
    </div>
  )
}

const meta = {
  title: 'React / Theming / All presets',
  component: ThemingDemo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ThemingDemo>

export default meta
type Story = StoryObj<typeof meta>

export const AllPresets: Story = { name: 'All theme presets' }
