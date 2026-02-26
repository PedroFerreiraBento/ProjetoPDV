export interface Coupon {
    id: string
    code: string          // Unique code (e.g. "WELCOME10")
    discountType: 'PERCENT' | 'FIXED' // Percentage or fixed value
    discountValue: number  // Percentage (e.g. 10) or cents (e.g. 500 = R$5.00)
    minOrderValue?: number // Minimum order value in cents to activate
    maxUses?: number       // Maximum total uses (unlimited if undefined)
    usedCount: number      // How many times used
    isActive: boolean
    expiresAt?: string     // ISO date string
    createdAt: string
    updatedAt: string
}
