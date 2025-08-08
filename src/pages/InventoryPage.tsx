"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Download, Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp, DollarSign, Eye } from "lucide-react"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"
import { exportToCSV, exportToExcel } from "@/utils/exportUtils"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  description: string
  price: number
  costPrice: number
  quantity: number
  minStockLevel: number
  supplier: string
  status: "active" | "inactive" | "discontinued"
  createdAt: string
  updatedAt: string
  imageUrl?: string
}

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    price: 0,
    costPrice: 0,
    quantity: 0,
    minStockLevel: 10,
    supplier: "",
    status: "active" as Product["status"],
  })

  const [currentUser] = useState(() => {
    const user = localStorage.getItem("currentUser")
    return user ? JSON.parse(user) : null
  })
  const [currentRole] = useState(() => {
    return localStorage.getItem("currentRole") || "Attendee"
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Modern Sofa Set",
        sku: "SOF-001",
        category: "Living Room",
        description: "Comfortable 3-seater modern sofa with premium fabric",
        price: 1200,
        costPrice: 800,
        quantity: 15,
        minStockLevel: 5,
        supplier: "Furniture Plus",
        status: "active",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "2",
        name: "Coffee Table",
        sku: "TAB-001",
        category: "Living Room",
        description: "Glass top coffee table with wooden legs",
        price: 300,
        costPrice: 180,
        quantity: 8,
        minStockLevel: 10,
        supplier: "Glass Works",
        status: "active",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-14T09:15:00Z",
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "3",
        name: "Dining Table",
        sku: "DIN-001",
        category: "Dining Room",
        description: "6-seater wooden dining table",
        price: 800,
        costPrice: 500,
        quantity: 3,
        minStockLevel: 5,
        supplier: "Wood Craft",
        status: "active",
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-13T16:45:00Z",
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "4",
        name: "Bedroom Set",
        sku: "BED-001",
        category: "Bedroom",
        description: "Complete bedroom set with bed, dresser, and nightstands",
        price: 2000,
        costPrice: 1200,
        quantity: 2,
        minStockLevel: 3,
        supplier: "Sleep Well",
        status: "active",
        createdAt: "2024-01-04T00:00:00Z",
        updatedAt: "2024-01-12T08:00:00Z",
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
      {
        id: "5",
        name: "Office Chair",
        sku: "OFF-001",
        category: "Office",
        description: "Ergonomic office chair with lumbar support",
        price: 250,
        costPrice: 150,
        quantity: 0,
        minStockLevel: 8,
        supplier: "Office Pro",
        status: "inactive",
        createdAt: "2024-01-05T00:00:00Z",
        updatedAt: "2024-01-11T12:00:00Z",
        imageUrl: "/placeholder.svg?height=100&width=100",
      },
    ]
    setProducts(mockProducts)
    setFilteredProducts(mockProducts)
  }, [])

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((product) => product.status === statusFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-yellow-100 text-yellow-800"
      case "discontinued":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity === 0) return { status: "Out of Stock", color: "bg-red-100 text-red-800" }
    if (quantity <= minLevel) return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
    return { status: "In Stock", color: "bg-green-100 text-green-800" }
  }

  const handleAddProduct = () => {
    const product: Product = {
      id: Date.now().toString(),
      ...newProduct,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setProducts([...products, product])
    setNewProduct({
      name: "",
      sku: "",
      category: "",
      description: "",
      price: 0,
      costPrice: 0,
      quantity: 0,
      minStockLevel: 10,
      supplier: "",
      status: "active",
    })
    setIsAddDialogOpen(false)
    toast.success("Product added successfully!")
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
      supplier: product.supplier,
      status: product.status,
    })
  }

  const handleUpdateProduct = () => {
    if (!editingProduct) return

    const updatedProducts = products.map((product) =>
      product.id === editingProduct.id ? { ...product, ...newProduct, updatedAt: new Date().toISOString() } : product,
    )

    setProducts(updatedProducts)
    setEditingProduct(null)
    setNewProduct({
      name: "",
      sku: "",
      category: "",
      description: "",
      price: 0,
      costPrice: 0,
      quantity: 0,
      minStockLevel: 10,
      supplier: "",
      status: "active",
    })
    toast.success("Product updated successfully!")
  }

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter((product) => product.id !== productId))
    toast.success("Product deleted successfully!")
  }

  const handleExportCSV = () => {
    const exportData = filteredProducts.map((product) => ({
      Name: product.name,
      SKU: product.sku,
      Category: product.category,
      Price: product.price,
      "Cost Price": product.costPrice,
      Quantity: product.quantity,
      "Min Stock Level": product.minStockLevel,
      Supplier: product.supplier,
      Status: product.status,
      "Profit Margin": (((product.price - product.costPrice) / product.price) * 100).toFixed(2) + "%",
      "Total Value": (product.quantity * product.price).toFixed(2),
      "Created At": new Date(product.createdAt).toLocaleDateString(),
    }))

    exportToCSV(exportData, `inventory-${new Date().toISOString().split("T")[0]}`)
    toast.success("Inventory exported to CSV successfully!")
  }

  const handleExportExcel = () => {
    const exportData = filteredProducts.map((product) => ({
      Name: product.name,
      SKU: product.sku,
      Category: product.category,
      Description: product.description,
      Price: product.price,
      "Cost Price": product.costPrice,
      Quantity: product.quantity,
      "Min Stock Level": product.minStockLevel,
      Supplier: product.supplier,
      Status: product.status,
      "Profit Margin": (((product.price - product.costPrice) / product.price) * 100).toFixed(2) + "%",
      "Total Value": (product.quantity * product.price).toFixed(2),
      "Created At": new Date(product.createdAt).toLocaleDateString(),
      "Updated At": new Date(product.updatedAt).toLocaleDateString(),
    }))

    exportToExcel(exportData, `inventory-${new Date().toISOString().split("T")[0]}`, "Inventory")
    toast.success("Inventory exported to Excel successfully!")
  }

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    lowStock: products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0).length,
    outOfStock: products.filter((p) => p.quantity === 0).length,
    totalValue: products.reduce((sum, p) => sum + p.quantity * p.price, 0),
    totalCost: products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0),
  }

  const categories = [...new Set(products.map((p) => p.category))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} currentRole={currentRole} onRoleChange={() => {}} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage products, stock levels, and suppliers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeProducts}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">${stats.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${(stats.totalValue - stats.totalCost).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>
                  Manage your product catalog and stock levels ({filteredProducts.length} of {products.length})
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Add a new product to your inventory with all necessary details.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="Enter product name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sku">SKU</Label>
                          <Input
                            id="sku"
                            value={newProduct.sku}
                            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                            placeholder="Enter SKU"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                            placeholder="Enter category"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplier">Supplier</Label>
                          <Input
                            id="supplier"
                            value={newProduct.supplier}
                            onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                            placeholder="Enter supplier name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          placeholder="Enter product description"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Selling Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            value={newProduct.price}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="costPrice">Cost Price ($)</Label>
                          <Input
                            id="costPrice"
                            type="number"
                            value={newProduct.costPrice}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, costPrice: Number.parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newProduct.quantity}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, quantity: Number.parseInt(e.target.value) || 0 })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minStockLevel">Min Stock Level</Label>
                          <Input
                            id="minStockLevel"
                            type="number"
                            value={newProduct.minStockLevel}
                            onChange={(e) =>
                              setNewProduct({ ...newProduct, minStockLevel: Number.parseInt(e.target.value) || 0 })
                            }
                            placeholder="10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newProduct.status}
                          onValueChange={(value) =>
                            setNewProduct({ ...newProduct, status: value as Product["status"] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddProduct}>Add Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handleExportExcel} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Cost</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">Supplier</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.quantity, product.minStockLevel)
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <img
                            src={product.imageUrl || "/placeholder.svg?height=40&width=40"}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                        <TableCell className="font-medium">${product.price.toLocaleString()}</TableCell>
                        <TableCell className="hidden lg:table-cell">${product.costPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.quantity}</p>
                            <Badge className={stockStatus.color} variant="secondary">
                              {stockStatus.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">{product.supplier}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Product</DialogTitle>
                                  <DialogDescription>
                                    Update product information and inventory details.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-name">Product Name</Label>
                                      <Input
                                        id="edit-name"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-sku">SKU</Label>
                                      <Input
                                        id="edit-sku"
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-category">Category</Label>
                                      <Input
                                        id="edit-category"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-supplier">Supplier</Label>
                                      <Input
                                        id="edit-supplier"
                                        value={newProduct.supplier}
                                        onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={newProduct.description}
                                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                      rows={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-price">Selling Price ($)</Label>
                                      <Input
                                        id="edit-price"
                                        type="number"
                                        value={newProduct.price}
                                        onChange={(e) =>
                                          setNewProduct({
                                            ...newProduct,
                                            price: Number.parseFloat(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-costPrice">Cost Price ($)</Label>
                                      <Input
                                        id="edit-costPrice"
                                        type="number"
                                        value={newProduct.costPrice}
                                        onChange={(e) =>
                                          setNewProduct({
                                            ...newProduct,
                                            costPrice: Number.parseFloat(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-quantity">Quantity</Label>
                                      <Input
                                        id="edit-quantity"
                                        type="number"
                                        value={newProduct.quantity}
                                        onChange={(e) =>
                                          setNewProduct({
                                            ...newProduct,
                                            quantity: Number.parseInt(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-minStockLevel">Min Stock Level</Label>
                                      <Input
                                        id="edit-minStockLevel"
                                        type="number"
                                        value={newProduct.minStockLevel}
                                        onChange={(e) =>
                                          setNewProduct({
                                            ...newProduct,
                                            minStockLevel: Number.parseInt(e.target.value) || 0,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-status">Status</Label>
                                    <Select
                                      value={newProduct.status}
                                      onValueChange={(value) =>
                                        setNewProduct({ ...newProduct, status: value as Product["status"] })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="discontinued">Discontinued</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdateProduct}>Update Product</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No products found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default InventoryPage
