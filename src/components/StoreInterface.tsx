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
import {
  Store,
  CheckCircle,
  Package,
  Search,
  Shield,
  Plus,
  Edit,
  Trash2,
  FolderPlus,
  Tag,
  Upload,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import ProductImageUpload from "@/components/ProductImageUpload"
import ReceiptGenerator from "@/components/ReceiptGenerator"
import TransactionTable from "@/components/TransactionTable"
import type { Order, PendingChange } from "@/pages/Dashboard"
import type { User } from "../pages/Dashboard"
import FileUpload from "@/components/FileUpload"
const BASE_URL = import.meta.env.VITE_API_BASE_URL;


interface StoreInterfaceProps {
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

export interface Order {
  id: string
  customerName: string
  customerPhone?: string
  products: Product[]
  OrderItem?: any[]
  status: "pending_payment" | "paid" | "assigned_packager" | "packaged" | "picked_up" | "delivered"
  attendee: User // Change from string to User
  attendeeId: string
  receptionist?: User
  receptionistId?: string
  packager?: User
  packagerId?: string
  storekeeper?: User
  storekeeperId?: string
  paymentMethod?: "paystack" | "bank_transfer" | "cash"
  paymentStatus: "pending" | "confirmed"
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  receiptId: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category?: string
  categoryId?: string
  totalStock: number
  availableStock: number
  image?: string
  createdAt: Date
}

const StoreInterface = ({ orders, onUpdateOrder, onPendingChange }: StoreInterfaceProps) => {
  const [receiptSearch, setReceiptSearch] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3000/products/category", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const json = await res.json()

        if (!res.ok || !json.status) {
          throw new Error(json.message || "Failed to fetch categories")
        }

        // Convert date strings to Date objects
        const formatted = json.data.map((cat: any) => ({
          ...cat,
          createdAt: new Date(cat.createdAt),
        }))

        setCategories(formatted)
      } catch (err: any) {
        toast.error(err.message || "Could not load categories")
      }
    }

    fetchCategories()
  }, [])

  const [products, setProducts] = useState<Product[]>([])
  const [storeOrders, setStoreOrders] = useState<Order[]>([])
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://localhost:3000/orders/storekeeper", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch orders")
        }

        const json = await res.json()

        // Check success structure and parse if needed
        if (!json.status || !json.data) {
          throw new Error(json.message || "Invalid order data")
        }

        console.log("🚀 ~ fetchOrders ~ json.data:", json.data)
        setStoreOrders(json.data)
      } catch (error: any) {
        toast.error(error.message || "Error loading orders")
      }
    }

      const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:3000/products", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch products")
        }

        const json = await res.json()

        // Check success structure and parse if needed
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

  useEffect(() => {
  
  
    fetchOrders()
    fetchProducts()
  }, [])

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

  const readyForPickup = orders.filter((order) => order.status === "packaged")
  const allStoreOrders = orders.filter((order) => order.storekeeper === "Emeka - Store A")

  // const handleReleaseItems = (orderId: string) => {
  //   const order = orders.find((o) => o.id === orderId)
  //   if (!order) return

  //    const getUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  //   onUpdateOrder(orderId, {
  //     status: "delivered",
  //     storekeeper: "Emeka - Store A",
  //   })
  //   toast.success(`Items released to ${order.packager}`)
  // }

  const handleReleaseItems = async (orderId: string) => {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  const getUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const storekeeperId = getUser.id;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/store/release/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // 🔒 if using JWT
      },
      body: JSON.stringify({
        packagerId: order.packagerId,
        storekeeperId,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result) {
      toast.error(result.message || "Failed to release items");
      return;
    }
       onUpdateOrder(orderId, {
      status: "delivered",
      storekeeper:getUser.fullName ,
    })
    fetchOrders()
    fetchProducts()

    toast.success(`Items released to ${order.packager.fullName || "packager"}`);
  } catch (error) {
    console.error("Error releasing items:", error);
    toast.error("Error releasing items");
  }
};


  const handleUploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("http://localhost:3000/products/upload", {
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

  const ToggleCreateProduct = () => {
    setOpenCreateProduct((prev) => !prev)
    if (openCreateProduct) {
      setNewProduct({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        totalStock: "",
        image: "",
      })
    }
  }

  const handleVerifyReceipt = (receiptId: string) => {
    const order = orders.find((o) => o.receiptId.toLowerCase().includes(receiptId.toLowerCase()))
    if (order) {
      toast.success(`Receipt verified: ${order.receiptId} - ${order.customerName}`)
      return order
    } else {
      toast.error("Receipt not found or invalid")
      return null
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const res = await fetch("http://localhost:3000/products/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryOpen(true)
  }

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }

    const originalCategory = categories.find((cat) => cat.id === editingCategory.id)

    onPendingChange({
      type: "category_edit",
      originalItem: originalCategory,
      newItem: editingCategory,
      submittedBy: "Emeka - Store A",
    })

    setEditingCategory(null)
    setEditCategoryOpen(false)
    toast.success("Category update submitted for approval")
  }

  // const handleAddProduct = () => {
  //   if (!newProduct.name.trim() || !newProduct.price || !newProduct.category || !newProduct.totalStock) {
  //     toast.error("Please fill in all required fields")
  //     return
  //   }

  //   const product: Product = {
  //     id: (products.length + 1).toString(),
  //     name: newProduct.name.trim(),
  //     description: newProduct.description.trim(),
  //     price: Number.parseFloat(newProduct.price),
  //     category: newProduct.category || undefined,
  //     totalStock: Number.parseInt(newProduct.totalStock),
  //     availableStock: Number.parseInt(newProduct.totalStock),
  //     image: newProduct.image || undefined,
  //     createdAt: new Date(),
  //   }

  //   setProducts((prev) => [...prev, product])
  //   setNewProduct({
  //     name: "",
  //     description: "",
  //     price: "",
  //     category: "",
  //     totalStock: "",
  //     image: "",
  //   })
  //   toast.success("Product created successfully")
  // }

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.categoryId || !newProduct.totalStock) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload = {
      name: newProduct.name.trim(),
      description: newProduct.description?.trim(),
      price: Number.parseFloat(newProduct.price),
      categoryId: newProduct.categoryId, // assuming you send categoryId
      totalStock: Number.parseInt(newProduct.totalStock),
      image: newProduct.image || undefined, // or images[] if multiple
    }

    try {
      const res = await fetch("http://localhost:3000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
      toast.success("Product created successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to create product")
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setEditProductOpen(true)
  }

  const handleUpdateProduct = () => {
    if (
      !editingProduct ||
      !editingProduct.name.trim() ||
      !editingProduct.price ||
      !editingProduct.categoryId ||
      !editingProduct.totalStock
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    const originalProduct = products.find((prod) => prod.id === editingProduct.id)

    onPendingChange({
      type: "product_edit",
      originalItem: originalProduct,
      newItem: editingProduct,
      submittedBy: "Emeka - Store A",
    })

    setEditingProduct(null)
    setEditProductOpen(false)
    toast.success("Product update submitted for approval")
  }

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find((cat) => cat.id === categoryId)

    onPendingChange({
      type: "category_delete",
      originalItem: categoryToDelete,
      submittedBy: "Emeka - Store A",
    })

    toast.success("Category deletion submitted for approval")
  }

  const handleDeleteProduct = (productId: string) => {
    const productToDelete = products.find((prod) => prod.id === productId)

    onPendingChange({
      type: "product_delete",
      originalItem: productToDelete,
      submittedBy: "Emeka - Store A",
    })

    toast.success("Product deletion submitted for approval")
  }

  const handleProductImageUpdate = (productId: string, imageUrl: string) => {
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, image: imageUrl } : product)))
  }

  const handleBulkProductUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("http://localhost:3000/products/bulk-upload", {
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
      // fetchProducts()
    } catch (err: any) {
      toast.error(err.message || "Failed to upload products")
    }
  }

  const handleExportProducts = () => {
    const exportData = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
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
    a.download = `products-stock-audit-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Products exported successfully")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-indigo-600">Store Keeper Dashboard</h2>
        <Badge variant="outline" className="text-lg px-3 py-1"></Badge>
      </div>

      <Tabs defaultValue="pickups" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pickups">Item Pickups</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        <TabsContent value="pickups" className="space-y-6">
          <Card className="border-2 border-indigo-200">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-lg text-indigo-800 flex items-center gap-2">
                <Search className="h-5 w-5" />
                Receipt Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="receiptSearch">Search by Receipt ID, Customer Name, or Packager</Label>
                  <Input
                    id="receiptSearch"
                    value={receiptSearch}
                    onChange={(e) => setReceiptSearch(e.target.value)}
                    placeholder="Enter receipt ID, customer name, or packager name..."
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleVerifyReceipt(receiptSearch)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {storeOrders.map((order) => (
              <Card key={order.id} className="border-2 border-indigo-200">
                <CardHeader className="bg-indigo-50">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-indigo-800">Receipt #{order.receiptId}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-orange-100 text-orange-800">
                        <Package className="h-4 w-4 mr-1" />
                        Ready for Pickup
                      </Badge>
                      <ReceiptGenerator order={order} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Customer:</strong> {order.customerName}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-semibold">Security Check Required</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Only release items to: <strong>{order.packager.fullName}</strong>
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Items to Release:</h4>
                    <div className="space-y-1">
                      {order.OrderItem.map((orders) => (
                        <div key={orders.product.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>
                            {orders.product.name} (x{orders?.quantity})
                          </span>
                          <span className="font-semibold">
                            ₦{(orders.product?.price * orders?.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Attendee</p>
                      <p className="font-medium">{order.attendee.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Receptionist</p>
                      <p className="font-medium">{order.receptionist.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Assigned Packager</p>
                      <p className="font-medium text-red-600">{order.packager.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Value</p>
                      <p className="font-bold text-green-600">₦{order.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleReleaseItems(order.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Release Items to {order.packager.fullName}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    Verify packager identity before releasing items
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {readyForPickup.length === 0 && receiptSearch && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Results Found</h3>
                <p className="text-gray-500">No orders match your search criteria.</p>
              </CardContent>
            </Card>
          )}

          {storeOrders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Items Ready</h3>
                <p className="text-gray-500">No packaged items waiting for pickup at the moment.</p>
              </CardContent>
            </Card>
          )}
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
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  <p className="text-xs text-gray-500">
                    Products: {products.filter((p) => p.category === category.name).length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editCategoryName">Category Name *</Label>
                  <Input
                    id="editCategoryName"
                    value={editingCategory?.name || ""}
                    onChange={(e) => setEditingCategory((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    placeholder="e.g., Living Room, Bedroom"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editCategoryDescription">Description</Label>
                  <Input
                    id="editCategoryDescription"
                    value={editingCategory?.description || ""}
                    onChange={(e) =>
                      setEditingCategory((prev) => (prev ? { ...prev, description: e.target.value } : null))
                    }
                    placeholder="Brief description of category"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditCategoryOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateCategory} className="bg-blue-600 hover:bg-blue-700">
                    Update Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Products ({products.length})</CardTitle>
            <Button onClick={handleExportProducts} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export for Audit
            </Button>
          </div>
          <Card className="border-2 border-blue-200">
            {openCreateProduct ? (
              <>
                <CardHeader className="bg-blue-50" onClick={() => setOpenCreateProduct((prev) => !prev)}>
                  <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
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
                      <select
                        id="productCategory"
                        value={newProduct.categoryId}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, categoryId: e.target.value }))}
                        className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="productPrice">Price (₦) *</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
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
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            totalStock: e.target.value,
                          }))
                        }
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
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Detailed product description"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="productImage">Upload Images</Label>
                    <Input
                      type="file"
                      id="productImage"
                      name="images"
                      multiple
                      // onChange={(e) => {
                      //   const files = Array.from(e.target.files || []);
                      //   setNewProduct((prev) => ({ ...prev, images: files }));
                      // }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUploadImage(file)
                      }}
                      className="mt-1"
                    />
                  </div>

                  {newProduct.image && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      <img
                        src={newProduct.image || "/placeholder.svg"}
                        alt={newProduct.name}
                        className="rounded-lg border h-32 w-full object-cover"
                      />
                    </div>
                  )}

                  <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </CardContent>
              </>
            ) : (
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <Button
                    onClick={ToggleCreateProduct}
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  >
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

          <Input
            id="productName"
            value={newProduct.name}
            onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Luxury Sofa Set"
            className="mt-1"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
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
                        {product.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
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
                  <div className="flex gap-2">
                    <ProductImageUpload
                      productId={product.id}
                      productName={product.name}
                      currentImage={product.image}
                      onImageUpdate={handleProductImageUpdate}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editProductName">Product Name *</Label>
                    <Input
                      id="editProductName"
                      value={editingProduct?.name || ""}
                      onChange={(e) => setEditingProduct((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      placeholder="e.g., Luxury Sofa Set"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editProductCategory">Category *</Label>
                    <select
                      id="editProductCategory"
                      value={editingProduct?.categoryId || ""}
                      onChange={(e) =>
                        setEditingProduct((prev) => (prev ? { ...prev, categoryId: e.target.value } : null))
                      }
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="editProductPrice">Price (₦) *</Label>
                    <Input
                      id="editProductPrice"
                      type="number"
                      value={editingProduct?.price || ""}
                      onChange={(e) =>
                        setEditingProduct((prev) =>
                          prev ? { ...prev, price: Number.parseFloat(e.target.value) || 0 } : null,
                        )
                      }
                      placeholder="e.g., 250000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editProductStock">Total Stock *</Label>
                    <Input
                      id="editProductStock"
                      type="number"
                      value={editingProduct?.totalStock || ""}
                      onChange={(e) =>
                        setEditingProduct((prev) =>
                          prev
                            ? {
                                ...prev,
                                totalStock: Number.parseInt(e.target.value) || 0,
                                availableStock: Number.parseInt(e.target.value) || 0,
                              }
                            : null,
                        )
                      }
                      placeholder="e.g., 15"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editProductDescription">Description</Label>
                  <Textarea
                    id="editProductDescription"
                    value={editingProduct?.description || ""}
                    onChange={(e) =>
                      setEditingProduct((prev) => (prev ? { ...prev, description: e.target.value } : null))
                    }
                    placeholder="Detailed product description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="editProductImage">Image URL</Label>
                  <Input
                    id="editProductImage"
                    value={editingProduct?.image || ""}
                    onChange={(e) => setEditingProduct((prev) => (prev ? { ...prev, image: e.target.value } : null))}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditProductOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProduct} className="bg-blue-600 hover:bg-blue-700">
                    Update Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="history">
          <TransactionTable
            orders={storeOrders}
            title="Store Order History"
            showActions={true}
            onViewOrder={(order) => <ReceiptGenerator order={order} title="View Receipt" />}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StoreInterface
