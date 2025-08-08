"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Search,
  TrendingDown,
  Warehouse,
  ShoppingCart,
  DollarSign,
} from "lucide-react"
import { toast } from "sonner"
import type { Order, User } from "@/pages/Dashboard"
import MyShopProducts from "./MyShopProducts"

interface StoreInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  onPendingChange?: (change: any) => void
  currentUser?: User
}

// Mock inventory data
const mockInventory = [
  {
    id: "INV-001",
    name: "Modern Sofa Set",
    category: "Living Room",
    currentStock: 5,
    reservedStock: 2,
    availableStock: 3,
    reorderLevel: 2,
    price: 150000,
    location: "Warehouse A-1",
    lastRestocked: new Date("2024-01-10"),
  },
  {
    id: "INV-002",
    name: "Dining Table",
    category: "Dining Room",
    currentStock: 0,
    reservedStock: 1,
    availableStock: 0,
    reorderLevel: 1,
    price: 85000,
    location: "Warehouse B-2",
    lastRestocked: new Date("2024-01-05"),
  },
  {
    id: "INV-003",
    name: "Office Chair",
    category: "Office",
    currentStock: 15,
    reservedStock: 3,
    availableStock: 12,
    reorderLevel: 5,
    price: 25000,
    location: "Warehouse C-1",
    lastRestocked: new Date("2024-01-15"),
  },
  {
    id: "INV-004",
    name: "Bedroom Set",
    category: "Bedroom",
    currentStock: 3,
    reservedStock: 2,
    availableStock: 1,
    reorderLevel: 2,
    price: 200000,
    location: "Warehouse A-2",
    lastRestocked: new Date("2024-01-12"),
  },
]

