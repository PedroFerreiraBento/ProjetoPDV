import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@pos/ui'
import { Plus, MoreVertical, ShieldAlert, UserCog, User } from 'lucide-react'
import { useState } from 'react'
import { useOperatorsStore } from '../../../store/operators'
import { AppRole, ROLE_LABELS, ROLE_PERMISSIONS, AppPermission } from '@pos/shared'
import { Check, Minus } from 'lucide-react'

export function UsersPage() {
    const { operators, addOperator } = useOperatorsStore()
    const [isOpen, setIsOpen] = useState(false)
    const [newName, setNewName] = useState('')
    const [newPin, setNewPin] = useState('')
    const [newRole, setNewRole] = useState<AppRole>('CASHIER')

    const handleAddOperator = () => {
        if (!newName || !newPin) return
        addOperator({ name: newName, role: newRole, pin: newPin })
        setIsOpen(false)
        setNewName('')
        setNewPin('')
        setNewRole('CASHIER')
    }

    const getRoleIcon = (role: AppRole) => {
        switch (role) {
            case 'ADMIN': return <ShieldAlert className="h-4 w-4 mr-1 inline-block" />
            case 'MANAGER': return <UserCog className="h-4 w-4 mr-1 inline-block" />
            case 'CASHIER': return <User className="h-4 w-4 mr-1 inline-block" />
        }
    }

    const getRoleBadgeClasses = (role: AppRole) => {
        switch (role) {
            case 'ADMIN': return 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400'
            case 'MANAGER': return 'bg-primary/10 text-primary dark:bg-primary/20'
            case 'CASHIER': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Operators</h1>
                    <p className="text-muted-foreground mt-1">Manage users who can access the PDV and Admin panel.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Operator
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Operator</DialogTitle>
                            <DialogDescription>
                                Create a new user who can access the PDV app or Web Admin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="pin" className="text-right">PIN</Label>
                                <Input id="pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="1234" maxLength={4} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        className={`flex-1 ${newRole === 'ADMIN' ? 'bg-primary/10 text-primary border-primary' : 'text-muted-foreground'}`}
                                        onClick={() => setNewRole('ADMIN')}
                                    >Admin</Button>
                                    <Button
                                        variant="outline"
                                        className={`flex-1 ${newRole === 'MANAGER' ? 'bg-primary/10 text-primary border-primary' : 'text-muted-foreground'}`}
                                        onClick={() => setNewRole('MANAGER')}
                                    >Manager</Button>
                                    <Button
                                        variant="outline"
                                        className={`flex-1 ${newRole === 'CASHIER' ? 'bg-primary/10 text-primary border-primary' : 'text-muted-foreground'}`}
                                        onClick={() => setNewRole('CASHIER')}
                                    >Cashier</Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAddOperator}>Save Operator</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="dark:bg-zinc-900 border-none shadow-md">
                <CardContent className="p-0">
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium">Role</th>
                                    <th className="px-6 py-4 font-medium">PIN</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-zinc-800">
                                {operators.map((operator) => (
                                    <tr key={operator.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{operator.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClasses(operator.role)}`}>
                                                {getRoleIcon(operator.role)}
                                                {ROLE_LABELS[operator.role]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">****</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <Card className="dark:bg-zinc-900 border-none shadow-md mt-6">
                <CardHeader>
                    <CardTitle className="text-lg">Capabilities Matrix</CardTitle>
                    <p className="text-sm text-muted-foreground">Overview of what each role can access in the system.</p>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="w-full overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Capability</th>
                                    <th className="px-6 py-4 font-medium text-center">Admin</th>
                                    <th className="px-6 py-4 font-medium text-center">Manager</th>
                                    <th className="px-6 py-4 font-medium text-center">Cashier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-zinc-800">
                                {Object.values({
                                    'Manage Staff & Operators': 'MANAGE_USERS',
                                    'Manage Store Settings': 'MANAGE_SETTINGS',
                                    'Create & Edit Products': 'MANAGE_PRODUCTS',
                                    'View Products Directory': 'VIEW_PRODUCTS',
                                    'Create New Sales': 'CREATE_SALE',
                                    'Void/Cancel Sales': 'VOID_SALE',
                                    'Apply Discounts': 'APPLY_DISCOUNT',
                                    'Open Cash Register': 'OPEN_REGISTER',
                                    'Close Cash Register': 'CLOSE_REGISTER',
                                    'View Financial Reports': 'VIEW_REPORTS',
                                } as Record<string, AppPermission>).map((permission, index) => {
                                    const labels = Object.keys({
                                        'Manage Staff & Operators': 'MANAGE_USERS',
                                        'Manage Store Settings': 'MANAGE_SETTINGS',
                                        'Create & Edit Products': 'MANAGE_PRODUCTS',
                                        'View Products Directory': 'VIEW_PRODUCTS',
                                        'Create New Sales': 'CREATE_SALE',
                                        'Void/Cancel Sales': 'VOID_SALE',
                                        'Apply Discounts': 'APPLY_DISCOUNT',
                                        'Open Cash Register': 'OPEN_REGISTER',
                                        'Close Cash Register': 'CLOSE_REGISTER',
                                        'View Financial Reports': 'VIEW_REPORTS',
                                    });
                                    return (
                                        <tr key={permission} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-300">
                                                {labels[index]}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ROLE_PERMISSIONS['ADMIN'].includes(permission) ? (
                                                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                                                ) : (
                                                    <Minus className="h-4 w-4 mx-auto text-slate-300 dark:text-zinc-600" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ROLE_PERMISSIONS['MANAGER'].includes(permission) ? (
                                                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                                                ) : (
                                                    <Minus className="h-4 w-4 mx-auto text-slate-300 dark:text-zinc-600" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ROLE_PERMISSIONS['CASHIER'].includes(permission) ? (
                                                    <Check className="h-4 w-4 mx-auto text-emerald-500" />
                                                ) : (
                                                    <Minus className="h-4 w-4 mx-auto text-slate-300 dark:text-zinc-600" />
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
