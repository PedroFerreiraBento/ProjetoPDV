import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { SetupWizard } from './pages/setup'
import { DashboardLayout } from './layouts/DashboardLayout'
import { UsersPage } from './pages/dashboard/users'
import { ProductsPage } from './pages/dashboard/products'
import { CategoriesPage } from './pages/dashboard/categories'
import { UnitsPage } from './pages/dashboard/units'
import { LoginPage } from './pages/login'
import { PosPage } from './pages/pos'
import { useOperatorsStore } from './store/operators'

function RequireAuth({ children }: { children: JSX.Element }) {
    const { currentOperator } = useOperatorsStore()
    const location = useLocation()

    if (!currentOperator) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }
    return children
}

function App() {
    const { operators } = useOperatorsStore()
    const hasOperators = operators.length > 0
    return (
        <BrowserRouter>
            <Routes>
                {/* Default route logically goes to login instead of setup if store is configured */}
                <Route path="/" element={<Navigate to={hasOperators ? "/login" : "/setup"} replace />} />
                <Route path="/setup" element={<SetupWizard />} />
                <Route path="/login" element={<LoginPage />} />

                <Route path="/dashboard" element={
                    <RequireAuth>
                        <DashboardLayout />
                    </RequireAuth>
                }>
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="users" element={<UsersPage />} />
                    {/* Product Catalog routes */}
                    <Route path="products" element={<ProductsPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="units" element={<UnitsPage />} />
                    <Route path="units" element={<UnitsPage />} />
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
