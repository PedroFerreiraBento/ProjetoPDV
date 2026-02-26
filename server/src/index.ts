import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const fastify = Fastify({ logger: true })

fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

// Mapeamento dos nomes do client para as chaves usadas no sync
const MODEL_NAMES = [
    'product',
    'category',
    'sale',
    'customer',
    'cashSession',
    'terminal',
    'branch',
    'auditLog',
    'unit',
    'operator',
    'supplier',
    'purchaseOrder',
    'stockMovement',
    'coupon',
    'setting'
] as const

fastify.get('/api/sync/pull', async (request, reply) => {
    try {
        const { since } = request.query as { since?: string }
        const changes: Record<string, any[]> = {}

        for (const model of MODEL_NAMES) {
            // Se "since" não for informado, pega tudo. 
            // Senão, pega apenas atualizados DEPOIS do timestamp.
            const data = await (prisma as any)[model].findMany({
                where: since ? {
                    updatedAt: { gt: since }
                } : undefined
            })
            if (data.length > 0) {
                changes[model] = data
            }
        }

        return { success: true, changes, timestamp: new Date().toISOString() }
    } catch (err) {
        fastify.log.error(err)
        return reply.status(500).send({ success: false, error: 'Pull failed' })
    }
})

fastify.post('/api/sync/push', async (request, reply) => {
    try {
        const payload = request.body as Record<string, any[]>

        let totalUpserts = 0

        // Inicia uma transação sequencial para garantir integridade básica
        for (const [modelKey, records] of Object.entries(payload)) {
            if (!MODEL_NAMES.includes(modelKey as any)) continue;

            for (const record of records) {
                // Upsert: Se existe, atualiza. Se não, cria.
                // Verifica o updatedAt para Last-Write-Wins simples
                const existing = await (prisma as any)[modelKey].findUnique({
                    where: { id: record.id }
                })

                const incomingTs = record.updatedAt || record.createdAt
                const existingTs = existing?.updatedAt || existing?.createdAt
                if (!existing || (incomingTs && existingTs && new Date(incomingTs) > new Date(existingTs))) {
                    await (prisma as any)[modelKey].upsert({
                        where: { id: record.id },
                        create: record,
                        update: record
                    })
                    totalUpserts++
                }
            }
        }

        return { success: true, processed: totalUpserts, timestamp: new Date().toISOString() }
    } catch (err: any) {
        console.error(err)
        fastify.log.error(err)
        return reply.status(500).send({ success: false, error: 'Push failed', details: err?.message || String(err) })
    }
})

fastify.get('/ping', async () => {
    return { status: 'ok', time: new Date().toISOString() }
})

const start = async () => {
    try {
        await prisma.operator.upsert({
            where: { id: 'admin-1' },
            create: {
                id: 'admin-1',
                name: 'Admin',
                role: 'ADMIN',
                email: 'admin@sistema.com',
                password: 'admin123',
                pin: '1234',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            update: {}
        })

        await prisma.setting.upsert({
            where: { id: 'global' },
            create: {
                id: 'global',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            update: {}
        })

        await fastify.listen({ port: 3001, host: '0.0.0.0' })
        console.log(`Server listening on http://localhost:3001`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()
