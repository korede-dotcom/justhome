"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Eye } from "lucide-react"
import type { Order } from "@/pages/Dashboard"
import { toast } from "sonner"
import { api, getAuthHeaders } from "@/lib/api"
import OrderDetailsModal from "@/components/OrderDetailsModal"

interface TransactionTableProps {
  orders: Order[]
  title?: string
  showActions?: boolean
  onViewOrder?: (order: Order) => void
}

const TransactionTable = ({
  // orders,
  title = "Recent Transactions",
  showActions = true,
  onViewOrder,
}: TransactionTableProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(api.orders.list, {
          method: "GET",
          headers: getAuthHeaders(),
        }) // adjust to proxy if needed
        const data = await res.json()

        if (!data.status) {
          toast.error(data.message || "Failed to fetch orders")
          return
        }

        const ordersWithQuantities = data.data.map((order: any) => {
          return {
            ...order,
            products: order?.OrderItem?.map((item: any) => ({
              ...item.product,
              quantity: item.quantity,
            })),
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          }
        })

        setOrders(ordersWithQuantities)
        toast.success("Orders fetched successfully")
        console.log("🚀 Orders With Quantities:", ordersWithQuantities)
      } catch (err) {
        toast.error("Failed to fetch orders")
        console.error(err)
      }
    }

    fetchOrders()
  }, [])

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
        return "Assigned"
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.receiptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    const matchesDate = (() => {
      if (dateFilter === "all") return true
      const orderDate = new Date(order.createdAt)
      const today = new Date()

      switch (dateFilter) {
        case "today":
          return orderDate.toDateString() === today.toDateString()
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= weekAgo
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return orderDate >= monthAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage)

  const exportToCSV = () => {
    const headers = ["Receipt ID", "Customer", "Phone", "Status", "Amount", "Payment Method", "Date", "Attendee"]
    const csvContent = [
      headers.join(","),
      ...filteredOrders.map((order) =>
        [
          order.receiptId,
          order.customerName,
          order.customerPhone || "",
          order.status,
          order.totalAmount,
          order.paymentMethod || "",
          order.createdAt.toLocaleDateString(),
          order.attendee.fullName,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
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
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="assigned_packager">Assigned</SelectItem>
              <SelectItem value="packaged">Packaged</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {paginatedOrders.length} of {filteredOrders.length} transactions
          </span>
          <span>
            Total Value: ₦{filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
          </span>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Attendee</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">{order.receiptId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      {order.customerPhone && <div className="text-sm text-gray-500">{order.customerPhone}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">₦{order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    {order.paymentMethod ? (
                      <Badge variant="outline">{order.paymentMethod.replace("_", " ").toUpperCase()}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{order?.createdAt.toLocaleDateString()}</div>
                      <div className="text-gray-500">{order.createdAt.toLocaleTimeString()}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{order.attendee.fullName}</TableCell>
                  {showActions && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsOrderModalOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false)
          setSelectedOrder(null)
        }}
      />
    </Card>
  )
}

export default TransactionTable
