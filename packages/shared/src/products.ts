export interface Product {
    id: string
    name: string
    sku: string
    price: number // Price in cents to avoid floating point math errors
    categoryId?: string
    unitId?: string
    barcode?: string
    createdAt: string
    updatedAt: string
}
