import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@pos/ui'
import { useSetupStore } from '../store/setup'
import { useOperatorsStore } from '../store/operators'

export function DashboardLayout() {
    const navigate = useNavigate()
    const { storeName, theme, setTheme } = useSetupStore()
    const { currentOperator, logoutOperator } = useOperatorsStore()

    const handleLogout = () => {
        logoutOperator()
        navigate('/login')
    }

    const navItems = [
        { to: '/dashboard/overview', icon: LayoutDashboard, label: 'Overview' },
        { to: '/dashboard/sales', icon: ShoppingCart, label: 'Sales' },
        { to: '/dashboard/products', icon: Package, label: 'Products' },
        { to: '/dashboard/users', icon: Users, label: 'Operators' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50 flex ${theme}`}>
            {/* Sidebar */}
            <aside className="w-64 border-r bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-zinc-800">
                    <span className="font-bold text-lg truncate text-primary">{storeName || 'My Store'}</span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-slate-50'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
                    <h2 className="text-lg font-semibold">Dashboard</h2>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
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
