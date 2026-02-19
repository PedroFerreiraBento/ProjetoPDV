import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SetupWizard } from './pages/setup'
import { DashboardLayout } from './layouts/DashboardLayout'
import { UsersPage } from './pages/dashboard/users'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/setup" replace />} />
                <Route path="/setup" element={<SetupWizard />} />

                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="users" replace />} />
                    <Route path="users" element={<UsersPage />} />
                    {/* Add more routes here later (e.g., sales, products) */}
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
