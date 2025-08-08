"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Store, Package, Search, TrendingUp, DollarSign, Target } from "lucide-react"
import { toast } from "sonner"
import { api, getAuthHeaders } from "@/lib/api"
import type { Shop, ShopProduct } from "@/pages/Dashboard"

interface ShopProductsViewProps {
  shops: Shop[]
  currentUser: any
}

const ShopProductsView = ({ shops, currentUser }: ShopProductsViewProps) => {
  const [selectedShop, setSelectedShop] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchShopProducts()
  }, [selectedShop])

  const fetchShopProducts = async () => {
    setLoading(true)
    try {
      const url =
        selectedShop === "all"
          ? api.shops.products.all
          : api.shops.products.byShop(selectedShop)

      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch shop products")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status || !response.data) {
        throw new Error(response.message || "Invalid shop products data")
      }

      setShopProducts(response.data)
    } catch (error: any) {
      toast.error(error.message || "Error loading shop products")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = shopProducts.filter(
    (item) =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getShopName = (shopId: string) => {
    return shops.find((s) => s.id === shopId)?.name || "Unknown Shop"
  }

  const getPerformanceStatus = (actual: number, expected: number) => {
    if (expected === 0) return { status: "no-target", color: "bg-gray-100 text-gray-800" }
    const percentage = (actual / expected) * 100
    if (percentage >= 100) return { status: "excellent", color: "bg-green-100 text-green-800" }
    if (percentage >= 75) return { status: "good", color: "bg-blue-100 text-blue-800" }
    if (percentage >= 50) return { status: "average", color: "bg-yellow-100 text-yellow-800" }
    return { status: "poor", color: "bg-red-100 text-red-800" }
  }

  const getTotalStats = () => {
    const totalProducts = filteredProducts.length
    const totalQuantity = filteredProducts.reduce((sum, item) => sum + item.quantity, 0)
    const totalSold = filteredProducts.reduce((sum, item) => sum + item.soldQuantity, 0)
    const totalAvailable = filteredProducts.reduce((sum, item) => sum + item.availableQuantity, 0)
    const totalExpectedRevenue = filteredProducts.reduce((sum, item) => sum + item.expectedRevenue, 0)
    const totalActualRevenue = filteredProducts.reduce((sum, item) => sum + item.actualRevenue, 0)

    return {
      totalProducts,
      totalQuantity,
      totalSold,
      totalAvailable,
      totalExpectedRevenue,
      totalActualRevenue,
      revenuePerformance: totalExpectedRevenue > 0 ? (totalActualRevenue / totalExpectedRevenue) * 100 : 0,
    }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Shop Products & Revenue Overview</h3>
          <p className="text-gray-600">Monitor inventory and revenue performance across all shops</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalQuantity.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sold</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSold.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-teal-600">{stats.totalAvailable.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expected Revenue</p>
                <p className="text-xl font-bold text-orange-600">₦{stats.totalExpectedRevenue.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actual Revenue</p>
                <p className="text-xl font-bold text-green-600">₦{stats.totalActualRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{stats.revenuePerformance.toFixed(1)}% of target</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedShop} onValueChange={setSelectedShop}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Shop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shops</SelectItem>
                {shops
                  .filter((s) => s.isActive)
                  .map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {shop.name} - {shop.location}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shop Products & Revenue ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Expected Revenue</TableHead>
                  <TableHead>Actual Revenue</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Loading shop products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((item) => {
                    const performanceStatus = getPerformanceStatus(item.actualRevenue, item.expectedRevenue)
                    const performancePercentage =
                      item.expectedRevenue > 0 ? (item.actualRevenue / item.expectedRevenue) * 100 : 0

                    return (
                      <TableRow key={`${item.shopId}-${item.productId}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product.image || "/placeholder.svg?height=40&width=40"}
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                              }}
                            />
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-500">{item.product.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-blue-500" />
                            {getShopName(item.shopId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ₦{item.product.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-purple-600 font-medium">
                          {item.soldQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-teal-600 font-medium">
                          {item.availableQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600">
                          ₦{item.expectedRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ₦{item.actualRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={performanceStatus.color}>{performanceStatus.status.toUpperCase()}</Badge>
                            <div className="text-xs text-gray-500">{performancePercentage.toFixed(1)}%</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ShopProductsView
