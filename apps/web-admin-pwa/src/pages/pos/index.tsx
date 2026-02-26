import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useProductsStore } from '../../store/products'
import { useStockStore } from '../../store/stock'
import { useCartStore } from '../../store/cart'
import { useSalesStore } from '../../store/sales'
import { useSettingsStore } from '../../store/settings'
import { useCashRegisterStore } from '../../store/cash-register'
import { useTerminalsStore } from '../../store/terminals'
import { useCouponsStore } from '../../store/coupons'
import { useOperatorsStore } from '../../store/operators'

import { Product, ProductVariant, Sale, PaymentMethod } from '@pos/shared'
import { Button, Input } from '@pos/ui'
import { ArrowLeft, ShoppingCart, Search, Terminal as TerminalIcon, Plus, Minus, Trash2, Camera, Settings, Ticket, X, Lock, Banknote, Unlock, Clock } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'

import { CameraScannerModal } from '../../components/CameraScannerModal'
import { PaymentModal } from '../../components/PaymentModal'
import { QuantityPriceModal } from '../../components/QuantityPriceModal'
import { SaleAdjustmentsModal } from '../../components/SaleAdjustmentsModal'
import { TerminalSelector } from '../../components/TerminalSelector'
import { CashControlModal } from '../../components/CashControlModal'
import { MySalesModal } from '../../components/MySalesModal'
import { PendingCreditSalesModal } from '../../components/PendingCreditSalesModal'

