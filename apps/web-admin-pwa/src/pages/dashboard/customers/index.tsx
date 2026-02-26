import { useState } from 'react'
import { Button, Input } from '@pos/ui'
import { Plus, Search, Edit2, Trash2, Eye, UserCircle, Phone, Mail, FileText, ShoppingBag, X } from 'lucide-react'
import { Customer, formatPhone } from '@pos/shared'
import { useCustomersStore } from '../../../store/customers'
import { useSalesStore } from '../../../store/sales'
import { formatCurrency } from '../../../lib/utils'

export function CustomersPage() {
    const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomersStore()
    const { sales } = useSalesStore()

    const [search, setSearch] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

    // Form state
    const [formName, setFormName] = useState('')
    const [formCpf, setFormCpf] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formEmail, setFormEmail] = useState('')
    const [formNotes, setFormNotes] = useState('')

    const filteredCustomers = search
        ? customers.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.cpf?.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
            c.phone?.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
        )
        : customers

    const openCreateDialog = () => {
        setEditingCustomer(null)
        setFormName('')
        setFormCpf('')
        setFormPhone('')
        setFormEmail('')
        setFormNotes('')
        setIsDialogOpen(true)
    }

    const openEditDialog = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormName(customer.name)
        setFormCpf(customer.cpf || '')
        setFormPhone(customer.phone || '')
        setFormEmail(customer.email || '')
        setFormNotes(customer.notes || '')
        setIsDialogOpen(true)
    }

    const handleSave = () => {
        if (!formName.trim()) return
        if (editingCustomer) {
            updateCustomer(editingCustomer.id, {
                name: formName.trim(),
                cpf: formCpf || undefined,
                phone: formPhone || undefined,
                email: formEmail || undefined,
                notes: formNotes || undefined,
            })
        } else {
            addCustomer({
                name: formName.trim(),
                cpf: formCpf || undefined,
                phone: formPhone || undefined,
                email: formEmail || undefined,
                notes: formNotes || undefined,
            })
        }
        setIsDialogOpen(false)
    }

    const formatCpfInput = (value: string) => {
        let v = value.replace(/\D/g, '').substring(0, 11)
        v = v.replace(/(\d{3})(\d)/, '$1.$2')
        v = v.replace(/(\d{3})(\d)/, '$1.$2')
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        return v
    }

    const getCustomerSales = (customerId: string) => {
        return sales.filter(s => s.customerId === customerId && s.status === 'COMPLETED')
    }

    const getCustomerTotalSpent = (customerId: string) => {
        return getCustomerSales(customerId).reduce((acc, s) => acc + s.total, 0)
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Clientes</h1>
                    <p className="text-sm text-slate-500 mt-1">{customers.length} cadastrado{customers.length !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={openCreateDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cliente
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Customers Table */}
            {filteredCustomers.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                    <UserCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-700 mb-4" />
                    <p className="text-slate-500 dark:text-zinc-500">
                        {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                    </p>
                    {!search && (
                        <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            Cadastrar primeiro cliente
                        </Button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-400">Nome</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-400">CPF</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-zinc-400">Telefone</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-400">Compras</th>
                                <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-zinc-400">Total Gasto</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-zinc-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => {
                                const customerSales = getCustomerSales(customer.id)
                                const totalSpent = getCustomerTotalSpent(customer.id)
                                return (
                                    <tr key={customer.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                    {customer.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-slate-50">{customer.name}</p>
                                                    {customer.email && (
                                                        <p className="text-[11px] text-slate-400">{customer.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 font-mono text-xs">
                                            {customer.cpf || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-zinc-400 text-xs">
                                            {customer.phone || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                                {customerSales.length}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(totalSpent)}
                                        </td>
                                        <td className="px-4 py-3 text-center space-x-1">
                                            <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedCustomer(customer)} title="Ver Histórico">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8" onClick={() => openEditDialog(customer)} title="Editar">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                onClick={() => { if (confirm(`Excluir "${customer.name}"?`)) deleteCustomer(customer.id) }}
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-zinc-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center">
                                    <UserCircle className="w-4 h-4 mr-2" />
                                    Nome *
                                </label>
                                <Input
                                    placeholder="Nome completo do cliente"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        CPF
                                    </label>
                                    <Input
                                        placeholder="000.000.000-00"
                                        value={formCpf}
                                        onChange={(e) => setFormCpf(formatCpfInput(e.target.value))}
                                        maxLength={14}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Telefone
                                    </label>
                                    <Input
                                        placeholder="(00) 00000-0000"
                                        value={formPhone}
                                        onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center">
                                    <Mail className="w-4 h-4 mr-2" />
                                    E-mail
                                </label>
                                <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5 block">
                                    Observações
                                </label>
                                <textarea
                                    value={formNotes}
                                    onChange={(e) => setFormNotes(e.target.value)}
                                    placeholder="Notas sobre o cliente..."
                                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[60px] resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button className="flex-1" onClick={handleSave} disabled={!formName.trim()}>
                                {editingCustomer ? 'Salvar Alterações' : 'Cadastrar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Detail / Purchase History Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                    {selectedCustomer.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{selectedCustomer.name}</h3>
                                    <p className="text-xs text-slate-400">
                                        Cliente desde {new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Customer Info */}
                        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {selectedCustomer.cpf && (
                                    <div>
                                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">CPF</span>
                                        <p className="font-mono text-slate-700 dark:text-zinc-300 mt-0.5">{selectedCustomer.cpf}</p>
                                    </div>
                                )}
                                {selectedCustomer.phone && (
                                    <div>
                                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Telefone</span>
                                        <p className="text-slate-700 dark:text-zinc-300 mt-0.5">{selectedCustomer.phone}</p>
                                    </div>
                                )}
                                {selectedCustomer.email && (
                                    <div className="col-span-2">
                                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">E-mail</span>
                                        <p className="text-slate-700 dark:text-zinc-300 mt-0.5">{selectedCustomer.email}</p>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Compras</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                                        {getCustomerSales(selectedCustomer.id).length}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Gasto</p>
                                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                        {formatCurrency(getCustomerTotalSpent(selectedCustomer.id))}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Última</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-1">
                                        {(() => {
                                            const cs = getCustomerSales(selectedCustomer.id)
                                            if (cs.length === 0) return '—'
                                            const last = cs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                                            return new Date(last.createdAt).toLocaleDateString('pt-BR')
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Purchase History */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <h4 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center">
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Histórico de Compras
                            </h4>
                            {(() => {
                                const cs = getCustomerSales(selectedCustomer.id).sort(
                                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                )
                                if (cs.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-slate-400 dark:text-zinc-600">
                                            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">Nenhuma compra registrada.</p>
                                        </div>
                                    )
                                }
                                return (
                                    <div className="space-y-2">
                                        {cs.map(sale => (
                                            <div key={sale.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-800">
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'} • Nº {sale.id.slice(0, 8)}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(sale.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
                            <Button variant="outline" className="w-full" onClick={() => setSelectedCustomer(null)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
