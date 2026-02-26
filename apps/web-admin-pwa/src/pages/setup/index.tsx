import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupStore } from '../../store/setup'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@pos/ui'
import { Moon, Sun, Store, MapPin, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react'
import { formatCNPJ, formatPhone, formatCEP } from '@pos/shared'

export function SetupWizard() {
    const { step, setStep, theme, setTheme, storeName, cnpj, phone, updateStoreData, address, updateAddress } = useSetupStore()
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const [cepError, setCepError] = useState('')
    const numberInputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    const nextStep = () => setStep(step + 1)
    const prevStep = () => setStep(step - 1)

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCep = formatCEP(e.target.value)
        updateAddress({ cep: formattedCep })

        const cleanCep = formattedCep.replace(/\D/g, '')
        if (cleanCep.length === 8) {
            setIsLoadingCep(true)
            setCepError('')
            try {
                const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`)
                if (!res.ok) throw new Error('CEP não encontrado')
                const data = await res.json()

                updateAddress({
                    street: data.street || '',
                    neighborhood: data.neighborhood || '',
                    city: data.city || '',
                    state: data.state || '',
                })

                // Focus the number input after a short delay to ensure React renders the new state
                setTimeout(() => numberInputRef.current?.focus(), 100)
            } catch (error) {
                setCepError('CEP não encontrado ou inválido.')
                updateAddress({ street: '', neighborhood: '', city: '', state: '' })
            } finally {
                setIsLoadingCep(false)
            }
        } else {
            setCepError('')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-8 flex justify-between items-center">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((s) => (
                            <div
                                key={s}
                                className={`h-2 w-16 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-800'
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="text-sm text-muted-foreground">Etapa {step} de 4</div>
                </div>

                <Card className="border-none shadow-xl dark:bg-zinc-900">
                    {step === 1 && (
                        <>
                            <CardHeader>
                                <CardTitle className="text-3xl">Bem-vindo ao PDV</CardTitle>
                                <CardDescription>Vamos personalizar sua experiência.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${theme === 'light'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                        onClick={() => setTheme('light')}
                                    >
                                        <Sun className="h-8 w-8 text-orange-500" />
                                        <span className="font-medium">Modo Claro</span>
                                    </div>
                                    <div
                                        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${theme === 'dark'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                        onClick={() => setTheme('dark')}
                                    >
                                        <Moon className="h-8 w-8 text-blue-400" />
                                        <span className="font-medium">Modo Escuro</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                    <Button onClick={nextStep} size="lg">
                                    Começar <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Store className="h-6 w-6" />
                                </div>
                                <CardTitle>Dados da Loja</CardTitle>
                                <CardDescription>Informe os dados do seu negócio.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome da Loja</Label>
                                    <Input
                                        value={storeName}
                                        onChange={(e) => updateStoreData({ storeName: e.target.value })}
                                        placeholder="Minha Loja"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>CNPJ / Tax ID</Label>
                                        <Input
                                            value={cnpj}
                                            onChange={(e) => updateStoreData({ cnpj: formatCNPJ(e.target.value) })}
                                            placeholder="00.000.000/0000-00"
                                            maxLength={18}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Telefone</Label>
                                        <Input
                                            value={phone}
                                            onChange={(e) => updateStoreData({ phone: formatPhone(e.target.value) })}
                                            placeholder="(00) 00000-0000"
                                            maxLength={15}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                                <Button onClick={nextStep}>Próximo <ChevronRight className="ml-2 h-4 w-4" /></Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <CardTitle>Endereço</CardTitle>
                                <CardDescription>Onde sua loja está localizada?</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 relative">
                                    <Label className={cepError ? "text-destructive" : ""}>CEP</Label>
                                    <div className="relative">
                                        <Input
                                            value={address.cep}
                                            onChange={handleCepChange}
                                            placeholder="00000-000"
                                            maxLength={9}
                                            className={cepError ? "border-destructive focus-visible:ring-destructive" : ""}
                                        />
                                        {isLoadingCep && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    {cepError && <p className="text-xs text-destructive font-medium">{cepError}</p>}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label>Rua</Label>
                                        <Input
                                            value={address.street}
                                            onChange={(e) => updateAddress({ street: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Número</Label>
                                        <Input
                                            ref={numberInputRef}
                                            value={address.number}
                                            onChange={(e) => updateAddress({ number: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Bairro</Label>
                                    <Input
                                        value={address.neighborhood}
                                        onChange={(e) => updateAddress({ neighborhood: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Cidade</Label>
                                        <Input
                                            value={address.city}
                                            onChange={(e) => updateAddress({ city: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estado</Label>
                                        <Input
                                            value={address.state}
                                            onChange={(e) => updateAddress({ state: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                                <Button onClick={nextStep}>Próximo <ChevronRight className="ml-2 h-4 w-4" /></Button>
                            </CardFooter>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-green-500 mb-2">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <CardTitle>Tudo pronto!</CardTitle>
                                <CardDescription>Revise os dados antes de finalizar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nome da Loja</span>
                                        <span className="font-medium">{storeName || 'Não informado'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">CNPJ</span>
                                        <span className="font-medium">{cnpj || 'Não informado'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tema</span>
                                        <span className="font-medium capitalize">{theme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Localização</span>
                                        <span className="font-medium">{address.city || 'Não informada'}, {address.state || 'UF'}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <Button variant="ghost" onClick={prevStep}>Voltar</Button>
                                <Button size="lg" className="w-full ml-4" onClick={() => navigate('/dashboard/users')}>Ir para o Painel</Button>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
