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
} from '@pos/ui'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { useCategoriesStore } from '../../../store/categories'
import { Category } from '@pos/shared'

const CATEGORY_COLORS = [
    { label: 'Gray', value: 'gray', hex: 'bg-gray-500' },
    { label: 'Red', value: 'red', hex: 'bg-red-500' },
    { label: 'Orange', value: 'orange', hex: 'bg-orange-500' },
    { label: 'Yellow', value: 'yellow', hex: 'bg-yellow-500' },
    { label: 'Green', value: 'green', hex: 'bg-green-500' },
    { label: 'Blue', value: 'blue', hex: 'bg-blue-500' },
    { label: 'Indigo', value: 'indigo', hex: 'bg-indigo-500' },
    { label: 'Purple', value: 'purple', hex: 'bg-purple-500' },
    { label: 'Pink', value: 'pink', hex: 'bg-pink-500' },
]

export function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory } = useCategoriesStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        color: 'gray',
    })

    const filteredCategories = categories.filter(
        (category) =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenAdd = () => {
        setEditingCategory(null)
        setFormData({ name: '', color: 'gray' })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name,
            color: category.color || 'gray',
        })
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
            deleteCategory(id)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (editingCategory) {
            updateCategory(editingCategory.id, {
                name: formData.name,
                color: formData.color,
            })
        } else {
            addCategory({
                name: formData.name,
                color: formData.color,
            })
        }
        setIsDialogOpen(false)
    }

    const getColorHex = (colorName: string) => {
        return CATEGORY_COLORS.find(c => c.value === colorName)?.hex || 'bg-gray-500'
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        Categories
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Organize your products into categories for easier navigation.
                    </p>
                </div>
                <Button onClick={handleOpenAdd} className="w-full sm:w-auto shadow-md">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Actions/Search Bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
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
                            <TableHead className="w-[100px] font-semibold text-slate-900 dark:text-slate-300">Color</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300">Name</TableHead>
                            <TableHead className="font-semibold text-slate-900 dark:text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id} className="group">
                                    <TableCell>
                                        <div className={`w-6 h-6 rounded-full border border-slate-200 dark:border-zinc-800 shadow-inner ${getColorHex(category.color || 'gray')}`} />
                                    </TableCell>
                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                        {category.name}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                onClick={() => handleOpenEdit(category)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                                onClick={() => handleDelete(category.id, category.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name *</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Bebidas Geladas"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label>Category Color</Label>
                            <div className="flex flex-wrap gap-3">
                                {CATEGORY_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                        className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 dark:focus:ring-slate-100 transition-all ${color.hex} ${formData.color === color.value ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                                            }`}
                                        title={color.label}
                                        aria-label={`Select ${color.label} color`}
                                    />
                                ))}
                            </div>
                        </div>
                        <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-zinc-800">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingCategory ? 'Save Changes' : 'Add Category'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
