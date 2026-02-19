import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Unit } from '@pos/shared'

interface UnitsState {
    units: Unit[]
    addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void
    updateUnit: (id: string, unit: Partial<Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>) => void
    deleteUnit: (id: string) => void
}

export const useUnitsStore = create<UnitsState>()(
    persist(
        (set) => ({
            units: [
                {
                    id: 'unit-1',
                    name: 'Unidade',
                    abbreviation: 'un',
                    allowFractions: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'unit-2',
                    name: 'Quilograma',
                    abbreviation: 'kg',
                    allowFractions: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'unit-3',
                    name: 'Grama',
                    abbreviation: 'g',
                    allowFractions: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'unit-4',
                    name: 'Litro',
                    abbreviation: 'L',
                    allowFractions: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: 'unit-5',
                    name: 'Caixa',
                    abbreviation: 'cx',
                    allowFractions: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            ],
            addUnit: (newUnit) =>
                set((state) => ({
                    units: [
                        ...state.units,
                        {
                            ...newUnit,
                            id: crypto.randomUUID(),
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        },
                    ],
                })),
            updateUnit: (id, updatedFields) =>
                set((state) => ({
                    units: state.units.map((unit) =>
                        unit.id === id
                            ? { ...unit, ...updatedFields, updatedAt: new Date().toISOString() }
                            : unit
                    ),
                })),
            deleteUnit: (id) =>
                set((state) => ({
                    units: state.units.filter((unit) => unit.id !== id),
                })),
        }),
        {
            name: 'pos-units-store',
        }
    )
)
