import { create } from 'zustand'
import { useSettingsStore } from './settings'
import { persist } from 'zustand/middleware'
import { Product, ProductVariant } from '@pos/shared'

export interface CartItem {
    id: string
    product: Product
    variant?: ProductVariant
    quantity: number
    price: number
    name: string
    observation?: string
    discountValue: number
    discountType: 'PERCENT' | 'FIXED'
    isReturn?: boolean
}

interface CartState {
    items: CartItem[]
    observation: string
    discountValue: number
    discountType: 'PERCENT' | 'FIXED'
    feeValue: number
    feeType: 'PERCENT' | 'FIXED'
    priceTable: 'RETAIL' | 'WHOLESALE'
    customerCpf?: string
    addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void
    updateQuantity: (id: string, delta: number) => void
    removeItem: (id: string) => void
    updateItem: (id: string, updates: Partial<Pick<CartItem, 'quantity' | 'price' | 'observation' | 'discountValue' | 'discountType' | 'isReturn'>>) => void
    setObservation: (observation: string) => void
    setSaleAdjustments: (adjustments: Partial<Pick<CartState, 'discountValue' | 'discountType' | 'feeValue' | 'feeType'>>) => void
    setCustomerCpf: (cpf?: string) => void
    setPriceTable: (table: 'RETAIL' | 'WHOLESALE') => void
    clearCart: () => void
    getTotalItems: () => number
    getSubtotal: () => number
    getTotalDiscounts: () => number
    getTotalFees: () => number
    getTotalAmount: () => number
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            observation: '',
            discountValue: 0,
            discountType: 'PERCENT',
            feeValue: 0,
            feeType: 'PERCENT',
            priceTable: 'RETAIL',
            customerCpf: undefined,

            addItem: (product, variant, quantity = 1) => {
                // 1. Validate Price > 0
                const sellingPrice = variant?.price ?? product.price ?? 0
                if (sellingPrice <= 0) {
                    throw new Error('Produto sem preço cadastrado. Não é possível vender.')
                }

                const items = get().items
                const existingId = variant ? `${product.id}-${variant.id}` : product.id
                const existingIndex = items.findIndex(item => item.id === existingId)

                // 2. Determine requested quantity vs available stock
                const currentCartQuantity = existingIndex >= 0 ? items[existingIndex].quantity : 0
                const requestedTotalQty = currentCartQuantity + quantity
                const availableStock = variant ? (variant.stock || 0) : (product.stock || 0)

                // 3. Validate Stock
                const settings = useSettingsStore.getState()
                if (settings.blockOutOfStockSales && requestedTotalQty > availableStock) {
                    if (!settings.allowNegativeStock) {
                        throw new Error(`Estoque insuficiente. Disponível: ${availableStock}`)
                    }
                }

                if (existingIndex >= 0) {
                    const existingItem = items[existingIndex]
                    const newQuantity = existingItem.quantity + quantity

                    // Wholesale logic
                    const wsQty = existingItem.variant ? existingItem.variant.wholesaleQuantity : existingItem.product.wholesaleQuantity
                    const wsPrice = existingItem.variant ? existingItem.variant.wholesalePrice : existingItem.product.wholesalePrice
                    const retailPrice = existingItem.variant ? existingItem.variant.price : (existingItem.product.price || 0)
                    const currentTable = get().priceTable

                    let newPrice = retailPrice
                    if (currentTable === 'WHOLESALE' && wsPrice) {
                        newPrice = wsPrice
                    } else if (existingItem.product.promotionType === 'WHOLESALE' && wsQty && wsPrice && newQuantity >= wsQty) {
                        newPrice = wsPrice
                    }

                    const newItems = [...items]
                    newItems[existingIndex].quantity = newQuantity
                    newItems[existingIndex].price = newPrice
                    set({ items: newItems })
                    return
                }

                const retailPrice = variant ? variant.price : (product.price || 0)
                const wsQty = variant ? variant.wholesaleQuantity : product.wholesaleQuantity
                const wsPrice = variant ? variant.wholesalePrice : product.wholesalePrice
                const currentTable = get().priceTable

                let price = retailPrice
                if (currentTable === 'WHOLESALE' && wsPrice) {
                    price = wsPrice
                } else if (product.promotionType === 'WHOLESALE' && wsQty && wsPrice && quantity >= wsQty) {
                    price = wsPrice
                }

                let name = product.name
                if (variant && variant.options) {
                    const opts = Object.values(variant.options).join(' / ')
                    if (opts) name += ` (${opts})`
                }

                set({
                    items: [...items, {
                        id: existingId,
                        product,
                        variant,
                        quantity,
                        price,
                        name,
                        observation: '',
                        discountValue: 0,
                        discountType: 'PERCENT'
                    }]
                })
            },

