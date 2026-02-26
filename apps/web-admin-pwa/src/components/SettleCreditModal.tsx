import { useState } from 'react'
import { Button } from '@pos/ui'
import { Sale, PaymentMethod } from '@pos/shared'
import { Banknote, CreditCard, QrCode, X, CheckCircle2 } from 'lucide-react'
import { useSalesStore } from '../store/sales'
import { useCashRegisterStore } from '../store/cash-register'
import { useOperatorsStore } from '../store/operators'
import { formatCurrency } from '../lib/utils'
import toast from 'react-hot-toast'

interface SettleCreditModalProps {
    isOpen: boolean
    sale: Sale
    onClose: () => void
}

export function SettleCreditModal({ isOpen, sale, onClose }: SettleCreditModalProps) {
    const { settleCreditSale } = useSalesStore()
    const { addTransaction, getCurrentSession } = useCashRegisterStore()
    const { currentOperator } = useOperatorsStore()
    const [method, setMethod] = useState<PaymentMethod | null>(null)

    if (!isOpen) return null

    // Determine how much is pending in credit
    const creditAmount = sale.payments
        .filter(p => p.method === PaymentMethod.CREDIT)
        .reduce((sum, p) => sum + p.amount, 0)

    const handleSettle = () => {
        if (!method) {
            toast.error('Selecione uma forma de pagamento.')
            return
        }

        const nonCreditPayments = sale.payments.filter(p => p.method !== PaymentMethod.CREDIT)
        const updatedPayments = [...nonCreditPayments, { method, amount: creditAmount }]

        settleCreditSale(sale.id, updatedPayments)

        // Add to cash register if it's MONEY and there is an open session
        if (method === PaymentMethod.MONEY && currentOperator) {
            const session = getCurrentSession()
            if (session) {
                addTransaction({
                    type: 'SALE',
                    amount: creditAmount,
                    description: `Recebimento de Fiado - Venda #${sale.id.split('-')[0]} `,
                    operatorId: currentOperator.id,
                    operatorName: currentOperator.name
                })
            }
        }

        toast.success('Baixa registrada com sucesso!')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-50">
                <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-950">
                    <h3 className="font-semibold text-lg flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
                        Receber Fiado
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6">
                    <div className="mb-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl text-center flex flex-col items-center">
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-1">Valor Pendente</span>
                        <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(creditAmount)}</span>
                        {sale.customerName && (
                            <span className="text-sm text-slate-500 mt-2">Cliente: <span className="font-medium text-slate-700 dark:text-slate-300">{sale.customerName}</span></span>
                        )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-3">Como o pagamento está sendo feito agora?</h4>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <button
                            onClick={() => setMethod(PaymentMethod.MONEY)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${method === PaymentMethod.MONEY
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                                }`}
                        >
                            <Banknote className="w-6 h-6 mb-2" />
                            <span className="text-xs font-semibold">Dinheiro</span>
                        </button>
                        <button
                            onClick={() => setMethod(PaymentMethod.PIX)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${method === PaymentMethod.PIX
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                                }`}
                        >
                            <QrCode className="w-6 h-6 mb-2" />
                            <span className="text-xs font-semibold">PIX</span>
                        </button>
                        <button
                            onClick={() => setMethod(PaymentMethod.DEBIT_CARD)}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${method === PaymentMethod.DEBIT_CARD
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-700'
                                }`}
                        >
                            <CreditCard className="w-6 h-6 mb-2" />
                            <span className="text-xs font-semibold">Cartão</span>
                        </button>
                    </div>

                    <p className="text-xs text-slate-500 text-center mb-6">
                        Ao confirmar, o status financeiro desta venda será atualizado como pago.
                    </p>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-12" onClick={onClose}>Cancelar</Button>
                        <Button className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold" disabled={!method} onClick={handleSettle}>
                            Confirmar Baixa
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
