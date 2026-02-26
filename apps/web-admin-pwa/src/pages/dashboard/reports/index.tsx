import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@pos/ui'
import { FileText, Download, TrendingUp, Users, CreditCard, Package, Tag, Percent, ArrowLeftRight, Info } from 'lucide-react'
import { useSalesStore } from '../../../store/sales'
import { useCashRegisterStore } from '../../../store/cash-register'
import { useProductsStore } from '../../../store/products'
import { useCategoriesStore } from '../../../store/categories'
import {
    filterSalesByDateRow, filterSessionsByDateRow, getSalesSummary,
    getSalesByOperator, getSalesByPaymentMethod, getSalesByProduct,
    getSalesByCategory, getDiscountsReport, downloadCSV
} from '../../../lib/reports'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { startOfDay, endOfDay } from 'date-fns'
import { CashSession } from '@pos/shared'

type TabId = 'summary' | 'shifts' | 'operators' | 'payments' | 'products' | 'categories' | 'discounts'

export function ReportsPage() {
    const { sales } = useSalesStore()
    const { sessions } = useCashRegisterStore()
    const productsStore = useProductsStore()
    const categoriesStore = useCategoriesStore()

    const [activeTab, setActiveTab] = useState<TabId>('summary')
    const [dateFrom, setDateFrom] = useState<string>(startOfDay(new Date()).toISOString().split('T')[0])
    const [dateTo, setDateTo] = useState<string>(endOfDay(new Date()).toISOString().split('T')[0])

    const dateRange = useMemo(() => ({
        from: startOfDay(new Date(dateFrom + 'T00:00:00')),
        to: endOfDay(new Date(dateTo + 'T23:59:59'))
    }), [dateFrom, dateTo])

    // Filtered data
    const filteredSales = useMemo(() => filterSalesByDateRow(sales, dateRange), [sales, dateRange])
    const filteredSessions = useMemo(() => filterSessionsByDateRow(sessions, dateRange), [sessions, dateRange])

    // Agregated reports
    const summary = useMemo(() => getSalesSummary(filteredSales), [filteredSales])
    const operatorReport = useMemo(() => getSalesByOperator(filteredSales), [filteredSales])
    const paymentReport = useMemo(() => getSalesByPaymentMethod(filteredSales), [filteredSales])
    const productReport = useMemo(() => getSalesByProduct(filteredSales, productsStore), [filteredSales, productsStore])
    const categoryReport = useMemo(() => getSalesByCategory(filteredSales, productsStore, categoriesStore), [filteredSales, productsStore, categoriesStore])
    const discountReport = useMemo(() => getDiscountsReport(filteredSales), [filteredSales])

    const handleExport = () => {
        const timestamp = new Date().getTime()
        switch (activeTab) {
            case 'summary':
                downloadCSV([{
                    'Período': `${dateFrom} até ${dateTo}`,
                    'Qtd. Vendas (Únicas)': summary.count,
                    'Total Itens Vendidos': summary.totalItems,
                    'Descontos': formatCurrency(summary.totalDiscounts),
                    'Ticket Médio': formatCurrency(summary.ticketMedio),
                    'Receita Total': formatCurrency(summary.totalRevenue)
                }], `resumo_vendas_${timestamp}`)
                break
            case 'shifts':
                downloadCSV(filteredSessions.map((s: CashSession) => ({
                    'Sessão ID': s.id.slice(0, 8),
                    'Operador': s.operatorName || '-',
                    'Abertura': formatDate(s.openedAt),
                    'Fechamento': s.closedAt ? formatDate(s.closedAt) : 'Aberto',
                    'Saldo Inicial': formatCurrency(s.openingBalance),
                    'Saldo Esperado': formatCurrency(s.expectedBalance || 0),
                    'Saldo Informado': formatCurrency(s.closingBalance || 0),
                    'Dif. Caixa': formatCurrency((s.closingBalance || 0) - (s.expectedBalance || 0))
                })), `caixa_turnos_${timestamp}`)
                break
            case 'operators':
                downloadCSV(operatorReport.map((r: any) => ({
                    'Operador': r.operatorName,
                    'Qtd. Vendas': r.count,
                    'Total Receita': formatCurrency(r.total)
                })), `vendas_operador_${timestamp}`)
                break
            case 'payments':
                downloadCSV(paymentReport.map((r: any) => ({
                    'Forma de Pagamento': r.method,
                    'Qtd. Ocorrências': r.count,
                    'Total Receita': formatCurrency(r.total)
                })), `vendas_pagamento_${timestamp}`)
                break
            case 'products':
                downloadCSV(productReport.map((r: any) => {
                    const margin = r.totalRevenue > 0 ? (r.profit / r.totalRevenue) * 100 : 0
                    const roi = r.totalCost > 0 ? (r.profit / r.totalCost) * 100 : 0
                    return {
                        'Produto': r.name,
                        'Qtd. Vendida': r.quantity,
                        'Receita': formatCurrency(r.totalRevenue),
                        'Custo Total': formatCurrency(r.totalCost),
                        'Lucro': formatCurrency(r.profit),
                        'Margem de Lucro': margin.toFixed(2) + '%',
                        'ROI': roi.toFixed(2) + '%'
                    }
                }), `ranking_produtos_${timestamp}`)
                break
            case 'categories':
                downloadCSV(categoryReport.map((r: any) => {
                    const margin = r.totalRevenue > 0 ? (r.profit / r.totalRevenue) * 100 : 0
                    const roi = r.totalCost > 0 ? (r.profit / r.totalCost) * 100 : 0
                    return {
                        'Categoria': r.name,
                        'Qtd. Vendida': r.quantity,
                        'Receita': formatCurrency(r.totalRevenue),
                        'Custo Total': formatCurrency(r.totalCost),
                        'Lucro': formatCurrency(r.profit),
                        'Margem de Lucro': margin.toFixed(2) + '%',
                        'ROI': roi.toFixed(2) + '%'
                    }
                }), `ranking_categorias_${timestamp}`)
                break
            case 'discounts':
                downloadCSV(discountReport.map((r: any) => ({
                    'Venda ID': r.saleId.slice(0, 8),
                    'Data': formatDate(r.date),
                    'Operador': r.operatorName,
                    'Subtotal': formatCurrency(r.subtotal),
                    'Desconto Concedido': formatCurrency(r.discount),
                    'Total Líquido': formatCurrency(r.total)
                })), `relatorio_descontos_${timestamp}`)
                break
        }
    }

    const tabs = [
        { id: 'summary', label: 'Vendas do Período', icon: TrendingUp },
        { id: 'shifts', label: 'Fechamentos de Caixa', icon: ArrowLeftRight },
        { id: 'operators', label: 'Por Operador', icon: Users },
        { id: 'payments', label: 'Por Pagamento', icon: CreditCard },
        { id: 'products', label: 'Por Produto', icon: Package },
        { id: 'categories', label: 'Por Categoria', icon: Tag },
        { id: 'discounts', label: 'Descontos', icon: Percent },
    ]

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
                    <p className="text-muted-foreground">
                        Análise detalhada de vendas, caixa e performance
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">De</span>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-auto h-9"
                        />
                        <span className="text-sm font-medium">Até</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-auto h-9"
                        />
                    </div>
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <Card
                            key={tab.id}
                            className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800 ${isActive ? 'ring-2 ring-primary bg-slate-50 dark:bg-zinc-800' : ''}`}
                            onClick={() => setActiveTab(tab.id as TabId)}
                        >
                            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center h-full">
                                <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                                <span className={`text-sm font-medium ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {tab.label}
                                </span>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card>
                <CardHeader className="bg-slate-50 dark:bg-zinc-900 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        {tabs.find(t => t.id === activeTab)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        {activeTab === 'summary' && (
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1" title="Número total de vendas finalizadas no período.">
                                        Qtd. Vendas (Únicas)
                                        <Info className="h-3 w-3 text-slate-400" />
                                    </p>
                                    <p className="text-3xl font-bold">{summary.count}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1" title="Soma da quantidade de todos os produtos vendidos.">
                                        Total Itens Vendidos
                                        <Info className="h-3 w-3 text-slate-400" />
                                    </p>
                                    <p className="text-3xl font-bold">{summary.totalItems}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1" title="Total de descontos concedidos nas vendas.">
                                        Descontos (R$)
                                        <Info className="h-3 w-3 text-slate-400" />
                                    </p>
                                    <p className="text-3xl font-bold text-red-600">-{formatCurrency(summary.totalDiscounts)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1" title="Valor médio gasto por venda. (Receita Total / Qtd Vendas). Ex: R$ 100 / 2 vendas = R$ 50">
                                        Ticket Médio (R$)
                                        <Info className="h-3 w-3 text-slate-400" />
                                    </p>
                                    <p className="text-3xl font-bold">{formatCurrency(summary.ticketMedio)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1" title="Valor total bruto recebido em todas as vendas.">
                                        Receita Total Bruta
                                        <Info className="h-3 w-3 text-slate-400" />
                                    </p>
                                    <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'shifts' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Sessão ID</th>
                                        <th className="px-6 py-4">Operador</th>
                                        <th className="px-6 py-4">Abertura</th>
                                        <th className="px-6 py-4">Fechamento</th>
                                        <th className="px-6 py-4 text-right">Saldo Inicial</th>
                                        <th className="px-6 py-4 text-right">Saldo Esperado</th>
                                        <th className="px-6 py-4 text-right">Saldo Informado</th>
                                        <th className="px-6 py-4 text-right">Diferença</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y relative">
                                    {filteredSessions.length === 0 ? (
                                        <tr><td colSpan={8} className="text-center py-8 text-slate-500">Nenhum turno encontrado neste período.</td></tr>
                                    ) : (
                                        filteredSessions.map((session: CashSession) => {
                                            const diff = (session.closingBalance || 0) - (session.expectedBalance || 0)
                                            return (
                                                <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                                    <td className="px-6 py-3 font-mono text-xs">{session.id.slice(0, 8)}</td>
                                                    <td className="px-6 py-3">{session.operatorName || '-'}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap">{formatDate(session.openedAt)}</td>
                                                    <td className="px-6 py-3 whitespace-nowrap">{session.closedAt ? formatDate(session.closedAt) : 'Em aberto'}</td>
                                                    <td className="px-6 py-3 text-right">{formatCurrency(session.openingBalance)}</td>
                                                    <td className="px-6 py-3 text-right">{formatCurrency(session.expectedBalance || 0)}</td>
                                                    <td className="px-6 py-3 text-right">{session.status === 'CLOSED' ? formatCurrency(session.closingBalance || 0) : '-'}</td>
                                                    <td className={`px-6 py-3 text-right font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>
                                                        {session.status === 'CLOSED' ? formatCurrency(diff) : '-'}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'operators' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Operador</th>
                                        <th className="px-6 py-4 text-right">Qtd. Vendas (Únicas)</th>
                                        <th className="px-6 py-4 text-right">Total Receita</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {operatorReport.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-8 text-slate-500">Sem dados.</td></tr>
                                    ) : (
                                        operatorReport.map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                                <td className="px-6 py-3 font-medium">{r.operatorName}</td>
                                                <td className="px-6 py-3 text-right">{r.count}</td>
                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(r.total)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'payments' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Forma de Pagamento</th>
                                        <th className="px-6 py-4 text-right">Qtd. Ocorrências na Venda</th>
                                        <th className="px-6 py-4 text-right">Total Recebido</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paymentReport.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-8 text-slate-500">Sem dados.</td></tr>
                                    ) : (
                                        paymentReport.map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                                <td className="px-6 py-3 font-medium">{r.method}</td>
                                                <td className="px-6 py-3 text-right">{r.count}</td>
                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(r.total)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'products' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 w-12 text-center">🏆</th>
                                        <th className="px-6 py-4">Produto</th>
                                        <th className="px-6 py-4 text-right">Qtd. Vendida</th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1" title="Valor total recebido pelas vendas deste produto.">
                                                Total Receita
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-green-600">
                                            <div className="flex items-center justify-end gap-1" title="Receita total menos o custo total dos produtos. Ex: Receita R$ 100 - Custo R$ 40 = R$ 60">
                                                Lucro
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1" title="Porcentagem da receita que virou lucro. (Lucro / Receita * 100). Ex: R$ 60 / R$ 100 = 60%">
                                                Margem
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1" title="Retorno sobre Investimento. Quanto o custo rendeu. (Lucro / Custo * 100). Ex: R$ 60 / R$ 40 = 150%">
                                                ROI
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {productReport.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-slate-500">Sem dados.</td></tr>
                                    ) : (
                                        productReport.map((r: any, i: number) => {
                                            const margin = r.totalRevenue > 0 ? (r.profit / r.totalRevenue) * 100 : 0
                                            const roi = r.totalCost > 0 ? (r.profit / r.totalCost) * 100 : 0

                                            return (
                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                                    <td className="px-6 py-3 text-center text-slate-400 font-bold">{i + 1}</td>
                                                    <td className="px-6 py-3 font-medium">{r.name}</td>
                                                    <td className="px-6 py-3 text-right">{r.quantity}</td>
                                                    <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(r.totalRevenue)}</td>
                                                    <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(r.profit)}</td>
                                                    <td className="px-6 py-3 text-right">{margin.toFixed(2)}%</td>
                                                    <td className="px-6 py-3 text-right">{roi.toFixed(2)}%</td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'categories' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Categoria</th>
                                        <th className="px-6 py-4 text-right">Qtd. Itens Vendidos</th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1" title="Valor total recebido pelas vendas desta categoria.">
                                                Total Receita
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-green-600">
                                            <div className="flex items-center justify-end gap-1" title="Receita total menos o custo total dos produtos. Ex: Receita R$ 100 - Custo R$ 40 = R$ 60">
                                                Lucro
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1" title="Porcentagem da receita que virou lucro. (Lucro / Receita * 100). Ex: R$ 60 / R$ 100 = 60%">
                                                Margem
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1" title="Retorno sobre Investimento. Quanto o custo rendeu. (Lucro / Custo * 100). Ex: R$ 60 / R$ 40 = 150%">
                                                ROI
                                                <Info className="h-3 w-3 text-slate-400" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {categoryReport.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-slate-500">Sem dados.</td></tr>
                                    ) : (
                                        categoryReport.map((r: any, i: number) => {
                                            const margin = r.totalRevenue > 0 ? (r.profit / r.totalRevenue) * 100 : 0
                                            const roi = r.totalCost > 0 ? (r.profit / r.totalCost) * 100 : 0

                                            return (
                                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                                    <td className="px-6 py-3 font-medium">{r.name}</td>
                                                    <td className="px-6 py-3 text-right">{r.quantity}</td>
                                                    <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(r.totalRevenue)}</td>
                                                    <td className="px-6 py-3 text-right font-medium text-green-600">{formatCurrency(r.profit)}</td>
                                                    <td className="px-6 py-3 text-right">{margin.toFixed(2)}%</td>
                                                    <td className="px-6 py-3 text-right">{roi.toFixed(2)}%</td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'discounts' && (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-zinc-900 border-b font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Venda ID</th>
                                        <th className="px-6 py-4">Data/Hora</th>
                                        <th className="px-6 py-4">Operador</th>
                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                        <th className="px-6 py-4 text-right">Desconto (R$)</th>
                                        <th className="px-6 py-4 text-right">Total Líquido</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {discountReport.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-slate-500">Sem dados com desconto concedido neste período.</td></tr>
                                    ) : (
                                        discountReport.map((r: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                                                <td className="px-6 py-3 font-mono text-xs">{r.saleId.slice(0, 8)}</td>
                                                <td className="px-6 py-3 whitespace-nowrap">{formatDate(r.date)}</td>
                                                <td className="px-6 py-3">{r.operatorName}</td>
                                                <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(r.subtotal)}</td>
                                                <td className="px-6 py-3 text-right text-red-600 font-medium">-{formatCurrency(r.discount)}</td>
                                                <td className="px-6 py-3 text-right font-medium">{formatCurrency(r.total)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                    </div>
                </CardContent>
            </Card>

        </div>
    )
}
