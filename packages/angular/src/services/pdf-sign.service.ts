import {
  Injectable,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core'
import {
  PdfSignController,
  type PdfSignOptions,
  type FieldDef,
  type SignerDef,
  type PdfTemplate,
  type DocumentState,
  type SigningResult,
  type CustomFieldTypeDef,
  type AddFieldPayload,
  type UpdateFieldPayload,
  type PdfRect,
  type CompletedFieldValue,
} from '@pdf-sign/core'

/**
 * Per-component service that owns one PdfSignController.
 * Provide in the component's providers array:
 *
 *   @Component({ providers: [PdfSignService] })
 *
 * This gives each PdfSigner instance its own isolated state.
 */
@Injectable()
export class PdfSignService {
  private destroyRef = inject(DestroyRef)
  private ctrl!: PdfSignController

  // ── Signals ───────────────────────────────────────────────────────────────

  readonly state = signal<DocumentState>('idle')
  readonly fields = signal<FieldDef[]>([])
  readonly signers = signal<SignerDef[]>([])
  readonly activeSigner = signal<SignerDef | undefined>(undefined)
  readonly pdfHash = signal<string | null>(null)
  readonly pageCount = signal<number>(0)
  readonly canUndo = signal(false)
  readonly canRedo = signal(false)
  readonly signingProgress = signal(0)

  readonly isReady = computed(() => {
    const s = this.state()
    return s === 'ready' || s === 'editing' || s === 'signing' || s === 'complete'
  })
  readonly isLoading = computed(() => this.state() === 'loading')
  readonly hasError = computed(() => this.state() === 'error')

  // ── Init ──────────────────────────────────────────────────────────────────

  initialise(options: PdfSignOptions): void {
    this.ctrl = new PdfSignController(options)
    this.syncFromController()

    const unsubs = [
      this.ctrl.events.on('state-changed', ({ to }) => {
        this.state.set(to)
      }),
      this.ctrl.events.on('fields-changed', ({ fields }) => {
        this.fields.set([...fields])
        this.canUndo.set(this.ctrl.canUndo)
        this.canRedo.set(this.ctrl.canRedo)
      }),
      this.ctrl.events.on('ready', ({ pageCount, pdfHash }) => {
        this.pageCount.set(pageCount)
        this.pdfHash.set(pdfHash)
        this.signers.set([...this.ctrl.signers])
      }),
      this.ctrl.events.on('field-completed', () => {
        this.signingProgress.set(this.ctrl.signingProgress())
      }),
    ]

    this.destroyRef.onDestroy(() => {
      unsubs.forEach((fn) => fn())
      this.ctrl.destroy()
    })
  }

  private syncFromController(): void {
    this.state.set(this.ctrl.state)
    this.fields.set([...this.ctrl.fields])
    this.signers.set([...this.ctrl.signers])
    this.activeSigner.set(this.ctrl.activeSigner)
    this.pdfHash.set(this.ctrl.pdfHash)
    this.pageCount.set(this.ctrl.pageCount ?? 0)
    this.canUndo.set(this.ctrl.canUndo)
    this.canRedo.set(this.ctrl.canRedo)
  }

  // ── Controller accessor ───────────────────────────────────────────────────

  get controller(): PdfSignController {
    return this.ctrl
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  load(pageCount?: number): Promise<void> {
    return this.ctrl.load(pageCount)
  }

  setPageCount(n: number): void {
    this.ctrl.setPageCount(n)
    this.pageCount.set(n)
  }

  startEditing(): void {
    this.ctrl.startEditing()
  }

  startSigning(signerId: string): void {
    this.ctrl.startSigning(signerId)
    this.activeSigner.set(this.ctrl.activeSigner)
    this.signingProgress.set(this.ctrl.signingProgress())
  }

  addField(payload: AddFieldPayload): FieldDef {
    const field = this.ctrl.addField(payload)
    this.canUndo.set(this.ctrl.canUndo)
    this.canRedo.set(this.ctrl.canRedo)
    return field
  }

  updateField(payload: UpdateFieldPayload): FieldDef | undefined {
    return this.ctrl.updateField(payload)
  }

  moveField(id: string, rect: PdfRect): FieldDef | undefined {
    return this.ctrl.moveField(id, rect)
  }

  deleteField(id: string): boolean {
    const result = this.ctrl.deleteField(id)
    this.canUndo.set(this.ctrl.canUndo)
    this.canRedo.set(this.ctrl.canRedo)
    return result
  }

  undo(): FieldDef[] | undefined {
    const result = this.ctrl.undo()
    this.canUndo.set(this.ctrl.canUndo)
    this.canRedo.set(this.ctrl.canRedo)
    return result
  }

  redo(): FieldDef[] | undefined {
    const result = this.ctrl.redo()
    this.canUndo.set(this.ctrl.canUndo)
    this.canRedo.set(this.ctrl.canRedo)
    return result
  }

  addSigner(partial?: Partial<Omit<SignerDef, 'id'>>): SignerDef {
    const signer = this.ctrl.addSigner(partial)
    this.signers.set([...this.ctrl.signers])
    return signer
  }

  updateSigner(
    id: string,
    changes: Partial<Omit<SignerDef, 'id'>>,
  ): SignerDef | undefined {
    const signer = this.ctrl.updateSigner(id, changes)
    this.signers.set([...this.ctrl.signers])
    return signer
  }

  removeSigner(id: string): void {
    this.ctrl.removeSigner(id)
    this.signers.set([...this.ctrl.signers])
  }

  buildTemplate(): PdfTemplate {
    return this.ctrl.buildTemplate()
  }

  completeField(fieldId: string, value: unknown): void {
    this.ctrl.completeField(fieldId, value)
    this.signingProgress.set(this.ctrl.signingProgress())
  }

  getFieldValue(fieldId: string): CompletedFieldValue | undefined {
    return this.ctrl.getFieldValue(fieldId)
  }

  allRequiredFieldsComplete(signerId: string): boolean {
    return this.ctrl.allRequiredFieldsComplete(signerId)
  }

  pendingFields(): FieldDef[] {
    return this.ctrl.pendingFields()
  }

  fieldsForPage(page: number): FieldDef[] {
    return this.ctrl.fieldsForPage(page)
  }

  decline(reason = ''): void {
    this.ctrl.decline(reason)
  }

  submit(pdfBytes?: Uint8Array): Promise<SigningResult> {
    return this.ctrl.submit(pdfBytes)
  }

  reset(): void {
    this.ctrl.reset()
    this.state.set('idle')
    this.fields.set([])
    this.signers.set([...this.ctrl.signers])
    this.pdfHash.set(null)
    this.pageCount.set(0)
  }

  registerFieldType(def: CustomFieldTypeDef): void {
    this.ctrl.registerFieldType(def)
  }
}
