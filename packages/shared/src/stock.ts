export interface StockMovement {
    id: string
    productId: string
    variantId?: string
    quantity: number
    type: 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'RETURN' | 'TRANSFER'
    branchId?: string
    toBranchId?: string // Used exclusively for transferring
    reason?: string
    operatorId: string
    operatorName?: string
    createdAt: string
}
