export type AppRole = 'ADMIN' | 'MANAGER' | 'CASHIER'

export type AppPermission =
    // User Management
    | 'MANAGE_USERS'

    // Store Configuration
    | 'MANAGE_SETTINGS'

    // Product Management
    | 'MANAGE_PRODUCTS'
    | 'VIEW_PRODUCTS'

    // Sales & POS
    | 'CREATE_SALE'
    | 'VOID_SALE'
    | 'APPLY_DISCOUNT'
    | 'MANAGE_PRICES'
    | 'OPEN_REGISTER'
    | 'CLOSE_REGISTER'

    // Reporting
    | 'VIEW_REPORTS'

export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
    ADMIN: [
        'MANAGE_USERS',
        'MANAGE_SETTINGS',
        'MANAGE_PRODUCTS',
        'VIEW_PRODUCTS',
        'CREATE_SALE',
        'VOID_SALE',
        'APPLY_DISCOUNT',
        'MANAGE_PRICES',
        'OPEN_REGISTER',
        'CLOSE_REGISTER',
        'VIEW_REPORTS',
    ],
    MANAGER: [
        'MANAGE_PRODUCTS',
        'VIEW_PRODUCTS',
        'CREATE_SALE',
        'VOID_SALE',
        'APPLY_DISCOUNT',
        'MANAGE_PRICES',
        'OPEN_REGISTER',
        'CLOSE_REGISTER',
        'VIEW_REPORTS',
    ],
    CASHIER: [
        'VIEW_PRODUCTS',
        'CREATE_SALE',
        'APPLY_DISCOUNT', // Can apply discounts within certain limits (handled by business logic)
        'OPEN_REGISTER',
        'CLOSE_REGISTER',
    ],
}

export const ROLE_LABELS: Record<AppRole, string> = {
    ADMIN: 'Administrador geral',
    MANAGER: 'Gerente da loja',
    CASHIER: 'Caixa / Operador'
}
