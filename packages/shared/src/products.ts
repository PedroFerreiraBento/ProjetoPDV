export interface ProductOption {
    name: string // e.g., "Size", "Color"
    values: string[] // e.g., ["S", "M", "L"]
}

export interface ProductBatch {
    id: string
    branchId: string // The branch this batch belongs to
    batchNumber: string
    expirationDate: string // YYYY-MM-DD
    stock: number
}

export interface ProductVariant {
    id: string
    sku: string
    price: number // Price in cents
    cost?: number // Cost in cents
    wholesalePrice?: number // Wholesale price in cents
    wholesaleQuantity?: number // Minimum quantity for wholesale
    stock?: number // Total stock across all branches (legacy or aggregated)
    branchStocks?: Record<string, number> // Record<branchId, stockQuantity> for generic tracking
    minStock?: number // Minimum stock threshold before alert
    barcode?: string
    options: Record<string, string> // e.g., { "Size": "S", "Color": "Red" }

    // Batch/Expiration Tracking
    trackBatches?: boolean
    batches?: ProductBatch[]
}

export interface Product {
    id: string
    name: string
    sku?: string
    price?: number // Price in cents to avoid floating point math errors
    cost?: number // Cost in cents
    wholesalePrice?: number // Wholesale price in cents
    wholesaleQuantity?: number // Minimum quantity for wholesale
    stock?: number // Total stock for simple product across all branches (legacy or aggregated)
    branchStocks?: Record<string, number> // Record<branchId, stockQuantity> for simple generic tracking
    minStock?: number // Min stock threshold for simple product
    categoryId?: string
    unitId?: string
    barcode?: string
    isFavorite?: boolean

    options?: ProductOption[]
    variants?: ProductVariant[]

    // Batch/Expiration Tracking
    trackBatches?: boolean
    batches?: ProductBatch[]

    // Promotions & Bundles
    promotionType?: 'NONE' | 'BUY_X_PAY_Y' | 'WHOLESALE'
    promotionX?: number
    promotionY?: number
    isBundle?: boolean
    bundleItems?: BundleItem[]

    createdAt: string
    updatedAt: string
    deletedAt?: string
}

export interface BundleItem {
    productId: string
    variantId?: string
    quantity: number
}