            updateQuantity: (id, delta) => {
                const items = get().items
                const item = items.find(i => i.id === id)
                if (!item) return

                const newQuantity = item.quantity + delta

                if (newQuantity <= 0) {
                    if (window.confirm(`Remover "${item.name}" do carrinho?`)) {
                        set({ items: items.filter(i => i.id !== id) })
                    }
                    return
                }

                // Wholesale logic
                const wsQty = item.variant ? item.variant.wholesaleQuantity : item.product.wholesaleQuantity
                const wsPrice = item.variant ? item.variant.wholesalePrice : item.product.wholesalePrice
                const retailPrice = item.variant ? item.variant.price : (item.product.price || 0)
                const currentTable = get().priceTable

                let newPrice = retailPrice
                if (currentTable === 'WHOLESALE' && wsPrice) {
                    newPrice = wsPrice
                } else if (item.product.promotionType === 'WHOLESALE' && wsQty && wsPrice && newQuantity >= wsQty) {
                    newPrice = wsPrice
                }

                set({
                    items: items.map(i =>
                        i.id === id ? { ...i, quantity: newQuantity, price: newPrice } : i
                    )
                })
            },

            removeItem: (id) => {
                const items = get().items
                set({ items: items.filter(item => item.id !== id) })
            },

            updateItem: (id, updates) => {
                const items = get().items
                set({
                    items: items.map(item =>
                        item.id === id ? { ...item, ...updates } : item
                    )
                })
            },

            setObservation: (observation) => set({ observation }),

            setSaleAdjustments: (adjustments) => set(adjustments),

            setCustomerCpf: (cpf) => set({ customerCpf: cpf }),

            setPriceTable: (table) => {
                const items = get().items
                const newItems = items.map(item => {
                    const wsQty = item.variant ? item.variant.wholesaleQuantity : item.product.wholesaleQuantity
                    const wsPrice = item.variant ? item.variant.wholesalePrice : item.product.wholesalePrice
                    const retailPrice = item.variant ? item.variant.price : (item.product.price || 0)

                    let newPrice = retailPrice
                    if (table === 'WHOLESALE' && wsPrice) {
                        newPrice = wsPrice
                    } else if (item.product.promotionType === 'WHOLESALE' && wsQty && wsPrice && item.quantity >= wsQty) {
                        newPrice = wsPrice
                    }
                    return { ...item, price: newPrice }
                })
                set({ priceTable: table, items: newItems })
            },

            clearCart: () => set({
                items: [],
                observation: '',
                discountValue: 0,
                discountType: 'PERCENT',
                feeValue: 0,
                feeType: 'PERCENT',
                customerCpf: undefined
            }),

            getTotalItems: () => {
                return get().items.reduce((acc, item) => acc + item.quantity, 0)
            },

            getSubtotal: () => {
                return get().items.reduce((acc, item) => {
                    const sign = item.isReturn ? -1 : 1;
                    return acc + (item.price * item.quantity * sign)
                }, 0)
            },

            getTotalDiscounts: () => {
                const items = get().items
                const itemDiscounts = items.reduce((acc, item) => {
                    const sign = item.isReturn ? -1 : 1;
                    const base = item.price * item.quantity * sign;

                    let discount = item.discountType === 'PERCENT'
                        ? base * (item.discountValue / 100)
                        : (item.discountValue * sign);

                    // Promotion logic: BUY_X_PAY_Y
                    if (item.product.promotionType === 'BUY_X_PAY_Y' && item.product.promotionX && item.product.promotionY) {
                        const x = Number(item.product.promotionX)
                        const y = Number(item.product.promotionY)
                        if (!isNaN(x) && !isNaN(y) && x > 0) {
                            const freeUnits = Math.floor(item.quantity / x) * (x - y)
                            const promoDiscount = freeUnits * item.price * sign
                            discount += promoDiscount
                        }
                    }

                    return acc + discount
                }, 0)

                const subtotal = get().getSubtotal() - itemDiscounts
                const saleDiscountValue = get().discountValue
                const saleDiscount = get().discountType === 'PERCENT'
                    ? subtotal * (saleDiscountValue / 100)
                    : saleDiscountValue

                return itemDiscounts + saleDiscount
            },

            getTotalFees: () => {
                const subtotalWithDiscounts = get().getSubtotal() - get().getTotalDiscounts()
                const feeValue = get().feeValue
                const saleFee = get().feeType === 'PERCENT'
                    ? subtotalWithDiscounts * (feeValue / 100)
                    : feeValue
                return saleFee
            },

            getTotalAmount: () => {
                const subtotal = get().getSubtotal()
                const discounts = get().getTotalDiscounts()
                const fees = get().getTotalFees()
                return subtotal - discounts + fees
            }
        }),
        {
            name: 'pos-cart-storage'
        }
    )
)
