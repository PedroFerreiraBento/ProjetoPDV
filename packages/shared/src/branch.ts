export interface Address {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
}

export interface Branch {
    id: string;
    name: string; // e.g., "Matriz - Centro", "Filial - Shopping"
    cnpj: string;
    phone?: string;
    address: Address;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface Terminal {
    id: string;
    branchId: string;
    name: string; // e.g., "Caixa 01"
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}
