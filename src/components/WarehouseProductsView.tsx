"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Warehouse, Package, Search, TrendingUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { api, getAuthHeaders } from "@/lib/api"
import type { Warehouse as WarehouseType, WarehouseProduct } from "@/pages/Dashboard"

interface WarehouseProductsViewProps {
  warehouses: WarehouseType[]
  currentUser: any
}

const WarehouseProductsView = ({ warehouses, currentUser }: WarehouseProductsViewProps) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [warehouseProducts, setWarehouseProducts] = useState<WarehouseProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWarehouseProducts()
  }, [selectedWarehouse])

  const fetchWarehouseProducts = async () => {
    setLoading(true)
    try {
      const url =
        selectedWarehouse === "all"
          ? api.warehouses.products.all
          : api.warehouses.products.byWarehouse(selectedWarehouse)

      const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch warehouse products")
      }

      const json = await res.json()

      if (!json.status || !json.data) {
        throw new Error(json.message || "Invalid warehouse products data")
      }

      setWarehouseProducts(json.data)
    } catch (error: any) {
      toast.error(error.message || "Error loading warehouse products")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = warehouseProducts.filter(
    (item) =>
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find((w) => w.id === warehouseId)?.name || "Unknown Warehouse"
  }

  const getStockStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100
    if (percentage <= 10) return { status: "critical", color: "bg-red-100 text-red-800" }
    if (percentage <= 25) return { status: "low", color: "bg-yellow-100 text-yellow-800" }
    return { status: "good", color: "bg-green-100 text-green-800" }
  }

  const getTotalStats = () => {
    const totalProducts = filteredProducts.length
    const totalQuantity = filteredProducts.reduce((sum, item) => sum + item.quantity, 0)
    const totalAvailable = filteredProducts.reduce((sum, item) => sum + item.availableQuantity, 0)
    const totalReserved = filteredProducts.reduce((sum, item) => sum + item.reservedQuantity, 0)
    const totalValue = filteredProducts.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

    return { totalProducts, totalQuantity, totalAvailable, totalReserved, totalValue }
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Warehouse Products Overview</h3>
          <p className="text-gray-600">Monitor inventory across all warehouses</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <p className="text-sm text-gray-600">Reserved</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalReserved.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">₦{stats.totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
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
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses
                  .filter((w) => w.isActive)
                  .map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
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
            <Warehouse className="h-5 w-5" />
            Warehouse Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading warehouse products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((item) => {
                    const stockStatus = getStockStatus(item.availableQuantity, item.quantity)
                    const totalValue = item.product.price * item.quantity

                    return (
                      <TableRow key={`${item.warehouseId}-${item.productId}`}>
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
                            <Warehouse className="h-4 w-4 text-teal-500" />
                            {getWarehouseName(item.warehouseId)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          ₦{item.product.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-teal-600 font-medium">
                          {item.availableQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-orange-600 font-medium">
                          {item.reservedQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.status === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {stockStatus.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-purple-600">₦{totalValue.toLocaleString()}</TableCell>
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

export default WarehouseProductsView
