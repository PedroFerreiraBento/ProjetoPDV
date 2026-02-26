import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Sale } from '@pos/shared'
import { useAuditStore } from './audit'

interface SalesState {
    sales: Sale[]
    addSale: (sale: Sale) => void
    getSaleById: (id: string) => Sale | undefined
    voidSale: (id: string, reason: string, operatorName: string) => void
    settleCreditSale: (id: string, payments: import('@pos/shared').SalePayment[]) => void
    clearSales: () => void
}

export const useSalesStore = create<SalesState>()(
    persist(
        (set, get) => ({
            sales: [],
            addSale: (sale) => set((state) => ({ sales: [sale, ...state.sales] })),
            getSaleById: (id) => get().sales.find((s) => s.id === id),
            voidSale: (id, reason, operatorName) => set((state) => {
                const oldSale = state.sales.find(s => s.id === id)
                const newSale = oldSale ? {
                    ...oldSale,
                    status: 'VOIDED' as const,
                    voidReason: reason,
                    voidedBy: operatorName,
                    voidedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                } : null

                if (oldSale && newSale) {
                    useAuditStore.getState().logChange({
                        entity: 'sale',
                        action: 'UPDATE',
                        oldData: oldSale,
                        newData: newSale,
                        operatorId: oldSale.operatorId,
                        operatorName: operatorName,
                        branchId: oldSale.branchId
                    })
                }

                return {
                    sales: state.sales.map(s => s.id === id ? newSale! : s)
                }
            }),
            settleCreditSale: (id, newPayments) => set((state) => ({
                sales: state.sales.map(s =>
                    s.id === id
                        ? { ...s, payments: newPayments, creditSettledAt: new Date().toISOString() }
                        : s
                )
            })),
            clearSales: () => set({ sales: [] }),
        }),
        {
            name: 'pos-sales-storage',
        }
    )
)
