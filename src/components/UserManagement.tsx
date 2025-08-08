"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Edit, Search, Users, Shield, ShieldCheck, Package, ShoppingCart, Eye, Tag } from "lucide-react"
import { toast } from "sonner"
import type { User, UserRole, Shop, Warehouse } from "@/pages/Dashboard"
import { api, getAuthHeaders } from "@/lib/api"

interface UserManagementProps {
  users: User[]
  shops: Shop[]
  warehouses: Warehouse[]
  currentUser: User
  onAddUser: (userData: Omit<User, "id" | "createdAt">) => void
  onUpdateUser: (userId: string, updates: Partial<User>) => void
}

const UserManagement = ({ users, shops, warehouses, currentUser, onAddUser, onUpdateUser }: UserManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)

  // Product Catalog states
  const [products, setProducts] = useState<any[]>([])
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    fullName: "",
    role: "Attendee" as UserRole,
    shopId: "",
    warehouseId: "",
    isActive: true,
  })

  const roles: UserRole[] = [
    "CEO",
    "Admin",
    "Attendee",
    "Receptionist",
    "Cashier",
    "Packager",
    "Storekeeper",
    "Warehousekeeper",
  ]

  const canManageUsers = currentUser.role === "CEO" || currentUser.role === "Admin"

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive)

    return matchesSearch && matchesRole && matchesStatus
  })

  const requiresShop = (role: UserRole) => {
    return ["Attendee", "Receptionist", "Packager", "Storekeeper"].includes(role)
  }

  const requiresWarehouse = (role: UserRole) => {
    return role === "Warehousekeeper"
  }

  // Fetch products for catalog
  const fetchProductCatalog = async () => {
    try {
      setLoading(true)
      const endpoint = currentUser.shopId
        ? api.shops.products.myShopProducts(currentUser.shopId)
        : api.warehouses.products.all

      const res = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error("Failed to fetch products")
      }

      const response = await res.json()
      if (response.status && response.data) {
        setProducts(response.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  // Filter products for catalog
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                         product.category?.toLowerCase().includes(productSearchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.fullName.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    if (requiresShop(newUser.role) && !newUser.shopId) {
      toast.error("Please select a shop for this role")
      return
    }

    if (requiresWarehouse(newUser.role) && !newUser.warehouseId) {
      toast.error("Please select a warehouse for this role")
      return
    }

    try {
      const userData = {
        ...newUser,
        createdBy: currentUser.username,
        shopId: requiresShop(newUser.role) ? newUser.shopId : undefined,
        warehouseId: requiresWarehouse(newUser.role) ? newUser.warehouseId : undefined,
      }

      const res = await fetch(api.users.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to create user")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status) {
        throw new Error(response.message || "Failed to create user")
      }

      toast.success("User created successfully")

      // Call the parent callback to refresh the user list
      onAddUser(userData)

      setNewUser({
        username: "",
        email: "",
        fullName: "",
        role: "Attendee",
        shopId: "",
        warehouseId: "",
        isActive: true,
      })
      setIsAddUserOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to create user")
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditUserOpen(true)
  }

  const handleUpdateUser = () => {
    if (!editingUser) return

    onUpdateUser(editingUser.id, editingUser)
    setEditingUser(null)
    setIsEditUserOpen(false)
    toast.success("User updated successfully")
  }

  const handleToggleUserStatus = (userId: string, isActive: boolean) => {
    onUpdateUser(userId, { isActive })
    toast.success(`User ${isActive ? "activated" : "deactivated"} successfully`)
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "CEO":
        return <ShieldCheck className="h-4 w-4 text-purple-600" />
      case "Admin":
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <Users className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "CEO":
        return "bg-purple-100 text-purple-800"
      case "Admin":
        return "bg-blue-100 text-blue-800"
      case "Attendee":
        return "bg-green-100 text-green-800"
      case "Receptionist":
        return "bg-orange-100 text-orange-800"
      case "Packager":
        return "bg-pink-100 text-pink-800"
      case "Storekeeper":
        return "bg-indigo-100 text-indigo-800"
      case "Cashier":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to manage users.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="catalog" onClick={fetchProductCatalog}>Product Catalog - Show to Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="john_doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: UserRole) => setNewUser((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          {role}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {requiresShop(newUser.role) && (
                <div>
                  <Label htmlFor="shopId">Shop *</Label>
                  <Select
                    value={newUser.shopId}
                    onValueChange={(value) => setNewUser((prev) => ({ ...prev, shopId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Shop" />
                    </SelectTrigger>
                    <SelectContent>
                      {shops
                        .filter((shop) => shop.isActive)
                        .map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name} - {shop.location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {requiresWarehouse(newUser.role) && (
                <div>
                  <Label htmlFor="warehouseId">Warehouse *</Label>
                  <Select
                    value={newUser.warehouseId}
                    onValueChange={(value) => setNewUser((prev) => ({ ...prev, warehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter((warehouse) => warehouse.isActive)
                        .map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} - {warehouse.location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newUser.isActive}
                  onCheckedChange={(checked) => setNewUser((prev) => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active User</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Add User</Button>
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
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{users.filter((u) => u.isActive).length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter((u) => u.role === "CEO" || u.role === "Admin").length}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter((u) => !["CEO", "Admin"].includes(u.role)).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.shopId && (
                          <div className="text-xs text-blue-600">
                            Shop: {shops.find((s) => s.id === user.shopId)?.name || "Unknown"}
                          </div>
                        )}
                        {user.warehouseId && (
                          <div className="text-xs text-teal-600">
                            Warehouse: {warehouses.find((w) => w.id === user.warehouseId)?.name || "Unknown"}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {user.role}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleToggleUserStatus(user.id, checked)}
                          disabled={user.id === currentUser.id}
                        />
                        <span className={user.isActive ? "text-green-600" : "text-red-600"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.createdAt.toLocaleDateString()}</div>
                        <div className="text-gray-500">by {user.createdBy}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <div className="text-sm">
                          <div>{user.lastLogin.toLocaleDateString()}</div>
                          <div className="text-gray-500">{user.lastLogin.toLocaleTimeString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                        disabled={user.id === currentUser.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editUsername">Username</Label>
                  <Input
                    id="editUsername"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, fullName: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value: UserRole) =>
                    setEditingUser((prev) => (prev ? { ...prev, role: value } : null))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          {role}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={editingUser.isActive}
                  onCheckedChange={(checked) =>
                    setEditingUser((prev) => (prev ? { ...prev, isActive: checked } : null))
                  }
                />
                <Label htmlFor="editIsActive">Active User</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Update User</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Product Catalog Tab */}
        <TabsContent value="catalog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Product Catalog - Customer View
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
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
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading products...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="relative">
                        <img
                          src={product.image || "/placeholder.svg?height=200&width=200"}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-white">
                            <Tag className="h-3 w-3 mr-1" />
                            {product.category || "No Category"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                          </div>

                          <div className="text-2xl font-bold text-green-600">
                            ₦{product.price?.toLocaleString() || "0"}
                          </div>

                          {/* Shop Stock Information */}
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-blue-50 p-2 rounded text-center">
                                <div className="text-blue-600 font-medium">Assigned</div>
                                <div className="text-blue-800 font-bold">{product.assignedQuantity || 0}</div>
                              </div>
                              <div className="bg-green-50 p-2 rounded text-center">
                                <div className="text-green-600 font-medium">Available</div>
                                <div className="text-green-800 font-bold">{product.shopAvailableQuantity || 0}</div>
                              </div>
                              <div className="bg-purple-50 p-2 rounded text-center">
                                <div className="text-purple-600 font-medium">Sold</div>
                                <div className="text-purple-800 font-bold">{product.shopSoldQuantity || 0}</div>
                              </div>
                            </div>

                            {/* Stock Status */}
                            {(product.shopAvailableQuantity || 0) === 0 && (
                              <Badge variant="destructive" className="w-full justify-center">
                                Out of Stock
                              </Badge>
                            )}
                            {(product.shopAvailableQuantity || 0) > 0 && (product.shopAvailableQuantity || 0) <= 5 && (
                              <Badge variant="secondary" className="w-full justify-center bg-orange-100 text-orange-800">
                                Low Stock - {product.shopAvailableQuantity} remaining
                              </Badge>
                            )}
                            {(product.shopAvailableQuantity || 0) > 5 && (
                              <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800">
                                In Stock
                              </Badge>
                            )}
                          </div>

                          {/* Customer Action Button */}
                          <Button
                            className="w-full"
                            disabled={(product.shopAvailableQuantity || 0) === 0}
                            variant={(product.shopAvailableQuantity || 0) === 0 ? "secondary" : "default"}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {(product.shopAvailableQuantity || 0) === 0 ? "Out of Stock" : "Add to Cart"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">No Products Found</h3>
                  <p className="text-gray-500">
                    {products.length === 0 ? "No products available in catalog" : "No products match your search criteria"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UserManagement
