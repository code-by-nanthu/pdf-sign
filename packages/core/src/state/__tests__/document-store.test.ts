import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentStore } from '../document-store.js'

describe('DocumentStore', () => {
  let store: DocumentStore

  beforeEach(() => {
    store = new DocumentStore()
  })

  it('starts in idle state', () => {
    expect(store.state).toBe('idle')
  })

  it('transitions idle → loading', () => {
    store.transition('loading')
    expect(store.state).toBe('loading')
  })

  it('transitions loading → ready', () => {
    store.transition('loading')
    store.transition('ready')
    expect(store.state).toBe('ready')
  })

  it('transitions ready → editing → signing → complete → submitting → done', () => {
    store.transition('loading')
    store.transition('ready')
    store.transition('editing')
    store.transition('signing')
    store.transition('complete')
    store.transition('submitting')
    store.transition('done')
    expect(store.state).toBe('done')
  })

  it('throws on invalid transition', () => {
    expect(() => store.transition('done')).toThrow(/Invalid state transition/)
  })

  it('tryTransition returns success:false without throwing', () => {
    const result = store.tryTransition('done')
    expect(result.success).toBe(false)
    expect(store.state).toBe('idle') // unchanged
  })

  it('tryTransition returns success:true and previous state', () => {
    const result = store.tryTransition('loading')
    expect(result.success).toBe(true)
    if (result.success) expect(result.from).toBe('idle')
  })

  it('is() matches current state', () => {
    expect(store.is('idle')).toBe(true)
    expect(store.is('loading', 'idle')).toBe(true)
    expect(store.is('done')).toBe(false)
  })

  it('hasDocument is false in idle', () => {
    expect(store.hasDocument).toBe(false)
  })

  it('hasDocument is true after loading', () => {
    store.transition('loading')
    store.transition('ready')
    expect(store.hasDocument).toBe(true)
  })

  it('isInteractive is true in editing', () => {
    store.transition('loading')
    store.transition('ready')
    store.transition('editing')
    expect(store.isInteractive).toBe(true)
  })

  it('records transition history', () => {
    store.transition('loading')
    store.transition('ready')
    expect(store.transitionHistory).toHaveLength(2)
    expect(store.transitionHistory[0]).toMatchObject({ from: 'idle', to: 'loading' })
  })

  it('reset clears state and history', () => {
    store.transition('loading')
    store.transition('ready')
    store.reset()
    expect(store.state).toBe('idle')
    expect(store.transitionHistory).toHaveLength(0)
  })

  it('error state can return to idle or loading', () => {
    store.transition('loading')
    store.transition('error')
    expect(store.tryTransition('idle').success).toBe(true)
  })
})
