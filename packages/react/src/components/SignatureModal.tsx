import type * as React from 'react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

interface SignatureModalProps {
  open: boolean
  fieldAspectRatio?: number
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
}

type Tab = 'draw' | 'type' | 'upload'

const INK_COLOURS = [
  { value: '#1e293b', label: 'Black' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#991b1b', label: 'Red' },
]

const SIGNATURE_FONTS = [
  { family: 'Dancing Script',  googleName: 'Dancing+Script:wght@700' },
  { family: 'Pinyon Script',   googleName: 'Pinyon+Script' },
  { family: 'Great Vibes',     googleName: 'Great+Vibes' },
  { family: 'Sacramento',      googleName: 'Sacramento' },
  { family: 'Pacifico',        googleName: 'Pacifico' },
]

export function SignatureModal({
  open,
  fieldAspectRatio = 3.5,
  onConfirm,
  onCancel,
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('draw')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const pointsRef = useRef<Array<{ x: number; y: number }>>([])
  const [hasStrokes, setHasStrokes] = useState(false)
  const [inkColour, setInkColour] = useState('#1e293b')
  const [strokeWeight, setStrokeWeight] = useState(2)
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1

  const [typedName, setTypedName] = useState('')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]!.family)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  const [uploadDataUrl, setUploadDataUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
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
    setHasStrokes(false)
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveTab('draw')
    setTypedName('')
    setSelectedFont(SIGNATURE_FONTS[0]!.family)
    setUploadDataUrl(null)
    setHasStrokes(false)
    setTimeout(initCanvas, 0)
    void loadFonts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (activeTab === 'draw') setTimeout(initCanvas, 0)
  }, [activeTab, initCanvas])

  async function loadFonts() {
    if (fontsLoaded || typeof document === 'undefined') return
    const families = SIGNATURE_FONTS.map((f) => f.googleName).join('&family=')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    document.head.appendChild(link)
    await document.fonts.ready
    setFontsLoaded(true)
  }

  function getCanvasPoint(e: React.PointerEvent): { x: number; y: number } {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    isDrawingRef.current = true
    const pt = getCanvasPoint(e)
    pointsRef.current = [pt]
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y) }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDrawingRef.current) return
    e.preventDefault()
    const pt = getCanvasPoint(e)
    pointsRef.current.push(pt)
    setHasStrokes(true)
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = inkColour
    ctx.lineWidth = strokeWeight * dpr
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const pts = pointsRef.current
    if (pts.length < 3) { ctx.lineTo(pt.x, pt.y); ctx.stroke(); return }
    const p0 = pts[pts.length - 3]!
    const p1 = pts[pts.length - 2]!
    const p2 = pts[pts.length - 1]!
    ctx.beginPath()
    ctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2)
    ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
    ctx.stroke()
  }

  function onPointerUp() {
    isDrawingRef.current = false
    pointsRef.current = []
  }

  function renderTypedSignature(): string {
    const c = document.createElement('canvas')
    const W = 500
    const H = Math.round(W / fieldAspectRatio)
    c.width = W; c.height = H
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    const fs = Math.min(H * 0.65, 72)
    ctx.font = `${fs}px '${selectedFont}', cursive`
    ctx.fillStyle = inkColour
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(typedName, W / 2, H / 2)
    return c.toDataURL('image/png')
  }

  async function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = (e) => resolve(e.target?.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadDataUrl(await readFile(file))
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file?.type.startsWith('image/')) return
    setUploadDataUrl(await readFile(file))
  }

  const canConfirm =
    (activeTab === 'draw' && hasStrokes) ||
    (activeTab === 'type' && typedName.trim().length > 0) ||
    (activeTab === 'upload' && uploadDataUrl !== null)

  function confirm() {
    if (!canConfirm) return
    let dataUrl = ''
    if (activeTab === 'draw' && canvasRef.current) {
      const exp = document.createElement('canvas')
      exp.width = canvasRef.current.width
      exp.height = canvasRef.current.height
      const ctx = exp.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, exp.width, exp.height)
      ctx.drawImage(canvasRef.current, 0, 0)
      dataUrl = exp.toDataURL('image/png')
    } else if (activeTab === 'type') {
      dataUrl = renderTypedSignature()
    } else if (activeTab === 'upload' && uploadDataUrl) {
      dataUrl = uploadDataUrl
    }
    if (dataUrl) onConfirm(dataUrl)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    if (open) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const tabBtn = (tab: Tab) =>
    [
      'rounded-full px-3.5 py-1 text-xs font-medium transition-colors capitalize',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
      activeTab === tab
        ? 'bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]'
        : 'text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)]',
    ].join(' ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--psign-overlay)]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[var(--psign-radius-lg)] bg-[var(--psign-surface)]"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--psign-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--psign-text)]">Add your signature</h2>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-[var(--psign-radius-sm)] text-[var(--psign-text-muted)] hover:bg-[var(--psign-surface-raised)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
            onClick={onCancel}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M3 3 L13 13 M13 3 L3 13" />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 border-b border-[var(--psign-border)] px-5 py-3">
          {(['draw', 'type', 'upload'] as Tab[]).map((tab) => (
            <button key={tab} className={tabBtn(tab)} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <div className="px-5 py-4">
          {activeTab === 'draw' && (
            <div>
              <div
                className="overflow-hidden rounded-[var(--psign-radius)] border border-[var(--psign-border)] cursor-crosshair"
                style={{ aspectRatio: fieldAspectRatio }}
              >
                <canvas
                  ref={canvasRef}
                  className="block h-full w-full touch-none"
                  width={500 * dpr}
                  height={Math.round(500 / fieldAspectRatio) * dpr}
                  style={{ width: '100%', height: '100%' }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--psign-text-muted)]">Ink</span>
                  {INK_COLOURS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      className={['h-5 w-5 rounded-full border-2 transition-all', inkColour === c.value ? 'border-[var(--psign-primary)] scale-110' : 'border-transparent hover:scale-105'].join(' ')}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setInkColour(c.value)}
                    />
                  ))}
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-xs text-[var(--psign-text-muted)]">Weight</span>
                  <input
                    type="range" min={1} max={5} step={0.5}
                    value={strokeWeight}
                    onChange={(e) => setStrokeWeight(Number(e.target.value))}
                    className="h-1.5 flex-1 appearance-none rounded-full bg-[var(--psign-border)] accent-[var(--psign-primary)] cursor-pointer"
                  />
                </div>
                <button
                  className="text-xs text-[var(--psign-text-muted)] hover:text-[var(--psign-danger)] transition-colors"
                  onClick={initCanvas}
                >
                  Clear
                </button>
              </div>
              {!hasStrokes && (
                <p className="mt-2 text-center text-xs text-[var(--psign-text-muted)]">
                  Draw your signature above
                </p>
              )}
            </div>
          )}

          {activeTab === 'type' && (
            <div>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your full name"
                maxLength={80}
                autoFocus
                className="w-full rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] bg-[var(--psign-surface)] px-3 py-2 text-sm text-[var(--psign-text)] placeholder:text-[var(--psign-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--psign-focus-ring)]"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SIGNATURE_FONTS.map((font) => (
                  <button
                    key={font.family}
                    className={[
                      'relative overflow-hidden rounded-[var(--psign-radius-sm)] border px-3 transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]',
                      selectedFont === font.family
                        ? 'border-[var(--psign-primary)] bg-[var(--psign-field-active)]'
                        : 'border-[var(--psign-border)] hover:border-[var(--psign-primary)]',
                    ].join(' ')}
                    style={{ height: 56 }}
                    onClick={() => setSelectedFont(font.family)}
                  >
                    <span
                      className="block truncate text-[var(--psign-sig-ink)]"
                      style={{ fontFamily: `'${font.family}', cursive`, fontSize: 24, lineHeight: '56px' }}
                    >
                      {typedName || font.family}
                    </span>
                    {selectedFont === font.family && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--psign-primary)] text-[var(--psign-primary-fg)]">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 5 L4 7.5 L8.5 2.5" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {!fontsLoaded && (
                <p className="mt-2 text-center text-xs text-[var(--psign-text-muted)]">Loading fonts…</p>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              {!uploadDataUrl ? (
                <div
                  className={[
                    'flex flex-col items-center justify-center gap-3 rounded-[var(--psign-radius)] border-2 border-dashed py-10 transition-colors cursor-pointer',
                    isDragOver
                      ? 'border-[var(--psign-primary)] bg-[var(--psign-field-active)]'
                      : 'border-[var(--psign-border)] hover:border-[var(--psign-primary)]',
                  ].join(' ')}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                >
                  <svg className="h-8 w-8 text-[var(--psign-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--psign-text)]">Drop an image here</p>
                    <p className="text-xs text-[var(--psign-text-muted)]">or click to browse — PNG, JPG, GIF, WebP</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileInput} />
                </div>
              ) : (
                <div
                  className="relative overflow-hidden rounded-[var(--psign-radius)] border border-[var(--psign-border)]"
                  style={{ aspectRatio: fieldAspectRatio }}
                >
                  <img src={uploadDataUrl} alt="Signature preview" className="h-full w-full object-contain" />
                  <button
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--psign-danger)] text-white hover:opacity-90 transition-opacity focus-visible:outline-none"
                    onClick={() => { setUploadDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M2 2 L12 12 M12 2 L2 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--psign-border)] px-5 py-3">
          <button
            className="rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] px-4 py-1.5 text-sm text-[var(--psign-text)] hover:bg-[var(--psign-surface-raised)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            disabled={!canConfirm}
            className="rounded-[var(--psign-radius-sm)] bg-[var(--psign-primary)] px-4 py-1.5 text-sm font-medium text-[var(--psign-primary-fg)] transition-colors hover:bg-[var(--psign-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
            onClick={confirm}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
