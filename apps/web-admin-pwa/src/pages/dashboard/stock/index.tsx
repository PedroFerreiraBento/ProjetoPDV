import { useState, useMemo } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle,
    Button, Input, Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@pos/ui'
import { useStockStore } from '../../../store/stock'
import { useProductsStore } from '../../../store/products'
import { useOperatorsStore } from '../../../store/operators'
import { useBranchesStore } from '../../../store/branches'
import {
    ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, History,
    ClipboardCheck, AlertTriangle, CheckCircle2, Save
} from 'lucide-react'

function formatVariantLabel(options: Record<string, string>): string {
    return Object.values(options).join(' / ')
}

export function StockPage() {
    const { movements, addMovement } = useStockStore()
    const { products, updateStock } = useProductsStore()
    const { currentOperator } = useOperatorsStore()
    const { branches } = useBranchesStore()

    // --- Entry / Adjust / Transfer Modal States ---
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState('')
    const [selectedVariantId, setSelectedVariantId] = useState('')
    const [selectedBranchId, setSelectedBranchId] = useState('none')
    const [toBranchId, setToBranchId] = useState('none')
    const [quantity, setQuantity] = useState('')
    const [reason, setReason] = useState('')

    const selectedProduct = products.find(p => p.id === selectedProductId)

    // --- Inventory Count States ---
    const [inventoryCounts, setInventoryCounts] = useState<Record<string, string>>({})
    const [isInventorySubmitted, setIsInventorySubmitted] = useState(false)

    const lowStockProducts = useMemo(() => {
        return products.filter(p =>
            p.stock !== undefined && p.minStock !== undefined && p.minStock > 0 && p.stock <= p.minStock
        )
    }, [products])

    const handleResetForm = () => {
        setSelectedProductId('')
        setSelectedVariantId('')
        setSelectedBranchId('none')
        setToBranchId('none')
        setQuantity('')
        setReason('')
    }

    const handleSubmitMovement = (type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER') => {
        if (!selectedProduct || !quantity || isNaN(Number(quantity))) return
        if (type === 'TRANSFER' && (selectedBranchId === 'none' || toBranchId === 'none')) {
            alert('Selecione origem e destino para a transferência.')
            return
        }
        if (type === 'TRANSFER' && selectedBranchId === toBranchId) {
            alert('A origem e destino não podem ser a mesma loja.')
            return
        }

        const qtyNum = Number(quantity)
        const absoluteQty = Math.abs(qtyNum)
        const isAddition = type === 'IN'

        const branch = selectedBranchId !== 'none' ? selectedBranchId : undefined

        if (type === 'TRANSFER') {
            const targetBranch = toBranchId !== 'none' ? toBranchId : undefined
            // OUT da Origem
            updateStock(selectedProduct.id, -absoluteQty, selectedVariantId || undefined, branch)
            // IN no Destino
            updateStock(selectedProduct.id, absoluteQty, selectedVariantId || undefined, targetBranch)

            addMovement({
                id: crypto.randomUUID(),
                productId: selectedProduct.id,
                variantId: selectedVariantId || undefined,
                quantity: absoluteQty,
                type: 'TRANSFER',
                branchId: branch,
                toBranchId: targetBranch,
                reason: reason || 'Transferência entre lojas',
                operatorId: currentOperator?.id || 'unknown',
                operatorName: currentOperator?.name,
                createdAt: new Date().toISOString()
            })
        } else {
            const delta = isAddition ? absoluteQty : -absoluteQty
            updateStock(selectedProduct.id, delta, selectedVariantId || undefined, branch)

            addMovement({
                id: crypto.randomUUID(),
                productId: selectedProduct.id,
                variantId: selectedVariantId || undefined,
                quantity: absoluteQty,
                type: type,
                branchId: branch,
                reason: reason || (type === 'IN' ? 'Entrada manual' : 'Ajuste manual'),
                operatorId: currentOperator?.id || 'unknown',
                operatorName: currentOperator?.name,
                createdAt: new Date().toISOString()
            })
        }

        handleResetForm()
        setIsEntryModalOpen(false)
        setIsAdjustModalOpen(false)
        setIsTransferModalOpen(false)
    }

    const handleInventoryCountChange = (productId: string, value: string) => {
        setInventoryCounts(prev => ({ ...prev, [productId]: value }))
    }

    const handleSubmitInventoryCount = () => {
        const adjustments: { productId: string; systemStock: number; countedStock: number; diff: number }[] = []

        for (const product of products) {
            const countedStr = inventoryCounts[product.id]
            if (countedStr === undefined || countedStr === '') continue

            const counted = Number(countedStr)
            if (isNaN(counted)) continue

            const systemStock = product.stock ?? 0
            const diff = counted - systemStock

            if (diff !== 0) {
                adjustments.push({ productId: product.id, systemStock, countedStock: counted, diff })
            }
        }

        if (adjustments.length === 0) return

        for (const adj of adjustments) {
            updateStock(adj.productId, adj.diff)

            addMovement({
                id: crypto.randomUUID(),
                productId: adj.productId,
                quantity: Math.abs(adj.diff),
                type: 'ADJUST',
                reason: `Inventário: ${adj.systemStock} → ${adj.countedStock}`,
                operatorId: currentOperator?.id || 'unknown',
                operatorName: currentOperator?.name,
                createdAt: new Date().toISOString()
            })
        }

        setIsInventorySubmitted(true)
        setTimeout(() => {
            setInventoryCounts({})
            setIsInventorySubmitted(false)
        }, 3000)
    }

    const inventoryDiffCount = useMemo(() => {
        let count = 0
        for (const product of products) {
            const countedStr = inventoryCounts[product.id]
            if (countedStr === undefined || countedStr === '') continue
            const counted = Number(countedStr)
            if (isNaN(counted)) continue
            const systemStock = product.stock ?? 0
            if (counted !== systemStock) count++
        }
        return count
    }, [products, inventoryCounts])

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Gestão de Estoque
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Controle níveis de estoque, registre ajustes e acompanhe o histórico de movimentações.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { handleResetForm(); setIsAdjustModalOpen(true) }}>
                        <ArrowUpFromLine className="h-4 w-4 mr-2" />
                        Saída / Ajuste
                    </Button>
                    <Button variant="outline" onClick={() => { handleResetForm(); setIsTransferModalOpen(true) }}>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Transferir Estoque
                    </Button>
                    <Button onClick={() => { handleResetForm(); setIsEntryModalOpen(true) }}>
                        <ArrowDownToLine className="h-4 w-4 mr-2" />
                        Entrada de Estoque
                    </Button>
                </div>
            </div>

            {/* Low Stock Alerts Banner */}
            {lowStockProducts.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium">
                                {lowStockProducts.length} produto{lowStockProducts.length > 1 ? 's' : ''} abaixo do estoque mínimo
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabbed Content */}
            <Tabs defaultValue="movements" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="movements" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Histórico de Movimentações
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Contagem de Estoque
                    </TabsTrigger>
                </TabsList>

                {/* Movement History Tab */}
                <TabsContent value="movements">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Histórico de Movimentações
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {movements.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Nenhuma movimentação de estoque registrada ainda.</p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                                <TableHead>Data e Hora</TableHead>
                                                <TableHead>Produto</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead className="text-right">Quantidade</TableHead>
                                                <TableHead>Operador</TableHead>
                                                <TableHead>Motivo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {movements.map((movement) => {
                                                const product = products.find(p => p.id === movement.productId)
                                                const isDeduction = movement.type === 'OUT' || movement.type === 'SALE' || (movement.type as string) === 'ADJUST'
                                                return (
                                                    <TableRow key={movement.id}>
                                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                                            {new Date(movement.createdAt).toLocaleString('pt-BR')}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {product?.name || 'Produto desconhecido'}
                                                            {movement.variantId && <span className="text-xs text-muted-foreground ml-1">(Variante)</span>}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${movement.type === 'IN' || movement.type === 'RETURN'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : movement.type === 'TRANSFER'
                                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                    : isDeduction
                                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                }`}>
                                                                {movement.type}
                                                            </span>
                                                            <span className="block text-[10px] mt-1 text-muted-foreground whitespace-nowrap">
                                                                {movement.branchId && branches.find(b => b.id === movement.branchId)?.name}
                                                                {movement.type === 'TRANSFER' && movement.toBranchId && ` → ${branches.find(b => b.id === movement.toBranchId)?.name}`}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold">
                                                            {movement.type === 'TRANSFER' ? '' : (isDeduction ? '-' : '+')}{movement.quantity}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {movement.operatorName || 'Sistema'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={movement.reason}>
                                                            {movement.reason || '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inventory Count Tab */}
                <TabsContent value="inventory">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ClipboardCheck className="h-5 w-5" />
                                        Contagem de Estoque
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Informe a contagem física real de cada produto. As diferenças serão ajustadas automaticamente.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {inventoryDiffCount > 0 && (
                                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                            {inventoryDiffCount} divergência{inventoryDiffCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <Button
                                        onClick={handleSubmitInventoryCount}
                                        disabled={inventoryDiffCount === 0 || isInventorySubmitted}
                                        className={isInventorySubmitted ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
                                    >
                                        {isInventorySubmitted ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Salvo!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Aplicar Ajustes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                            <TableHead>Produto</TableHead>
                                            <TableHead className="text-center w-[120px]">Estoque Sistema</TableHead>
                                            <TableHead className="text-center w-[140px]">Contagem Física</TableHead>
                                            <TableHead className="text-center w-[120px]">Diferença</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.filter(p => !p.isBundle).map((product) => {
                                            const systemStock = product.stock ?? 0
                                            const countedStr = inventoryCounts[product.id] || ''
                                            const counted = countedStr !== '' ? Number(countedStr) : null
                                            const diff = counted !== null && !isNaN(counted) ? counted - systemStock : null
                                            const isLowStock = product.minStock !== undefined && product.minStock > 0 && systemStock <= product.minStock

                                            return (
                                                <TableRow key={product.id} className={diff !== null && diff !== 0 ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                                                    <TableCell>
                                                        <div>
                                                            <span className="font-medium">{product.name}</span>
                                                            {isLowStock && (
                                                                <span className="inline-flex items-center ml-2 text-amber-500">
                                                                    <AlertTriangle className="h-3 w-3" />
                                                                </span>
                                                            )}
                                                        </div>

                                                    </TableCell>
                                                    <TableCell className="text-center font-mono font-bold">
                                                        {systemStock}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder={String(systemStock)}
                                                            value={countedStr}
                                                            onChange={(e) => handleInventoryCountChange(product.id, e.target.value)}
                                                            className="w-[100px] mx-auto text-center h-8"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {diff !== null && diff !== 0 ? (
                                                            <span className={`font-mono font-bold ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                                {diff > 0 ? '+' : ''}{diff}
                                                            </span>
                                                        ) : diff === 0 ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Entry Modal */}
            <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Entrada de Estoque</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Produto</Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                            <div className="space-y-2">
                                <Label>Variante</Label>
                                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma variante" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProduct.variants.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{formatVariantLabel(v.options)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Quantidade adicionada</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 10"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Observação / Número da Nota (Opcional)</Label>
                            <Input
                                placeholder="ex.: NF-1234, Fornecedor X"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsEntryModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => handleSubmitMovement('IN')}
                            disabled={!selectedProductId || !quantity}
                        >
                            Confirmar Entrada
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Adjustment Modal */}
            <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Perda / Ajuste de Estoque</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Produto</Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Filial / Local da loja</Label>
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma filial" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Global / Não especificado</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                            <div className="space-y-2">
                                <Label>Variante</Label>
                                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma variante" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProduct.variants.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{formatVariantLabel(v.options)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Quantidade removida</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 2"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason *</Label>
                            <Input
                                placeholder="e.g. Expirado, Quebra, Consumo interno"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleSubmitMovement('OUT')}
                            disabled={!selectedProductId || !quantity || !reason}
                        >
                            Confirmar Perda/Ajuste
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Modal */}
            <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transferir Estoque entre Lojas</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Produto</Label>
                            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
                            <div className="space-y-2">
                                <Label>Variante</Label>
                                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma variante" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProduct.variants.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{formatVariantLabel(v.options)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Filial de origem</Label>
                                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Da filial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" disabled>Selecionar Origem</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id} disabled={toBranchId === b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Filial de destino</Label>
                                <Select value={toBranchId} onValueChange={setToBranchId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Para filial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" disabled>Selecionar Destino</SelectItem>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id} disabled={selectedBranchId === b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantidade da transferência</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 5"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo / Observação (Opcional)</Label>
                            <Input
                                placeholder="e.g. Reabastecimento semanal"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => handleSubmitMovement('TRANSFER')}
                            disabled={!selectedProductId || !quantity || selectedBranchId === 'none' || toBranchId === 'none'}
                        >
                            Confirmar Transferência
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
