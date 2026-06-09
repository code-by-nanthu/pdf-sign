import type { PdfSignEvents } from '../types/index.js'

type EventKey = keyof PdfSignEvents
type EventPayload<K extends EventKey> = PdfSignEvents[K]
type Listener<K extends EventKey> = (payload: EventPayload<K>) => void

/**
 * Strongly-typed event emitter backed by EventTarget.
 * Works in browser and Node ≥ 18 (EventTarget is global in both).
 */
export class TypedEventEmitter {
  private readonly target = new EventTarget()
  private readonly listenerMap = new Map<string, WeakMap<Listener<EventKey>, EventListener>>()

  on<K extends EventKey>(event: K, listener: Listener<K>): () => void {
    const handler: EventListener = (e) => {
      listener((e as CustomEvent<EventPayload<K>>).detail)
    }

    if (!this.listenerMap.has(event)) {
      this.listenerMap.set(event, new WeakMap())
    }
    this.listenerMap.get(event)!.set(listener as Listener<EventKey>, handler)
    this.target.addEventListener(event, handler)

    // Return an unsubscribe function
    return () => this.off(event, listener)
  }

  off<K extends EventKey>(event: K, listener: Listener<K>): void {
    const handler = this.listenerMap.get(event)?.get(listener as Listener<EventKey>)
    if (handler) {
      this.target.removeEventListener(event, handler)
      this.listenerMap.get(event)?.delete(listener as Listener<EventKey>)
    }
  }

  once<K extends EventKey>(event: K, listener: Listener<K>): () => void {
    const unsub = this.on(event, (payload) => {
      listener(payload)
      unsub()
    })
    return unsub
  }

  emit<K extends EventKey>(event: K, payload: EventPayload<K>): void {
    this.target.dispatchEvent(new CustomEvent(event, { detail: payload }))
  }

  /** Remove all listeners. Call on destroy. */
  removeAllListeners(): void {
    this.listenerMap.clear()
  }
}
