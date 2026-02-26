import { create } from 'zustand'
import { AuditLog } from '@pos/shared'

interface AuditState {
    logs: AuditLog[]
    logChange: (params: {
        entity: string
        action: 'CREATE' | 'UPDATE' | 'DELETE'
        oldData?: any
        newData?: any
        operatorId: string
        operatorName: string
        branchId?: string
    }) => void
    clearLogs: () => void
}

export const useAuditStore = create<AuditState>()(
    (set) => ({
            logs: [],
            logChange: ({ entity, action, oldData, newData, operatorId, operatorName, branchId }) => {
                const newLog: AuditLog = {
                    id: crypto.randomUUID(),
                    entity,
                    action,
                    oldData: oldData ? JSON.stringify(oldData) : null,
                    newData: newData ? JSON.stringify(newData) : null,
                    operatorId,
                    operatorName,
                    branchId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }

                set((state) => ({
                    logs: [...state.logs, newLog]
                }))
            },
            clearLogs: () => set({ logs: [] })
        })
)
