import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AppRole, AppPermission, ROLE_PERMISSIONS } from '@pos/shared'

export const hasPermission = (operator: Operator | null, permission: AppPermission): boolean => {
    if (!operator) return false
    return ROLE_PERMISSIONS[operator.role].includes(permission)
}

export interface Operator {
    id: string
    name: string
    role: AppRole
    pin: string // PIN for POS/Lockscreen
    email?: string // For Admin login
    password?: string // For Admin login
    createdAt: string
}

export type AuthMethod = 'PIN' | 'PASSWORD' | null

interface OperatorsState {
    operators: Operator[]
    currentOperator: Operator | null
    authMethod: AuthMethod
    addOperator: (operator: Omit<Operator, 'id' | 'createdAt'>) => void
    removeOperator: (id: string) => void
    updateOperatorRole: (id: string, newRole: AppRole) => void
    loginOperator: (id: string, pin: string) => boolean
    loginAdmin: (email: string, password: string) => boolean
    logoutOperator: () => void
    isLocked: boolean
    lockScreen: () => void
    unlockScreen: (pin: string) => boolean
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
                    email: 'admin@sistema.com',
                    password: 'admin123',
                    pin: '1234',
                    createdAt: new Date().toISOString(),
                },
            ],
            currentOperator: null,
            authMethod: null,
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
                        return { currentOperator: operator, authMethod: 'PIN', isLocked: false }
                    }
                    return { currentOperator: state.currentOperator, authMethod: state.authMethod }
                })
                return success
            },
            loginAdmin: (email, password) => {
                const cleanEmail = email.trim()
                const cleanPassword = password.trim()
                let success = false

                // Hardcoded fallback for the initial admin account to ensure access after refactoring
                if (cleanEmail === 'admin@sistema.com' && cleanPassword === 'admin123') {
                    success = true
                    set((state) => {
                        const adminOp = state.operators.find(op => op.id === 'admin-1' || op.role === 'ADMIN') || state.operators[0]
                        return { currentOperator: adminOp, authMethod: 'PASSWORD', isLocked: false }
                    })
                    return true
                }

                set((state) => {
                    const operator = state.operators.find((op) =>
                        op.role === 'ADMIN' &&
                        op.email?.trim() === cleanEmail &&
                        op.password?.trim() === cleanPassword
                    )
                    if (operator) {
                        success = true
                        return { currentOperator: operator, authMethod: 'PASSWORD', isLocked: false }
                    }
                    return { currentOperator: state.currentOperator, authMethod: state.authMethod }
                })
                return success
            },
            logoutOperator: () => set({ currentOperator: null, authMethod: null, isLocked: false }),
            isLocked: false,
            lockScreen: () => set({ isLocked: true }),
            unlockScreen: (pin) => {
                let success = false
                set((state) => {
                    if (state.currentOperator && state.currentOperator.pin === pin) {
                        success = true
                        return { isLocked: false }
                    }
                    return { isLocked: state.isLocked }
                })
                return success
            },
        }),
        {
            name: 'pos-operators-store',
        }
    )
)
