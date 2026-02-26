import { useState } from 'react'
import { Button, Input } from '@pos/ui'
import { AlertTriangle, X } from 'lucide-react'

interface VoidSaleModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    saleId: string
}

export function VoidSaleModal({ isOpen, onClose, onConfirm, saleId }: VoidSaleModalProps) {
    const [reason, setReason] = useState('')

    if (!isOpen) return null

    const handleConfirm = () => {
        if (!reason.trim()) return
        onConfirm(reason.trim())
        setReason('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/30 flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <h3 className="font-semibold flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Cancelar Venda #{saleId.split('-')[0]}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-rose-600/70 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/50">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Você está prestes a cancelar esta venda. Esta ação <strong>não pode ser desfeita</strong> e os valores serão removidos do relatório de faturamento diário.
                    </p>

                    <div className="space-y-3">
                        <label htmlFor="reason" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Motivo do Cancelamento <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            id="reason"
                            placeholder="Ex: Refeito pagamento incorreto, Cliente desistiu..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && reason.trim()) {
                                    handleConfirm()
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Voltar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!reason.trim()}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                        Confirmar Cancelamento
                    </Button>
                </div>
            </div>
        </div>
    )
}
