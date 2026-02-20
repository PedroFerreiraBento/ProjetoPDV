import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductsStore } from '../../store/products'
import { Product, ProductVariant } from '@pos/shared'
import { Button } from '@pos/ui'
import { ArrowLeft, ShoppingCart, Search, Terminal, Plus, Minus, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'

interface CartItem {
    id: string
    product: Product
    variant?: ProductVariant
    quantity: number
    price: number
    name: string
}

export function PosPage() {
    const navigate = useNavigate()
    const { products } = useProductsStore()
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    const favoriteProducts = products.filter(p => p.isFavorite)

    const addItemToCart = (product: Product, variant?: ProductVariant) => {
        setCartItems(prev => {
            const existingId = variant ? `${product.id}-${variant.id}` : product.id
            const existingIndex = prev.findIndex(item => item.id === existingId)

            if (existingIndex >= 0) {
                const newItems = [...prev]
                newItems[existingIndex].quantity += 1
                return newItems
            }

            const price = variant ? variant.price : (product.price || 0)
            let name = product.name
            if (variant && variant.options) {
                const opts = Object.values(variant.options).join(' / ')
                if (opts) name += ` (${opts})`
            }

            return [...prev, {
                id: existingId,
                product,
                variant,
                quantity: 1,
                price,
                name
            }]
        })
    }

    const updateItemQuantity = (id: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQuantity }
            }
            return item
        }))
    }

    const removeItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id))
    }

    const handleScan = (barcode: string) => {
        const cleanBarcode = barcode.trim()
        if (!cleanBarcode) return

        let foundProduct: Product | undefined
        let foundVariant: ProductVariant | undefined

        // Simple linear search for matching barcode
        for (const product of products) {
            if (product.barcode === cleanBarcode) {
                foundProduct = product
                break
            }
            if (product.variants) {
                const variant = product.variants.find(v => v.barcode === cleanBarcode)
                if (variant) {
                    foundProduct = product
                    foundVariant = variant
                    break
                }
            }
        }

        if (foundProduct) {
            addItemToCart(foundProduct, foundVariant)
            // Optional: play a success beep here
        } else {
            // Optional: play an error beep here
            console.warn('Scanned barcode not found:', cleanBarcode)
        }
    }

    // Attach barcode scanner hook
    useBarcodeScanner({ onScan: handleScan })

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    return (
        <div className="flex h-screen w-full bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 overflow-hidden font-sans">
            {/* Left Panel: Catalog & Favorites */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="font-semibold text-lg flex items-center gap-2">
                            <Terminal className="h-5 w-5 text-primary" />
                            Store POS
                        </h1>
                    </div>
                    <div className="relative max-w-sm w-full hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar produto ou código de barras..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleScan(searchTerm)
                                    setSearchTerm('')
                                }
                            }}
                            className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100 dark:bg-zinc-800 border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none transition-all"
                        />
                    </div>
                </header>

                {/* Main Content Area: Favorites Grid */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <h2 className="text-sm font-semibold text-slate-500 tracking-wider uppercase mb-4">Acesso Rápido / Favoritos</h2>

                    {favoriteProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                            <p>Nenhum produto favoritado.</p>
                            <p className="text-sm mt-1">Marque a estrela "⭐" no cadastro de produtos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {favoriteProducts.map((product) => {
                                let displayPrice = product.price ? formatCurrency(product.price) : 'R$ 0,00'
                                if (product.variants && product.variants.length > 0) {
                                    const validPrices = product.variants.map((v: any) => v.price).filter((p: any) => typeof p === 'number' && p >= 0);
                                    if (validPrices.length > 0) {
                                        const minPrice = Math.min(...validPrices);
                                        displayPrice = `A partir de ${formatCurrency(minPrice)}`;
                                    }
                                }

                                return (
                                    <button
                                        key={product.id}
                                        className="flex flex-col items-start p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-primary hover:shadow-md transition-all text-left group aspect-square justify-between"
                                        onClick={() => {
                                            const hasVariants = product.variants && product.variants.length > 0
                                            // Ensure we only add products that have a direct price (no variations) or pick default
                                            if (!hasVariants) {
                                                addItemToCart(product)
                                            } else {
                                                // If it has variations, ideally we pop up a selector, but for now just pick the first variant or warn
                                                if (product.variants && product.variants.length > 0) {
                                                    addItemToCart(product, product.variants[0])
                                                }
                                            }
                                        }}
                                    >
                                        <div className="w-full font-medium text-sm leading-tight line-clamp-2">
                                            {product.name}
                                        </div>
                                        <div className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50 text-primary font-semibold text-sm">
                                            {displayPrice}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Cart Placeholder */}
            <aside className="w-80 lg:w-96 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0">
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Venda Atual
                    </h2>
                    <span className="text-xs font-mono bg-slate-200 dark:bg-zinc-800 px-2 py-1 rounded">
                        #0001
                    </span>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <PackageIcon />
                            <p className="mt-4 text-sm text-center">O carrinho está vazio.<br />Selecione produtos ou bipe o código de barras.</p>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-50 line-clamp-2">{item.name}</span>
                                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-50 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-slate-500">{formatCurrency(item.price)} un</span>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-md p-0.5 border border-slate-200 dark:border-zinc-700">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-white dark:hover:bg-zinc-700" onClick={() => updateItemQuantity(item.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-white dark:hover:bg-zinc-700" onClick={() => updateItemQuantity(item.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md shrink-0" onClick={() => removeItem(item.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Totals Placeholder */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 shrink-0">
                    <div className="flex justify-between mb-2 text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between mb-4 text-sm text-slate-500">
                        <span>Descontos</span>
                        <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-semibold text-lg text-slate-900 dark:text-slate-50">Total</span>
                        <span className="font-bold text-2xl text-emerald-600 dark:text-emerald-400">{formatCurrency(cartTotal)}</span>
                    </div>
                    <Button
                        className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:opacity-50"
                        disabled={cartItems.length === 0}
                    >
                        Finalizar Venda
                    </Button>
                </div>
            </aside>
        </div>
    )
}

function PackageIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-20">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
    )
}
