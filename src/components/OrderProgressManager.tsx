"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  User,
  ArrowRight,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import type { Order, OrderStatus, User as UserType } from "@/pages/Dashboard"
import { api, getAuthHeaders } from "@/lib/api"

interface OrderProgressManagerProps {
  order: Order
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  currentUser: UserType
  users: UserType[]
}

const OrderProgressManager = ({ order, onUpdateOrder, currentUser, users }: OrderProgressManagerProps) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Get order progress percentage
  const getOrderProgress = (status: OrderStatus): number => {
    const progressMap: Record<OrderStatus, number> = {
      pending_payment: 10,
      partial_payment: 20,
      paid: 30,
      confirmed: 40,
      assigned_packager: 50,
      packaging: 60,
      packaged: 70,
      assigned_delivery: 75,
      out_for_delivery: 85,
      ready_for_pickup: 80,
      picked_up: 95,
      delivered: 100,
      completed: 100,
      cancelled: 0,
      refunded: 0,
    }
    return progressMap[status] || 0
  }

  // Get status display info
  const getStatusInfo = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
      pending_payment: { label: "Pending Payment", color: "bg-red-100 text-red-800", icon: Clock },
      partial_payment: { label: "Partial Payment", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle },
      confirmed: { label: "Payment Confirmed", color: "bg-green-100 text-green-800", icon: CheckCircle },
      assigned_packager: { label: "Assigned to Packager", color: "bg-blue-100 text-blue-800", icon: User },
      packaging: { label: "Being Packaged", color: "bg-blue-100 text-blue-800", icon: Package },
      packaged: { label: "Packaged", color: "bg-purple-100 text-purple-800", icon: Package },
      assigned_delivery: { label: "Assigned for Delivery", color: "bg-indigo-100 text-indigo-800", icon: Truck },
      out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800", icon: Truck },
      ready_for_pickup: { label: "Ready for Pickup", color: "bg-purple-100 text-purple-800", icon: Package },
      picked_up: { label: "Picked Up", color: "bg-green-100 text-green-800", icon: CheckCircle },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
      refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800", icon: AlertTriangle },
    }
    return statusConfig[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: AlertTriangle }
  }

  // Get next possible actions based on current status
  const getNextActions = (status: OrderStatus) => {
    switch (status) {
      case "pending_payment":
        return []
      case "partial_payment":
        return [
          { action: "confirm_payment", label: "Confirm Payment", requiresAssignment: false },
        ]
      case "paid":
        return [
          { action: "confirm_payment", label: "Confirm Payment", requiresAssignment: false },
        ]
      case "confirmed":
        return [
          { action: "assign_packager", label: "Assign to Packager", requiresAssignment: true },
        ]
      case "assigned_packager":
        return [
          { action: "start_packaging", label: "Start Packaging", requiresAssignment: false },
        ]
      case "packaging":
        return [
          { action: "complete_packaging", label: "Complete Packaging", requiresAssignment: false },
        ]
      case "packaged":
        return [
          { action: "ready_pickup", label: "Ready for Pickup", requiresAssignment: false },
          { action: "assign_delivery", label: "Assign for Delivery", requiresAssignment: true },
        ]
      case "ready_for_pickup":
        return [
          { action: "mark_picked_up", label: "Mark as Picked Up", requiresAssignment: false },
        ]
      case "assigned_delivery":
        return [
          { action: "start_delivery", label: "Start Delivery", requiresAssignment: false },
        ]
      case "out_for_delivery":
        return [
          { action: "mark_delivered", label: "Mark as Delivered", requiresAssignment: false },
        ]
      case "picked_up":
      case "delivered":
        return [
          { action: "complete_order", label: "Complete Order", requiresAssignment: false },
        ]
      default:
        return []
    }
  }

  // Handle status update
  const handleStatusUpdate = async (action: string, assignedUserId?: string) => {
    setLoading(true)
    
    try {
      let newStatus: OrderStatus = order.status
      let updates: Partial<Order> = {
        notes: notes || order.notes,
        updatedAt: new Date(),
      }

      switch (action) {
        case "confirm_payment":
          newStatus = "confirmed"
          updates.paymentStatus = "confirmed"
          break
        case "assign_packager":
          newStatus = "assigned_packager"
          updates.packagerId = assignedUserId
          updates.packager = users.find(u => u.id === assignedUserId)
          updates.assignedAt = new Date()
          toast.info(`Order assigned to packager: ${users.find(u => u.id === assignedUserId)?.fullName}`)
          break
        case "start_packaging":
          newStatus = "packaging"
          break
        case "complete_packaging":
          newStatus = "packaged"
          updates.packagedAt = new Date()
          break
        case "ready_pickup":
          newStatus = "ready_for_pickup"
          break
        case "assign_delivery":
          newStatus = "assigned_delivery"
          updates.storekeeperId = assignedUserId
          updates.storekeeper = users.find(u => u.id === assignedUserId)
          updates.assignedAt = new Date()
          break
        case "start_delivery":
          newStatus = "out_for_delivery"
          break
        case "mark_picked_up":
          newStatus = "picked_up"
          updates.deliveredAt = new Date()
          break
        case "mark_delivered":
          newStatus = "delivered"
          updates.deliveredAt = new Date()
          break
        case "complete_order":
          newStatus = "completed"
          break
      }

      updates.status = newStatus

      // Update local state
      onUpdateOrder(order.id, updates)

      // Show success message
      const statusInfo = getStatusInfo(newStatus)
      toast.success(`Order updated to: ${statusInfo.label}`)

      // Reset form
      setSelectedUserId("")
      setNotes("")
      setAssignDialogOpen(false)

    } catch (error: any) {
      console.error("Status update error:", error)
      toast.error(error.message || "Failed to update order status")
    } finally {
      setLoading(false)
    }
  }

  const currentStatusInfo = getStatusInfo(order.status)
  const StatusIcon = currentStatusInfo.icon
  const progress = getOrderProgress(order.status)
  const nextActions = getNextActions(order.status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Progress
          </div>
          <Badge className={currentStatusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {currentStatusInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Order Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Created</span>
            <span>In Progress</span>
            <span>Completed</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">Receipt ID</Label>
            <p className="font-medium">{order.receiptId}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Customer</Label>
            <p className="font-medium">{order.customerName}</p>
          </div>
          {order.packager && (
            <div>
              <Label className="text-muted-foreground">Packager</Label>
              <p className="font-medium">{order.packager.fullName}</p>
            </div>
          )}
          {order.storekeeper && (
            <div>
              <Label className="text-muted-foreground">Delivery Person</Label>
              <p className="font-medium">{order.storekeeper.fullName}</p>
            </div>
          )}
        </div>

        {/* Payment Status */}
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Payment Status</span>
            <Badge variant="outline" className={
              order.paymentStatus === "paid" || order.paymentStatus === "confirmed" || order.paymentStatus === "overpaid"
                ? "bg-green-50 text-green-700"
                : order.paymentStatus === "partial"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-red-50 text-red-700"
            }>
              {order.paymentStatus.toUpperCase()}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Paid: ₦{(order.paidAmount || 0).toLocaleString()} / ₦{order.totalAmount.toLocaleString()}
            {order.paymentStatus === "overpaid" && (
              <div className="text-blue-600 font-medium">
                Overpaid by: ₦{((order.paidAmount || 0) - order.totalAmount).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {nextActions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Available Actions</Label>
            <div className="flex flex-wrap gap-2">
              {nextActions.map((actionItem) => (
                <div key={actionItem.action}>
                  {actionItem.requiresAssignment ? (
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {actionItem.label}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{actionItem.label}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="user">Assign to User *</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                              </SelectTrigger>
                              <SelectContent>
                                {users
                                  .filter(user => 
                                    actionItem.action === "assign_packager" 
                                      ? user.role === "Packager" 
                                      : user.role === "Storekeeper"
                                  )
                                  .map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.fullName} ({user.role})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add notes (optional)"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setAssignDialogOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleStatusUpdate(actionItem.action, selectedUserId)}
                              disabled={loading || !selectedUserId}
                              className="flex-1"
                            >
                              {loading ? "Processing..." : actionItem.label}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(actionItem.action)}
                      disabled={loading}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {actionItem.label}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Notes */}
        {order.notes && (
          <div className="bg-muted p-3 rounded-lg">
            <Label className="text-sm font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Notes
            </Label>
            <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderProgressManager
