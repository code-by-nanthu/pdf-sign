import type { ReactNode } from 'react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
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
  PdfExporter,
} from '@pdf-sign/core'
import type { RenderPageResult } from '@pdf-sign/core'
import { usePdfSign } from '../hooks/usePdfSign.js'
import { useDragEngine } from '../hooks/useDragEngine.js'
import { ToolBar } from './ToolBar.js'
import { PdfViewer, type PdfViewerHandle } from './PdfViewer.js'
import { FieldPalette } from './FieldPalette.js'
import { FieldPropertiesPanel } from './FieldPropertiesPanel.js'
import { SignatureModal } from './SignatureModal.js'

export interface PdfSignerProps {
  pdf?: PdfSignOptions['pdf']
  mode?: PdfSignOptions['mode']
  template?: PdfTemplate
  signerId?: string
  signers?: SignerDef[]
  theme?: Partial<ThemeTokens>
  includeAuditPage?: boolean
  snapGrid?: number
  onTemplateReady?: (template: PdfTemplate) => void
  onFieldsChanged?: (fields: FieldDef[]) => void
  onSigningComplete?: (result: SigningResult) => void
  onDeclined?: (payload: { signerId: string; reason: string; timestamp: string }) => void
  onExportReady?: (payload: { pdfBytes: Uint8Array; filename: string }) => void
  onError?: (payload: { message: string; cause?: unknown }) => void
  children?: ReactNode
}

