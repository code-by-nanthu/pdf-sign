import type {
  PdfSignOptions,
  FieldDef,
  PdfRect,
  PdfTemplate,
  SignerDef,
  CompletedFieldValue,
  AuditEntry,
  SigningResult,
  DocumentState,
  CustomFieldTypeDef,
} from '../types/index.js'
import { FieldStore } from '../state/field-store.js'
import { SignerStore, DEFAULT_SIGNER } from '../state/signer-store.js'
import { DocumentStore } from '../state/document-store.js'
import { TypedEventEmitter } from '../events/TypedEventEmitter.js'
import { sha256Hex, now } from '../utils/hash.js'
import { normalisePdfInput } from '../utils/pdf-loader.js'
import type { AddFieldPayload, UpdateFieldPayload } from '../state/field-store.js'

/** Registry entry for a custom field type. */
interface RegisteredFieldType {
  def: CustomFieldTypeDef
}

/**
 * PdfSignController
 *
 * The central controller for a single pdf-sign instance.
 * Framework adapters (Vue composable, React hook, Angular service)
 * create one of these and bridge its state + events into their
 * reactive systems.
 *
 * Lifecycle:
 *   const ctrl = new PdfSignController(options)
 *   await ctrl.load()          // load + hash the PDF
 *   ctrl.on('ready', ...)      // start rendering
 *   ctrl.addField(...)         // place fields (prepare mode)
 *   ctrl.on('fields-changed', ...)
 *   const template = ctrl.buildTemplate()
 *   // later, in sign mode:
 *   ctrl.startSigning(signerId)
 *   ctrl.completeField(fieldId, value)
 *   await ctrl.submit()
 */
export class PdfSignController {
  readonly events = new TypedEventEmitter()

  private readonly fieldStore: FieldStore
  private readonly signerStore: SignerStore
  private readonly documentStore: DocumentStore
  private readonly fieldTypeRegistry = new Map<string, RegisteredFieldType>()

  private _options: PdfSignOptions
  private _pdfBytes: Uint8Array | null = null
  private _pdfHash: string | null = null
  private _pageCount: number | null = null
  private _completedValues: CompletedFieldValue[] = []
  private _auditTrail: AuditEntry[] = []

