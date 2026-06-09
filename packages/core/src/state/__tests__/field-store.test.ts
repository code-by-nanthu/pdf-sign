import { describe, it, expect, beforeEach } from 'vitest'
import { FieldStore } from '../field-store.js'
import type { PdfRect } from '../../types/index.js'

const makeRect = (page = 0): PdfRect => ({
  x: 100, y: 100, width: 150, height: 40, page,
})

describe('FieldStore', () => {
  let store: FieldStore

  beforeEach(() => {
    store = new FieldStore()
  })

  it('starts with no fields', () => {
    expect(store.fields).toHaveLength(0)
  })

  describe('addField', () => {
    it('adds a field and returns it', () => {
      const field = store.addField({
        type: 'signature',
        rect: makeRect(),
        signerId: 'signer-1',
      })
      expect(field.id).toBeTruthy()
      expect(field.type).toBe('signature')
      expect(store.fields).toHaveLength(1)
    })

    it('assigns a generated ID', () => {
      const a = store.addField({ type: 'text', rect: makeRect(), signerId: null })
      const b = store.addField({ type: 'text', rect: makeRect(), signerId: null })
      expect(a.id).not.toBe(b.id)
    })

    it('uses label from payload when provided', () => {
      const field = store.addField({
        type: 'text',
        rect: makeRect(),
        signerId: null,
        label: 'Full name',
      })
      expect(field.label).toBe('Full name')
    })

    it('defaults label to field type when not provided', () => {
      const field = store.addField({ type: 'date-signed', rect: makeRect(), signerId: null })
      expect(field.label).toBe('date-signed')
    })
  })

  describe('updateField', () => {
    it('updates a field by id', () => {
      const field = store.addField({ type: 'text', rect: makeRect(), signerId: null })
      const updated = store.updateField({ id: field.id, changes: { label: 'Email' } })
      expect(updated?.label).toBe('Email')
    })

    it('returns undefined for unknown id', () => {
      expect(store.updateField({ id: 'nonexistent', changes: { label: 'X' } })).toBeUndefined()
    })

    it('does not mutate the id', () => {
      const field = store.addField({ type: 'text', rect: makeRect(), signerId: null })
      const updated = store.updateField({ id: field.id, changes: { id: 'hacked' } as never })
      expect(updated?.id).toBe(field.id)
    })
  })

  describe('moveField', () => {
    it('updates the rect', () => {
      const field = store.addField({ type: 'signature', rect: makeRect(0), signerId: null })
      const newRect: PdfRect = { x: 200, y: 300, width: 150, height: 40, page: 1 }
      const moved = store.moveField(field.id, newRect)
      expect(moved?.rect).toEqual(newRect)
    })
  })

  describe('deleteField', () => {
    it('removes a field', () => {
      const field = store.addField({ type: 'checkbox', rect: makeRect(), signerId: null })
      expect(store.deleteField(field.id)).toBe(true)
      expect(store.fields).toHaveLength(0)
    })

    it('returns false for unknown id', () => {
      expect(store.deleteField('nonexistent')).toBe(false)
    })
  })

  describe('fieldsOnPage', () => {
    it('filters by page', () => {
      store.addField({ type: 'text', rect: makeRect(0), signerId: null })
      store.addField({ type: 'text', rect: makeRect(0), signerId: null })
      store.addField({ type: 'text', rect: makeRect(1), signerId: null })
      expect(store.fieldsOnPage(0)).toHaveLength(2)
      expect(store.fieldsOnPage(1)).toHaveLength(1)
      expect(store.fieldsOnPage(2)).toHaveLength(0)
    })
  })

  describe('fieldsForSigner', () => {
    it('filters by signer', () => {
      store.addField({ type: 'signature', rect: makeRect(), signerId: 'alice' })
      store.addField({ type: 'signature', rect: makeRect(), signerId: 'bob' })
      store.addField({ type: 'text', rect: makeRect(), signerId: 'alice' })
      expect(store.fieldsForSigner('alice')).toHaveLength(2)
      expect(store.fieldsForSigner('bob')).toHaveLength(1)
    })
  })

  describe('reassignFields', () => {
    it('reassigns fields from one signer to another', () => {
      store.addField({ type: 'signature', rect: makeRect(), signerId: 'alice' })
      store.addField({ type: 'text', rect: makeRect(), signerId: 'alice' })
      store.addField({ type: 'text', rect: makeRect(), signerId: 'bob' })
      store.reassignFields('alice', 'charlie')
      expect(store.fieldsForSigner('alice')).toHaveLength(0)
      expect(store.fieldsForSigner('charlie')).toHaveLength(2)
      expect(store.fieldsForSigner('bob')).toHaveLength(1)
    })

    it('can reassign to null (unassign)', () => {
      store.addField({ type: 'signature', rect: makeRect(), signerId: 'alice' })
      store.reassignFields('alice', null)
      expect(store.unassignedFields()).toHaveLength(1)
    })
  })

  describe('undo / redo', () => {
    it('undoes an addField', () => {
      store.addField({ type: 'text', rect: makeRect(), signerId: null })
      store.undo()
      expect(store.fields).toHaveLength(0)
    })

    it('redoes after undo', () => {
      store.addField({ type: 'text', rect: makeRect(), signerId: null })
      store.undo()
      store.redo()
      expect(store.fields).toHaveLength(1)
    })

    it('canUndo is false on empty store', () => {
      expect(store.canUndo).toBe(false)
    })

    it('undo traverses multiple steps', () => {
      store.addField({ type: 'text', rect: makeRect(), signerId: null })
      store.addField({ type: 'text', rect: makeRect(), signerId: null })
      store.addField({ type: 'text', rect: makeRect(), signerId: null })
      store.undo()
      store.undo()
      expect(store.fields).toHaveLength(1)
    })
  })

  describe('loadFields', () => {
    it('replaces all fields and resets history', () => {
      store.addField({ type: 'text', rect: makeRect(), signerId: null })
      const newFields = [
        { id: 'f1', type: 'signature' as const, rect: makeRect(), signerId: null,
          label: 'Sig', required: true },
      ]
      store.loadFields(newFields)
      expect(store.fields).toHaveLength(1)
      expect(store.canUndo).toBe(false)
    })
  })
})
