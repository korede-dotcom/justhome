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
import { Warehouse, Plus, Edit, Users, MapPin, Calendar, User } from "lucide-react"
import { toast } from "sonner"
import type { Warehouse as WarehouseType, User as UserType } from "@/pages/Dashboard"

interface WarehouseManagementProps {
  warehouses: WarehouseType[]
  users: UserType[]
  currentUser: UserType
  onAddWarehouse: (warehouseData: Omit<WarehouseType, "id" | "createdAt">) => void
  onUpdateWarehouse: (warehouseId: string, updates: Partial<WarehouseType>) => void
}

const WarehouseManagement = ({
  warehouses,
  users,
  currentUser,
  onAddWarehouse,
  onUpdateWarehouse,
}: WarehouseManagementProps) => {
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null)
  const [isEditWarehouseOpen, setIsEditWarehouseOpen] = useState(false)

  const [newWarehouse, setNewWarehouse] = useState({
    name: "",
    location: "",
    description: "",
    managerId: "",
    isActive: true,
  })

  const availableManagers = users.filter((user) => ["Admin", "Warehousekeeper"].includes(user.role) && user.isActive)

  const handleAddWarehouse = () => {
    if (!newWarehouse.name.trim() || !newWarehouse.location.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    onAddWarehouse({
      ...newWarehouse,
      name: newWarehouse.name.trim(),
      location: newWarehouse.location.trim(),
      description: newWarehouse.description.trim(),
      managerId: newWarehouse.managerId || undefined,
      createdBy: currentUser.username,
    })

    setNewWarehouse({
      name: "",
      location: "",
      description: "",
      managerId: "",
      isActive: true,
    })
    setIsAddWarehouseOpen(false)
  }

  const handleEditWarehouse = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse)
    setIsEditWarehouseOpen(true)
  }

  const handleUpdateWarehouse = () => {
    if (!editingWarehouse) return

    onUpdateWarehouse(editingWarehouse.id, editingWarehouse)
    setEditingWarehouse(null)
    setIsEditWarehouseOpen(false)
  }

  const handleToggleWarehouseStatus = (warehouseId: string, isActive: boolean) => {
    onUpdateWarehouse(warehouseId, { isActive })
    toast.success(`Warehouse ${isActive ? "activated" : "deactivated"} successfully`)
  }

  const getWarehouseStats = (warehouseId: string) => {
    const warehouseUsers = users.filter((user) => user.warehouseId === warehouseId)
    return {
      totalUsers: warehouseUsers.length,
      warehousekeepers: warehouseUsers.filter((u) => u.role === "Warehousekeeper").length,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Warehouse Management</h2>
          <p className="text-gray-600">Manage warehouses and their assignments</p>
        </div>
        <Dialog open={isAddWarehouseOpen} onOpenChange={setIsAddWarehouseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="warehouseName">Warehouse Name *</Label>
                <Input
                  id="warehouseName"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Central Warehouse"
                />
              </div>
              <div>
                <Label htmlFor="warehouseLocation">Location *</Label>
                <Input
                  id="warehouseLocation"
                  value={newWarehouse.location}
                  onChange={(e) => setNewWarehouse((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Ikeja, Lagos"
                />
              </div>
              <div>
                <Label htmlFor="warehouseDescription">Description</Label>
                <Textarea
                  id="warehouseDescription"
                  value={newWarehouse.description}
                  onChange={(e) => setNewWarehouse((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the warehouse"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="managerId">Warehouse Manager</Label>
                <Select
                  value={newWarehouse.managerId}
                  onValueChange={(value) => setNewWarehouse((prev) => ({ ...prev, managerId: value }))}
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
                  checked={newWarehouse.isActive}
                  onCheckedChange={(checked) => setNewWarehouse((prev) => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active Warehouse</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsAddWarehouseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddWarehouse}>Add Warehouse</Button>
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
                <p className="text-sm text-gray-600">Total Warehouses</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <Warehouse className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Warehouses</p>
                <p className="text-2xl font-bold text-green-600">{warehouses.filter((w) => w.isActive).length}</p>
              </div>
              <Warehouse className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Managers</p>
                <p className="text-2xl font-bold text-purple-600">{warehouses.filter((w) => w.managerId).length}</p>
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
                <p className="text-2xl font-bold text-orange-600">{users.filter((u) => u.warehouseId).length}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouses ({warehouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse Details</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Staff Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => {
                  const stats = getWarehouseStats(warehouse.id)
                  const manager = warehouse.managerId ? users.find((u) => u.id === warehouse.managerId) : null

                  return (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-teal-500" />
                            {warehouse.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {warehouse.location}
                          </div>
                          {warehouse.description && (
                            <div className="text-xs text-gray-400 mt-1">{warehouse.description}</div>
                          )}
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
                          <div className="text-xs text-gray-500">Warehousekeepers: {stats.warehousekeepers}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={warehouse.isActive}
                            onCheckedChange={(checked) => handleToggleWarehouseStatus(warehouse.id, checked)}
                          />
                          <span className={warehouse.isActive ? "text-green-600" : "text-red-600"}>
                            {warehouse.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {warehouse.createdAt.toLocaleDateString()}
                          </div>
                          <div className="text-gray-500">by {warehouse.createdBy}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditWarehouse(warehouse)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Warehouse Dialog */}
      <Dialog open={isEditWarehouseOpen} onOpenChange={setIsEditWarehouseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
          </DialogHeader>
          {editingWarehouse && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editWarehouseName">Warehouse Name</Label>
                <Input
                  id="editWarehouseName"
                  value={editingWarehouse.name}
                  onChange={(e) => setEditingWarehouse((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="editWarehouseLocation">Location</Label>
                <Input
                  id="editWarehouseLocation"
                  value={editingWarehouse.location}
                  onChange={(e) => setEditingWarehouse((prev) => (prev ? { ...prev, location: e.target.value } : null))}
                />
              </div>
              <div>
                <Label htmlFor="editWarehouseDescription">Description</Label>
                <Textarea
                  id="editWarehouseDescription"
                  value={editingWarehouse.description || ""}
                  onChange={(e) =>
                    setEditingWarehouse((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="editManagerId">Warehouse Manager</Label>
                <Select
                  value={editingWarehouse.managerId || "none"}
                  onValueChange={(value) =>
                    setEditingWarehouse((prev) => (prev ? { ...prev, managerId: value || undefined } : null))
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
                  checked={editingWarehouse.isActive}
                  onCheckedChange={(checked) =>
                    setEditingWarehouse((prev) => (prev ? { ...prev, isActive: checked } : null))
                  }
                />
                <Label htmlFor="editIsActive">Active Warehouse</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditWarehouseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateWarehouse}>Update Warehouse</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WarehouseManagement
