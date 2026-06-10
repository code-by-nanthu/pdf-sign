<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'
import type {
  PdfSignOptions,
  FieldDef,
  SignerDef,
  PdfTemplate,
  SigningResult,
  ThemeTokens,
  AuditEntry,
} from '@pdf-sign/core'
import {
  injectTheme,
  removeTheme,
  overlayToPdf,
  overlayDimensionsToPdf,
  clampToPdfPage,
  DragEngine,
  PdfExporter,
} from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { usePdfSign } from '../composables/usePdfSign.js'
import ToolBar from './ToolBar.vue'
import PdfViewer from './PdfViewer.vue'
import FieldPalette from './FieldPalette.vue'
import SignatureModal from './SignatureModal.vue'

// ── Props ─────────────────────────────────────────────────────────────────

interface Props {
  pdf?: PdfSignOptions['pdf']
  mode?: PdfSignOptions['mode']
  template?: PdfTemplate
  signerId?: string
  signers?: SignerDef[]
  theme?: Partial<ThemeTokens>
  includeAuditPage?: boolean
  snapGrid?: number
}

const props = withDefaults(defineProps<Props>(), {
  pdf: null,
  mode: 'prepare',
  includeAuditPage: true,
  snapGrid: 0,
})

// ── Emits ─────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'template-ready': [template: PdfTemplate]
  'fields-changed': [fields: FieldDef[]]
  'signing-complete': [result: SigningResult]
  'declined': [payload: { signerId: string; reason: string; timestamp: string }]
  'export-ready': [payload: { pdfBytes: Uint8Array; filename: string }]
  'error': [payload: { message: string; cause?: unknown }]
}>()

// ── Root element ref (for theme injection) ────────────────────────────────

const rootEl = ref<HTMLElement | null>(null)

watch(
  () => props.theme,
  (theme) => {
    if (!rootEl.value) return
    if (theme) injectTheme(rootEl.value, theme)
    else removeTheme(rootEl.value)
  },
  { immediate: false, deep: true },
)

onMounted(() => {
  if (rootEl.value && props.theme) injectTheme(rootEl.value, props.theme)
})

onUnmounted(() => {
  if (rootEl.value) removeTheme(rootEl.value)
})

// ── Core controller ───────────────────────────────────────────────────────

const {
  fields,
  signers: controllerSigners,
  pageCount,
  canUndo,
  canRedo,
  isLoading,
  hasError,
  signingProgress,
  load,
  setPageCount,
  startEditing,
  addField,
  updateField,
  moveField,
  deleteField,
  undo,
  redo,
  buildTemplate,
  completeField,
  pendingFields,
  decline,
  submit,
  controller,
} = usePdfSign({
  mode: props.mode,
  pdf: props.pdf,
  includeAuditPage: props.includeAuditPage,
  ...(props.template !== undefined && { template: props.template }),
  ...(props.signerId !== undefined && { signerId: props.signerId }),
  ...(props.signers !== undefined && { signers: props.signers }),
})

// Wire controller events to component emits
onMounted(() => {
  controller.events.on('fields-changed', ({ fields: f }) => emit('fields-changed', f))
  controller.events.on('template-ready', ({ template }) => emit('template-ready', template))
  controller.events.on('signing-complete', (result) => emit('signing-complete', result))
  controller.events.on('declined', (payload) => emit('declined', payload))
  controller.events.on('export-ready', (payload) => emit('export-ready', payload))
  controller.events.on('error', (payload) => emit('error', payload))
})

// ── Local UI state ────────────────────────────────────────────────────────

const currentPage = ref(0)
const selectedFieldId = ref<string | null>(null)
const currentViewport = ref<RenderPageResult['viewport'] | null>(null)
const activeSignerIdForPalette = ref<string | null>(
  props.signers?.[0]?.id ?? 'signer-1',
)
const viewerRef = ref<InstanceType<typeof PdfViewer> | null>(null)
const showSignatureModal = ref(false)
const pendingSignatureFieldId = ref<string | null>(null)
const completedFieldIds = ref<string[]>([])

const displaySigners = computed(() => controllerSigners.value)

// ── Drag engine ───────────────────────────────────────────────────────────

const dragEngine = new DragEngine({ gridSize: props.snapGrid })

onUnmounted(() => dragEngine.destroy())

