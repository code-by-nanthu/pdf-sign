import type { Meta, StoryObj } from '@storybook/vue3'
import { defineComponent, ref } from 'vue'
import { usePdfSign } from '@pdf-sign/vue'
import { SAMPLE_PDF_URL } from '../shared/sample-template.js'

const HeadlessDemo = defineComponent({
  name: 'HeadlessDemo',
  setup() {
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

    const log = ref<string[]>([])

    async function handleLoad() {
      await load(1)
      log.value.unshift(`Loaded — ${pageCount.value} page(s)`)
    }

    function handleAddField() {
      addField({
        type: 'text',
        rect: { x: 50, y: 700, width: 200, height: 30, page: 0 },
        signerId: null,
        label: `Field ${fields.value.length + 1}`,
        required: false,
      })
      log.value.unshift(`Added field — total: ${fields.value.length}`)
    }

    function handleBuildTemplate() {
      try {
        const t = buildTemplate()
        log.value.unshift(`Template built — ${t.fields.length} field(s), hash: ${t.pdfHash.slice(0, 8)}…`)
      } catch (e) {
        log.value.unshift(`Error: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    return {
      state, fields, isLoading, isReady, log,
      handleLoad, handleAddField, handleBuildTemplate,
    }
  },
  template: `
    <div style="padding: 24px; font-family: system-ui, sans-serif; max-width: 600px;">
      <h2 style="margin-bottom: 16px; font-size: 16px; font-weight: 600;">
        usePdfSign — headless composable demo
      </h2>
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        <button @click="handleLoad" :disabled="isLoading" style="padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; font-size: 13px;">
          {{ isLoading ? 'Loading…' : 'Load PDF' }}
        </button>
        <button @click="handleAddField" :disabled="!isReady" style="padding: 6px 14px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; font-size: 13px;">
          Add text field
        </button>
        <button @click="handleBuildTemplate" :disabled="!isReady" style="padding: 6px 14px; border-radius: 6px; background: #6366f1; color: white; border: none; cursor: pointer; font-size: 13px;">
          Build template
        </button>
      </div>
      <div style="margin-bottom: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
        <span style="font-size: 12px; color: #64748b;">State: </span>
        <strong style="font-size: 12px;">{{ state }}</strong>
        <span style="font-size: 12px; color: #64748b; margin-left: 16px;">Fields: </span>
        <strong style="font-size: 12px;">{{ fields.length }}</strong>
      </div>
      <div style="font-size: 12px; color: #64748b; padding: 10px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; max-height: 200px; overflow-y: auto;">
        <div v-if="log.length === 0" style="color: #94a3b8;">Events will appear here…</div>
        <div v-for="(entry, i) in log" :key="i" style="margin-bottom: 2px;">{{ entry }}</div>
      </div>
    </div>
  `,
})

const meta = {
  title: 'Vue / Headless / usePdfSign',
  component: HeadlessDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The usePdfSign composable provides full access to the pdf-sign state machine ' +
          'without any UI opinions. Consumers wire it to their own components.',
      },
    },
  },
} satisfies Meta<typeof HeadlessDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'usePdfSign composable',
}
