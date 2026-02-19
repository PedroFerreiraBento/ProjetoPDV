import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppRole } from '@pos/shared'

export interface Operator {
    id: string
    name: string
    role: AppRole
    pin: string // In a real app, this should be hashed
    createdAt: string
}

interface OperatorsState {
    operators: Operator[]
    currentOperator: Operator | null
    addOperator: (operator: Omit<Operator, 'id' | 'createdAt'>) => void
    removeOperator: (id: string) => void
    updateOperatorRole: (id: string, newRole: AppRole) => void
    loginOperator: (id: string, pin: string) => boolean
    logoutOperator: () => void
}

export const useOperatorsStore = create<OperatorsState>()(
    persist(
        (set) => ({
            operators: [
                // Default Admin Operator
                {
                    id: 'admin-1',
                    name: 'Admin',
                    role: 'ADMIN',
                    pin: '1234',
                    createdAt: new Date().toISOString(),
                },
            ],
            currentOperator: null,
            addOperator: (newOp) =>
                set((state) => ({
                    operators: [
                        ...state.operators,
                        {
                            ...newOp,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                        },
                    ],
                })),
            removeOperator: (id) =>
                set((state) => ({
                    operators: state.operators.filter((op) => op.id !== id),
                })),
            updateOperatorRole: (id, newRole) =>
                set((state) => ({
                    operators: state.operators.map((op) =>
                        op.id === id ? { ...op, role: newRole } : op
                    ),
                })),
            loginOperator: (id, pin) => {
                let success = false
                set((state) => {
                    const operator = state.operators.find((op) => op.id === id)
                    if (operator && operator.pin === pin) {
                        success = true
                        return { currentOperator: operator }
                    }
                    return { currentOperator: state.currentOperator }
                })
                return success
            },
            logoutOperator: () => set({ currentOperator: null }),
        }),
        {
            name: 'pos-operators-store',
        }
    )
)
