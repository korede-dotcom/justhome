"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CreditCard, DollarSign, Search, AlertCircle, User, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Order, User as UserType } from "@/pages/Dashboard"
import { api, getAuthHeaders } from "../lib/api"

interface PartialPaymentViewProps {
  orders: Order[]
  currentUser: UserType
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
}

const PartialPaymentView = ({ orders, currentUser, onUpdateOrder }: PartialPaymentViewProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank_transfer" | "cash">("cash")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  // Filter orders to show only those with partial payments or pending payments
  const partialPaymentOrders = orders.filter(
    (order) => order.paymentStatus === "partial" || (order.paymentStatus === "pending" && (order.paidAmount || 0) > 0),
  )

  const filteredOrders = partialPaymentOrders.filter((order) => {
    const matchesSearch =
      order.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const handlePayment = async () => {
    if (!selectedOrder || !paymentAmount) {
      toast.error("Please enter payment amount")
      return
    }

    const amount = Number.parseFloat(paymentAmount)
    const maxPayment = selectedOrder.balanceAmount || selectedOrder.totalAmount

    if (amount <= 0 || amount > maxPayment) {
      toast.error(`Payment amount must be between ₦1 and ₦${maxPayment.toLocaleString()}`)
      return
    }

    const newPaidAmount = (selectedOrder.paidAmount || 0) + amount
    const newBalanceAmount = selectedOrder.totalAmount - newPaidAmount
    const newPaymentStatus = newBalanceAmount > 0 ? "partial" : "confirmed"
    const newOrderStatus = newBalanceAmount > 0 ? "pending_payment" : "paid"

    try {
      const res = await fetch(`${api.baseURL}/orders/payment/${selectedOrder.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newOrderStatus,
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod,
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          receptionistId: currentUser.id,
          receptionist: `${currentUser.fullName} - ${currentUser.role}`,
        }),
      })

      const result = await res.json()

      if (!res.ok || !result.status) {
        throw new Error(result?.message || "Failed to process payment")
      }

      onUpdateOrder(selectedOrder.id, {
        status: newOrderStatus,
        paymentStatus: newPaymentStatus,
        paymentMethod: paymentMethod,
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        receptionist: `${currentUser.fullName} - ${currentUser.role}`,
        receptionistId: currentUser.id,
      })

      const paymentType = newBalanceAmount > 0 ? "Partial payment" : "Final payment"
      toast.success(`${paymentType} of ₦${amount.toLocaleString()} processed successfully`)

      setPaymentDialogOpen(false)
      setSelectedOrder(null)
      setPaymentAmount("")
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment")
    }
  }

  const getTotalStats = () => {
    const totalOrders = filteredOrders.length
    const totalAmount = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const totalPaid = filteredOrders.reduce((sum, order) => sum + (order.paidAmount || 0), 0)
    const totalBalance = filteredOrders.reduce((sum, order) => sum + (order.balanceAmount || order.totalAmount), 0)

    return { totalOrders, totalAmount, totalPaid, totalBalance }
  }

  const stats = getTotalStats()

  const canProcessPayment =
    currentUser.role === "Receptionist" || currentUser.role === "Admin" || currentUser.role === "CEO"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Partial Payment Management</h3>
          <p className="text-gray-600">Track and manage orders with partial payments</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Payment Orders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalOrders}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Order Value</p>
                <p className="text-2xl font-bold text-blue-600">₦{stats.totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">₦{stats.totalPaid.toLocaleString()}</p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">₦{stats.totalBalance.toLocaleString()}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
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
                  placeholder="Search by receipt ID, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Partial Payment Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Details</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Payment Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No partial payment orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const paidAmount = order.paidAmount || 0
                    const balanceAmount = order.balanceAmount || order.totalAmount
                    const paymentProgress = (paidAmount / order.totalAmount) * 100

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">#{order.receiptId}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {order.createdAt.toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {order.attendee?.fullName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            {order.customerPhone && <div className="text-sm text-gray-500">{order.customerPhone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">₦{order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-green-600">₦{paidAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-red-600">₦{balanceAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${paymentProgress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 text-center">{paymentProgress.toFixed(1)}% paid</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.paymentStatus === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {order.paymentStatus === "partial" ? "PARTIAL PAYMENT" : "PENDING PAYMENT"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canProcessPayment && balanceAmount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setPaymentDialogOpen(true)
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Add Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Receipt ID:</span>
                    <div className="font-medium">#{selectedOrder.receiptId}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <div className="font-medium">{selectedOrder.customerName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Amount:</span>
                    <div className="font-bold text-blue-600">₦{selectedOrder.totalAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Paid Amount:</span>
                    <div className="font-bold text-green-600">₦{(selectedOrder.paidAmount || 0).toLocaleString()}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <div className="font-bold text-red-600">
                      ₦{(selectedOrder.balanceAmount || selectedOrder.totalAmount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ₦${(selectedOrder.balanceAmount || selectedOrder.totalAmount).toLocaleString()}`}
                  max={selectedOrder.balanceAmount || selectedOrder.totalAmount}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PartialPaymentView
