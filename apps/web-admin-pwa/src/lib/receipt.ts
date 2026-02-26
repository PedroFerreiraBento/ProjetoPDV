import { Sale, PaymentMethod } from '@pos/shared'
import { formatCurrency } from './utils'

export function generateReceiptText(sale: Sale, storeName: string): string {
    const lines: string[] = []

    // Header
    lines.push(`*${storeName.toUpperCase()}*`)
    lines.push('Recibo Não Fiscal')
    lines.push(`Data: ${new Date(sale.createdAt).toLocaleString('pt-BR')}`)
    lines.push(`Pedido: #${sale.id.split('-')[0]}`)
    if (sale.customerCpf) {
        lines.push(`CPF/CNPJ: ${sale.customerCpf}`)
    }
    lines.push('------------------------')

    // Items
    sale.items.forEach(item => {
        const itemTotal = item.price * item.quantity
        lines.push(`${item.quantity}x ${item.name} - ${formatCurrency(itemTotal)}`)

        if (item.discountValue && item.discountValue > 0) {
            const discountAmt = item.discountType === 'PERCENT'
                ? (itemTotal * item.discountValue / 100)
                : item.discountValue
            lines.push(`  Desc. Item: -${formatCurrency(discountAmt)}`)
        }
    })
    lines.push('------------------------')

    // Subtotals and Adjustments
    lines.push(`Subtotal: ${formatCurrency(sale.subtotal)}`)
    if (sale.totalDiscounts > 0) {
        lines.push(`Descontos: -${formatCurrency(sale.totalDiscounts)}`)
    }
    if (sale.totalFees > 0) {
        lines.push(`Acréscimos: +${formatCurrency(sale.totalFees)}`)
    }
    lines.push(`*TOTAL: ${formatCurrency(sale.total)}*`)
    lines.push('------------------------')

    // Payments
    lines.push('*PAGAMENTOS*')
    sale.payments.forEach(p => {
        const methodMap: Record<PaymentMethod, string> = {
            [PaymentMethod.MONEY]: 'Dinheiro',
            [PaymentMethod.PIX]: 'PIX',
            [PaymentMethod.CREDIT_CARD]: 'C. Crédito',
            [PaymentMethod.DEBIT_CARD]: 'C. Débito',
            [PaymentMethod.CREDIT]: 'Fiado',
        }
        lines.push(`${methodMap[p.method] || 'Outro'}: ${formatCurrency(p.amount)}`)
    })

    if ((sale.change || 0) > 0) {
        lines.push(`*TROCO: ${formatCurrency(sale.change!)}*`)
    }
    lines.push('------------------------')

    // Footer
    lines.push(`Operador: ${sale.operatorName || 'Caixa'}`)
    lines.push('Obrigado pela preferência!')

    return lines.join('\n')
}

export function handleShareReceipt(sale: Sale, storeName: string, method: 'whatsapp' | 'email') {
    const text = generateReceiptText(sale, storeName)
    const encodedText = encodeURIComponent(text)

    // Try native share API first (Great for mobile/PWA)
    if (navigator.share && method === 'whatsapp') {
        navigator.share({
            title: `Recibo - ${storeName}`,
            text: text,
        }).catch(err => {
            console.log("Native share failed, falling back to URL...", err)
            window.open(`https://wa.me/?text=${encodedText}`, '_blank')
        })
        return
    }

    if (method === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    } else if (method === 'email') {
        const subject = encodeURIComponent(`Comprovante de Venda - ${storeName}`)
        window.location.href = `mailto:?subject=${subject}&body=${encodedText}`
    }
}
