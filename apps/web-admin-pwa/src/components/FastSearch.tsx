import { useState, useEffect } from 'react'
import { Dialog, DialogContent, Button } from '@pos/ui'
import { Search, Package } from 'lucide-react'
import { useProductsStore } from '../store/products'
import { formatCurrency } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

export function FastSearch() {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const { products } = useProductsStore()
    const navigate = useNavigate()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    const filteredProducts = products.filter(
        (product) => {
            if (!searchQuery) return false;
            const searchLower = searchQuery.toLowerCase();
            const matchesBasic = product.name.toLowerCase().includes(searchLower) ||
                (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
                (product.barcode && product.barcode.toLowerCase().includes(searchLower));

            if (matchesBasic) return true;

            if (product.variants && product.variants.length > 0) {
                return product.variants.some(v =>
                    (v.sku && v.sku.toLowerCase().includes(searchLower)) ||
                    (v.barcode && v.barcode.toLowerCase().includes(searchLower))
                );
            }

            return false;
        }
    )

    // Limit results for performance
    const results = filteredProducts.slice(0, 10)

    const handleSelectProduct = () => {
        setIsOpen(false)
        navigate('/dashboard/products')
        // In a real app, this might open the edit modal directly or route to a detail page.
        // For now, redirecting to products catalog is a good step.
    }

    return (
        <>
            <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 lg:justify-start lg:w-48 lg:px-3 text-sm text-slate-500 hover:text-slate-900 border-slate-200 dark:border-zinc-800 dark:text-slate-400 dark:hover:text-slate-50"
                onClick={() => setIsOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2 lg:mr-2" />
                <span className="hidden lg:inline-flex">Search products...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex dark:bg-zinc-800">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden shadow-2xl [&>button]:hidden">
                    <div className="flex items-center border-b border-slate-200 dark:border-zinc-800 px-3">
                        <Search className="mr-2 h-5 w-5 shrink-0 opacity-50 text-slate-500" />
                        <input
                            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400 text-slate-900 dark:text-slate-50"
                            placeholder="Type a product name, SKU or barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2">
                        {searchQuery === '' ? (
                            <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                Start typing to search your catalog.
                            </p>
                        ) : results.length === 0 ? (
                            <p className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                No products found.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {results.map((product) => {
                                    let displayPrice = product.price ? formatCurrency(product.price) : 'R$ 0,00'
                                    if (product.variants && product.variants.length > 0) {
                                        const validPrices = product.variants.map((v: any) => v.price).filter((p: any) => typeof p === 'number' && p >= 0);
                                        if (validPrices.length > 0) {
                                            const minPrice = Math.min(...validPrices);
                                            displayPrice = `A partir de ${formatCurrency(minPrice)}`;
                                        }
                                    }

                                    return (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between rounded-md px-4 py-3 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer overflow-hidden"
                                            onClick={() => handleSelectProduct()}
                                        >
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <div className="font-medium text-sm flex items-center gap-2 text-slate-900 dark:text-slate-50 truncate">
                                                    <Package className="h-4 w-4 shrink-0 text-slate-400" />
                                                    <span className="truncate">{product.name}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 flex gap-3 truncate">
                                                    {product.sku && <span className="truncate">SKU: {product.sku}</span>}
                                                    {product.barcode && <span className="truncate">EAN: {product.barcode}</span>}
                                                </div>
                                            </div>
                                            <div className="font-semibold text-sm shrink-0 pl-4 text-slate-900 dark:text-slate-50">
                                                {displayPrice}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
