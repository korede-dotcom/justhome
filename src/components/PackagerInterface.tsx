"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, CheckCircle, Clock, User, Truck, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import TransactionTable from "@/components/TransactionTable"
import ReceiptGenerator from "@/components/ReceiptGenerator"
import type { Order } from "@/pages/Dashboard"

interface PackagerInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
}

const PackagerInterface = ({ orders, onUpdateOrder }: PackagerInterfaceProps) => {
  const myOrders = orders.filter(
    (order) =>
      order.packager === "Tunde - Packager B" && ["assigned_packager", "packaged", "picked_up"].includes(order.status),
  )

  const allMyOrders = orders.filter((order) => order.packager === "Tunde - Packager B")

  const handleMarkPackaged = (orderId: string) => {
    onUpdateOrder(orderId, {
      status: "packaged",
    })
    toast.success("Order marked as packaged and ready for pickup!")
  }

  const handleConfirmPickup = (orderId: string) => {
    onUpdateOrder(orderId, {
      status: "picked_up",
    })
    toast.success("Store pickup confirmed!")
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "assigned_packager":
        return "bg-purple-100 text-purple-800"
      case "packaged":
        return "bg-orange-100 text-orange-800"
      case "picked_up":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "assigned_packager":
        return <Clock className="h-4 w-4" />
      case "packaged":
        return <Package className="h-4 w-4" />
      case "picked_up":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <Tabs defaultValue="active" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-pink-600">Packager Dashboard</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Tunde - Packager B
        </Badge>
      </div>

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="active">Active Orders ({myOrders.length})</TabsTrigger>
        <TabsTrigger value="history">Order History ({allMyOrders.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myOrders.map((order) => (
            <Card key={order.id} className="border-2 border-pink-200">
              <CardHeader className="bg-pink-50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-pink-800">Order #{order.receiptId}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      {order.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <ReceiptGenerator order={order} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {order.customerName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {order.products.length} items
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Product List with Images */}
                <div>
                  <h4 className="font-semibold mb-2">Items to Package:</h4>
                  <div className="space-y-2">
                    {order.products.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <img
                          src={product.image || "/placeholder.svg?height=40&width=40"}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-gray-600 ml-2">({product.category})</span>
                            </div>
                            <Badge variant="outline">x{product.quantity}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Value</p>
                    <p className="font-bold text-green-600">₦{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-medium">{order.paymentMethod?.replace("_", " ").toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Attendee</p>
                    <p className="font-medium">{order.attendee}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Receptionist</p>
                    <p className="font-medium">{order.receptionist}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {order.status === "assigned_packager" && (
                    <Button
                      onClick={() => handleMarkPackaged(order.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Packaged
                    </Button>
                  )}

                  {order.status === "packaged" && (
                    <div className="space-y-2">
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-semibold">Ready for Store Pickup</span>
                        </div>
                        <p className="text-sm text-orange-600 mt-1">
                          Wait for storekeeper to verify receipt before proceeding.
                        </p>
                      </div>
                      <Button
                        onClick={() => handleConfirmPickup(order.id)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Confirm Store Pickup
                      </Button>
                    </div>
                  )}

                  {order.status === "picked_up" && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold">Completed</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">Items picked up from store successfully.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {myOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-pink-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">No Orders Assigned</h3>
              <p className="text-gray-500">You'll see new packaging tasks here when they're assigned to you.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="history">
        <TransactionTable
          orders={allMyOrders}
          title="My Order History"
          showActions={true}
          onViewOrder={(order) => <ReceiptGenerator order={order} title="View Receipt" />}
        />
      </TabsContent>
    </Tabs>
  )
}

export default PackagerInterface
