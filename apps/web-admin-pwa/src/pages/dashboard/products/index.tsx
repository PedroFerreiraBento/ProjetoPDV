import { useState } from 'react'
import {
    Button,
    Input,
    Label,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@pos/ui'
import { Plus, Search, Edit2, Trash2, X, Star, Settings2, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react'
import { useProductsStore } from '../../../store/products'
import { useCategoriesStore } from '../../../store/categories'
import { useUnitsStore } from '../../../store/units'
import Papa from 'papaparse'
import { Product, ProductOption, ProductVariant, BundleItem, ProductBatch } from '@pos/shared'
import { formatCurrency } from '../../../lib/utils'

type FormVariant = Omit<ProductVariant, 'price' | 'cost' | 'wholesalePrice' | 'wholesaleQuantity' | 'barcode' | 'stock' | 'minStock'> & {
    price: string,
    cost: string,
    wholesalePrice: string,
    wholesaleQuantity: string,
    stock: string,
    minStock: string,
    barcode: string
};

interface CsvProductRow {
    Name: string;
    SKU: string;
    Price: string;
    Cost?: string;
    WholesalePrice?: string;
    WholesaleQuantity?: string;
    Stock?: string;
    MinStock?: string;
    Barcode: string;
}

const generateVariants = (options: ProductOption[], existingVariants: FormVariant[]): FormVariant[] => {
    const validOptions = options.filter(o => o.values.some(v => v.trim() !== ''));
    if (validOptions.length === 0) return [];

    const result: FormVariant[] = [];

    const helper = (currentCombo: Record<string, string>, optionIndex: number) => {
        if (optionIndex === validOptions.length) {
            const existing = existingVariants.find(v => {
                return Object.entries(currentCombo).every(([key, value]) => v.options[key] === value) && Object.keys(v.options).length === Object.keys(currentCombo).length;
            });

            if (existing) {
                result.push(existing);
            } else {
                result.push({
                    id: crypto.randomUUID(),
                    sku: '',
                    price: '',
                    cost: '',
                    wholesalePrice: '',
                    wholesaleQuantity: '',
                    stock: '0',
                    minStock: '0',
                    barcode: '',
                    options: { ...currentCombo }
                });
            }
            return;
        }
        const currentOption = validOptions[optionIndex];
        const validValues = currentOption.values.filter(v => v.trim() !== '');

        if (validValues.length === 0) {
            helper(currentCombo, optionIndex + 1);
            return;
        }

        for (const value of validValues) {
            currentCombo[currentOption.name] = value.trim();
            helper(currentCombo, optionIndex + 1);
            delete currentCombo[currentOption.name];
        }
    };

    helper({}, 0);
    return result;
}

export function ProductsPage() {
    const { products, addProduct, updateProduct, bulkUpdateProducts, deleteProduct, addProducts } = useProductsStore()
    const { categories } = useCategoriesStore()
    const { units } = useUnitsStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isBulkAdjustmentOpen, setIsBulkAdjustmentOpen] = useState(false)
    const [bulkConfig, setBulkConfig] = useState({
        targetCategoryId: 'all',
        adjustmentPercent: '0',
        field: 'both' as 'retail' | 'wholesale' | 'both',
    })
    const [importData, setImportData] = useState<CsvProductRow[]>([])
    const [importError, setImportError] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        cost: '',
        wholesalePrice: '',
        wholesaleQuantity: '',
        stock: '',
        minStock: '',
        barcode: '',
        categoryId: 'none',
        unitId: 'none',
        hasVariations: false,
        options: [] as ProductOption[],
        variants: [] as FormVariant[],
        promotionType: 'NONE' as 'NONE' | 'BUY_X_PAY_Y' | 'WHOLESALE',
        promotionX: '',
        promotionY: '',
        isBundle: false,
        bundleItems: [] as BundleItem[],
        trackBatches: false,
        batches: [] as ProductBatch[],
    })

    const filteredProducts = products.filter(
        (product) => {
            const searchLower = searchQuery.toLowerCase();
            const matchesBasic = product.name.toLowerCase().includes(searchLower) ||
                (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
                (product.barcode && product.barcode.toLowerCase().includes(searchLower));

            if (matchesBasic) return true;

            if (product.variants && product.variants.length > 0) {
                return product.variants.some(v =>
                    (v.sku && v.sku.toLowerCase().includes(searchLower)) ||
                    (v.barcode && v.barcode.toLowerCase().includes(searchLower))
                );
            }

            return false;
        }
    )

    const handleOpenAdd = () => {
        setEditingProduct(null)
        setFormData({
            name: '',
            sku: '',
            price: '',
            cost: '',
            wholesalePrice: '',
            wholesaleQuantity: '',
            stock: '',
            minStock: '',
            barcode: '',
            categoryId: 'none',
            unitId: 'none',
            hasVariations: false,
            options: [],
            variants: [],
            promotionType: 'NONE' as 'NONE' | 'BUY_X_PAY_Y' | 'WHOLESALE',
            promotionX: '',
            promotionY: '',
            isBundle: false,
            bundleItems: [] as BundleItem[],
            trackBatches: false,
            batches: [],
        })
        setIsDialogOpen(true)
    }

    const handleOpenImport = () => {
        setImportData([])
        setImportError(null)
        setIsImportDialogOpen(true)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse<CsvProductRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setImportError('Erro ao ler CSV. Verifique se o formato está correto.')
                    return
                }
                setImportData(results.data)
                setImportError(null)
            },
            error: (error) => {
                setImportError(`Erro interno: ${error.message}`)
            }
        })
    }

    const handleImportSubmit = () => {
        if (importData.length === 0) return

        const productsToAdd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = []

        for (const row of importData) {
            if (!row.Name || !row.Price) {
                setImportError('Erro: Nome e Preço (Price) são obrigatórios para todos os produtos.')
                return
            }

            // Convert string price (e.g. "10,50" or "10.50") to cents
            const numericPrice = Math.round(parseFloat(row.Price.replace(',', '.')) * 100)

            if (isNaN(numericPrice) || numericPrice < 0) {
                setImportError(`Erro: Preço inválido no produto "${row.Name}".`)
                return
            }

            productsToAdd.push({
                name: row.Name,
                sku: row.SKU || '',
                price: numericPrice,
                cost: row.Cost ? Math.round(parseFloat(row.Cost.replace(',', '.')) * 100) : undefined,
                wholesalePrice: row.WholesalePrice ? Math.round(parseFloat(row.WholesalePrice.replace(',', '.')) * 100) : undefined,
                wholesaleQuantity: row.WholesaleQuantity ? parseInt(row.WholesaleQuantity) : undefined,
                stock: row.Stock ? parseFloat(row.Stock.replace(',', '.')) : undefined,
                minStock: row.MinStock ? parseFloat(row.MinStock.replace(',', '.')) : undefined,
                barcode: row.Barcode || '',
            })
        }

        addProducts(productsToAdd)
        setIsImportDialogOpen(false)
    }

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product)
        const hasVars = product.variants && product.variants.length > 0;
        setFormData({
            name: product.name,
            sku: product.sku || '',
            price: product.price !== undefined ? (product.price / 100).toFixed(2) : '',
            cost: product.cost !== undefined ? (product.cost / 100).toFixed(2) : '',
            wholesalePrice: product.wholesalePrice !== undefined ? (product.wholesalePrice / 100).toFixed(2) : '',
            wholesaleQuantity: product.wholesaleQuantity !== undefined ? product.wholesaleQuantity.toString() : '',
            stock: product.stock !== undefined ? product.stock.toString() : '',
            minStock: product.minStock !== undefined ? product.minStock.toString() : '',
            barcode: product.barcode || '',
            categoryId: product.categoryId || 'none',
            unitId: product.unitId || 'none',
            hasVariations: hasVars ? true : false,
            options: product.options ? JSON.parse(JSON.stringify(product.options)) : [],
            variants: product.variants ? product.variants.map(v => ({
                ...v,
                price: (v.price / 100).toFixed(2),
                cost: v.cost !== undefined ? (v.cost / 100).toFixed(2) : '',
                wholesalePrice: v.wholesalePrice !== undefined ? (v.wholesalePrice / 100).toFixed(2) : '',
                wholesaleQuantity: v.wholesaleQuantity !== undefined ? v.wholesaleQuantity.toString() : '',
                stock: v.stock !== undefined ? v.stock.toString() : '0',
                minStock: v.minStock !== undefined ? v.minStock.toString() : '0',
                barcode: v.barcode || ''
            })) : [],
            promotionType: product.promotionType || 'NONE',
            promotionX: product.promotionX?.toString() || '',
            promotionY: product.promotionY?.toString() || '',
            isBundle: product.isBundle || false,
            bundleItems: product.bundleItems || [],
            trackBatches: product.trackBatches || false,
            batches: product.batches ? JSON.parse(JSON.stringify(product.batches)) : [],
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja excluir ${name}?`)) {
            deleteProduct(id)
        }
    }

    const handleToggleFavorite = (id: string, currentStatus: boolean | undefined) => {
        updateProduct(id, { isFavorite: !currentStatus })
    }

    const calculateMargin = (priceStr: string, costStr: string) => {
        const p = parseFloat(priceStr.replace(',', '.'));
        const c = parseFloat(costStr.replace(',', '.'));
        if (isNaN(p) || isNaN(c) || p <= 0) return null;
        return ((p - c) / p) * 100;
    }

    const calculateMarkup = (priceStr: string, costStr: string) => {
        const p = parseFloat(priceStr.replace(',', '.'));
        const c = parseFloat(costStr.replace(',', '.'));
        if (isNaN(p) || isNaN(c) || c <= 0) return null;
        return ((p - c) / c) * 100;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const numericPrice = formData.hasVariations ? undefined : Math.round(parseFloat(formData.price.replace(',', '.')) * 100)
        const numericCost = formData.hasVariations ? undefined : (formData.cost.trim() !== '' ? Math.round(parseFloat(formData.cost.replace(',', '.')) * 100) : undefined)
        const numericWholesalePrice = formData.hasVariations ? undefined : (formData.wholesalePrice.trim() !== '' ? Math.round(parseFloat(formData.wholesalePrice.replace(',', '.')) * 100) : undefined)
        const numericWholesaleQuantity = formData.hasVariations ? undefined : (formData.wholesaleQuantity.trim() !== '' ? parseInt(formData.wholesaleQuantity) : undefined)
        const numericStock = formData.hasVariations ? undefined : (formData.stock.trim() !== '' ? parseFloat(formData.stock.replace(',', '.')) : undefined)
        const numericMinStock = formData.hasVariations ? undefined : (formData.minStock.trim() !== '' ? parseFloat(formData.minStock.replace(',', '.')) : undefined)

        if (!formData.hasVariations && (numericPrice === undefined || isNaN(numericPrice) || numericPrice < 0)) {
            alert('Informe um preço válido.')
            return
        }

        let formattedVariants: ProductVariant[] | undefined = undefined;
        let formattedOptions: ProductOption[] | undefined = undefined;

        if (formData.hasVariations) {
            if (formData.variants.length === 0) {
                alert('Configure ao menos uma combinação de variante.');
                return;
            }
            const invalidVariant = formData.variants.find(v => {
                const numeric = Math.round(parseFloat(v.price.replace(',', '.')) * 100);
                return isNaN(numeric) || numeric < 0 || v.sku.trim() === '';
            });
            if (invalidVariant) {
                alert('Garanta que todas as variantes tenham SKU e preço válidos.');
                return;
            }

            formattedVariants = formData.variants.map(v => ({
                ...v,
                price: Math.round(parseFloat(v.price.replace(',', '.')) * 100),
                cost: v.cost.trim() === '' ? undefined : Math.round(parseFloat(v.cost.replace(',', '.')) * 100),
                wholesalePrice: v.wholesalePrice.trim() === '' ? undefined : Math.round(parseFloat(v.wholesalePrice.replace(',', '.')) * 100),
                wholesaleQuantity: v.wholesaleQuantity.trim() === '' ? undefined : parseInt(v.wholesaleQuantity),
                stock: v.stock.trim() === '' ? undefined : parseFloat(v.stock.replace(',', '.')),
                minStock: v.minStock.trim() === '' ? undefined : parseFloat(v.minStock.replace(',', '.')),
                barcode: v.barcode.trim() === '' ? undefined : v.barcode.trim()
            }));
            formattedOptions = formData.options;
        }

        const payload = {
            name: formData.name,
            sku: formData.hasVariations ? undefined : formData.sku,
            price: formData.hasVariations ? undefined : numericPrice,
            cost: formData.hasVariations ? undefined : numericCost,
            wholesalePrice: formData.hasVariations ? undefined : numericWholesalePrice,
            wholesaleQuantity: formData.hasVariations ? undefined : numericWholesaleQuantity,
            stock: formData.hasVariations ? undefined : numericStock,
            minStock: formData.hasVariations ? undefined : numericMinStock,
            barcode: formData.barcode || undefined,
            categoryId: formData.categoryId !== 'none' ? formData.categoryId : undefined,
            unitId: formData.unitId !== 'none' ? formData.unitId : undefined,
            options: formattedOptions,
            variants: formattedVariants,
            promotionType: formData.promotionType,
            promotionX: formData.promotionType === 'BUY_X_PAY_Y' ? (formData.promotionX ? parseInt(formData.promotionX) : undefined) : undefined,
            promotionY: formData.promotionType === 'BUY_X_PAY_Y' ? (formData.promotionY ? parseInt(formData.promotionY) : undefined) : undefined,
            isBundle: formData.isBundle,
            bundleItems: formData.isBundle ? formData.bundleItems : undefined,
            trackBatches: formData.trackBatches,
            batches: formData.trackBatches ? formData.batches : undefined,
        };

        if (formData.trackBatches && !formData.hasVariations) {
            payload.stock = formData.batches.reduce((sum, b) => sum + (b.stock || 0), 0);
        }

        if (editingProduct) {
            updateProduct(editingProduct.id, payload)
        } else {
            addProduct(payload)
        }
        setIsDialogOpen(false)
    }

    const getCategoryDetails = (id?: string) => {
        if (!id) return null;
        return categories.find(c => c.id === id);
    }

    const getUnitDetails = (id?: string) => {
        if (!id) return null;
        return units.find(u => u.id === id);
    }

    const getProductPrice = (product: Product) => {
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.price);
            const minPrice = Math.min(...prices);
            return `A partir de ${formatCurrency(minPrice)}`;
        }
        return formatCurrency(product.price || 0);
    };

    const getProductSku = (product: Product) => {
        if (product.variants && product.variants.length > 0) {
            return `${product.variants.length} variações`;
        }
        return product.sku || '-';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Produtos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie o catálogo e os preços da sua loja.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsBulkAdjustmentOpen(true)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Ajuste em Lote
                    </Button>
                    <Button variant="outline" onClick={handleOpenImport}>Importar CSV</Button>
                    <Button onClick={handleOpenAdd} className="w-full sm:w-auto shadow-md">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Produto
                    </Button>
                </div>
            </div>

            {/* Ações/Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produtos..."
                        className="pl-9 bg-white dark:bg-zinc-900 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Nome</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">SKU</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Price</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Estoque</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhum produto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const category = getCategoryDetails(product.categoryId);
                                const unit = getUnitDetails(product.unitId);
                                return (
                                    <TableRow key={product.id} className="group">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {product.name}
                                                {category && (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-${category.color}-100 text-${category.color}-700 dark:bg-${category.color}-900/30 dark:text-${category.color}-400`}>
                                                        {category.name}
                                                    </span>
                                                )}
                                            </div>
                                            {product.barcode && (
                                                <span className="block text-xs text-muted-foreground mt-0.5">
                                                    {product.barcode}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 font-mono">
                                                {getProductSku(product)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="text-emerald-600 dark:text-emerald-400">
                                                {getProductPrice(product)}
                                                {unit && (!product.variants || product.variants.length === 0) && (
                                                    <span className="text-muted-foreground font-normal text-xs ml-1">
                                                        / {unit.abbreviation}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {product.promotionType === 'BUY_X_PAY_Y' && product.promotionX && product.promotionY && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                        LEVE {product.promotionX} PAGUE {product.promotionY}
                                                    </span>
                                                )}
                                                {(product.promotionType === 'WHOLESALE' || (product.wholesalePrice && product.wholesaleQuantity)) && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                        ATACADO {product.wholesaleQuantity ? `(min ${product.wholesaleQuantity})` : ''}
                                                    </span>
                                                )}
                                                {product.isBundle && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                        COMBO
                                                    </span>
                                                )}
                                            </div>
                                            {product.cost !== undefined && product.price !== undefined && (!product.variants || product.variants.length === 0) && (
                                                <div className="text-[10px] mt-0.5 flex items-center gap-1.5">
                                                    <span className="text-slate-400 font-normal uppercase tracking-tighter">Margin</span>
                                                    <span className={`font-bold ${((product.price - product.cost) / product.price) * 100 >= 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {(((product.price - product.cost) / product.price) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {product.variants && product.variants.length > 0 ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                                        {product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)} un
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">Total variants</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {product.stock !== undefined && product.minStock !== undefined && product.stock <= product.minStock && product.stock > 0 ? (
                                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            {product.stock} un
                                                        </div>
                                                    ) : product.stock === 0 ? (
                                                        <div className="flex items-center gap-1 text-rose-600 dark:text-rose-500 font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                                            0 un (Ruptura)
                                                        </div>
                                                    ) : (
                                                        <span className="font-bold text-slate-700 dark:text-zinc-300">
                                                            {product.stock ?? 0} un
                                                        </span>
                                                    )}

                                                    {product.minStock !== undefined && product.minStock > 0 && (
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            Min: {product.minStock}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`h-8 w-8 ${product.isFavorite ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                                                    onClick={() => handleToggleFavorite(product.id, product.isFavorite)}
                                                    title="Toggle POS Favorite"
                                                >
                                                    <Star className="h-4 w-4" fill={product.isFavorite ? "currentColor" : "none"} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                    onClick={() => handleOpenEdit(product)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Produto *</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Café Expresso"
                            />
                        </div>
                        {!formData.hasVariations && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                        placeholder="e.g. CAFE-01"
                                        className="uppercase font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price * (R$)</Label>
                                    <Input
                                        id="price"
                                        required
                                        type="text"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cost">Cost (R$)</Label>
                                    <Input
                                        id="cost"
                                        type="text"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wholesalePrice">Wholesale Price (R$)</Label>
                                    <Input
                                        id="wholesalePrice"
                                        type="text"
                                        value={formData.wholesalePrice}
                                        onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wholesaleQuantity">Qtd mín. atacado</Label>
                                    <Input
                                        id="wholesaleQuantity"
                                        type="number"
                                        value={formData.wholesaleQuantity}
                                        onChange={(e) => setFormData({ ...formData, wholesaleQuantity: e.target.value })}
                                        placeholder="Min. units"
                                    />
                                </div>
                                {!formData.trackBatches && (
                                    <div className="space-y-2">
                                        <Label htmlFor="stock">Estoque</Label>
                                        <Input
                                            id="stock"
                                            type="text"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="minStock">Alerta de estoque mín.</Label>
                                    <Input
                                        id="minStock"
                                        type="text"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}

                        {!formData.hasVariations && formData.price && formData.cost && (
                            <div className="flex gap-4 p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-100 dark:border-zinc-800 text-xs shadow-sm">
                                <div className="flex-1 space-y-1">
                                    <span className="text-muted-foreground font-medium uppercase tracking-wider block">Margin</span>
                                    <span className={`text-sm font-bold ${calculateMargin(formData.price, formData.cost)! >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {calculateMargin(formData.price, formData.cost)?.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-zinc-700" />
                                <div className="flex-1 space-y-1">
                                    <span className="text-muted-foreground font-medium uppercase tracking-wider block">Markup</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                                        {calculateMarkup(formData.price, formData.cost)?.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-zinc-700" />
                                <div className="flex-1 space-y-1">
                                    <span className="text-muted-foreground font-medium uppercase tracking-wider block">Profit</span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {formatCurrency(Math.round((parseFloat(formData.price.replace(',', '.')) - parseFloat(formData.cost.replace(',', '.'))) * 100))}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Selecione uma categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full bg-${cat.color}-500`} />
                                                    {cat.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select
                                    value={formData.unitId}
                                    onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                                >
                                    <SelectTrigger id="unit">
                                        <SelectValue placeholder="Selecione uma unidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {units.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.name} ({u.abbreviation})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Código de barras (Opcional)</Label>
                            <Input
                                id="barcode"
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                placeholder="Scan or type barcode..."
                            />
                        </div>

                        {!formData.hasVariations && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="trackBatches"
                                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-white dark:ring-offset-zinc-950 cursor-pointer"
                                        checked={formData.trackBatches}
                                        onChange={(e) => setFormData({ ...formData, trackBatches: e.target.checked })}
                                    />
                                    <Label htmlFor="trackBatches" className="cursor-pointer font-bold">
                                        Controlar Lotes e Validade
                                    </Label>
                                </div>

                                {formData.trackBatches && (
                                    <div className="space-y-4 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Lotes Disponíveis</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        batches: [...formData.batches, {
                                                            id: crypto.randomUUID(),
                                                            batchNumber: '',
                                                            expirationDate: '',
                                                            stock: 0,
                                                            branchId: 'default'
                                                        }]
                                                    })
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-1" /> Adicionar Lote
                                            </Button>
                                        </div>

                                        {formData.batches.length === 0 ? (
                                            <div className="text-center py-4 text-sm text-slate-500">
                                                Nenhum lote adicionado. O estoque total será 0.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {formData.batches.map((batch, index) => (
                                                    <div key={batch.id} className="flex gap-2 items-start bg-white dark:bg-zinc-950 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                                                        <div className="space-y-1 flex-[2]">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Nº Lote</Label>
                                                            <Input
                                                                value={batch.batchNumber}
                                                                onChange={(e) => {
                                                                    const newBatches = [...formData.batches];
                                                                    newBatches[index].batchNumber = e.target.value;
                                                                    setFormData({ ...formData, batches: newBatches });
                                                                }}
                                                                className="h-8 text-xs"
                                                                placeholder="ex: LT-2401"
                                                            />
                                                        </div>
                                                        <div className="space-y-1 flex-[2]">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Validade</Label>
                                                            <Input
                                                                type="date"
                                                                value={batch.expirationDate}
                                                                onChange={(e) => {
                                                                    const newBatches = [...formData.batches];
                                                                    newBatches[index].expirationDate = e.target.value;
                                                                    setFormData({ ...formData, batches: newBatches });
                                                                }}
                                                                className="h-8 text-xs"
                                                            />
                                                        </div>
                                                        <div className="space-y-1 flex-1">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Qtd</Label>
                                                            <Input
                                                                type="number"
                                                                value={batch.stock === 0 ? '' : batch.stock}
                                                                onChange={(e) => {
                                                                    const newBatches = [...formData.batches];
                                                                    newBatches[index].stock = parseInt(e.target.value) || 0;
                                                                    setFormData({ ...formData, batches: newBatches });
                                                                }}
                                                                className="h-8 text-xs"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="mt-5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 h-8 w-8 shrink-0"
                                                            onClick={() => {
                                                                const newBatches = formData.batches.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, batches: newBatches });
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-zinc-300 pt-2 border-t border-slate-200 dark:border-zinc-800">
                                            <span>Estoque Total Calculado:</span>
                                            <span>{formData.batches.reduce((sum, b) => sum + (b.stock || 0), 0)} un</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Variations Toggle & Builder */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800 mt-4">
                            <input
                                type="checkbox"
                                id="hasVariations"
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-white dark:ring-offset-zinc-950 cursor-pointer"
                                checked={formData.hasVariations}
                                onChange={(e) => setFormData({ ...formData, hasVariations: e.target.checked })}
                            />
                            <Label htmlFor="hasVariations" className="cursor-pointer font-normal">
                                This product has multiple options (e.g., sizes or colors)
                            </Label>
                        </div>

                        {/* Promotions & Bundles Section */}
                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800 mt-4">
                            <Label className="text-base font-semibold">Promotions & Bundles</Label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="promotionType">Promotion Type</Label>
                                    <Select
                                        value={formData.promotionType}
                                        onValueChange={(value: any) => setFormData({ ...formData, promotionType: value })}
                                    >
                                        <SelectTrigger id="promotionType">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">Nenhum</SelectItem>
                                            <SelectItem value="BUY_X_PAY_Y">Buy X, Pay for Y (Leve X, Pague Y)</SelectItem>
                                            <SelectItem value="WHOLESALE">Wholesale Price (Preço de Atacado)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.promotionType === 'BUY_X_PAY_Y' && (
                                    <div className="flex items-end gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20 col-span-2">
                                        <div className="space-y-2 flex-1">
                                            <Label>Leve (Qtd)</Label>
                                            <Input
                                                type="number"
                                                value={formData.promotionX}
                                                onChange={(e) => setFormData({ ...formData, promotionX: e.target.value })}
                                                placeholder="3"
                                                className="bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                        <div className="pb-2 text-muted-foreground font-medium">Pague</div>
                                        <div className="space-y-2 flex-1">
                                            <Label>Pague (Qtd)</Label>
                                            <Input
                                                type="number"
                                                value={formData.promotionY}
                                                onChange={(e) => setFormData({ ...formData, promotionY: e.target.value })}
                                                placeholder="2"
                                                className="bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.promotionType === 'WHOLESALE' && (
                                    <div className="flex items-end gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20 col-span-2">
                                        <div className="space-y-2 flex-1">
                                            <Label>Atacado a partir de (Qtd)</Label>
                                            <Input
                                                type="number"
                                                value={formData.wholesaleQuantity}
                                                onChange={(e) => setFormData({ ...formData, wholesaleQuantity: e.target.value })}
                                                placeholder="ex: 12"
                                                className="bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label>Preço Unitário no Atacado (R$)</Label>
                                            <Input
                                                type="text"
                                                value={formData.wholesalePrice}
                                                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                                                placeholder="0.00"
                                                className="bg-white dark:bg-zinc-900"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isBundle"
                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-white dark:ring-offset-zinc-950 cursor-pointer"
                                    checked={formData.isBundle}
                                    onChange={(e) => setFormData({ ...formData, isBundle: e.target.checked })}
                                />
                                <Label htmlFor="isBundle" className="cursor-pointer font-normal">
                                    Este produto é um Combo/Kit (Conjunto fixo de itens)
                                </Label>
                            </div>

                            {formData.isBundle && (
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold flex items-center gap-2">
                                            <Package className="w-4 h-4 text-slate-500" />
                                            Itens do Combo
                                        </h3>
                                        <div className="flex gap-2">
                                            <Select onValueChange={(val) => {
                                                const selectedProduct = products.find(p => p.id === val);
                                                if (selectedProduct && !formData.bundleItems.some(i => i.productId === val)) {
                                                    setFormData({
                                                        ...formData,
                                                        bundleItems: [...formData.bundleItems, { productId: val, quantity: 1 }]
                                                    });
                                                }
                                            }}>
                                                <SelectTrigger className="h-8 w-[200px] text-xs">
                                                    <SelectValue placeholder="Adicionar item..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products
                                                        .filter(p => p.id !== editingProduct?.id && !p.isBundle) // Prevent self-nesting and deep nesting for now
                                                        .map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {formData.bundleItems.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                                            <p className="text-xs text-muted-foreground">Nenhum item adicionado ao combo ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {formData.bundleItems.map((item, index) => {
                                                const product = products.find(p => p.id === item.productId);
                                                return (
                                                    <div key={item.productId} className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium">{product?.name || 'Produto não encontrado'}</p>
                                                                <p className="text-[10px] text-muted-foreground">{product?.sku}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-[10px] text-muted-foreground">Qtd:</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => {
                                                                        const newItems = [...formData.bundleItems];
                                                                        newItems[index].quantity = parseInt(e.target.value) || 1;
                                                                        setFormData({ ...formData, bundleItems: newItems });
                                                                    }}
                                                                    className="h-7 w-12 text-center text-xs p-1"
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        bundleItems: formData.bundleItems.filter((_, i) => i !== index)
                                                                    });
                                                                }}
                                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {formData.hasVariations && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold">Options</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        setFormData(prev => ({ ...prev, options: [...prev.options, { name: '', values: [] }] }))
                                    }}>
                                        Adicionar Opção
                                    </Button>
                                </div>

                                {formData.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-xs text-muted-foreground">Option Nome</Label>
                                            <Input
                                                placeholder="e.g., Size"
                                                value={opt.name}
                                                onChange={e => {
                                                    const newOptions = formData.options.map((o, i) => i === idx ? { ...o, name: e.target.value } : o);
                                                    setFormData({ ...formData, options: newOptions });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2 flex-[2]">
                                            <Label className="text-xs text-muted-foreground">Values (comma separated)</Label>
                                            <Input
                                                placeholder="e.g., S, M, L"
                                                value={opt.values.join(', ')}
                                                onChange={e => {
                                                    const newOptions = formData.options.map((o, i) => i === idx ? { ...o, values: e.target.value.split(',').map(v => v.trimStart()) } : o);
                                                    const generated = generateVariants(newOptions, formData.variants);
                                                    setFormData({ ...formData, options: newOptions, variants: generated });
                                                }}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-6 text-rose-500 hover:text-rose-600 dark:hover:bg-rose-900/20"
                                            onClick={() => {
                                                const newOptions = formData.options.filter((_, i) => i !== idx);
                                                const generated = generateVariants(newOptions, formData.variants);
                                                setFormData({ ...formData, options: newOptions, variants: generated });
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                {formData.variants.length > 0 && (
                                    <div className="pt-4 space-y-2">
                                        <Label className="text-base font-semibold">Variants</Label>
                                        <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-slate-50/50 dark:bg-zinc-800/50">
                                                        <TableHead>Variant</TableHead>
                                                        <TableHead>SKU *</TableHead>
                                                        <TableHead>Cost</TableHead>
                                                        <TableHead>Price *</TableHead>
                                                        <TableHead>Wholesale</TableHead>
                                                        <TableHead>Qtd Atac.</TableHead>
                                                        <TableHead>Estoque</TableHead>
                                                        <TableHead>Min.</TableHead>
                                                        <TableHead>Margin</TableHead>
                                                        <TableHead>Código de Barras</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {formData.variants.map((v, vIdx) => (
                                                        <TableRow key={v.id}>
                                                            <TableCell className="font-medium text-xs">
                                                                {Object.values(v.options).join(' / ')}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.sku}
                                                                    placeholder="SKU"
                                                                    className="h-8 text-xs font-mono"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, sku: e.target.value.toUpperCase() } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.cost}
                                                                    placeholder="0.00"
                                                                    className="h-8 text-xs"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, cost: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.price}
                                                                    placeholder="0.00"
                                                                    className="h-8 text-xs"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, price: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.wholesalePrice}
                                                                    placeholder="0.00"
                                                                    className="h-8 text-xs"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, wholesalePrice: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.wholesaleQuantity}
                                                                    placeholder="10"
                                                                    className="h-8 text-xs"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, wholesaleQuantity: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.stock}
                                                                    placeholder="0"
                                                                    className="h-8 text-xs"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, stock: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.minStock}
                                                                    placeholder="0"
                                                                    className="h-8 text-xs font-semibold text-rose-500"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, minStock: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-[10px] font-bold">
                                                                {v.price && v.cost ? (
                                                                    <span className={calculateMargin(v.price, v.cost)! >= 30 ? 'text-emerald-600' : 'text-amber-600'}>
                                                                        {calculateMargin(v.price, v.cost)?.toFixed(0)}%
                                                                    </span>
                                                                ) : '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={v.barcode}
                                                                    placeholder="Código de barras"
                                                                    className="h-8 text-xs font-mono"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, barcode: e.target.value } : variant);
                                                                        setFormData({ ...formData, variants: newVariants });
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">{editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Importar CSV Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Importar Produtos</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Faça o upload de um arquivo CSV para importar produtos em massa.
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label>Template CSV</Label>
                            <p className="text-xs text-slate-500 mb-2">
                                O arquivo deve conter as seguintes colunas exatas: Name, SKU, Price, Cost, WholesalePrice, WholesaleQuantity, Stock, MinStock, Barcode.
                            </p>
                            <div className="p-4 rounded-md shadow-inner bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-xs text-slate-700 dark:text-slate-400">
                                Name,SKU,Price,Cost,WholesalePrice,WholesaleQuantity,Stock,MinStock,Barcode<br />
                                "Café Expresso","CAFE-01","5,50","2,10","4,50","10","50","10","7891010"<br />
                                "Pão de Queijo","PAO-01","4,00","1,50","3,20","5","20","5",""<br />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Upload CSV</Label>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="cursor-pointer"
                            />
                        </div>

                        {importError && (
                            <div className="text-sm p-3 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                {importError}
                            </div>
                        )}

                        {importData.length > 0 && (
                            <div className="space-y-2">
                                <Label>Preview ({importData.length} items)</Label>
                                <div className="rounded-md border border-slate-200 dark:border-zinc-800 overflow-hidden max-h-48 overflow-y-auto shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 dark:bg-zinc-800/50 sticky top-0 shadow-sm z-10">
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Preço</TableHead>
                                                <TableHead>Custo</TableHead>
                                                <TableHead>Atacado</TableHead>
                                                <TableHead>Qtd Mín.</TableHead>
                                                <TableHead>Estoque</TableHead>
                                                <TableHead>Estoque Mín.</TableHead>
                                                <TableHead>Código de Barras</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-white dark:bg-zinc-900">
                                            {importData.slice(0, 10).map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{row.Name}</TableCell>
                                                    <TableCell>{row.SKU}</TableCell>
                                                    <TableCell>{row.Price}</TableCell>
                                                    <TableCell>{row.Cost || '-'}</TableCell>
                                                    <TableCell>{row.WholesalePrice || '-'}</TableCell>
                                                    <TableCell>{row.WholesaleQuantity || '-'}</TableCell>
                                                    <TableCell>{row.Stock || '-'}</TableCell>
                                                    <TableCell>{row.MinStock || '-'}</TableCell>
                                                    <TableCell>{row.Barcode}</TableCell>
                                                </TableRow>
                                            ))}
                                            {importData.length > 10 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-slate-500 text-xs py-3">
                                                        ... e {importData.length - 10} linhas a mais
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleImportSubmit} disabled={importData.length === 0}>Importar Produtos</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Price Adjustment Dialog */}
            <Dialog open={isBulkAdjustmentOpen} onOpenChange={setIsBulkAdjustmentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajuste de Preços em Lote</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Ajuste os preços de vários produtos de uma vez, por percentual.
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Produtos-alvo</Label>
                            <Select
                                value={bulkConfig.targetCategoryId}
                                onValueChange={(v) => setBulkConfig({ ...bulkConfig, targetCategoryId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos os Produtos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Produtos</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tabela de preço</Label>
                            <Select
                                value={bulkConfig.field}
                                onValueChange={(v: any) => setBulkConfig({ ...bulkConfig, field: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="retail">Apenas Varejo</SelectItem>
                                    <SelectItem value="wholesale">Apenas Atacado</SelectItem>
                                    <SelectItem value="both">Varejo e Atacado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Ajuste (%)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={bulkConfig.adjustmentPercent}
                                    onChange={(e) => setBulkConfig({ ...bulkConfig, adjustmentPercent: e.target.value })}
                                    placeholder="ex.: 10 ou -5"
                                />
                                <div className="flex items-center gap-1 px-3 bg-slate-100 dark:bg-zinc-800 rounded-md text-xs font-medium">
                                    {(parseFloat(bulkConfig.adjustmentPercent) || 0) >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-rose-500" />
                                    )}
                                    {Math.abs(parseFloat(bulkConfig.adjustmentPercent) || 0)}%
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Use valores positivos para aumentar e negativos para reduzir.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkAdjustmentOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => {
                                const percent = (parseFloat(bulkConfig.adjustmentPercent) || 0) / 100;
                                const productsToUpdate = products.filter(p => bulkConfig.targetCategoryId === 'all' || p.categoryId === bulkConfig.targetCategoryId);

                                const updates = productsToUpdate.map(p => {
                                    const updatedProduct: any = {};

                                    if (p.variants && p.variants.length > 0) {
                                        updatedProduct.variants = p.variants.map(v => {
                                            const newV = { ...v };
                                            if (bulkConfig.field === 'retail' || bulkConfig.field === 'both') {
                                                newV.price = Math.round(v.price * (1 + percent));
                                            }
                                            if (v.wholesalePrice && (bulkConfig.field === 'wholesale' || bulkConfig.field === 'both')) {
                                                newV.wholesalePrice = Math.round(v.wholesalePrice * (1 + percent));
                                            }
                                            return newV;
                                        });
                                    } else {
                                        if (p.price && (bulkConfig.field === 'retail' || bulkConfig.field === 'both')) {
                                            updatedProduct.price = Math.round(p.price * (1 + percent));
                                        }
                                        if (p.wholesalePrice && (bulkConfig.field === 'wholesale' || bulkConfig.field === 'both')) {
                                            updatedProduct.wholesalePrice = Math.round(p.wholesalePrice * (1 + percent));
                                        }
                                    }

                                    return { id: p.id, product: updatedProduct };
                                });

                                bulkUpdateProducts(updates);
                                setIsBulkAdjustmentOpen(false);
                                setBulkConfig({ targetCategoryId: 'all', adjustmentPercent: '0', field: 'both' });
                            }}
                            disabled={!bulkConfig.adjustmentPercent || bulkConfig.adjustmentPercent === '0'}
                        >
                            Aplicar em {products.filter(p => bulkConfig.targetCategoryId === 'all' || p.categoryId === bulkConfig.targetCategoryId).length} produtos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


