import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pos/ui'
import { useSalesStore } from '../../../store/sales'
import { useProductsStore } from '../../../store/products'
import { formatCurrency } from '../../../lib/utils'
import { TrendingUp, ShoppingBag, CreditCard, DollarSign, AlertTriangle, Clock } from 'lucide-react'
import { Product, ProductBatch } from '@pos/shared'

export function OverviewPage() {
    const { sales } = useSalesStore()
    const { products } = useProductsStore()
    const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null)
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

    const activeSales = useMemo(() => sales.filter(s => s.status !== 'VOIDED'), [sales])

    const stats = useMemo(() => {
        const totalRevenue = activeSales.reduce((acc, sale) => acc + sale.total, 0)
        const salesCount = activeSales.length
        const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0

        let totalProfit = 0
        activeSales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.isReturn) return
                const product = products.find(p => p.id === item.productId)
                const variant = product?.variants?.find(v => v.id === item.variantId)
                const cost = variant?.cost ?? product?.cost ?? 0
                totalProfit += (item.price - cost) * item.quantity
            })
            // Subtract discounts and fees from profit? 
            // totalDiscounts reduces profit, totalFees increases it?
            // profit = totalRevenue - totalCost
            // For simplicity: profit = sum((price-cost)*qty) - globalDiscounts + globalFees
            // But item discounts are already in item.price? 
            // In checkout, item.price is the adjusted price? 
            // Let's check how cart handles it. 
        })

        const totalDiscounts = activeSales.reduce((acc, sale) => acc + (sale.totalDiscounts || 0), 0)
        const totalFees = activeSales.reduce((acc, sale) => acc + (sale.totalFees || 0), 0)

        // Final adjustment
        totalProfit = totalProfit - totalDiscounts + totalFees

        return {
            totalRevenue,
            salesCount,
            avgTicket,
            totalProfit
        }
    }, [activeSales, products])

    const topProducts = useMemo(() => {
        const productMap: Record<string, { name: string, quantity: number, revenue: number }> = {}

        activeSales.forEach(sale => {
            sale.items.forEach(item => {
                if (item.isReturn) return
                const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId
                if (!productMap[key]) {
                    productMap[key] = { name: item.name, quantity: 0, revenue: 0 }
                }
                productMap[key].quantity += item.quantity
                productMap[key].revenue += item.price * item.quantity
            })
        })

        return Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
    }, [activeSales])

    const chartData = useMemo(() => {
        const toLocalDateKey = (date: Date) => {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }

        const days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setHours(0, 0, 0, 0)
            date.setDate(date.getDate() - (6 - i))
            return {
                label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
                fullLabel: date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }),
                dateKey: toLocalDateKey(date),
                total: 0,
                salesCount: 0,
            }
        })

        const dayMap = new Map(days.map((d) => [d.dateKey, d]))

        activeSales.forEach((sale) => {
            const saleDate = new Date(sale.createdAt)
            const saleKey = toLocalDateKey(saleDate)
            const day = dayMap.get(saleKey)
            if (day) {
                day.total += sale.total
                day.salesCount += 1
            }
        })

        return days
    }, [activeSales])

    const chartMaxTotal = useMemo(() => Math.max(...chartData.map((d) => d.total), 1), [chartData])
    const chartTicks = useMemo(() => {
        const ratios = [1, 0.75, 0.5, 0.25, 0]
        return ratios.map((ratio) => ({
            ratio,
            value: Math.round(chartMaxTotal * ratio),
        }))
    }, [chartMaxTotal])
    const activeDay = useMemo(() => {
        const fallback = chartData[chartData.length - 1] || null
        const key = hoveredDayKey || selectedDayKey
        if (!key) return fallback
        return chartData.find((d) => d.dateKey === key) || fallback
    }, [chartData, hoveredDayKey, selectedDayKey])

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.stock !== undefined && p.minStock !== undefined && p.stock <= p.minStock && p.stock > 0)
    }, [products])

    const expiringBatches = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const alerts: { product: Product, batch: ProductBatch, daysLeft: number }[] = [];

        products.forEach(p => {
            if (p.trackBatches && p.batches) {
                p.batches.forEach(b => {
                    if (b.stock > 0 && b.expirationDate) {
                        const expDate = new Date(b.expirationDate);
                        const diffTime = expDate.getTime() - today.getTime();
                        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Alert if 30 days or less (including negative for already expired)
                        if (daysLeft <= 30) {
                            alerts.push({ product: p, batch: b, daysLeft });
                        }
                    }
                });
            }
        });

        // Sort by expiration date ascending
        return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [products])

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Visão Geral</h1>
                <p className="text-muted-foreground">Acompanhe o desempenho da sua loja em tempo real.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Receita Total</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(stats.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dados consolidados das vendas registradas</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Lucro Estimado</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(stats.totalProfit)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Margem: {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Quantidade de Vendas</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.salesCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Vendas realizadas</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 dark:text-zinc-400">Ticket Médio</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(stats.avgTicket)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Por venda</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-slate-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Análise de Vendas Recentes (Últimos 7 Dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px] p-4">
                        <div className="h-full grid grid-cols-[64px_1fr] gap-3">
                            <div className="relative h-full">
                                {chartTicks.map((tick) => (
                                    <div
                                        key={`${tick.ratio}-${tick.value}`}
                                        className="absolute right-0 -translate-y-1/2 text-[10px] text-slate-400 dark:text-zinc-500"
                                        style={{ top: `${(1 - tick.ratio) * 100}%` }}
                                    >
                                        {formatCurrency(tick.value)}
                                    </div>
                                ))}
                            </div>

                            <div className="relative h-full border-l border-b border-slate-200 dark:border-zinc-800 pl-3 pb-6">
                                <div className="absolute inset-0 left-3 bottom-6 pointer-events-none">
                                    {chartTicks.map((tick) => (
                                        <div
                                            key={`grid-${tick.ratio}`}
                                            className="absolute left-0 right-0 border-t border-dashed border-slate-100 dark:border-zinc-900"
                                            style={{ top: `${(1 - tick.ratio) * 100}%` }}
                                        />
                                    ))}
                                </div>

                                <div className="relative h-full flex items-end justify-between gap-2">
                                    {chartData.map((day, i) => {
                                        const height = (day.total / chartMaxTotal) * 100
                                        const visibleHeight = day.total > 0 ? Math.max(height, 3) : 0
                                        const isSelected = day.dateKey === selectedDayKey
                                        const isHovered = day.dateKey === hoveredDayKey
                                        return (
                                            <div key={i} className="relative flex-1 h-full flex flex-col justify-end items-center group">
                                                {isHovered && (
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] text-white shadow-lg z-10">
                                                        {formatCurrency(day.total)} ({day.salesCount} venda{day.salesCount !== 1 ? 's' : ''})
                                                    </div>
                                                )}
                                                <div
                                                    className={`w-full max-w-12 rounded-t-md transition-colors cursor-pointer ${isSelected ? 'bg-primary dark:bg-primary' : 'bg-primary/80 dark:bg-primary/45 hover:bg-primary dark:hover:bg-primary/70'}`}
                                                    style={{ height: `${visibleHeight}%` }}
                                                    title={`${day.label}: ${formatCurrency(day.total)}`}
                                                    onMouseEnter={() => setHoveredDayKey(day.dateKey)}
                                                    onMouseLeave={() => setHoveredDayKey(null)}
                                                    onClick={() => setSelectedDayKey((prev) => prev === day.dateKey ? null : day.dateKey)}
                                                />
                                                <span className="absolute -bottom-5 text-[10px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase">
                                                    {day.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                        {activeDay && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                                <span className="capitalize">{activeDay.fullLabel}</span>
                                <span>{activeDay.salesCount} venda{activeDay.salesCount !== 1 ? 's' : ''}</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-200">{formatCurrency(activeDay.total)}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg">Produtos Mais Vendidos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topProducts.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">Nenhum dado disponível.</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {topProducts.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900 dark:text-slate-50">{product.name}</p>
                                                <p className="text-xs text-slate-500">{product.quantity} unidades vendidas</p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(product.revenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {topProducts.length > 0 && (
                            <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
                                <Button variant="ghost" className="w-full text-xs text-primary h-8" onClick={() => { }}>
                                    Ver todos os produtos
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Low Stock Alerts */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Alertas de Estoque
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {lowStockProducts.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">Todos os produtos estão com estoque adequado.</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
                                {lowStockProducts.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 bg-orange-50/50 hover:bg-orange-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm text-slate-900 dark:text-slate-50">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">Mínimo necessário: {p.minStock}</p>
                                        </div>
                                        <div className={`font-bold text-sm px-2.5 py-1 rounded-md ${p.stock === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            {p.stock ?? 0} un
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expiration Alerts */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-rose-500" />
                            Alertas de Validade (Lotes)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {expiringBatches.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">Nenhum lote próximo do vencimento (30 dias).</div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[300px] overflow-y-auto">
                                {expiringBatches.map(({ product, batch, daysLeft }, idx) => {
                                    const isExpired = daysLeft < 0;
                                    return (
                                        <div key={`${batch.id}-${idx}`} className={`flex items-center justify-between p-4 transition-colors ${isExpired ? 'bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20' : 'bg-orange-50/50 hover:bg-orange-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20'}`}>
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm text-slate-900 dark:text-slate-50">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">Lote: {batch.batchNumber} • Qtd: {batch.stock}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold text-sm px-2.5 py-1 rounded-md ${isExpired ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                    {isExpired ? 'Vencido!' : `${daysLeft} dias`}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {new Date(batch.expirationDate).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
