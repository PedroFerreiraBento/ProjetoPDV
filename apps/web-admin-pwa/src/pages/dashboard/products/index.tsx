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
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useProductsStore } from '../../../store/products'
import { useCategoriesStore } from '../../../store/categories'
import { Product } from '@pos/shared'
import { formatCurrency } from '../../../lib/utils'

export function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct } = useProductsStore()
    const { categories } = useCategoriesStore()
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
    })

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenAdd = () => {
        setEditingProduct(null)
        setFormData({ name: '', sku: '', price: '', barcode: '', categoryId: 'none' })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            sku: product.sku,
            price: (product.price / 100).toFixed(2), // Convert cents to reais for editing
            barcode: product.barcode || '',
            categoryId: product.categoryId || 'none',
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

        const numericPrice = Math.round(parseFloat(formData.price.replace(',', '.')) * 100)

        if (isNaN(numericPrice) || numericPrice < 0) {
            alert('Please enter a valid price.')
            return
        }

        if (editingProduct) {
            updateProduct(editingProduct.id, {
                name: formData.name,
                sku: formData.sku,
                price: numericPrice,
                barcode: formData.barcode,
                categoryId: formData.categoryId !== 'none' ? formData.categoryId : undefined,
            })
        } else {
            addProduct({
                name: formData.name,
                sku: formData.sku,
                price: numericPrice,
                barcode: formData.barcode || undefined,
                categoryId: formData.categoryId !== 'none' ? formData.categoryId : undefined,
            })
        }
        setIsDialogOpen(false)
    }

    const getCategoryDetails = (id?: string) => {
        if (!id) return null;
        return categories.find(c => c.id === id);
    }

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
                                                {product.sku}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(product.price)}
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
                <DialogContent className="sm:max-w-[425px]">
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
                                <Label htmlFor="barcode">Barcode (Optional)</Label>
                                <Input
                                    id="barcode"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    placeholder="Scan or type barcode..."
                                />
                            </div>
                        </div>
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
