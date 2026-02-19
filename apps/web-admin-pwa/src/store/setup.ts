import { create } from 'zustand'

interface SetupState {
    step: number
    theme: 'light' | 'dark'
    storeName: string
    cnpj: string
    phone: string
    address: {
        cep: string
        street: string
        number: string
        neighborhood: string
        city: string
        state: string
    }
    setStep: (step: number) => void
    setTheme: (theme: 'light' | 'dark') => void
    updateStoreData: (data: Partial<SetupState>) => void
    updateAddress: (address: Partial<SetupState['address']>) => void
}

export const useSetupStore = create<SetupState>((set) => ({
    step: 1,
    theme: 'light',
    storeName: '',
    cnpj: '',
    phone: '',
    address: {
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: ''
    },
    setStep: (step) => set({ step }),
    setTheme: (theme) => {
        set({ theme })
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    },
    updateStoreData: (data) => set((state) => ({ ...state, ...data })),
    updateAddress: (address) =>
        set((state) => ({ ...state, address: { ...state.address, ...address } })),
}))
