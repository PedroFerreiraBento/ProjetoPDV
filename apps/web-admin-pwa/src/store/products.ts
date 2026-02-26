import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@pos/shared'
import { useAuditStore } from './audit'
import { useOperatorsStore } from './operators'
import { useBranchesStore } from './branches'

interface ProductsState {
    products: Product[]
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
    addProducts: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void
    updateProduct: (id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => void
    bulkUpdateProducts: (updates: { id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> }[]) => void
    updateStock: (id: string, delta: number, variantId?: string, branchId?: string) => void
    deleteProduct: (id: string) => void
}

export const useProductsStore = create<ProductsState>()(
    persist(
        (set) => ({
            products: [],
            addProduct: (newProd) =>
                set((state) => {
                    const id = crypto.randomUUID()
                    const createdAt = new Date().toISOString()
                    const updatedAt = createdAt
                    const product = { ...newProd, id, createdAt, updatedAt } as Product

                    const operator = useOperatorsStore.getState().currentOperator
                    const branchId = useBranchesStore.getState().currentBranchId

                    if (operator) {
                        useAuditStore.getState().logChange({
                            entity: 'product',
                            action: 'CREATE',
                            newData: product,
                            operatorId: operator.id,
                            operatorName: operator.name,
                            branchId: branchId || undefined
                        })
                    }

                    return {
                        products: [...state.products, product],
                    }
                }),
            addProducts: (newProducts) =>
                set((state) => ({
                    products: [
                        ...state.products,
                        ...newProducts.map((p) => ({
                            ...p,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        })),
                    ],
                })),
            updateProduct: (id, updatedFields) =>
                set((state) => {
                    const oldProd = state.products.find(p => p.id === id)
                    if (!oldProd) return state

                    const newProd = { ...oldProd, ...updatedFields, updatedAt: new Date().toISOString() }

                    const operator = useOperatorsStore.getState().currentOperator
                    const branchId = useBranchesStore.getState().currentBranchId

                    if (operator) {
                        useAuditStore.getState().logChange({
                            entity: 'product',
                            action: 'UPDATE',
                            oldData: oldProd,
                            newData: newProd,
                            operatorId: operator.id,
                            operatorName: operator.name,
                            branchId: branchId || undefined
                        })
                    }

                    return {
                        products: state.products.map((prod) => prod.id === id ? newProd : prod),
                    }
                }),
            bulkUpdateProducts: (updates) =>
                set((state) => ({
                    products: state.products.map((prod) => {
                        const update = updates.find((u) => u.id === prod.id)
                        return update
                            ? { ...prod, ...update.product, updatedAt: new Date().toISOString() }
                            : prod
                    }),
                })),

            updateStock: (id, delta, variantId, branchId) =>
                set((state) => ({
                    products: state.products.map((prod) => {
                        if (prod.id !== id) return prod

                        if (variantId && prod.variants) {
                            return {
                                ...prod,
                                variants: prod.variants.map((v) => {
                                    if (v.id !== variantId) return v

                                    let newStock = (v.stock || 0) + delta
                                    let newBranchStocks = { ...(v.branchStocks || {}) }
                                    if (branchId) {
                                        newBranchStocks[branchId] = (newBranchStocks[branchId] || 0) + delta
                                    }

                                    let newBatches = v.batches ? [...v.batches] : []

                                    if (v.trackBatches && delta < 0 && newBatches.length > 0) {
                                        let amountToDeduct = Math.abs(delta)
                                        // Sort ascending by expiration date (FIFO)
                                        newBatches.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())

                                        for (let i = 0; i < newBatches.length; i++) {
                                            if (amountToDeduct <= 0) break
                                            const batch = newBatches[i]
                                            if (batch.stock > 0) {
                                                const deduc = Math.min(batch.stock, amountToDeduct)
                                                batch.stock -= deduc
                                                amountToDeduct -= deduc
                                            }
                                        }
                                    }

                                    return {
                                        ...v,
                                        stock: newStock,
                                        branchStocks: Object.keys(newBranchStocks).length > 0 ? newBranchStocks : v.branchStocks,
                                        batches: newBatches.length > 0 ? newBatches : v.batches
                                    }
                                }),
                                updatedAt: new Date().toISOString(),
                            }
                        }

                        let newStock = (prod.stock || 0) + delta
                        let newBranchStocks = { ...(prod.branchStocks || {}) }
                        if (branchId) {
                            newBranchStocks[branchId] = (newBranchStocks[branchId] || 0) + delta
                        }

                        let newBatches = prod.batches ? [...prod.batches] : []

                        if (prod.trackBatches && delta < 0 && newBatches.length > 0) {
                            let amountToDeduct = Math.abs(delta)
                            // Sort ascending by expiration date (FIFO)
                            newBatches.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())

                            for (let i = 0; i < newBatches.length; i++) {
                                if (amountToDeduct <= 0) break
                                const batch = newBatches[i]
                                if (batch.stock > 0) {
                                    const deduc = Math.min(batch.stock, amountToDeduct)
                                    batch.stock -= deduc
                                    amountToDeduct -= deduc
                                }
                            }
                        }

                        return {
                            ...prod,
                            stock: newStock,
                            branchStocks: Object.keys(newBranchStocks).length > 0 ? newBranchStocks : prod.branchStocks,
                            batches: newBatches.length > 0 ? newBatches : prod.batches,
                            updatedAt: new Date().toISOString(),
                        }
                    }),
                })),

            deleteProduct: (id) =>
                set((state) => {
                    const oldProd = state.products.find(p => p.id === id)
                    if (!oldProd) return state

                    const operator = useOperatorsStore.getState().currentOperator
                    const branchId = useBranchesStore.getState().currentBranchId

                    if (operator) {
                        useAuditStore.getState().logChange({
                            entity: 'product',
                            action: 'DELETE',
                            oldData: oldProd,
                            operatorId: operator.id,
                            operatorName: operator.name,
                            branchId: branchId || undefined
                        })
                    }

                    return {
                        products: state.products.filter((prod) => prod.id !== id),
                    }
                }),
        }),
        {
            name: 'pos-products-store',
        }
    )
)
