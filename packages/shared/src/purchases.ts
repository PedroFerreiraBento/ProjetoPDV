export interface PurchaseOrderItem {
    productId: string
    productName: string
    quantity: number
    unitCost: number // in cents
}

export interface PurchaseOrder {
    id: string
    supplierId: string
    supplierName: string
    items: PurchaseOrderItem[]
    status: 'PENDING' | 'RECEIVED' | 'CANCELLED'
    totalCost: number // in cents
    notes?: string
    createdAt: string
    receivedAt?: string
    receivedBy?: string
}
