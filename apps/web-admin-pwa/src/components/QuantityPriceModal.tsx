import { useState, useEffect } from 'react'
import { Button, Numpad } from '@pos/ui'
import { X, Hash, Tag, Save, MessageSquare, ShieldAlert, RotateCcw } from 'lucide-react'
import { formatCurrency } from '../lib/utils'

interface QuantityPriceModalProps {
    isOpen: boolean
    onClose: () => void
    itemName: string
    currentQuantity: number
    currentPrice: number
    currentObservation?: string
    currentDiscountValue?: number
    currentDiscountType?: 'PERCENT' | 'FIXED'
    currentIsReturn?: boolean
    onConfirm: (newQuantity: number, newPrice: number, newObservation: string, newDiscountValue: number, newDiscountType: 'PERCENT' | 'FIXED', isReturn: boolean) => void
    canEditPrice?: boolean
    allowFractions?: boolean
}

type Tab = 'QUANTITY' | 'PRICE' | 'OBSERVATION' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED'

export function QuantityPriceModal({
    isOpen,
    onClose,
    itemName,
    currentQuantity,
    currentPrice,
    currentObservation = '',
    currentDiscountValue = 0,
    currentDiscountType = 'PERCENT',
    currentIsReturn = false,
    onConfirm,
    canEditPrice = true,
    allowFractions = false
}: QuantityPriceModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('QUANTITY')
    const [quantityStr, setQuantityStr] = useState('')
    const [priceStr, setPriceStr] = useState('')
    const [observation, setObservation] = useState('')
    const [discountStr, setDiscountStr] = useState('')
    const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
    const [isReturn, setIsReturn] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setQuantityStr(currentQuantity.toString().replace('.', ','))
            setPriceStr((currentPrice).toFixed(2).replace('.', ','))
            setObservation(currentObservation)
            setDiscountStr(currentDiscountValue.toString().replace('.', ','))
            setDiscountType(currentDiscountType)
            setIsReturn(currentIsReturn)
            setActiveTab('QUANTITY')
        }
    }, [isOpen, currentQuantity, currentPrice, currentObservation, currentDiscountValue, currentDiscountType, currentIsReturn])

    const handleKeyPress = (key: string) => {
        if (activeTab === 'QUANTITY') {
            setQuantityStr(prev => prev + key)
        } else if (activeTab === 'PRICE') {
            setPriceStr(prev => prev + key)
        } else if (activeTab === 'DISCOUNT_PERCENT' || activeTab === 'DISCOUNT_FIXED') {
            setDiscountStr(prev => prev + key)
        }
    }

    const handleBackspace = () => {
        if (activeTab === 'QUANTITY') {
            setQuantityStr(prev => prev.slice(0, -1))
        } else if (activeTab === 'PRICE') {
            setPriceStr(prev => prev.slice(0, -1))
        } else if (activeTab === 'DISCOUNT_PERCENT' || activeTab === 'DISCOUNT_FIXED') {
            setDiscountStr(prev => prev.slice(0, -1))
        }
    }

    const handleSave = () => {
        const newQty = parseFloat(quantityStr.replace(',', '.')) || 1
        const newPrice = parseFloat(priceStr.replace(',', '.')) || 0
        const newDiscount = parseFloat(discountStr.replace(',', '.')) || 0
        onConfirm(newQty, newPrice, observation, newDiscount, discountType, isReturn)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-zinc-800">
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-50 truncate pr-2">{itemName}</h3>
                        <p className="text-xs text-slate-500">Ajustar item no carrinho</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex p-2 gap-1.5 bg-slate-50 dark:bg-zinc-950/50">
                    <button
                        onClick={() => setActiveTab('QUANTITY')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-[10px] ${activeTab === 'QUANTITY'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-primary font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-500'
                            }`}
                    >
                        <Hash className="h-3.5 w-3.5" />
                        Qtd.
                    </button>
                    <button
                        onClick={() => canEditPrice && setActiveTab('PRICE')}
                        disabled={!canEditPrice}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-[10px] ${activeTab === 'PRICE'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-primary font-bold border border-slate-100 dark:border-zinc-800'
                            : !canEditPrice
                                ? 'text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-50'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-500'
                            }`}
                        title={!canEditPrice ? 'Sem permissão para alterar preços' : ''}
                    >
                        {canEditPrice ? <Tag className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                        Preço
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('DISCOUNT_PERCENT')
                            setDiscountType('PERCENT')
                        }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-[10px] ${activeTab === 'DISCOUNT_PERCENT'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-500'
                            }`}
                    >
                        <Tag className="h-3.5 w-3.5" />
                        Desc %
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('DISCOUNT_FIXED')
                            setDiscountType('FIXED')
                        }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-[10px] ${activeTab === 'DISCOUNT_FIXED'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-500'
                            }`}
                    >
                        <Tag className="h-3.5 w-3.5" />
                        Desc R$
                    </button>
                    <button
                        onClick={() => setActiveTab('OBSERVATION')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-[10px] ${activeTab === 'OBSERVATION'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-primary font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-500'
                            }`}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Obs.
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <div className="w-full text-center mb-6 bg-slate-50 dark:bg-zinc-800/50 py-8 rounded-2xl border border-slate-100 dark:border-zinc-800 min-h-[140px] flex items-center justify-center overflow-hidden">
                        {activeTab === 'QUANTITY' && (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Quantidade</span>
                                <div className="text-5xl font-bold text-slate-900 dark:text-slate-50">
                                    {quantityStr || '0'}
                                </div>
                            </div>
                        )}
                        {activeTab === 'PRICE' && (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Preço Unitário</span>
                                <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(parseFloat(priceStr.replace(',', '.')) || 0)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'DISCOUNT_PERCENT' && (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Desconto (%)</span>
                                <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                    {discountStr || '0'}<span className="text-3xl ml-1">%</span>
                                </div>
                            </div>
                        )}
                        {activeTab === 'DISCOUNT_FIXED' && (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Desconto (R$)</span>
                                <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(parseFloat(discountStr.replace(',', '.')) || 0)}
                                </div>
                            </div>
                        )}
                        {activeTab === 'OBSERVATION' && (
                            <div className="w-full px-4 animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 block">Nota / Observação</span>
                                <textarea
                                    value={observation}
                                    onChange={(e) => setObservation(e.target.value)}
                                    placeholder="Ex: Sem cebola, gelo e limão..."
                                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px] text-slate-900 dark:text-slate-50 transition-all"
                                    autoFocus
                                />
                            </div>
                        )}
                    </div>

                    {activeTab !== 'OBSERVATION' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-300">
                            <Numpad
                                onKeyPress={handleKeyPress}
                                onBackspace={handleBackspace}
                                showDecimal={activeTab === 'QUANTITY' ? allowFractions : true}
                                currentLength={
                                    activeTab === 'QUANTITY'
                                        ? quantityStr.length
                                        : activeTab === 'PRICE'
                                            ? priceStr.length
                                            : discountStr.length
                                }
                                maxLength={10}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                    <button
                        type="button"
                        onClick={() => setIsReturn(!isReturn)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${isReturn
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-700'
                            : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <RotateCcw className={`h-4 w-4 ${isReturn ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium ${isReturn ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                {isReturn ? 'Item marcado como DEVOLUÇÃO' : 'Marcar como devolução'}
                            </span>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-all relative ${isReturn ? 'bg-rose-500' : 'bg-slate-300 dark:bg-zinc-600'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isReturn ? 'left-5' : 'left-1'}`} />
                        </div>
                    </button>
                    <Button
                        className={`w-full h-12 text-base font-bold ${isReturn ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                        onClick={handleSave}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {isReturn ? 'Confirmar Devolução' : 'Confirmar Alteração'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
