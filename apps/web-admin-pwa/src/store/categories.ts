import { create } from 'zustand'
import { Category } from '@pos/shared'
import { useAuditStore } from './audit'
import { useOperatorsStore } from './operators'
import { useBranchesStore } from './branches'

interface CategoriesState {
    categories: Category[]
    addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void
    updateCategory: (id: string, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => void
    deleteCategory: (id: string) => void
}

export const useCategoriesStore = create<CategoriesState>()(
    (set) => ({
            categories: [],
            addCategory: (newCat) =>
                set((state) => {
                    const id = crypto.randomUUID()
                    const createdAt = new Date().toISOString()
                    const updatedAt = createdAt
                    const category = { ...newCat, id, createdAt, updatedAt } as Category

                    const operator = useOperatorsStore.getState().currentOperator
                    const branchId = useBranchesStore.getState().currentBranchId

                    if (operator) {
                        useAuditStore.getState().logChange({
                            entity: 'category',
                            action: 'CREATE',
                            newData: category,
                            operatorId: operator.id,
                            operatorName: operator.name,
                            branchId: branchId || undefined
                        })
                    }

                    return {
                        categories: [...state.categories, category],
                    }
                }),
            updateCategory: (id, updatedFields) =>
                set((state) => {
                    const oldCat = state.categories.find(c => c.id === id)
                    if (!oldCat) return state

                    const newCat = { ...oldCat, ...updatedFields, updatedAt: new Date().toISOString() }

                    const operator = useOperatorsStore.getState().currentOperator
                    const branchId = useBranchesStore.getState().currentBranchId

                    if (operator) {
                        useAuditStore.getState().logChange({
                            entity: 'category',
                            action: 'UPDATE',
                            oldData: oldCat,
                            newData: newCat,
                            operatorId: operator.id,
                            operatorName: operator.name,
                            branchId: branchId || undefined
                        })
                    }

                    return {
                        categories: state.categories.map((cat) => cat.id === id ? newCat : cat),
                    }
                }),
            deleteCategory: (id) =>
                set((state) => {
                    const oldCat = state.categories.find(c => c.id === id)
                    if (!oldCat) return state

                    const operator = useOperatorsStore.getState().currentOperator
                    const branchId = useBranchesStore.getState().currentBranchId

                    if (operator) {
                        useAuditStore.getState().logChange({
                            entity: 'category',
                            action: 'DELETE',
                            oldData: oldCat,
                            operatorId: operator.id,
                            operatorName: operator.name,
                            branchId: branchId || undefined
                        })
                    }

                    return {
                        categories: state.categories.filter((cat) => cat.id !== id),
                    }
                }),
        })
)
