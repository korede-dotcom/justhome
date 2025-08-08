"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Download, TrendingUp, DollarSign, ShoppingCart, Users, Package, Target } from "lucide-react"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"
import { exportToExcel } from "@/utils/exportUtils"

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("30d")
  const [currentUser] = useState(() => {
    const user = localStorage.getItem("currentUser")
    return user ? JSON.parse(user) : null
  })
  const [currentRole] = useState(() => {
    return localStorage.getItem("currentRole") || "Attendee"
  })

  // Mock data for charts
  const salesData = [
    { month: "Jan", sales: 12000, orders: 45, customers: 32 },
    { month: "Feb", sales: 15000, orders: 52, customers: 38 },
    { month: "Mar", sales: 18000, orders: 61, customers: 45 },
    { month: "Apr", sales: 22000, orders: 73, customers: 52 },
    { month: "May", sales: 25000, orders: 84, customers: 61 },
    { month: "Jun", sales: 28000, orders: 92, customers: 68 },
  ]

  const categoryData = [
    { name: "Living Room", value: 35, color: "#8884d8" },
    { name: "Bedroom", value: 25, color: "#82ca9d" },
    { name: "Dining Room", value: 20, color: "#ffc658" },
    { name: "Office", value: 15, color: "#ff7300" },
    { name: "Others", value: 5, color: "#00ff00" },
  ]

  const revenueData = [
    { day: "Mon", revenue: 2400, profit: 1200 },
    { day: "Tue", revenue: 1398, profit: 800 },
    { day: "Wed", revenue: 9800, profit: 4500 },
    { day: "Thu", revenue: 3908, profit: 2100 },
    { day: "Fri", revenue: 4800, profit: 2800 },
    { day: "Sat", revenue: 3800, profit: 2200 },
    { day: "Sun", revenue: 4300, profit: 2600 },
  ]

  const topProducts = [
    { name: "Modern Sofa Set", sales: 45, revenue: 53000 },
    { name: "Dining Table", sales: 32, revenue: 25600 },
    { name: "Office Chair", sales: 28, revenue: 7000 },
    { name: "Bedroom Set", sales: 15, revenue: 30000 },
    { name: "Coffee Table", sales: 22, revenue: 6600 },
  ]

  const kpiData = {
    totalRevenue: 156000,
    totalOrders: 347,
    totalCustomers: 234,
    averageOrderValue: 449,
    conversionRate: 3.2,
    customerRetention: 68,
    revenueGrowth: 15.3,
    orderGrowth: 12.8,
  }

  const handleExportAnalytics = () => {
    const analyticsData = {
      summary: [kpiData],
      salesTrend: salesData,
      categoryBreakdown: categoryData,
      topProducts: topProducts,
      revenueData: revenueData,
    }

    const sheets = [
      { name: "Summary", data: [kpiData] },
      { name: "Sales Trend", data: salesData },
      { name: "Categories", data: categoryData },
      { name: "Top Products", data: topProducts },
      { name: "Daily Revenue", data: revenueData },
    ]

    exportToExcel(sheets, `analytics-${new Date().toISOString().split("T")[0]}`)
    toast.success("Analytics exported to Excel successfully!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} currentRole={currentRole} onRoleChange={() => {}} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Business insights and performance metrics</p>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportAnalytics} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold">${kpiData.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+{kpiData.revenueGrowth}%</span>
                  </div>
                </div>
                <DollarSign className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold">{kpiData.totalOrders}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-600">+{kpiData.orderGrowth}%</span>
                  </div>
                </div>
                <ShoppingCart className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold">{kpiData.totalCustomers}</p>
                  <div className="flex items-center mt-2">
                    <Target className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-sm text-purple-600">{kpiData.customerRetention}% retention</span>
                  </div>
                </div>
                <Users className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-3xl font-bold">${kpiData.averageOrderValue}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
                    <span className="text-sm text-orange-600">{kpiData.conversionRate}% conversion</span>
                  </div>
                </div>
                <Package className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="sales">Sales Trend</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Monthly sales, orders, and customer trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Sales ($)"
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Orders"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Revenue & Profit</CardTitle>
                <CardDescription>Revenue and profit breakdown by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                      <Bar dataKey="profit" fill="#82ca9d" name="Profit ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>Product category distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Detailed category breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{category.value}%</p>
                          <p className="text-sm text-gray-500">of total sales</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>Best selling products by revenue and quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sales} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${product.revenue.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AnalyticsPage
