"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Eye,
  Download,
  Search,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  LayoutGrid,
  List,
  Calendar,
  User,
  Phone,
  CreditCard,
  Package,
  Plus,
  Upload,
  Warehouse,
  Tag,
  Edit,
  Trash2,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import OrderWorkflow from "./OrderWorkflow"
import UserManagement from "./UserManagement"
import ShopManagement from "./ShopManagement"
import { api, getAuthHeaders } from "@/lib/api"
import WarehouseManagement from "./WarehouseManagement"
import ReportsInterface from "./ReportsInterface"
import ProductAssignmentManager from "./ProductAssignmentManager"
import FileUpload from "./FileUpload"
import type { Order, UserRole, PendingChange, Warehouse as WarehouseType, User } from "@/pages/Dashboard"

interface AdminInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  currentRole: UserRole
  currentUser: User
  pendingChanges: PendingChange[]
  onApprovePendingChange: (changeId: string) => void
  onRejectPendingChange: (changeId: string) => void
  onLogActivity: (action: string, details: string) => void
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
  category?: string
  categoryId?: string
  totalStock: number
  availableStock: number
  image?: string
  createdAt: Date
  warehouseId: string
  warehouse?: WarehouseType
}

const AdminInterface = ({
  orders,
  onUpdateOrder,
  currentRole,
  currentUser,
  pendingChanges,
  onApprovePendingChange,
  onRejectPendingChange,
  onLogActivity,
}: AdminInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "workflow">("table")

  // Product management state
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [openCreateProduct, setOpenCreateProduct] = useState(false)
  const [openCreateCategory, setOpenCreateCategory] = useState(false)
  const [openBulkUpload, setOpenBulkUpload] = useState(false)
  const [openEditProduct, setOpenEditProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState("")
  const [categorySearchTerm, setCategorySearchTerm] = useState("")

  // Product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    totalStock: "",
    warehouseId: "",
    image: "",
  })

  // Category form state
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  })

  // Fetch data functions
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

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(api.warehouses.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch warehouses")
      }

      const json = await res.json()

      if (!json.status || !json.data) {
        throw new Error(json.message || "Invalid warehouse data")
      }

      const parsedWarehouses = json.data.map((warehouse: any) => ({
        ...warehouse,
        createdAt: new Date(warehouse.createdAt),
      }))

      setWarehouses(parsedWarehouses)
    } catch (error: any) {
      toast.error(error.message || "Error loading warehouses")
    }
  }

  // Initialize data
  useState(() => {
    fetchCategories()
    fetchProducts()
    fetchWarehouses()
  })

  // Product management functions
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
      setOpenCreateCategory(false)
      toast.success("Category created successfully")
    } catch (error: any) {
      toast.error(error.message || "Error creating category")
    }
  }

  const handleAddProduct = async () => {
    if (
      !newProduct.name.trim() ||
      !newProduct.price ||
      !newProduct.categoryId ||
      !newProduct.totalStock ||
      !newProduct.warehouseId
    ) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload = {
      name: newProduct.name.trim(),
      description: newProduct.description?.trim(),
      price: Number.parseFloat(newProduct.price),
      categoryId: newProduct.categoryId,
      totalStock: Number.parseInt(newProduct.totalStock),
      warehouseId: newProduct.warehouseId,
      image: newProduct.image || undefined,
    }

    try {
      const res = await fetch(api.products.warehouse.create, {
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
        warehouseId: "",
        image: "",
      })
      setOpenCreateProduct(false)
      toast.success("Product created successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to create product")
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
      toast.success(`Successfully uploaded ${result.count || result.data?.length || 0} products`)

      // Refresh products list
      fetchProducts()
      setOpenBulkUpload(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to upload products")
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId || "",
      totalStock: product.totalStock.toString(),
      warehouseId: product.warehouseId,
      image: product.image || "",
    })
    setOpenEditProduct(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    if (!newProduct.name.trim() || !newProduct.price || !newProduct.totalStock || !newProduct.categoryId || !newProduct.warehouseId) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: parseFloat(newProduct.price),
        categoryId: newProduct.categoryId,
        totalStock: parseInt(newProduct.totalStock),
        warehouseId: newProduct.warehouseId,
        image: newProduct.image || undefined,
      }

      const res = await fetch(api.products.update(editingProduct.id), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to update product")
      }

      toast.success("Product updated successfully")

      // Refresh products list
      fetchProducts()

      // Reset form and close dialog
      setNewProduct({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        totalStock: "",
        warehouseId: "",
        image: "",
      })
      setEditingProduct(null)
      setOpenEditProduct(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to update product")
    }
  }

  const handleDownloadTemplate = () => {
    // Create CSV template with headers and sample data
    const templateData = [
      // Headers
      ["name", "description", "price", "categoryId", "warehouseId", "totalStock", "availableStock", "image"],
      // Sample data rows with realistic examples
      ["Samsung Galaxy S24", "Latest flagship smartphone with advanced camera", "850000", categories[0]?.id || "category-id-here", warehouses[0]?.id || "warehouse-id-here", "50", "50", "https://example.com/samsung-s24.jpg"],
      ["MacBook Pro 16", "High-performance laptop for professionals", "1200000", categories[0]?.id || "category-id-here", warehouses[0]?.id || "warehouse-id-here", "25", "20", "https://example.com/macbook-pro.jpg"],
      ["Office Chair", "Ergonomic office chair with lumbar support", "75000", categories[1]?.id || "category-id-here", warehouses[1]?.id || "warehouse-id-here", "100", "85", "https://example.com/office-chair.jpg"],
      // Empty rows for user to fill
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
    ]

    const csvContent = templateData.map(row =>
      row.map(cell =>
        // Escape cells that contain commas or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(",")
    ).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bulk-upload-template-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("CSV template downloaded successfully")
  }

  const handleExportProducts = () => {
    const exportData = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      totalStock: product.totalStock,
      availableStock: product.availableStock,
      warehouse: product.warehouse?.name || "Unknown",
      createdAt: product.createdAt.toISOString(),
    }))

    const csvContent = [
      Object.keys(exportData[0] || {}).join(","),
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

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard`)
    } catch (err) {
      toast.error("Failed to copy to clipboard")
    }
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(productSearchTerm.toLowerCase())
    const matchesWarehouse = warehouseFilter === "all" || product.warehouseId === warehouseFilter
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter

    return matchesSearch && matchesWarehouse && matchesCategory
  })

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm))

      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter

      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [searchTerm, statusFilter, paymentFilter, orders])

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalPaid = orders.reduce((sum, order) => sum + (order.paidAmount || order.totalAmount), 0)
    const pendingPayments = orders.filter(
      (order) => order.paymentStatus === "partial" || order.paymentStatus === "pending",
    ).length
    const completedOrders = orders.filter((order) => order.status === "delivered").length
    const partialPaymentRevenue = orders
      .filter((order) => order.paymentStatus === "partial")
      .reduce((sum, order) => sum + (order.paidAmount || 0), 0)
    const outstandingBalance = orders
      .filter((order) => order.paymentStatus === "partial")
      .reduce((sum, order) => sum + (order.balanceAmount || 0), 0)

    return {
      totalOrders,
      totalRevenue,
      totalPaid,
      pendingPayments,
      completedOrders,
      partialPaymentRevenue,
      outstandingBalance,
    }
  }, [orders])

  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      pending_payment: {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        text: "Pending Payment",
      },
      paid: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", text: "Paid" },
      assigned_packager: {
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        text: "Assigned",
      },
      packaged: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", text: "Packaged" },
      picked_up: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", text: "Picked Up" },
      delivered: {
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
        text: "Delivered",
      },
    }

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      text: "Unknown",
    }
    return <Badge className={config.color}>{config.text}</Badge>
  }

  const getPaymentStatusBadge = (paymentStatus: Order["paymentStatus"]) => {
    const statusConfig = {
      pending: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Pending", icon: XCircle },
      partial: {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        text: "Partial",
        icon: AlertCircle,
      },
      confirmed: {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        text: "Confirmed",
        icon: CheckCircle,
      },
    }

    const config = statusConfig[paymentStatus] || {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      text: "Unknown",
      icon: XCircle,
    }
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const exportOrders = () => {
    // In a real app, this would generate and download a CSV/Excel file
    toast.success("Orders exported successfully!")
  }

  const handleApproveChange = (changeId: string) => {
    onApprovePendingChange(changeId)
    toast.success("Change approved successfully")
  }

  const handleRejectChange = (changeId: string) => {
    onRejectPendingChange(changeId)
    toast.success("Change rejected")
  }

  const getChangeTypeText = (type: PendingChange["type"]) => {
    switch (type) {
      case "category_edit":
        return "Category Edit"
      case "category_delete":
        return "Category Delete"
      case "product_edit":
        return "Product Edit"
      case "product_delete":
        return "Product Delete"
      default:
        return "Unknown Change"
    }
  }

  const getChangeDescription = (change: PendingChange) => {
    switch (change.type) {
      case "category_edit":
        return `Edit "${change.originalItem?.name}" category`
      case "category_delete":
        return `Delete "${change.originalItem?.name}" category`
      case "product_edit":
        return `Edit "${change.originalItem?.name}" product`
      case "product_delete":
        return `Delete "${change.originalItem?.name}" product`
      default:
        return "Unknown change"
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">{currentRole} Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground break-words">Manage your business operations and monitor performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {pendingChanges.filter((c) => c.status === "pending").length > 0 && (
            <Badge variant="destructive" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
              {pendingChanges.filter((c) => c.status === "pending").length} Pending Approvals
            </Badge>
          )}
          <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-3 py-1">
            Full Access
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white dark:from-green-600 dark:to-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-green-200">{formatCurrency(stats.totalPaid)} collected</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white dark:from-yellow-600 dark:to-yellow-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-100">Partial Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.partialPaymentRevenue)}</div>
            <p className="text-xs text-yellow-200">{formatCurrency(stats.outstandingBalance)} outstanding</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-blue-200">{stats.completedOrders} completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white dark:from-purple-600 dark:to-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue > 0 ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(1) : 0}%
            </div>
            <Progress
              value={stats.totalRevenue > 0 ? (stats.totalPaid / stats.totalRevenue) * 100 : 0}
              className="mt-2 bg-purple-400"
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-3 md:space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
          <TabsTrigger value="orders" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Orders</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Products</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Assignments</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Users</TabsTrigger>
          <TabsTrigger value="shops" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Shops</TabsTrigger>
          <TabsTrigger value="warehouse" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Warehouse</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm px-1 sm:px-3 py-2">Reports</TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs sm:text-sm px-1 sm:px-3 py-2 relative">
            <span className="hidden sm:inline">Approvals</span>
            <span className="sm:hidden">Approve</span>
            {pendingChanges.filter((c) => c.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1 py-0 min-w-4 h-4 flex items-center justify-center">
                {pendingChanges.filter((c) => c.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 md:space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl break-words">All Orders ({filteredOrders.length})</CardTitle>
                  <CardDescription className="text-sm break-words">Complete overview of all orders with payment tracking</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor="view-mode" className="text-xs sm:text-sm font-medium hidden sm:block">
                      View:
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Table
                      </Button>
                      <Button
                        variant={viewMode === "workflow" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("workflow")}
                        className="text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Workflow
                      </Button>
                    </div>
                  </div>
                  <Button onClick={exportOrders} variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders, customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 sm:pl-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] text-sm">
                      <SelectValue placeholder="Order Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending_payment">Pending Payment</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="assigned_packager">Assigned</SelectItem>
                      <SelectItem value="packaged">Packaged</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] text-sm">
                      <SelectValue placeholder="Payment Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional Rendering based on view mode */}
              {viewMode === "table" ? (
                /* Orders Table */
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Order Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Attendee</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {order.paymentStatus === "partial" && (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              )}
                              {order.receiptId}
                            </div>
                          </TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.customerPhone || "N/A"}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(order.paidAmount || order.totalAmount)}
                          </TableCell>
                          <TableCell
                            className={`font-medium ${(order.balanceAmount || 0) > 0 ? "text-red-600" : "text-muted-foreground"}`}
                          >
                            {formatCurrency(order.balanceAmount || 0)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getPaymentStatusBadge(order.paymentStatus)}
                              {order.paymentStatus === "partial" && (
                                <div className="w-full">
                                  <Progress
                                    value={((order.paidAmount || 0) / order.totalAmount) * 100}
                                    className="h-2"
                                  />
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatCurrency(order.balanceAmount || 0)} remaining
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.paymentMethod ? (
                              <Badge variant="outline" className="capitalize">
                                {order.paymentMethod.replace("_", " ")}
                              </Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{order.attendee?.fullName || "N/A"}</div>
                              <div className="text-muted-foreground">{order.attendee?.username || ""}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(order.createdAt)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Order Details - {order.receiptId}</DialogTitle>
                                  <DialogDescription>Complete order information and payment history</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Customer Information */}
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">Customer Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{order.customerName}</span>
                                      </div>
                                      {order.customerPhone && (
                                        <div className="flex items-center space-x-2">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span>{order.customerPhone}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(order.createdAt)}</span>
                                      </div>
                                      {order.paymentMethod && (
                                        <div className="flex items-center space-x-2">
                                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                                          <Badge variant="outline">
                                            {order.paymentMethod.replace("_", " ").toUpperCase()}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Order Items */}
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">Order Items</h3>
                                    <div className="space-y-2">
                                      {order.products?.map((product, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                        >
                                          <div className="flex items-center space-x-3">
                                            {product.image && (
                                              <img
                                                src={product.image || "/placeholder.svg"}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded"
                                                onError={(e) => {
                                                  e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                                                }}
                                              />
                                            )}
                                            <div>
                                              <p className="font-medium">{product.name}</p>
                                              <p className="text-sm text-muted-foreground">{product.category}</p>
                                              <p className="text-sm text-muted-foreground">Qty: {product.quantity}</p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(product.price)}</p>
                                            <p className="text-sm text-muted-foreground">
                                              Total: {formatCurrency(product.price * product.quantity)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Payment Summary */}
                                  <div className="bg-muted p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">Payment Summary</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>Total Amount:</span>
                                        <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Paid Amount:</span>
                                        <span className="font-medium text-green-600">
                                          {formatCurrency(order.paidAmount || order.totalAmount)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-t pt-2">
                                        <span>Outstanding Balance:</span>
                                        <span className="font-medium text-orange-600">
                                          {formatCurrency(order.balanceAmount || 0)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Payment Status:</span>
                                        {getPaymentStatusBadge(order.paymentStatus)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Staff Information */}
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold">Staff Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Sales Attendee</p>
                                        <p className="font-medium">{order.attendee?.fullName || "Not assigned"}</p>
                                      </div>
                                      {order.receptionist && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">Receptionist</p>
                                          <p className="font-medium">{order.receptionist.fullName}</p>
                                        </div>
                                      )}
                                      {order.packager && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">Packager</p>
                                          <p className="font-medium">{order.packager.fullName}</p>
                                        </div>
                                      )}
                                      {order.storekeeper && (
                                        <div>
                                          <p className="text-sm text-muted-foreground">Storekeeper</p>
                                          <p className="font-medium">{order.storekeeper.fullName}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* Workflow View */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredOrders.map((order) => (
                    <OrderWorkflow key={order.id} order={order} />
                  ))}
                </div>
              )}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Orders Found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold break-words">Product Management</h3>
              <p className="text-sm md:text-base text-muted-foreground break-words">Manage warehouse products and categories</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setOpenCreateCategory(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
                <Tag className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add </span>Category
              </Button>
              <Button onClick={() => setOpenBulkUpload(true)} variant="outline" size="sm" className="text-xs sm:text-sm">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Bulk </span>Upload
              </Button>
              <Button onClick={() => setOpenCreateProduct(true)} size="sm" className="text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add </span>Product
              </Button>
            </div>
          </div>

          {/* Product Statistics */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{products.length}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Products</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{categories.length}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Categories</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">
                    {products.reduce((sum, p) => sum + p.totalStock, 0)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Stock</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{warehouses.length}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Warehouses</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <CardTitle className="text-lg sm:text-xl break-words">Products ({filteredProducts.length})</CardTitle>
                <Button onClick={handleExportProducts} variant="outline" size="sm" className="text-xs sm:text-sm">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-7 sm:pl-8 text-sm"
                    />
                  </div>
                </div>
                <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Warehouses</SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid */}
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
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {product.category}
                            </Badge>
                            <Badge variant="outline">
                              <Warehouse className="h-3 w-3 mr-1" />
                              {product.warehouse?.name || "Unknown"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Products Found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <ProductAssignmentManager
            currentUser={currentUser}
            onLogActivity={onLogActivity}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="shops">
          <ShopManagement />
        </TabsContent>

        <TabsContent value="warehouse">
          <WarehouseManagement />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsInterface />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Pending Approvals</h3>
            <Badge variant="outline">{pendingChanges.filter((c) => c.status === "pending").length} pending</Badge>
          </div>

          {pendingChanges.filter((c) => c.status === "pending").length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No Pending Approvals</h3>
                <p className="text-muted-foreground">All changes have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingChanges
                .filter((change) => change.status === "pending")
                .map((change) => (
                  <Card key={change.id} className="border-2 border-orange-200 dark:border-orange-800">
                    <CardHeader className="bg-orange-50 dark:bg-orange-950">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                          {getChangeTypeText(change.type)}
                        </CardTitle>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Pending Review
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Submitted by:</strong> {change.submittedBy}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Date:</strong> {change.submittedAt.toLocaleDateString()}
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Change Description:</h4>
                        <p className="text-sm text-muted-foreground">{getChangeDescription(change)}</p>
                      </div>

                      {change.type.includes("edit") && change.newItem && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Proposed Changes:</h4>
                          <div className="space-y-1 text-sm">
                            <div>
                              <strong>Name:</strong> {change.originalItem?.name} → {change.newItem?.name}
                            </div>
                            {change.newItem?.description && (
                              <div>
                                <strong>Description:</strong> {change.originalItem?.description} →{" "}
                                {change.newItem?.description}
                              </div>
                            )}
                            {change.newItem?.price && (
                              <div>
                                <strong>Price:</strong> {formatCurrency(change.originalItem?.price || 0)} →{" "}
                                {formatCurrency(change.newItem?.price)}
                              </div>
                            )}
                            {change.newItem?.totalStock && (
                              <div>
                                <strong>Stock:</strong> {change.originalItem?.totalStock} → {change.newItem?.totalStock}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveChange(change.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectChange(change.id)}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Show recent approved/rejected changes */}
          {pendingChanges.filter((c) => c.status !== "pending").length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Recent Decisions</h4>
              <div className="space-y-2">
                {pendingChanges
                  .filter((change) => change.status !== "pending")
                  .slice(0, 5)
                  .map((change) => (
                    <div key={change.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <span className="text-sm">{getChangeDescription(change)}</span>
                      <Badge variant={change.status === "approved" ? "default" : "secondary"}>{change.status}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Product Dialog */}
      <Dialog open={openCreateProduct} onOpenChange={setOpenCreateProduct}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
            <DialogDescription>Add a new product to the warehouse inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label htmlFor="productWarehouse">Warehouse *</Label>
                <Select
                  value={newProduct.warehouseId}
                  onValueChange={(value) => setNewProduct((prev) => ({ ...prev, warehouseId: value }))}
                >
                  <SelectTrigger className="mt-1">
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
                accept="image/*"
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

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenCreateProduct(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={openEditProduct} onOpenChange={setOpenEditProduct}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editProductName">Product Name *</Label>
                <Input
                  id="editProductName"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Luxury Sofa Set"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editProductPrice">Price (₦) *</Label>
                <Input
                  id="editProductPrice"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="e.g., 150000"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editProductDescription">Description</Label>
              <Textarea
                id="editProductDescription"
                value={newProduct.description}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed product description"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="editProductCategory">Category *</Label>
                <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct((prev) => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editProductStock">Total Stock *</Label>
                <Input
                  id="editProductStock"
                  type="number"
                  value={newProduct.totalStock}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, totalStock: e.target.value }))}
                  placeholder="e.g., 50"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editProductWarehouse">Warehouse *</Label>
                <Select value={newProduct.warehouseId} onValueChange={(value) => setNewProduct((prev) => ({ ...prev, warehouseId: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editProductImageUrl">Product Image URL</Label>
                <Input
                  id="editProductImageUrl"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>

              <div className="text-center text-gray-500">
                <span>OR</span>
              </div>

              <div>
                <Label htmlFor="editProductImageFile">Upload New Image</Label>
                <Input
                  type="file"
                  id="editProductImageFile"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadImage(file)
                  }}
                  className="mt-1"
                  accept="image/*"
                />
              </div>

              {newProduct.image && (
                <div className="mt-4">
                  <Label>Current Image Preview</Label>
                  <div className="mt-2 flex items-start gap-3">
                    <img
                      src={newProduct.image || "/placeholder.svg"}
                      alt="Product preview"
                      className="rounded-lg border h-32 w-32 object-cover"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewProduct((prev) => ({ ...prev, image: "" }))}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove Image
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenEditProduct(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Update Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={openCreateCategory} onOpenChange={setOpenCreateCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>Add a new product category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
              <Textarea
                id="categoryDescription"
                value={newCategory.description}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of category"
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenCreateCategory(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} className="bg-green-600 hover:bg-green-700">
                <Tag className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={openBulkUpload} onOpenChange={setOpenBulkUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Product Upload</DialogTitle>
            <DialogDescription>Upload multiple products using CSV or Excel file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">File Format Requirements:</h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>• CSV or Excel (.xlsx) format</p>
                <p>• Required columns: name, price, categoryId, warehouseId, totalStock, availableStock</p>
                <p>• Optional columns: description, image</p>
                <p>• First row should contain column headers</p>
                <p>• availableStock should be ≤ totalStock</p>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </div>

            {/* Warehouse IDs Reference */}
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-800 dark:text-green-200">Available Warehouse IDs ({warehouses.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = warehouses.map(w => w.id).join(', ')
                    handleCopyToClipboard(allIds, "All Warehouse IDs")
                  }}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>

              {warehouses.length > 5 && (
                <div className="mb-3">
                  <Input
                    placeholder="Search warehouses..."
                    value={warehouseSearchTerm}
                    onChange={(e) => setWarehouseSearchTerm(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {warehouses
                  .filter(warehouse =>
                    warehouse.name.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
                    warehouse.location.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
                    warehouse.id.toLowerCase().includes(warehouseSearchTerm.toLowerCase())
                  )
                  .map((warehouse) => (
                    <div key={warehouse.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{warehouse.name}</div>
                        <div className="text-xs text-gray-500 truncate">{warehouse.location}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono max-w-24 truncate">
                          {warehouse.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(warehouse.id, `${warehouse.name} ID`)}
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 flex-shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {warehouses.filter(warehouse =>
                  warehouse.name.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
                  warehouse.location.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
                  warehouse.id.toLowerCase().includes(warehouseSearchTerm.toLowerCase())
                ).length === 0 && warehouseSearchTerm && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No warehouses found matching "{warehouseSearchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Category IDs Reference */}
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">Available Category IDs ({categories.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = categories.map(c => c.id).join(', ')
                    handleCopyToClipboard(allIds, "All Category IDs")
                  }}
                  className="text-purple-700 border-purple-300 hover:bg-purple-100"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>

              {categories.length > 5 && (
                <div className="mb-3">
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}

              <div className="space-y-1 max-h-40 overflow-y-auto">
                {categories
                  .filter(category =>
                    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                    category.description.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                    category.id.toLowerCase().includes(categorySearchTerm.toLowerCase())
                  )
                  .map((category) => (
                    <div key={category.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{category.name}</div>
                        <div className="text-xs text-gray-500 truncate">{category.description}</div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono max-w-24 truncate">
                          {category.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(category.id, `${category.name} ID`)}
                          className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-100 flex-shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {categories.filter(category =>
                  category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                  category.description.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
                  category.id.toLowerCase().includes(categorySearchTerm.toLowerCase())
                ).length === 0 && categorySearchTerm && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No categories found matching "{categorySearchTerm}"
                  </div>
                )}
              </div>
            </div>

            <FileUpload
              onFileUpload={handleBulkProductUpload}
              acceptedTypes=".csv,.xlsx"
              label="Upload Products File"
              description="Select CSV or Excel file with product data"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpenBulkUpload(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminInterface
