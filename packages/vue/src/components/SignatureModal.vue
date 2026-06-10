<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
} from 'vue'

interface Props {
  open: boolean
  /** Aspect ratio of the target signature field (width / height). Default: 3.5 */
  fieldAspectRatio?: number
}

const props = withDefaults(defineProps<Props>(), {
  fieldAspectRatio: 3.5,
})

const emit = defineEmits<{
  confirm: [dataUrl: string]
  cancel: []
}>()

// ── Tab state ──────────────────────────────────────────────────────────────

type Tab = 'draw' | 'type' | 'upload'
const activeTab = ref<Tab>('draw')

// ── Draw tab ───────────────────────────────────────────────────────────────

const canvasEl = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const hasDrawnStrokes = ref(false)
const inkColour = ref('#1e293b')
const strokeWeight = ref(2)

// Device pixel ratio — resolved once in script scope (not available as template global)
const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1

const INK_COLOURS = [
  { value: '#1e293b', label: 'Black' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#991b1b', label: 'Red' },
]

let points: Array<{ x: number; y: number }> = []

function getCtx(): CanvasRenderingContext2D | null {
  return canvasEl.value?.getContext('2d') ?? null
}

function initCanvas() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = getCtx()
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#cbd5e1'
  for (let x = 12; x < canvas.width; x += 20) {
    for (let y = 12; y < canvas.height; y += 20) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  hasDrawnStrokes.value = false
}

function canvasPoint(e: PointerEvent): { x: number; y: number } {
  const canvas = canvasEl.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left) * devicePixelRatio,
    y: (e.clientY - rect.top) * devicePixelRatio,
  }
}

function onDrawPointerDown(e: PointerEvent) {
  if (!canvasEl.value) return
  e.preventDefault()
  canvasEl.value.setPointerCapture(e.pointerId)
  isDrawing.value = true
  const pt = canvasPoint(e)
  points = [pt]
  const ctx = getCtx()!
  ctx.beginPath()
  ctx.moveTo(pt.x, pt.y)
}

function onDrawPointerMove(e: PointerEvent) {
  if (!isDrawing.value || !canvasEl.value) return
  e.preventDefault()
  const pt = canvasPoint(e)
  points.push(pt)
  hasDrawnStrokes.value = true

  const ctx = getCtx()!
  ctx.strokeStyle = inkColour.value
  ctx.lineWidth = strokeWeight.value * devicePixelRatio
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (points.length < 3) {
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    return
  }

  const len = points.length
  const p0 = points[len - 3]!
  const p1 = points[len - 2]!
  const p2 = points[len - 1]!
  const cp1x = (p0.x + p1.x) / 2
  const cp1y = (p0.y + p1.y) / 2
  const cp2x = (p1.x + p2.x) / 2
  const cp2y = (p1.y + p2.y) / 2

  ctx.beginPath()
  ctx.moveTo(cp1x, cp1y)
  ctx.quadraticCurveTo(p1.x, p1.y, cp2x, cp2y)
  ctx.stroke()
}

function onDrawPointerUp() {
  isDrawing.value = false
  points = []
}

function clearCanvas() {
  initCanvas()
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      activeTab.value = 'draw'
      typedName.value = ''
      selectedFont.value = SIGNATURE_FONTS[0]!.family
      uploadDataUrl.value = null
      hasDrawnStrokes.value = false
      await nextTick()
      initCanvas()
      loadFonts()
    }
  },
)

onMounted(async () => {
  if (props.open) {
    await nextTick()
    initCanvas()
  }
})

watch(activeTab, async (tab) => {
  if (tab === 'draw') {
    await nextTick()
    initCanvas()
  }
})

// ── Type tab ───────────────────────────────────────────────────────────────

const typedName = ref('')
const selectedFont = ref('')
const fontsLoaded = ref(false)

interface SignatureFont {
  family: string
  label: string
  googleName: string
}

