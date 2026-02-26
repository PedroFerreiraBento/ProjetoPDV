import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
    allowNegativeStock: boolean
    blockOutOfStockSales: boolean

    // Payment Rules
    allowCreditSales: boolean

    // Scale Integration
    enableScaleBarcodes: boolean
    scaleBarcodePrefix: string // Typically '2' or '20'
    scaleValueType: 'PRICE' | 'WEIGHT'
    scaleItemCodeLength: 4 | 5

    // Setters
    updateSettings: (settings: Partial<SettingsState>) => void
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            allowNegativeStock: true,
            blockOutOfStockSales: false,
            allowCreditSales: false,

            // Scale defaults
            enableScaleBarcodes: false,
            scaleBarcodePrefix: '2',
            scaleValueType: 'PRICE',
            scaleItemCodeLength: 4,

            updateSettings: (settings) => set((state) => ({ ...state, ...settings }))
        }),
        {
            name: 'pos-settings'
        }
    )
)
