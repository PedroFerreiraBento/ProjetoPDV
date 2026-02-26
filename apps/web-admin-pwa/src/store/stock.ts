import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StockMovement } from '@pos/shared'

interface StockStore {
    movements: StockMovement[]
    addMovement: (movement: StockMovement) => void
    getMovementsByProduct: (productId: string) => StockMovement[]
    clearAllMovements: () => void // Handy for testing
}

export const useStockStore = create<StockStore>()(
    persist(
        (set, get) => ({
            movements: [],
            addMovement: (movement) => {
                set((state) => ({
                    movements: [movement, ...state.movements]
                }))
            },
            getMovementsByProduct: (productId) => {
                return get().movements.filter(m => m.productId === productId)
            },
            clearAllMovements: () => set({ movements: [] })
        }),
        {
            name: 'pos-stock-storage',
            version: 1
        }
    )
)
