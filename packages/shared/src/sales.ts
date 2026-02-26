export enum PaymentMethod {
    MONEY = 'MONEY',
    PIX = 'PIX',
    DEBIT_CARD = 'DEBIT_CARD',
    CREDIT_CARD = 'CREDIT_CARD',
    CREDIT = 'CREDIT' // Fiado/Crediário
}

export interface SaleItem {
    id: string
    productId: string
    variantId?: string
    name: string
    price: number
    quantity: number
    observation?: string
    discountValue?: number
    discountType?: 'PERCENT' | 'FIXED'
    isReturn?: boolean
}

export interface SalePayment {
    method: PaymentMethod
    amount: number
}

export type SaleStatus = 'COMPLETED' | 'VOIDED';

export interface Sale {
    id: string
    items: SaleItem[]
    subtotal: number
    totalDiscounts: number
    totalFees: number
    total: number
    payments: SalePayment[]
    change?: number
    customerCpf?: string
    customerId?: string
    customerName?: string
    operatorId: string
    operatorName?: string
    branchId: string
    terminalId?: string
    createdAt: string
    updatedAt: string
    status: SaleStatus
    observation?: string
    couponCode?: string
    voidReason?: string
    voidedAt?: string
    creditSettledAt?: string
    deletedAt?: string
}