dragEngine.on('palette-drop', ({ fieldTypeId, overlayX, overlayY, page }) => {
  if (!currentViewport.value) return

  const DEFAULT_FIELD_SIZES: Record<string, { w: number; h: number }> = {
    signature: { w: 180, h: 60 },
    initials:  { w: 80,  h: 40 },
    stamp:     { w: 100, h: 100 },
    checkbox:  { w: 20,  h: 20 },
    radio:     { w: 16,  h: 16 },
    default:   { w: 150, h: 36 },
  }
  const { w: defaultW, h: defaultH } =
    DEFAULT_FIELD_SIZES[fieldTypeId] ?? DEFAULT_FIELD_SIZES['default']!

  const vp = currentViewport.value
  const halfWPx = (defaultW / vp.pdfNaturalWidth) * vp.cssWidth / 2
  const halfHPx = (defaultH / vp.pdfNaturalHeight) * vp.cssHeight / 2

  const topLeftPdf = overlayToPdf(overlayX - halfWPx, overlayY - halfHPx, page, vp)
  const { width, height } = overlayDimensionsToPdf(defaultW, defaultH, vp)

  const raw = {
    x: topLeftPdf.x,
    y: topLeftPdf.y - height,
    width,
    height,
    page,
  }

  const clamped = clampToPdfPage(raw, vp)

  const field = addField({
    type: fieldTypeId,
    rect: clamped,
    signerId: activeSignerIdForPalette.value,
    required: false,
  })

  selectedFieldId.value = field.id
  startEditing()
})

dragEngine.on('field-move-commit', ({ fieldId, rect }) => {
  if (!currentViewport.value) return
  const vp = currentViewport.value
  const topLeftPdf = overlayToPdf(rect.x, rect.y, rect.page, vp)
  const { width, height } = overlayDimensionsToPdf(rect.width, rect.height, vp)
  const pdfRect = clampToPdfPage(
    { x: topLeftPdf.x, y: topLeftPdf.y - height, width, height, page: rect.page },
    vp,
  )
  moveField(fieldId, pdfRect)
})

dragEngine.on('field-resize-commit', ({ fieldId, rect }) => {
  if (!currentViewport.value) return
  const vp = currentViewport.value
  const topLeftPdf = overlayToPdf(rect.x, rect.y, rect.page, vp)
  const { width, height } = overlayDimensionsToPdf(rect.width, rect.height, vp)
  const pdfRect = clampToPdfPage(
    { x: topLeftPdf.x, y: topLeftPdf.y - height, width, height, page: rect.page },
    vp,
  )
  updateField({ id: fieldId, changes: { rect: pdfRect } })
})

// ── PDF loading ───────────────────────────────────────────────────────────

watch(
  () => props.pdf,
  async (pdf) => {
    if (!pdf) return
    await load()
  },
  { immediate: true },
)

function onPageCount(count: number) {
  setPageCount(count)
}

