import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@pos/shared'

interface ProductsState {
    products: Product[]
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
    addProducts: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void
    updateProduct: (id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => void
    deleteProduct: (id: string) => void
}

export const useProductsStore = create<ProductsState>()(
    persist(
        (set) => ({
            products: [
                {
                    id: 'prod-1',
                    name: 'Café Expresso',
                    sku: 'CAFE-EXP-01',
                    price: 550, // R$ 5,50 represented in cents
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'prod-2',
                    name: 'Pão de Queijo',
                    sku: 'PAO-QUE-01',
                    price: 400, // R$ 4,00 represented in cents
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'prod-3',
                    name: 'Água Mineral com Gás 500ml',
                    sku: 'AGUA-GAS-500',
                    price: 350, // R$ 3,50 represented in cents
                    barcode: '7891010101010',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            ],
            addProduct: (newProd) =>
                set((state) => ({
                    products: [
                        ...state.products,
                        {
                            ...newProd,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    ],
                })),
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
                set((state) => ({
                    products: state.products.map((prod) =>
                        prod.id === id
                            ? { ...prod, ...updatedFields, updatedAt: new Date().toISOString() }
                            : prod
                    ),
                })),
            deleteProduct: (id) =>
                set((state) => ({
                    products: state.products.filter((prod) => prod.id !== id),
                })),
        }),
        {
            name: 'pos-products-store',
        }
    )
)
