import { Button, Card, CardContent, Input, Label, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@pos/ui'
import { Plus, MoreVertical } from 'lucide-react'
import { useState } from 'react'

const mockOperators = [
    { id: 1, name: 'Admin', role: 'Admin', pin: '****' },
    { id: 2, name: 'Luan Caixa', role: 'Cashier', pin: '****' }
]

export function UsersPage() {
    const [isOpen, setIsOpen] = useState(false)

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
                                <Input id="name" placeholder="John Doe" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="pin" className="text-right">PIN</Label>
                                <Input id="pin" type="password" placeholder="1234" maxLength={4} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Button variant="outline" className="flex-1 bg-primary/10 text-primary border-primary">Admin</Button>
                                    <Button variant="outline" className="flex-1 text-muted-foreground">Cashier</Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={() => setIsOpen(false)}>Save Operator</Button>
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
                                {mockOperators.map((operator) => (
                                    <tr key={operator.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{operator.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${operator.role === 'Admin'
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                }`}>
                                                {operator.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{operator.pin}</td>
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
        </div>
    )
}
