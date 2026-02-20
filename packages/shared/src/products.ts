export interface ProductOption {
    name: string // e.g., "Size", "Color"
    values: string[] // e.g., ["S", "M", "L"]
}

export interface ProductVariant {
    id: string
    sku: string
    price: number // Price in cents
    barcode?: string
    options: Record<string, string> // e.g., { "Size": "S", "Color": "Red" }
}

export interface Product {
    id: string
    name: string
    sku?: string
    price?: number // Price in cents to avoid floating point math errors
    categoryId?: string
    unitId?: string
    barcode?: string
    isFavorite?: boolean

    options?: ProductOption[]
    variants?: ProductVariant[]

    createdAt: string
    updatedAt: string
}
