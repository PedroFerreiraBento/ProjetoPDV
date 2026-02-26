import { useState } from 'react'
import {
    Button,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@pos/ui'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useUnitsStore } from '../../../store/units'
import { Unit } from '@pos/shared'

export function UnitsPage() {
    const { units, addUnit, updateUnit, deleteUnit } = useUnitsStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        allowFractions: false,
    })

    const filteredUnits = units.filter(
        (unit) =>
            unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenAdd = () => {
        setEditingUnit(null)
        setFormData({ name: '', abbreviation: '', allowFractions: false })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (unit: Unit) => {
        setEditingUnit(unit)
        setFormData({
            name: unit.name,
            abbreviation: unit.abbreviation,
            allowFractions: unit.allowFractions,
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a unidade "${name}"?`)) {
            deleteUnit(id)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (editingUnit) {
            updateUnit(editingUnit.id, {
                name: formData.name,
                abbreviation: formData.abbreviation,
                allowFractions: formData.allowFractions,
            })
        } else {
            addUnit({
                name: formData.name,
                abbreviation: formData.abbreviation,
                allowFractions: formData.allowFractions,
            })
        }
        setIsDialogOpen(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Unidades de Medida
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Defina como os produtos são vendidos (ex.: kg, litros, unidade).
                    </p>
                </div>
                <Button onClick={handleOpenAdd} className="w-full sm:w-auto shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Unidade
                </Button>
            </div>

            {/* Actions/Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar unidades..."
                        className="pl-9 bg-white dark:bg-zinc-900 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Nome</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Abreviação</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Permite decimal</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUnits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhuma unidade encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUnits.map((unit) => (
                                <TableRow key={unit.id} className="group">
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                        {unit.name}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-mono">
                                            {unit.abbreviation}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {unit.allowFractions ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                Sim (ex.: 1,5)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                                                Não (ex.: 1, 2)
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                onClick={() => handleOpenEdit(unit)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                                onClick={() => handleDelete(unit.id, unit.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da unidade *</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Quilograma"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="abbreviation">Abreviação *</Label>
                                <Input
                                    id="abbreviation"
                                    required
                                    value={formData.abbreviation}
                                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                                    placeholder="e.g. kg"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="allowFractions"
                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-white dark:ring-offset-zinc-950"
                                    checked={formData.allowFractions}
                                    onChange={(e) => setFormData({ ...formData, allowFractions: e.target.checked })}
                                />
                                <Label htmlFor="allowFractions" className="cursor-pointer font-normal">
                                    Permitir decimais (frações) para esta unidade
                                </Label>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                                Ative para pesos (ex.: 1,5 kg). Desative para itens discretos (ex.: 2 un).
                            </p>
                        </div>
                        <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">{editingUnit ? 'Salvar Alterações' : 'Adicionar Unidade'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
