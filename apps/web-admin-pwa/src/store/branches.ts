import { create } from 'zustand'
import { Branch } from '@pos/shared'
import { useAuditStore } from './audit'
import { useOperatorsStore } from './operators'

interface BranchesState {
    branches: Branch[]
    currentBranchId: string | null
    setCurrentBranch: (id: string | null) => void
    addBranch: (branch: Omit<Branch, 'id' | 'createdAt'>) => void
    updateBranch: (id: string, branch: Partial<Branch>) => void
    deleteBranch: (id: string) => void
}

export const useBranchesStore = create<BranchesState>()(
    (set) => ({
            branches: [],
            currentBranchId: null,

            setCurrentBranch: (id) => set({ currentBranchId: id }),

            addBranch: (branchData) => set((state) => {
                const now = new Date().toISOString()
                const newBranch = {
                    ...branchData,
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: branchData.updatedAt || now
                }

                const operator = useOperatorsStore.getState().currentOperator
                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'branch',
                        action: 'CREATE',
                        newData: newBranch,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: newBranch.id
                    })
                }

                const newBranches = [...state.branches, newBranch]
                return {
                    branches: newBranches,
                    currentBranchId: state.currentBranchId || newBranch.id // Auto-select first
                }
            }),

            updateBranch: (id, branchData) => set((state) => {
                const oldBranch = state.branches.find(b => b.id === id)
                if (!oldBranch) return state

                const newBranch = { ...oldBranch, ...branchData, updatedAt: new Date().toISOString() }

                const operator = useOperatorsStore.getState().currentOperator
                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'branch',
                        action: 'UPDATE',
                        oldData: oldBranch,
                        newData: newBranch,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: oldBranch.id
                    })
                }

                return {
                    branches: state.branches.map((b) => b.id === id ? newBranch : b)
                }
            }),

            deleteBranch: (id) => set((state) => {
                const oldBranch = state.branches.find(b => b.id === id)
                if (!oldBranch) return state

                const operator = useOperatorsStore.getState().currentOperator
                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'branch',
                        action: 'DELETE',
                        oldData: oldBranch,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: oldBranch.id
                    })
                }

                const newBranches = state.branches.filter((b) => b.id !== id)
                return {
                    branches: newBranches,
                    // Re-assign default if deleting current
                    currentBranchId: state.currentBranchId === id
                        ? (newBranches[0]?.id || null)
                        : state.currentBranchId
                }
            })
        })
)
