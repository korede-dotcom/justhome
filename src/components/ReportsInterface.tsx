"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, Package, Store, Warehouse, DollarSign } from "lucide-react"
import { toast } from "sonner"
import type { Shop, Warehouse as WarehouseType, Order, User } from "@/pages/Dashboard"

interface ReportsInterfaceProps {
  shops: Shop[]
  warehouses: WarehouseType[]
  orders: Order[]
  currentUser: User
}

const ReportsInterface = ({ shops, warehouses, orders, currentUser }: ReportsInterfaceProps) => {
  const [selectedShop, setSelectedShop] = useState<string>("all")
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("30")

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  // Filter orders based on date range
  const getFilteredOrders = () => {
    const days = Number.parseInt(dateRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return orders.filter((order) => order.createdAt >= cutoffDate)
  }

  // Shop performance data
  const getShopPerformanceData = () => {
    const filteredOrders = getFilteredOrders()

    return shops.map((shop) => {
      const shopOrders = filteredOrders.filter(
        (order) => order.attendee?.shopId === shop.id || order.receptionist?.shopId === shop.id,
      )

      const totalRevenue = shopOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      const completedOrders = shopOrders.filter((order) => order.status === "delivered").length

      return {
        name: shop.name,
        location: shop.location,
        orders: shopOrders.length,
        revenue: totalRevenue,
        completed: completedOrders,
        completionRate: shopOrders.length > 0 ? (completedOrders / shopOrders.length) * 100 : 0,
      }
    })
  }

  // Warehouse performance data
  const getWarehousePerformanceData = () => {
    return warehouses.map((warehouse) => {
      // This would typically come from warehouse-specific data
      // For now, we'll use mock data based on warehouse
      return {
        name: warehouse.name,
        location: warehouse.location,
        totalProducts: Math.floor(Math.random() * 1000) + 500,
        assignedProducts: Math.floor(Math.random() * 500) + 200,
        lowStockItems: Math.floor(Math.random() * 50) + 10,
        utilizationRate: Math.floor(Math.random() * 40) + 60,
      }
    })
  }

  // Order status distribution
  const getOrderStatusData = () => {
    const filteredOrders = getFilteredOrders()
    const statusCounts = filteredOrders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace("_", " ").toUpperCase(),
      value: count,
    }))
  }

  // Revenue trend data
  const getRevenueTrendData = () => {
    const filteredOrders = getFilteredOrders()
    const dailyRevenue = filteredOrders.reduce(
      (acc, order) => {
        const date = order.createdAt.toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + order.totalAmount
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString(),
        revenue,
      }))
  }

  const exportReport = (type: string) => {
    let data: any[] = []
    let filename = ""

    switch (type) {
      case "shops":
        data = getShopPerformanceData()
        filename = `shop-performance-report-${new Date().toISOString().split("T")[0]}.csv`
        break
      case "warehouses":
        data = getWarehousePerformanceData()
        filename = `warehouse-report-${new Date().toISOString().split("T")[0]}.csv`
        break
      case "orders":
        data = getFilteredOrders().map((order) => ({
          receiptId: order.receiptId,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          attendee: order.attendee?.fullName,
          shop: order.attendee?.shopId,
        }))
        filename = `orders-report-${new Date().toISOString().split("T")[0]}.csv`
        break
      default:
        return
    }

    if (data.length === 0) {
      toast.error("No data to export")
      return
    }

    const csvContent = [Object.keys(data[0]).join(","), ...data.map((row) => Object.values(row).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Report exported successfully")
  }

  const shopPerformanceData = getShopPerformanceData()
  const warehousePerformanceData = getWarehousePerformanceData()
  const orderStatusData = getOrderStatusData()
  const revenueTrendData = getRevenueTrendData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive business intelligence and reporting</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ₦
                  {getFilteredOrders()
                    .reduce((sum, order) => sum + order.totalAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{getFilteredOrders().length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Shops</p>
                <p className="text-2xl font-bold text-purple-600">{shops.filter((s) => s.isActive).length}</p>
              </div>
              <Store className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Warehouses</p>
                <p className="text-2xl font-bold text-teal-600">{warehouses.filter((w) => w.isActive).length}</p>
              </div>
              <Warehouse className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shops" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shops">Shop Reports</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouse Reports</TabsTrigger>
          <TabsTrigger value="orders">Order Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="shops" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Shop Performance</h3>
            <Button onClick={() => exportReport("shops")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Shop Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Shop</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shopPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopPerformanceData.map((shop, index) => (
              <Card key={shop.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="h-5 w-5 text-blue-500" />
                    {shop.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{shop.location}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Orders:</span>
                    <span className="font-medium">{shop.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Revenue:</span>
                    <span className="font-medium text-green-600">₦{shop.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completed:</span>
                    <span className="font-medium">{shop.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Completion Rate:</span>
                    <Badge variant={shop.completionRate >= 80 ? "default" : "secondary"}>
                      {shop.completionRate.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Warehouse Performance</h3>
            <Button onClick={() => exportReport("warehouses")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Warehouse Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehousePerformanceData.map((warehouse, index) => (
              <Card key={warehouse.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-teal-500" />
                    {warehouse.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{warehouse.location}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Products:</span>
                    <span className="font-medium">{warehouse.totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Assigned:</span>
                    <span className="font-medium text-blue-600">{warehouse.assignedProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Low Stock:</span>
                    <span className="font-medium text-red-600">{warehouse.lowStockItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Utilization:</span>
                    <Badge variant={warehouse.utilizationRate >= 80 ? "default" : "secondary"}>
                      {warehouse.utilizationRate}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order Analytics</h3>
            <Button onClick={() => exportReport("orders")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Order Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderStatusData.map((status, index) => (
                  <div key={status.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{status.name}</span>
                    </div>
                    <Badge variant="outline">{status.value}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Revenue Trends</h3>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReportsInterface
