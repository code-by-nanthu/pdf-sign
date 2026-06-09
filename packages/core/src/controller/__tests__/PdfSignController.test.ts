import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PdfSignController } from '../PdfSignController.js'
import type { PdfSignOptions } from '../../types/index.js'

// Minimal valid PDF bytes (a real 1-page PDF for testing load())
// Using a tiny but valid PDF structure
const TINY_PDF = new Uint8Array([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
  0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a,       // header comment
])

const BASE_OPTIONS: PdfSignOptions = {
  mode: 'prepare',
  pdf: TINY_PDF,
}

const makeRect = (page = 0) => ({
  x: 100, y: 100, width: 150, height: 40, page,
})

describe('PdfSignController', () => {
  let ctrl: PdfSignController

  beforeEach(() => {
    ctrl = new PdfSignController(BASE_OPTIONS)
  })

  afterEach(() => {
    ctrl.destroy()
  })

  it('starts in idle state', () => {
    expect(ctrl.state).toBe('idle')
  })

  describe('load()', () => {
    it('transitions to ready after loading', async () => {
      await ctrl.load(1)
      expect(ctrl.state).toBe('ready')
    })

    it('sets pdfHash after loading', async () => {
      await ctrl.load(1)
      expect(ctrl.pdfHash).toBeTruthy()
      expect(ctrl.pdfHash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('emits ready event', async () => {
      const handler = vi.fn()
      ctrl.events.on('ready', handler)
      await ctrl.load(1)
      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ pdfHash: ctrl.pdfHash }))
    })

    it('emits error event when pdf is null', async () => {
      const errorCtrl = new PdfSignController({ mode: 'prepare', pdf: null })
      const handler = vi.fn()
      errorCtrl.events.on('error', handler)
      await errorCtrl.load(1)
      expect(handler).toHaveBeenCalledOnce()
      expect(errorCtrl.state).toBe('error')
      errorCtrl.destroy()
    })

    it('emits state-changed events', async () => {
      const states: string[] = []
      ctrl.events.on('state-changed', ({ to }) => states.push(to))
      await ctrl.load(1)
      expect(states).toContain('loading')
      expect(states).toContain('ready')
    })
  })

  describe('Field management', () => {
    beforeEach(async () => {
      await ctrl.load(1)
    })

    it('addField adds a field and emits fields-changed', () => {
      const handler = vi.fn()
      ctrl.events.on('fields-changed', handler)
      const field = ctrl.addField({ type: 'signature', rect: makeRect(), signerId: null })
      expect(ctrl.fields).toHaveLength(1)
      expect(handler).toHaveBeenCalledOnce()
      expect(field.id).toBeTruthy()
    })

    it('updateField updates and emits fields-changed', () => {
      const field = ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      const handler = vi.fn()
      ctrl.events.on('fields-changed', handler)
      ctrl.updateField({ id: field.id, changes: { label: 'Name' } })
      expect(handler).toHaveBeenCalledOnce()
      expect(ctrl.fields[0]!.label).toBe('Name')
    })

    it('deleteField removes and emits fields-changed', () => {
      const field = ctrl.addField({ type: 'checkbox', rect: makeRect(), signerId: null })
      const handler = vi.fn()
      ctrl.events.on('fields-changed', handler)
      ctrl.deleteField(field.id)
      expect(ctrl.fields).toHaveLength(0)
      expect(handler).toHaveBeenCalledOnce()
    })

    it('undo/redo work through the controller', () => {
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      ctrl.undo()
      expect(ctrl.fields).toHaveLength(1)
      ctrl.redo()
      expect(ctrl.fields).toHaveLength(2)
    })

    it('fieldsForPage filters correctly', () => {
      ctrl.addField({ type: 'text', rect: makeRect(0), signerId: null })
      ctrl.addField({ type: 'text', rect: makeRect(1), signerId: null })
      expect(ctrl.fieldsForPage(0)).toHaveLength(1)
      expect(ctrl.fieldsForPage(1)).toHaveLength(1)
    })
  })

  describe('Signer management', () => {
    it('starts with one signer', () => {
      expect(ctrl.signers).toHaveLength(1)
    })

    it('addSigner adds a signer', () => {
      const s = ctrl.addSigner({ name: 'Alice' })
      expect(ctrl.signers).toHaveLength(2)
      expect(s.name).toBe('Alice')
    })

    it('removeSigner reassigns its fields to null', async () => {
      await ctrl.load(1)
      const s = ctrl.addSigner({ name: 'Bob' })
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: s.id })
      ctrl.removeSigner(s.id)
      expect(ctrl.fields[0]!.signerId).toBeNull()
    })
  })

  describe('buildTemplate()', () => {
    it('returns a valid PdfTemplate', async () => {
      await ctrl.load(1)
      ctrl.addField({ type: 'signature', rect: makeRect(), signerId: null })
      const template = ctrl.buildTemplate()
      expect(template.version).toBe('1')
      expect(template.pdfHash).toBe(ctrl.pdfHash)
      expect(template.fields).toHaveLength(1)
      expect(template.signers).toHaveLength(1)
    })

    it('throws if PDF not loaded', () => {
      expect(() => ctrl.buildTemplate()).toThrow('PDF not loaded')
    })

    it('emits template-ready', async () => {
      await ctrl.load(1)
      const handler = vi.fn()
      ctrl.events.on('template-ready', handler)
      ctrl.buildTemplate()
      expect(handler).toHaveBeenCalledOnce()
    })
  })

  describe('Sign mode', () => {
    let signCtrl: PdfSignController

    beforeEach(async () => {
      // First build a template in prepare mode
      const prepCtrl = new PdfSignController(BASE_OPTIONS)
      await prepCtrl.load(1)
      prepCtrl.addField({
        type: 'signature', rect: makeRect(), signerId: 'signer-1', required: true,
      })
      prepCtrl.addField({
        type: 'text', rect: makeRect(), signerId: 'signer-1', required: false,
      })
      const template = prepCtrl.buildTemplate()
      prepCtrl.destroy()

      signCtrl = new PdfSignController({
        mode: 'sign',
        pdf: TINY_PDF,
        template,
        signerId: 'signer-1',
      })
      await signCtrl.load()
    })

    afterEach(() => signCtrl.destroy())

    it('loads template fields in sign mode', () => {
      expect(signCtrl.fields).toHaveLength(2)
    })

    it('sets active signer from options', () => {
      expect(signCtrl.activeSigner?.id).toBe('signer-1')
    })

    it('completeField records a value', () => {
      signCtrl.startSigning('signer-1')
      const fieldId = signCtrl.fields[0]!.id
      signCtrl.completeField(fieldId, 'data:image/png;base64,abc')
      expect(signCtrl.getFieldValue(fieldId)).toBeTruthy()
    })

    it('emits field-completed', () => {
      signCtrl.startSigning('signer-1')
      const handler = vi.fn()
      signCtrl.events.on('field-completed', handler)
      signCtrl.completeField(signCtrl.fields[0]!.id, 'sig-data')
      expect(handler).toHaveBeenCalledOnce()
    })

    it('transitions to complete when all required fields are done', () => {
      signCtrl.startSigning('signer-1')
      const requiredField = signCtrl.fields.find((f) => f.required)!
      signCtrl.completeField(requiredField.id, 'sig-data')
      expect(signCtrl.state).toBe('complete')
    })

    it('signingProgress returns 0 before any completion', () => {
      signCtrl.startSigning('signer-1')
      expect(signCtrl.signingProgress()).toBe(0)
    })

    it('signingProgress returns correct fraction after partial completion', () => {
      signCtrl.startSigning('signer-1')
      signCtrl.completeField(signCtrl.fields[0]!.id, 'val')
      expect(signCtrl.signingProgress()).toBeCloseTo(0.5)
    })

    it('submit emits signing-complete', async () => {
      signCtrl.startSigning('signer-1')
      const requiredField = signCtrl.fields.find((f) => f.required)!
      signCtrl.completeField(requiredField.id, 'sig-data')
      const handler = vi.fn()
      signCtrl.events.on('signing-complete', handler)
      await signCtrl.submit()
      expect(handler).toHaveBeenCalledOnce()
    })

    it('submit throws when required fields are incomplete', async () => {
      signCtrl.startSigning('signer-1')
      // Don't complete any field
      await expect(signCtrl.submit()).rejects.toThrow('required fields are incomplete')
    })

    it('decline emits declined', () => {
      signCtrl.startSigning('signer-1')
      const handler = vi.fn()
      signCtrl.events.on('declined', handler)
      signCtrl.decline('Changed my mind')
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'Changed my mind' }),
      )
    })
  })

  describe('Custom field type registry', () => {
    it('registerFieldType stores the definition', () => {
      ctrl.registerFieldType({
        id: 'myapp:qr-code',
        label: 'QR code',
        icon: 'qrcode',
        defaultWidth: 100,
        defaultHeight: 100,
        serialize: (v) => String(v),
        renderToPdf: async () => {},
      })
      expect(ctrl.getFieldType('myapp:qr-code')).toBeTruthy()
    })

    it('registeredFieldTypes lists all types', () => {
      ctrl.registerFieldType({
        id: 'test:type-a',
        label: 'A',
        icon: 'a',
        defaultWidth: 50,
        defaultHeight: 30,
        serialize: (v) => String(v),
        renderToPdf: async () => {},
      })
      expect(ctrl.registeredFieldTypes.some((t) => t.id === 'test:type-a')).toBe(true)
    })
  })

  describe('Event emitter', () => {
    it('on() returns an unsubscribe function', async () => {
      await ctrl.load(1)
      const handler = vi.fn()
      const unsub = ctrl.events.on('fields-changed', handler)
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      unsub()
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      expect(handler).toHaveBeenCalledOnce() // only the first addField
    })

    it('once() fires only once', async () => {
      await ctrl.load(1)
      const handler = vi.fn()
      ctrl.events.once('fields-changed', handler)
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      expect(handler).toHaveBeenCalledOnce()
    })
  })

  describe('reset()', () => {
    it('clears all state', async () => {
      await ctrl.load(1)
      ctrl.addField({ type: 'text', rect: makeRect(), signerId: null })
      ctrl.reset()
      expect(ctrl.state).toBe('idle')
      expect(ctrl.fields).toHaveLength(0)
      expect(ctrl.pdfHash).toBeNull()
    })
  })
})