export function PdfSigner({
  pdf = null,
  mode = 'prepare',
  template,
  signerId,
  signers: signersProp,
  theme,
  includeAuditPage = true,
  snapGrid = 0,
  onTemplateReady,
  onFieldsChanged,
  onSigningComplete,
  onDeclined,
  onExportReady,
  onError,
  children,
}: PdfSignerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<PdfViewerHandle | null>(null)

  // Theme injection
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (theme) injectTheme(el, theme)
    return () => { if (el) removeTheme(el) }
  }, [theme])

  // Core controller
  const {
    fields,
    signers,
    signingProgress,
    pageCount,
    canUndo,
    canRedo,
    isLoading,
    hasError,
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
    mode,
    pdf,
    ...(template !== undefined && { template }),
    ...(signerId !== undefined && { signerId }),
    ...(signersProp !== undefined && { signers: signersProp }),
    includeAuditPage,
  })

  // Wire controller events to prop callbacks
  useEffect(() => {
    const unsubs = [
      controller.events.on('fields-changed', ({ fields: f }) => onFieldsChanged?.(f)),
      controller.events.on('template-ready', ({ template: t }) => onTemplateReady?.(t)),
      controller.events.on('signing-complete', (r) => onSigningComplete?.(r)),
      controller.events.on('declined', (p) => onDeclined?.(p)),
      controller.events.on('export-ready', (p) => onExportReady?.(p)),
      controller.events.on('error', (p) => onError?.(p)),
    ]
    return () => unsubs.forEach((fn) => fn())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Local UI state
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [viewport, setViewport] = useState<RenderPageResult['viewport'] | null>(null)
  const [activeSignerIdForPalette, setActiveSignerIdForPalette] = useState<string | null>(
    signersProp?.[0]?.id ?? 'signer-1',
  )
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [pendingSignatureFieldId, setPendingSignatureFieldId] = useState<string | null>(null)
  const [completedFieldIds, setCompletedFieldIds] = useState<string[]>([])

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  // Drag engine
  const dragEngine = useDragEngine({ gridSize: snapGrid })

  // Wire drag events
  useEffect(() => {
    const DEFAULT_FIELD_SIZES: Record<string, { w: number; h: number }> = {
      signature: { w: 180, h: 60 },
      initials:  { w: 80,  h: 40 },
      stamp:     { w: 100, h: 100 },
      checkbox:  { w: 20,  h: 20 },
      radio:     { w: 16,  h: 16 },
      default:   { w: 150, h: 36 },
    }

    const unsubs = [
      dragEngine.on('palette-drop', ({ fieldTypeId, overlayX, overlayY, page }) => {
        if (!viewport) return
        const { w: dW, h: dH } = DEFAULT_FIELD_SIZES[fieldTypeId] ?? DEFAULT_FIELD_SIZES['default']!
        const halfWPx = (dW / viewport.pdfNaturalWidth) * viewport.cssWidth / 2
        const halfHPx = (dH / viewport.pdfNaturalHeight) * viewport.cssHeight / 2
        const topLeft = overlayToPdf(overlayX - halfWPx, overlayY - halfHPx, page, viewport)
        const { width, height } = overlayDimensionsToPdf(dW, dH, viewport)
        const raw = { x: topLeft.x, y: topLeft.y - height, width, height, page }
        const clamped = clampToPdfPage(raw, viewport)
        const field = addField({ type: fieldTypeId, rect: clamped, signerId: activeSignerIdForPalette, required: false })
        setSelectedFieldId(field.id)
        startEditing()
      }),

      dragEngine.on('field-move-commit', ({ fieldId, rect }) => {
        if (!viewport) return
        const topLeft = overlayToPdf(rect.x, rect.y, rect.page, viewport)
        const { width, height } = overlayDimensionsToPdf(rect.width, rect.height, viewport)
        const pdfRect = clampToPdfPage({ x: topLeft.x, y: topLeft.y - height, width, height, page: rect.page }, viewport)
        moveField(fieldId, pdfRect)
      }),

      dragEngine.on('field-resize-commit', ({ fieldId, rect }) => {
        if (!viewport) return
        const topLeft = overlayToPdf(rect.x, rect.y, rect.page, viewport)
        const { width, height } = overlayDimensionsToPdf(rect.width, rect.height, viewport)
        const pdfRect = clampToPdfPage({ x: topLeft.x, y: topLeft.y - height, width, height, page: rect.page }, viewport)
        updateField({ id: fieldId, changes: { rect: pdfRect } })
      }),
    ]

    return () => unsubs.forEach((fn) => fn())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragEngine, viewport, activeSignerIdForPalette])

  // Load PDF
  useEffect(() => {
    if (!pdf) return
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf])

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldId && mode === 'prepare') {
        e.preventDefault(); deleteField(selectedFieldId); setSelectedFieldId(null)
      } else if (e.key === 'ArrowLeft') setCurrentPage((p) => Math.max(0, p - 1))
      else if (e.key === 'ArrowRight') setCurrentPage((p) => Math.min(pageCount - 1, p + 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedFieldId, pageCount, mode, undo, redo, deleteField])

  function onFieldSelect(fieldId: string) {
    if (mode === 'prepare') {
      setSelectedFieldId(fieldId)
    } else if (mode === 'sign') {
      const field = fields.find((f) => f.id === fieldId)
      if (!field) return
      if (field.type === 'signature' || field.type === 'initials') {
        setPendingSignatureFieldId(fieldId)
        setShowSignatureModal(true)
      }
    }
  }

  function onSignatureConfirm(dataUrl: string) {
    if (!pendingSignatureFieldId) return
    completeField(pendingSignatureFieldId, dataUrl)
    setCompletedFieldIds((prev) => [...prev, pendingSignatureFieldId])
    setShowSignatureModal(false)
    setPendingSignatureFieldId(null)
  }

  const onSubmit = useCallback(async () => {
    if (!controller.pdfBytes) return
    try {
      const exporter = new PdfExporter()
      const tmpl = template ?? buildTemplate()
      const auditTrail = (controller as unknown as { _auditTrail: AuditEntry[] })._auditTrail ?? []
      const { pdfBytes } = await exporter.export(
        controller.pdfBytes,
        tmpl,
        {
          template: tmpl,
          completedValues: controller.completedValues,
          auditTrail,
          completedAt: new Date().toISOString(),
        },
        controller.completedValues,
        { includeAuditPage },
      )
      await submit(pdfBytes)
    } catch (err) {
      onError?.({ message: err instanceof Error ? err.message : String(err), cause: err })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, template, includeAuditPage, submit])

  return (
    <div ref={rootRef} className="pdf-sign-root flex h-full w-full flex-col overflow-hidden" data-pdf-sign>
      <ToolBar
        currentPage={currentPage}
        totalPages={pageCount}
        scale={viewerRef.current?.scale ?? 1}
        canUndo={canUndo}
        canRedo={canRedo}
        isRendering={viewerRef.current?.isRendering ?? false}
        mode={mode}
        signers={signers}
        activeSignerId={activeSignerIdForPalette}
        onPrevPage={() => setCurrentPage((p) => Math.max(0, p - 1))}
        onNextPage={() => setCurrentPage((p) => Math.min(pageCount - 1, p + 1))}
        onZoomIn={() => viewerRef.current?.zoomIn()}
        onZoomOut={() => viewerRef.current?.zoomOut()}
        onFitWidth={() => viewerRef.current?.fitWidth()}
        onUndo={undo}
        onRedo={redo}
        onSave={() => { const t = buildTemplate(); onTemplateReady?.(t) }}
        onSubmit={onSubmit}
      >
        {children}
      </ToolBar>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {mode === 'prepare' && (
          <FieldPalette
            signers={signers}
            activeSignerId={activeSignerIdForPalette}
            dragEngine={dragEngine}
            onSignerChange={setActiveSignerIdForPalette}
          />
        )}

        <PdfViewer
          ref={viewerRef}
          pdfBytes={controller.pdfBytes}
          currentPage={currentPage}
          fields={fields}
          signers={signers}
          dragEngine={dragEngine}
          selectedFieldId={selectedFieldId}
          mode={mode}
          completedFieldIds={completedFieldIds}
          onPageCount={(count) => setPageCount(count)}
          onViewportReady={setViewport}
          onFieldSelect={onFieldSelect}
          onFieldDelete={(id) => { deleteField(id); if (selectedFieldId === id) setSelectedFieldId(null) }}
        />

        {mode === 'prepare' && (
          <FieldPropertiesPanel
            field={selectedField}
            signers={signers}
            onUpdate={({ id, changes }) => updateField({ id, changes })}
            onDelete={(id) => { deleteField(id); setSelectedFieldId(null) }}
            onClose={() => setSelectedFieldId(null)}
          />
        )}

        {mode === 'sign' && (
          <div className="flex w-60 shrink-0 flex-col border-l border-[var(--psign-border)] bg-[var(--psign-palette-bg)] p-4">
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--psign-text)]">Progress</span>
                <span className="text-xs text-[var(--psign-text-muted)]">{Math.round(signingProgress * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--psign-border)]">
                <div
                  className="h-full rounded-full bg-[var(--psign-primary)] transition-all duration-300"
                  style={{ width: `${signingProgress * 100}%` }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--psign-text-muted)]">
                Fields to complete
              </p>
              {pendingFields().map((field) => (
                <div
                  key={field.id}
                  className={[
                    'mb-1 rounded-[var(--psign-radius-sm)] border px-3 py-2 text-xs cursor-pointer transition-colors',
                    'border-[var(--psign-border)] bg-[var(--psign-surface)] hover:bg-[var(--psign-surface-raised)]',
                    field.required ? 'border-l-2 border-l-[var(--psign-danger)]' : '',
                  ].join(' ')}
                  onClick={() => { setCurrentPage(field.rect.page); onFieldSelect(field.id) }}
                >
                  <span className="font-medium text-[var(--psign-text)]">{field.label}</span>
                  {field.required && <span className="ml-1 text-[var(--psign-danger)]">*</span>}
                  <span className="ml-1 text-[var(--psign-text-muted)]">p.{field.rect.page + 1}</span>
                </div>
              ))}
              {pendingFields().length === 0 && (
                <p className="text-xs text-[var(--psign-success)]">All fields complete ✓</p>
              )}
            </div>
            <button
              className="mt-4 rounded-[var(--psign-radius-sm)] border border-[var(--psign-border)] py-2 text-xs text-[var(--psign-danger)] transition-colors hover:bg-[var(--psign-field-required)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--psign-focus-ring)]"
              onClick={() => {
                decline()
                onDeclined?.({ signerId: controller.activeSigner?.id ?? '', reason: '', timestamp: new Date().toISOString() })
              }}
            >
              Decline to sign
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--psign-overlay)]" style={{ zIndex: 200 }}>
          <div className="flex flex-col items-center gap-3">
            <svg className="h-8 w-8 animate-spin text-[var(--psign-primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm font-medium text-[var(--psign-surface)]">Loading document…</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--psign-canvas-bg)]">
          <div className="max-w-sm text-center">
            <p className="mb-1 font-medium text-[var(--psign-danger)]">Failed to load document</p>
            <p className="text-sm text-[var(--psign-text-muted)]">Check that the file is a valid PDF and try again.</p>
          </div>
        </div>
      )}

      <SignatureModal
        open={showSignatureModal}
        onConfirm={onSignatureConfirm}
        onCancel={() => { setShowSignatureModal(false); setPendingSignatureFieldId(null) }}
      />
    </div>
  )
}
