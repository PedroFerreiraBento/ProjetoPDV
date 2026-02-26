import { useState } from 'react'
import { Card, CardContent, Button } from '@pos/ui'
import { LogOut, Unlock } from 'lucide-react'
import { useOperatorsStore } from '../store/operators'
import { useNavigate } from 'react-router-dom'
import { Numpad } from '@pos/ui'

export function LockScreen() {
    const { isLocked, currentOperator, unlockScreen, logoutOperator } = useOperatorsStore()
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)
    const navigate = useNavigate()

    if (!isLocked || !currentOperator) {
        return null
    }

    const handlePinEntry = (val: string) => {
        setError(false)
        if (pin.length < 4) {
            setPin(prev => prev + val)
        }
    }

    const handleUnlock = () => {
        if (pin.length === 0) return

        const success = unlockScreen(pin)
        if (!success) {
            setError(true)
            setPin('')
        }
    }

    const handleSwitchOperator = () => {
        logoutOperator()
        navigate('/login')
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
            <Card className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 shadow-2xl">
                <CardContent className="pt-8 pb-6 flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                        <Unlock className="h-8 w-8 text-slate-400" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Tela Bloqueada</h2>
                    <p className="text-sm text-slate-500 mb-6 font-medium">Operador: {currentOperator.name}</p>

                    <div className="flex space-x-3 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-colors ${i <= pin.length
                                    ? error ? 'bg-red-500' : 'bg-brand-500'
                                    : 'bg-slate-200 dark:bg-zinc-800'
                                    }`}
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 mb-4 animate-in fade-in slide-in-from-top-1">
                            PIN incorreto. Tente novamente.
                        </p>
                    )}

                    <Numpad
                        onKeyPress={handlePinEntry}
                        onBackspace={() => setPin(prev => prev.slice(0, -1))}
                    />

                    <Button
                        className="w-full mt-4 h-12"
                        onClick={handleUnlock}
                    >
                        <Unlock className="h-5 w-5 mr-2" />
                        Desbloquear
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={handleSwitchOperator}
                        className="w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Trocar de Operador
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
