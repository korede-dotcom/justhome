"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Store, Plus, Edit, Users, MapPin, Calendar, User, Package, Search, X, Check, ShoppingCart, ArrowRight, Filter } from "lucide-react"
import { toast } from "sonner"
import type { Shop, User as UserType } from "@/pages/Dashboard"

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
  warehouseId: string
  warehouse?: {
    id: string
    name: string
    location: string
  }
}

interface ShopProduct extends Product {
  assignedStock: number
  assignedAt: Date
}
import { api, getAuthHeaders } from "@/lib/api"

interface ShopManagementProps {
  shops: Shop[]
  users: UserType[]
  currentUser: UserType
  onAddShop: (shopData: Omit<Shop, "id" | "createdAt">) => Promise<void>
  onUpdateShop: (shopId: string, updates: Partial<Shop>) => void
}

const ShopManagement = ({ shops, users, currentUser, onAddShop, onUpdateShop }: ShopManagementProps) => {
  // Permission check for product assignment
  const canAssignProducts = ["CEO", "Admin"].includes(currentUser.role)
  const [isAddShopOpen, setIsAddShopOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [isEditShopOpen, setIsEditShopOpen] = useState(false)

  // Product assignment states
  const [isAssignProductOpen, setIsAssignProductOpen] = useState(false)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [assignmentQuantities, setAssignmentQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [isCreatingShop, setIsCreatingShop] = useState(false)

  const [newShop, setNewShop] = useState({
    name: "",
    location: "",
    description: "",
    managerId: "",
    isActive: true,
  })

  const availableManagers = users.filter((user) => ["Admin", "Storekeeper"].includes(user.role) && user.isActive)

  // Product assignment functions
  const fetchAvailableProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch(api.shops.products.available, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch available products")
      }

      const response = await res.json()
      if (response.status && response.data) {
        setAvailableProducts(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch available products")
    } finally {
      setLoading(false)
    }
  }

  const fetchShopProducts = async (shopId: string) => {
    try {
      setLoading(true)
      const res = await fetch(api.shops.products.byShop(shopId), {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch shop products")
      }

      const response = await res.json()
      if (response.status && response.data) {
        setShopProducts(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch shop products")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenProductAssignment = async (shop: Shop) => {
    // Check permissions
    if (!canAssignProducts) {
      toast.error("You don't have permission to assign products. Only CEO and Admin users can assign products to shops.")
      return
    }

    setSelectedShop(shop)
    setIsAssignProductOpen(true)
    setSelectedProducts([])
    setAssignmentQuantities({})
    setProductSearchTerm("")

    // Fetch both available products and current shop products
    await Promise.all([
      fetchAvailableProducts(),
      fetchShopProducts(shop.id)
    ])
  }

  const handleAssignProducts = async () => {
    // Check permissions
    if (!canAssignProducts) {
      toast.error("You don't have permission to assign products. Only CEO and Admin users can assign products to shops.")
      return
    }

    if (!selectedShop || selectedProducts.length === 0) {
      toast.error("Please select products to assign")
      return
    }

    // Validate quantities
    const invalidQuantities = selectedProducts.filter(productId => {
      const quantity = assignmentQuantities[productId]
      return !quantity || quantity <= 0
    })

    if (invalidQuantities.length > 0) {
      toast.error("Please enter valid quantities for all selected products")
      return
    }

    try {
      setLoading(true)
      const assignmentData = selectedProducts.map(productId => ({
        productId,
        shopId: selectedShop.id,
        quantity: assignmentQuantities[productId]
      }))

      const res = await fetch(api.shops.assignMultipleProducts, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignments: assignmentData }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to assign products")
      }

      toast.success(`Successfully assigned ${selectedProducts.length} products to ${selectedShop.name}`)

      // Refresh shop products
      await fetchShopProducts(selectedShop.id)

      // Reset selection
      setSelectedProducts([])
      setAssignmentQuantities({})

    } catch (err: any) {
      toast.error(err.message || "Failed to assign products")
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignProduct = async (shopId: string, productId: string) => {
    // Check permissions
    if (!canAssignProducts) {
      toast.error("You don't have permission to unassign products. Only CEO and Admin users can manage product assignments.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch(api.shops.unassignProduct, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ shopId, productId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to unassign product")
      }

      toast.success("Product unassigned successfully")

      // Refresh shop products
      await fetchShopProducts(shopId)

    } catch (err: any) {
      toast.error(err.message || "Failed to unassign product")
    } finally {
      setLoading(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // Remove from selection and clear quantity
        const newQuantities = { ...assignmentQuantities }
        delete newQuantities[productId]
        setAssignmentQuantities(newQuantities)
        return prev.filter(id => id !== productId)
      } else {
        // Add to selection
        return [...prev, productId]
      }
    })
  }

  const updateAssignmentQuantity = (productId: string, quantity: number) => {
    setAssignmentQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }))
  }

  // Filter available products based on search term
  const filteredAvailableProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearchTerm.toLowerCase())
  )

  const handleAddShop = async () => {
    if (!newShop.name.trim() || !newShop.location.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    // Prevent double submission
    if (isCreatingShop) {
      return
    }

    try {
      setIsCreatingShop(true)

      // Prepare the shop data for parent component
      const shopData = {
        name: newShop.name.trim(),
        location: newShop.location.trim(),
        description: newShop.description.trim() || undefined,
        managerId: newShop.managerId === "none" || !newShop.managerId ? undefined : newShop.managerId,
        createdBy: currentUser.username,
      }

      // Let parent component handle the API call to avoid duplication
      await onAddShop(shopData)

      // Reset form only after successful creation
      setNewShop({
        name: "",
        location: "",
        description: "",
        managerId: "",
        isActive: true,
      })
      setIsAddShopOpen(false)
    } catch (error: any) {
      // Error handling is done in parent component
      console.error("Error in handleAddShop:", error)
    } finally {
      setIsCreatingShop(false)
    }
  }

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop)
    setIsEditShopOpen(true)
  }

  const handleUpdateShop = async () => {
    if (!editingShop) return

    try {
      // Prepare the update data
      const updateData = {
        name: editingShop.name.trim(),
        location: editingShop.location.trim(),
        description: editingShop.description?.trim() || undefined,
        managerId: editingShop.managerId === "none" || !editingShop.managerId ? undefined : editingShop.managerId,
        isActive: editingShop.isActive,
      }

      // Call the API
      const res = await fetch(api.shops.update(editingShop.id), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to update shop")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status) {
        throw new Error(response.message || "Failed to update shop")
      }

      // Update local state via parent component
      onUpdateShop(editingShop.id, editingShop)

      toast.success("Shop updated successfully")
      setEditingShop(null)
      setIsEditShopOpen(false)
    } catch (error: any) {
      console.error("Error updating shop:", error)
      toast.error(error.message || "Failed to update shop")
    }
  }

  const handleToggleShopStatus = async (shopId: string, isActive: boolean) => {
    try {
      // Call the API to update shop status
      const res = await fetch(api.shops.update(shopId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to update shop status")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status) {
        throw new Error(response.message || "Failed to update shop status")
      }

      // Update local state via parent component
      onUpdateShop(shopId, { isActive })
      toast.success(`Shop ${isActive ? "activated" : "deactivated"} successfully`)
    } catch (error: any) {
      console.error("Error updating shop status:", error)
      toast.error(error.message || "Failed to update shop status")
    }
  }

  const getShopStats = (shopId: string) => {
    const shopUsers = users.filter((user) => user.shopId === shopId)
    return {
      totalUsers: shopUsers.length,
      attendees: shopUsers.filter((u) => u.role === "Attendee").length,
      receptionists: shopUsers.filter((u) => u.role === "Receptionist").length,
      packagers: shopUsers.filter((u) => u.role === "Packager").length,
      storekeepers: shopUsers.filter((u) => u.role === "Storekeeper").length,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shop Management</h2>
          <p className="text-gray-600">Manage retail shops and their assignments</p>
        </div>
        <Dialog open={isAddShopOpen} onOpenChange={setIsAddShopOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Shop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Shop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shopName">Shop Name *</Label>
                <Input
                  id="shopName"
                  value={newShop.name}
                  onChange={(e) => setNewShop((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Main Branch"
                />
              </div>
              <div>
                <Label htmlFor="shopLocation">Location *</Label>
                <Input
                  id="shopLocation"
                  value={newShop.location}
                  onChange={(e) => setNewShop((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Lagos, Nigeria"
                />
              </div>
              <div>
                <Label htmlFor="shopDescription">Description</Label>
                <Textarea
                  id="shopDescription"
                  value={newShop.description}
                  onChange={(e) => setNewShop((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the shop"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="managerId">Shop Manager</Label>
                <Select
                  value={newShop.managerId}
                  onValueChange={(value) => setNewShop((prev) => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Manager (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {availableManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.fullName} ({manager.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newShop.isActive}
                  onCheckedChange={(checked) => setNewShop((prev) => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active Shop</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddShopOpen(false)} disabled={isCreatingShop}>
                  Cancel
                </Button>
                <Button onClick={handleAddShop} disabled={isCreatingShop}>
                  {isCreatingShop ? "Creating..." : "Add Shop"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Shops</p>
                <p className="text-2xl font-bold">{shops.length}</p>
              </div>
              <Store className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Shops</p>
                <p className="text-2xl font-bold text-green-600">{shops.filter((s) => s.isActive).length}</p>
              </div>
              <Store className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Managers</p>
                <p className="text-2xl font-bold text-purple-600">{shops.filter((s) => s.managerId).length}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-orange-600">{users.filter((u) => u.shopId).length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shops Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shops ({shops.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Details</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Staff Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => {
                  const stats = getShopStats(shop.id)
                  const manager = shop.managerId ? users.find((u) => u.id === shop.managerId) : null

                  return (
                    <TableRow key={shop.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Store className="h-4 w-4 text-blue-500" />
                            {shop.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shop.location}
                          </div>
                          {shop.description && <div className="text-xs text-gray-400 mt-1">{shop.description}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {manager ? (
                          <div>
                            <div className="font-medium">{manager.fullName}</div>
                            <div className="text-sm text-gray-500">{manager.role}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No Manager</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Total: {stats.totalUsers}</div>
                          <div className="text-xs text-gray-500">
                            A:{stats.attendees} R:{stats.receptionists} P:{stats.packagers} S:{stats.storekeepers}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={shop.isActive}
                            onCheckedChange={(checked) => handleToggleShopStatus(shop.id, checked)}
                          />
                          <span className={shop.isActive ? "text-green-600" : "text-red-600"}>
                            {shop.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {shop.createdAt.toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">by {shop.createdBy}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canAssignProducts && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenProductAssignment(shop)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Assign Products"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditShop(shop)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Shop Dialog */}
      <Dialog open={isEditShopOpen} onOpenChange={setIsEditShopOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
          </DialogHeader>
          {editingShop && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editShopName">Shop Name</Label>
                <Input
                  id="editShopName"
                  value={editingShop.name}
                  onChange={(e) => setEditingShop((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="editShopLocation">Location</Label>
                <Input
                  id="editShopLocation"
                  value={editingShop.location}
                  onChange={(e) => setEditingShop((prev) => (prev ? { ...prev, location: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="editShopDescription">Description</Label>
                <Textarea
                  id="editShopDescription"
                  value={editingShop.description || ""}
                  onChange={(e) => setEditingShop((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="editManagerId">Shop Manager</Label>
                <Select
                  value={editingShop.managerId || "none"}
                  onValueChange={(value) =>
                    setEditingShop((prev) => (prev ? { ...prev, managerId: value || undefined } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {availableManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.fullName} ({manager.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={editingShop.isActive}
                  onCheckedChange={(checked) =>
                    setEditingShop((prev) => (prev ? { ...prev, isActive: checked } : null))
                  }
                />
                <Label htmlFor="editIsActive">Active Shop</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditShopOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateShop}>Update Shop</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Assignment Dialog */}
      <Dialog open={isAssignProductOpen && canAssignProducts} onOpenChange={setIsAssignProductOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Assign Products to {selectedShop?.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Check className="h-4 w-4" />
                {currentUser.role} Access
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Products Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Available Products
                </h3>
                <div className="text-sm text-gray-500">
                  {selectedProducts.length} selected
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Product List */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading products...</div>
                ) : filteredAvailableProducts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {productSearchTerm ? "No products found matching your search" : "No available products"}
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredAvailableProducts.map((product) => {
                      const isSelected = selectedProducts.includes(product.id)
                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  isSelected ? "border-green-500 bg-green-500" : "border-gray-300"
                                }`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">{product.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                <span>₦{product.price.toLocaleString()}</span>
                                <span>Stock: {product.availableStock}/{product.totalStock}</span>
                                <span className="text-blue-600">{product.warehouse?.name}</span>
                              </div>
                            </div>
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded ml-3"
                              />
                            )}
                          </div>

                          {/* Quantity Input */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`quantity-${product.id}`} className="text-xs font-medium">
                                  Assign Quantity:
                                </Label>
                                <Input
                                  id={`quantity-${product.id}`}
                                  type="number"
                                  min="1"
                                  max={product.availableStock}
                                  value={assignmentQuantities[product.id] || ""}
                                  onChange={(e) => updateAssignmentQuantity(product.id, parseInt(e.target.value) || 0)}
                                  className="w-20 h-8 text-xs"
                                  placeholder="Qty"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-xs text-gray-500">
                                  (max: {product.availableStock})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Current Shop Products Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-600" />
                Current Shop Products
              </h3>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading shop products...</div>
                ) : shopProducts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No products assigned to this shop yet
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {shopProducts.map((product) => (
                      <div key={product.id} className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-gray-500 mt-1 truncate">{product.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span>₦{product.price.toLocaleString()}</span>
                              <span className="text-purple-600 font-medium">
                                Assigned: {product.assignedStock}
                              </span>
                              <span className="text-blue-600">{product.warehouse?.name}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Assigned on {new Date(product.assignedAt).toLocaleDateString()}
                            </div>
                          </div>
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded ml-3"
                            />
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnassignProduct(selectedShop!.id, product.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                            disabled={loading}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Unassign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedProducts.length > 0 && (
                <span>
                  Ready to assign {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} to {selectedShop?.name}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAssignProductOpen(false)}
                disabled={loading}
              >
                Close
              </Button>
              <Button
                onClick={handleAssignProducts}
                disabled={loading || selectedProducts.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  "Assigning..."
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Assign Selected Products
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ShopManagement
