import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Coupon } from '@pos/shared'

interface CouponsStore {
    coupons: Coupon[]
    addCoupon: (coupon: Coupon) => void
    updateCoupon: (id: string, data: Partial<Coupon>) => void
    removeCoupon: (id: string) => void
    incrementUsage: (id: string) => void
    validateCoupon: (code: string, orderTotal: number) => { valid: boolean; coupon?: Coupon; error?: string }
}

export const useCouponsStore = create<CouponsStore>()(
    persist(
        (set, get) => ({
            coupons: [],
            addCoupon: (coupon) => {
                set((state) => ({
                    coupons: [...state.coupons, coupon]
                }))
            },
            updateCoupon: (id, data) => {
                set((state) => ({
                    coupons: state.coupons.map(c =>
                        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
                    )
                }))
            },
            removeCoupon: (id) => {
                set((state) => ({
                    coupons: state.coupons.filter(c => c.id !== id)
                }))
            },
            incrementUsage: (id) => {
                set((state) => ({
                    coupons: state.coupons.map(c =>
                        c.id === id ? { ...c, usedCount: c.usedCount + 1 } : c
                    )
                }))
            },
            validateCoupon: (code, orderTotal) => {
                const coupon = get().coupons.find(
                    c => c.code.toLowerCase() === code.toLowerCase()
                )

                if (!coupon) {
                    return { valid: false, error: 'Cupom não encontrado' }
                }
                if (!coupon.isActive) {
                    return { valid: false, error: 'Cupom inativo' }
                }
                if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
                    return { valid: false, error: 'Cupom expirado' }
                }
                if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
                    return { valid: false, error: 'Cupom esgotado (limite de uso atingido)' }
                }
                if (coupon.minOrderValue !== undefined && orderTotal < coupon.minOrderValue) {
                    const minFormatted = (coupon.minOrderValue / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    return { valid: false, error: `Pedido mínimo: ${minFormatted}` }
                }

                return { valid: true, coupon }
            }
        }),
        {
            name: 'pos-coupons-storage',
            version: 1
        }
    )
)
