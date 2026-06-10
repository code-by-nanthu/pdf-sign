import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react'
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

export interface UsePdfSignReturn {
  // State
  state: DocumentState
  fields: FieldDef[]
  signers: SignerDef[]
  activeSigner: SignerDef | undefined
  pdfHash: string | null
  pageCount: number
  canUndo: boolean
  canRedo: boolean
  isReady: boolean
  isLoading: boolean
  hasError: boolean
  signingProgress: number

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

  // Raw controller
  controller: PdfSignController
}

interface ControllerSnapshot {
  state: DocumentState
  fields: FieldDef[]
  signers: SignerDef[]
  activeSigner: SignerDef | undefined
  pdfHash: string | null
  pageCount: number
  canUndo: boolean
  canRedo: boolean
  signingProgress: number
}

function getSnapshot(ctrl: PdfSignController): ControllerSnapshot {
  return {
    state: ctrl.state,
    fields: ctrl.fields,
    signers: ctrl.signers,
    activeSigner: ctrl.activeSigner,
    pdfHash: ctrl.pdfHash,
    pageCount: ctrl.pageCount ?? 0,
    canUndo: ctrl.canUndo,
    canRedo: ctrl.canRedo,
    signingProgress: ctrl.signingProgress(),
  }
}

export function usePdfSign(options: PdfSignOptions): UsePdfSignReturn {
  const ctrlRef = useRef<PdfSignController | null>(null)
  if (!ctrlRef.current) {
    ctrlRef.current = new PdfSignController(options)
  }
  const ctrl = ctrlRef.current as PdfSignController

  const snapshotRef = useRef<ControllerSnapshot>(getSnapshot(ctrl))
  const subscribersRef = useRef<Set<() => void>>(new Set())

  function notifySubscribers() {
    snapshotRef.current = getSnapshot(ctrl)
    for (const cb of subscribersRef.current) cb()
  }

  useEffect(() => {
    const unsubs = [
      ctrl.events.on('state-changed', notifySubscribers),
      ctrl.events.on('fields-changed', notifySubscribers),
      ctrl.events.on('ready', notifySubscribers),
      ctrl.events.on('field-completed', notifySubscribers),
    ]

    return () => {
      unsubs.forEach((fn) => fn())
      ctrl.destroy()
      ctrlRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const snapshot = useSyncExternalStore(
    useCallback(
      (onStoreChange) => {
        subscribersRef.current.add(onStoreChange)
        return () => subscribersRef.current.delete(onStoreChange)
      },
      [],
    ),
    () => snapshotRef.current,
    () => snapshotRef.current,
  )

  const isReady =
    snapshot.state === 'ready' ||
    snapshot.state === 'editing' ||
    snapshot.state === 'signing' ||
    snapshot.state === 'complete'
  const isLoading = snapshot.state === 'loading'
  const hasError = snapshot.state === 'error'

  const load = useCallback(
    (pageCount?: number) => ctrl.load(pageCount),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const setPageCount = useCallback((n: number) => {
    ctrl.setPageCount(n)
    notifySubscribers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addField = useCallback((payload: AddFieldPayload) => {
    const field = ctrl.addField(payload)
    notifySubscribers()
    return field
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateField = useCallback((payload: UpdateFieldPayload) => {
    const field = ctrl.updateField(payload)
    notifySubscribers()
    return field
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveField = useCallback((id: string, rect: PdfRect) => {
    const field = ctrl.moveField(id, rect)
    notifySubscribers()
    return field
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deleteField = useCallback((id: string) => {
    const result = ctrl.deleteField(id)
    notifySubscribers()
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const undo = useCallback(() => {
    const result = ctrl.undo()
    notifySubscribers()
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const redo = useCallback(() => {
    const result = ctrl.redo()
    notifySubscribers()
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addSigner = useCallback((partial?: Partial<Omit<SignerDef, 'id'>>) => {
    const signer = ctrl.addSigner(partial)
    notifySubscribers()
    return signer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSigner = useCallback(
    (id: string, changes: Partial<Omit<SignerDef, 'id'>>) => {
      const signer = ctrl.updateSigner(id, changes)
      notifySubscribers()
      return signer
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const removeSigner = useCallback((id: string) => {
    ctrl.removeSigner(id)
    notifySubscribers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startSigning = useCallback((signerId: string) => {
    ctrl.startSigning(signerId)
    notifySubscribers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reset = useCallback(() => {
    ctrl.reset()
    notifySubscribers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    state: snapshot.state,
    fields: snapshot.fields,
    signers: snapshot.signers,
    activeSigner: snapshot.activeSigner,
    pdfHash: snapshot.pdfHash,
    pageCount: snapshot.pageCount,
    canUndo: snapshot.canUndo,
    canRedo: snapshot.canRedo,
    isReady,
    isLoading,
    hasError,
    signingProgress: snapshot.signingProgress,

    load,
    setPageCount,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    startEditing: useCallback(() => ctrl.startEditing(), []),
    startSigning,
    addField,
    updateField,
    moveField,
    deleteField,
    undo,
    redo,
    addSigner,
    updateSigner,
    removeSigner,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    buildTemplate: useCallback(() => ctrl.buildTemplate(), []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    completeField: useCallback((fieldId: string, value: unknown) => {
      ctrl.completeField(fieldId, value)
      notifySubscribers()
    }, []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    getFieldValue: useCallback(
      (fieldId: string) => ctrl.getFieldValue(fieldId),
      [],
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    allRequiredFieldsComplete: useCallback(
      (signerId: string) => ctrl.allRequiredFieldsComplete(signerId),
      [],
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    pendingFields: useCallback(() => ctrl.pendingFields(), []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fieldsForPage: useCallback((page: number) => ctrl.fieldsForPage(page), []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    decline: useCallback((reason?: string) => ctrl.decline(reason), []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    submit: useCallback(
      (pdfBytes?: Uint8Array) => ctrl.submit(pdfBytes),
      [],
    ),
    reset,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    registerFieldType: useCallback(
      (def: CustomFieldTypeDef) => ctrl.registerFieldType(def),
      [],
    ),
    controller: ctrl,
  }
}
