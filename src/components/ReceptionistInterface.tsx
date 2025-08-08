"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CreditCard, DollarSign, AlertTriangle, CheckCircle, Clock, Receipt, Plus, Eye, Search, Package, User } from "lucide-react"
import { toast } from "sonner"
import type { Order, User } from "@/pages/Dashboard"
import PaymentManager from "./PaymentManager"
import OrderProgressManager from "./OrderProgressManager"
import ReceiptGenerator from "./ReceiptGenerator"
import { api, getAuthHeaders, } from "../lib/api"

interface ReceptionistInterfaceProps {
  orders: Order[]
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  currentUser?: User
  users?: User[]
}

const ReceptionistInterface = ({ orders, onUpdateOrder, currentUser, users = [] }: ReceptionistInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [packagerDialogOpen, setPackagerDialogOpen] = useState(false)
  const [selectedPackagerId, setSelectedPackagerId] = useState("")
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null)

  // Filter orders that need payment processing or management
  const pendingOrders = orders.filter((order) =>
    order.paymentStatus === "pending" ||
    order.paymentStatus === "partial" ||
    order.paymentStatus === "paid" ||
    order.paymentStatus === "overpaid" ||  // ✅ Include overpaid orders
    order.paymentStatus === "confirmed" ||
    (order.status === "paid" || order.status === "confirmed") // ✅ Include orders that need management
  )

  const filteredOrders = pendingOrders.filter(
    (order) =>
      order.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handlePaymentRecord = async () => {
    if (!selectedOrder || !paymentAmount || !paymentMethod) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = Number.parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    try {

      const response = await fetch(api.orders.recordPayment(selectedOrder.id), {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentAmount: amount,
          paymentMethod: paymentMethod,
          paymentReference: paymentReference,
          notes: paymentNotes,
        }),
      })
      // Call the payment recording API endpoint
      // const response = await fetch(`/api/orders/${selectedOrder.id}/payment`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     paymentAmount: amount,
      //     paymentMethod: paymentMethod,
      //     paymentReference: paymentReference,
      //     notes: paymentNotes,
      //   }),
      // })

      if (!response.ok) {
        throw new Error("Failed to record payment")
      }

      const data = await response.json()

      // Update local state with the response data
      const updates: Partial<Order> = {
        paidAmount: data.summary.paidAmount,
        balanceAmount: data.summary.balanceAmount,
        paymentStatus: data.summary.paymentStatus,
        paymentMethod: paymentMethod as Order["paymentMethod"],
        status: data.summary.paymentStatus === "paid" ? "paid" : selectedOrder.status,
      }

      onUpdateOrder(selectedOrder.id, updates)

      toast.success(
        data.summary.balanceAmount <= 0
          ? "Payment completed successfully!"
          : `Partial payment recorded. ₦${data.summary.balanceAmount.toLocaleString()} remaining.`,
      )

      // Reset form
      setPaymentAmount("")
      setPaymentMethod("")
      setPaymentReference("")
      setPaymentNotes("")
      setSelectedOrder(null)
    } catch (error: any) {
      console.error("Error recording payment:", error)
      toast.error("Failed to record payment")
    }
  }

  // ✅ Quick assign packager function
  const handleQuickAssignPackager = (order: Order) => {
    setOrderToAssign(order)
    setPackagerDialogOpen(true)
  }

  // ✅ Assign packager to order using API endpoint
  const handleAssignPackager = async () => {
    if (!orderToAssign || !selectedPackagerId) {
      toast.error("Please select a packager")
      return
    }

    try {
      const selectedPackager = users.find(u => u.id === selectedPackagerId)

      // Call the packager assignment API endpoint
      // const response = await fetch(`/orders/packager/${orderToAssign.id}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     packagerId: selectedPackagerId,
      //   }),
      // })
      const response = await fetch(api.orders.packager(orderToAssign.id), {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packagerId: selectedPackagerId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign packager")
      }

      const data = await response.json()

      // Update local state
      const updates: Partial<Order> = {
        status: "assigned_packager",
        packagerId: selectedPackagerId,
        packager: selectedPackager,
        assignedAt: new Date(),
        updatedAt: new Date(),
      }

      onUpdateOrder(orderToAssign.id, updates)

      toast.success(`Order ${orderToAssign.receiptId} assigned to ${selectedPackager?.fullName}`)

      // Auto-refresh by triggering a re-fetch of orders
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }

      // Reset form
      setPackagerDialogOpen(false)
      setSelectedPackagerId("")
      setOrderToAssign(null)
    } catch (error: any) {
      console.error("Error assigning packager:", error)
      toast.error("Failed to assign packager")
    }
  }

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount || 0
    return `₦${safeAmount.toLocaleString()}`
  }

  const getPaymentStatusBadge = (paymentStatus: Order["paymentStatus"]) => {
    const statusConfig = {
      pending: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", text: "Pending", icon: Clock },
      partial: {
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        text: "Partial",
        icon: AlertTriangle,
      },
      paid: {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        text: "Paid",
        icon: CheckCircle,
      },
      overpaid: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        text: "Overpaid",
        icon: CheckCircle,
      },
      confirmed: {
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        text: "Confirmed",
        icon: CheckCircle,
      },
    }

    const config = statusConfig[paymentStatus] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const stats = {
    totalPending: pendingOrders.length,
    totalOutstanding: pendingOrders.reduce((sum, order) => sum + (order.balanceAmount || order.totalAmount), 0),
    partialPayments: orders.filter((order) => order.paymentStatus === "partial").length,
    paidOrders: orders.filter((order) => order.paymentStatus === "paid" || order.paymentStatus === "overpaid").length,
    todayProcessed: orders.filter((order) => {
      const today = new Date()
      const orderDate = new Date(order.createdAt)
      return orderDate.toDateString() === today.toDateString() && (order.paymentStatus === "confirmed" || order.paymentStatus === "paid" || order.paymentStatus === "overpaid")
    }).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Processing</h2>
          <p className="text-muted-foreground">Process customer payments and manage payment records</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Receptionist Access
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white dark:from-red-600 dark:to-red-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-red-200">Orders awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white dark:from-yellow-600 dark:to-yellow-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-100">Outstanding Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
            <p className="text-xs text-yellow-200">Total pending collection</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white dark:from-orange-600 dark:to-orange-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Partial Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partialPayments}</div>
            <p className="text-xs text-orange-200">Orders with partial payment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white dark:from-green-600 dark:to-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Today Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayProcessed}</div>
            <p className="text-xs text-green-200">Payments completed today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Payments ({stats.totalPending})</TabsTrigger>
          <TabsTrigger value="partial">Partial Payments ({stats.partialPayments})</TabsTrigger>
          <TabsTrigger value="process">Process Payment</TabsTrigger>
          <TabsTrigger value="manage">Manage Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Orders Awaiting Payment</CardTitle>
                  <CardDescription>Process payments for pending orders</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className={`hover:bg-muted/50 ${selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                      >
                        <TableCell className="font-medium">{order.receiptId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(order.paidAmount || 0)}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {formatCurrency(order.balanceAmount || order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getPaymentStatusBadge(order.paymentStatus)}
                            {order.paymentStatus === "partial" && (
                              <Progress
                                value={((order.paidAmount || 0) / order.totalAmount) * 100}
                                className="h-2 w-20"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{order.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Order Details - {order.receiptId}</DialogTitle>
                                  <DialogDescription>Complete order and payment information</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Customer</Label>
                                      <p className="text-sm">{order.customerName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Phone</Label>
                                      <p className="text-sm">{order.customerPhone || "N/A"}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Total Amount</Label>
                                      <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Payment Status</Label>
                                      <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus)}</div>
                                    </div>
                                  </div>

                                  {order.paymentStatus === "partial" && (
                                    <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                                      <h4 className="font-medium mb-2">Payment Progress</h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                          <span>Paid:</span>
                                          <span className="font-medium text-green-600">
                                            {formatCurrency(order.paidAmount || 0)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                          <span>Remaining:</span>
                                          <span className="font-medium text-red-600">
                                            {formatCurrency(order.balanceAmount || 0)}
                                          </span>
                                        </div>
                                        <Progress
                                          value={((order.paidAmount || 0) / order.totalAmount) * 100}
                                          className="h-3"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setActiveTab("process")
                                toast.info(`Selected order ${order.receiptId} for payment processing`)
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrder(order)
                                setActiveTab("manage")
                                toast.info(`Managing order ${order.receiptId}`)
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Manage
                            </Button>

                            {/* ✅ Direct Assign Packager Button - Only show if no packager assigned */}
                            {(order.status === "paid" || order.status === "confirmed" ||
                              order.paymentStatus === "paid" || order.paymentStatus === "overpaid" || order.paymentStatus === "confirmed") &&
                              !order.packagerId && !order.packager && (
                              <Button
                                size="sm"
                                onClick={() => handleQuickAssignPackager(order)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <User className="h-4 w-4 mr-1" />
                                Assign Packager
                              </Button>
                            )}

                            {/* Show packager info if already assigned */}
                            {order.packager && (
                              <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                Packager: {order.packager.fullName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Pending Payments</h3>
                  <p>All orders have been processed or no orders match your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="partial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Partial Payments</CardTitle>
              <CardDescription>Orders with partial payments requiring completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders
                  .filter((order) => order.paymentStatus === "partial")
                  .map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{order.receiptId}</h4>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Partial Payment
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Amount</Label>
                          <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Paid Amount</Label>
                          <p className="font-semibold text-green-600">{formatCurrency(order.paidAmount || 0)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Balance</Label>
                          <p className="font-semibold text-red-600">{formatCurrency(order.balanceAmount || 0)}</p>
                        </div>
                      </div>

                      <Progress value={((order.paidAmount || 0) / order.totalAmount) * 100} className="mb-3 h-2" />

                      <div className="space-y-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setActiveTab("process")
                            toast.info(`Selected order ${order.receiptId} for payment processing`)
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order)
                            setActiveTab("manage")
                            toast.info(`Managing order ${order.receiptId}`)
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Manage Order
                        </Button>

                        {/* ✅ Direct Assign Packager Button for Partial Payments - Only show if no packager assigned */}
                        {(order.status === "paid" || order.status === "confirmed" ||
                          order.paymentStatus === "paid" || order.paymentStatus === "overpaid" || order.paymentStatus === "confirmed") &&
                          !order.packagerId && !order.packager && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickAssignPackager(order)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <User className="h-4 w-4 mr-2" />
                            Assign Packager
                          </Button>
                        )}

                        {/* Show packager info if already assigned */}
                        {order.packager && (
                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded text-center">
                            Packager: {order.packager.fullName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          {selectedOrder && currentUser ? (
            <PaymentManager
              order={selectedOrder}
              onUpdateOrder={onUpdateOrder}
              currentUser={currentUser}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Process Payment</CardTitle>
                <CardDescription>Select an order from the pending payments to process payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No order selected</p>
                  <p className="text-sm">Click "Pay" on any order above to start processing payment</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {selectedOrder && currentUser ? (
            <div className="space-y-6">
              {/* Top Row: Payment and Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Manager */}
                <PaymentManager
                  order={selectedOrder}
                  onUpdateOrder={onUpdateOrder}
                  currentUser={currentUser}
                />

                {/* Order Progress Manager */}
                <OrderProgressManager
                  order={selectedOrder}
                  onUpdateOrder={onUpdateOrder}
                  currentUser={currentUser}
                  users={users}
                />
              </div>

              {/* Bottom Row: Receipt Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReceiptGenerator
                  order={selectedOrder}
                  currentUser={currentUser}
                  trigger={
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="h-5 w-5" />
                          Generate Receipt
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Generate and print receipt for this order
                        </p>
                      </CardContent>
                    </Card>
                  }
                />

                {/* Order Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-muted-foreground">Receipt ID</label>
                        <p className="font-medium">{selectedOrder.receiptId}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Customer</label>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Phone</label>
                        <p className="font-medium">{selectedOrder.customerPhone || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Total Amount</label>
                        <p className="font-medium">₦{selectedOrder.totalAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Created</label>
                        <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-muted-foreground">Attendee</label>
                        <p className="font-medium">{selectedOrder.attendee?.fullName || "N/A"}</p>
                      </div>
                    </div>

                    {/* Products List */}
                    <div>
                      <label className="text-muted-foreground text-sm">Products</label>
                      <div className="space-y-2 mt-2">
                        {selectedOrder.products.map((product, index) => (
                          <div key={index} className="flex justify-between text-sm p-2 bg-muted rounded">
                            <span>{product.name} x{product.quantity}</span>
                            <span>₦{((product.price || 0) * (product.quantity || 1)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Manage Orders</CardTitle>
                <CardDescription>Select an order to manage payment and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No order selected</p>
                  <p className="text-sm">Click "Pay" or "Manage" on any order to start</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ✅ Packager Assignment Dialog */}
      <Dialog open={packagerDialogOpen} onOpenChange={setPackagerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Packager</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {orderToAssign && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="font-medium">Order: {orderToAssign.receiptId}</div>
                <div className="text-sm text-muted-foreground">Customer: {orderToAssign.customerName}</div>
                <div className="text-sm text-muted-foreground">Amount: ₦{orderToAssign.totalAmount.toLocaleString()}</div>
              </div>
            )}

            <div>
              <Label htmlFor="packager">Select Packager *</Label>
              <Select value={selectedPackagerId} onValueChange={setSelectedPackagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a packager" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(user => user.role === "Packager")
                    .map((packager) => (
                      <SelectItem key={packager.id} value={packager.id}>
                        {packager.fullName} ({packager.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPackagerDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignPackager}
                disabled={!selectedPackagerId}
                className="flex-1"
              >
                Assign Packager
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReceptionistInterface
