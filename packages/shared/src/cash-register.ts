export type CashSessionStatus = 'OPEN' | 'CLOSED';

export type CashTransactionType =
    | 'OPENING'
    | 'CLOSING'
    | 'BLEED' // Sangria
    | 'SUPPLY' // Suprimento
    | 'SALE'
    | 'RETURN';

export interface CashTransaction {
    id: string;
    sessionId: string;
    type: CashTransactionType;
    amount: number;
    description?: string;
    operatorId: string;
    operatorName?: string;
    createdAt: string;
}

export interface CashSession {
    id: string;
    branchId: string;
    terminalId: string;
    terminalName?: string;
    operatorId: string;
    operatorName?: string;
    openedAt: string;
    closedAt?: string;
    status: CashSessionStatus;
    openingBalance: number;
    closingBalance?: number; // What the user actually counted
    expectedBalance?: number; // What the system calculates: opening + sales(money) + supply - bleed - return(money)
    transactions: CashTransaction[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}
