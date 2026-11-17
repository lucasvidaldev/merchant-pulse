'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { OperationScope } from '@/lib/operation-scope'

type OperationContextValue = {
  operation: OperationScope
  setOperation: (operation: OperationScope) => void
}

const OperationContext = createContext<OperationContextValue | null>(null)

export function OperationProvider({ children }: { children: ReactNode }) {
  const [operation, setOperation] = useState<OperationScope>('brasil')
  const value = useMemo(() => ({ operation, setOperation }), [operation])
  return <OperationContext.Provider value={value}>{children}</OperationContext.Provider>
}

export function useOperation() {
  const value = useContext(OperationContext)
  if (!value) throw new Error('O seletor de operação precisa estar dentro de OperationProvider.')
  return value
}
