"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, Phone, CreditCard } from "lucide-react"
import type { Order } from "@/pages/Dashboard"

interface OrderDetailsModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
}

const OrderDetailsModal = ({ order, isOpen, onClose }: OrderDetailsModalProps) => {
  if (!order) return null

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      case "assigned_packager":
        return "bg-purple-100 text-purple-800"
      case "packaged":
        return "bg-orange-100 text-orange-800"
      case "picked_up":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return "Pending Payment"
      case "paid":
        return "Paid"
      case "assigned_packager":
        return "Assigned to Packager"
      case "packaged":
        return "Packaged"
      case "picked_up":
        return "Picked Up"
      case "delivered":
        return "Delivered"
      default:
        return "Unknown"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details - {order.receiptId}</span>
            <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
                </span>
              </div>
              {order.paymentMethod && (
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline">{order.paymentMethod.replace("_", " ").toUpperCase()}</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Order Items</h3>
            <div className="space-y-2">
              {order.products?.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {product.image && (
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                        }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category}</p>
                      <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{product.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      Total: ₦{(product.price * product.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Staff Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Staff Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sales Attendee</p>
                <p className="font-medium">{order.attendee?.fullName || "Not assigned"}</p>
              </div>
              {order.receptionist && (
                <div>
                  <p className="text-sm text-gray-600">Receptionist</p>
                  <p className="font-medium">{order.receptionist.fullName}</p>
                </div>
              )}
              {order.packager && (
                <div>
                  <p className="text-sm text-gray-600">Packager</p>
                  <p className="font-medium">{order.packager.fullName}</p>
                </div>
              )}
              {order.storekeeper && (
                <div>
                  <p className="text-sm text-gray-600">Storekeeper</p>
                  <p className="font-medium">{order.storekeeper.fullName}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">₦{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Payment Status</span>
                <Badge variant={order.paymentStatus === "confirmed" ? "default" : "secondary"}>
                  {order.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => window.print()}>Print Receipt</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OrderDetailsModal
