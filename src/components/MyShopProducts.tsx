import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Package, 
  Store, 
  Warehouse, 
  Search, 
  Calendar, 
  User, 
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import { api, getAuthHeaders } from "@/lib/api"
import type { User } from "@/pages/Dashboard"

interface ShopAssignment {
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
  warehouseName: string
}

interface MyShopProductsData {
  assignments: ShopAssignment[]
}

interface MyShopProductsProps {
  currentUser: User
  userShopId?: string
}

const MyShopProducts = ({ currentUser, userShopId }: MyShopProductsProps) => {
  const [shopData, setShopData] = useState<MyShopProductsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    console.log("MyShopProducts - Current User:", currentUser)
    console.log("MyShopProducts - User Shop ID:", userShopId)

    if (userShopId) {
      fetchMyShopProducts()
    } else {
      console.log("No shop ID found for user")
    }
  }, [userShopId, currentUser])

  const fetchMyShopProducts = async () => {
    if (!userShopId) {
      console.log("No userShopId provided:", userShopId)
      // Try to fetch general warehouse products instead
      await fetchWarehouseProducts()
      return
    }

    try {
      setLoading(true)
      const endpoint = api.shops.products.myShopProducts(userShopId)
      console.log("Fetching shop products from:", endpoint)
      console.log("User shop ID:", userShopId)

      const res = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      console.log("Response status:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("API Error:", errorText)

        // If shop-specific endpoint fails, try warehouse products
        console.log("Shop-specific endpoint failed, trying warehouse products...")
        await fetchWarehouseProducts()
        return
      }

      const response = await res.json()
      console.log("API Response:", response)

      if (response.status && response.data) {
        // Transform the API response to match our interface
        const transformedData: MyShopProductsData = {
          assignments: response.data
        }
        setShopData(transformedData)
      } else {
        throw new Error(response.message || "Failed to load shop products")
      }
    } catch (err: any) {
      console.error("Error fetching shop products:", err)
      // Fallback to warehouse products
      await fetchWarehouseProducts()
    } finally {
      setLoading(false)
    }
  }

  const fetchWarehouseProducts = async () => {
    try {
      console.log("Fetching warehouse products from:", api.warehouses.products.all)

      const res = await fetch(api.warehouses.products.all, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      console.log("Warehouse products response status:", res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Warehouse products API Error:", errorText)
        throw new Error(`Failed to fetch warehouse products: ${res.status} ${res.statusText}`)
      }

      const response = await res.json()
      console.log("Warehouse products API Response:", response)

      if (response.status && response.data) {
        // Transform warehouse products data to match shop data structure
        const transformedData = {
          shop: {
            id: "warehouse",
            name: "Available Products",
            location: "All Warehouses"
          },
          totalAssignments: response.data.length,
          assignments: response.data.map((product: any) => ({
            id: product.id,
            quantity: product.availableStock || 0,
            assignedAt: product.createdAt || new Date().toISOString(),
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              category: product.category || { name: "Unknown" }
            },
            warehouse: {
              name: "Warehouse",
              location: "Unknown"
            },
            assignedBy: {
              fullName: "System",
              role: "System"
            }
          }))
        }
        setShopData(transformedData)
      } else {
        throw new Error(response.message || "Failed to load warehouse products")
      }
    } catch (err: any) {
      console.error("Error fetching warehouse products:", err)
      toast.error(err.message || "Failed to fetch products")
    }
  }

  // Filter assignments based on search term
  const filteredAssignments = shopData?.assignments?.filter(assignment => {
    try {
      return assignment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             assignment.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             assignment.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
    } catch (err) {
      console.error("Error filtering assignments:", err)
      return true
    }
  }) || []

  const totalQuantity = shopData?.assignments?.reduce((sum, a) => sum + (a.assignedQuantity || 0), 0) || 0
  const totalValue = shopData?.assignments?.reduce((sum, a) => sum + ((a.price || 0) * (a.assignedQuantity || 0)), 0) || 0
  const totalSold = shopData?.assignments?.reduce((sum, a) => sum + (a.shopSoldQuantity || 0), 0) || 0
  const totalAvailable = shopData?.assignments?.reduce((sum, a) => sum + (a.shopAvailableQuantity || 0), 0) || 0

  if (!userShopId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shop Assigned</h3>
          <p className="text-gray-600">
            You are not assigned to any shop. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Shop Products</h2>
          <p className="text-gray-600">View products assigned to your shop</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-full">
          <Store className="h-4 w-4" />
          My Shop Products
        </div>
      </div>



      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{shopData?.assignments?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Quantity</p>
                <p className="text-2xl font-bold text-green-600">{totalQuantity}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available in Shop</p>
                <p className="text-2xl font-bold text-orange-600">{totalAvailable}</p>
              </div>
              <Warehouse className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sold</p>
                <p className="text-2xl font-bold text-purple-600">{totalSold}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Assigned Products</CardTitle>
              <CardDescription>Products assigned to your shop from warehouses</CardDescription>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Assigned Qty</TableHead>
                  <TableHead>Shop Stock</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Loading products...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {shopData?.assignments?.length === 0 ? "No products assigned to your shop yet" : "No products found matching your search"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.name || "Unknown Product"}</div>
                          <div className="text-sm text-gray-500">ID: {assignment.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.category || "No Category"}</Badge>
                      </TableCell>
                      <TableCell>₦{assignment.price?.toLocaleString() || "0"}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="font-mono">
                          {assignment.assignedQuantity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Available:</span>
                            <span className={`font-medium ${
                              (assignment.shopAvailableQuantity || 0) === 0 ? 'text-red-600' :
                              (assignment.shopAvailableQuantity || 0) <= 5 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {assignment.shopAvailableQuantity || 0}
                            </span>
                          </div>
                          {(assignment.shopAvailableQuantity || 0) === 0 && (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                          {(assignment.shopAvailableQuantity || 0) > 0 && (assignment.shopAvailableQuantity || 0) <= 5 && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Low Stock</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {assignment.shopSoldQuantity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.warehouseName || "Unknown Warehouse"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : "Unknown Date"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyShopProducts
