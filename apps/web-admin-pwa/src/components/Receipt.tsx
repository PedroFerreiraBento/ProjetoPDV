import { Sale, PaymentMethod } from '@pos/shared'
import { Receipt as ReceiptIcon, AlertOctagon } from 'lucide-react'
import { formatCurrency } from '../lib/utils'

interface ReceiptProps {
    sale: Sale
}

export function Receipt({ sale }: ReceiptProps) {
    const getMethodName = (m: PaymentMethod) => {
        switch (m) {
            case PaymentMethod.MONEY: return 'Dinheiro';
            case PaymentMethod.PIX: return 'PIX';
            case PaymentMethod.CREDIT_CARD: return 'C. Crédito';
            case PaymentMethod.DEBIT_CARD: return 'C. Débito';
            default: return 'Outro';
        }
    }

    // Helper to compute original price before discounts
    const getItemTotal = (item: any) => {
        return item.price * item.quantity
    }

    return (
        <div className="max-w-sm mx-auto bg-white dark:bg-zinc-900 p-6 rounded shadow-sm border border-slate-200 dark:border-zinc-800 font-mono text-sm print:shadow-none print:border-none print:p-0 relative overflow-hidden">
            {sale.status === 'VOIDED' && (
                <div className="absolute top-12 left-0 right-0 z-10 pointer-events-none opacity-20 transform -rotate-45 flex justify-center items-center">
                    <span className="text-4xl md:text-5xl font-black text-rose-600 tracking-widest border-4 border-rose-600 px-4 py-2 w-[150%] text-center ml-[-25%]">
                        CANCELADA
                    </span>
                </div>
            )}

            <div className="text-center mb-6 relative z-20">
                <ReceiptIcon className="w-8 h-8 mx-auto mb-2 text-slate-400 print:hidden" />
                <h3 className="font-bold text-lg leading-tight uppercase">Minha Loja</h3>
                <p className="text-xs text-slate-500">Recibo Não Fiscal</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(sale.createdAt).toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-slate-400 mt-1">Nº {sale.id.split('-')[0]}</p>
            </div>

            {sale.customerCpf && (
                <div className="mb-4 pb-4 border-b border-dashed border-slate-300 dark:border-zinc-700">
                    <p><strong>CPF/CNPJ Consumidor:</strong> {sale.customerCpf}</p>
                </div>
            )}

            <div className="space-y-2 mb-4">
                {sale.items.map(item => (
                    <div key={item.id} className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <div className="pr-4">
                                <span className={item.isReturn ? 'text-rose-600' : ''}>
                                    {item.isReturn && <span className="text-[10px] font-bold mr-1">[DEV]</span>}
                                    {item.quantity}x {item.name}
                                </span>
                            </div>
                            <span className={`whitespace-nowrap ${item.isReturn ? 'text-rose-600' : ''}`}>
                                {item.isReturn ? '- ' : ''}{formatCurrency(getItemTotal(item))}
                            </span>
                        </div>
                        {item.discountValue && item.discountValue > 0 ? (
                            <div className="flex justify-between text-xs text-slate-500 pl-4 mt-0.5">
                                <span>Desc. Item</span>
                                <span>- {formatCurrency(item.discountType === 'PERCENT' ? (getItemTotal(item) * item.discountValue / 100) : item.discountValue)}</span>
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-zinc-700 pt-4 mb-4 space-y-1">
                <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.totalDiscounts > 0 && (
                    <div className="flex justify-between text-rose-500">
                        <span>Descontos Globais</span>
                        <span>- {formatCurrency(sale.totalDiscounts)}</span>
                    </div>
                )}
                {sale.totalFees > 0 && (
                    <div className="flex justify-between text-slate-500">
                        <span>Acréscimos Globais</span>
                        <span>+ {formatCurrency(sale.totalFees)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-slate-200 dark:border-zinc-800">
                    <span>TOTAL</span>
                    <span>{formatCurrency(sale.total)}</span>
                </div>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-zinc-700 pt-4 mb-4 space-y-2">
                <div className="font-bold mb-1">PAGAMENTOS</div>
                {sale.payments.map((p, i) => (
                    <div key={i} className="flex justify-between">
                        <span>{getMethodName(p.method)}</span>
                        <span>{formatCurrency(p.amount)}</span>
                    </div>
                ))}
                {(sale.change || 0) > 0 && (
                    <div className="flex justify-between font-bold pt-2 mt-2 border-t border-slate-100 dark:border-zinc-800">
                        <span>TROCO</span>
                        <span>{formatCurrency(sale.change!)}</span>
                    </div>
                )}
            </div>

            <div className="text-center text-xs text-slate-500 mt-8 relative z-20">
                <p>Operador: {sale.operatorName || 'Caixa'}</p>

                {sale.status === 'VOIDED' && sale.voidReason && (
                    <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-md text-left">
                        <p className="font-semibold flex items-center mb-1">
                            <AlertOctagon className="w-3 h-3 mr-1" />
                            Motivo do Cancelamento:
                        </p>
                        <p className="italic">"{sale.voidReason}"</p>
                    </div>
                )}

                {sale.status !== 'VOIDED' && <p className="mt-2">Obrigado pela preferência!</p>}
            </div>
        </div>
    )
}
