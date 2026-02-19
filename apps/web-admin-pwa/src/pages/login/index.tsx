import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOperatorsStore, Operator } from '../../store/operators'
import { Button, Card, CardContent, Numpad } from '@pos/ui'
import { ShieldAlert, UserCog, User, ArrowLeft, Package } from 'lucide-react'
import { AppRole } from '@pos/shared'

export function LoginPage() {
    const navigate = useNavigate()
    const { operators, loginOperator } = useOperatorsStore()
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)

    const handleOperatorSelect = (operator: Operator) => {
        setSelectedOperator(operator)
        setPin('')
        setError(false)
    }

    const handlePinKeyPress = (key: string) => {
        if (pin.length < 4) {
            const newPin = pin + key
            setPin(newPin)
            setError(false)

            if (newPin.length === 4) {
                // Attempt login
                const success = loginOperator(selectedOperator!.id, newPin)
                if (success) {
                    navigate('/dashboard')
                } else {
                    setError(true)
                    setPin('')
                }
            }
        }
    }

    const handleBackspace = () => {
        setPin(pin.slice(0, -1))
        setError(false)
    }

    const getRoleIcon = (role: AppRole) => {
        switch (role) {
            case 'ADMIN': return <ShieldAlert className="h-6 w-6" />
            case 'MANAGER': return <UserCog className="h-6 w-6" />
            case 'CASHIER': return <User className="h-6 w-6" />
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <Package className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Select your profile and enter your PIN
                    </p>
                </div>

                {!selectedOperator ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {operators.map((operator) => (
                            <button
                                key={operator.id}
                                onClick={() => handleOperatorSelect(operator)}
                                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
                            >
                                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors mb-3">
                                    {getRoleIcon(operator.role)}
                                </div>
                                <span className="font-semibold text-sm text-foreground truncate w-full text-center">
                                    {operator.name}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-zinc-900 overflow-hidden relative">
                        {/* Selected Operator Header */}
                        <div className="bg-slate-100 dark:bg-zinc-800/50 p-6 text-center relative border-b border-white/5 dark:border-white/5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 hover:bg-white dark:hover:bg-zinc-800 rounded-full"
                                onClick={() => setSelectedOperator(null)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <span className="font-medium text-lg">{selectedOperator.name}</span>
                        </div>

                        <CardContent className="p-8">
                            <div className="flex flex-col items-center mb-8">
                                <label className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
                                    Enter PIN
                                </label>
                                <div className="flex gap-4">
                                    {[0, 1, 2, 3].map((index) => (
                                        <div
                                            key={index}
                                            className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > index
                                                ? 'bg-primary scale-110'
                                                : 'bg-slate-200 dark:bg-zinc-800'
                                                } ${error ? 'bg-rose-500 animate-pulse' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Numpad
                                onKeyPress={handlePinKeyPress}
                                onBackspace={handleBackspace}
                                maxLength={4}
                                currentLength={pin.length}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
