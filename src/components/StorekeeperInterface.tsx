"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Package,
  Search,
  Eye,
  Receipt,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  BarChart3,
  Grid3X3,
  List,
  FileText,
  Download,
  User,
  Filter,
} from "lucide-react"
import { toast } from "sonner"
import type { Order, User } from "@/pages/Dashboard"
import { api, getAuthHeaders } from "@/lib/api"
import ReceiptGenerator from "./ReceiptGenerator"

interface StorekeeperInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  currentUser: User
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  totalStock: number
  availableStock: number
  category: string
  assignedQuantity: number
  shopAvailableQuantity: number
  shopSoldQuantity: number
  assignedAt: string
  assignmentWarehouse: {
    id: string
    name: string
    location: string
  }
  productWarehouse: {
    id: string
    name: string
    location: string
  }
}

const StorekeeperInterface = ({ orders, onUpdateOrder, currentUser }: StorekeeperInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [assignedProducts, setAssignedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")


  // Filter orders - show ALL orders for the shop, but delivery actions only for paid orders
  const myOrders = orders.filter(order => {
    // Show all orders for the shop (assuming orders are already filtered by shop in the API)
    return true
  })

  // Helper function to check if delivery actions are allowed
  const canDeliverOrder = (order: Order) => {
    // Can only deliver if payment has been processed by receptionist
    return order.paymentStatus === "paid" ||
           order.paymentStatus === "overpaid" ||
           order.paymentStatus === "confirmed"
  }

  // Filter orders by search term
  const filteredOrders = myOrders.filter(order =>
    order.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get unique categories and warehouses for filtering
  const categories = ["all", ...Array.from(new Set(assignedProducts.map(p => p.category || 'Uncategorized')))]
  const warehouses = ["all", ...Array.from(new Set(assignedProducts.map(p => p.assignmentWarehouse?.name || 'Unknown')))]

  // Filter products by search term, category, and warehouse
  const filteredProducts = assignedProducts.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" ||
      (product.category || 'Uncategorized') === selectedCategory

    const matchesWarehouse = selectedWarehouse === "all" ||
      (product.assignmentWarehouse?.name || 'Unknown') === selectedWarehouse

    return matchesSearch && matchesCategory && matchesWarehouse
  })

  // Get order statistics
  const stats = {
    totalOrders: myOrders.length,
    pendingPayment: myOrders.filter(o => o.paymentStatus === "pending" || o.paymentStatus === "partial").length,
    paidOrders: myOrders.filter(o => canDeliverOrder(o)).length,
    inProgress: myOrders.filter(o => o.status === "assigned_packager" || o.status === "packaging").length,
    pendingDelivery: myOrders.filter(o => o.status === "assigned_delivery" || o.status === "packaged").length,
    outForDelivery: myOrders.filter(o => o.status === "out_for_delivery").length,
    delivered: myOrders.filter(o => o.status === "delivered" || o.status === "picked_up").length,
    completed: myOrders.filter(o => o.status === "completed").length,
  }

  // Fetch products assigned to storekeeper's shop (same endpoint as attendee)
  const fetchAssignedProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(api.products.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const data = await response.json()
      if (data.status && data.data) {
        setAssignedProducts(data.data)
      }
    } catch (error: any) {
      console.error("Error fetching products:", error)
      toast.error(error.message || "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  // Update order status
  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`${api.orders.update(orderId)}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          updatedBy: currentUser.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update order status")
      }

      const data = await response.json()
      onUpdateOrder(orderId, {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === "delivered" && { deliveredAt: new Date() }),
      })

      toast.success(`Order ${newStatus.replace('_', ' ')} successfully`)

      // Auto-refresh by triggering a re-fetch of orders
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }
    } catch (error: any) {
      console.error("Error updating order status:", error)
      toast.error(error.message || "Failed to update order status")
    }
  }

  // ✅ Take delivery assignment for packaged orders
  const handleTakeDelivery = async (orderId: string) => {
    try {
      const response = await fetch(`${api.orders.update(orderId)}/assign-delivery`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          storekeeperId: currentUser.id,
          status: "assigned_delivery",
          assignedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to take delivery assignment")
      }

      const data = await response.json()
      onUpdateOrder(orderId, {
        status: "assigned_delivery",
        storekeeperId: currentUser.id,
        storekeeper: currentUser,
        assignedAt: new Date(),
        updatedAt: new Date(),
      })

      toast.success("Delivery assignment taken successfully!")

      // Auto-refresh by triggering a re-fetch of orders
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }
    } catch (error: any) {
      console.error("Error taking delivery assignment:", error)
      toast.error(error.message || "Failed to take delivery assignment")
    }
  }

  // Release order - Update status to completed
  const handleReleaseOrder = async (orderId: string) => {
    try {
      // const response = await fetch(`/api/orders/${orderId}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     status: "completed",
      //   }),
      // })

      const response = await fetch(api.orders.update(orderId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "completed",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to release order")
      }

      const data = await response.json()

      // Update local state
      onUpdateOrder(orderId, {
        status: "completed",
        updatedAt: new Date(),
      })

      toast.success("Order released successfully!")

      // Auto-refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }
    } catch (error: any) {
      console.error("Error releasing order:", error)
      toast.error("Failed to release order")
    }
  }
  // Mark order as delivered
  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      // const response = await fetch(`/api/orders/${orderId}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     status: "delivered",
      //   }),
      // })


      const response = await fetch(api.orders.updatePayment(orderId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "delivered",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark order as delivered")
      }

      const data = await response.json()

      // Update local state
      onUpdateOrder(orderId, {
        status: "delivered",
        updatedAt: new Date(),
      })

      toast.success("Order marked as delivered!")

      // Auto-refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }
    } catch (error: any) {
      console.error("Error marking order as delivered:", error)
      toast.error("Failed to mark order as delivered")
    }
  }









  // Generate activity log for products
  const generateProductActivityLog = () => {
    const activityData = {
      storekeeper: {
        name: currentUser.fullName,
        email: currentUser.email,
        role: currentUser.role,
      },
      products: filteredProducts.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        totalStock: product.totalStock,
        availableStock: product.availableStock,
        assignedQuantity: product.assignedQuantity,
        shopAvailableQuantity: product.shopAvailableQuantity,
        shopSoldQuantity: product.shopSoldQuantity,
        category: product.category || 'Uncategorized',
        assignmentWarehouse: product.assignmentWarehouse?.name || 'Unknown',
        productWarehouse: product.productWarehouse?.name || 'Unknown',
        assignedAt: product.assignedAt,
      })),
      summary: {
        totalProducts: filteredProducts.length,
        totalValue: filteredProducts.reduce((sum, product) => sum + (product.price * product.shopAvailableQuantity), 0),
        totalAssignedValue: filteredProducts.reduce((sum, product) => sum + (product.price * product.assignedQuantity), 0),
        lowStockItems: filteredProducts.filter(product => product.shopAvailableQuantity < 5).length,
        outOfStockItems: filteredProducts.filter(product => product.shopAvailableQuantity === 0).length,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser.fullName,
    }

    const logContent = `
PRODUCT ACTIVITY LOG
===================

Storekeeper: ${activityData.storekeeper.name} (${activityData.storekeeper.email})
Role: ${activityData.storekeeper.role}
Generated: ${new Date(activityData.generatedAt).toLocaleString()}

SUMMARY
-------
Total Products: ${activityData.summary.totalProducts}
Shop Inventory Value: ₦${activityData.summary.totalValue.toLocaleString()}
Total Assigned Value: ₦${activityData.summary.totalAssignedValue.toLocaleString()}
Low Stock Items (< 5): ${activityData.summary.lowStockItems}
Out of Stock Items: ${activityData.summary.outOfStockItems}

PRODUCT DETAILS
---------------
${activityData.products.map(product => `
Product: ${product.name}
Description: ${product.description}
Price: ₦${product.price.toLocaleString()}
Total Stock: ${product.totalStock}
Assigned Quantity: ${product.assignedQuantity}
Shop Available: ${product.shopAvailableQuantity}
Shop Sold: ${product.shopSoldQuantity}
Category: ${product.category}
Assignment Warehouse: ${product.assignmentWarehouse}
Product Warehouse: ${product.productWarehouse}
Assigned: ${new Date(product.assignedAt).toLocaleDateString()}
---
`).join('')}

Generated by: ${activityData.generatedBy}
Timestamp: ${new Date().toLocaleString()}
    `.trim()

    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-activity-log-${currentUser.fullName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Product activity log generated successfully!")
  }

  // Generate CSV download for products
  const downloadProductsCSV = () => {
    const csvHeaders = [
      'Product ID',
      'Product Name',
      'Description',
      'Category',
      'Price',
      'Total Stock',
      'Available Stock',
      'Assigned Quantity',
      'Shop Available',
      'Shop Sold',
      'Assignment Warehouse',
      'Product Warehouse',
      'Assigned Date',
      'Image URL'
    ]

    const csvData = filteredProducts.map(product => [
      product.id,
      `"${product.name}"`,
      `"${product.description}"`,
      `"${product.category || 'Uncategorized'}"`,
      product.price,
      product.totalStock,
      product.availableStock,
      product.assignedQuantity,
      product.shopAvailableQuantity,
      product.shopSoldQuantity,
      `"${product.assignmentWarehouse?.name || 'Unknown'}"`,
      `"${product.productWarehouse?.name || 'Unknown'}"`,
      new Date(product.assignedAt).toLocaleDateString(),
      `"${product.image || ''}"`
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shop-products-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Products CSV downloaded successfully!")
  }

  // Get status info
  const getStatusInfo = (status: Order["status"]) => {
    const statusConfig = {
      assigned_packager: { label: "Assigned to Packager", color: "bg-blue-100 text-blue-800", icon: User },
      packaging: { label: "Being Packaged", color: "bg-blue-100 text-blue-800", icon: Package },
      packaged: { label: "Ready for Delivery", color: "bg-purple-100 text-purple-800", icon: Package },
      assigned_delivery: { label: "Assigned for Delivery", color: "bg-blue-100 text-blue-800", icon: Truck },
      out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800", icon: Truck },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
      picked_up: { label: "Picked Up", color: "bg-green-100 text-green-800", icon: CheckCircle },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    }
    return statusConfig[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: AlertTriangle }
  }

  useEffect(() => {
    fetchAssignedProducts()
  }, [currentUser.id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Storekeeper Dashboard</h1>
          <p className="text-muted-foreground">Manage deliveries and warehouse assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {currentUser.fullName}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payment</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingPayment}</p>
              </div>
              <Clock className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Orders</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidOrders}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out for Delivery</p>
                <p className="text-2xl font-bold text-purple-600">{stats.outForDelivery}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">All Shop Orders ({stats.totalOrders})</TabsTrigger>
          <TabsTrigger value="products">Shop Products ({assignedProducts.length})</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Shop Orders</span>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Packager</TableHead>
                      <TableHead>Order Status</TableHead>

                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const statusInfo = getStatusInfo(order.status)
                      const StatusIcon = statusInfo.icon

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.receiptId}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.customerPhone || "N/A"}</TableCell>
                          <TableCell>₦{order.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              order.paymentStatus === "paid" || order.paymentStatus === "overpaid" || order.paymentStatus === "confirmed"
                                ? "bg-green-50 text-green-700"
                                : order.paymentStatus === "partial"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }>
                              {order.paymentStatus.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.packager ? (
                              <div className="text-sm">
                                <div className="font-medium">{order.packager.fullName}</div>
                                <div className="text-muted-foreground">{order.packager.email}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Order Details - {order.receiptId}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <label className="text-muted-foreground">Customer</label>
                                        <p className="font-medium">{order.customerName}</p>
                                      </div>
                                      <div>
                                        <label className="text-muted-foreground">Phone</label>
                                        <p className="font-medium">{order.customerPhone || "N/A"}</p>
                                      </div>
                                      <div>
                                        <label className="text-muted-foreground">Total</label>
                                        <p className="font-medium">₦{order.totalAmount.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <label className="text-muted-foreground">Status</label>
                                        <Badge className={statusInfo.color}>
                                          {statusInfo.label}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-muted-foreground">Products</label>
                                      <div className="space-y-2 mt-2">
                                        {order.products.map((product, index) => (
                                          <div key={index} className="flex justify-between text-sm">
                                            <span>{product.name} x{product.quantity}</span>
                                            <span>₦{((product.price || 0) * (product.quantity || 1)).toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* Action buttons for paid orders */}
                              {canDeliverOrder(order) ? (
                                <div className="flex gap-2">
                                  {/* Mark as Delivered button - for orders that are not yet delivered */}
                                  {(order.status === "assigned_packager" ||
                                    order.status === "packaging" ||
                                    order.status === "packaged" ||
                                    order.status === "picked_up" ||
                                    order.status === "out_for_delivery" ||
                                    order.status === "paid" ||
                                    order.status === "confirmed") &&
                                   order.status !== "delivered" && order.status !== "completed" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkAsDelivered(order.id)}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Truck className="h-4 w-4 mr-1" />
                                      Mark Delivered
                                    </Button>
                                  )}

                                  {/* Release Order button - for delivered orders */}
                                  {order.status === "delivered" && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleReleaseOrder(order.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Release Order
                                    </Button>
                                  )}

                                  {/* Completed status */}
                                  {order.status === "completed" && (
                                    <span className="text-sm text-green-600 font-medium">
                                      ✅ Completed
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Awaiting Payment
                                </span>
                              )}

                              <ReceiptGenerator
                                order={order}
                                currentUser={currentUser}
                                trigger={
                                  <Button size="sm" variant="outline">
                                    <Receipt className="h-4 w-4 mr-1" />
                                    Receipt
                                  </Button>
                                }
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Orders Found</h3>
                  <p>
                    {searchTerm
                      ? `No orders match "${searchTerm}". Try adjusting your search.`
                      : "No orders available for this shop."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shop Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Shop Products
                </div>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === "table" ? "default" : "ghost"}
                      onClick={() => setViewMode("table")}
                      className="h-8 px-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      onClick={() => setViewMode("cards")}
                      className="h-8 px-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Generate Activity Log */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateProductActivityLog}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    Activity Log
                  </Button>

                  {/* Download CSV */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadProductsCSV}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </CardTitle>

              {/* Search and Filter Controls */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Warehouse Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Warehouse:</span>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse} value={warehouse}>
                          {warehouse === "all" ? "All Warehouses" : warehouse}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {(selectedCategory !== "all" || selectedWarehouse !== "all" || searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all")
                      setSelectedWarehouse("all")
                      setSearchTerm("")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Summary */}
              {(selectedCategory !== "all" || selectedWarehouse !== "all" || searchTerm) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Active Filters:</span>
                    {searchTerm && (
                      <Badge variant="secondary">Search: "{searchTerm}"</Badge>
                    )}
                    {selectedCategory !== "all" && (
                      <Badge variant="secondary">Category: {selectedCategory}</Badge>
                    )}
                    {selectedWarehouse !== "all" && (
                      <Badge variant="secondary">Warehouse: {selectedWarehouse}</Badge>
                    )}
                    <span className="text-muted-foreground">
                      ({filteredProducts.length} of {assignedProducts.length} products)
                    </span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading shop products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                viewMode === "table" ? (
                  /* Table View */
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead>Shop Available</TableHead>
                          <TableHead>Shop Sold</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      e.currentTarget.nextElementSibling.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs" style={{ display: product.image ? 'none' : 'flex' }}>
                                  <Package className="h-6 w-6" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">{product.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>{product.category || 'Uncategorized'}</TableCell>
                            <TableCell>₦{product.price.toLocaleString()}</TableCell>
                            <TableCell>{product.assignedQuantity}</TableCell>
                            <TableCell>
                              <Badge variant={product.shopAvailableQuantity > 0 ? "default" : "destructive"}>
                                {product.shopAvailableQuantity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {product.shopSoldQuantity}
                              </Badge>
                            </TableCell>
                            <TableCell>{product.assignmentWarehouse?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                product.shopAvailableQuantity === 0
                                  ? "bg-red-50 text-red-700"
                                  : product.shopAvailableQuantity < 5
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-green-50 text-green-700"
                              }>
                                {product.shopAvailableQuantity === 0
                                  ? "Out of Stock"
                                  : product.shopAvailableQuantity < 5
                                  ? "Low Stock"
                                  : "In Stock"
                                }
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  /* Card View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          {/* Product Image */}
                          <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 mb-3 flex items-center justify-center">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: product.image ? 'none' : 'flex' }}>
                              <Package className="h-12 w-12" />
                            </div>
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{product.name}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                            </div>
                            <Badge variant="outline" className={
                              product.shopAvailableQuantity === 0
                                ? "bg-red-50 text-red-700"
                                : product.shopAvailableQuantity < 5
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-green-50 text-green-700"
                            }>
                              {product.shopAvailableQuantity === 0
                                ? "Out of Stock"
                                : product.shopAvailableQuantity < 5
                                ? "Low Stock"
                                : "In Stock"
                              }
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Stock Information */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-blue-50 p-2 rounded text-center">
                              <div className="text-blue-600 font-medium text-xs">Assigned</div>
                              <div className="text-blue-800 font-bold">{product.assignedQuantity}</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-center">
                              <div className="text-green-600 font-medium text-xs">Available</div>
                              <div className="text-green-800 font-bold">{product.shopAvailableQuantity}</div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded text-center">
                              <div className="text-purple-600 font-medium text-xs">Sold</div>
                              <div className="text-purple-800 font-bold">{product.shopSoldQuantity}</div>
                            </div>
                          </div>

                          {/* Price Information */}
                          <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="text-gray-600 font-medium text-xs">Price</div>
                            <div className="text-gray-800 font-bold text-lg">₦{product.price.toLocaleString()}</div>
                          </div>

                          {/* Product Details */}
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Category:</span>
                              <span>{product.category || 'Uncategorized'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Assignment Warehouse:</span>
                              <span>{product.assignmentWarehouse?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Product Warehouse:</span>
                              <span>{product.productWarehouse?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Assigned:</span>
                              <span>{new Date(product.assignedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Products Found</h3>
                  <p>
                    {(searchTerm || selectedCategory !== "all" || selectedWarehouse !== "all")
                      ? "No products match your current filters. Try adjusting your search criteria."
                      : "No products are currently available in your shop."
                    }
                  </p>
                  {(searchTerm || selectedCategory !== "all" || selectedWarehouse !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory("all")
                        setSelectedWarehouse("all")
                        setSearchTerm("")
                      }}
                      className="mt-4"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


    </div>
  )
}

export default StorekeeperInterface
