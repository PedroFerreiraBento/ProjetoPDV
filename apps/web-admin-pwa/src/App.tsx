import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LockScreen } from './components/LockScreen'
import { SetupWizard } from './pages/setup'
import { DashboardLayout } from './layouts/DashboardLayout'
import { OverviewPage } from './pages/dashboard/overview'
import { UsersPage } from './pages/dashboard/users'
import { ProductsPage } from './pages/dashboard/products'
import { CategoriesPage } from './pages/dashboard/categories'
import { UnitsPage } from './pages/dashboard/units'
import { LoginPage } from './pages/login'
import { PosPage } from './pages/pos'
import { SalesPage } from './pages/dashboard/sales'
import { CustomersPage } from './pages/dashboard/customers'
import { StockPage } from './pages/dashboard/stock'
import { SuppliersPage } from './pages/dashboard/suppliers'
import { PurchasesPage } from './pages/dashboard/purchases'
import { CouponsPage } from './pages/dashboard/coupons'
import { ReportsPage } from './pages/dashboard/reports'
import { SettingsPage } from './pages/dashboard/settings'
import { PortalPage } from './pages/portal'
import { useOperatorsStore } from './store/operators'
import { useSyncStore } from './store/sync'
import { useEffect } from 'react'

function RequireAuth({ children }: { children: JSX.Element }) {
    const { currentOperator } = useOperatorsStore()
    const location = useLocation()

    if (!currentOperator) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }
    return children
}

function RequireAdmin({ children }: { children: JSX.Element }) {
    const { currentOperator, authMethod } = useOperatorsStore()
    const location = useLocation()

    if (!currentOperator) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (currentOperator.role !== 'ADMIN' || authMethod !== 'PASSWORD') {
        return <Navigate to="/" replace />
    }

    return children
}

function App() {
    const { operators } = useOperatorsStore()
    const { sync, hasBootstrapped } = useSyncStore()
    const hasOperators = operators.length > 0

    // Auto-sync logic
    useEffect(() => {
        // Run sync immediately on mount
        sync()

        // Set interval to sync every 30 seconds
        const interval = setInterval(() => {
            sync()
        }, 1000 * 30)

        // Listen for online events
        const handleOnline = () => sync()
        window.addEventListener('online', handleOnline)

        return () => {
            clearInterval(interval)
            window.removeEventListener('online', handleOnline)
        }
    }, [sync])

    if (!hasBootstrapped) {
        return null
    }

    return (
        <BrowserRouter>
            <LockScreen />
            <Routes>
                <Route path="/setup" element={<SetupWizard />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Default route */}
                <Route path="/" element={
                    !hasOperators ? <Navigate to="/setup" replace /> :
                        <RequireAuth>
                            <PortalPage />
                        </RequireAuth>
                } />

                <Route path="/dashboard" element={
                    <RequireAdmin>
                        <DashboardLayout />
                    </RequireAdmin>
                }>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<OverviewPage />} />
                    <Route path="users" element={<UsersPage />} />
                    {/* Product Catalog routes */}
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="stock" element={<StockPage />} />
                    <Route path="suppliers" element={<SuppliersPage />} />
                    <Route path="purchases" element={<PurchasesPage />} />
                    <Route path="coupons" element={<CouponsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="units" element={<UnitsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="/pos" element={
                    <RequireAuth>
                        <PosPage />
                    </RequireAuth>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
