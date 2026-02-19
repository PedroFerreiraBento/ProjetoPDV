import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Category } from '@pos/shared'

interface CategoriesState {
    categories: Category[]
    addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void
    updateCategory: (id: string, category: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => void
    deleteCategory: (id: string) => void
}

export const useCategoriesStore = create<CategoriesState>()(
    persist(
        (set) => ({
            categories: [
                {
                    id: 'cat-1',
                    name: 'Bebidas Quentes',
                    color: 'orange',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'cat-2',
                    name: 'Bebidas Geladas',
                    color: 'blue',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'cat-3',
                    name: 'Salgados',
                    color: 'yellow',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'cat-4',
                    name: 'Doces & Sobremesas',
                    color: 'pink',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            ],
            addCategory: (newCat) =>
                set((state) => ({
                    categories: [
                        ...state.categories,
                        {
                            ...newCat,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    ],
                })),
            updateCategory: (id, updatedFields) =>
                set((state) => ({
                    categories: state.categories.map((cat) =>
                        cat.id === id
                            ? { ...cat, ...updatedFields, updatedAt: new Date().toISOString() }
                            : cat
                    ),
                })),
            deleteCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((cat) => cat.id !== id),
                })),
        }),
        {
            name: 'pos-categories-store',
        }
    )
)