function onViewportReady(viewport: RenderPageResult['viewport']) {
  currentViewport.value = viewport
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent) {
  const meta = e.metaKey || e.ctrlKey

  if (meta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  } else if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    redo()
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedFieldId.value && props.mode === 'prepare') {
      e.preventDefault()
      deleteField(selectedFieldId.value)
      selectedFieldId.value = null
    }
  } else if (e.key === 'ArrowLeft') {
    if (currentPage.value > 0) currentPage.value--
  } else if (e.key === 'ArrowRight') {
    if (currentPage.value < pageCount.value - 1) currentPage.value++
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// ── Toolbar actions ───────────────────────────────────────────────────────

function onSave() {
  const template = buildTemplate()
  emit('template-ready', template)
}

async function onSubmit() {
  if (!controller.pdfBytes) return

  try {
    const exporter = new PdfExporter()
    const auditTrail = (controller as unknown as { _auditTrail: AuditEntry[] })._auditTrail ?? []
    const partial = {
      template: props.template ?? buildTemplate(),
      completedValues: controller.completedValues,
      auditTrail,
      completedAt: new Date().toISOString(),
    }
    const { pdfBytes } = await exporter.export(
      controller.pdfBytes,
      partial.template,
      partial,
      controller.completedValues,
      { includeAuditPage: props.includeAuditPage },
    )
    await submit(pdfBytes)
  } catch (err) {
    emit('error', {
      message: err instanceof Error ? err.message : String(err),
      cause: err,
    })
  }
}

function onFieldSelect(fieldId: string) {
  if (props.mode === 'prepare') {
    selectedFieldId.value = fieldId
  } else if (props.mode === 'sign') {
    const field = fields.value.find((f) => f.id === fieldId)
    if (!field) return
    if (field.type === 'signature' || field.type === 'initials') {
      pendingSignatureFieldId.value = fieldId
      showSignatureModal.value = true
    }
  }
}

function onFieldDelete(fieldId: string) {
  deleteField(fieldId)
  if (selectedFieldId.value === fieldId) selectedFieldId.value = null
}

function onSignatureConfirm(dataUrl: string) {
  if (!pendingSignatureFieldId.value) return
  completeField(pendingSignatureFieldId.value, dataUrl)
  completedFieldIds.value = [...completedFieldIds.value, pendingSignatureFieldId.value]
  showSignatureModal.value = false
  pendingSignatureFieldId.value = null
}

function onDecline() {
  decline()
  emit('declined', {
    signerId: controller.activeSigner?.id ?? '',
    reason: '',
    timestamp: new Date().toISOString(),
  })
}
</script>

<template>
  <div
    ref="rootEl"
    class="pdf-sign-root flex h-full w-full flex-col overflow-hidden"
    data-pdf-sign
  >
    <!-- Toolbar -->
    <ToolBar
      :current-page="currentPage"
      :total-pages="pageCount"
      :scale="viewerRef?.currentScale ?? 1"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :is-rendering="viewerRef?.isRendering ?? false"
      :mode="props.mode"
      :signers="displaySigners"
      :active-signer-id="activeSignerIdForPalette"
      @prev-page="currentPage = Math.max(0, currentPage - 1)"
      @next-page="currentPage = Math.min(pageCount - 1, currentPage + 1)"
      @zoom-in="viewerRef?.zoomIn()"
      @zoom-out="viewerRef?.zoomOut()"
      @fit-width="viewerRef?.fitWidth()"
      @undo="undo"
      @redo="redo"
      @save="onSave"
      @submit="onSubmit"
    >
      <template #extra>
        <slot name="toolbar-extra" />
      </template>
    </ToolBar>

    <!-- Main body -->
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- Palette (prepare mode only) -->
      <FieldPalette
        v-if="mode === 'prepare'"
        :signers="displaySigners"
        :active-signer-id="activeSignerIdForPalette"
        :drag-engine="dragEngine"
        @signer-change="(id) => { activeSignerIdForPalette = id }"
      />

      <!-- PDF viewer + overlay -->
      <PdfViewer
        ref="viewerRef"
        :pdf-bytes="controller.pdfBytes"
        :current-page="currentPage"
        :fields="fields"
        :signers="displaySigners"
        :drag-engine="dragEngine"
        :selected-field-id="selectedFieldId"
        :mode="props.mode"
        :completed-field-ids="completedFieldIds"
        @page-count="onPageCount"
        @viewport-ready="onViewportReady"
        @field-select="onFieldSelect"
        @field-delete="onFieldDelete"
        @zoom-change="(_s) => {}"
      />

      <!-- Sign-mode side panel -->
      <div
        v-if="mode === 'sign'"
        class="
          flex w-60 shrink-0 flex-col border-l
          border-[var(--psign-border)]
          bg-[var(--psign-palette-bg)]
          p-4
        "
      >
        <div class="mb-4">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-medium text-[var(--psign-text)]">Progress</span>
            <span class="text-xs text-[var(--psign-text-muted)]">
              {{ Math.round(signingProgress * 100) }}%
            </span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--psign-border)]">
            <div
              class="h-full rounded-full bg-[var(--psign-primary)] transition-all duration-300"
              :style="{ width: `${signingProgress * 100}%` }"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--psign-text-muted)]">
            Fields to complete
          </p>
          <div
            v-for="field in pendingFields()"
            :key="field.id"
            :class="[
              'mb-1 rounded-[var(--psign-radius-sm)] border px-3 py-2 text-xs',
              'border-[var(--psign-border)]',
              'bg-[var(--psign-surface)]',
              field.required
                ? 'border-l-2 border-l-[var(--psign-danger)]'
                : '',
              'cursor-pointer transition-colors hover:bg-[var(--psign-surface-raised)]',
            ]"
            @click="currentPage = field.rect.page; onFieldSelect(field.id)"
          >
            <span class="font-medium text-[var(--psign-text)]">{{ field.label }}</span>
            <span v-if="field.required" class="ml-1 text-[var(--psign-danger)]">*</span>
            <span class="ml-1 text-[var(--psign-text-muted)]">p.{{ field.rect.page + 1 }}</span>
          </div>
          <p
            v-if="pendingFields().length === 0"
            class="text-xs text-[var(--psign-success)]"
          >
            All fields complete ✓
          </p>
        </div>

        <button
          class="
            mt-4 rounded-[var(--psign-radius-sm)] border
            border-[var(--psign-border)]
            py-2 text-xs
            text-[var(--psign-danger)]
            transition-colors
            hover:bg-[var(--psign-field-required)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]
          "
          @click="onDecline"
        >
          Decline to sign
        </button>
      </div>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-[var(--psign-overlay)]"
      :style="{ zIndex: 200 }"
    >
      <div class="flex flex-col items-center gap-3">
        <svg class="h-8 w-8 animate-spin text-[var(--psign-primary)]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p class="text-sm font-medium text-[var(--psign-surface)]">Loading document…</p>
      </div>
    </div>

    <!-- Error overlay -->
    <div
      v-if="hasError"
      class="absolute inset-0 flex items-center justify-center bg-[var(--psign-canvas-bg)]"
    >
      <div class="max-w-sm text-center">
        <p class="mb-1 font-medium text-[var(--psign-danger)]">Failed to load document</p>
        <p class="text-sm text-[var(--psign-text-muted)]">
          Check that the file is a valid PDF and try again.
        </p>
      </div>
    </div>

    <!-- Signature modal -->
    <SignatureModal
      :open="showSignatureModal"
      @confirm="onSignatureConfirm"
      @cancel="showSignatureModal = false; pendingSignatureFieldId = null"
    />

    <slot />
  </div>
</template>