const SIGNATURE_FONTS: SignatureFont[] = [
  { family: 'Dancing Script',  label: 'Dancing Script',  googleName: 'Dancing+Script:wght@700' },
  { family: 'Pinyon Script',   label: 'Pinyon Script',   googleName: 'Pinyon+Script' },
  { family: 'Great Vibes',     label: 'Great Vibes',     googleName: 'Great+Vibes' },
  { family: 'Sacramento',      label: 'Sacramento',      googleName: 'Sacramento' },
  { family: 'Pacifico',        label: 'Pacifico',        googleName: 'Pacifico' },
]

selectedFont.value = SIGNATURE_FONTS[0]!.family

async function loadFonts() {
  if (fontsLoaded.value || typeof document === 'undefined') return
  const families = SIGNATURE_FONTS.map((f) => f.googleName).join('&family=')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
  document.head.appendChild(link)
  await document.fonts.ready
  fontsLoaded.value = true
}

function renderTypedSignature(): string {
  const canvas = document.createElement('canvas')
  const W = 500
  const H = Math.round(W / props.fieldAspectRatio)
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  const fontSize = Math.min(H * 0.65, 72)
  ctx.font = `${fontSize}px '${selectedFont.value}', cursive`
  ctx.fillStyle = inkColour.value
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(typedName.value, W / 2, H / 2)

  return canvas.toDataURL('image/png')
}

// ── Upload tab ─────────────────────────────────────────────────────────────

const uploadDataUrl = ref<string | null>(null)
const isDragOver = ref(false)
const fileInputEl = ref<HTMLInputElement | null>(null)

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadDataUrl.value = await readFile(file)
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  const file = e.dataTransfer?.files[0]
  if (!file || !file.type.startsWith('image/')) return
  uploadDataUrl.value = await readFile(file)
}

function clearUpload() {
  uploadDataUrl.value = null
  if (fileInputEl.value) fileInputEl.value.value = ''
}

// ── Confirm / cancel ───────────────────────────────────────────────────────

const canConfirm = computed(() => {
  if (activeTab.value === 'draw') return hasDrawnStrokes.value
  if (activeTab.value === 'type') return typedName.value.trim().length > 0
  if (activeTab.value === 'upload') return uploadDataUrl.value !== null
  return false
})

function confirm() {
  if (!canConfirm.value) return

  let dataUrl = ''

  if (activeTab.value === 'draw') {
    const canvas = canvasEl.value!
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const exportCtx = exportCanvas.getContext('2d')!
    exportCtx.fillStyle = '#ffffff'
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    exportCtx.drawImage(canvas, 0, 0)
    dataUrl = exportCanvas.toDataURL('image/png')
  } else if (activeTab.value === 'type') {
    dataUrl = renderTypedSignature()
  } else if (activeTab.value === 'upload' && uploadDataUrl.value) {
    dataUrl = uploadDataUrl.value
  }

  if (dataUrl) emit('confirm', dataUrl)
}

