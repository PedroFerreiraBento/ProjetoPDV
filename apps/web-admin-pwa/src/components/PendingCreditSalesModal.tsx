import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@pos/ui'
import { Sale, PaymentMethod } from '@pos/shared'
import { useSalesStore } from '../store/sales'
import { formatCurrency } from '../lib/utils'
import { WalletCards, Calendar, UserCircle2 } from 'lucide-react'
import { SettleCreditModal } from './SettleCreditModal'

interface PendingCreditSalesModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    terminalId?: string | null
}

export function PendingCreditSalesModal({ isOpen, onOpenChange, terminalId }: PendingCreditSalesModalProps) {
    const { sales } = useSalesStore()
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

    const pendingCreditSales = useMemo(() => {
        if (!terminalId) return []
        return sales
            .filter((sale) =>
                sale.terminalId === terminalId &&
                sale.status === 'COMPLETED' &&
                sale.payments.some((p) => p.method === PaymentMethod.CREDIT) &&
                !sale.creditSettledAt
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [sales, terminalId])

    const getPendingAmount = (sale: Sale) =>
        sale.payments
            .filter((p) => p.method === PaymentMethod.CREDIT)
            .reduce((sum, p) => sum + p.amount, 0)

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <WalletCards className="h-5 w-5 text-primary" />
                            Fiados Pendentes deste Terminal
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {!terminalId ? (
                            <div className="text-sm text-slate-500 text-center py-10">
                                Nenhum terminal selecionado.
                            </div>
                        ) : pendingCreditSales.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-10">
                                Nenhum fiado pendente para este terminal.
                            </div>
                        ) : (
                            pendingCreditSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="rounded-xl border border-slate-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 flex items-center justify-between gap-4"
                                >
                                    <div className="min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                            {formatCurrency(getPendingAmount(sale))}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(sale.createdAt).toLocaleString('pt-BR')}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <UserCircle2 className="h-3.5 w-3.5" />
                                            {sale.customerName || sale.customerCpf || 'Cliente não identificado'}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            Operador da venda: <span className="font-medium text-slate-700 dark:text-zinc-300">{sale.operatorName || 'Não informado'}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                                            Venda #{sale.id.split('-')[0]}
                                        </div>
                                    </div>

                                    <Button
                                        className="shrink-0"
                                        onClick={() => setSelectedSale(sale)}
                                    >
                                        Receber
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {selectedSale && (
                <SettleCreditModal
                    isOpen={!!selectedSale}
                    sale={selectedSale}
                    onClose={() => setSelectedSale(null)}
                />
            )}
        </>
    )
}
