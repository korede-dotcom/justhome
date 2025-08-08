import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CreditCard, UserCheck, Package, Truck, CheckCircle, AlertCircle } from "lucide-react"
import type { Order } from "@/pages/Dashboard"

interface OrderWorkflowProps {
  order: Order
}

const OrderWorkflow = ({ order }: OrderWorkflowProps) => {
  const getProgressValue = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return 20
      case "paid":
        return 40
      case "assigned_packager":
        return 60
      case "packaged":
        return 80
      case "picked_up":
        return 90
      case "delivered":
        return 100
      default:
        return 0
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200"
      case "paid":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200"
      case "assigned_packager":
        return "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200"
      case "packaged":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200"
      case "picked_up":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200"
      case "delivered":
        return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200"
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const workflowSteps = [
    {
      id: "pending_payment",
      title: "Waiting for Payment",
      icon: Clock,
      completed: ["paid", "assigned_packager", "packaged", "picked_up", "delivered"].includes(order.status),
    },
    {
      id: "paid",
      title: "Payment Confirmed",
      icon: CreditCard,
      completed: ["assigned_packager", "packaged", "picked_up", "delivered"].includes(order.status),
    },
    {
      id: "assigned_packager",
      title: "Assigned to Packager",
      icon: UserCheck,
      completed: ["packaged", "picked_up", "delivered"].includes(order.status),
    },
    {
      id: "packaged",
      title: "Packaged",
      icon: Package,
      completed: ["picked_up", "delivered"].includes(order.status),
    },
    {
      id: "picked_up",
      title: "Picked Up",
      icon: Truck,
      completed: ["delivered"].includes(order.status),
    },
    {
      id: "delivered",
      title: "Delivered",
      icon: CheckCircle,
      completed: order.status === "delivered",
    },
  ]

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Progress</CardTitle>
          <Badge className={getStatusColor(order.status)}>{order.status.replace("_", " ").toUpperCase()}</Badge>
        </div>
        <Progress value={getProgressValue(order.status)} className="w-full" />
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === order.status
            const isCompleted = step.completed

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`
                  p-2 rounded-full border-2 
                  ${
                    isCompleted
                      ? "bg-green-100 border-green-500 text-green-600 dark:bg-green-900 dark:border-green-400 dark:text-green-300"
                      : isActive
                        ? "bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300"
                        : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500"
                  }
                `}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {step.title}
                  </p>

                  {step.id === "assigned_packager" && order.packager && (
                    <p className="text-sm text-muted-foreground">Assigned to: {order.packager.fullName}</p>
                  )}

                  {step.id === "paid" && order.paymentMethod && (
                    <p className="text-sm text-muted-foreground">
                      Payment: {order.paymentMethod.replace("_", " ").toUpperCase()}
                    </p>
                  )}
                </div>

                {isActive && <AlertCircle className="h-4 w-4 text-blue-500 animate-pulse" />}
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Receipt ID</p>
              <p className="font-mono font-medium">{order.receiptId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Attendee</p>
              <p className="font-medium">{order.attendee?.fullName || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Payment Status for Partial Payments */}
          {order.paymentStatus === "partial" && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">Partial Payment</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700 dark:text-yellow-300">Paid:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(order.paidAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700 dark:text-yellow-300">Balance:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(order.balanceAmount || 0)}
                  </span>
                </div>
                <Progress value={((order.paidAmount || 0) / order.totalAmount) * 100} className="mt-2 h-2" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderWorkflow
