import { create } from 'zustand'
import { PurchaseOrder } from '@pos/shared'

interface PurchasesStore {
    orders: PurchaseOrder[]
    addOrder: (order: PurchaseOrder) => void
    updateOrder: (id: string, data: Partial<PurchaseOrder>) => void
    receiveOrder: (id: string, receivedBy: string) => void
    cancelOrder: (id: string) => void
}

export const usePurchasesStore = create<PurchasesStore>()(
    (set) => ({
            orders: [],
            addOrder: (order) => {
                set((state) => ({
                    orders: [order, ...state.orders]
                }))
            },
            updateOrder: (id, data) => {
                set((state) => ({
                    orders: state.orders.map(o =>
                        o.id === id ? { ...o, ...data } : o
                    )
                }))
            },
            receiveOrder: (id, receivedBy) => {
                set((state) => ({
                    orders: state.orders.map(o =>
                        o.id === id
                            ? { ...o, status: 'RECEIVED' as const, receivedAt: new Date().toISOString(), receivedBy }
                            : o
                    )
                }))
            },
            cancelOrder: (id) => {
                set((state) => ({
                    orders: state.orders.map(o =>
                        o.id === id ? { ...o, status: 'CANCELLED' as const } : o
                    )
                }))
            }
        })
)
