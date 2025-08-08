"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { Warehouse, Search, Plus, Edit, FolderPlus, Tag, Upload, Download, Send, Building, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import type { Order, PendingChange } from "@/pages/Dashboard"
import FileUpload from "@/components/FileUpload"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api, getAuthHeaders } from "@/lib/api"

interface WarehouseInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  onPendingChange: (change: Omit<PendingChange, "id" | "submittedAt" | "status">) => void
}

interface Category {
  id: string
  name: string
  description: string
  createdAt: Date
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category?: {
    id: string
    name: string
    description: string
    createdAt: string
  }
  categoryId?: string
  totalStock: number
  availableStock: number
  image?: string
  createdAt: Date
  warehouseId: string
}

interface Shop {
  id: string
  name: string
  location: string
  isActive: boolean
}

interface ProductAssignment {
  id: string
  productId: string
  shopId: string
  warehouseId: string
  quantity: number
  availableQuantity: number
  soldQuantity: number
  assignedAt: Date
  assignedBy: string
  isRestock?: boolean
  warehouseStockAfter?: number
  message?: string
  product?: {
    id: string
    name: string
    price: number
  }
  shop?: {
    id: string
    name: string
    location: string
  }
  warehouse?: {
    id: string
    name: string
    location: string
  }
}

