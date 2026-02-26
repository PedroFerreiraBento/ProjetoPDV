import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { useProductsStore } from './products'
import { useCategoriesStore } from './categories'
import { useUnitsStore } from './units'
import { useOperatorsStore } from './operators'
import { useBranchesStore } from './branches'
import { useSalesStore } from './sales'
import { useCustomersStore } from './customers'
import { useCashRegisterStore } from './cash-register'
import { useTerminalsStore } from './terminals'
import { useSuppliersStore } from './suppliers'
import { usePurchasesStore } from './purchases'
import { useStockStore } from './stock'
import { useCouponsStore } from './coupons'
import { useSettingsStore } from './settings'
import { useAuditStore } from './audit'

interface SyncState {
    lastSyncTimestamp: string | null
    isSyncing: boolean
    syncError: string | null
    hasBootstrapped: boolean
    sync: () => Promise<void>
}

const API_URL = (import.meta as any).env?.VITE_SYNC_API_URL || 'http://localhost:3001/api/sync'

export const useSyncStore = create<SyncState>()(
    persist(
        (set, get) => ({
            lastSyncTimestamp: null,
            isSyncing: false,
            syncError: null,
            hasBootstrapped: false,

            sync: async () => {
                const state = get()
                if (state.isSyncing) return

                if (!navigator.onLine) {
                    return // Can't sync offline
                }

                set({ isSyncing: true, syncError: null })

                try {
                    // 1. Gather all local data
                    const products = useProductsStore.getState().products
                    const categories = useCategoriesStore.getState().categories
                    const units = useUnitsStore.getState().units
                    const operators = useOperatorsStore.getState().operators
                    const branches = useBranchesStore.getState().branches
                    const sales = useSalesStore.getState().sales
                    const customers = useCustomersStore.getState().customers
                    const sessions = useCashRegisterStore.getState().sessions
                    const terminals = useTerminalsStore.getState().terminals
                    const suppliers = useSuppliersStore.getState().suppliers
                    const purchaseOrders = usePurchasesStore.getState().orders
                    const stockMovements = useStockStore.getState().movements
                    const coupons = useCouponsStore.getState().coupons
                    const settings = useSettingsStore.getState()
                    const auditLogs = useAuditStore.getState().logs

                    // If in-memory stores are empty (fresh reload), force a full pull even when
                    // we have a lastSyncTimestamp persisted. Otherwise screens can stay empty.
                    const shouldForceFullPull =
                        !state.hasBootstrapped ||
                        products.length === 0 ||
                        categories.length === 0 ||
                        units.length === 0 ||
                        operators.length === 0 ||
                        branches.length === 0 ||
                        terminals.length === 0

                    // Filter records updated strictly AFTER lastSyncTimestamp
                    const filterNew = (items: any[]) => {
                        if (!state.lastSyncTimestamp) return items
                        return items.filter(i => {
                            const candidate = i.updatedAt || i.createdAt
                            if (!candidate) return false
                            return new Date(candidate) > new Date(state.lastSyncTimestamp!)
                        })
                    }

                    const payload = {
                        product: filterNew(products).map(p => ({
                            ...p,
                            batches: JSON.stringify(p.batches || []),
                            branchStocks: JSON.stringify(p.branchStocks || {}),
                            variants: JSON.stringify(p.variants || []),
                            options: JSON.stringify(p.options || []),
                            bundleItems: JSON.stringify(p.bundleItems || [])
                        })),
                        category: filterNew(categories),
                        unit: filterNew(units),
                        operator: filterNew(operators).map(op => ({
                            ...op,
                            updatedAt: (op as any).updatedAt || op.createdAt
                        })),
                        branch: filterNew(branches).map(b => ({
                            ...b,
                            address: JSON.stringify(b.address || {})
                        })),
                        sale: filterNew(sales).map(s => ({
                            ...s,
                            items: JSON.stringify(s.items),
                            payments: JSON.stringify(s.payments),
                            branchId: s.branchId || 'default-branch'
                        })),
                        customer: filterNew(customers).map(c => ({ ...c, address: JSON.stringify(c.address) })),
                        cashSession: filterNew(sessions).map(c => ({ ...c, transactions: JSON.stringify(c.transactions) })),
                        terminal: filterNew(terminals),
                        supplier: filterNew(suppliers),
                        purchaseOrder: filterNew(purchaseOrders).map(po => ({
                            ...po,
                            items: JSON.stringify(po.items)
                        })),
                        stockMovement: filterNew(stockMovements).map(m => ({
                            ...m,
                            updatedAt: (m as any).updatedAt || m.createdAt
                        })),
                        coupon: filterNew(coupons),
                        setting: [{
                            id: 'global',
                            allowNegativeStock: settings.allowNegativeStock,
                            blockOutOfStockSales: settings.blockOutOfStockSales,
                            allowCreditSales: settings.allowCreditSales,
                            enableScaleBarcodes: settings.enableScaleBarcodes,
                            scaleBarcodePrefix: settings.scaleBarcodePrefix,
                            scaleValueType: settings.scaleValueType,
                            scaleItemCodeLength: settings.scaleItemCodeLength,
                            updatedAt: new Date().toISOString()
                        }],
                        auditLog: filterNew(auditLogs)
                    }

                    const hasLocalChanges = Object.values(payload).some(arr => arr.length > 0)
                    if (hasLocalChanges) {
                        toast.loading('Sincronizando dados offline...', { id: 'sync-toast' })
                    }

                    // 2. Push local changes
                    const pushRes = await fetch(`${API_URL}/push`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    if (!pushRes.ok) {
                        const errBody = await pushRes.text()
                        throw new Error(`Push failed: ${errBody}`)
                    }

                    // 3. Pull remote changes
                    let pullUrl = `${API_URL}/pull`
                    if (state.lastSyncTimestamp && !shouldForceFullPull) {
                        pullUrl += `?since=${encodeURIComponent(state.lastSyncTimestamp)}`
                    }
                    const pullRes = await fetch(pullUrl)
                    if (!pullRes.ok) throw new Error('Pull failed')
                    const pullData = await pullRes.json()

                    let hasRemoteChanges = false

                    if (pullData.success && pullData.changes) {
                        hasRemoteChanges = Object.values(pullData.changes as Record<string, any[]>).some(arr => arr.length > 0)
                        // Merge logic: Overwrite local stores with remote data (remote is source of truth after push)
                        // This relies on Zustand stores exposing a way to replace/upsert
                        // For simplicity, we'll just implement basic set operations or call the setter
                        // In a real robust app, each store would have a `mergeFromServer` action.

                        const parseJSONGuard = (str: any) => {
                            if (typeof str === 'string') {
                                try { return JSON.parse(str) } catch { return str }
                            }
                            return str
                        }

                        if (pullData.changes.product) {
                            const newProds = pullData.changes.product.map((p: any) => ({
                                ...p,
                                batches: parseJSONGuard(p.batches),
                                branchStocks: parseJSONGuard(p.branchStocks),
                                variants: parseJSONGuard(p.variants),
                                options: parseJSONGuard(p.options),
                                bundleItems: parseJSONGuard(p.bundleItems)
                            }))
                            useProductsStore.setState({ products: mergeArrays(products, newProds) })
                        }
                        if (pullData.changes.category) {
                            useCategoriesStore.setState({ categories: mergeArrays(categories, pullData.changes.category) })
                        }
                        if (pullData.changes.unit) {
                            useUnitsStore.setState({ units: mergeArrays(units, pullData.changes.unit) })
                        }
                        if (pullData.changes.operator) {
                            const { currentOperator, authMethod, isLocked } = useOperatorsStore.getState()
                            useOperatorsStore.setState({
                                operators: mergeArrays(operators, pullData.changes.operator),
                                currentOperator,
                                authMethod,
                                isLocked
                            })
                        }
                        if (pullData.changes.branch) {
                            const parsedBranches = pullData.changes.branch.map((b: any) => ({
                                ...b,
                                address: parseJSONGuard(b.address)
                            }))
                            const currentBranchId = useBranchesStore.getState().currentBranchId
                            useBranchesStore.setState({
                                branches: mergeArrays(branches, parsedBranches),
                                currentBranchId
                            })
                        }
                        if (pullData.changes.sale) {
                            const parsedSales = pullData.changes.sale.map((s: any) => ({
                                ...s, items: parseJSONGuard(s.items), payments: parseJSONGuard(s.payments)
                            }))
                            useSalesStore.setState({ sales: mergeArrays(sales, parsedSales) })
                        }
                        if (pullData.changes.customer) {
                            const parsedCust = pullData.changes.customer.map((c: any) => ({
                                ...c, address: parseJSONGuard(c.address)
                            }))
                            useCustomersStore.setState({ customers: mergeArrays(customers, parsedCust) })
                        }
                        if (pullData.changes.cashSession) {
                            const parsedSessions = pullData.changes.cashSession.map((s: any) => ({
                                ...s, transactions: parseJSONGuard(s.transactions)
                            }))
                            useCashRegisterStore.setState({ sessions: mergeArrays(sessions, parsedSessions) })
                        }
                        if (pullData.changes.terminal) {
                            useTerminalsStore.setState({ terminals: mergeArrays(terminals, pullData.changes.terminal) })
                        }
                        if (pullData.changes.supplier) {
                            useSuppliersStore.setState({ suppliers: mergeArrays(suppliers, pullData.changes.supplier) })
                        }
                        if (pullData.changes.purchaseOrder) {
                            const parsedOrders = pullData.changes.purchaseOrder.map((o: any) => ({
                                ...o,
                                items: parseJSONGuard(o.items)
                            }))
                            usePurchasesStore.setState({ orders: mergeArrays(purchaseOrders, parsedOrders) })
                        }
                        if (pullData.changes.stockMovement) {
                            useStockStore.setState({ movements: mergeArrays(stockMovements, pullData.changes.stockMovement) })
                        }
                        if (pullData.changes.coupon) {
                            useCouponsStore.setState({ coupons: mergeArrays(coupons, pullData.changes.coupon) })
                        }
                        if (pullData.changes.setting?.[0]) {
                            const remoteSetting = pullData.changes.setting[0]
                            useSettingsStore.getState().updateSettings({
                                allowNegativeStock: remoteSetting.allowNegativeStock,
                                blockOutOfStockSales: remoteSetting.blockOutOfStockSales,
                                allowCreditSales: remoteSetting.allowCreditSales,
                                enableScaleBarcodes: remoteSetting.enableScaleBarcodes,
                                scaleBarcodePrefix: remoteSetting.scaleBarcodePrefix,
                                scaleValueType: remoteSetting.scaleValueType,
                                scaleItemCodeLength: remoteSetting.scaleItemCodeLength
                            })
                        }
                        if (pullData.changes.auditLog) {
                            useAuditStore.setState({ logs: mergeArrays(auditLogs, pullData.changes.auditLog) })
                        }
                    }

                    set({ lastSyncTimestamp: new Date().toISOString(), isSyncing: false, hasBootstrapped: true })

                    if (hasLocalChanges || hasRemoteChanges) {
                        toast.success('Sincronização offline concluída!', { id: 'sync-toast' })
                    }
                } catch (err: any) {
                    console.error('Sync error:', err)
                    set({ isSyncing: false, syncError: err.message, hasBootstrapped: true })
                    toast.error('Erro na sincronização.', { id: 'sync-toast' })
                }
            }
        }),
        {
            name: 'pos-sync-storage'
        }
    )
)

function mergeArrays(local: any[], remote: any[]) {
    const map = new Map(local.map(item => [item.id, item]))
    for (const r of remote) {
        map.set(r.id, r) // Remote ALWAYS wins since it was successfully processed
    }
    return Array.from(map.values())
}
