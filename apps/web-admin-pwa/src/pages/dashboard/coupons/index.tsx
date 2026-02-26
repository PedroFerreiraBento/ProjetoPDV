import { useState } from 'react'
import {
    Card, CardContent,
    Button, Input, Label,
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@pos/ui'
import { useCouponsStore } from '../../../store/coupons'
import { Plus, Pencil, Trash2, Ticket, ToggleLeft, ToggleRight } from 'lucide-react'

function formatCurrency(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CouponsPage() {
    const { coupons, addCoupon, updateCoupon, removeCoupon } = useCouponsStore()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form
    const [code, setCode] = useState('')
    const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
    const [discountValue, setDiscountValue] = useState('')
    const [minOrderValue, setMinOrderValue] = useState('')
    const [maxUses, setMaxUses] = useState('')
    const [expiresAt, setExpiresAt] = useState('')

    const handleResetForm = () => {
        setCode('')
        setDiscountType('PERCENT')
        setDiscountValue('')
        setMinOrderValue('')
        setMaxUses('')
        setExpiresAt('')
        setEditingId(null)
    }

    const handleOpenNew = () => {
        handleResetForm()
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (id: string) => {
        const coupon = coupons.find(c => c.id === id)
        if (!coupon) return
        setEditingId(id)
        setCode(coupon.code)
        setDiscountType(coupon.discountType)
        setDiscountValue(coupon.discountType === 'FIXED' ? String(coupon.discountValue / 100) : String(coupon.discountValue))
        setMinOrderValue(coupon.minOrderValue ? String(coupon.minOrderValue / 100) : '')
        setMaxUses(coupon.maxUses !== undefined ? String(coupon.maxUses) : '')
        setExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '')
        setIsDialogOpen(true)
    }

    const handleSubmit = () => {
        if (!code.trim() || !discountValue) return

        const now = new Date().toISOString()
        const discVal = discountType === 'FIXED'
            ? Math.round(Number(discountValue) * 100)
            : Number(discountValue)
        const minOrder = minOrderValue ? Math.round(Number(minOrderValue) * 100) : undefined
        const maxU = maxUses ? Number(maxUses) : undefined
        const expires = expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : undefined

        if (editingId) {
            updateCoupon(editingId, {
                code: code.trim().toUpperCase(),
                discountType,
                discountValue: discVal,
                minOrderValue: minOrder,
                maxUses: maxU,
                expiresAt: expires
            })
        } else {
            addCoupon({
                id: crypto.randomUUID(),
                code: code.trim().toUpperCase(),
                discountType,
                discountValue: discVal,
                minOrderValue: minOrder,
                maxUses: maxU,
                usedCount: 0,
                isActive: true,
                expiresAt: expires,
                createdAt: now,
                updatedAt: now
            })
        }

        handleResetForm()
        setIsDialogOpen(false)
    }

    const handleToggleActive = (id: string) => {
        const coupon = coupons.find(c => c.id === id)
        if (coupon) {
            updateCoupon(id, { isActive: !coupon.isActive })
        }
    }

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cupom?')) {
            removeCoupon(id)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Cupons de Desconto
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Crie e gerencie cupons que os operadores podem aplicar no PDV.
                    </p>
                </div>
                <Button onClick={handleOpenNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Cupom
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {coupons.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>Nenhum cupom criado ainda.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                        <TableHead>Código</TableHead>
                                        <TableHead>Desconto</TableHead>
                                        <TableHead>Pedido mín.</TableHead>
                                        <TableHead className="text-center">Usos</TableHead>
                                        <TableHead>Expira em</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right w-[120px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => {
                                        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
                                        const isExhausted = coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses
                                        return (
                                            <TableRow key={coupon.id} className={!coupon.isActive ? 'opacity-50' : ''}>
                                                <TableCell className="font-mono font-bold text-primary">
                                                    {coupon.code}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {coupon.discountType === 'PERCENT'
                                                        ? `${coupon.discountValue}%`
                                                        : formatCurrency(coupon.discountValue)
                                                    }
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {coupon.minOrderValue ? formatCurrency(coupon.minOrderValue) : '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-sm">
                                                    <span className="font-mono">{coupon.usedCount}</span>
                                                    {coupon.maxUses !== undefined && (
                                                        <span className="text-muted-foreground"> / {coupon.maxUses}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {coupon.expiresAt
                                                        ? new Date(coupon.expiresAt).toLocaleDateString('pt-BR')
                                                        : '—'
                                                    }
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isExpired ? (
                                                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded">Expirado</span>
                                                    ) : isExhausted ? (
                                                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded">Esgotado</span>
                                                    ) : coupon.isActive ? (
                                                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded">Ativo</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">Inativo</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleToggleActive(coupon.id)}
                                                            title={coupon.isActive ? 'Desativar' : 'Ativar'}
                                                        >
                                                            {coupon.isActive
                                                                ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                                                                : <ToggleLeft className="h-4 w-4 text-slate-400" />
                                                            }
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(coupon.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600" onClick={() => handleDelete(coupon.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Cupom' : 'Criar Cupom'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Código do cupom *</Label>
                            <Input
                                placeholder="ex.: BEMVINDO10"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="font-mono uppercase"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo de desconto</Label>
                                <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'PERCENT' | 'FIXED')}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENT">Percentual (%)</SelectItem>
                                        <SelectItem value="FIXED">Valor fixo (R$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor do desconto *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step={discountType === 'FIXED' ? '0.01' : '1'}
                                    placeholder={discountType === 'PERCENT' ? 'ex.: 10' : 'ex.: 5,00'}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pedido mínimo (R$)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Opcional"
                                    value={minOrderValue}
                                    onChange={(e) => setMinOrderValue(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Máximo de usos</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Ilimitado"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Data de validade</Label>
                            <Input
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!code.trim() || !discountValue}>
                            {editingId ? 'Salvar Alterações' : 'Criar Cupom'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
