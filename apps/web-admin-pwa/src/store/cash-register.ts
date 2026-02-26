import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CashSession, CashTransaction } from '@pos/shared'
import { useAuditStore } from './audit'

interface CashRegisterStore {
    sessions: CashSession[]
    currentSessionId: string | null

    // Actions
    openSession: (operatorId: string, operatorName: string, openingBalance: number, branchId: string, terminalId: string, terminalName?: string) => CashSession
    closeSession: (closingBalance: number) => void
    addTransaction: (data: Omit<CashTransaction, 'id' | 'sessionId' | 'createdAt'>) => CashTransaction

    // Getters
    getCurrentSession: () => CashSession | null
    getExpectedBalance: (session: CashSession) => number
}

export const useCashRegisterStore = create<CashRegisterStore>()(
    persist(
        (set, get) => ({
            sessions: [],
            currentSessionId: null,

            getCurrentSession: () => {
                const { sessions, currentSessionId } = get()
                return sessions.find(s => s.id === currentSessionId) || null
            },

            getExpectedBalance: (session: CashSession) => {
                let balance = 0
                session.transactions.forEach(t => {
                    if (t.type === 'SALE' || t.type === 'SUPPLY' || t.type === 'OPENING') {
                        balance += t.amount
                    } else if (t.type === 'BLEED' || t.type === 'RETURN' || t.type === 'CLOSING') {
                        // CLOSING transaction amount is usually what was counted, 
                        // but here we track movements.
                        if (t.type !== 'CLOSING') {
                            balance -= t.amount
                        }
                    }
                })
                return balance
            },

            openSession: (operatorId, operatorName, openingBalance, branchId, terminalId, terminalName) => {
                const newSession: CashSession = {
                    id: crypto.randomUUID(),
                    branchId,
                    terminalId,
                    terminalName,
                    operatorId,
                    operatorName,
                    openedAt: new Date().toISOString(),
                    status: 'OPEN',
                    openingBalance,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    transactions: [
                        {
                            id: crypto.randomUUID(),
                            sessionId: '', // Will be set below
                            type: 'OPENING',
                            amount: openingBalance,
                            description: 'Abertura de caixa',
                            operatorId,
                            operatorName,
                            createdAt: new Date().toISOString(),
                        }
                    ]
                }
                newSession.transactions[0].sessionId = newSession.id

                useAuditStore.getState().logChange({
                    entity: 'cashSession',
                    action: 'CREATE',
                    newData: newSession,
                    operatorId,
                    operatorName,
                    branchId
                })

                set(state => ({
                    sessions: [...state.sessions, newSession],
                    currentSessionId: newSession.id
                }))

                return newSession
            },

            closeSession: (closingBalance) => {
                const session = get().getCurrentSession()
                if (!session) return

                const expectedBalance = get().getExpectedBalance(session)

                const closingTransaction: CashTransaction = {
                    id: crypto.randomUUID(),
                    sessionId: session.id,
                    type: 'CLOSING',
                    amount: closingBalance,
                    description: 'Fechamento de caixa',
                    operatorId: session.operatorId,
                    operatorName: session.operatorName,
                    createdAt: new Date().toISOString(),
                }

                const updatedSession = {
                    ...session,
                    status: 'CLOSED' as const,
                    closedAt: new Date().toISOString(),
                    closingBalance,
                    expectedBalance,
                    transactions: [...session.transactions, closingTransaction],
                    updatedAt: new Date().toISOString()
                }

                set(state => ({
                    sessions: state.sessions.map(s => s.id === session.id ? updatedSession : s),
                    currentSessionId: null
                }))

                useAuditStore.getState().logChange({
                    entity: 'cashSession',
                    action: 'UPDATE',
                    oldData: session,
                    newData: updatedSession,
                    operatorId: session.operatorId,
                    operatorName: session.operatorName || 'Desconhecido',
                    branchId: session.branchId
                })
            },

            addTransaction: (data) => {
                const session = get().getCurrentSession()
                if (!session) throw new Error('No active cash session')

                const transaction: CashTransaction = {
                    ...data,
                    id: crypto.randomUUID(),
                    sessionId: session.id,
                    createdAt: new Date().toISOString(),
                }

                const updatedSession = {
                    ...session,
                    transactions: [...session.transactions, transaction],
                    updatedAt: new Date().toISOString()
                }

                set(state => ({
                    sessions: state.sessions.map(s => s.id === session.id ? updatedSession : s)
                }))

                useAuditStore.getState().logChange({
                    entity: 'cashSession',
                    action: 'UPDATE',
                    oldData: session,
                    newData: updatedSession,
                    operatorId: session.operatorId,
                    operatorName: session.operatorName || 'Desconhecido',
                    branchId: session.branchId
                })

                return transaction
            }
        }),
        {
            name: 'pos-cash-register'
        }
    )
)
