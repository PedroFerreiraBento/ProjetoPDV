import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { PaymentMethod, SalePayment, Sale, Customer, formatPhone } from '@pos/shared'
import { Button, Input } from '@pos/ui'
import { X, Banknote, CreditCard, QrCode, ArrowRight, CheckCircle2, UserCircle2, Printer, Plus, Trash2, MessageCircle, Mail, RotateCcw, Search, UserPlus } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { useCartStore } from '../store/cart'
import { useSetupStore } from '../store/setup'
import { useCustomersStore } from '../store/customers'
import { useSettingsStore } from '../store/settings'
import { Receipt } from './Receipt'
import { handleShareReceipt } from '../lib/receipt'
import toast from 'react-hot-toast'

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    total: number
    onFinalize: (payments: SalePayment[], customerCpf?: string, change?: number, customerId?: string, customerName?: string) => Sale
    onNewSale: () => void
}

export function PaymentModal({ isOpen, onClose, total, onFinalize, onNewSale }: PaymentModalProps) {
    const { customerCpf, setCustomerCpf } = useCartStore()
    const { storeName } = useSetupStore()
    const { searchCustomers, addCustomer, findByCpf } = useCustomersStore()
    const { allowCreditSales } = useSettingsStore()

    const [payments, setPayments] = useState<SalePayment[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([])
    const [showQuickCreate, setShowQuickCreate] = useState(false)
    const [quickName, setQuickName] = useState('')
    const [quickPhone, setQuickPhone] = useState('')

    // Controlled inputs for adding a new payment
    const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null)
    const [currentAmountInput, setCurrentAmountInput] = useState<string>('')

    const [isSuccess, setIsSuccess] = useState(false)
    const [finalSale, setFinalSale] = useState<Sale | null>(null)
    const receiptRef = useRef<HTMLDivElement>(null)

    const handlePrintReceipt = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: 'Recibo',
    })

    // Derived states
    const isReturnOrExchange = total <= 0
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)
    const remaining = isReturnOrExchange ? 0 : Math.max(0, total - totalPaid)

    // Change is only calculated on cash payments that exceed the remaining balance when they are added,
    // or simply if totalPaid > total. Usually change is just totalPaid - total.
    const change = isReturnOrExchange ? 0 : Math.max(0, totalPaid - total)
    const isReadyToFinalize = isReturnOrExchange || totalPaid >= total

    useEffect(() => {
        if (!isOpen) {
            setPayments([])
            setCurrentMethod(null)
            setCurrentAmountInput('')
            setIsSuccess(false)
            setFinalSale(null)
            setCustomerCpf(undefined)
            setSelectedCustomer(null)
            setCustomerSearchResults([])
            setShowQuickCreate(false)
            setQuickName('')
            setQuickPhone('')
        } else {
            // Pre-fill remaining if switching method and not enough paid yet
            if (remaining > 0) {
                setCurrentAmountInput(remaining.toFixed(2).replace('.', ','))
            }
        }
    }, [isOpen])

    // Auto-fill input when method changes if we haven't typed yet, or update to remaining
    useEffect(() => {
        if (currentMethod && remaining > 0) {
            setCurrentAmountInput(remaining.toFixed(2).replace('.', ','))
        }
    }, [currentMethod, remaining])

    const handleAddPayment = () => {
        if (!currentMethod) return

        if (currentMethod === PaymentMethod.CREDIT && !selectedCustomer) {
            toast.error('É obrigatório selecionar um cliente para vendas Fiado/Crediário.')
            return
        }

        const amount = parseFloat(currentAmountInput.replace(',', '.'))
        if (isNaN(amount) || amount <= 0) return

        // For CREDIT, we don't allow paying more than remaining
        const finalAmount = currentMethod === PaymentMethod.CREDIT ? Math.min(amount, remaining) : amount

        setPayments([...payments, { method: currentMethod, amount: finalAmount }])
        setCurrentMethod(null)
        setCurrentAmountInput('')
    }

    const handleRemovePayment = (index: number) => {
        const newPayments = [...payments]
        newPayments.splice(index, 1)
        setPayments(newPayments)
    }

    const handleFinalize = () => {
        if (!isReadyToFinalize) return
        const sale = onFinalize(payments, customerCpf, change, selectedCustomer?.id, selectedCustomer?.name)
        setFinalSale(sale)
        setIsSuccess(true)
    }

    const handleFinishAndClose = () => {
        onNewSale()
        onClose()
    }

    if (!isOpen) return null

    const getMethodName = (m: PaymentMethod) => {
        switch (m) {
            case PaymentMethod.MONEY: return 'Dinheiro';
            case PaymentMethod.PIX: return 'PIX';
            case PaymentMethod.CREDIT_CARD: return 'C. Crédito';
            case PaymentMethod.DEBIT_CARD: return 'C. Débito';
            case PaymentMethod.CREDIT: return 'Fiado';
        }
    }

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '')
        if (val.length <= 11) {
            val = val.replace(/(\d{3})(\d)/, '$1.$2')
            val = val.replace(/(\d{3})(\d)/, '$1.$2')
            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        } else {
            val = val.substring(0, 14) // Limit to CNPJ digits
            val = val.replace(/^(\d{2})(\d)/, '$1.$2')
            val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            val = val.replace(/\.(\d{3})(\d)/, '.$1/$2')
            val = val.replace(/(\d{4})(\d)/, '$1-$2')
        }
        setCustomerCpf(val)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${isSuccess ? 'scale-100 opacity-100' : 'scale-100 opacity-100'}`}>
                {isSuccess ? (
                    <div className="flex flex-col h-[80vh] max-h-[800px]">
                        <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/20">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mb-1">Pagamento Aprovado</h2>
                            <p className="text-emerald-600/80 dark:text-emerald-400/80">Venda finalizada com sucesso.</p>
                        </div>

                        {/* Receipt rendering */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-zinc-950">
                            {finalSale && (
                                <div ref={receiptRef} className="print-receipt">
                                    <Receipt sale={finalSale} />
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap sm:flex-nowrap gap-3">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none h-12 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/30 dark:hover:bg-emerald-900/30"
                                    onClick={() => finalSale && handleShareReceipt(finalSale, storeName || 'Minha Loja', 'whatsapp')}
                                    title="Enviar WhatsApp"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none h-12 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-900/30"
                                    onClick={() => finalSale && handleShareReceipt(finalSale, storeName || 'Minha Loja', 'email')}
                                    title="Enviar E-mail"
                                >
                                    <Mail className="w-5 h-5" />
                                </Button>
                                <Button variant="outline" className="flex-1 sm:flex-none h-12 text-slate-700 dark:text-slate-300" onClick={() => handlePrintReceipt()} title="Imprimir">
                                    <Printer className="w-5 h-5" />
                                </Button>
                            </div>
                            <Button className="w-full sm:flex-1 h-12 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleFinishAndClose}>
                                Nova Venda
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row h-auto max-h-[90vh]">
                        {/* Right / Top Side: Customer & Summary */}
                        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-zinc-950 p-6 flex flex-col border-r border-slate-200 dark:border-zinc-800">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Pagamento</h2>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full md:hidden">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="mb-6">
                                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center">
                                    <UserCircle2 className="w-4 h-4 mr-2" />
                                    CPF/CNPJ na Nota (Opcional)
                                </label>
                                <Input
                                    placeholder="000.000.000-00"
                                    value={customerCpf || ''}
                                    onChange={(e) => {
                                        handleCpfChange(e)
                                        const cpfVal = e.target.value.replace(/\D/g, '')
                                        if (cpfVal.length >= 3) {
                                            const results = searchCustomers(cpfVal)
                                            setCustomerSearchResults(results)
                                            if (cpfVal.length === 11) {
                                                const exact = findByCpf(cpfVal)
                                                if (exact) setSelectedCustomer(exact)
                                            }
                                        } else {
                                            setCustomerSearchResults([])
                                        }
                                    }}
                                    maxLength={18}
                                />

                                {/* Selected Customer Badge */}
                                {selectedCustomer && (
                                    <div className="mt-2 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/30 rounded-lg p-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {selectedCustomer.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{selectedCustomer.name}</p>
                                                {selectedCustomer.phone && <p className="text-[10px] text-indigo-500">{selectedCustomer.phone}</p>}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-indigo-600" onClick={() => setSelectedCustomer(null)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}

                                {/* Customer Search Results */}
                                {!selectedCustomer && customerSearchResults.length > 0 && (
                                    <div className="mt-2 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                        {customerSearchResults.slice(0, 3).map(c => (
                                            <button
                                                key={c.id}
                                                type="button"
                                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 last:border-0 transition-colors"
                                                onClick={() => {
                                                    setSelectedCustomer(c)
                                                    if (c.cpf) setCustomerCpf(c.cpf)
                                                    setCustomerSearchResults([])
                                                }}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center justify-center text-[10px] font-bold">
                                                    {c.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 truncate">{c.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{c.cpf}</p>
                                                </div>
                                                <Search className="w-3 h-3 text-slate-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Quick Create Customer */}
                                {!selectedCustomer && customerCpf && customerCpf.replace(/\D/g, '').length === 11 && !findByCpf(customerCpf) && (
                                    showQuickCreate ? (
                                        <div className="mt-2 border border-indigo-200 dark:border-indigo-800/40 rounded-xl overflow-hidden bg-indigo-50/50 dark:bg-indigo-900/10">
                                            <div className="px-3 py-2 bg-indigo-100/50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800/30">
                                                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    Cadastro Rápido
                                                </p>
                                            </div>
                                            <div className="p-3 space-y-2.5">
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Nome *</label>
                                                    <Input
                                                        placeholder="Nome do cliente"
                                                        value={quickName}
                                                        onChange={(e) => setQuickName(e.target.value)}
                                                        className="h-9 text-sm"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Telefone</label>
                                                    <Input
                                                        placeholder="(00) 00000-0000"
                                                        value={quickPhone}
                                                        onChange={(e) => setQuickPhone(formatPhone(e.target.value))}
                                                        className="h-9 text-sm"
                                                        maxLength={15}
                                                    />
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex-1 h-8 text-xs"
                                                        onClick={() => { setShowQuickCreate(false); setQuickName(''); setQuickPhone('') }}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        disabled={!quickName.trim()}
                                                        onClick={() => {
                                                            const c = addCustomer({
                                                                name: quickName.trim(),
                                                                cpf: customerCpf,
                                                                phone: quickPhone || undefined,
                                                            })
                                                            setSelectedCustomer(c)
                                                            setShowQuickCreate(false)
                                                            setQuickName('')
                                                            setQuickPhone('')
                                                        }}
                                                    >
                                                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                                                        Cadastrar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                            onClick={() => setShowQuickCreate(true)}
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Cadastrar novo cliente com este CPF
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-500 font-medium">
                                        {isReturnOrExchange ? (total === 0 ? 'Troca (R$ 0,00)' : 'Valor a Devolver') : 'Total da Venda'}
                                    </span>
                                    <span className={`text-xl font-bold ${isReturnOrExchange ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                        {total < 0 ? '- ' : ''}{formatCurrency(Math.abs(total))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-500 font-medium">Total Pago</span>
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(totalPaid)}
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                                    {remaining > 0 ? (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium text-sm text-rose-500">Falta Pagar</span>
                                            <span className="text-xl font-bold text-rose-500">
                                                {formatCurrency(remaining)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500 font-medium text-sm text-emerald-500">Troco</span>
                                            <span className="text-xl font-bold text-emerald-500">
                                                {formatCurrency(change)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto hidden md:block">
                                <Button variant="ghost" className="w-full text-slate-500" onClick={onClose}>Cancelar</Button>
                            </div>
                        </div>

                        {/* Left / Bottom Side: Payments */}
                        <div className="w-full md:w-7/12 p-6 flex flex-col">

                            {/* Payments List */}
                            <div className="flex-1 mb-6">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Pagamentos Adicionados</h3>
                                {payments.length === 0 ? (
                                    <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-slate-400">
                                        Nenhum pagamento adicionado ainda.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {payments.map((p, index) => (
                                            <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                                <div className="flex items-center font-medium">
                                                    <span className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mr-3 shadow-sm text-emerald-600">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </span>
                                                    {getMethodName(p.method)}
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="font-bold mr-4">{formatCurrency(p.amount)}</span>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950" onClick={() => handleRemovePayment(index)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Add Payment Section - Only show if there's remaining balance (not for returns/exchanges) */}
                            {isReturnOrExchange ? (
                                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 p-4 rounded-xl mb-6">
                                    <div className="flex items-center text-rose-700 dark:text-rose-400 mb-2">
                                        <RotateCcw className="w-5 h-5 mr-3 flex-shrink-0" />
                                        <p className="text-sm font-medium">
                                            {total === 0
                                                ? 'Troca sem diferença de valor. Clique abaixo para confirmar.'
                                                : `Devolução de ${formatCurrency(Math.abs(total))}. O valor será devolvido ao cliente.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            ) : remaining > 0 ? (
                                <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 mb-6">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Adicionar Pagamento</h3>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        <MethodToggle active={currentMethod === PaymentMethod.MONEY} onClick={() => setCurrentMethod(PaymentMethod.MONEY)} icon={<Banknote className="w-5 h-5" />} label="Dinheiro" />
                                        <MethodToggle active={currentMethod === PaymentMethod.PIX} onClick={() => setCurrentMethod(PaymentMethod.PIX)} icon={<QrCode className="w-5 h-5" />} label="PIX" />
                                        <MethodToggle active={currentMethod === PaymentMethod.DEBIT_CARD} onClick={() => setCurrentMethod(PaymentMethod.DEBIT_CARD)} icon={<CreditCard className="w-5 h-5" />} label="Débito" />
                                        <MethodToggle active={currentMethod === PaymentMethod.CREDIT_CARD} onClick={() => setCurrentMethod(PaymentMethod.CREDIT_CARD)} icon={<CreditCard className="w-5 h-5" />} label="Crédito" />
                                        {allowCreditSales && (
                                            <MethodToggle active={currentMethod === PaymentMethod.CREDIT} onClick={() => setCurrentMethod(PaymentMethod.CREDIT)} icon={<UserCircle2 className="w-5 h-5" />} label="Fiado" />
                                        )}
                                    </div>

                                    {currentMethod && (
                                        <div className="flex gap-2 animate-in slide-in-from-top-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                                                <Input
                                                    type="text"
                                                    className="pl-9 h-12 text-lg font-bold"
                                                    value={currentAmountInput}
                                                    onChange={e => setCurrentAmountInput(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddPayment}>
                                                <Plus className="w-5 h-5 mr-1" /> Adicionar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-4 rounded-xl text-emerald-700 dark:text-emerald-400 flex items-center mb-6">
                                    <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
                                    <p className="text-sm font-medium">O total pago já atinge ou excede o valor da venda. Você pode finalizar agora.</p>
                                </div>
                            )}

                            <div className="mt-auto">
                                <Button
                                    className={`w-full h-14 text-lg font-bold shadow-lg transition-all ${isReadyToFinalize
                                        ? (isReturnOrExchange ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white')
                                        : 'bg-slate-200 text-slate-400 dark:bg-zinc-800 cursor-not-allowed'
                                        }`}
                                    disabled={!isReadyToFinalize}
                                    onClick={handleFinalize}
                                >
                                    {isReturnOrExchange
                                        ? (total === 0 ? 'Confirmar Troca' : `Confirmar Devolução (${formatCurrency(Math.abs(total))})`)
                                        : (isReadyToFinalize ? 'Finalizar Venda' : `Faltam ${formatCurrency(remaining)}`)}
                                    {isReadyToFinalize && <ArrowRight className="ml-2 h-5 w-5" />}
                                </Button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function MethodToggle({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-20 ${active
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-900'
                }`}
        >
            <div className={`mb-1 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                {icon}
            </div>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    )
}
