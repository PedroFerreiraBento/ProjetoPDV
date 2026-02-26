import { create } from 'zustand'
import { Supplier } from '@pos/shared'

interface SuppliersStore {
    suppliers: Supplier[]
    addSupplier: (supplier: Supplier) => void
    updateSupplier: (id: string, data: Partial<Supplier>) => void
    removeSupplier: (id: string) => void
}

export const useSuppliersStore = create<SuppliersStore>()(
    (set) => ({
            suppliers: [],
            addSupplier: (supplier) => {
                set((state) => ({
                    suppliers: [...state.suppliers, supplier]
                }))
            },
            updateSupplier: (id, data) => {
                set((state) => ({
                    suppliers: state.suppliers.map(s =>
                        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
                    )
                }))
            },
            removeSupplier: (id) => {
                set((state) => ({
                    suppliers: state.suppliers.filter(s => s.id !== id)
                }))
            }
        })
)
