import {
  ref,
  computed,
  shallowRef,
  onUnmounted,
  type Ref,
} from 'vue'
import {
  PdfSignController,
  type PdfSignOptions,
  type FieldDef,
  type SignerDef,
  type PdfTemplate,
  type DocumentState,
  type SigningResult,
  type CustomFieldTypeDef,
  type CompletedFieldValue,
  type AddFieldPayload,
  type UpdateFieldPayload,
  type PdfRect,
} from '@pdf-sign/core'

export interface UsePdfSignReturn {
  // State
  state: Ref<DocumentState>
  fields: Ref<FieldDef[]>
  signers: Ref<SignerDef[]>
  activeSigner: Ref<SignerDef | undefined>
  pdfHash: Ref<string | null>
  pageCount: Ref<number>
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  signingProgress: Ref<number>

  // Actions
  load: (pageCount?: number) => Promise<void>
  setPageCount: (n: number) => void
  startEditing: () => void
  startSigning: (signerId: string) => void
  addField: (payload: AddFieldPayload) => FieldDef
  updateField: (payload: UpdateFieldPayload) => FieldDef | undefined
  moveField: (id: string, rect: PdfRect) => FieldDef | undefined
  deleteField: (id: string) => boolean
  undo: () => FieldDef[] | undefined
  redo: () => FieldDef[] | undefined
  addSigner: (partial?: Partial<Omit<SignerDef, 'id'>>) => SignerDef
  updateSigner: (id: string, changes: Partial<Omit<SignerDef, 'id'>>) => SignerDef | undefined
  removeSigner: (id: string) => void
  buildTemplate: () => PdfTemplate
  completeField: (fieldId: string, value: unknown) => void
  getFieldValue: (fieldId: string) => CompletedFieldValue | undefined
  allRequiredFieldsComplete: (signerId: string) => boolean
  pendingFields: () => FieldDef[]
  fieldsForPage: (page: number) => FieldDef[]
  decline: (reason?: string) => void
  submit: (pdfBytes?: Uint8Array) => Promise<SigningResult>
  reset: () => void
  registerFieldType: (def: CustomFieldTypeDef) => void

  // Raw controller (for advanced use)
  controller: PdfSignController
}

export function usePdfSign(options: PdfSignOptions): UsePdfSignReturn {
  const controller = new PdfSignController(options)

  // ── Reactive state bridged from controller events ─────────────────────────

  const state = ref<DocumentState>(controller.state)
  const fields = ref<FieldDef[]>([...controller.fields])
  const signers = ref<SignerDef[]>([...controller.signers])
  const activeSigner = shallowRef<SignerDef | undefined>(controller.activeSigner)
  const pdfHash = ref<string | null>(controller.pdfHash)
  const pageCount = ref<number>(controller.pageCount ?? 0)
  const canUndo = ref(controller.canUndo)
  const canRedo = ref(controller.canRedo)
  const _signingProgress = ref(0)

  // Derived
  const isReady = computed(() =>
    state.value === 'ready' ||
    state.value === 'editing' ||
    state.value === 'signing' ||
    state.value === 'complete',
  )
  const isLoading = computed(() => state.value === 'loading')
  const hasError = computed(() => state.value === 'error')

  // ── Wire controller events → reactive state ───────────────────────────────

  const unsubs: Array<() => void> = []

  unsubs.push(
    controller.events.on('state-changed', ({ to }) => {
      state.value = to
    }),
  )

  unsubs.push(
    controller.events.on('fields-changed', ({ fields: f }) => {
      fields.value = [...f]
      canUndo.value = controller.canUndo
      canRedo.value = controller.canRedo
    }),
  )

  unsubs.push(
    controller.events.on('ready', ({ pageCount: pc, pdfHash: hash }) => {
      pageCount.value = pc
      pdfHash.value = hash
      signers.value = [...controller.signers]
      activeSigner.value = controller.activeSigner
    }),
  )

  unsubs.push(
    controller.events.on('field-completed', () => {
      _signingProgress.value = controller.signingProgress()
    }),
  )

  // ── Cleanup ───────────────────────────────────────────────────────────────

  onUnmounted(() => {
    unsubs.forEach((fn) => fn())
    controller.destroy()
  })

  // ── Action wrappers (keep reactive state in sync) ─────────────────────────

  function addField(payload: AddFieldPayload): FieldDef {
    const field = controller.addField(payload)
    canUndo.value = controller.canUndo
    canRedo.value = controller.canRedo
    return field
  }

  function undo() {
    const result = controller.undo()
    canUndo.value = controller.canUndo
    canRedo.value = controller.canRedo
    return result
  }

  function redo() {
    const result = controller.redo()
    canUndo.value = controller.canUndo
    canRedo.value = controller.canRedo
    return result
  }

  function addSigner(partial?: Partial<Omit<SignerDef, 'id'>>) {
    const signer = controller.addSigner(partial)
    signers.value = [...controller.signers]
    return signer
  }

  function updateSigner(id: string, changes: Partial<Omit<SignerDef, 'id'>>) {
    const signer = controller.updateSigner(id, changes)
    signers.value = [...controller.signers]
    return signer
  }

  function removeSigner(id: string) {
    controller.removeSigner(id)
    signers.value = [...controller.signers]
  }

  function startSigning(signerId: string) {
    controller.startSigning(signerId)
    activeSigner.value = controller.activeSigner
    _signingProgress.value = controller.signingProgress()
  }

  return {
    // State
    state: state as Ref<DocumentState>,
    fields: fields as Ref<FieldDef[]>,
    signers: signers as Ref<SignerDef[]>,
    activeSigner: activeSigner as Ref<SignerDef | undefined>,
    pdfHash,
    pageCount,
    canUndo,
    canRedo,
    isReady,
    isLoading,
    hasError,
    signingProgress: _signingProgress,

    // Actions
    load: (pc?: number) => controller.load(pc),
    setPageCount: (n: number) => {
      controller.setPageCount(n)
      pageCount.value = n
    },
    startEditing: () => controller.startEditing(),
    startSigning,
    addField,
    updateField: (payload) => controller.updateField(payload),
    moveField: (id, rect) => controller.moveField(id, rect),
    deleteField: (id) => controller.deleteField(id),
    undo,
    redo,
    addSigner,
    updateSigner,
    removeSigner,
    buildTemplate: () => controller.buildTemplate(),
    completeField: (fieldId, value) => controller.completeField(fieldId, value),
    getFieldValue: (fieldId) => controller.getFieldValue(fieldId),
    allRequiredFieldsComplete: (signerId) => controller.allRequiredFieldsComplete(signerId),
    pendingFields: () => controller.pendingFields(),
    fieldsForPage: (page) => controller.fieldsForPage(page),
    decline: (reason) => controller.decline(reason),
    submit: (pdfBytes) => controller.submit(pdfBytes),
    reset: () => {
      controller.reset()
      state.value = 'idle'
      fields.value = []
      signers.value = [...controller.signers]
      pdfHash.value = null
      pageCount.value = 0
    },
    registerFieldType: (def) => controller.registerFieldType(def),
    controller,
  }
}
