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
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { useProductsStore } from '../../../store/products'
import { useCategoriesStore } from '../../../store/categories'
import { useUnitsStore } from '../../../store/units'
import { Product, ProductOption, ProductVariant } from '@pos/shared'
import { formatCurrency } from '../../../lib/utils'

type FormVariant = Omit<ProductVariant, 'price'> & { price: string };

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
    const { products, addProduct, updateProduct, deleteProduct } = useProductsStore()
    const { categories } = useCategoriesStore()
    const { units } = useUnitsStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        barcode: '',
        categoryId: 'none',
        unitId: 'none',
        hasVariations: false,
        options: [] as ProductOption[],
        variants: [] as FormVariant[],
    })

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenAdd = () => {
        setEditingProduct(null)
        setFormData({ name: '', sku: '', price: '', barcode: '', categoryId: 'none', unitId: 'none', hasVariations: false, options: [], variants: [] })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product)
        const hasVars = product.variants && product.variants.length > 0;
        setFormData({
            name: product.name,
            sku: product.sku || '',
            price: product.price !== undefined ? (product.price / 100).toFixed(2) : '', // Convert cents to reais for editing
            barcode: product.barcode || '',
            categoryId: product.categoryId || 'none',
            unitId: product.unitId || 'none',
            hasVariations: hasVars ? true : false,
            options: product.options ? JSON.parse(JSON.stringify(product.options)) : [],
            variants: product.variants ? product.variants.map(v => ({ ...v, price: (v.price / 100).toFixed(2) })) : [],
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            deleteProduct(id)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const numericPrice = formData.hasVariations ? undefined : Math.round(parseFloat(formData.price.replace(',', '.')) * 100)

        if (!formData.hasVariations && (numericPrice === undefined || isNaN(numericPrice) || numericPrice < 0)) {
            alert('Please enter a valid price.')
            return
        }

        let formattedVariants: ProductVariant[] | undefined = undefined;
        let formattedOptions: ProductOption[] | undefined = undefined;

        if (formData.hasVariations) {
            if (formData.variants.length === 0) {
                alert('Please configure at least one variant combination.');
                return;
            }
            const invalidVariant = formData.variants.find(v => {
                const numeric = Math.round(parseFloat(v.price.replace(',', '.')) * 100);
                return isNaN(numeric) || numeric < 0 || v.sku.trim() === '';
            });
            if (invalidVariant) {
                alert('Please ensure all variants have a valid SKU and Price.');
                return;
            }

            formattedVariants = formData.variants.map(v => ({
                ...v,
                price: Math.round(parseFloat(v.price.replace(',', '.')) * 100)
            }));
            formattedOptions = formData.options;
        }

        const payload = {
            name: formData.name,
            sku: formData.hasVariations ? undefined : formData.sku,
            price: formData.hasVariations ? undefined : numericPrice,
            barcode: formData.barcode || undefined,
            categoryId: formData.categoryId !== 'none' ? formData.categoryId : undefined,
            unitId: formData.unitId !== 'none' ? formData.unitId : undefined,
            options: formattedOptions,
            variants: formattedVariants,
        };

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
                        Products
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your store's catalog and pricing.
                    </p>
                </div>
                <Button onClick={handleOpenAdd} className="w-full sm:w-auto shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            {/* Actions/Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
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
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Name</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">SKU</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Price</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No products found.
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
                                        <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {getProductPrice(product)}
                                            {unit && (!product.variants || product.variants.length === 0) && (
                                                <span className="text-muted-foreground font-normal text-xs ml-1">
                                                    / {unit.abbreviation}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name *</Label>
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
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
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
                                        <SelectValue placeholder="Select a unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
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
                            <Label htmlFor="barcode">Barcode (Optional)</Label>
                            <Input
                                id="barcode"
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                placeholder="Scan or type barcode..."
                            />
                        </div>

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

                        {formData.hasVariations && (
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                                <div className="flex justify-between items-center">
                                    <Label className="text-base font-semibold">Options</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        setFormData(prev => ({ ...prev, options: [...prev.options, { name: '', values: [] }] }))
                                    }}>
                                        Add Option
                                    </Button>
                                </div>

                                {formData.options.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-xs text-muted-foreground">Option Name</Label>
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
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Price</TableHead>
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
                                                                    value={v.price}
                                                                    placeholder="0.00"
                                                                    className="h-8 text-xs"
                                                                    onChange={e => {
                                                                        const newVariants = formData.variants.map((variant, i) => i === vIdx ? { ...variant, price: e.target.value } : variant);
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
                                Cancel
                            </Button>
                            <Button type="submit">{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
