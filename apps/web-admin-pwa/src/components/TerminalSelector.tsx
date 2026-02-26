import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@pos/ui'
import { Monitor, Store } from 'lucide-react'
import { useTerminalsStore } from '../store/terminals'
import { useBranchesStore } from '../store/branches'
import { useNavigate } from 'react-router-dom'

export function TerminalSelector() {
    const { terminals, currentTerminalId, setCurrentTerminal } = useTerminalsStore()
    const { branches } = useBranchesStore()
    const navigate = useNavigate()

    const [selectedTerminalId, setSelectedTerminalId] = useState<string>('')

    const handleConfirm = () => {
        if (selectedTerminalId) {
            setCurrentTerminal(selectedTerminalId)
        }
    }

    if (currentTerminalId) return null

    // If there are no terminals, guide the user to create one
    if (terminals.length === 0) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                            <Monitor className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">Nenhum Terminal Configurado</CardTitle>
                        <CardDescription>
                            Para realizar vendas e abrir o caixa, você precisa ter pelo menos um terminal cadastrado e atrelado a uma filial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pt-4">
                        <Button
                            className="w-full h-12 text-base font-medium"
                            onClick={() => navigate('/dashboard/settings')}
                        >
                            Ir para Configurações
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 text-base font-medium"
                            onClick={() => navigate('/dashboard')}
                        >
                            Voltar ao Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Active terminals
    const activeTerminals = terminals.filter(t => t.isActive)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <Monitor className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">Selecione o Terminal</CardTitle>
                    <CardDescription>
                        Identifique em qual computador / caixa você está operando agora.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                            <SelectTrigger className="h-12 w-full text-base">
                                <SelectValue placeholder="Escolha um terminal ativo" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeTerminals.map(terminal => {
                                    const branch = branches.find(b => b.id === terminal.branchId)
                                    return (
                                        <SelectItem key={terminal.id} value={terminal.id} className="cursor-pointer py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">{terminal.name}</span>
                                                <span className="text-xs text-slate-500 flex items-center mt-0.5">
                                                    <Store className="h-3 w-3 mr-1" />
                                                    {branch?.name || 'Filial Desconhecida'}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="ghost"
                            className="w-full h-12"
                            onClick={() => navigate('/dashboard')}
                        >
                            Voltar
                        </Button>
                        <Button
                            className="w-full h-12 text-base"
                            disabled={!selectedTerminalId}
                            onClick={handleConfirm}
                        >
                            Confirmar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
