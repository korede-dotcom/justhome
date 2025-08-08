import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  Package, 
  Store, 
  Warehouse, 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar, 
  User, 
  MapPin,
  Eye,
  Plus,
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { api, getAuthHeaders } from "@/lib/api"
import type { User } from "@/pages/Dashboard"

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  totalStock: number
  availableStock: number
  createdAt: string
  categoryId: string
  warehouseId: string
  category?: {
    id: string
    name: string
    description: string
    createdAt: string
  }
}

interface Shop {
  id: string
  name: string
  location: string
  isActive: boolean
}

interface Warehouse {
  id: string
  name: string
  location: string
  description: string
  isActive: boolean
  managerId: string | null
  products: Product[]
  productAssignments: ProductAssignment[]
  users: any[]
}

interface WarehouseReportResponse {
  warehouse: Warehouse
  totalProducts: number
  totalAssignments: number
  totalUsers: number
}

interface ProductAssignment {
  id: string
  quantity: number
  assignedAt: string
  productId: string
  shopId: string
  warehouseId: string
  assignedBy: string
  // Populated fields from API response
  product: {
    id: string
    name: string
    description: string
    price: number
    image: string
    totalStock: number
    availableStock: number
    createdAt: string
    categoryId: string
    warehouseId: string
  }
  shop: {
    id: string
    name: string
    location: string
    description: string
    isActive: boolean
    managerId: string | null
  }
}

interface ProductAssignmentManagerProps {
  currentUser: User
  onLogActivity: (action: string, details: string) => void
}

