export interface Product {
    id: string
    name: string
    sku: string
    price: number // Price in cents to avoid floating point math errors
    barcode?: string
    createdAt: string
    updatedAt: string
}
