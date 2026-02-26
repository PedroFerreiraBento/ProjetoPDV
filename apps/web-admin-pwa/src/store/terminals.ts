import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Terminal } from '@pos/shared'
import { useAuditStore } from './audit'
import { useOperatorsStore } from './operators'
import { useBranchesStore } from './branches'

interface TerminalsState {
    terminals: Terminal[]
    currentTerminalId: string | null
    setCurrentTerminal: (id: string | null) => void
    addTerminal: (terminal: Omit<Terminal, 'id' | 'createdAt'>) => void
    updateTerminal: (id: string, terminal: Partial<Terminal>) => void
    deleteTerminal: (id: string) => void
    linkedTerminalId: string | null
    linkTerminal: (id: string) => void
    unlinkTerminal: () => void
}

export const useTerminalsStore = create<TerminalsState>()(
    persist(
        (set) => ({
            terminals: [],
            currentTerminalId: null,
            linkedTerminalId: null,

            setCurrentTerminal: (id) => set({ currentTerminalId: id }),

            linkTerminal: (id) => set({ linkedTerminalId: id }),
            unlinkTerminal: () => set({ linkedTerminalId: null }),

            addTerminal: (terminalData) => set((state) => {
                const newTerminal = {
                    ...terminalData,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString()
                }

                const operator = useOperatorsStore.getState().currentOperator
                const branchId = useBranchesStore.getState().currentBranchId

                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'terminal',
                        action: 'CREATE',
                        newData: newTerminal,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: branchId || undefined
                    })
                }

                return {
                    terminals: [...state.terminals, newTerminal]
                }
            }),

            updateTerminal: (id, terminalData) => set((state) => {
                const oldTerminal = state.terminals.find(t => t.id === id)
                if (!oldTerminal) return state

                const newTerminal = { ...oldTerminal, ...terminalData }

                const operator = useOperatorsStore.getState().currentOperator
                const branchId = useBranchesStore.getState().currentBranchId

                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'terminal',
                        action: 'UPDATE',
                        oldData: oldTerminal,
                        newData: newTerminal,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: branchId || undefined
                    })
                }

                return {
                    terminals: state.terminals.map((t) => t.id === id ? newTerminal : t)
                }
            }),

            deleteTerminal: (id) => set((state) => {
                const oldTerminal = state.terminals.find(t => t.id === id)
                if (!oldTerminal) return state

                const operator = useOperatorsStore.getState().currentOperator
                const branchId = useBranchesStore.getState().currentBranchId

                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'terminal',
                        action: 'DELETE',
                        oldData: oldTerminal,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: branchId || undefined
                    })
                }

                return {
                    terminals: state.terminals.filter((t) => t.id !== id),
                    currentTerminalId: state.currentTerminalId === id ? null : state.currentTerminalId
                }
            })
        }),
        {
            name: 'pos-terminals'
        }
    )
)