const ProductAssignmentManager = ({ currentUser, onLogActivity }: ProductAssignmentManagerProps) => {
  // Safety check for currentUser
  if (!currentUser || !currentUser.role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-600">Unable to load user information.</p>
        </div>
      </div>
    )
  }

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [assignments, setAssignments] = useState<ProductAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
  const [selectedShop, setSelectedShop] = useState<string>("all")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [assignmentQuantity, setAssignmentQuantity] = useState<number>(1)
  const [targetShopId, setTargetShopId] = useState<string>("")

  // Permission check
  const canAssignProducts = ["CEO", "Admin"].includes(currentUser.role)

  useEffect(() => {
    if (canAssignProducts) {
      const loadData = async () => {
        await fetchWarehouses()
        await fetchShops()
      }
      loadData()
    }
  }, [canAssignProducts])

  // Fetch assignments after warehouses are loaded (assignments come with shop data)
  useEffect(() => {
    if (canAssignProducts && warehouses.length > 0) {
      fetchAllAssignments()
    }
  }, [warehouses, canAssignProducts])

  const fetchWarehouses = async () => {
    try {
      setLoading(true)

      // First get the list of warehouses
      const warehousesRes = await fetch(api.warehouses.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!warehousesRes.ok) {
        throw new Error("Failed to fetch warehouses")
      }

      const warehousesResponse = await warehousesRes.json()
      if (!warehousesResponse.status || !warehousesResponse.data) {
        throw new Error("Invalid warehouses data")
      }

      // Then fetch detailed reports for each warehouse to get products and assignments
      const warehouseReports = await Promise.all(
        warehousesResponse.data.map(async (warehouse: any) => {
          try {
            const reportRes = await fetch(api.warehouses.report(warehouse.id), {
              method: "GET",
              headers: getAuthHeaders(),
            })

            if (reportRes.ok) {
              const reportData = await reportRes.json()
              if (reportData.status && reportData.data?.warehouse) {
                return reportData.data.warehouse
              }
            }

            // Fallback to basic warehouse data if report fails
            return {
              ...warehouse,
              products: [],
              productAssignments: [],
              users: []
            }
          } catch (err) {
            console.error(`Failed to fetch report for warehouse ${warehouse.id}:`, err)
            return {
              ...warehouse,
              products: [],
              productAssignments: [],
              users: []
            }
          }
        })
      )

      setWarehouses(warehouseReports)
    } catch (err: any) {
      console.error("Error fetching warehouses:", err)
      toast.error(err.message || "Failed to fetch warehouses")
    } finally {
      setLoading(false)
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
      if (response.status && response.data) {
        setShops(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch shops")
    }
  }

  const fetchAllAssignments = async () => {
    if (warehouses.length === 0) {
      return // Don't fetch if no warehouses loaded yet
    }

    try {
      // Fetch assignments from all warehouses
      const warehousePromises = warehouses.map(warehouse =>
        fetch(api.warehouses.report(warehouse.id), {
          method: "GET",
          headers: getAuthHeaders(),
        }).then(res => res.json()).catch(err => {
          console.error(`Failed to fetch report for warehouse ${warehouse.id}:`, err)
          return { status: false, data: null }
        })
      )

      const warehouseReports = await Promise.all(warehousePromises)
      const allAssignments: ProductAssignment[] = []

      warehouseReports.forEach((report) => {
        if (report.status && report.data?.warehouse?.productAssignments) {
          // The assignments already come with populated product and shop data
          const assignments = report.data.warehouse.productAssignments
          allAssignments.push(...assignments)
        }
      })

      setAssignments(allAssignments)
    } catch (err: any) {
      console.error("Error fetching assignments:", err)
      toast.error(err.message || "Failed to fetch assignments")
    }
  }

  const handleAssignProduct = async () => {
    if (!selectedProduct || !targetShopId || assignmentQuantity <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    if (assignmentQuantity > selectedProduct.availableStock) {
      toast.error(`Cannot assign more than available stock (${selectedProduct.availableStock})`)
      return
    }

    // Find the warehouse that contains this product
    const productWarehouse = warehouses.find(w =>
      w.products?.some(p => p.id === selectedProduct.id)
    )

    if (!productWarehouse) {
      toast.error("Could not find warehouse for this product")
      return
    }

    try {
      setLoading(true)
      const assignmentData = {
        productId: selectedProduct.id,
        shopId: targetShopId,
        warehouseId: productWarehouse.id,
        quantity: assignmentQuantity,
        assignedBy: currentUser.id,
      }

      const res = await fetch(api.warehouses.assignProduct, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(assignmentData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to assign product")
      }

      const shop = shops.find(s => s.id === targetShopId)
      toast.success(`Successfully assigned ${assignmentQuantity} ${selectedProduct.name} to ${shop?.name}`)
      
      // Log activity
      const activityData = {
        action: "PRODUCT_ASSIGNED",
        details: `Assigned ${assignmentQuantity} units of ${selectedProduct.name} to ${shop?.name} from ${productWarehouse.name}`,
        userId: currentUser.id,
        timestamp: new Date().toISOString()
      }

      // Post to activities endpoint
      try {
        await fetch(api.activities.create, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(activityData),
        })
      } catch (err) {
        console.error("Failed to log activity:", err)
      }

      // Also call the parent callback for local state updates
      onLogActivity(
        "PRODUCT_ASSIGNED",
        `Assigned ${assignmentQuantity} units of ${selectedProduct.name} to ${shop?.name} from ${productWarehouse.name}`
      )

      // Reset form and refresh data
      setIsAssignDialogOpen(false)
      setSelectedProduct(null)
      setTargetShopId("")
      setAssignmentQuantity(1)
      
      await Promise.all([fetchWarehouses(), fetchAllAssignments()])
      
    } catch (err: any) {
      toast.error(err.message || "Failed to assign product")
    } finally {
      setLoading(false)
    }
  }

  if (!canAssignProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            Only CEO and Admin users can access product assignment management.
          </p>
        </div>
      </div>
    )
  }

  // Filter functions with error handling
  const filteredWarehouses = warehouses.filter(warehouse => {
    try {
      return warehouse.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             warehouse.location?.toLowerCase().includes(searchTerm.toLowerCase())
    } catch (err) {
      console.error("Error filtering warehouses:", err)
      return true
    }
  })

  const filteredAssignments = assignments.filter(assignment => {
    try {
      const matchesSearch =
        assignment.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assignedByUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesWarehouse = selectedWarehouse === "all" || assignment.warehouseId === selectedWarehouse

      const matchesShop = selectedShop === "all" || assignment.shopId === selectedShop

      return matchesSearch && matchesWarehouse && matchesShop
    } catch (err) {
      console.error("Error filtering assignments:", err)
      return true
    }
  })

  const totalAssignments = assignments?.length || 0
  const totalProducts = warehouses?.reduce((sum, w) => sum + (w.products?.length || 0), 0) || 0
  const totalShops = shops?.length || 0
  const activeAssignments = assignments?.filter(a => a.shop?.isActive)?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Assignment Management</h2>
          <p className="text-gray-600">Manage product assignments between warehouses and shops</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-full">
          <CheckCircle className="h-4 w-4" />
          {currentUser.role} Access
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-blue-600">{totalAssignments}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-green-600">{totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Shops</p>
                <p className="text-2xl font-bold text-purple-600">{totalShops}</p>
              </div>
              <Store className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold text-orange-600">{activeAssignments}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Assignment Overview</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouse Products</TabsTrigger>
          <TabsTrigger value="shops">Shop Assignments</TabsTrigger>
        </TabsList>

        {/* Assignment Overview Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>All Product Assignments</CardTitle>
                  <CardDescription>Complete overview of product assignments across all warehouses and shops</CardDescription>
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
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by warehouse" />
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
                <Select value={selectedShop} onValueChange={setSelectedShop}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by shop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shops</SelectItem>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignments Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Loading assignments...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assignment.product?.name || "Unknown Product"}</div>
                              <div className="text-sm text-gray-500">₦{assignment.product?.price?.toLocaleString() || "0"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assignment.shop?.name || "Unknown Shop"}</div>
                              <div className="text-sm text-gray-500">{assignment.shop?.location || "Unknown Location"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {assignment.quantity || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assignment.assignedByUser?.fullName || "Unknown User"}</div>
                              <div className="text-sm text-gray-500">{assignment.assignedByUser?.role || "Unknown Role"}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : "Unknown Date"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.shop?.isActive ? "default" : "secondary"}>
                              {assignment.shop?.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouse Products Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Warehouse Products</CardTitle>
                  <CardDescription>View and assign products from warehouses to shops</CardDescription>
                </div>
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Product to Shop</DialogTitle>
                      <DialogDescription>
                        Select a product and shop to create a new assignment
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="targetShop">Target Shop *</Label>
                        <Select value={targetShopId} onValueChange={setTargetShopId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shop" />
                          </SelectTrigger>
                          <SelectContent>
                            {shops.filter(shop => shop.isActive).map((shop) => (
                              <SelectItem key={shop.id} value={shop.id}>
                                {shop.name} - {shop.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedProduct && (
                        <>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium">{selectedProduct.name}</h4>
                            <p className="text-sm text-gray-600">₦{selectedProduct.price.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Available: {selectedProduct.availableStock}</p>
                          </div>

                          <div>
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              max={selectedProduct.availableStock}
                              value={assignmentQuantity}
                              onChange={(e) => setAssignmentQuantity(parseInt(e.target.value) || 1)}
                              placeholder="Enter quantity"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAssignProduct}
                          disabled={!selectedProduct || !targetShopId || loading}
                        >
                          {loading ? "Assigning..." : "Assign Product"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredWarehouses.map((warehouse) => (
                  <div key={warehouse.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Warehouse className="h-5 w-5 text-blue-600" />
                          {warehouse.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {warehouse.location}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Manager: {warehouse.managerId ? "Assigned" : "No manager assigned"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Products: {warehouse.products?.length || 0}</div>
                        <div className="text-sm text-gray-600">Assignments: {warehouse.productAssignments?.length || 0}</div>
                      </div>
                    </div>

                    {(warehouse.products?.length || 0) === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No products in this warehouse
                      </div>
                    ) : (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Stock</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {warehouse.products?.map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="font-medium">{product.name || "Unknown Product"}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{product.category?.name || "No Category"}</Badge>
                                </TableCell>
                                <TableCell>₦{product.price?.toLocaleString() || "0"}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>Available: {product.availableStock || 0}</div>
                                    <div className="text-gray-500">Total: {product.totalStock || 0}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProduct(product)
                                      setIsAssignDialogOpen(true)
                                    }}
                                    disabled={(product.availableStock || 0) === 0}
                                  >
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )) || []}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shop Assignments Tab */}
        <TabsContent value="shops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shop Product Assignments</CardTitle>
              <CardDescription>View products assigned to each shop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {shops.map((shop) => {
                  const shopAssignments = assignments.filter(a => a.shopId === shop.id)
                  const totalAssignedProducts = shopAssignments.reduce((sum, a) => sum + (a.quantity || 0), 0)

                  return (
                    <div key={shop.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Store className="h-5 w-5 text-purple-600" />
                            {shop.name}
                            <Badge variant={shop.isActive ? "default" : "secondary"}>
                              {shop.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {shop.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Products: {shopAssignments.length}</div>
                          <div className="text-sm text-gray-600">Total Quantity: {totalAssignedProducts}</div>
                        </div>
                      </div>

                      {shopAssignments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No products assigned to this shop
                        </div>
                      ) : (
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Assigned By</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {shopAssignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                  <TableCell>
                                    <div className="font-medium">{assignment.product?.name || "Unknown Product"}</div>
                                  </TableCell>
                                  <TableCell>₦{assignment.product?.price?.toLocaleString() || "0"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono">
                                      {assignment.quantity || 0}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{assignment.assignedByUser?.fullName || "Unknown User"}</div>
                                      <div className="text-sm text-gray-500">{assignment.assignedByUser?.role || "Unknown Role"}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : "Unknown Date"}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProductAssignmentManager
