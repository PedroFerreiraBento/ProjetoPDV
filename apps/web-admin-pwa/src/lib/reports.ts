import { Sale, PaymentMethod, CashSession } from '@pos/shared'
import { isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns'

export interface DateRange {
    from: Date
    to: Date
}

export function filterSalesByDateRow(sales: Sale[], dateRange: DateRange): Sale[] {
    return sales.filter(sale => {
        const saleDate = parseISO(sale.createdAt)
        return isWithinInterval(saleDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
        })
    })
}

export function filterSessionsByDateRow(sessions: CashSession[], dateRange: DateRange): CashSession[] {
    return sessions.filter(session => {
        const sessionDate = parseISO(session.openedAt)
        return isWithinInterval(sessionDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
        })
    })
}

// 52. Vendas do dia / Período (Geral)
export function getSalesSummary(sales: Sale[]) {
    const validSales = sales.filter(s => s.status === 'COMPLETED')
    const totalRevenue = validSales.reduce((acc, sum) => acc + sum.total, 0)
    const totalDiscounts = validSales.reduce((acc, sum) => acc + sum.totalDiscounts, 0)
    const totalItems = validSales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0)

    return {
        count: validSales.length,
        totalRevenue,
        totalDiscounts,
        totalItems,
        ticketMedio: validSales.length > 0 ? totalRevenue / validSales.length : 0
    }
}

// 53. Relatório por operador
export function getSalesByOperator(sales: Sale[]) {
    const validSales = sales.filter(s => s.status === 'COMPLETED')
    const opMap = new Map<string, { operatorName: string, count: number, total: number }>()

    validSales.forEach(sale => {
        const opName = sale.operatorName || 'Desconhecido'
        const current = opMap.get(opName) || { operatorName: opName, count: 0, total: 0 }
        current.count += 1
        current.total += sale.total
        opMap.set(opName, current)
    })

    return Array.from(opMap.values()).sort((a, b) => b.total - a.total)
}

// 54. Relatório por forma de pagamento
export function getSalesByPaymentMethod(sales: Sale[]) {
    const validSales = sales.filter(s => s.status === 'COMPLETED')
    const payMap = new Map<PaymentMethod, { method: PaymentMethod, count: number, total: number }>()

    validSales.forEach(sale => {
        sale.payments.forEach(p => {
            const current = payMap.get(p.method) || { method: p.method, count: 0, total: 0 }
            current.count += 1
            current.total += p.amount
            payMap.set(p.method, current)
        })
    })

    return Array.from(payMap.values()).sort((a, b) => b.total - a.total)
}

// 55. Relatório por produto (ranking)
export function getSalesByProduct(sales: Sale[], productsStore: any) {
    const validSales = sales.filter(s => s.status === 'COMPLETED')
    const prodMap = new Map<string, { productId: string, name: string, quantity: number, totalRevenue: number, totalCost: number, profit: number }>()

    const productCostMap = new Map<string, number>()
    productsStore.products.forEach((p: any) => productCostMap.set(p.id, p.cost || 0))

    validSales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.isReturn) return; // Skip returns for sales ranking

            const cost = productCostMap.get(item.productId) || 0

            const current = prodMap.get(item.productId) || {
                productId: item.productId,
                name: item.name,
                quantity: 0,
                totalRevenue: 0,
                totalCost: 0,
                profit: 0
            }

            const revenue = item.price * item.quantity
            const totalCost = cost * item.quantity
            const profit = revenue - totalCost

            current.quantity += item.quantity
            current.totalRevenue += revenue
            current.totalCost += totalCost
            current.profit += profit

            prodMap.set(item.productId, current)
        })
    })

    // Sort by absolute profit
    return Array.from(prodMap.values()).sort((a, b) => b.profit - a.profit)
}

// 56. Relatório por categoria
export function getSalesByCategory(sales: Sale[], productsStore: any, categoriesStore: any) {
    const validSales = sales.filter(s => s.status === 'COMPLETED')
    const catMap = new Map<string, { categoryId: string, name: string, quantity: number, totalRevenue: number, totalCost: number, profit: number }>()

    // Create a quick lookup for product -> categoryId and cost
    const productCategoryMap = new Map<string, string>()
    const productCostMap = new Map<string, number>()
    productsStore.products.forEach((p: any) => {
        if (p.categoryId) productCategoryMap.set(p.id, p.categoryId)
        productCostMap.set(p.id, p.cost || 0)
    })

    // Create a quick lookup for categoryId -> name
    const categoryNameMap = new Map<string, string>()
    categoriesStore.categories.forEach((c: any) => categoryNameMap.set(c.id, c.name))

    validSales.forEach(sale => {
        sale.items.forEach(item => {
            if (item.isReturn) return;
            const catId = productCategoryMap.get(item.productId) || 'SEM_CATEGORIA'
            const catName = catId === 'SEM_CATEGORIA' ? 'Sem Categoria' : (categoryNameMap.get(catId) || 'Desconhecida')

            const cost = productCostMap.get(item.productId) || 0

            const current = catMap.get(catId) || {
                categoryId: catId,
                name: catName,
                quantity: 0,
                totalRevenue: 0,
                totalCost: 0,
                profit: 0
            }

            const revenue = item.price * item.quantity
            const totalCost = cost * item.quantity
            const profit = revenue - totalCost

            current.quantity += item.quantity
            current.totalRevenue += revenue
            current.totalCost += totalCost
            current.profit += profit

            catMap.set(catId, current)
        })
    })

    // Sort by absolute profit
    return Array.from(catMap.values()).sort((a, b) => b.profit - a.profit)
}

// 57. Relatório de descontos concedidos
export function getDiscountsReport(sales: Sale[]) {
    const validSales = sales.filter(s => s.status === 'COMPLETED' && s.totalDiscounts > 0)
    return validSales.map(s => ({
        saleId: s.id,
        date: s.createdAt,
        operatorName: s.operatorName || 'Desconhecido',
        subtotal: s.subtotal,
        discount: s.totalDiscounts,
        total: s.total
    })).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
}

// 58. CSV Export utility
export function downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            let cell = row[header] === null || row[header] === undefined ? '' : row[header]
            // Escape quotes and wrap in quotes if there's a comma
            if (typeof cell === 'string') {
                cell = cell.replace(/"/g, '""')
                if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
                    cell = `"${cell}"`
                }
            }
            return cell
        }).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }) // \uFEFF for Excel UTF-8 BOM
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
