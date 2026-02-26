export interface AuditLog {
    id: string
    entity: string // The table/model name, e.g. 'sale', 'product', 'cashSession'
    action: string // 'CREATE', 'UPDATE', 'DELETE'
    oldData?: string | null // JSON string of the previous state
    newData?: string | null // JSON string of the new state
    operatorId: string
    operatorName: string
    branchId?: string
    createdAt: string
    updatedAt: string
    deletedAt?: string | null
}
