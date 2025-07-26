"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, User, Phone, Package, CheckCircle, DollarSign } from "lucide-react"
import { toast } from "sonner"
import TransactionTable from "@/components/TransactionTable"
import ReceiptGenerator from "@/components/ReceiptGenerator"
import type { Order } from "@/pages/Dashboard"
import { useEffect, useState } from "react"

interface ReceptionistInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
}

interface Packager {
  id: string
  name: string
  role: string
}

const ReceptionistInterface = ({ orders, onUpdateOrder }: ReceptionistInterfaceProps) => {
  const pendingOrders = orders.filter((order) => order.status === "pending_payment" || order.status === "paid")

  const myProcessedOrders = orders.filter((order) => order.receptionist === "Grace - Desk 2")

  // const availablePackagers = ["Tunde - Packager A", "Emeka - Packager B", "Sarah - Packager C", "Ahmed - Packager D"]
  const [availablePackagers, setAvailablePackagers] = useState([])

  useEffect(() => {
    const fetchPackagers = async () => {
      try {
        const response = await fetch('http://95.169.205.185:3333/users/packager',{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
        if (!response.ok) {
          throw new Error('Failed to fetch packagers');
        }
        const data = await response.json();
        setAvailablePackagers(data.data);  
      } catch (error) {
        console.error("Error fetching packagers:", error);
        toast.error("Failed to load packagers");
      }
    };  
    fetchPackagers();
  }, []);

  // const handleConfirmPayment = (orderId: string, method: "paystack" | "bank_transfer" | "cash") => {
  //  const getUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  //   onUpdateOrder(orderId, {
  //     status: "paid",
  //     paymentStatus: "confirmed",
  //     paymentMethod: method,
  //     receptionist: `${getUser.fullName} - ${getUser.role}`,
  //     receptionistId:getUser.id
  //   })
  //   toast.success(`Payment confirmed via ${method.replace("_", " ")}`)
  // }

  const handleConfirmPayment = async (orderId: string, method: "paystack" | "bank_transfer" | "cash") => {
  const getUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  if (!getUser?.id) {
    toast.error("User not found");
    return;
  }

  try {
    const res = await fetch(`http://95.169.205.185:3333/orders/payment/${orderId}`, {
      method: "PATCH",
      headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
      body: JSON.stringify({
        status: "paid",
        paymentStatus: "confirmed",
        paymentMethod: method,
        receptionistId: getUser.id,
        receptionist: `${getUser.fullName} - ${getUser.role}`
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.status) {
      throw new Error(result?.message || "Failed to update payment");
    }

  onUpdateOrder(orderId, {
      status: "paid",
      paymentStatus: "confirmed",
      paymentMethod: method,
      receptionist: `${getUser.fullName} - ${getUser.role}`,
      receptionistId:getUser.id
    })

    toast.success(`Payment confirmed via ${method.replace("_", " ")}`);
  } catch (err: any) {
    toast.error(err.message || "Failed to confirm payment");
  }
  };

  const handleAssignPackager = async (orderId: string, packager: any) => {
    console.log("🚀 ~ handleAssignPackager ~  packager:",  packager)
    const getUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  if (!getUser?.id) {
    toast.error("User not found");
    return;
  }

  try {
    const res = await fetch(`http://95.169.205.185:3333/orders/packager/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        packagerId: packager,
         status: "assigned_packager",
      }),
    });

    const result = await res.json();


    if (!res.ok || !result) {
      throw new Error(result?.message || "Failed to assign packager");
    }
    onUpdateOrder(orderId, {
      status: "assigned_packager",
      packager: packager,
    })
  //   toast.success(`Order assigned to ${packager}`)

    toast.success("Packager assigned successfully");
  } catch (err: any) {
    toast.error(err.message || "Failed to assign packager");
  }
};




  // const handleAssignPackager = (orderId: string, packager: string) => {
    

  //   onUpdateOrder(orderId, {
  //     status: "assigned_packager",
  //     packager: packager,
  //   })
  //   toast.success(`Order assigned to ${packager}`)
  // }

  const getPaymentStatusColor = (status: Order["paymentStatus"]) => {
    return status === "confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <Tabs defaultValue="pending" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-orange-600">Reception Dashboard</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Grace - Desk 2
        </Badge>
      </div>

      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending">Pending Orders ({pendingOrders.length})</TabsTrigger>
        <TabsTrigger value="processed">Processed Orders ({myProcessedOrders.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingOrders.map((order) => (
            <Card key={order.id} className="border-2 border-orange-200">
              <CardHeader className="bg-orange-50">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-orange-800">Order #{order.receiptId}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
                    <ReceiptGenerator order={order} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {order.customerName}
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {order.customerPhone}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Product List with Images */}
                <div>
                  <h4 className="font-semibold mb-2">Products:</h4>
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
                          <div className="flex justify-between text-sm">
                            <span>
                              {product?.name} (x{product?.quantity})
                            </span>
                            <span className="font-semibold">
                              ₦{(product?.price * product?.quantity).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">{product?.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">₦{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Attendee Info */}
                <div className="text-sm text-gray-600">
                  <strong>Handled by:</strong> {order?.attendee?.fullName || "N/A"} <br />
                </div>

                {/* Payment Actions */}
                {order.status === "pending_payment" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-600">Confirm Payment:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={() => handleConfirmPayment(order.id, "paystack")}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Paystack
                      </Button>
                      <Button
                        onClick={() => handleConfirmPayment(order.id, "bank_transfer")}
                        className="bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Transfer
                      </Button>
                      <Button
                        onClick={() => handleConfirmPayment(order.id, "cash")}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Cash
                      </Button>
                    </div>
                  </div>
                )}

                {/* Packager Assignment */}
                {order.status === "paid" && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-600">Assign Packager:</h4>
                    <Select onValueChange={(value) => handleAssignPackager(order.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a packager" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePackagers.map((packager: any) => (
                          <SelectItem key={packager?.fullName} value={packager?.id}>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {packager?.fullName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Display */}
                {order.status === "assigned_packager" && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold">Assigned to: {order.packager}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingOrders.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600">All Orders Processed</h3>
              <p className="text-gray-500">No pending orders at the moment.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="processed">
        <TransactionTable
          orders={myProcessedOrders}
          title="My Processed Orders"
          showActions={true}
          onViewOrder={(order) => <ReceiptGenerator order={order} title="View Receipt" />}
        />
      </TabsContent>
    </Tabs>
  )
}

export default ReceptionistInterface
