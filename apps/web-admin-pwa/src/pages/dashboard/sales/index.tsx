import { useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pos/ui'
import { useSalesStore } from '../../../store/sales'
import { useSetupStore } from '../../../store/setup'
import { formatCurrency } from '../../../lib/utils'
import { Printer, Receipt as ReceiptIcon, Search, Eye, MessageCircle, Mail, XCircle, AlertCircle, Calendar, Filter } from 'lucide-react'
import { Sale, PaymentMethod } from '@pos/shared'
import { Receipt } from '../../../components/Receipt'
import { VoidSaleModal } from '../../../components/VoidSaleModal'
import { handleShareReceipt } from '../../../lib/receipt'
import { SettleCreditModal } from '../../../components/SettleCreditModal'
import { useTerminalsStore } from '../../../store/terminals'

export function SalesPage() {
    const { sales, voidSale } = useSalesStore()
    const { terminals } = useTerminalsStore()
    const { storeName } = useSetupStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED' | 'PENDING_CREDIT'>('ALL')
    const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'ALL'>('ALL')
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [saleToVoid, setSaleToVoid] = useState<string | null>(null)
    const [saleToSettle, setSaleToSettle] = useState<Sale | null>(null)
    const receiptRef = useRef<HTMLDivElement>(null)
    const terminalNameById = useMemo(
        () => Object.fromEntries(terminals.map((terminal) => [terminal.id, terminal.name])),
        [terminals]
    )

    const handlePrintReceipt = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: 'Recibo',
    })

    const filteredSales = sales.filter(s => {
        // Search term
        const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.customerCpf?.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')) ||
            s.operatorName?.toLowerCase().includes(searchTerm.toLowerCase())

        // Status filter
        let matchesStatus = true
        if (statusFilter === 'ALL') {
            matchesStatus = true
        } else if (statusFilter === 'COMPLETED' || statusFilter === 'VOIDED') {
            matchesStatus = s.status === statusFilter
        } else if (statusFilter === 'PENDING_CREDIT') {
            matchesStatus = s.status === 'COMPLETED' && s.payments.some(p => p.method === PaymentMethod.CREDIT) && !s.creditSettledAt
        }

        // Date filter
        let matchesDate = true
        if (dateFilter === 'TODAY') {
            const today = new Date().toISOString().split('T')[0]
            matchesDate = s.createdAt.startsWith(today)
        } else if (dateFilter === 'WEEK') {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            matchesDate = new Date(s.createdAt) >= weekAgo
        }

        return matchesSearch && matchesStatus && matchesDate
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Histórico de Vendas</h1>
                    <p className="text-muted-foreground">Consulte vendas anteriores e reimprima recibos.</p>
                </div>
            </div>

            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <CardTitle className="text-lg">Vendas Realizadas</CardTitle>
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="ID, CPF ou Operador..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                                <SelectTrigger className="h-9 w-[130px]">
                                    <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos Status</SelectItem>
                                    <SelectItem value="COMPLETED">Concluídas</SelectItem>
                                    <SelectItem value="VOIDED">Canceladas</SelectItem>
                                    <SelectItem value="PENDING_CREDIT">Pendentes (Fiado)</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                                <SelectTrigger className="h-9 w-[130px]">
                                    <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todo Período</SelectItem>
                                    <SelectItem value="TODAY">Hoje</SelectItem>
                                    <SelectItem value="WEEK">Últimos 7 dias</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredSales.length === 0 ? (
                        <div className="flex justify-center items-center py-10 text-slate-500">
                            Nenhuma venda encontrada.
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-200 dark:border-zinc-800">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Data/Hora</th>
                                        <th className="px-4 py-3 font-medium">ID da Venda</th>
                                        <th className="px-4 py-3 font-medium">Operador</th>
                                        <th className="px-4 py-3 font-medium">Terminal</th>
                                        <th className="px-4 py-3 font-medium">CPF na Nota</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium text-right">Total</th>
                                        <th className="px-4 py-3 font-medium text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                                    {filteredSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                            <td className="px-4 py-3">
                                                {new Date(sale.createdAt).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                                {sale.id.split('-')[0]}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sale.operatorName || 'Caixa'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sale.terminalId ? terminalNameById[sale.terminalId] || sale.terminalId : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sale.customerCpf || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const isPendingCredit = sale.status === 'COMPLETED' && sale.payments.some(p => p.method === PaymentMethod.CREDIT) && !sale.creditSettledAt

                                                    return (
                                                        <span key={`${sale.status}-${isPendingCredit}`} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${sale.status === 'VOIDED' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30' : isPendingCredit ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'}`}>
                                                            {sale.status === 'VOIDED' ? 'Cancelada' : isPendingCredit ? 'Pendente: Fiado' : 'Concluída'}
                                                        </span>
                                                    )
                                                })()}
                                            </td>
                                            <td className={`px-4 py-3 font-medium text-right ${sale.status === 'VOIDED' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {formatCurrency(sale.total)}
                                            </td>
                                            <td className="px-4 py-3 text-center space-x-2 flex items-center justify-center gap-1">
                                                {sale.status !== 'VOIDED' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                        onClick={() => setSaleToVoid(sale.id)}
                                                        title="Cancelar Venda"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {sale.status !== 'VOIDED' && sale.payments.some(p => p.method === PaymentMethod.CREDIT) && !sale.creditSettledAt && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900/30 dark:hover:bg-amber-900/20"
                                                        onClick={() => setSaleToSettle(sale)}
                                                        title="Receber Fiado"
                                                    >
                                                        Receber
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => setSelectedSale(sale)}
                                                    title="Ver Recibo"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Receipt Modal */}
            {selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-950">
                            <h3 className="font-semibold flex items-center">
                                <ReceiptIcon className="w-4 h-4 mr-2 text-primary" />
                                Detalhes da Venda
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedSale(null)} className="h-8 w-8 rounded-full">
                                <span className="sr-only">Fechar</span>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-zinc-950">
                            {selectedSale && (
                                <div ref={receiptRef} className="print-receipt">
                                    <Receipt sale={selectedSale} />
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap gap-2">
                            {selectedSale?.status !== 'VOIDED' ? (
                                <div className="flex gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/30 dark:hover:bg-emerald-900/30"
                                        onClick={() => selectedSale && handleShareReceipt(selectedSale, storeName || 'Minha Loja', 'whatsapp')}
                                        title="Enviar WhatsApp"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-900/30"
                                        onClick={() => selectedSale && handleShareReceipt(selectedSale, storeName || 'Minha Loja', 'email')}
                                        title="Enviar E-mail"
                                    >
                                        <Mail className="w-5 h-5" />
                                    </Button>
                                    <Button className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handlePrintReceipt()}>
                                        <Printer className="w-4 h-4 mr-2" />
                                        Imprimir
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-full bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-3 flex items-center justify-center rounded-lg mb-2 text-sm font-medium">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Venda cancelada
                                </div>
                            )}
                            <Button variant="outline" className="w-full h-12 mt-1" onClick={() => setSelectedSale(null)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Void Modal Component */}
            <VoidSaleModal
                isOpen={!!saleToVoid}
                saleId={saleToVoid || ''}
                onClose={() => setSaleToVoid(null)}
                onConfirm={(reason) => {
                    if (saleToVoid) {
                        voidSale(saleToVoid, reason, 'Admin'); // Hardcoded until Auth is fully mapped
                    }
                }}
            />

            {saleToSettle && (
                <SettleCreditModal
                    sale={saleToSettle}
                    isOpen={!!saleToSettle}
                    onClose={() => setSaleToSettle(null)}
                />
            )}
        </div>
    )
}
