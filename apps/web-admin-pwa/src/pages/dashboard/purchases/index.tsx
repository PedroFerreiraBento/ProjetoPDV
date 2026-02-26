import { useState, useMemo } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle,
    Button, Input, Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@pos/ui'
import { usePurchasesStore } from '../../../store/purchases'
import { useSuppliersStore } from '../../../store/suppliers'
import { useProductsStore } from '../../../store/products'
import { useStockStore } from '../../../store/stock'
import { useOperatorsStore } from '../../../store/operators'
import {
    ShoppingBag, Plus, Trash2, PackageCheck, XCircle,
    ClipboardList, FileText, CheckCircle2
} from 'lucide-react'

function formatCurrency(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface OrderLineItem {
    productId: string
    productName: string
    quantity: string
    unitCost: string
}

export function PurchasesPage() {
    const { orders, addOrder, receiveOrder, cancelOrder } = usePurchasesStore()
    const { suppliers } = useSuppliersStore()
    const { products, updateStock } = useProductsStore()
    const { addMovement } = useStockStore()
    const { currentOperator } = useOperatorsStore()

    // New Order form state
    const [selectedSupplierId, setSelectedSupplierId] = useState('')
    const [orderNotes, setOrderNotes] = useState('')
    const [lineItems, setLineItems] = useState<OrderLineItem[]>([
        { productId: '', productName: '', quantity: '', unitCost: '' }
    ])

    // Confirm receive dialog
    const [confirmReceiveId, setConfirmReceiveId] = useState<string | null>(null)

    const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId)

    const orderTotal = useMemo(() => {
        return lineItems.reduce((sum, item) => {
            const qty = Number(item.quantity) || 0
            const cost = Number(item.unitCost) || 0
            return sum + (qty * Math.round(cost * 100))
        }, 0)
    }, [lineItems])

    const handleAddLine = () => {
        setLineItems([...lineItems, { productId: '', productName: '', quantity: '', unitCost: '' }])
    }

    const handleRemoveLine = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index))
    }

    const handleUpdateLine = (index: number, field: keyof OrderLineItem, value: string) => {
        const updated = [...lineItems]
        updated[index] = { ...updated[index], [field]: value }
        if (field === 'productId') {
            const product = products.find(p => p.id === value)
            updated[index].productName = product?.name || ''
        }
        setLineItems(updated)
    }

    const handleResetForm = () => {
        setSelectedSupplierId('')
        setOrderNotes('')
        setLineItems([{ productId: '', productName: '', quantity: '', unitCost: '' }])
    }

    const handleCreateOrder = () => {
        if (!selectedSupplier) return
        const validItems = lineItems.filter(li => li.productId && Number(li.quantity) > 0)
        if (validItems.length === 0) return

        const items = validItems.map(li => ({
            productId: li.productId,
            productName: li.productName,
            quantity: Number(li.quantity),
            unitCost: Math.round(Number(li.unitCost) * 100)
        }))

        const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)

        addOrder({
            id: crypto.randomUUID(),
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.name,
            items,
            status: 'PENDING',
            totalCost,
            notes: orderNotes || undefined,
            createdAt: new Date().toISOString()
        })

        handleResetForm()
    }

    const handleReceiveOrder = (orderId: string) => {
        const order = orders.find(o => o.id === orderId)
        if (!order) return

        // 1. Mark order as received
        receiveOrder(orderId, currentOperator?.name || 'Admin')

        // 2. Add stock for each item and log movements
        for (const item of order.items) {
            updateStock(item.productId, item.quantity)

            addMovement({
                id: crypto.randomUUID(),
                productId: item.productId,
                quantity: item.quantity,
                type: 'IN',
                reason: `Compra #${orderId.slice(0, 8)} - ${order.supplierName}`,
                operatorId: currentOperator?.id || 'unknown',
                operatorName: currentOperator?.name,
                createdAt: new Date().toISOString()
            })
        }

        setConfirmReceiveId(null)
    }

    const handleCancelOrder = (orderId: string) => {
        if (confirm('Tem certeza que deseja cancelar este pedido de compra?')) {
            cancelOrder(orderId)
        }
    }

    const statusBadge = (status: string) => {
        const classes = {
            PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            RECEIVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
        }
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${classes[status as keyof typeof classes] || ''}`}>
                {status}
            </span>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Pedidos de Compra
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Crie pedidos para fornecedores e dê entrada dos itens no estoque.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="orders" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Pedidos de Compra
                    </TabsTrigger>
                    <TabsTrigger value="new" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Novo Pedido
                    </TabsTrigger>
                </TabsList>

                {/* Orders List Tab */}
                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Todos os Pedidos de Compra
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Nenhum pedido ainda. Crie um na aba "Novo Pedido".</p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                                <TableHead>Pedido #</TableHead>
                                                <TableHead>Fornecedor</TableHead>
                                                <TableHead className="text-center">Itens</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead className="text-right w-[120px]">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {orders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-mono text-sm font-medium">
                                                        #{order.id.slice(0, 8)}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{order.supplierName}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">
                                                        {order.items.length} produto{order.items.length > 1 ? 's' : ''}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-bold">
                                                        {formatCurrency(order.totalCost)}
                                                    </TableCell>
                                                    <TableCell>{statusBadge(order.status)}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {order.status === 'PENDING' && (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/20"
                                                                    onClick={() => setConfirmReceiveId(order.id)}
                                                                >
                                                                    <PackageCheck className="h-3 w-3 mr-1" />
                                                                    Receber
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-rose-500"
                                                                    onClick={() => handleCancelOrder(order.id)}
                                                                >
                                                                    <XCircle className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {order.status === 'RECEIVED' && (
                                                            <span className="text-xs text-muted-foreground">
                                                                por {order.receivedBy}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* New Order Tab */}
                <TabsContent value="new">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Criar Novo Pedido de Compra
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Supplier Selection */}
                            <div className="space-y-2 max-w-md">
                                <Label>Fornecedor *</Label>
                                {suppliers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Não há fornecedores cadastrados. Cadastre na página de Fornecedores primeiro.
                                    </p>
                                ) : (
                                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um fornecedor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Line Items */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Produtos *</Label>
                                    <Button variant="outline" size="sm" onClick={handleAddLine}>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Adicionar Linha
                                    </Button>
                                </div>

                                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                                <TableHead>Produto</TableHead>
                                                <TableHead className="w-[100px]">Qtd</TableHead>
                                                <TableHead className="w-[140px]">Custo unit. (R$)</TableHead>
                                                <TableHead className="text-right w-[120px]">Subtotal</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {lineItems.map((line, index) => {
                                                const qty = Number(line.quantity) || 0
                                                const cost = Number(line.unitCost) || 0
                                                const subtotal = qty * Math.round(cost * 100)
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                                <Select value={line.productId} onValueChange={(v) => handleUpdateLine(index, 'productId', v)}>
                                                                <SelectTrigger className="h-8">
                                                                    <SelectValue placeholder="Selecionar produto" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {products.filter(p => !p.isBundle).map(p => (
                                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-8 text-center"
                                                                placeholder="0"
                                                                value={line.quantity}
                                                                onChange={(e) => handleUpdateLine(index, 'quantity', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="h-8 text-center"
                                                                placeholder="0.00"
                                                                value={line.unitCost}
                                                                onChange={(e) => handleUpdateLine(index, 'unitCost', e.target.value)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-sm">
                                                            {subtotal > 0 ? formatCurrency(subtotal) : '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {lineItems.length > 1 && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleRemoveLine(index)}>
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Order Total */}
                                <div className="flex justify-end items-center gap-4 pt-2">
                                    <span className="text-sm font-medium text-muted-foreground">Total:</span>
                                    <span className="text-xl font-bold font-mono">{formatCurrency(orderTotal)}</span>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2 max-w-md">
                                <Label>Observações (Opcional)</Label>
                                <Input
                                    placeholder="ex.: número da NF, data de entrega..."
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleCreateOrder}
                                    disabled={!selectedSupplierId || lineItems.every(li => !li.productId || !li.quantity)}
                                    className="px-8"
                                >
                                    Criar Pedido de Compra
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Confirm Receive Dialog */}
            <Dialog open={!!confirmReceiveId} onOpenChange={() => setConfirmReceiveId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Recebimento da Compra</DialogTitle>
                    </DialogHeader>
                    {confirmReceiveId && (() => {
                        const order = orders.find(o => o.id === confirmReceiveId)
                        if (!order) return null
                        return (
                            <div className="space-y-4 pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Isso adicionará os itens abaixo ao estoque e marcará o pedido como recebido:
                                </p>
                                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between px-4 py-3">
                                            <span className="font-medium text-sm">{item.productName}</span>
                                            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                                +{item.quantity} un
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 dark:bg-zinc-800/50 rounded-lg px-4 py-3">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                    <span>O estoque será atualizado e as movimentações serão registradas automaticamente.</span>
                                </div>
                            </div>
                        )
                    })()}
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setConfirmReceiveId(null)}>Cancelar</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => confirmReceiveId && handleReceiveOrder(confirmReceiveId)}
                        >
                            <PackageCheck className="h-4 w-4 mr-2" />
                            Confirmar Recebimento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
