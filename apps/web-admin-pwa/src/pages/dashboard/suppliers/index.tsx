import { useState } from 'react'
import {
    Card, CardContent,
    Button, Input, Label,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@pos/ui'
import { useSuppliersStore } from '../../../store/suppliers'
import { formatCNPJ, formatPhone } from '@pos/shared'
import { Plus, Pencil, Trash2, Truck, Search } from 'lucide-react'

export function SuppliersPage() {
    const { suppliers, addSupplier, updateSupplier, removeSupplier } = useSuppliersStore()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    // Form
    const [name, setName] = useState('')
    const [cnpj, setCnpj] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [contactName, setContactName] = useState('')
    const [notes, setNotes] = useState('')

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.cnpj && s.cnpj.includes(search)) ||
        (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase()))
    )

    const handleResetForm = () => {
        setName('')
        setCnpj('')
        setPhone('')
        setEmail('')
        setContactName('')
        setNotes('')
        setEditingId(null)
    }

    const handleOpenNew = () => {
        handleResetForm()
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (id: string) => {
        const supplier = suppliers.find(s => s.id === id)
        if (!supplier) return
        setEditingId(id)
        setName(supplier.name)
        setCnpj(supplier.cnpj || '')
        setPhone(supplier.phone || '')
        setEmail(supplier.email || '')
        setContactName(supplier.contactName || '')
        setNotes(supplier.notes || '')
        setIsDialogOpen(true)
    }

    const handleSubmit = () => {
        if (!name.trim()) return

        const now = new Date().toISOString()

        if (editingId) {
            updateSupplier(editingId, {
                name: name.trim(),
                cnpj: cnpj || undefined,
                phone: phone || undefined,
                email: email || undefined,
                contactName: contactName || undefined,
                notes: notes || undefined
            })
        } else {
            addSupplier({
                id: crypto.randomUUID(),
                name: name.trim(),
                cnpj: cnpj || undefined,
                phone: phone || undefined,
                email: email || undefined,
                contactName: contactName || undefined,
                notes: notes || undefined,
                createdAt: now,
                updatedAt: now
            })
        }

        handleResetForm()
        setIsDialogOpen(false)
    }

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja remover este fornecedor?')) {
            removeSupplier(id)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Fornecedores
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os fornecedores dos seus produtos e as informações de contato.
                    </p>
                </div>
                <Button onClick={handleOpenNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fornecedor
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar fornecedores..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Truck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>{suppliers.length === 0 ? 'Nenhum fornecedor cadastrado ainda.' : 'Nenhum fornecedor corresponde à sua busca.'}</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                        <TableHead>Nome</TableHead>
                                        <TableHead>CNPJ</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right w-[100px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-sm">
                                                {supplier.cnpj || '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {supplier.phone || '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {supplier.contactName || '—'}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {supplier.email || '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(supplier.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600" onClick={() => handleDelete(supplier.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                        <DialogTitle>{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Nome *</Label>
                            <Input
                                placeholder="Nome do fornecedor"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CNPJ</Label>
                                <Input
                                    placeholder="00.000.000/0000-00"
                                    value={cnpj}
                                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input
                                    placeholder="(00) 00000-0000"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pessoa de contato</Label>
                                <Input
                                    placeholder="Nome do contato"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="email@fornecedor.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Observações</Label>
                            <Input
                                placeholder="Observações adicionais..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!name.trim()}>
                            {editingId ? 'Salvar Alterações' : 'Adicionar Fornecedor'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
