import { describe, it, expect, beforeEach } from 'vitest'
import { UndoRedoStack } from '../history.js'

describe('UndoRedoStack', () => {
  let stack: UndoRedoStack<{ value: number }>

  beforeEach(() => {
    stack = new UndoRedoStack(5)
    stack.reset({ value: 0 })
  })

  it('starts with the initial state', () => {
    expect(stack.currentState?.value).toBe(0)
  })

  it('commits a new state', () => {
    stack.commit({ value: 1 })
    expect(stack.currentState?.value).toBe(1)
  })

  it('canUndo is false with only one state', () => {
    expect(stack.canUndo).toBe(false)
  })

  it('canUndo is true after committing a second state', () => {
    stack.commit({ value: 1 })
    expect(stack.canUndo).toBe(true)
  })

  it('undo returns the previous state', () => {
    stack.commit({ value: 1 })
    stack.commit({ value: 2 })
    const result = stack.undo()
    expect(result?.value).toBe(1)
    expect(stack.currentState?.value).toBe(1)
  })

  it('redo restores the undone state', () => {
    stack.commit({ value: 1 })
    stack.commit({ value: 2 })
    stack.undo()
    const result = stack.redo()
    expect(result?.value).toBe(2)
  })

  it('commit clears the redo stack', () => {
    stack.commit({ value: 1 })
    stack.commit({ value: 2 })
    stack.undo()
    stack.commit({ value: 3 }) // new branch
    expect(stack.canRedo).toBe(false)
  })

  it('respects capacity — evicts oldest', () => {
    for (let i = 1; i <= 6; i++) stack.commit({ value: i })
    // capacity=5, so we have states 2-6 (6 entries including reset, then commit evicts)
    expect(stack.historySize).toBeLessThanOrEqual(5)
  })

  it('undo returns undefined when nothing to undo', () => {
    expect(stack.undo()).toBeUndefined()
  })

  it('redo returns undefined when nothing to redo', () => {
    expect(stack.redo()).toBeUndefined()
  })

  it('clones state so mutations do not corrupt history', () => {
    const state = { value: 1 }
    stack.commit(state)
    state.value = 99 // mutate original
    expect(stack.currentState?.value).toBe(1) // history unaffected
  })

  it('reset clears all history to a single state', () => {
    stack.commit({ value: 1 })
    stack.commit({ value: 2 })
    stack.reset({ value: 0 })
    expect(stack.canUndo).toBe(false)
    expect(stack.currentState?.value).toBe(0)
  })

  it('multiple undos traverse history correctly', () => {
    stack.commit({ value: 1 })
    stack.commit({ value: 2 })
    stack.commit({ value: 3 })
    stack.undo()
    stack.undo()
    expect(stack.currentState?.value).toBe(1)
  })
})