const StoreInterface = ({ orders, onUpdateOrder, onPendingChange, currentUser }: StoreInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")

  // Filter orders that need fulfillment
  const fulfillmentOrders = orders.filter(
    (order) => order.status === "paid" || order.status === "assigned_packager" || order.status === "packaged",
  )

  // Filter inventory based on search and filters
  const filteredInventory = useMemo(() => {
    return mockInventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && item.availableStock <= item.reorderLevel) ||
        (stockFilter === "out" && item.availableStock === 0) ||
        (stockFilter === "available" && item.availableStock > item.reorderLevel)

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [searchTerm, categoryFilter, stockFilter])

  const getStockStatusBadge = (item: (typeof mockInventory)[0]) => {
    if (item.availableStock === 0) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Out of Stock
        </Badge>
      )
    } else if (item.availableStock <= item.reorderLevel) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <TrendingDown className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          In Stock
        </Badge>
      )
    }
  }

  const getOrderStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      paid: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        text: "Ready to Pack",
        icon: Clock,
      },
      assigned_packager: {
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        text: "Being Packed",
        icon: Package,
      },
      packaged: {
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        text: "Ready for Pickup",
        icon: CheckCircle,
      },
    }

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      text: "Unknown",
      icon: Clock,
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

  const stats = {
    totalItems: mockInventory.length,
    lowStockItems: mockInventory.filter((item) => item.availableStock <= item.reorderLevel && item.availableStock > 0)
      .length,
    outOfStockItems: mockInventory.filter((item) => item.availableStock === 0).length,
    totalValue: mockInventory.reduce((sum, item) => sum + item.currentStock * item.price, 0),
    pendingFulfillment: fulfillmentOrders.length,
    reservedStock: mockInventory.reduce((sum, item) => sum + item.reservedStock, 0),
  }

  const handleStockUpdate = (itemId: string, newStock: number) => {
    // In a real app, this would update the inventory
    toast.success(`Stock updated for item ${itemId}`)
  }

  const handleOrderFulfillment = (orderId: string, action: "release" | "hold") => {
    if (action === "release") {
      onUpdateOrder(orderId, { status: "packaged" })
      toast.success("Items released for packaging")
    } else {
      toast.success("Order put on hold")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Store Management</h2>
          <p className="text-muted-foreground">Manage inventory and fulfill orders</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Storekeeper Access
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-blue-200">{stats.reservedStock} reserved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white dark:from-yellow-600 dark:to-yellow-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-100">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems}</div>
            <p className="text-xs text-yellow-200">Items need restocking</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white dark:from-red-600 dark:to-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outOfStockItems}</div>
            <p className="text-xs text-red-200">Items unavailable</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white dark:from-green-600 dark:to-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-green-200">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory ({stats.totalItems})</TabsTrigger>
          <TabsTrigger value="fulfillment">Order Fulfillment ({stats.pendingFulfillment})</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts ({stats.lowStockItems + stats.outOfStockItems})</TabsTrigger>
          <TabsTrigger value="shop-products">My Shop Products</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>Monitor and manage your inventory levels</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search inventory..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Living Room">Living Room</SelectItem>
                    <SelectItem value="Dining Room">Dining Room</SelectItem>
                    <SelectItem value="Bedroom">Bedroom</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="available">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Inventory Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="font-semibold">{item.currentStock}</TableCell>
                        <TableCell className="text-orange-600">{item.reservedStock}</TableCell>
                        <TableCell className="font-semibold text-green-600">{item.availableStock}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{getStockStatusBadge(item)}</TableCell>
                        <TableCell className="text-sm">{item.location}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.currentStock * item.price)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Item Details - {item.name}</DialogTitle>
                                <DialogDescription>Complete inventory information</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Item ID</label>
                                    <p className="text-sm">{item.id}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <p className="text-sm">{item.category}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Unit Price</label>
                                    <p className="text-sm font-semibold">{formatCurrency(item.price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Location</label>
                                    <p className="text-sm">{item.location}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Last Restocked</label>
                                    <p className="text-sm">{item.lastRestocked.toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">{getStockStatusBadge(item)}</div>
                                  </div>
                                </div>

                                <div className="bg-muted p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">Stock Information</h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Current Stock:</span>
                                      <span className="font-medium">{item.currentStock} units</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>Reserved:</span>
                                      <span className="font-medium text-orange-600">{item.reservedStock} units</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>Available:</span>
                                      <span className="font-medium text-green-600">{item.availableStock} units</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span>Total Value:</span>
                                      <span className="font-semibold">
                                        {formatCurrency(item.currentStock * item.price)}
                                      </span>
                                    </div>
                                  </div>

                                  {item.availableStock <= item.reorderLevel && (
                                    <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                          {item.availableStock === 0
                                            ? "Out of stock - Reorder immediately"
                                            : "Low stock - Consider restocking"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
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

              {filteredInventory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Warehouse className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Items Found</h3>
                  <p>No inventory items match your search criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Fulfillment</CardTitle>
              <CardDescription>Process orders and release items for packaging</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fulfillmentOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{order.receiptId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.products?.length || 0} item{(order.products?.length || 0) > 1 ? "s" : ""}
                            {order.products && order.products.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {order.products[0].name}
                                {order.products.length > 1 && ` +${order.products.length - 1} more`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.paymentStatus === "confirmed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }
                          >
                            {order.paymentStatus === "confirmed" ? "Paid" : "Partial"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.paymentStatus === "partial"
                                ? "destructive"
                                : order.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {order.paymentStatus === "partial"
                              ? "High"
                              : order.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)
                                ? "Medium"
                                : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleOrderFulfillment(order.id, "release")}
                              disabled={order.status === "packaged"}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {order.status === "packaged" ? "Released" : "Release"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {fulfillmentOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Orders to Fulfill</h3>
                  <p>All orders have been processed or are awaiting payment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Out of Stock Items */}
                {mockInventory.filter((item) => item.availableStock === 0).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3">
                      Out of Stock ({mockInventory.filter((item) => item.availableStock === 0).length})
                    </h4>
                    <div className="space-y-2">
                      {mockInventory
                        .filter((item) => item.availableStock === 0)
                        .map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold">{item.name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {item.category} • {item.location}
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                  {item.reservedStock > 0 && `${item.reservedStock} units reserved • `}
                                  Immediate restock required
                                </p>
                              </div>
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Critical
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Low Stock Items */}
                {mockInventory.filter((item) => item.availableStock <= item.reorderLevel && item.availableStock > 0)
                  .length > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-3">
                      Low Stock (
                      {
                        mockInventory.filter(
                          (item) => item.availableStock <= item.reorderLevel && item.availableStock > 0,
                        ).length
                      }
                      )
                    </h4>
                    <div className="space-y-2">
                      {mockInventory
                        .filter((item) => item.availableStock <= item.reorderLevel && item.availableStock > 0)
                        .map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold">{item.name}</h5>
                                <p className="text-sm text-muted-foreground">
                                  {item.category} • {item.location}
                                </p>
                                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                                  {item.availableStock} units available • Reorder level: {item.reorderLevel}
                                </p>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Low Stock
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {mockInventory.filter((item) => item.availableStock <= item.reorderLevel).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">All Stock Levels Good</h3>
                    <p>No items require immediate attention.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop-products">
          <MyShopProducts
            currentUser={currentUser}
            userShopId={currentUser?.shopId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StoreInterface
