import { useState, useEffect } from 'react'
import {
    X,
    Check,
    Tag,
    Percent,
    PlusCircle,
    MinusCircle
} from 'lucide-react'
import { Button, Numpad } from '@pos/ui'
import { formatCurrency } from '../lib/utils'

interface SaleAdjustmentsModalProps {
    isOpen: boolean
    onClose: () => void
    currentDiscountValue: number
    currentDiscountType: 'PERCENT' | 'FIXED'
    currentFeeValue: number
    currentFeeType: 'PERCENT' | 'FIXED'
    onConfirm: (adjustments: {
        discountValue: number
        discountType: 'PERCENT' | 'FIXED'
        feeValue: number
        feeType: 'PERCENT' | 'FIXED'
    }) => void
}

type Tab = 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'FEE_PERCENT' | 'FEE_FIXED'

export function SaleAdjustmentsModal({
    isOpen,
    onClose,
    currentDiscountValue,
    currentDiscountType,
    currentFeeValue,
    currentFeeType,
    onConfirm
}: SaleAdjustmentsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('DISCOUNT_PERCENT')
    const [discountStr, setDiscountStr] = useState('')
    const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
    const [feeStr, setFeeStr] = useState('')
    const [feeType, setFeeType] = useState<'PERCENT' | 'FIXED'>('PERCENT')

    useEffect(() => {
        if (isOpen) {
            setDiscountStr(currentDiscountValue.toString().replace('.', ','))
            setDiscountType(currentDiscountType)
            setFeeStr(currentFeeValue.toString().replace('.', ','))
            setFeeType(currentFeeType)

            // Set initial tab based on which one has values, default to discount %
            if (currentFeeValue > 0) {
                setActiveTab(currentFeeType === 'PERCENT' ? 'FEE_PERCENT' : 'FEE_FIXED')
            } else {
                setActiveTab(currentDiscountType === 'PERCENT' ? 'DISCOUNT_PERCENT' : 'DISCOUNT_FIXED')
            }
        }
    }, [isOpen, currentDiscountValue, currentDiscountType, currentFeeValue, currentFeeType])

    const handleKeyPress = (key: string) => {
        if (activeTab.startsWith('DISCOUNT')) {
            setDiscountStr(prev => prev + key)
        } else {
            setFeeStr(prev => prev + key)
        }
    }

    const handleBackspace = () => {
        if (activeTab.startsWith('DISCOUNT')) {
            setDiscountStr(prev => prev.slice(0, -1))
        } else {
            setFeeStr(prev => prev.slice(0, -1))
        }
    }

    const handleSave = () => {
        const dVal = parseFloat(discountStr.replace(',', '.')) || 0
        const fVal = parseFloat(feeStr.replace(',', '.')) || 0
        onConfirm({
            discountValue: dVal,
            discountType,
            feeValue: fVal,
            feeType
        })
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                            <Percent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-50">Ajustes da Venda</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Descontos e Acréscimos Globais</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex p-2 gap-1.5 bg-slate-50 dark:bg-zinc-950/50">
                    <button
                        onClick={() => {
                            setActiveTab('DISCOUNT_PERCENT')
                            setDiscountType('PERCENT')
                        }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all text-[10px] ${activeTab === 'DISCOUNT_PERCENT'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <MinusCircle className="h-4 w-4" />
                        Desconto %
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('DISCOUNT_FIXED')
                            setDiscountType('FIXED')
                        }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all text-[10px] ${activeTab === 'DISCOUNT_FIXED'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-emerald-600 font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Tag className="h-4 w-4" />
                        Desconto R$
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('FEE_PERCENT')
                            setFeeType('PERCENT')
                        }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all text-[10px] ${activeTab === 'FEE_PERCENT'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-amber-600 font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Taxa %
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('FEE_FIXED')
                            setFeeType('FIXED')
                        }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all text-[10px] ${activeTab === 'FEE_FIXED'
                            ? 'bg-white dark:bg-zinc-900 shadow-sm text-amber-600 font-bold border border-slate-100 dark:border-zinc-800'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Tag className="h-4 w-4" />
                        Taxa R$
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <div className="w-full text-center mb-6 bg-slate-50 dark:bg-zinc-800/50 py-10 rounded-2xl border border-slate-100 dark:border-zinc-800 min-h-[160px] flex items-center justify-center overflow-hidden">
                        {(activeTab === 'DISCOUNT_PERCENT' || activeTab === 'DISCOUNT_FIXED') ? (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-1">Desconto Total na Venda</span>
                                <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                                    {discountType === 'PERCENT' ? (
                                        <>{discountStr || '0'}<span className="text-3xl ml-1">%</span></>
                                    ) : (
                                        formatCurrency(parseFloat(discountStr.replace(',', '.')) || 0)
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
                                <span className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mb-1">Acréscimo / Taxa na Venda</span>
                                <div className="text-5xl font-bold text-amber-600 dark:text-amber-400 flex items-center">
                                    {feeType === 'PERCENT' ? (
                                        <>{feeStr || '0'}<span className="text-3xl ml-1">%</span></>
                                    ) : (
                                        formatCurrency(parseFloat(feeStr.replace(',', '.')) || 0)
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="animate-in slide-in-from-bottom-4 duration-300">
                        <Numpad
                            onKeyPress={handleKeyPress}
                            onBackspace={handleBackspace}
                            showDecimal={true}
                            currentLength={activeTab.startsWith('DISCOUNT') ? discountStr.length : feeStr.length}
                            maxLength={10}
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-xl h-12 font-bold uppercase text-xs tracking-widest">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="rounded-xl h-12 font-bold uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                        <Check className="h-4 w-4 mr-2" />
                        Confirmar
                    </Button>
                </div>
            </div>
        </div>
    )
}
