import { Card, CardHeader, CardTitle, CardContent, Label, Switch, Input } from '@pos/ui'
import { useSettingsStore } from '../../../store/settings'

export function GeneralSettings() {
    const {
        allowNegativeStock, blockOutOfStockSales, allowCreditSales,
        enableScaleBarcodes, scaleBarcodePrefix, scaleItemCodeLength, scaleValueType,
        updateSettings
    } = useSettingsStore()

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
                <CardHeader>
                    <CardTitle className="text-xl">Regras de Venda e Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="blockOutOfStockSales" className="text-base font-semibold">
                                Bloquear venda sem estoque
                            </Label>
                            <span className="text-sm text-slate-500">
                                Impede que o operador adicione um produto ao carrinho se a quantidade solicitada for maior que o estoque atual.
                            </span>
                        </div>
                        <Switch
                            id="blockOutOfStockSales"
                            checked={blockOutOfStockSales}
                            onCheckedChange={(c) => updateSettings({ blockOutOfStockSales: !!c })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 border-t pt-4 border-slate-100 dark:border-zinc-800">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="allowNegativeStock" className="text-base font-semibold">
                                Permitir estoque negativo
                            </Label>
                            <span className="text-sm text-slate-500">
                                Mesmo com o bloqueio ativado, permite que vendas sejam concluídas deixando o estoque negativo. (Útil para lojas que não tem controle rígido em tempo real).
                            </span>
                        </div>
                        <Switch
                            id="allowNegativeStock"
                            checked={allowNegativeStock}
                            onCheckedChange={(c) => updateSettings({ allowNegativeStock: !!c })}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border-t pt-4 border-slate-100 dark:border-zinc-800">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="allowCreditSales" className="text-base font-semibold">
                                Permitir vendas fiado (Crediário)
                            </Label>
                            <span className="text-sm text-slate-500">
                                Adiciona a opção de finalizar vendas "Fiado" na tela de pagamento do PDV. Opcional, exige cliente cadastrado.
                            </span>
                        </div>
                        <Switch
                            id="allowCreditSales"
                            checked={allowCreditSales}
                            onCheckedChange={(c) => updateSettings({ allowCreditSales: !!c })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-xl">Integração com Balança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="enableScaleBarcodes" className="text-base font-semibold">
                                Ativar Leitura de Balança
                            </Label>
                            <span className="text-sm text-slate-500">
                                Permite que o sistema interprete códigos de barras de balanças (Toledo, Filizola, etc).
                            </span>
                        </div>
                        <Switch
                            id="enableScaleBarcodes"
                            checked={enableScaleBarcodes}
                            onCheckedChange={(c) => updateSettings({ enableScaleBarcodes: !!c })}
                        />
                    </div>

                    {enableScaleBarcodes && (
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
                            <div className="space-y-2">
                                <Label>Prefixo do Código (Dígito Inicial)</Label>
                                <Input
                                    value={scaleBarcodePrefix}
                                    onChange={e => updateSettings({ scaleBarcodePrefix: e.target.value })}
                                    placeholder="Ex: 2"
                                    maxLength={2}
                                />
                                <p className="text-xs text-slate-500">Normalmente '2' ou '20' conforme configuração da balança.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Tamanho do Código do Produto</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus:ring-zinc-300"
                                    value={scaleItemCodeLength.toString()}
                                    onChange={e => updateSettings({ scaleItemCodeLength: parseInt(e.target.value) as 4 | 5 })}
                                >
                                    <option value="4">4 dígitos</option>
                                    <option value="5">5 dígitos</option>
                                </select>
                                <p className="text-xs text-slate-500">Quantos dígitos identificam o produto no código (Logo após o prefixo).</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor contido no Código</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus:ring-zinc-300"
                                    value={scaleValueType}
                                    onChange={e => updateSettings({ scaleValueType: e.target.value as 'PRICE' | 'WEIGHT' })}
                                >
                                    <option value="PRICE">Preço Total a Pagar</option>
                                    <option value="WEIGHT">Peso Total (Quantidade)</option>
                                </select>
                                <p className="text-xs text-slate-500">A balança imprime o "Total a Pagar" ou o "Total Pesado" nestes últimos 6 dígitos?</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
