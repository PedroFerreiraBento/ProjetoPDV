import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOperatorsStore, Operator } from '../../store/operators'
import { useTerminalsStore } from '../../store/terminals'
import { Button, Card, CardContent, Numpad, Input } from '@pos/ui'
import { ShieldAlert, UserCog, User, ArrowLeft, Monitor, LayoutDashboard, ChevronRight, Zap, Globe, Wifi, WifiOff } from 'lucide-react'
import { AppRole } from '@pos/shared'

type LoginMode = 'CHOICE' | 'ADMIN' | 'TERMINAL'

export function LoginPage() {
    const navigate = useNavigate()
    const { operators, loginOperator, loginAdmin } = useOperatorsStore()
    const { linkedTerminalId, terminals } = useTerminalsStore()

    const [mode, setMode] = useState<LoginMode>('CHOICE')
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
    const [pin, setPin] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Automatically set mode to TERMINAL if a terminal ID is linked, otherwise CHOICE
    useEffect(() => {
        if (linkedTerminalId) {
            setMode('TERMINAL')
        } else {
            setMode('CHOICE')
        }
    }, [linkedTerminalId])

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setLoginError(null)
        setIsLoading(true)

        setTimeout(() => {
            const success = loginAdmin(email, password)
            if (success) {
                navigate('/')
            } else {
                setLoginError('E-mail ou senha incorretos.')
                setIsLoading(false)
            }
        }, 800)
    }

    const handleOperatorSelect = (operator: Operator) => {
        setSelectedOperator(operator)
        setPin('')
        setLoginError(null)
    }

    const handlePinKeyPress = (key: string) => {
        if (pin.length < 4) {
            const newPin = pin + key
            setPin(newPin)
            setLoginError(null)

            if (newPin.length === 4) {
                const success = loginOperator(selectedOperator!.id, newPin)
                if (success) {
                    navigate('/')
                } else {
                    setLoginError('PIN incorreto.')
                    setPin('')
                }
            }
        }
    }

    const handleBackspace = () => {
        setPin(pin.slice(0, -1))
        setLoginError(null)
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (mode !== 'TERMINAL' || !selectedOperator) {
                return
            }

            const target = event.target as HTMLElement | null
            const tagName = target?.tagName?.toLowerCase()
            const isTypingField = tagName === 'input' || tagName === 'textarea' || target?.isContentEditable
            if (isTypingField) {
                return
            }

            if (/^\d$/.test(event.key)) {
                event.preventDefault()
                handlePinKeyPress(event.key)
                return
            }

            if (event.key === 'Backspace') {
                event.preventDefault()
                handleBackspace()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mode, selectedOperator, pin])

    const linkedTerminal = terminals.find(t => t.id === linkedTerminalId)

    const getRoleIcon = (role: AppRole) => {
        switch (role) {
            case 'ADMIN': return <ShieldAlert className="h-6 w-6" />
            case 'MANAGER': return <UserCog className="h-6 w-6" />
            case 'CASHIER': return <User className="h-6 w-6" />
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="w-full max-w-4xl z-10">
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform cursor-pointer group border border-slate-200 dark:border-zinc-800">
                        <img src="/logo.png" alt="Caos Domado" className="h-10 w-10 object-contain group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-center space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-zinc-50 flex items-center justify-center gap-3">
                            Caos Domado <span className="text-primary">PDV</span>
                        </h1>
                        <p className="text-slate-500 dark:text-zinc-400 font-medium">Sistema de Gestao e Frente de Loja</p>
                    </div>
                </div>

                {mode === 'CHOICE' && (
                    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                        {/* Admin Choice Card */}
                        <button
                            onClick={() => setMode('ADMIN')}
                            className="group relative flex flex-col items-start p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] text-left transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <LayoutDashboard className="h-7 w-7" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Painel de Gestão</h3>
                                    <Globe className="h-4 w-4 text-slate-400" />
                                </div>
                                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Acesso para administradores. Controle estoque, relatórios e configurações (exige conexão).
                                </p>
                            </div>
                            <div className="mt-8 flex items-center text-primary font-bold text-sm uppercase tracking-widest gap-2">
                                Entrar como Gestor <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </button>

                        {/* Terminal Choice Card */}
                        <button
                            onClick={() => setMode('TERMINAL')}
                            className="group relative flex flex-col items-start p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] text-left transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-[0.98]"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <Monitor className="h-7 w-7" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Terminal PDV</h3>
                                    <WifiOff className="h-4 w-4 text-slate-400" />
                                </div>
                                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                                    Acesso rápido para caixas. Realize vendas e controle sangrias (funciona offline).
                                </p>
                            </div>
                            <div className="mt-8 flex items-center text-primary font-bold text-sm uppercase tracking-widest gap-2">
                                Identificar Operador <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(255,122,26,0.5)]" />
                        </button>
                    </div>
                )}

                {mode === 'ADMIN' && (
                    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <Card className="border-none shadow-2xl shadow-indigo-100 dark:shadow-none dark:bg-zinc-900 rounded-[32px] overflow-hidden">
                            <CardContent className="p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <Button variant="ghost" size="icon" onClick={() => setMode('CHOICE')} className="rounded-full">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full">Gestão Online</span>
                                </div>

                                <form onSubmit={handleAdminLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
                                        <Input
                                            type="email"
                                            placeholder="admin@sistema.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-14 pl-5 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-primary text-lg"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-14 pl-5 bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-800 rounded-2xl focus:ring-primary text-lg"
                                            required
                                        />
                                    </div>

                                    {loginError && (
                                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold text-center animate-in shake duration-500">
                                            {loginError}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {mode === 'TERMINAL' && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="max-w-2xl mx-auto space-y-6">
                            {!selectedOperator ? (
                                <>
                                    <div className="flex items-center justify-between px-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Monitor className="h-5 w-5 text-primary" />
                                            {linkedTerminal?.name || 'Terminal de Vendas'}
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setMode('CHOICE')}
                                            className="text-slate-500 hover:text-primary rounded-full font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            Mudar para Gestão
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {operators.map((operator) => (
                                            <button
                                                key={operator.id}
                                                onClick={() => handleOperatorSelect(operator)}
                                                className="flex flex-col items-center justify-center p-8 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[32px] shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all hover:scale-105 active:scale-95 group"
                                            >
                                                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors mb-3">
                                                    {getRoleIcon(operator.role)}
                                                </div>
                                                <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 truncate w-full text-center">
                                                    {operator.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    {operators.length === 0 && (
                                        <div className="text-center text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                            Nenhum operador disponivel para acesso por PIN. Solicite ao administrador o cadastro de um operador.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="max-w-md mx-auto">
                                    <Card className="border-none shadow-2xl dark:bg-zinc-900 rounded-[32px] overflow-hidden animate-in zoom-in-95 duration-300">
                                        <div className="bg-slate-100/50 dark:bg-zinc-800/50 p-6 text-center relative border-b border-slate-200 dark:border-zinc-800">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute left-4 top-1/2 -translate-y-1/2 hover:bg-white dark:hover:bg-zinc-800 rounded-full"
                                                onClick={() => setSelectedOperator(null)}
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </Button>
                                            <div className="flex items-center justify-center gap-2 mx-auto">
                                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-primary shadow-sm border border-slate-200/50">
                                                    {getRoleIcon(selectedOperator.role)}
                                                </div>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-black text-lg leading-none">{selectedOperator.name}</span>
                                                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Operador</span>
                                                </div>
                                            </div>
                                        </div>

                                        <CardContent className="p-10">
                                            <div className="flex flex-col items-center mb-10">
                                                <label className="text-[11px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-6">Digite seu PIN de 4 dígitos</label>
                                                <div className="flex gap-4">
                                                    {[0, 1, 2, 3].map((index) => (
                                                        <div
                                                            key={index}
                                                            className={`w-4 h-4 rounded-full transition-all duration-300 ${pin.length > index
                                                                ? 'bg-primary scale-150 shadow-lg shadow-primary/40'
                                                                : 'bg-slate-200 dark:bg-zinc-800'
                                                                } ${loginError && pin.length === 0 ? 'bg-rose-500 animate-bounce' : ''}`}
                                                        />
                                                    ))}
                                                </div>
                                                {loginError && (
                                                    <p className="text-rose-600 dark:text-rose-400 text-xs font-black mt-6 uppercase tracking-[0.2em]">{loginError}</p>
                                                )}
                                            </div>

                                            <Numpad
                                                onKeyPress={handlePinKeyPress}
                                                onBackspace={handleBackspace}
                                                maxLength={4}
                                                currentLength={pin.length}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="absolute bottom-8 left-0 right-0 py-4 z-0">
                <div className="max-w-md mx-auto flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6 px-4 py-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-full border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Wifi className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Servidor Online</span>
                        </div>
                        <div className="w-px h-3 bg-slate-300 dark:bg-zinc-700" />
                        <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-amber-500" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">PDV Offline-Ready</span>
                        </div>
                    </div>
                    <p className="text-slate-400 dark:text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Caos Domado PDV v1.0.0</p>
                </div>
            </footer>
        </div>
    )
}
