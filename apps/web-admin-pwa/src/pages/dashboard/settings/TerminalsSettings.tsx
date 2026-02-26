import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pos/ui'
import { Plus, Pencil, Trash2, Monitor } from 'lucide-react'
import { useTerminalsStore } from '../../../store/terminals'
import { useBranchesStore } from '../../../store/branches'
import { Terminal } from '@pos/shared'

export function TerminalsSettings() {
    const { terminals, addTerminal, updateTerminal, deleteTerminal } = useTerminalsStore()
    const { branches } = useBranchesStore()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        branchId: '',
        isActive: true,
    })

    const openCreateDialog = () => {
        setEditingTerminal(null)
        setFormData({
            name: '',
            branchId: branches[0]?.id || '', // Default to first branch
            isActive: true,
        })
        setIsDialogOpen(true)
    }

    const openEditDialog = (terminal: Terminal) => {
        setEditingTerminal(terminal)
        setFormData({
            name: terminal.name,
            branchId: terminal.branchId,
            isActive: terminal.isActive,
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = () => {
        if (!formData.name || !formData.branchId) return

        if (editingTerminal) {
            updateTerminal(editingTerminal.id, { ...formData, updatedAt: new Date().toISOString() })
        } else {
            addTerminal({ ...formData, updatedAt: new Date().toISOString() })
        }
        setIsDialogOpen(false)
    }

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja remover este terminal? O histórico de sessões de caixa vinculadas pode ser afetado.')) {
            deleteTerminal(id)
        }
    }

    const getBranchName = (branchId: string) => {
        return branches.find(b => b.id === branchId)?.name || 'Filial Desconhecida'
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-medium">Terminais de Caixa</h3>
                    <p className="text-sm text-muted-foreground">Cadastre os computadores ou dispositivos usados para vendas.</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Terminal
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {terminals.map(terminal => (
                    <Card key={terminal.id} className={!terminal.isActive ? 'opacity-60' : ''}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Monitor className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <CardTitle className="text-lg">{terminal.name}</CardTitle>
                                        <CardDescription>{getBranchName(terminal.branchId)}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(terminal)}>
                                        <Pencil className="h-4 w-4 text-slate-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(terminal.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex items-center space-x-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
                                <span className={`h-2 w-2 rounded-full ${terminal.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                                <span className="text-xs font-medium">{terminal.isActive ? 'Ativo' : 'Inativo'}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {terminals.length === 0 && (
                <div className="text-center p-8 bg-slate-50 dark:bg-zinc-900 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800">
                    <Monitor className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Nenhum terminal cadastrado</h4>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Cadastre terminais para vincular suas sessões de caixa.</p>
                    <Button onClick={openCreateDialog} variant="outline">Cadastrar Terminal</Button>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTerminal ? 'Editar Terminal' : 'Novo Terminal'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome ou Identificação do Terminal</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Caixa 01, PDV Frente"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Filial Vinculada</Label>
                            {branches.length > 0 ? (
                                <Select
                                    value={formData.branchId}
                                    onValueChange={v => setFormData({ ...formData, branchId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma filial" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-900 rounded text-sm">
                                    Cadastre pelo menos uma Filial antes de criar terminais.
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={c => setFormData({ ...formData, isActive: !!c })}
                            />
                            <Label>Terminal Ativo</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!formData.name || !formData.branchId || branches.length === 0}
                        >
                            Salvar Terminal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