const WarehouseInterface = ({ orders, onUpdateOrder, onPendingChange }: WarehouseInterfaceProps) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<ProductAssignment[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Category form state
  const [newCategory, setNewCategory] = useState({ name: "", description: "" })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [openCreateProduct, setOpenCreateProduct] = useState(false)

  // Product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    totalStock: "",
    image: "",
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editProductOpen, setEditProductOpen] = useState(false)

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    productId: "",
    shopId: "",
    warehouseId: "",
    quantity: "",
  })
  const [assignmentOpen, setAssignmentOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
    fetchShops()
    fetchWarehouses()
    fetchAssignments()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch(api.products.categories, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      const json = await res.json()

      if (!res.ok || !json.status) {
        throw new Error(json.message || "Failed to fetch categories")
      }

      const formatted = json.data.map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt),
      }))

      setCategories(formatted)
    } catch (err: any) {
      toast.error(err.message || "Could not load categories")
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch(api.products.warehouse.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch products")
      }

      const json = await res.json()

      if (!json.status || !json.data) {
        throw new Error(json.message || "Invalid product data")
      }

      const parsedProducts = json.data.map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt),
      }))

      setProducts(parsedProducts)
    } catch (error: any) {
      toast.error(error.message || "Error loading products")
    }
  }

  const fetchShops = async () => {
    try {
      const res = await fetch(api.shops.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch shops")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status || !response.data) {
        throw new Error(response.message || "Invalid shop data")
      }

      setShops(response.data.filter((shop: Shop) => shop.isActive))
    } catch (error: any) {
      toast.error(error.message || "Error loading shops")
    }
  }

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(api.warehouses.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch warehouses")
      }

      const response = await res.json()
      if (response.status && response.data) {
        setWarehouses(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch warehouses")
    }
  }

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${api.baseURL}/warehouse/assignments`, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch assignments")
      }

      const json = await res.json()

      if (!json.status || !json.data) {
        throw new Error(json.message || "Invalid assignment data")
      }

      const parsedAssignments = json.data.map((assignment: any) => ({
        ...assignment,
        assignedAt: new Date(assignment.assignedAt),
      }))

      setAssignments(parsedAssignments)
    } catch (error: any) {
      toast.error(error.message || "Error loading assignments")
    }
  }

  const handleUploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(api.products.upload, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!res.ok) {
        throw new Error("Image upload failed")
      }

      const result = await res.json()
      const imageUrl = result?.data

      if (!imageUrl) {
        throw new Error("Image URL not returned")
      }

      setNewProduct((prev) => ({
        ...prev,
        image: imageUrl,
      }))

      toast.success("Image uploaded successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image")
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const res = await fetch(api.products.categories, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCategory.name.trim(),
          description: newCategory.description.trim(),
        }),
      })

      const result = await res.json()

      if (!res.ok || !result?.data) {
        throw new Error(result?.message || "Failed to create category")
      }

      const createdCategory = result.data

      setCategories((prev) => [...prev, createdCategory])
      setNewCategory({ name: "", description: "" })
      toast.success("Category created successfully")
    } catch (error: any) {
      toast.error(error.message || "Error creating category")
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.categoryId || !newProduct.totalStock) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload = {
      name: newProduct.name.trim(),
      description: newProduct.description?.trim(),
      price: Number.parseFloat(newProduct.price),
      categoryId: newProduct.categoryId,
      totalStock: Number.parseInt(newProduct.totalStock),
      image: newProduct.image || undefined,
    }

    try {
      const res = await fetch(`${api.baseURL}/warehouse/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Product creation failed")
      }

      setProducts((prev) => [...prev, data.data])
      setNewProduct({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        totalStock: "",
        image: "",
      })
      setOpenCreateProduct(false)
      toast.success("Product created successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to create product")
    }
  }

  const handleAssignProduct = async () => {
    if (!assignmentForm.productId || !assignmentForm.shopId || !assignmentForm.warehouseId || !assignmentForm.quantity) {
      toast.error("Please fill in all required fields")
      return
    }

    const quantity = Number.parseInt(assignmentForm.quantity)
    const product = products.find((p) => p.id === assignmentForm.productId)
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")

    if (!product) {
      toast.error("Product not found")
      return
    }

    if (quantity > product.availableStock) {
      toast.error("Insufficient stock available")
      return
    }

    // Check if this product is already assigned to this shop
    const existingAssignment = assignments.find(
      (assignment) => assignment.productId === assignmentForm.productId && assignment.shopId === assignmentForm.shopId
    )

    if (existingAssignment) {
      toast.info("This product is already assigned to this shop. The system will update the existing assignment (restock).")
    }

    try {
      const res = await fetch(api.warehouses.assignProduct, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: assignmentForm.productId,
          shopId: assignmentForm.shopId,
          warehouseId: assignmentForm.warehouseId,
          quantity: quantity,
          assignedBy: currentUser.id,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.status) {
        throw new Error(data.message || "Assignment failed")
      }

      const assignmentData = data.data

      // Update local state - warehouse stock
      setProducts((prev) =>
        prev.map((p) =>
          p.id === assignmentForm.productId ? { ...p, availableStock: p.availableStock - quantity } : p,
        ),
      )

      // Handle assignment update based on API response
      if (assignmentData.isRestock) {
        // Update existing assignment
        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.productId === assignmentForm.productId && assignment.shopId === assignmentForm.shopId
              ? {
                  ...assignment,
                  quantity: assignmentData.quantity,
                  availableQuantity: assignmentData.availableQuantity,
                  soldQuantity: assignmentData.soldQuantity,
                  assignedAt: new Date(assignmentData.assignedAt),
                  warehouseStockAfter: assignmentData.warehouseStockAfter
                }
              : assignment
          )
        )
        toast.success(`Restocked successfully! ${assignmentData.message}`)
      } else {
        // Add new assignment
        setAssignments((prev) => [...prev, assignmentData])
        toast.success(`Assignment created! ${assignmentData.message}`)
      }

      // Show warehouse stock info
      if (assignmentData.warehouseStockAfter !== undefined) {
        toast.info(`Warehouse stock after operation: ${assignmentData.warehouseStockAfter} units`)
      }

      setAssignmentForm({ productId: "", shopId: "", warehouseId: "", quantity: "" })
      setAssignmentOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to assign product")
    }
  }

  const handleBulkProductUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(api.products.warehouse.bulkUpload, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!res.ok) {
        throw new Error("Bulk upload failed")
      }

      const result = await res.json()
      toast.success(`Successfully uploaded ${result.count} products`)

      // Refresh products list
      fetchProducts()
    } catch (err: any) {
      toast.error(err.message || "Failed to upload products")
    }
  }

  const handleExportProducts = () => {
    const exportData = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category?.name || "No Category",
      price: product.price,
      totalStock: product.totalStock,
      availableStock: product.availableStock,
      createdAt: product.createdAt.toISOString(),
    }))

    const csvContent = [
      Object.keys(exportData[0]).join(","),
      ...exportData.map((row) => Object.values(row).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `warehouse-products-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Products exported successfully")
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-teal-600">Warehouse Keeper Dashboard</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          <Warehouse className="h-4 w-4 mr-1" />
          Warehouse Management
        </Badge>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="assignments">Shop Assignments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <CardTitle>Products ({products.length})</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportProducts} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setAssignmentOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Assign to Shop
              </Button>
            </div>
          </div>

          <Card className="border-2 border-teal-200">
            {openCreateProduct ? (
              <>
                <CardHeader className="bg-teal-50">
                  <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Product
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Luxury Sofa Set"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="productCategory">Category *</Label>
                      <Select
                        value={newProduct.categoryId}
                        onValueChange={(value) => setNewProduct((prev) => ({ ...prev, categoryId: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="productPrice">Price (₦) *</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g., 250000"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="productStock">Total Stock *</Label>
                      <Input
                        id="productStock"
                        type="number"
                        value={newProduct.totalStock}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, totalStock: e.target.value }))}
                        placeholder="e.g., 15"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="productDescription">Description</Label>
                    <Textarea
                      id="productDescription"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed product description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="productImage">Upload Image</Label>
                    <Input
                      type="file"
                      id="productImage"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadImage(file)
                      }}
                      className="mt-1"
                    />
                  </div>

                  {newProduct.image && (
                    <div className="mt-4">
                      <img
                        src={newProduct.image || "/placeholder.svg"}
                        alt={newProduct.name}
                        className="rounded-lg border h-32 w-32 object-cover"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleAddProduct} className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button variant="outline" onClick={() => setOpenCreateProduct(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardHeader className="bg-teal-50">
                <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                  <Button
                    onClick={() => setOpenCreateProduct(true)}
                    variant="ghost"
                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-100"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Product
                  </Button>
                </CardTitle>
              </CardHeader>
            )}
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Product Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FileUpload
                onFileUpload={handleBulkProductUpload}
                acceptedTypes=".csv,.xlsx,.json"
                label="Upload Products File"
                description="Upload CSV, Excel, or JSON file with product data"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-2 border-gray-200 overflow-hidden">
                <div className="aspect-video relative bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg?height=200&width=300"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-gray-800">{product.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        <Tag className="h-3 w-3 mr-1" />
                        {product.category?.name || "No Category"}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(product)
                          setEditProductOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">₦{product.price.toLocaleString()}</span>
                    <div className="text-sm text-gray-500">
                      Stock: {product.availableStock}/{product.totalStock}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(product.availableStock / product.totalStock) * 100}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                Add New Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Living Room, Bedroom"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Input
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of category"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleAddCategory} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="border-2 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-gray-800">{category.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
                          setEditCategoryOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <p className="text-xs text-gray-500">
                    Products: {products.filter((p) => p.categoryId === category.id).length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Product Shop Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const product = products.find((p) => p.id === assignment.productId) || assignment.product
                  const shop = shops.find((s) => s.id === assignment.shopId) || assignment.shop
                  const warehouse = warehouses.find((w) => w.id === assignment.warehouseId) || assignment.warehouse

                  return (
                    <div key={assignment.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-lg">{product?.name || "Unknown Product"}</div>
                          <div className="text-sm text-gray-500">
                            Shop: {shop?.name || "Unknown Shop"} ({shop?.location})
                          </div>
                          <div className="text-sm text-gray-500">
                            Warehouse: {warehouse?.name || "Unknown Warehouse"} ({warehouse?.location})
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Active
                        </Badge>
                      </div>

                      {/* Enhanced Stock Information */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <div className="text-blue-600 font-medium text-sm">Total Assigned</div>
                          <div className="text-blue-800 font-bold text-xl">{assignment.quantity || 0}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-green-600 font-medium text-sm">Available</div>
                          <div className="text-green-800 font-bold text-xl">{assignment.availableQuantity || 0}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <div className="text-purple-600 font-medium text-sm">Sold</div>
                          <div className="text-purple-800 font-bold text-xl">{assignment.soldQuantity || 0}</div>
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t">
                        <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                        <span>By: {assignment.assignedBy}</span>
                        {assignment.warehouseStockAfter !== undefined && (
                          <span>Warehouse Stock: {assignment.warehouseStockAfter}</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {assignments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No product assignments yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Assignment Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-blue-600 font-medium">Total Assignments</div>
                  <div className="text-blue-800 font-bold text-2xl">{assignments.length}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-green-600 font-medium">Total Assigned Qty</div>
                  <div className="text-green-800 font-bold text-2xl">
                    {assignments.reduce((sum, a) => sum + (a.quantity || 0), 0)}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-orange-600 font-medium">Available in Shops</div>
                  <div className="text-orange-800 font-bold text-2xl">
                    {assignments.reduce((sum, a) => sum + (a.availableQuantity || 0), 0)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-purple-600 font-medium">Total Sold</div>
                  <div className="text-purple-800 font-bold text-2xl">
                    {assignments.reduce((sum, a) => sum + (a.soldQuantity || 0), 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                      <div className="text-sm text-gray-600">Total Products</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {products.reduce((sum, p) => sum + p.totalStock, 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Stock</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{assignments.length}</div>
                      <div className="text-sm text-gray-600">Shop Assignments</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Product to Shop</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignProduct">Product *</Label>
              <Select
                value={assignmentForm.productId}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((p) => p.availableStock > 0)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Available: {product.availableStock})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignShop">Shop *</Label>
              <Select
                value={assignmentForm.shopId}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, shopId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} - {shop.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignWarehouse">Warehouse *</Label>
              <Select
                value={assignmentForm.warehouseId}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, warehouseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignQuantity">Quantity *</Label>
              <Input
                id="assignQuantity"
                type="number"
                value={assignmentForm.quantity}
                onChange={(e) => setAssignmentForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
                min="1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAssignmentOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignProduct} className="bg-blue-600 hover:bg-blue-700">
                Assign Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WarehouseInterface
