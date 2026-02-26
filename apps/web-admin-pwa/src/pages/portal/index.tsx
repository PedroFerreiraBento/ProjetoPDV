import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pos/ui'
import { LayoutDashboard, Monitor, Store, ArrowRight, LogOut } from 'lucide-react'
import { useOperatorsStore } from '../../store/operators'
import { useTerminalsStore } from '../../store/terminals'
import { useBranchesStore } from '../../store/branches'

export function PortalPage() {
    const navigate = useNavigate()
    const { currentOperator, logoutOperator, authMethod } = useOperatorsStore()
    const { terminals, setCurrentTerminal, linkTerminal, linkedTerminalId } = useTerminalsStore()
    const { branches } = useBranchesStore()

    const [isSelectingTerminal, setIsSelectingTerminal] = useState(false)
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>('')
    const [shouldLinkDevice, setShouldLinkDevice] = useState(false)

    const handleAdminClick = () => {
        navigate('/dashboard')
    }

    const handlePosClick = () => {
        setIsSelectingTerminal(true)
    }

    const handleTerminalConfirm = () => {
        if (selectedTerminalId) {
            setCurrentTerminal(selectedTerminalId)
            if (shouldLinkDevice) {
                linkTerminal(selectedTerminalId)
            }
            navigate('/pos')
        }
    }

    const handleLogout = () => {
        logoutOperator()
        navigate('/login')
    }

    const activeTerminals = terminals.filter(t => t.isActive)
    const adminAvailableTerminals = terminals
    const linkedActiveTerminal = activeTerminals.find(t => t.id === linkedTerminalId)
    const linkedDeviceTerminal = terminals.find(t => t.id === linkedTerminalId)
    const isAdmin = currentOperator?.role === 'ADMIN' && authMethod === 'PASSWORD'
    const canAccessPos = isAdmin || !!linkedDeviceTerminal

    useEffect(() => {
        const terminalsForSelection = isAdmin ? adminAvailableTerminals : activeTerminals
        const hasSelectedAvailableTerminal = terminalsForSelection.some(t => t.id === selectedTerminalId)

        if (isAdmin) {
            if (hasSelectedAvailableTerminal) {
                return
            }

            if (linkedDeviceTerminal) {
                setSelectedTerminalId(linkedDeviceTerminal.id)
                return
            }

            if (adminAvailableTerminals.length > 0) {
                setSelectedTerminalId(adminAvailableTerminals[0].id)
                return
            }

            setSelectedTerminalId('')
            return
        }

        if (linkedActiveTerminal) {
            setSelectedTerminalId(linkedActiveTerminal.id)
            return
        }

        if (activeTerminals.length === 1) {
            setSelectedTerminalId(activeTerminals[0].id)
            return
        }

        if (!hasSelectedAvailableTerminal) {
            setSelectedTerminalId('')
        }
    }, [activeTerminals, adminAvailableTerminals, isAdmin, linkedActiveTerminal, linkedDeviceTerminal, selectedTerminalId])

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            {/* Header / Logout */}
            <div className="absolute top-6 right-6 flex items-center gap-4">
                <div className="flex flex-col items-end mr-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">{currentOperator?.name}</span>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-widest leading-none">{currentOperator?.role}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-rose-50 hover:text-rose-600">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>

            <div className="w-full max-w-4xl text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 border border-slate-200 dark:border-zinc-800">
                    <img src="/logo.png" alt="Caos Domado" className="h-10 w-10 object-contain" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                    Portal Caos Domado
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 text-lg">
                    Escolha como deseja operar o sistema hoje
                </p>
            </div>

            {!isSelectingTerminal ? (
                <div className={`grid ${isAdmin && canAccessPos ? 'md:grid-cols-2' : 'max-w-xl mx-auto'} gap-8 w-full max-w-4xl animate-in zoom-in-95 duration-500`}>
                    {/* Admin Card */}
                    {isAdmin && (
                        <button
                            onClick={handleAdminClick}
                            className="group relative flex flex-col items-start p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-left overflow-hidden ring-offset-4 ring-offset-slate-50 dark:ring-offset-zinc-950 focus:ring-2 focus:ring-primary"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="h-7 w-7" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Painel de Gestão</h2>
                            <p className="text-slate-500 dark:text-zinc-400 leading-relaxed mb-8">
                                Acesse relatórios, controle estoque, gerencie produtos e acompanhe o desempenho global da sua loja.
                            </p>
                            <div className="flex items-center text-primary font-bold text-sm uppercase tracking-widest mt-auto">
                                Entrar no Admin <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        </button>
                    )}

                    {/* PDV Card */}
                    {canAccessPos && (
                        <button
                            onClick={handlePosClick}
                            className="group relative flex flex-col items-start p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-left overflow-hidden ring-offset-4 ring-offset-slate-50 dark:ring-offset-zinc-950 focus:ring-2 focus:ring-primary"
                        >
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Monitor className="h-7 w-7" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Ponto de Venda (PDV)</h2>
                            <p className="text-slate-500 dark:text-zinc-400 leading-relaxed mb-8">
                                Frente de caixa ágil, realize vendas, controle turnos e emita comprovantes para seus clientes.
                            </p>
                            <div className="flex items-center text-primary font-bold text-sm uppercase tracking-widest mt-auto">
                                Iniciar Terminal <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        </button>
                    )}

                    {!isAdmin && !canAccessPos && (
                        <div className="w-full p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl text-left shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Terminal nao configurado neste dispositivo</h2>
                            <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                                Solicite que um administrador acesse com e-mail e senha para cadastrar este dispositivo como terminal.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
                    <Card className="border-none shadow-2xl dark:bg-zinc-900 overflow-hidden">
                        <div className="p-8 text-center bg-slate-100/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                                onClick={() => setIsSelectingTerminal(false)}
                            >
                                <ArrowRight className="h-5 w-5 rotate-180" />
                            </Button>
                            <div className="h-12 w-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Monitor className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-bold text-xl">Configurar Terminal</h3>
                            <p className="text-sm text-slate-500">Selecione onde você está operando</p>
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal Ativo</label>
                                {isAdmin ? (
                                    adminAvailableTerminals.length > 0 ? (
                                        <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                                            <SelectTrigger className="h-14 w-full text-base bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-emerald-500">
                                                <SelectValue placeholder="Escolha um terminal" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800">
                                                {adminAvailableTerminals.map(terminal => {
                                                    const branch = branches.find(b => b.id === terminal.branchId)
                                                    return (
                                                        <SelectItem key={terminal.id} value={terminal.id} className="cursor-pointer py-3 rounded-lg focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-slate-100">{terminal.name}</span>
                                                                <span className="text-xs text-slate-500 flex items-center mt-1">
                                                                    <Store className="h-3 w-3 mr-1" />
                                                                    {branch?.name || 'Filial Desconhecida'}
                                                                </span>
                                                                {!terminal.isActive && (
                                                                    <span className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mt-1">
                                                                        Inativo
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                            Nenhum terminal cadastrado. Cadastre um terminal no painel de configuracoes.
                                        </div>
                                    )
                                ) : linkedActiveTerminal ? (
                                    <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                        Este dispositivo ja esta configurado como terminal: <span className="font-bold">{linkedActiveTerminal.name}</span>.
                                    </div>
                                ) : activeTerminals.length > 1 ? (
                                    <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                                        <SelectTrigger className="h-14 w-full text-base bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-emerald-500">
                                            <SelectValue placeholder="Escolha um terminal" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200 dark:border-zinc-800">
                                            {activeTerminals.map(terminal => {
                                                const branch = branches.find(b => b.id === terminal.branchId)
                                                return (
                                                    <SelectItem key={terminal.id} value={terminal.id} className="cursor-pointer py-3 rounded-lg focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-slate-100">{terminal.name}</span>
                                                            <span className="text-xs text-slate-500 flex items-center mt-1">
                                                                <Store className="h-3 w-3 mr-1" />
                                                                {branch?.name || 'Filial Desconhecida'}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                ) : activeTerminals.length === 1 ? (
                                    <div className="text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-zinc-800 p-3 rounded-lg border border-slate-200 dark:border-zinc-700">
                                        Voce vai entrar no terminal: <span className="font-bold">{activeTerminals[0].name}</span>.
                                    </div>
                                ) : (
                                    <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                        Nenhum terminal ativo disponivel. Solicite que o administrador cadastre o dispositivo como terminal.
                                    </div>
                                )}
                            </div>

                            {isAdmin && adminAvailableTerminals.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 px-1 py-1 group cursor-pointer" onClick={() => setShouldLinkDevice(!shouldLinkDevice)}>
                                        <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${shouldLinkDevice ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${shouldLinkDevice ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Vincular este dispositivo</span>
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Ativar login facilitado neste navegador</span>
                                        </div>
                                    </div>
                                    {linkedTerminalId && (
                                        <div className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 p-3 rounded-lg border border-slate-200 dark:border-zinc-700">
                                            Este navegador ja esta vinculado a um terminal. Ative a opcao acima para atualizar o vinculo para o terminal selecionado.
                                        </div>
                                    )}
                                </div>
                            ) : linkedTerminalId ? (
                                <div className="text-xs text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 p-3 rounded-lg border border-slate-200 dark:border-zinc-700">
                                    Este navegador ja esta vinculado a um terminal configurado.
                                </div>
                            ) : activeTerminals.length > 0 ? (
                                <div className="flex items-center gap-3 px-1 py-1 group cursor-pointer" onClick={() => setShouldLinkDevice(!shouldLinkDevice)}>
                                    <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${shouldLinkDevice ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-800'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${shouldLinkDevice ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Vincular este dispositivo</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Ativar login facilitado neste navegador</span>
                                    </div>
                                </div>
                            ) : null}

                            <Button
                                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-[0.98]"
                                disabled={!selectedTerminalId}
                                onClick={handleTerminalConfirm}
                            >
                                Confirmar e Abrir PDV
                            </Button>

                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Background Decorative Elements */}
            <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </div>
    )
}