  constructor(options: PdfSignOptions) {
    this._options = options

    // Initialise stores
    this.fieldStore = new FieldStore(
      options.initialFields ?? [],
    )

    this.signerStore = new SignerStore(
      options.signers ?? [{ ...DEFAULT_SIGNER }],
    )

    this.documentStore = new DocumentStore()

    // In sign mode, set the active signer immediately if provided
    if (options.mode === 'sign' && options.signerId) {
      // We can't call setActiveSigner yet — signers from the template
      // are loaded during .load(). Stored for use in load().
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  get state(): DocumentState {
    return this.documentStore.state
  }

  get fields(): FieldDef[] {
    return this.fieldStore.fields
  }

  get signers(): SignerDef[] {
    return this.signerStore.signers
  }

  get activeSigner(): SignerDef | undefined {
    return this.signerStore.activeSigner
  }

  get pdfBytes(): Uint8Array | null {
    return this._pdfBytes
  }

  get pdfHash(): string | null {
    return this._pdfHash
  }

  get pageCount(): number | null {
    return this._pageCount
  }

  get canUndo(): boolean {
    return this.fieldStore.canUndo
  }

  get canRedo(): boolean {
    return this.fieldStore.canRedo
  }

  get completedValues(): CompletedFieldValue[] {
    return [...this._completedValues]
  }

  get mode(): PdfSignOptions['mode'] {
    return this._options.mode
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Load the PDF, compute its hash, and transition to 'ready'.
   * In sign mode, also loads the template fields and signers.
   * Emits 'ready' on success, 'error' on failure.
   */
  async load(pageCount?: number): Promise<void> {
    const loadingResult = this.documentStore.tryTransition('loading')
    if (!loadingResult.success) return

    // Emit loading state change immediately
    this.events.emit('state-changed', { from: loadingResult.from, to: 'loading' })

    try {
      if (!this._options.pdf) {
        throw new Error('No PDF provided')
      }

      this._pdfBytes = await normalisePdfInput(this._options.pdf)
      this._pdfHash = await sha256Hex(this._pdfBytes)

      // In sign mode, load template fields + signers
      if (this._options.mode === 'sign' && this._options.template) {
        const template = this._options.template

        // Verify document integrity
        if (template.pdfHash !== this._pdfHash) {
          throw new Error(
            'Document hash mismatch — the PDF may have been modified since the template was created',
          )
        }

        this.fieldStore.loadFields(template.fields)
        this.signerStore.loadSigners(template.signers)

        if (this._options.signerId) {
          this.signerStore.setActiveSigner(this._options.signerId)
        }

        this._pageCount = template.pageCount
      } else if (pageCount !== undefined) {
        this._pageCount = pageCount
      }

      this.recordAuditEvent({ event: 'document-opened' })

      const from = this.documentStore.transition('ready')
      this.events.emit('state-changed', { from, to: 'ready' })
      this.events.emit('ready', {
        pageCount: this._pageCount ?? 0,
        pdfHash: this._pdfHash,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const from = this.documentStore.tryTransition('error')
      if (from.success) {
        this.events.emit('state-changed', { from: from.from, to: 'error' })
      }
      this.events.emit('error', { message, cause: err })
    }
  }

  /**
   * Call after load() once you know the page count from the PDF renderer.
   * Updates pageCount without re-loading the bytes.
   */
  setPageCount(count: number): void {
    this._pageCount = count
  }

  /**
   * Transition from 'ready' to 'editing' (prepare mode).
   * No-op if already in 'editing'.
   */
  startEditing(): void {
    if (this.documentStore.state === 'editing') return
    const result = this.documentStore.tryTransition('editing')
    if (result.success) {
      this.events.emit('state-changed', { from: result.from, to: 'editing' })
    }
  }

  /**
   * Transition to 'signing' and set the active signer.
   * In prepare mode, this is a preview. In sign mode, this begins the session.
   */
  startSigning(signerId: string): void {
    this.signerStore.setActiveSigner(signerId)
    const result = this.documentStore.tryTransition('signing')
    if (result.success) {
      this.events.emit('state-changed', { from: result.from, to: 'signing' })
    }
  }

  /**
   * Reset the controller to idle state, clearing all loaded data.
   * Does NOT clear registered field types.
   */
  reset(): void {
    this.fieldStore.clear()
    this.signerStore.reset()
    this.documentStore.reset()
    this._pdfBytes = null
    this._pdfHash = null
    this._pageCount = null
    this._completedValues = []
    this._auditTrail = []
    this.events.emit('state-changed', { from: this.documentStore.state, to: 'idle' })
  }

  // ── Field management (prepare mode) ───────────────────────────────────────

  addField(payload: AddFieldPayload): FieldDef {
    if (!this.documentStore.is('editing', 'ready')) {
      this.startEditing()
    }
    const field = this.fieldStore.addField(payload)
    this.emitFieldsChanged()
    return field
  }

  updateField(payload: UpdateFieldPayload): FieldDef | undefined {
    const field = this.fieldStore.updateField(payload)
    if (field) this.emitFieldsChanged()
    return field
  }

  moveField(id: string, newRect: PdfRect): FieldDef | undefined {
    const field = this.fieldStore.moveField(id, newRect)
    if (field) this.emitFieldsChanged()
    return field
  }

  deleteField(id: string): boolean {
    const deleted = this.fieldStore.deleteField(id)
    if (deleted) this.emitFieldsChanged()
    return deleted
  }

  undo(): FieldDef[] | undefined {
    const fields = this.fieldStore.undo()
    if (fields) this.emitFieldsChanged()
    return fields
  }

  redo(): FieldDef[] | undefined {
    const fields = this.fieldStore.redo()
    if (fields) this.emitFieldsChanged()
    return fields
  }

  // ── Signer management (prepare mode) ──────────────────────────────────────

  addSigner(partial?: Partial<Omit<SignerDef, 'id'>>): SignerDef {
    return this.signerStore.addSigner(partial)
  }

  updateSigner(id: string, changes: Partial<Omit<SignerDef, 'id'>>): SignerDef | undefined {
    return this.signerStore.updateSigner(id, changes)
  }

  removeSigner(id: string): void {
    this.signerStore.removeSigner(id)
    // Unassign fields that belonged to this signer
    this.fieldStore.reassignFields(id, null)
    this.emitFieldsChanged()
  }

  // ── Template (prepare mode output) ────────────────────────────────────────

  /**
   * Build a PdfTemplate from the current state.
   * Call this when the preparer is done placing fields.
   * Emits 'template-ready'.
   */
  buildTemplate(): PdfTemplate {
    if (!this._pdfHash) {
      throw new Error('[pdf-sign/core] Cannot build template: PDF not loaded')
    }

    const template: PdfTemplate = {
      version: '1',
      pdfHash: this._pdfHash,
      pageCount: this._pageCount ?? 0,
      fields: this.fieldStore.fields.map((f) => ({ ...f })),
      signers: this.signerStore.signers.map((s) => ({ ...s })),
      createdAt: now(),
      updatedAt: now(),
    }

    this.documentStore.tryTransition('submitting')
    this.events.emit('template-ready', { template })
    return template
  }

  // ── Field completion (sign mode) ───────────────────────────────────────────

  /**
   * Record a signer completing a field.
   * Checks: field exists, field is assigned to the active signer,
   * field is not already completed.
   * Auto-transitions to 'complete' when all required fields are done.
   */
  completeField(fieldId: string, value: unknown): void {
    const field = this.fieldStore.getField(fieldId)
    if (!field) {
      throw new Error(`[pdf-sign/core] Field "${fieldId}" not found`)
    }

    const signerId = this.signerStore.activeSignerId
    if (!signerId) {
      throw new Error('[pdf-sign/core] No active signer set')
    }

    if (field.signerId !== null && field.signerId !== signerId) {
      throw new Error(
        `[pdf-sign/core] Field "${fieldId}" is not assigned to signer "${signerId}"`,
      )
    }

    // Replace any existing completion for this field
    this._completedValues = [
      ...this._completedValues.filter((v) => v.fieldId !== fieldId),
      {
        fieldId,
        signerId,
        value,
        completedAt: now(),
      },
    ]

    this.recordAuditEvent({ event: 'field-completed', fieldId, signerId })
    this.events.emit('field-completed', { fieldId, signerId, value })

    // Check if all required fields for this signer are now done
    if (this.allRequiredFieldsComplete(signerId)) {
      const result = this.documentStore.tryTransition('complete')
      if (result.success) {
        this.events.emit('state-changed', { from: result.from, to: 'complete' })
      }
    }
  }

  /**
   * Check whether all required fields assigned to a signer are complete.
   */
  allRequiredFieldsComplete(signerId: string): boolean {
    const requiredFields = this.fieldStore.fields.filter(
      (f) => f.required && (f.signerId === signerId || f.signerId === null),
    )
    const completedIds = new Set(
      this._completedValues
        .filter((v) => v.signerId === signerId)
        .map((v) => v.fieldId),
    )
    return requiredFields.every((f) => completedIds.has(f.id))
  }

  /**
   * Get the completion value for a specific field, if filled.
   */
  getFieldValue(fieldId: string): CompletedFieldValue | undefined {
    return this._completedValues.find((v) => v.fieldId === fieldId)
  }

  /**
   * Decline to sign. Emits 'declined' and transitions to 'idle'.
   */
  decline(reason = ''): void {
    const signerId = this.signerStore.activeSignerId ?? ''
    const timestamp = now()

    this.recordAuditEvent({ event: 'document-declined', signerId })
    this.events.emit('declined', { signerId, reason, timestamp })
    this.documentStore.tryTransition('idle')
    this.events.emit('state-changed', { from: 'signing', to: 'idle' })
  }

  // ── Export (sign mode) ────────────────────────────────────────────────────

  /**
   * Submit the completed document.
   * Validates all required fields are complete, then emits 'signing-complete'.
   * The actual PDF flattening is done by the export module (prompt 5)
   * and passed back in via onPdfGenerated.
   *
   * @param pdfBytes - The flattened PDF bytes generated by the export module.
   *                   Pass Uint8Array(0) as a placeholder until prompt 5.
   */
  async submit(pdfBytes: Uint8Array = new Uint8Array(0)): Promise<SigningResult> {
    const signerId = this.signerStore.activeSignerId
    if (!signerId) {
      throw new Error('[pdf-sign/core] Cannot submit: no active signer')
    }

    if (!this.allRequiredFieldsComplete(signerId)) {
      throw new Error('[pdf-sign/core] Cannot submit: required fields are incomplete')
    }

    const result = this.documentStore.tryTransition('submitting')
    if (!result.success) {
      throw new Error(
        `[pdf-sign/core] Cannot submit from state "${this.documentStore.state}"`,
      )
    }
    this.events.emit('state-changed', { from: result.from, to: 'submitting' })

    const finalHash = pdfBytes.length > 0
      ? await sha256Hex(pdfBytes)
      : (this._pdfHash ?? '')

    this.recordAuditEvent({ event: 'document-submitted', signerId })

    const template = this._options.template ?? this.buildTemplateSnapshot()

    const signingResult: SigningResult = {
      template,
      completedValues: [...this._completedValues],
      auditTrail: [...this._auditTrail],
      completedAt: now(),
      finalPdfHash: finalHash,
      pdfBytes,
    }

    this.documentStore.transition('done')
    this.events.emit('state-changed', { from: 'submitting', to: 'done' })
    this.events.emit('signing-complete', signingResult)

    if (pdfBytes.length > 0) {
      this.events.emit('export-ready', {
        pdfBytes,
        filename: `signed-document-${finalHash.slice(0, 8)}.pdf`,
      })
    }

    return signingResult
  }

  // ── Field type plugin API ─────────────────────────────────────────────────

  registerFieldType<T = unknown>(def: CustomFieldTypeDef<T>): void {
    if (this.fieldTypeRegistry.has(def.id)) {
      console.warn(
        `[pdf-sign/core] Field type "${def.id}" is already registered. Overwriting.`,
      )
    }
    this.fieldTypeRegistry.set(def.id, { def: def as CustomFieldTypeDef })
  }

  getFieldType(id: string): CustomFieldTypeDef | undefined {
    return this.fieldTypeRegistry.get(id)?.def
  }

  get registeredFieldTypes(): CustomFieldTypeDef[] {
    return Array.from(this.fieldTypeRegistry.values()).map((r) => r.def)
  }

  // ── Convenience shortcuts ─────────────────────────────────────────────────

  /** Fields visible in the current page + mode combination. */
  fieldsForPage(page: number): FieldDef[] {
    return this.fieldStore.fieldsOnPage(page)
  }

  /** Fields the active signer needs to complete (sign mode). */
  pendingFields(): FieldDef[] {
    const signerId = this.signerStore.activeSignerId
    if (!signerId) return []
    const completedIds = new Set(
      this._completedValues.filter((v) => v.signerId === signerId).map((v) => v.fieldId),
    )
    return this.fieldStore.fields.filter(
      (f) => (f.signerId === signerId || f.signerId === null) && !completedIds.has(f.id),
    )
  }

  /** Progress fraction 0–1 for the active signer. */
  signingProgress(): number {
    const signerId = this.signerStore.activeSignerId
    if (!signerId) return 0
    const total = this.fieldStore.fields.filter(
      (f) => f.signerId === signerId || f.signerId === null,
    ).length
    if (total === 0) return 1
    const done = this._completedValues.filter((v) => v.signerId === signerId).length
    return done / total
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy(): void {
    this.events.removeAllListeners()
    this._pdfBytes = null
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private emitFieldsChanged(): void {
    this.events.emit('fields-changed', { fields: this.fieldStore.fields })
  }

  private recordAuditEvent(
    entry: Pick<AuditEntry, 'event' | 'fieldId' | 'signerId'>,
  ): void {
    const context = this._options.getAuditContext?.() ?? {}
    this._auditTrail.push({
      ...entry,
      timestamp: now(),
      ...context,
    })
  }

  private buildTemplateSnapshot(): PdfTemplate {
    return {
      version: '1',
      pdfHash: this._pdfHash ?? '',
      pageCount: this._pageCount ?? 0,
      fields: this.fieldStore.fields.map((f) => ({ ...f })),
      signers: this.signerStore.signers.map((s) => ({ ...s })),
      createdAt: now(),
      updatedAt: now(),
    }
  }
}
