"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Eye, ShoppingCart, Package, DollarSign, Store, Crown } from "lucide-react"
import type { UserRole } from "@/pages/Dashboard"

interface RoleSelectorProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

const RoleSelector = ({ currentRole, onRoleChange }: RoleSelectorProps) => {
  const roles: { value: UserRole; label: string; icon: any; color: string }[] = [
    { value: "CEO", label: "CEO", icon: Crown, color: "bg-purple-100 text-purple-800" },
    { value: "Admin", label: "Admin Manager", icon: Users, color: "bg-blue-100 text-blue-800" },
    { value: "Attendee", label: "Sales Attendee", icon: Eye, color: "bg-green-100 text-green-800" },
    { value: "Receptionist", label: "Receptionist", icon: ShoppingCart, color: "bg-orange-100 text-orange-800" },
    { value: "Cashier", label: "Cashier", icon: DollarSign, color: "bg-yellow-100 text-yellow-800" },
    { value: "Packager", label: "Packager", icon: Package, color: "bg-pink-100 text-pink-800" },
    { value: "Storekeeper", label: "Storekeeper", icon: Store, color: "bg-indigo-100 text-indigo-800" },
    { value: "Warehousekeeper", label: "Warehousekeeper", icon: Store, color: "bg-teal-100 text-teal-800" },
  ]

  const currentRoleData = roles.find((r) => r.value === currentRole)

  return (
    <div className="flex items-center gap-4">
      <Select value={currentRole} onValueChange={(value: UserRole) => onRoleChange(value)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select Role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <SelectItem key={role.value} value={role.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {role.label}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {currentRoleData && (
        <Badge className={currentRoleData.color}>
          <currentRoleData.icon className="h-4 w-4 mr-1" />
          {currentRoleData.label}
        </Badge>
      )}
    </div>
  )
}

export default RoleSelector
