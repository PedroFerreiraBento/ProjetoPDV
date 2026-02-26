import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Customer } from '@pos/shared'
import { useAuditStore } from './audit'
import { useOperatorsStore } from './operators'
import { useBranchesStore } from './branches'

interface CustomersStore {
    customers: Customer[]
    addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer
    updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void
    deleteCustomer: (id: string) => void
    findByCpf: (cpf: string) => Customer | undefined
    findByPhone: (phone: string) => Customer | undefined
    searchCustomers: (query: string) => Customer[]
}

export const useCustomersStore = create<CustomersStore>()(
    persist(
        (set, get) => ({
            customers: [],

            addCustomer: (data) => {
                const now = new Date().toISOString()
                const customer: Customer = {
                    ...data,
                    id: crypto.randomUUID(),
                    createdAt: now,
                    updatedAt: now,
                }

                const operator = useOperatorsStore.getState().currentOperator
                const branchId = useBranchesStore.getState().currentBranchId

                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'customer',
                        action: 'CREATE',
                        newData: customer,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: branchId || undefined
                    })
                }

                set((state) => ({ customers: [...state.customers, customer] }))
                return customer
            },

            updateCustomer: (id, updates) => set((state) => {
                const oldCust = state.customers.find(c => c.id === id)
                if (!oldCust) return state

                const newCust = { ...oldCust, ...updates, updatedAt: new Date().toISOString() }

                const operator = useOperatorsStore.getState().currentOperator
                const branchId = useBranchesStore.getState().currentBranchId

                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'customer',
                        action: 'UPDATE',
                        oldData: oldCust,
                        newData: newCust,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: branchId || undefined
                    })
                }

                return {
                    customers: state.customers.map(c => c.id === id ? newCust : c)
                }
            }),

            deleteCustomer: (id) => set((state) => {
                const oldCust = state.customers.find(c => c.id === id)
                if (!oldCust) return state

                const operator = useOperatorsStore.getState().currentOperator
                const branchId = useBranchesStore.getState().currentBranchId

                if (operator) {
                    useAuditStore.getState().logChange({
                        entity: 'customer',
                        action: 'DELETE',
                        oldData: oldCust,
                        operatorId: operator.id,
                        operatorName: operator.name,
                        branchId: branchId || undefined
                    })
                }

                return {
                    customers: state.customers.filter(c => c.id !== id)
                }
            }),

            findByCpf: (cpf) => {
                const normalized = cpf.replace(/\D/g, '')
                return get().customers.find(c => c.cpf?.replace(/\D/g, '') === normalized)
            },

            findByPhone: (phone) => {
                const normalized = phone.replace(/\D/g, '')
                return get().customers.find(c => c.phone?.replace(/\D/g, '') === normalized)
            },

            searchCustomers: (query) => {
                const q = query.toLowerCase().replace(/\D/g, '')
                const qText = query.toLowerCase()
                return get().customers.filter(c =>
                    c.name.toLowerCase().includes(qText) ||
                    c.cpf?.replace(/\D/g, '').includes(q) ||
                    c.phone?.replace(/\D/g, '').includes(q) ||
                    c.email?.toLowerCase().includes(qText)
                )
            },
        }),
        { name: 'pos-customers' }
    )
)
