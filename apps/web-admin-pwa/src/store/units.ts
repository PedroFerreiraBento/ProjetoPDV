import { create } from 'zustand'
import { Unit } from '@pos/shared'

interface UnitsState {
    units: Unit[]
    addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void
    updateUnit: (id: string, unit: Partial<Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>>) => void
    deleteUnit: (id: string) => void
}

export const useUnitsStore = create<UnitsState>()(
    (set) => ({
            units: [],
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
        })
)
