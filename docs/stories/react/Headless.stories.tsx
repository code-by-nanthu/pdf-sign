import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { usePdfSign } from '@pdf-sign/react'
import { SAMPLE_PDF_URL } from '../shared/sample-template.js'

function HeadlessDemo() {
  const {
    state,
    fields,
    pageCount,
    isLoading,
    isReady,
    load,
    addField,
    buildTemplate,
  } = usePdfSign({
    mode: 'prepare',
    pdf: SAMPLE_PDF_URL,
  })

  const [log, setLog] = useState<string[]>([])
  const pushLog = (msg: string) => setLog((prev) => [msg, ...prev])

  async function handleLoad() {
    await load(1)
    pushLog(`Loaded — ${pageCount} page(s)`)
  }

  function handleAddField() {
    addField({
      type: 'text',
      rect: { x: 50, y: 700, width: 200, height: 30, page: 0 },
      signerId: null,
      label: `Field ${fields.length + 1}`,
      required: false,
    })
    pushLog(`Added field — total: ${fields.length + 1}`)
  }

  function handleBuildTemplate() {
    try {
      const t = buildTemplate()
      pushLog(`Template built — ${t.fields.length} field(s), hash: ${t.pdfHash.slice(0, 8)}…`)
    } catch (e) {
      pushLog(`Error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 600 }}>
      <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        usePdfSign — headless hook demo (React)
      </h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={handleLoad} disabled={isLoading}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13 }}>
          {isLoading ? 'Loading…' : 'Load PDF'}
        </button>
        <button onClick={handleAddField} disabled={!isReady}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13 }}>
          Add text field
        </button>
        <button onClick={handleBuildTemplate} disabled={!isReady}
          style={{ padding: '6px 14px', borderRadius: 6, background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          Build template
        </button>
      </div>
      <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>State: </span>
        <strong style={{ fontSize: 12 }}>{state}</strong>
        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 16 }}>Fields: </span>
        <strong style={{ fontSize: 12 }}>{fields.length}</strong>
      </div>
      <div style={{ fontSize: 12, color: '#64748b', padding: '10px 14px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', maxHeight: 200, overflowY: 'auto' }}>
        {log.length === 0 && <div style={{ color: '#94a3b8' }}>Events will appear here…</div>}
        {log.map((entry, i) => <div key={i} style={{ marginBottom: 2 }}>{entry}</div>)}
      </div>
    </div>
  )
}

const meta = {
  title: 'React / Headless / usePdfSign',
  component: HeadlessDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'The usePdfSign hook provides the same API as the Vue composable, bridged into React via useSyncExternalStore.',
      },
    },
  },
} satisfies Meta<typeof HeadlessDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { name: 'usePdfSign hook' }
