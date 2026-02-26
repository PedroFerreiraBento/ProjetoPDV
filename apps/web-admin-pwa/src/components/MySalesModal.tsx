import { useState, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@pos/ui'
import { Calendar, Search, MessageSquare, Clock, Receipt as ReceiptIcon } from 'lucide-react'
import { useSalesStore } from '../store/sales'
import { useOperatorsStore } from '../store/operators'
import { formatCurrency } from '../lib/utils'
import { Receipt } from './Receipt'
import { Sale, SaleItem } from '@pos/shared'

interface MySalesModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function MySalesModal({ isOpen, onOpenChange }: MySalesModalProps) {
    const { sales } = useSalesStore()
    const { currentOperator } = useOperatorsStore()
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

    // Filter sales by current operator and sort by newest first
    const mySales = useMemo(() => {
        if (!currentOperator) return []
        return sales
            .filter((sale: Sale) => sale.operatorId === currentOperator.id)
            .sort((a: Sale, b: Sale) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50) // Show last 50 sales for performance
    }, [sales, currentOperator])

    const selectedSale = useMemo(() =>
        mySales.find((s: Sale) => s.id === selectedSaleId),
        [mySales, selectedSaleId])

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-zinc-950">
                <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Minhas Vendas Recentes
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
                    {/* Sales List */}
                    <div className="flex-1 border-r border-slate-200 dark:border-zinc-800 overflow-y-auto bg-slate-50 dark:bg-zinc-950/50 p-4 space-y-3">
                        {mySales.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Search className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhuma venda encontrada para este operador.</p>
                            </div>
                        ) : (
                            mySales.map((sale: Sale) => {
                                const isVoided = sale.status === 'VOIDED'

                                // Extract observation from items if present
                                const itemWithObservation = sale.items?.find((item: SaleItem) => item.observation?.trim())
                                const observationText = itemWithObservation?.observation

                                return (
                                    <button
                                        key={sale.id}
                                        onClick={() => setSelectedSaleId(sale.id)}
                                        className={`w-full text-left bg-white dark:bg-zinc-900 border rounded-xl p-4 transition-all hover:shadow-md flex flex-col gap-3 group relative overflow-hidden ${selectedSaleId === sale.id
                                            ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                                            : isVoided
                                                ? 'border-rose-200 dark:border-rose-900/50 opacity-70'
                                                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start w-full gap-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                                        {formatCurrency(sale.total)}
                                                    </span>
                                                    {isVoided && (
                                                        <span className="bg-rose-500 text-white rounded-md h-5 text-[10px] uppercase tracking-wider font-bold p-0 px-1.5 shrink-0">
                                                            Cancelada
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 mt-1 gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(sale.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                </div>
                                            </div>

                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[120px]">
                                                    {sale.items?.length || 0} {(sale.items?.length || 0) === 1 ? 'item' : 'itens'}
                                                </div>
                                                {sale.customerName && (
                                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                        <span>{sale.customerName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Highlight Observations if any exist */}
                                        {observationText && (
                                            <div className="mt-1 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30 flex items-start gap-2">
                                                <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-xs font-medium text-amber-800 dark:text-amber-200/90 leading-relaxed italic line-clamp-2">
                                                    "{observationText}"
                                                </p>
                                            </div>
                                        )}

                                        {isVoided && sale.voidReason && (
                                            <div className="mt-1 p-2.5 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                                    Motivo: <span className="font-normal italic">"{sale.voidReason}"</span>
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* Receipt Details Panel */}
                    <div className="w-full md:w-[380px] bg-slate-100 dark:bg-zinc-900/40 p-4 lg:p-6 flex flex-col shrink-0 overflow-y-auto">
                        {selectedSale ? (
                            <div className="flex flex-col items-center">
                                <div className="mb-6 w-full max-w-[320px] bg-white dark:bg-zinc-950 p-2 rounded border border-slate-200 dark:border-zinc-800 shadow-sm">
                                    <Receipt sale={selectedSale} />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <ReceiptIcon className="w-16 h-16 mb-4 opacity-10" />
                                <p className="text-sm font-medium">Selecione uma venda</p>
                                <p className="text-xs text-center mt-1">Clique em uma transação na lista para visualizar o comprovante detalhado.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
