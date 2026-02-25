import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/utils'
import { Button, Input } from '@pos/ui'
import { X, Banknote, ArrowUpRight, ArrowDownLeft, Lock, Unlock, AlertCircle, History } from 'lucide-react'
import { useCashRegisterStore } from '../store/cash-register'
import { useOperatorsStore } from '../store/operators'
import { useTerminalsStore } from '../store/terminals'

interface CashControlModalProps {
    isOpen: boolean
    onClose: () => void
    initialMode?: 'OPEN' | 'CLOSE' | 'BLEED' | 'SUPPLY'
}

export function CashControlModal({ isOpen, onClose, initialMode = 'OPEN' }: CashControlModalProps) {
    const { currentOperator } = useOperatorsStore()
    const { terminals, currentTerminalId } = useTerminalsStore()
    const { getCurrentSession, getExpectedBalance, openSession, closeSession, addTransaction } = useCashRegisterStore()

    const [mode, setMode] = useState<'OPEN' | 'CLOSE' | 'BLEED' | 'SUPPLY' | 'HISTORY'>(initialMode)
    const [amountInput, setAmountInput] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState('')

    const currentSession = getCurrentSession()

    useEffect(() => {
        if (isOpen) {
            setMode(currentSession ? (initialMode === 'OPEN' ? 'BLEED' : initialMode) : 'OPEN')
            setAmountInput('')
            setDescription('')
            setError('')
        }
    }, [isOpen, currentSession, initialMode])

    const handleAction = () => {
        if (!currentOperator) return

        const amount = parseFloat(amountInput.replace(',', '.'))
        if (isNaN(amount) || amount < 0) {
            setError('Digite um valor válido')
            return
        }

        try {
            const amountCents = Math.round(amount * 100)
            if (mode === 'OPEN') {
                const terminal = terminals.find(t => t.id === currentTerminalId)
                if (!terminal) {
                    setError('Nenhum terminal de caixa selecionado. Configure um terminal primeiro.')
                    return
                }
                openSession(
                    currentOperator.id,
                    currentOperator.name,
                    amountCents,
                    terminal.branchId,
                    terminal.id,
                    terminal.name
                )
                onClose()
            } else if (mode === 'CLOSE') {
                closeSession(amountCents)
                onClose()
            } else if (mode === 'BLEED') {
                addTransaction({
                    type: 'BLEED',
                    amount: amountCents,
                    description: description || 'Sangria de caixa',
                    operatorId: currentOperator.id,
                    operatorName: currentOperator.name,
                })
                onClose()
            } else if (mode === 'SUPPLY') {
                addTransaction({
                    type: 'SUPPLY',
                    amount: amountCents,
                    description: description || 'Suprimento de caixa',
                    operatorId: currentOperator.id,
                    operatorName: currentOperator.name,
                })
                onClose()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao realizar operação')
        }
    }

    if (!isOpen) return null

    const expectedBalance = currentSession ? getExpectedBalance(currentSession) : 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                            {mode === 'OPEN' && <Unlock className="w-5 h-5" />}
                            {mode === 'CLOSE' && <Lock className="w-5 h-5" />}
                            {mode === 'BLEED' && <ArrowUpRight className="w-5 h-5" />}
                            {mode === 'SUPPLY' && <ArrowDownLeft className="w-5 h-5" />}
                            {mode === 'HISTORY' && <History className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 leading-tight">
                                {mode === 'OPEN' && 'Abertura de Caixa'}
                                {mode === 'CLOSE' && 'Fechamento de Caixa'}
                                {mode === 'BLEED' && 'Sangria (Retirada)'}
                                {mode === 'SUPPLY' && 'Suprimento (Entrada)'}
                                {mode === 'HISTORY' && 'Histórico do Turno'}
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
                                {currentOperator?.name} • {new Date().toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {mode !== 'HISTORY' && (
                        <>
                            {/* Summary Info */}
                            {currentSession && mode === 'CLOSE' && (
                                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-500 uppercase tracking-wider">Saldo Inicial</span>
                                        <span className="text-slate-700 dark:text-zinc-300 font-mono">{formatCurrency(currentSession.openingBalance / 100)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-500 uppercase tracking-wider">Vendas (Dinheiro)</span>
                                        <span className="text-slate-700 dark:text-zinc-300 font-mono">
                                            {formatCurrency(currentSession.transactions.filter(t => t.type === 'SALE').reduce((acc, t) => acc + t.amount, 0) / 100)}
                                        </span>
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-zinc-700 my-1" />
                                    <div className="flex justify-between items-center pt-0.5">
                                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Saldo Esperado</span>
                                        <span className="text-lg font-black text-primary font-mono tracking-tight">
                                            {formatCurrency(expectedBalance / 100)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Main Input */}
                            <div className="space-y-2">
                                {(mode === 'BLEED' || mode === 'SUPPLY') && (
                                    <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl mb-4">
                                        <button
                                            onClick={() => setMode('BLEED')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'BLEED' ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                            Sangria
                                        </button>
                                        <button
                                            onClick={() => setMode('SUPPLY')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'SUPPLY' ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <ArrowDownLeft className="w-4 h-4" />
                                            Suprimento
                                        </button>
                                    </div>
                                )}
                                <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest pl-1 block">
                                    {mode === 'OPEN' && 'Valor Inicial em Caixa'}
                                    {mode === 'CLOSE' && 'Valor Contado no Caixa'}
                                    {mode === 'BLEED' && 'Valor da Retirada (Sangria)'}
                                    {mode === 'SUPPLY' && 'Valor da Entrada (Suprimento)'}
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300 dark:text-zinc-600 transition-colors group-focus-within:text-primary">R$</span>
                                    <Input
                                        placeholder="0,00"
                                        value={amountInput}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d,]/g, '')
                                            setAmountInput(val)
                                            setError('')
                                        }}
                                        className="h-16 pl-14 text-3xl font-black text-slate-800 dark:text-zinc-100 placeholder:text-slate-200 dark:placeholder:text-zinc-800 rounded-2xl border-2 focus:border-primary focus:ring-0 transition-all font-mono tracking-tighter"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {(mode === 'BLEED' || mode === 'SUPPLY') && (
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest pl-1 block">Motivo / Descrição</label>
                                    <Input
                                        placeholder={mode === 'BLEED' ? "Ex: Pagamento de fornecedor" : "Ex: Troco inicial"}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-12 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 rounded-xl"
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold animate-in slide-in-from-top-1">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                        </>
                    )}

                    {mode === 'HISTORY' && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {currentSession?.transactions.slice().reverse().map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'SALE' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            t.type === 'BLEED' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                t.type === 'SUPPLY' ? 'bg-primary/10 text-primary' :
                                                    'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300'
                                            }`}>
                                            {t.type === 'SALE' && <Banknote className="w-4 h-4" />}
                                            {t.type === 'BLEED' && <ArrowUpRight className="w-4 h-4" />}
                                            {t.type === 'SUPPLY' && <ArrowDownLeft className="w-4 h-4" />}
                                            {t.type === 'OPENING' && <Unlock className="w-4 h-4" />}
                                            {t.type === 'CLOSING' && <Lock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{t.description || t.type}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{new Date(t.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold font-mono ${(t.type === 'SALE' || t.type === 'SUPPLY' || t.type === 'OPENING') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {(t.type === 'SALE' || t.type === 'SUPPLY' || t.type === 'OPENING') ? '+' : '-'} {formatCurrency(t.amount / 100)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 flex gap-3">
                    {mode !== 'OPEN' && mode !== 'HISTORY' && (
                        <Button
                            variant="ghost"
                            className="flex-1 h-12"
                            onClick={() => setMode('HISTORY')}
                        >
                            Ver Histórico
                        </Button>
                    )}
                    {mode === 'HISTORY' && (
                        <Button
                            variant="ghost"
                            className="flex-1 h-12"
                            onClick={() => setMode(initialMode === 'OPEN' ? 'BLEED' : initialMode)}
                        >
                            Voltar
                        </Button>
                    )}
                    {mode !== 'HISTORY' && (
                        <Button
                            className={`flex-1 h-12 text-sm font-bold tracking-wide shadow-lg transition-transform active:scale-95 ${mode === 'OPEN' ? 'bg-primary hover:bg-primary/90' :
                                mode === 'CLOSE' ? 'bg-slate-800 hover:bg-slate-900' :
                                    mode === 'BLEED' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-primary hover:bg-primary/90'
                                }`}
                            onClick={handleAction}
                        >
                            {mode === 'OPEN' && <Unlock className="w-4 h-4 mr-2" />}
                            {mode === 'CLOSE' && <Lock className="w-4 h-4 mr-2" />}
                            {mode === 'BLEED' && <ArrowUpRight className="w-4 h-4 mr-2" />}
                            {mode === 'SUPPLY' && <ArrowDownLeft className="w-4 h-4 mr-2" />}
                            Confirmar Operação
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