function cancel() {
  emit('cancel')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') cancel()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="
          fixed inset-0 z-50 flex items-center justify-center p-4
          bg-[var(--psign-overlay)]
        "
        role="dialog"
        aria-modal="true"
        aria-label="Add your signature"
        @keydown="onKeydown"
        @click.self="cancel"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="open"
            class="
              w-full max-w-lg overflow-hidden
              rounded-[var(--psign-radius-lg)]
              bg-[var(--psign-surface)]
            "
            style="box-shadow: 0 20px 60px rgba(0,0,0,0.25)"
          >
            <!-- Header -->
            <div
              class="
                flex items-center justify-between border-b
                border-[var(--psign-border)]
                px-5 py-4
              "
            >
              <h2 class="text-sm font-semibold text-[var(--psign-text)]">
                Add your signature
              </h2>
              <button
                class="
                  flex h-7 w-7 items-center justify-center
                  rounded-[var(--psign-radius-sm)]
                  text-[var(--psign-text-muted)]
                  hover:bg-[var(--psign-surface-raised)]
                  transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]
                "
                aria-label="Close"
                @click="cancel"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" d="M3 3 L13 13 M13 3 L3 13" />
                </svg>
              </button>
            </div>

            <!-- Tab switcher -->
            <div
              class="
                flex gap-1 border-b
                border-[var(--psign-border)]
                px-5 py-3
              "
            >
              <button
                v-for="tab in (['draw', 'type', 'upload'] as Tab[])"
                :key="tab"
                :class="[
                  'rounded-full px-3.5 py-1 text-xs font-medium transition-colors capitalize',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
                  activeTab === tab
                    ? 'bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]'
                    : 'text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)]',
                ]"
                @click="activeTab = tab"
              >
                {{ tab }}
              </button>
            </div>

            <!-- Tab content -->
            <div class="px-5 py-4">

              <!-- Draw tab -->
              <div v-if="activeTab === 'draw'">
                <div
                  class="
                    overflow-hidden rounded-[var(--psign-radius)]
                    border border-[var(--psign-border)]
                    cursor-crosshair
                  "
                  :style="{ aspectRatio: fieldAspectRatio }"
                >
                  <canvas
                    ref="canvasEl"
                    class="block h-full w-full touch-none"
                    :width="500 * devicePixelRatio"
                    :height="Math.round(500 / fieldAspectRatio!) * devicePixelRatio"
                    style="width: 100%; height: 100%;"
                    @pointerdown="onDrawPointerDown"
                    @pointermove="onDrawPointerMove"
                    @pointerup="onDrawPointerUp"
                    @pointercancel="onDrawPointerUp"
                  />
                </div>

                <div class="mt-3 flex items-center gap-4">
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs text-[var(--psign-text-muted)]">Ink</span>
                    <button
                      v-for="colour in INK_COLOURS"
                      :key="colour.value"
                      :title="colour.label"
                      :class="[
                        'h-5 w-5 rounded-full border-2 transition-all',
                        inkColour === colour.value
                          ? 'border-[var(--psign-primary)] scale-110'
                          : 'border-transparent hover:scale-105',
                      ]"
                      :style="{ backgroundColor: colour.value }"
                      @click="inkColour = colour.value"
                    />
                  </div>

                  <div class="flex flex-1 items-center gap-2">
                    <span class="text-xs text-[var(--psign-text-muted)]">Weight</span>
                    <input
                      v-model.number="strokeWeight"
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      class="
                        h-1.5 flex-1 appearance-none rounded-full
                        bg-[var(--psign-border)]
                        accent-[var(--psign-primary)]
                        cursor-pointer
                      "
                    />
                    <span class="w-4 text-right text-xs text-[var(--psign-text-muted)]">
                      {{ strokeWeight }}
                    </span>
                  </div>

                  <button
                    class="
                      text-xs text-[var(--psign-text-muted)]
                      hover:text-[var(--psign-danger)]
                      transition-colors
                      focus-visible:outline-none
                    "
                    @click="clearCanvas"
                  >
                    Clear
                  </button>
                </div>

                <p
                  v-if="!hasDrawnStrokes"
                  class="mt-2 text-center text-xs text-[var(--psign-text-muted)]"
                >
                  Draw your signature above
                </p>
              </div>

              <!-- Type tab -->
              <div v-else-if="activeTab === 'type'">
                <input
                  v-model="typedName"
                  type="text"
                  placeholder="Type your full name"
                  class="
                    w-full rounded-[var(--psign-radius-sm)] border
                    border-[var(--psign-border)]
                    bg-[var(--psign-surface)]
                    px-3 py-2 text-sm
                    text-[var(--psign-text)]
                    placeholder:text-[var(--psign-text-muted)]
                    focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]
                  "
                  maxlength="80"
                  autofocus
                />

                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button
                    v-for="font in SIGNATURE_FONTS"
                    :key="font.family"
                    :class="[
                      'relative overflow-hidden rounded-[var(--psign-radius-sm)] border px-3',
                      'transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
                      selectedFont === font.family
                        ? 'border-[var(--psign-primary)] bg-[var(--psign-field-active)]'
                        : 'border-[var(--psign-border)] hover:border-[var(--psign-primary)]',
                    ]"
                    style="height: 56px;"
                    @click="selectedFont = font.family"
                  >
                    <span
                      class="block truncate text-[var(--psign-sig-ink)]"
                      :style="{
                        fontFamily: `'${font.family}', cursive`,
                        fontSize: '24px',
                        lineHeight: '56px',
                      }"
                    >
                      {{ typedName || font.label }}
                    </span>
                    <span
                      v-if="selectedFont === font.family"
                      class="
                        absolute right-1.5 top-1.5
                        flex h-4 w-4 items-center justify-center
                        rounded-full
                        bg-[var(--psign-primary)]
                        text-[var(--psign-primary-fg)]
                      "
                    >
                      <svg class="h-2.5 w-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M1.5 5 L4 7.5 L8.5 2.5" />
                      </svg>
                    </span>
                  </button>
                </div>

                <p
                  v-if="!fontsLoaded"
                  class="mt-2 text-center text-xs text-[var(--psign-text-muted)]"
                >
                  Loading fonts…
                </p>
              </div>

              <!-- Upload tab -->
              <div v-else-if="activeTab === 'upload'">
                <div
                  v-if="!uploadDataUrl"
                  :class="[
                    'flex flex-col items-center justify-center gap-3 rounded-[var(--psign-radius)]',
                    'border-2 border-dashed py-10 transition-colors',
                    'cursor-pointer',
                    isDragOver
                      ? 'border-[var(--psign-primary)] bg-[var(--psign-field-active)]'
                      : 'border-[var(--psign-border)] hover:border-[var(--psign-primary)]',
                  ]"
                  @click="fileInputEl?.click()"
                  @dragover.prevent="isDragOver = true"
                  @dragleave="isDragOver = false"
                  @drop="handleDrop"
                >
                  <svg
                    class="h-8 w-8 text-[var(--psign-text-muted)]"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div class="text-center">
                    <p class="text-sm font-medium text-[var(--psign-text)]">
                      Drop an image here
                    </p>
                    <p class="text-xs text-[var(--psign-text-muted)]">
                      or click to browse — PNG, JPG, GIF, WebP
                    </p>
                  </div>
                  <input
                    ref="fileInputEl"
                    type="file"
                    accept="image/*"
                    class="sr-only"
                    @change="handleFileInput"
                  />
                </div>

                <div
                  v-else
                  class="relative overflow-hidden rounded-[var(--psign-radius)] border border-[var(--psign-border)]"
                  :style="{ aspectRatio: fieldAspectRatio }"
                >
                  <img
                    :src="uploadDataUrl"
                    alt="Signature preview"
                    class="h-full w-full object-contain"
                  />
                  <button
                    class="
                      absolute right-2 top-2 flex h-6 w-6 items-center justify-center
                      rounded-full
                      bg-[var(--psign-danger)]
                      text-white
                      hover:opacity-90 transition-opacity
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]
                    "
                    title="Remove image"
                    @click="clearUpload"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" d="M2 2 L12 12 M12 2 L2 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div
              class="
                flex items-center justify-end gap-2 border-t
                border-[var(--psign-border)]
                px-5 py-3
              "
            >
              <button
                class="
                  rounded-[var(--psign-radius-sm)] border
                  border-[var(--psign-border)]
                  px-4 py-1.5 text-sm
                  text-[var(--psign-text)]
                  hover:bg-[var(--psign-surface-raised)]
                  transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]
                "
                @click="cancel"
              >
                Cancel
              </button>
              <button
                :disabled="!canConfirm"
                :class="[
                  'rounded-[var(--psign-radius-sm)] px-4 py-1.5 text-sm font-medium transition-colors',
                  'bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]',
                  'hover:bg-[var(--psign-primary-hover)]',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
                ]"
                @click="confirm"
              >
                Apply
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
