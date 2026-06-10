import { useEffect, useRef } from 'react'
import { DragEngine, type DragEngineOptions } from '@pdf-sign/core'

export function useDragEngine(options: DragEngineOptions = {}): DragEngine {
  const engineRef = useRef<DragEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = new DragEngine(options)
  }

  useEffect(() => {
    const engine = engineRef.current!
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  return engineRef.current as DragEngine
}