export function PosPage() {
    const navigate = useNavigate()
    const { products, updateStock } = useProductsStore()
    const { addMovement } = useStockStore()
    const { lockScreen } = useOperatorsStore()
    const {
        items: cartItems, addItem, updateQuantity, removeItem, clearCart,
        getTotalAmount, getSubtotal, getTotalDiscounts, getTotalFees,
        customerCpf, observation, updateItem, setSaleAdjustments
    } = useCartStore()

    const { addSale, sales } = useSalesStore()
    const { scaleBarcodePrefix, scaleItemCodeLength, scaleValueType } = useSettingsStore()

    const { currentTerminalId, terminals } = useTerminalsStore()
    const { getCurrentSession, addTransaction } = useCashRegisterStore()
    const activeSession = getCurrentSession()

    const { validateCoupon, incrementUsage } = useCouponsStore()

    const [searchTerm, setSearchTerm] = useState('')
    const [couponCode, setCouponCode] = useState('')

    const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false)
    const [isAdjustmentsModalOpen, setIsAdjustmentsModalOpen] = useState(false)
    const [isCashModalOpen, setIsCashModalOpen] = useState(false)
    const [isMySalesOpen, setIsMySalesOpen] = useState(false)
    const [isPendingCreditOpen, setIsPendingCreditOpen] = useState(false)
    const [cashMode, setCashMode] = useState<'OPEN' | 'CLOSE' | 'BLEED' | 'SUPPLY'>('OPEN')

    const [selectedCartItemId, setSelectedCartItemId] = useState<string | null>(null)

    const favoriteProducts = products.filter(p => p.isFavorite)

    const displayedProducts = useMemo(() => {
        if (!searchTerm) return favoriteProducts
        const lowerTerm = searchTerm.toLowerCase()
        return products.filter(p =>
            p.name.toLowerCase().includes(lowerTerm) ||
            (p.barcode && p.barcode.includes(lowerTerm)) ||
            (p.sku && p.sku.toLowerCase().includes(lowerTerm))
        ).slice(0, 50)
    }, [searchTerm, products, favoriteProducts])

    const pendingCreditCount = useMemo(() => {
        if (!currentTerminalId) return 0
        return sales.filter((sale) =>
            sale.terminalId === currentTerminalId &&
            sale.status === 'COMPLETED' &&
            sale.payments.some((p) => p.method === PaymentMethod.CREDIT) &&
            !sale.creditSettledAt
        ).length
    }, [sales, currentTerminalId])

    const handleScan = (barcode: string) => {
        const cleanBarcode = barcode.trim()
        if (!cleanBarcode) return

        let foundProduct: Product | undefined
        let foundVariant: ProductVariant | undefined

        let isScaleBarcode = false
        let scaleQuantity = 1
        let scalePrice = 0

        if (cleanBarcode.length === 13 && cleanBarcode.startsWith(scaleBarcodePrefix)) {
            isScaleBarcode = true
            const itemCode = cleanBarcode.substring(scaleBarcodePrefix.length, scaleBarcodePrefix.length + scaleItemCodeLength)
            const valueStr = cleanBarcode.substring(scaleBarcodePrefix.length + scaleItemCodeLength, 12)
            const valueNumber = parseInt(valueStr, 10) / 1000

            for (const product of products) {
                if (product.barcode === itemCode || product.sku === itemCode) {
                    foundProduct = product
                    break
                }
                if (product.variants) {
                    const variant = product.variants.find(v => v.barcode === itemCode || v.sku === itemCode)
                    if (variant) {
                        foundProduct = product
                        foundVariant = variant
                        break
                    }
                }
            }

            if (scaleValueType === 'WEIGHT') {
                scaleQuantity = valueNumber
            } else if (scaleValueType === 'PRICE') {
                scalePrice = valueNumber
            }
        } else {
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
        }

        if (foundProduct) {
            try {
                let finalQuantity = 1
                if (isScaleBarcode) {
                    if (scaleValueType === 'WEIGHT') {
                        finalQuantity = scaleQuantity
                    } else if (scaleValueType === 'PRICE') {
                        const unitPrice = foundVariant ? foundVariant.price : foundProduct.price
                        if (unitPrice && unitPrice > 0) {
                            finalQuantity = scalePrice / unitPrice
                        } else {
                            throw new Error('Produto sem preço definido. Não é possível calcular o peso.')
                        }
                    }
                }
                addItem(foundProduct, foundVariant, finalQuantity)
            } catch (error: any) {
                toast.error(error.message)
            }
        } else {
            toast.error('Produto não encontrado.')
        }
    }
    useBarcodeScanner({ onScan: handleScan })

    const handleFinalizeSale = (payments: any[], finalCustomerCpf?: string, change?: number, customerId?: string, customerName?: string) => {
        const currentTerminal = terminals.find(t => t.id === currentTerminalId)
        const saleId = crypto.randomUUID()

        const hasMoneyPayment = payments.some(p => p.method === PaymentMethod.MONEY)
        if (hasMoneyPayment && !activeSession) {
            toast.error('É necessário abrir o caixa para receber em dinheiro.')
            throw new Error('Caixa fechado')
        }

        if (couponCode) {
            incrementUsage(couponCode)
        }

        const sale: Sale = {
            id: saleId,
            branchId: currentTerminal?.branchId || '',
            terminalId: currentTerminal?.id,
            items: cartItems.map(item => ({
                id: crypto.randomUUID(),
                productId: item.product.id,
                variantId: item.variant?.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                discountValue: item.discountValue,
                discountType: item.discountType,
                isReturn: item.isReturn,
                observation: item.observation
            })),
            subtotal: getSubtotal(),
            totalDiscounts: getTotalDiscounts(),
            totalFees: getTotalFees(),
            total: getTotalAmount(),
            payments: payments,
            change,
            customerCpf: finalCustomerCpf || customerCpf,
            customerId,
            customerName,
            operatorId: activeSession?.operatorId || 'pos-operator',
            operatorName: activeSession?.operatorName || 'Operador',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'COMPLETED',
            observation,
            couponCode
        }

        addSale(sale)

        cartItems.forEach(item => {
            const delta = item.isReturn ? item.quantity : -item.quantity

            if (item.product.isBundle && item.product.bundleItems) {
                item.product.bundleItems.forEach(bundleItem => {
                    const qty = delta * bundleItem.quantity
                    updateStock(bundleItem.productId, qty, bundleItem.variantId, currentTerminal?.branchId)
                    addMovement({
                        id: crypto.randomUUID(),
                        productId: bundleItem.productId,
                        variantId: bundleItem.variantId,
                        quantity: Math.abs(qty),
                        type: item.isReturn ? 'RETURN' : 'SALE',
                        branchId: currentTerminal?.branchId,
                        reason: `Venda #${saleId.slice(0, 8)} (Combo: ${item.name})`,
                        operatorId: activeSession?.operatorId || 'unknown',
                        operatorName: activeSession?.operatorName,
                        createdAt: new Date().toISOString()
                    })
                })
            } else {
                updateStock(item.product.id, delta, item.variant?.id, currentTerminal?.branchId)
                addMovement({
                    id: crypto.randomUUID(),
                    productId: item.product.id,
                    variantId: item.variant?.id,
                    quantity: Math.abs(delta),
                    type: item.isReturn ? 'RETURN' : 'SALE',
                    branchId: currentTerminal?.branchId,
                    reason: `Venda #${saleId.slice(0, 8)}`,
                    operatorId: activeSession?.operatorId || 'unknown',
                    operatorName: activeSession?.operatorName,
                    createdAt: new Date().toISOString()
                })
            }
        })

        payments.forEach(p => {
            if (activeSession && (p.method !== PaymentMethod.CREDIT)) { // Fiado isn't cash instantly
                addTransaction({
                    type: 'SALE',
                    amount: p.amount,
                    description: `Venda #${saleId.split('-')[0]} ${p.method}`,
                    operatorId: activeSession.operatorId,
                    operatorName: activeSession.operatorName,
                })
            }
        })

        clearCart()
        return sale
    }

    const handleApplyCoupon = () => {
        if (!couponCode) return
        const validation = validateCoupon(couponCode, getSubtotal())
        if (!validation.valid) {
            toast.error(validation.error || 'Cupom inválido')
            return
        }

        setSaleAdjustments({
            discountType: validation.coupon!.discountType,
            discountValue: validation.coupon!.discountValue
        })
        toast.success('Cupom aplicado!')
    }

    const handleAddWithQuantity = (qty: number, price: number, obs: string, discVal: number, discType: 'PERCENT' | 'FIXED', isReturn: boolean = false) => {
        if (selectedCartItemId) {
            updateItem(selectedCartItemId, {
                quantity: qty,
                price: price > 0 ? price : undefined,
                observation: obs,
                discountValue: discVal,
                discountType: discType,
                isReturn
            })
        }
        setIsQuantityModalOpen(false)
        setSelectedCartItemId(null)
    }

    return (
        <>
            <TerminalSelector />
            <div className="flex h-screen bg-slate-100 dark:bg-zinc-950 overflow-hidden text-slate-900 dark:text-slate-100">
                {/* Left Panel: Products */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                                <TerminalIcon className="h-6 w-6" />
                                PDV
                            </h1>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-2"
                                onClick={() => lockScreen()}
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Bloquear
                            </Button>

                            <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

                            {!activeSession ? (
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-primary hover:bg-primary/90 text-white"
                                        onClick={() => { setCashMode('OPEN'); setIsCashModalOpen(true); }}
                                    >
                                        <Unlock className="h-4 w-4 mr-2" />
                                        Abrir Caixa
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="relative h-9 border-slate-200 text-slate-600 dark:text-slate-300 dark:border-zinc-800"
                                        onClick={() => setIsPendingCreditOpen(true)}
                                        title="Fiados Pendentes"
                                    >
                                        <Banknote className="h-4 w-4 mr-2" />
                                        Fiados
                                        {pendingCreditCount > 0 && (
                                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-sm">
                                                {pendingCreditCount}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col items-end mr-2">
                                        <span className="text-[10px] uppercase font-bold text-primary leading-none">Caixa Aberto</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{activeSession.operatorName}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 border-slate-200 text-slate-600 dark:text-slate-300 dark:border-zinc-800"
                                        onClick={() => { setCashMode('BLEED'); setIsCashModalOpen(true); }}
                                        title="Sangria / Suprimento"
                                    >
                                        <Banknote className="h-4 w-4 mr-2" />
                                        Movimentar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 border-rose-200 text-rose-600 dark:text-rose-400 dark:border-rose-900/30 hover:bg-rose-50"
                                        onClick={() => { setCashMode('CLOSE'); setIsCashModalOpen(true); }}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Fechar
                                    </Button>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-1" />

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-slate-500 hover:text-primary"
                                        onClick={() => setIsMySalesOpen(true)}
                                        title="Minhas Vendas Recentes"
                                    >
                                        <Clock className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="relative h-9 border-slate-200 text-slate-600 dark:text-slate-300 dark:border-zinc-800"
                                        onClick={() => setIsPendingCreditOpen(true)}
                                        title="Fiados Pendentes"
                                    >
                                        <Banknote className="h-4 w-4 mr-2" />
                                        Fiados
                                        {pendingCreditCount > 0 && (
                                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-sm">
                                                {pendingCreditCount}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="relative w-96 max-w-full">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <Input
                                placeholder="Busque ou bipe o código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-10 bg-slate-100 dark:bg-zinc-800 border-transparent focus-visible:ring-primary h-10"
                                autoFocus
                            />
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary transition-colors"
                                onClick={() => setIsCameraScannerOpen(true)}
                                title="Ler com a câmera"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 p-4 overflow-y-auto">
                        <h2 className="text-sm font-semibold text-slate-500 tracking-wider uppercase mb-4">
                            {searchTerm ? 'Resultados da Busca' : 'Acesso Rápido / Favoritos'}
                        </h2>

                        {displayedProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <Search className="h-12 w-12 mb-4 opacity-20" />
                                <p>Nenhum produto encontrado.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {displayedProducts.map((product) => {
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
                                                if (!hasVariants) {
                                                    addItem(product)
                                                } else {
                                                    if (product.variants && product.variants.length > 0) {
                                                        addItem(product, product.variants[0])
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="w-full font-medium text-sm leading-tight line-clamp-2">
                                                {product.name}
                                            </div>
                                            <div className="flex justify-between items-end w-full mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50">
                                                <div className="text-primary font-semibold text-sm">
                                                    {displayPrice}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Cart */}
                <aside className="w-80 lg:w-96 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 relative">
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                        <h2 className="font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Venda Atual {cartItems.length > 0 && `(${cartItems.length})`}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setIsAdjustmentsModalOpen(true)} title="Descontos/Taxas">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={clearCart} title="Limpar Carrinho" disabled={cartItems.length === 0}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                        {cartItems.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                                <p className="mt-4 text-sm text-center">O carrinho está vazio.<br />Selecione produtos ou bipe o código de barras.</p>
                            </div>
                        ) : (
                            cartItems.map((item) => (
                                <div key={item.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg group">
                                    <div
                                        className="flex justify-between items-start gap-2 cursor-pointer group-hover:text-primary transition-colors"
                                        onClick={() => { setSelectedCartItemId(item.id); setIsQuantityModalOpen(true); }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-50 line-clamp-2">
                                                {item.isReturn && <span className="mr-1 text-[10px] py-0 px-1 bg-rose-500 text-white rounded">Devolução</span>}
                                                {item.name}
                                            </span>
                                            {item.observation && (
                                                <span className="text-xs text-slate-500 mt-0.5 line-clamp-1">Obs: {item.observation}</span>
                                            )}
                                        </div>
                                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-50 shrink-0">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-slate-500">{formatCurrency(item.price)} un {item.discountValue > 0 && <span className="text-rose-500 ml-1">-{item.discountType === 'PERCENT' ? `${item.discountValue}%` : formatCurrency(item.discountValue)}</span>}</span>
                                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-md p-0.5 border border-slate-200 dark:border-zinc-700">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-white dark:hover:bg-zinc-700" onClick={() => updateQuantity(item.id, -1)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-xs font-semibold">{Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(3)}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded hover:bg-white dark:hover:bg-zinc-700" onClick={() => updateQuantity(item.id, 1)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md shrink-0" onClick={() => removeItem(item.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 shrink-0">

                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Cupom de Desconto"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="h-9 text-sm"
                            />
                            <Button variant="secondary" className="h-9 px-3" onClick={handleApplyCoupon}>
                                <Ticket className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex justify-between mb-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Subtotal</span>
                            <span>{formatCurrency(getSubtotal())}</span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm text-rose-500">
                            <span>Descontos</span>
                            <span>- {formatCurrency(getTotalDiscounts())}</span>
                        </div>
                        {getTotalFees() > 0 && (
                            <div className="flex justify-between mb-2 text-sm text-sky-500">
                                <span>Taxas/Acréscimos</span>
                                <span>{formatCurrency(getTotalFees())}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-4 pt-2 border-t border-slate-200 dark:border-zinc-700 border-dashed">
                            <span className="font-semibold text-lg text-slate-900 dark:text-slate-50">Total</span>
                            <span className="font-bold text-3xl text-emerald-600 dark:text-emerald-400">{formatCurrency(getTotalAmount())}</span>
                        </div>
                        <Button
                            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:opacity-50"
                            disabled={cartItems.length === 0 || getTotalAmount() < 0}
                            onClick={() => setIsPaymentModalOpen(true)}
                        >
                            Finalizar Venda
                        </Button>
                    </div>
                </aside>
            </div>

            <CameraScannerModal
                isOpen={isCameraScannerOpen}
                onClose={() => setIsCameraScannerOpen(false)}
                onScan={handleScan}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                total={getTotalAmount()}
                onFinalize={handleFinalizeSale}
                onNewSale={() => {
                    clearCart();
                    setIsPaymentModalOpen(false);
                    setCouponCode('');
                }}
            />

            {selectedCartItemId && (() => {
                const item = cartItems.find(i => i.id === selectedCartItemId)
                if (!item) return null
                return (
                    <QuantityPriceModal
                        isOpen={isQuantityModalOpen}
                        onClose={() => { setIsQuantityModalOpen(false); setSelectedCartItemId(null); }}
                        itemName={item.name}
                        currentQuantity={item.quantity}
                        currentPrice={item.price}
                        currentObservation={item.observation}
                        currentDiscountValue={item.discountValue}
                        currentDiscountType={item.discountType}
                        currentIsReturn={item.isReturn}
                        onConfirm={handleAddWithQuantity}
                    />
                )
            })()}

            <SaleAdjustmentsModal
                isOpen={isAdjustmentsModalOpen}
                onClose={() => setIsAdjustmentsModalOpen(false)}
                currentDiscountValue={cartItems.reduce(() => 0, 0)} /* Dummy default */
                currentDiscountType={'PERCENT'}
                currentFeeValue={0}
                currentFeeType={'PERCENT'}
                onConfirm={(adj) => setSaleAdjustments(adj)}
            />

            <CashControlModal
                isOpen={isCashModalOpen}
                onClose={() => setIsCashModalOpen(false)}
                initialMode={cashMode}
            />

            <MySalesModal
                isOpen={isMySalesOpen}
                onOpenChange={setIsMySalesOpen}
            />

            <PendingCreditSalesModal
                isOpen={isPendingCreditOpen}
                onOpenChange={setIsPendingCreditOpen}
                terminalId={currentTerminalId}
            />
        </>
    )
}
