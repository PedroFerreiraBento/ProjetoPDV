import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const now = new Date()

async function main() {
  // Settings
  await prisma.setting.upsert({
    where: { id: 'global' },
    create: {
      id: 'global',
      allowNegativeStock: false,
      blockOutOfStockSales: true,
      allowCreditSales: true,
      enableScaleBarcodes: true,
      scaleBarcodePrefix: '2',
      scaleValueType: 'PRICE',
      scaleItemCodeLength: 4,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      allowNegativeStock: false,
      blockOutOfStockSales: true,
      allowCreditSales: true,
      enableScaleBarcodes: true,
      scaleBarcodePrefix: '2',
      scaleValueType: 'PRICE',
      scaleItemCodeLength: 4,
      updatedAt: now,
    },
  })

  // Units
  const units = [
    { id: 'unit-un', name: 'Unidade', abbreviation: 'un', allowFractions: false },
    { id: 'unit-kg', name: 'Quilograma', abbreviation: 'kg', allowFractions: true },
    { id: 'unit-g', name: 'Grama', abbreviation: 'g', allowFractions: false },
    { id: 'unit-l', name: 'Litro', abbreviation: 'L', allowFractions: true },
    { id: 'unit-cx', name: 'Caixa', abbreviation: 'cx', allowFractions: false },
  ]

  for (const u of units) {
    await prisma.unit.upsert({
      where: { id: u.id },
      create: { ...u, createdAt: now, updatedAt: now },
      update: { ...u, updatedAt: now },
    })
  }

  // Categories
  const categories = [
    { id: 'cat-bebidas', name: 'Bebidas', description: 'Bebidas quentes e geladas', color: 'orange' },
    { id: 'cat-salgados', name: 'Salgados', description: 'Lanches e salgados', color: 'yellow' },
    { id: 'cat-doces', name: 'Doces', description: 'Sobremesas e doces', color: 'pink' },
    { id: 'cat-mercearia', name: 'Mercearia', description: 'Itens de conveniência', color: 'blue' },
  ]

  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: { ...c, createdAt: now, updatedAt: now },
      update: { ...c, updatedAt: now },
    })
  }

  // Branches
  const branches = [
    {
      id: 'branch-matriz',
      name: 'Loja Matriz Centro',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 3333-0001',
      address: JSON.stringify({ cep: '01001-000', street: 'Rua Central', number: '100', neighborhood: 'Centro', city: 'São Paulo', state: 'SP' }),
      isActive: true,
    },
    {
      id: 'branch-norte',
      name: 'Filial Zona Norte',
      cnpj: '12.345.678/0002-70',
      phone: '(11) 3333-0002',
      address: JSON.stringify({ cep: '02020-000', street: 'Av. Norte', number: '250', neighborhood: 'Santana', city: 'São Paulo', state: 'SP' }),
      isActive: true,
    },
  ]

  for (const b of branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      create: { ...b, createdAt: now, updatedAt: now },
      update: { ...b, updatedAt: now },
    })
  }

  // Terminals
  const terminals = [
    { id: 'term-matriz-01', name: 'Caixa 01 Matriz', branchId: 'branch-matriz', isActive: true },
    { id: 'term-matriz-02', name: 'Caixa 02 Matriz', branchId: 'branch-matriz', isActive: true },
    { id: 'term-norte-01', name: 'Caixa 01 Norte', branchId: 'branch-norte', isActive: true },
  ]

  for (const t of terminals) {
    await prisma.terminal.upsert({
      where: { id: t.id },
      create: { ...t, createdAt: now, updatedAt: now },
      update: { ...t, updatedAt: now },
    })
  }

  // Operators
  const operators = [
    { id: 'admin-1', name: 'Admin', role: 'ADMIN', email: 'admin@sistema.com', password: 'admin123', pin: '1234' },
    { id: 'manager-1', name: 'Gerente Loja', role: 'MANAGER', email: 'gerente@empresa.com', password: 'gerente123', pin: '2345' },
    { id: 'cashier-1', name: 'Caixa Ana', role: 'CASHIER', email: null, password: null, pin: '1111' },
    { id: 'cashier-2', name: 'Caixa Bruno', role: 'CASHIER', email: null, password: null, pin: '2222' },
  ]

  for (const o of operators) {
    await prisma.operator.upsert({
      where: { id: o.id },
      create: { ...o, createdAt: now, updatedAt: now },
      update: { ...o, updatedAt: now },
    })
  }

  // Suppliers
  const suppliers = [
    { id: 'sup-1', name: 'Distribuidora Bom Café', cnpj: '44.555.666/0001-10', phone: '(11) 4000-1000', email: 'vendas@bomcafe.com', contactName: 'Marcos', notes: 'Entrega semanal' },
    { id: 'sup-2', name: 'Laticínios Serra', cnpj: '77.888.999/0001-20', phone: '(11) 4000-2000', email: 'comercial@serra.com', contactName: 'Paula', notes: 'Prazo 21 dias' },
  ]

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      create: { ...s, createdAt: now, updatedAt: now },
      update: { ...s, updatedAt: now },
    })
  }

  // Products
  const products = [
    {
      id: 'prod-cafe-expresso',
      name: 'Café Expresso',
      sku: 'CAF-EXP-01',
      price: 700,
      cost: 250,
      stock: 200,
      minStock: 30,
      barcode: '7891000000011',
      categoryId: 'cat-bebidas',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: true,
      promotionType: 'NONE',
      branchStocks: JSON.stringify({ 'branch-matriz': 120, 'branch-norte': 80 }),
    },
    {
      id: 'prod-pao-queijo',
      name: 'Pão de Queijo',
      sku: 'PAO-QUE-01',
      price: 850,
      cost: 320,
      stock: 32,
      minStock: 40,
      barcode: '7891000000028',
      categoryId: 'cat-salgados',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: true,
      promotionType: 'NONE',
      trackBatches: true,
      batches: JSON.stringify([
        { id: 'batch-paoq-1', batchNumber: 'PQ-2401', expirationDate: new Date(Date.now() - 3 * 86400000).toISOString(), stock: 6, cost: 300, supplier: 'Laticínios Serra', purchaseDate: new Date(Date.now() - 20 * 86400000).toISOString() },
        { id: 'batch-paoq-2', batchNumber: 'PQ-2402', expirationDate: new Date(Date.now() + 7 * 86400000).toISOString(), stock: 12, cost: 310, supplier: 'Laticínios Serra', purchaseDate: new Date(Date.now() - 10 * 86400000).toISOString() },
        { id: 'batch-paoq-3', batchNumber: 'PQ-2403', expirationDate: new Date(Date.now() + 22 * 86400000).toISOString(), stock: 14, cost: 315, supplier: 'Laticínios Serra', purchaseDate: new Date(Date.now() - 3 * 86400000).toISOString() },
      ]),
      branchStocks: JSON.stringify({ 'branch-matriz': 18, 'branch-norte': 14 }),
    },
    {
      id: 'prod-agua-500',
      name: 'Água Mineral 500ml',
      sku: 'AGU-500',
      price: 450,
      cost: 180,
      stock: 300,
      minStock: 50,
      barcode: '7891000000035',
      categoryId: 'cat-bebidas',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: true,
      promotionType: 'NONE',
      branchStocks: JSON.stringify({ 'branch-matriz': 180, 'branch-norte': 120 }),
    },
    {
      id: 'prod-croissant',
      name: 'Croissant de Presunto e Queijo',
      sku: 'CRO-PQ-01',
      price: 1200,
      cost: 520,
      stock: 16,
      minStock: 20,
      barcode: '7891000000042',
      categoryId: 'cat-salgados',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: false,
      promotionType: 'NONE',
      branchStocks: JSON.stringify({ 'branch-matriz': 10, 'branch-norte': 6 }),
    },
    {
      id: 'prod-brigadeiro',
      name: 'Brigadeiro Gourmet',
      sku: 'DOC-BRI-01',
      price: 500,
      cost: 180,
      stock: 14,
      minStock: 25,
      barcode: '7891000000059',
      categoryId: 'cat-doces',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: false,
      promotionType: 'NONE',
      branchStocks: JSON.stringify({ 'branch-matriz': 8, 'branch-norte': 6 }),
    },
    {
      id: 'prod-iogurte-natural',
      name: 'Iogurte Natural 170g',
      sku: 'IOG-170',
      price: 790,
      cost: 320,
      stock: 21,
      minStock: 18,
      barcode: '7891000000073',
      categoryId: 'cat-doces',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: false,
      promotionType: 'NONE',
      trackBatches: true,
      batches: JSON.stringify([
        { id: 'batch-iog-1', batchNumber: 'IOG-001', expirationDate: new Date(Date.now() + 5 * 86400000).toISOString(), stock: 8, cost: 300, supplier: 'Laticínios Serra', purchaseDate: new Date(Date.now() - 6 * 86400000).toISOString() },
        { id: 'batch-iog-2', batchNumber: 'IOG-002', expirationDate: new Date(Date.now() + 18 * 86400000).toISOString(), stock: 7, cost: 315, supplier: 'Laticínios Serra', purchaseDate: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'batch-iog-3', batchNumber: 'IOG-003', expirationDate: new Date(Date.now() + 45 * 86400000).toISOString(), stock: 6, cost: 320, supplier: 'Laticínios Serra', purchaseDate: new Date(Date.now() - 1 * 86400000).toISOString() },
      ]),
      branchStocks: JSON.stringify({ 'branch-matriz': 11, 'branch-norte': 10 }),
    },
    {
      id: 'prod-refrigerante-lata',
      name: 'Refrigerante Lata',
      sku: 'REF-LAT-01',
      price: 650,
      cost: 260,
      stock: 220,
      minStock: 40,
      barcode: '7891000000066',
      categoryId: 'cat-mercearia',
      unitId: 'unit-un',
      hasVariations: false,
      options: JSON.stringify([]),
      variants: JSON.stringify([]),
      isFavorite: false,
      promotionType: 'NONE',
      branchStocks: JSON.stringify({ 'branch-matriz': 140, 'branch-norte': 80 }),
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: { ...p, createdAt: now, updatedAt: now },
      update: { ...p, updatedAt: now },
    })
  }

  // Customers
  const customers = [
    { id: 'cust-1', name: 'João Pereira', cpf: '12345678909', phone: '11999990001', email: 'joao@email.com', notes: 'Prefere contato via WhatsApp' },
    { id: 'cust-2', name: 'Mariana Souza', cpf: '98765432100', phone: '11999990002', email: 'mariana@email.com', notes: 'Cliente recorrente' },
    { id: 'cust-3', name: 'Empresa XPTO Ltda', cpf: null, phone: '1133330003', email: 'financeiro@xpto.com', notes: 'Compras corporativas' },
  ]

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: { ...c, createdAt: now, updatedAt: now },
      update: { ...c, updatedAt: now },
    })
  }

  // Coupons
  const coupons = [
    {
      id: 'coupon-bemvindo10',
      code: 'BEMVINDO10',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderValue: 3000,
      maxUses: 200,
      usedCount: 12,
      isActive: true,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    },
    {
      id: 'coupon-cafe5',
      code: 'CAFE5',
      discountType: 'FIXED',
      discountValue: 500,
      minOrderValue: 2000,
      maxUses: 100,
      usedCount: 5,
      isActive: true,
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  ]

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { id: c.id },
      create: { ...c, createdAt: now, updatedAt: now },
      update: { ...c, updatedAt: now },
    })
  }

  // Purchase Orders
  const purchaseOrders = [
    {
      id: 'po-1001',
      supplierId: 'sup-1',
      supplierName: 'Distribuidora Bom Café',
      items: JSON.stringify([
        { productId: 'prod-cafe-expresso', productName: 'Café Expresso', quantity: 120, unitCost: 220 },
        { productId: 'prod-agua-500', productName: 'Água Mineral 500ml', quantity: 200, unitCost: 170 },
      ]),
      status: 'RECEIVED',
      totalCost: 60400,
      notes: 'Reposição quinzenal',
      receivedAt: now,
      receivedBy: 'Gerente Loja',
    },
    {
      id: 'po-1002',
      supplierId: 'sup-2',
      supplierName: 'Laticínios Serra',
      items: JSON.stringify([
        { productId: 'prod-pao-queijo', productName: 'Pão de Queijo', quantity: 80, unitCost: 300 },
        { productId: 'prod-croissant', productName: 'Croissant de Presunto e Queijo', quantity: 50, unitCost: 500 },
      ]),
      status: 'PENDING',
      totalCost: 49000,
      notes: 'Aguardando entrega',
      receivedAt: null,
      receivedBy: null,
    },
  ]

  for (const p of purchaseOrders) {
    await prisma.purchaseOrder.upsert({
      where: { id: p.id },
      create: { ...p, createdAt: now, updatedAt: now },
      update: { ...p, updatedAt: now },
    })
  }

  // Stock Movements
  const stockMovements = [
    {
      id: 'mov-1',
      productId: 'prod-cafe-expresso',
      variantId: null,
      quantity: 120,
      type: 'IN',
      branchId: 'branch-matriz',
      toBranchId: null,
      reason: 'Recebimento PO-1001',
      operatorId: 'manager-1',
      operatorName: 'Gerente Loja',
    },
    {
      id: 'mov-2',
      productId: 'prod-pao-queijo',
      variantId: null,
      quantity: 25,
      type: 'SALE',
      branchId: 'branch-matriz',
      toBranchId: null,
      reason: 'Venda balcão',
      operatorId: 'cashier-1',
      operatorName: 'Caixa Ana',
    },
    {
      id: 'mov-3',
      productId: 'prod-agua-500',
      variantId: null,
      quantity: 20,
      type: 'TRANSFER',
      branchId: 'branch-matriz',
      toBranchId: 'branch-norte',
      reason: 'Transferência interna',
      operatorId: 'manager-1',
      operatorName: 'Gerente Loja',
    },
    {
      id: 'mov-4',
      productId: 'prod-croissant',
      variantId: null,
      quantity: 5,
      type: 'ADJUST',
      branchId: 'branch-norte',
      toBranchId: null,
      reason: 'Ajuste por perda',
      operatorId: 'manager-1',
      operatorName: 'Gerente Loja',
    },
  ]

  for (const m of stockMovements) {
    await prisma.stockMovement.upsert({
      where: { id: m.id },
      create: { ...m, createdAt: now, updatedAt: now },
      update: { ...m, updatedAt: now },
    })
  }

  // Sales
  const productMap = Object.fromEntries(products.map((p) => [p.id, p])) as Record<string, any>
  const saleTemplates = [
    {
      items: [
        { productId: 'prod-cafe-expresso', quantity: 2 },
        { productId: 'prod-pao-queijo', quantity: 1 },
      ],
      paymentMethod: 'PIX',
      discount: 0,
      fee: 0,
      customerId: 'cust-1',
      customerName: 'João Pereira',
      customerCpf: '12345678909',
    },
    {
      items: [
        { productId: 'prod-croissant', quantity: 1 },
        { productId: 'prod-refrigerante-lata', quantity: 2 },
      ],
      paymentMethod: 'MONEY',
      discount: 120,
      fee: 0,
    },
    {
      items: [
        { productId: 'prod-agua-500', quantity: 3 },
        { productId: 'prod-brigadeiro', quantity: 2 },
      ],
      paymentMethod: 'DEBIT_CARD',
      discount: 0,
      fee: 60,
    },
    {
      items: [
        { productId: 'prod-cafe-expresso', quantity: 3 },
        { productId: 'prod-iogurte-natural', quantity: 2 },
      ],
      paymentMethod: 'CREDIT_CARD',
      discount: 200,
      fee: 0,
    },
    {
      items: [
        { productId: 'prod-pao-queijo', quantity: 2 },
        { productId: 'prod-agua-500', quantity: 1 },
      ],
      paymentMethod: 'CREDIT',
      discount: 0,
      fee: 0,
      customerId: 'cust-3',
      customerName: 'Empresa XPTO Ltda',
    },
  ]

  const operatorByIndex = [
    { id: 'cashier-1', name: 'Caixa Ana' },
    { id: 'cashier-2', name: 'Caixa Bruno' },
  ]
  const terminalByIndex = [
    { id: 'term-matriz-01', branchId: 'branch-matriz' },
    { id: 'term-matriz-02', branchId: 'branch-matriz' },
    { id: 'term-norte-01', branchId: 'branch-norte' },
  ]

  const sales: any[] = []
  let saleCounter = 1
  let itemCounter = 1

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const base = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - dayOffset,
      12,
      0,
      0,
      0
    ))

    for (let slot = 0; slot < 4; slot++) {
      const template = saleTemplates[(dayOffset + slot) % saleTemplates.length]
      const terminal = terminalByIndex[(dayOffset + slot) % terminalByIndex.length]
      const operator = operatorByIndex[(dayOffset + slot) % operatorByIndex.length]
      const createdAt = new Date(base.getTime() + slot * 75 * 60 * 1000)

      const builtItems = template.items.map((it: any) => {
        const prod = productMap[it.productId]
        return {
          id: `seed-si-${itemCounter++}`,
          productId: it.productId,
          name: prod.name,
          price: prod.price,
          quantity: it.quantity,
        }
      })

      const subtotal = builtItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0)
      const totalDiscounts = template.discount || 0
      const totalFees = template.fee || 0
      const total = subtotal - totalDiscounts + totalFees

      const isVoided = dayOffset === 5 && slot === 3
      const isCash = template.paymentMethod === 'MONEY'
      const cashGiven = isCash ? total + (slot % 2 === 0 ? 200 : 0) : total
      const change = isCash ? Math.max(0, cashGiven - total) : 0

      sales.push({
        id: `seed-sale-${String(saleCounter++).padStart(4, '0')}`,
        subtotal,
        totalDiscounts,
        totalFees,
        total,
        change: isVoided ? null : change,
        customerCpf: template.customerCpf || null,
        customerId: template.customerId || null,
        customerName: template.customerName || null,
        operatorId: operator.id,
        operatorName: operator.name,
        branchId: terminal.branchId,
        terminalId: terminal.id,
        createdAt,
        updatedAt: createdAt,
        status: isVoided ? 'VOIDED' : 'COMPLETED',
        observation: isVoided ? 'Venda cancelada para demonstração' : `Venda seed ${dayOffset}d/${slot + 1}`,
        couponCode: totalDiscounts > 0 ? 'BEMVINDO10' : null,
        voidReason: isVoided ? 'Cancelamento de teste' : null,
        voidedAt: isVoided ? new Date(createdAt.getTime() + 5 * 60 * 1000) : null,
        voidedBy: isVoided ? 'Admin' : null,
        creditSettledAt: template.paymentMethod === 'CREDIT' ? null : null,
        items: JSON.stringify(builtItems),
        payments: JSON.stringify(isVoided ? [] : [{ method: template.paymentMethod, amount: isCash ? cashGiven : total }]),
      })
    }
  }

  for (const s of sales) {
    await prisma.sale.upsert({
      where: { id: s.id },
      create: s,
      update: s,
    })
  }

  // Cash Sessions
  const cashSessions = [
    {
      id: 'cash-7001',
      branchId: 'branch-matriz',
      terminalId: 'term-matriz-01',
      terminalName: 'Caixa 01 Matriz',
      operatorId: 'cashier-1',
      operatorName: 'Caixa Ana',
      openedAt: now,
      closedAt: null,
      status: 'OPEN',
      openingBalance: 30000,
      closingBalance: null,
      expectedBalance: 32050,
      transactions: JSON.stringify([
        { id: 'ct-1', sessionId: 'cash-7001', type: 'OPENING', amount: 30000, description: 'Abertura de caixa', operatorId: 'cashier-1', operatorName: 'Caixa Ana', createdAt: now.toISOString() },
        { id: 'ct-2', sessionId: 'cash-7001', type: 'SALE', amount: 2050, description: 'Venda #sale-9001 MONEY/PIX', operatorId: 'cashier-1', operatorName: 'Caixa Ana', createdAt: now.toISOString() },
      ]),
    },
    {
      id: 'cash-7002',
      branchId: 'branch-norte',
      terminalId: 'term-norte-01',
      terminalName: 'Caixa 01 Norte',
      operatorId: 'cashier-2',
      operatorName: 'Caixa Bruno',
      openedAt: new Date(now.getTime() - 86400000),
      closedAt: new Date(now.getTime() - 82800000),
      status: 'CLOSED',
      openingBalance: 25000,
      closingBalance: 27200,
      expectedBalance: 27180,
      transactions: JSON.stringify([
        { id: 'ct-3', sessionId: 'cash-7002', type: 'OPENING', amount: 25000, description: 'Abertura', operatorId: 'cashier-2', operatorName: 'Caixa Bruno', createdAt: new Date(now.getTime() - 86400000).toISOString() },
        { id: 'ct-4', sessionId: 'cash-7002', type: 'SALE', amount: 2340, description: 'Venda #sale-9002', operatorId: 'cashier-2', operatorName: 'Caixa Bruno', createdAt: new Date(now.getTime() - 85000000).toISOString() },
        { id: 'ct-5', sessionId: 'cash-7002', type: 'BLEED', amount: 160, description: 'Sangria', operatorId: 'cashier-2', operatorName: 'Caixa Bruno', createdAt: new Date(now.getTime() - 84000000).toISOString() },
      ]),
    },
  ]

  for (const c of cashSessions) {
    await prisma.cashSession.upsert({
      where: { id: c.id },
      create: { ...c, createdAt: c.openedAt, updatedAt: now },
      update: { ...c, updatedAt: now },
    })
  }

  // Basic audit logs
  const auditLogs = [
    {
      id: 'audit-1',
      entity: 'branch',
      action: 'CREATE',
      oldData: null,
      newData: JSON.stringify({ id: 'branch-matriz', name: 'Loja Matriz Centro' }),
      operatorId: 'admin-1',
      operatorName: 'Admin',
      branchId: 'branch-matriz',
    },
    {
      id: 'audit-2',
      entity: 'product',
      action: 'CREATE',
      oldData: null,
      newData: JSON.stringify({ id: 'prod-cafe-expresso', name: 'Café Expresso' }),
      operatorId: 'admin-1',
      operatorName: 'Admin',
      branchId: 'branch-matriz',
    },
  ]

  for (const a of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      create: { ...a, createdAt: now, updatedAt: now },
      update: { ...a, updatedAt: now },
    })
  }

  console.log('MVP seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
