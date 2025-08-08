"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Plus,
  Eye,
  TrendingUp,
  Banknote,
} from "lucide-react"
import { toast } from "sonner"
import type { Order, PaymentRecord, User } from "@/pages/Dashboard"
import { api, getAuthHeaders } from "@/lib/api"

interface PaymentManagerProps {
  order: Order
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void
  currentUser: User
}

const PaymentManager = ({ order, onUpdateOrder, currentUser }: PaymentManagerProps) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [loading, setLoading] = useState(false)

  // Calculate payment progress with safe defaults
  const paidAmount = order.paidAmount || 0
  const balanceAmount = order.balanceAmount || order.totalAmount
  const paymentPercentage = (paidAmount / order.totalAmount) * 100
  const minimumRequired = order.minimumPaymentPercentage || 70
  const canProceedWithPartial = paymentPercentage >= minimumRequired

  // Get payment status color and text
  const getPaymentStatusInfo = () => {
    switch (order.paymentStatus) {
      case "pending":
        return { color: "bg-red-100 text-red-800", text: "Pending Payment", icon: Clock }
      case "partial":
        return { color: "bg-yellow-100 text-yellow-800", text: "Partial Payment", icon: AlertTriangle }
      case "paid":
        return { color: "bg-green-100 text-green-800", text: "Fully Paid", icon: CheckCircle }
      case "overpaid":
        return { color: "bg-blue-100 text-blue-800", text: "Overpaid", icon: TrendingUp }
      case "refunded":
        return { color: "bg-gray-100 text-gray-800", text: "Refunded", icon: Receipt }
      default:
        return { color: "bg-gray-100 text-gray-800", text: "Unknown", icon: AlertTriangle }
    }
  }

  const statusInfo = getPaymentStatusInfo()
  const StatusIcon = statusInfo.icon

  const handlePayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Please enter payment amount and select payment method")
      return
    }

    const amount = Number.parseFloat(paymentAmount)
    const maxPayment = balanceAmount

    if (amount <= 0) {
      toast.error("Payment amount must be greater than ₦0")
      return
    }

    if (amount > maxPayment) {
      toast.error(`Payment amount cannot exceed balance of ₦${maxPayment.toLocaleString()}`)
      return
    }

    setLoading(true)

    try {
      // const response = await fetch(`/api/orders/${order.id}/payment`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     paymentAmount: amount,
      //     paymentMethod,
      //     paymentReference: paymentReference || `${paymentMethod.toUpperCase()}-${Date.now()}`,
      //     notes: paymentNotes,
      //     recordedBy: currentUser.id,
      //   }),
      // })

      const response = await fetch(api.orders.recordPayment(order.id), {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentAmount: amount,
          paymentMethod,
          paymentReference: paymentReference || `${paymentMethod.toUpperCase()}-${Date.now()}`,
          notes: paymentNotes,
          recordedBy: currentUser.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to process payment")
      }

      const result = await response.json()
      const updatedOrder = result.data

      // Update local state
      onUpdateOrder(order.id, {
        paidAmount: updatedOrder.paidAmount,
        balanceAmount: updatedOrder.balanceAmount,
        paymentStatus: updatedOrder.paymentStatus,
        status: updatedOrder.status,
        paymentHistory: updatedOrder.paymentHistory,
        paymentMethod: paymentMethod as Order["paymentMethod"],
      })

      const paymentType = updatedOrder.balanceAmount > 0 ? "Partial payment" : "Final payment"
      toast.success(`${paymentType} of ₦${amount.toLocaleString()} processed successfully`)

      // Check if order can proceed to next phase
      if (updatedOrder.paymentStatus === "partial" && canProceedWithPartial) {
        toast.info(`Order can now proceed to packaging (${paymentPercentage.toFixed(1)}% paid)`)
      }

      // Auto-refresh by triggering a re-fetch of orders
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }

      // Reset form
      setPaymentAmount("")
      setPaymentMethod("")
      setPaymentReference("")
      setPaymentNotes("")
      setPaymentDialogOpen(false)
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Failed to process payment")
    } finally {
      setLoading(false)
    }
  }

  // Function to update payment status using the updatePayment endpoint
  const handleUpdatePaymentStatus = async (newStatus: string, newPaymentStatus: string) => {
    try {
      // const response = await fetch(`/api/orders/payment/${order.id}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Authorization": `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     status: newStatus,
      //     paymentStatus: newPaymentStatus,
      //     paymentMethod: order.paymentMethod,
      //     receptionistId: currentUser.id,
      //   }),
      // })

      const response = await fetch(api.orders.updatePayment(order.id), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          paymentMethod: order.paymentMethod,
          receptionistId: currentUser.id,
        }),
      })
      if (!response.ok) {
        throw new Error("Failed to update payment status")
      }

      const updatedOrder = await response.json()

      // Update local state
      onUpdateOrder(order.id, {
        status: newStatus,
        paymentStatus: newPaymentStatus,
        receptionistId: currentUser.id,
      })

      toast.success("Payment status updated successfully")

      // Auto-refresh by triggering a re-fetch of orders
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshOrders'))
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error)
      toast.error("Failed to update payment status")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-medium text-sm">Total Amount</div>
            <div className="text-blue-800 font-bold text-xl">₦{order.totalAmount.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-medium text-sm">Paid Amount</div>
            <div className="text-green-800 font-bold text-xl">₦{paidAmount.toLocaleString()}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-orange-600 font-medium text-sm">Balance</div>
            <div className="text-orange-800 font-bold text-xl">₦{balanceAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Payment Progress</span>
            <span>{paymentPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={paymentPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>₦0</span>
            <span className="text-orange-600">
              Min: {minimumRequired}% (₦{((order.totalAmount * minimumRequired) / 100).toLocaleString()})
            </span>
            <span>₦{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Business Rules Info */}
        {order.paymentStatus === "partial" && (
          <div className={`p-3 rounded-lg ${canProceedWithPartial ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
            <div className="flex items-center gap-2">
              {canProceedWithPartial ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className={`text-sm font-medium ${canProceedWithPartial ? "text-green-800" : "text-yellow-800"}`}>
                {canProceedWithPartial
                  ? "✅ Order can proceed to packaging"
                  : `⏳ Need ${minimumRequired}% minimum payment to proceed`}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {balanceAmount > 0 && (
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Payment Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      max={balanceAmount}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ₦{balanceAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="method">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                        <SelectItem value="pos">POS</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="paystack">Paystack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reference">Payment Reference</Label>
                    <Input
                      id="reference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Transaction reference (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Payment notes (optional)"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPaymentDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handlePayment} disabled={loading} className="flex-1">
                      {loading ? "Processing..." : "Record Payment"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {order.paymentHistory && order.paymentHistory.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Payment History
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Payment History</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.paymentHistory.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm">
                            {new Date(payment.timestamp).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.method}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{payment.reference}</TableCell>
                          <TableCell className="text-sm">{payment.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Payment Status Management */}
          {(order.paymentStatus === "paid" || order.paymentStatus === "overpaid") && order.status !== "confirmed" && (
            <Button
              onClick={() => handleUpdatePaymentStatus("confirmed", "confirmed")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Payment
            </Button>
          )}

          {order.paymentStatus === "partial" && (
            <Button
              onClick={() => handleUpdatePaymentStatus("partial_payment", "partial")}
              variant="outline"
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Update Partial Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PaymentManager
