import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Switch } from '@pos/ui'
import { Plus, Pencil, Trash2, MapPin, Store } from 'lucide-react'
import { useBranchesStore } from '../../../store/branches'
import { useSyncStore } from '../../../store/sync'
import { Branch } from '@pos/shared'
import { formatCNPJ } from '@pos/shared'

export function BranchesSettings() {
    const { branches, addBranch, updateBranch, deleteBranch } = useBranchesStore()
    const { sync } = useSyncStore()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        phone: '',
        isActive: true,
        address: {
            cep: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: ''
        }
    })

    const openCreateDialog = () => {
        setEditingBranch(null)
        setFormData({
            name: '',
            cnpj: '',
            phone: '',
            isActive: true,
            address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' }
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (branch: Branch) => {
        setEditingBranch(branch)
        setFormData({
            name: branch.name,
            cnpj: branch.cnpj,
            phone: branch.phone || '',
            isActive: branch.isActive,
            address: { ...branch.address }
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.cnpj) return

        if (editingBranch) {
            updateBranch(editingBranch.id, { ...formData, updatedAt: new Date().toISOString() })
        } else {
            addBranch({ ...formData, updatedAt: new Date().toISOString() })
        }
        await sync()
        setIsDialogOpen(false)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover esta filial? Todas as configurações associadas serão afetadas.')) {
            deleteBranch(id)
            await sync()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-medium">Lojas / Filiais</h3>
                    <p className="text-sm text-muted-foreground">Gerencie as filiais que integram o seu negócio.</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Filial
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branches.map(branch => (
                    <Card key={branch.id} className={!branch.isActive ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{branch.name}</CardTitle>
                                    <CardDescription>CNPJ: {branch.cnpj}</CardDescription>
                                </div>
                                <div className="flex space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(branch)}>
                                        <Pencil className="h-4 w-4 text-slate-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex items-start text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                                <span>
                                    {branch.address.street}, {branch.address.number}<br />
                                    {branch.address.city} - {branch.address.state}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <span className={`h-2 w-2 rounded-full ${branch.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                <span className="text-xs font-medium">{branch.isActive ? 'Ativa' : 'Inativa'}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {branches.length === 0 && (
                <div className="text-center p-8 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                    <Store className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Nenhuma filial cadastrada</h4>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Adicione sua primeira filial para começar a gerenciar.</p>
                    <Button onClick={openCreateDialog} variant="outline">Cadastrar Filial Básica</Button>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingBranch ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome da Filial / Razão Social</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Loja Matriz - Centro"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CNPJ</Label>
                                <Input
                                    value={formData.cnpj}
                                    onChange={e => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Rua / Logradouro</Label>
                                <Input
                                    value={formData.address.street}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Número</Label>
                                <Input
                                    value={formData.address.number}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, number: e.target.value } })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input
                                    value={formData.address.city}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado / UF</Label>
                                <Input
                                    value={formData.address.state}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={c => setFormData({ ...formData, isActive: !!c })}
                            />
                            <Label>Filial Ativa no Sistema</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!formData.name || !formData.cnpj}>Salvar Filial</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
