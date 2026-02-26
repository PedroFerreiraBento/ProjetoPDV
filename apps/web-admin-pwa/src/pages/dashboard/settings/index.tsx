import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pos/ui'
import { Store, Monitor, Settings2 } from 'lucide-react'
import { GeneralSettings } from './GeneralSettings'
import { BranchesSettings } from './BranchesSettings'
import { TerminalsSettings } from './TerminalsSettings'

export function SettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
                    <p className="text-muted-foreground">
                        Gerencie as preferências e regras de negócio do seu PDV.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Geral
                    </TabsTrigger>
                    <TabsTrigger value="branches" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Filiais
                    </TabsTrigger>
                    <TabsTrigger value="terminals" className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Terminais
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                    <GeneralSettings />
                </TabsContent>
                <TabsContent value="branches" className="space-y-4">
                    <BranchesSettings />
                </TabsContent>
                <TabsContent value="terminals" className="space-y-4">
                    <TerminalsSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
