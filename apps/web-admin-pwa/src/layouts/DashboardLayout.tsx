import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, LogOut, Moon, Sun, Tag, Scale, Terminal, UserCircle, PackageCheck, Truck, ShoppingBag, Ticket, BarChart, Lock } from 'lucide-react'
import { Button } from '@pos/ui'
import { useSetupStore } from '../store/setup'
import { useOperatorsStore } from '../store/operators'
import { FastSearch } from '../components/FastSearch'

export function DashboardLayout() {
    const navigate = useNavigate()
    const { storeName, theme, setTheme } = useSetupStore()
    const { currentOperator, logoutOperator, lockScreen } = useOperatorsStore()

    const handleLogout = () => {
        logoutOperator()
        navigate('/login')
    }

    const navItems = [
        { to: '/dashboard/overview', icon: LayoutDashboard, label: 'Visão Geral' },
        { to: '/dashboard/sales', icon: ShoppingCart, label: 'Vendas' },
        { to: '/dashboard/reports', icon: BarChart, label: 'Relatórios' },
        { to: '/dashboard/customers', icon: UserCircle, label: 'Clientes' },
        { to: '/dashboard/products', icon: Package, label: 'Produtos' },
        { to: '/dashboard/stock', icon: PackageCheck, label: 'Estoque' },
        { to: '/dashboard/suppliers', icon: Truck, label: 'Fornecedores' },
        { to: '/dashboard/purchases', icon: ShoppingBag, label: 'Compras' },
        { to: '/dashboard/coupons', icon: Ticket, label: 'Cupons' },
        { to: '/dashboard/categories', icon: Tag, label: 'Categorias' },
        { to: '/dashboard/units', icon: Scale, label: 'Unidades' },
        { to: '/dashboard/users', icon: Users, label: 'Operadores' },
        { to: '/dashboard/settings', icon: Settings, label: 'Configurações' },
    ]

    return (
        <div className={`h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 flex overflow-hidden ${theme}`}>
            {/* Sidebar */}
            <aside className="w-72 border-r border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm flex flex-col">
                <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-zinc-800">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3 overflow-hidden">
                        <img src="/logo.png" alt="Caos Domado" className="h-7 w-7 object-contain" />
                    </div>
                    <div className="min-w-0">
                        <span className="font-black text-base truncate text-slate-900 dark:text-slate-100 block">
                            {storeName || 'Caos Domado'}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-zinc-400">Painel Administrativo</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary/10 text-primary shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-slate-50'
                                }`
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-100/70 dark:bg-zinc-800/60">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {currentOperator?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{currentOperator?.name || 'Operador'}</p>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">{currentOperator?.role || 'USER'}</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-slate-600 dark:text-zinc-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-3" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
                    <h2 className="text-lg font-semibold">Painel</h2>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="default"
                            className="mr-4 hidden sm:flex bg-primary hover:bg-primary/90 text-white shadow-sm"
                            onClick={() => navigate('/pos')}
                        >
                            <Terminal className="w-4 h-4 mr-2" />
                            Abrir PDV
                        </Button>
                        <FastSearch />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => lockScreen()}
                            title="Bloquear Tela"
                            className="text-slate-500 hover:text-primary"
                        >
                            <Lock className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="text-slate-500 hover:text-primary"
                        >
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            {currentOperator?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
