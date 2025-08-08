"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ShoppingCart, Package, DollarSign, Eye, Clock, CheckCircle, Store } from "lucide-react"
import AttendeeInterface from "@/components/AttendeeInterface"
import ReceptionistInterface from "@/components/ReceptionistInterface"
import PackagerInterface from "@/components/PackagerInterface"
import StoreInterface from "@/components/StoreInterface"
import StorekeeperInterface from "@/components/StorekeeperInterface"
import AdminInterface from "@/components/AdminInterface"
import UserManagement from "@/components/UserManagement"
import ActivityLogs from "@/components/ActivityLogs"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"
import WarehouseInterface from "@/components/WarehouseInterface"
import ShopManagement from "@/components/ShopManagement"
import WarehouseManagement from "@/components/WarehouseManagement"
import ReportsInterface from "@/components/ReportsInterface"
import { api, getAuthHeaders } from "@/lib/api"

export type UserRole =
  | "CEO"
  | "Admin"
  | "Attendee"
  | "Receptionist"
  | "Cashier"
  | "Packager"
  | "Storekeeper"
  | "Warehousekeeper"
  | "Customer"

export interface Shop {
  id: string
  name: string
  location: string
  description?: string
  managerId?: string
  isActive: boolean
  createdAt: Date
  createdBy: string
}

export interface Warehouse {
  id: string
  name: string
  location: string
  description?: string
  managerId?: string
  isActive: boolean
  createdAt: Date
  createdBy: string
}

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  fullName: string
  isActive: boolean
  shopId?: string
  warehouseId?: string
  createdAt: Date
  lastLogin?: Date
  createdBy: string
}

export interface ActivityLog {
  id: string
  userId: string
  user: any
  action: string
  details: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  method: "cash" | "transfer" | "pos" | "card" | "paystack" | "bank_transfer"
  reference: string
  timestamp: Date
  recordedBy: string
  notes?: string
}

export type OrderStatus =
  | "pending_payment"      // Initial state - waiting for payment
  | "partial_payment"      // Partial payment received, can proceed if above threshold
  | "paid"                 // Fully paid, ready for processing
  | "confirmed"            // Payment confirmed by receptionist
  | "assigned_packager"    // Assigned to packager for packaging
  | "packaging"            // Currently being packaged
  | "packaged"             // Packaged and ready for pickup/delivery
  | "assigned_delivery"    // Assigned for delivery
  | "out_for_delivery"     // Out for delivery
  | "picked_up"            // Customer picked up the order
  | "delivered"            // Successfully delivered
  | "completed"            // Order completed and closed
  | "cancelled"            // Order cancelled
  | "refunded"             // Order refunded

export interface Order {
  id: string
  customerName: string
  customerPhone?: string
  products: Product[]
  OrderItem?: any[]
  status: OrderStatus
  attendee: User // Change from string to User
  attendeeId: string
  shopId?: string // ✅ Added shopId to track which shop the order belongs to
  receptionist?: User
  receptionistId?: string
  packager?: User
  packagerId?: string
  storekeeper?: User
  storekeeperId?: string
  deliveryPerson?: User
  deliveryPersonId?: string
  paymentMethod?: "paystack" | "bank_transfer" | "cash" | "transfer" | "pos" | "card"
  paymentStatus: "pending" | "partial" | "paid" | "confirmed" | "overpaid" | "refunded"
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentHistory?: PaymentRecord[]
  minimumPaymentPercentage?: number // Business rule: minimum % to proceed (default 70%)
  canProceedWithPartial?: boolean
  // Workflow timestamps
  paymentConfirmedAt?: Date
  assignedToPackagerAt?: Date
  packagingStartedAt?: Date
  packagedAt?: Date
  assignedToDeliveryAt?: Date
  outForDeliveryAt?: Date
  deliveredAt?: Date
  completedAt?: Date
  // Additional fields
  notes?: string
  deliveryAddress?: string
  estimatedDeliveryTime?: Date
  createdAt: Date
  updatedAt: Date
  receiptId: string
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  image?: string
  quantity: number
  totalStock?: number
  availableStock?: number
}

export interface PendingChange {
  id: string
  type: "category_edit" | "category_delete" | "product_edit" | "product_delete"
  originalItem: any
  newItem?: any
  submittedBy: string
  submittedAt: Date
  status: "pending" | "approved" | "rejected"
}

export interface WarehouseProduct {
  id: string
  warehouseId: string
  productId: string
  product: Product
  quantity: number
  reservedQuantity: number
  availableQuantity: number
}

export interface ShopProduct {
  id: string
  shopId: string
  productId: string
  product: Product
  quantity: number
  soldQuantity: number
  availableQuantity: number
  expectedRevenue: number
  actualRevenue: number
}

const Dashboard = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      username: "admin",
      email: "admin@justhomes.com",
      role: "Admin",
      fullName: "System Administrator",
      isActive: true,
      createdAt: new Date(),
      createdBy: "system",
    },
    {
      id: "2",
      username: "ceo",
      email: "ceo@justhomes.com",
      role: "CEO",
      fullName: "Chief Executive Officer",
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      createdBy: "admin",
    },
    {
      id: "3",
      username: "james_tablet_a",
      email: "james@justhomes.com",
      role: "Attendee",
      fullName: "James Okafor",
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      createdBy: "admin",
    },
    {
      id: "4",
      username: "grace_desk_2",
      email: "grace@justhomes.com",
      role: "Receptionist",
      fullName: "Grace Adebayo",
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      createdBy: "admin",
    },
    {
      id: "5",
      username: "tunde_packager_b",
      email: "tunde@justhomes.com",
      role: "Packager",
      fullName: "Tunde Akinola",
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      createdBy: "admin",
    },
    {
      id: "6",
      username: "emeka_store_a",
      email: "emeka@justhomes.com",
      role: "Storekeeper",
      fullName: "Emeka Okonkwo",
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date(),
      createdBy: "admin",
    },
  ])
  const [loading, setLoading] = useState(true)
  const [shops, setShops] = useState<Shop[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const fetchUsers = async () => {
    try {
      const res = await fetch(api.users.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      const json = await res.json()

      if (!res.ok || !json.status) throw new Error(json.message || "Failed to fetch users")

      // Convert date strings into Date objects if needed
      const parsedUsers = json.data.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      }))

      setUsers(parsedUsers)
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }
  const fetchActivityLogs = async () => {
    try {
      const endpoint = `${api.activities.list}?limit=50`
      console.log("Fetching activities from:", endpoint)
      const res = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      console.log("Activities response status:", res.status)
      const json = await res.json()
      console.log("Activities response data:", json)

      if (!res.ok) {
        throw new Error(json.message || `HTTP ${res.status}: Failed to fetch activity logs`)
      }

      // Handle response structure based on your API documentation
      let logsData = []
      if (Array.isArray(json)) {
        // Direct array response as per your API: [...]
        logsData = json
      } else if (json.status && json.data) {
        // Standard API response: { status: true, data: [...] }
        logsData = json.data
      } else if (json.activities) {
        // Nested response: { activities: [...] }
        logsData = json.activities
      } else {
        console.warn("Unexpected response structure:", json)
        logsData = []
      }

      console.log("Processing logs data:", logsData)

      // Parse timestamp field if needed
      const parsedLogs: ActivityLog[] = logsData.map((log: any) => ({
        ...log,
        id: log.id || crypto.randomUUID(),
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        user: log.user || users.find(u => u.id === log.userId) || { fullName: "Unknown User" },
      }))

      console.log("Parsed logs:", parsedLogs)
      setActivityLogs(parsedLogs)

      if (parsedLogs.length === 0) {
        toast.info("No activity logs found")
      } else {
        toast.success(`Loaded ${parsedLogs.length} activity logs`)
      }
    } catch (err: any) {
      console.error("Error fetching activities:", err)
      toast.error(err.message || "Failed to fetch activity logs")
    } finally {
      setLoading(false)
    }
  }

  const fetchShops = async (retryCount = 0) => {
    try {
      const res = await fetch(api.shops.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })



      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`
        try {
          const err = await res.json()

          errorMessage = err.message || errorMessage
        } catch (parseError) {

        }

        // If it's a 500 error and we haven't retried too many times, retry after delay
        if (res.status === 500 && retryCount < 2) {
          setTimeout(() => {
            fetchShops(retryCount + 1)
          }, (retryCount + 1) * 1000)
          return
        }

        throw new Error(errorMessage)
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status || !response.data) {
        throw new Error(response.message || "Failed to fetch shops")
      }

      const parsedShops = response.data.map((shop: any) => ({
        ...shop,
        createdAt: new Date(shop.createdAt || new Date()),
      }))

      setShops(parsedShops)
    } catch (err: any) {
      // Only show error toast if it's not a retry or if we've exhausted retries
      if (retryCount === 0 || retryCount >= 2) {
        toast.error(err.message || "Failed to fetch shops")
      }
    }
  }

  const fetchWarehouses = async () => {
    try {
      const res = await fetch(api.warehouses.list, {
        method: "GET",
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to fetch warehouses")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status || !response.data) {
        throw new Error(response.message || "Failed to fetch warehouses")
      }

      const parsedWarehouses = response.data.map((warehouse: any) => ({
        ...warehouse,
        createdAt: new Date(warehouse.createdAt || new Date()),
      }))

      setWarehouses(parsedWarehouses)
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch warehouses")
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchActivityLogs()
    fetchShops()
    fetchWarehouses()
  }, [])
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        return user.role || "User" // Default to "User" if role is not found
      } catch (error) {
        console.error("Error parsing currentUser from localStorage:", error)
        return "User" // Default in case of parsing error
      }
    }
    return "User" // Default if no user is found in localStorage
  })

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        console.log("🚀 ~ Dashboard ~ user:", user)
        return user
      } catch (error) {
        console.error("Error parsing currentUser from localStorage:", error)
        return "User" // Default in case of parsing error
      }
    }
    return "User"
  })

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  const [orders, setOrders] = useState<Order[]>([])

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
            })) || [],
            // ✅ Ensure all required fields are present with defaults
            paidAmount: order.paidAmount || 0,
            balanceAmount: order.balanceAmount || (order.totalAmount - (order.paidAmount || 0)),
            paymentHistory: order.paymentHistory || [],
            minimumPaymentPercentage: order.minimumPaymentPercentage || 70,
            canProceedWithPartial: order.canProceedWithPartial !== false, // Default to true
            // ✅ Workflow timestamps
            paymentConfirmedAt: order.paymentConfirmedAt ? new Date(order.paymentConfirmedAt) : undefined,
            assignedToPackagerAt: order.assignedToPackagerAt ? new Date(order.assignedToPackagerAt) : undefined,
            packagingStartedAt: order.packagingStartedAt ? new Date(order.packagingStartedAt) : undefined,
            packagedAt: order.packagedAt ? new Date(order.packagedAt) : undefined,
            assignedToDeliveryAt: order.assignedToDeliveryAt ? new Date(order.assignedToDeliveryAt) : undefined,
            outForDeliveryAt: order.outForDeliveryAt ? new Date(order.outForDeliveryAt) : undefined,
            deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
            completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          }
        })

        setOrders(ordersWithQuantities)
        toast.success(`Orders fetched successfully (${ordersWithQuantities.length} orders)`)
        console.log("🚀 Orders With Quantities:", ordersWithQuantities)
        console.log("📊 Order statuses:", ordersWithQuantities.map(o => ({ id: o.receiptId, status: o.status, paymentStatus: o.paymentStatus })))
      } catch (err) {
        toast.error("Failed to fetch orders")
        console.error(err)
      }
    }

    fetchOrders()
  }, [])

  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])

  // const logActivity = (action: string, details: string) => {
  //   const newLog: ActivityLog = {
  //     id: (activityLogs.length + 1).toString(),
  //     userId: currentUser.id,
  //     username: currentUser.username,
  //     action,
  //     details,
  //     timestamp: new Date(),
  //     ipAddress: "192.168.1.100",
  //   }
  //   setActivityLogs((prev) => [newLog, ...prev])
  // }

  const logActivity = async (action: string, details: string) => {
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      user: currentUser,
      action,
      details,
      timestamp: new Date(),
      ipAddress: "127.0.0.1", // Placeholder
      userAgent: navigator.userAgent,
    }

    // Optimistically update the UI
    setActivityLogs((prev) => [newLog, ...prev])

    // POST to backend
    try {
      const response = await fetch(api.activities.list, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: newLog.userId,
          action: newLog.action,
          details: newLog.details,
          ipAddress: newLog.ipAddress,
          userAgent: newLog.userAgent,
        }),
      })

      if (!response.ok) {
        console.error("Failed to log activity to backend:", response.status)
      }
    } catch (err: any) {
      console.error("Failed to log activity:", err)
      // Keep the optimistic update even if backend fails
    }
  }

  // Function to add sample activities for testing
  const addSampleActivities = () => {
    const sampleActivities: ActivityLog[] = [
      {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        user: currentUser,
        action: "ORDER_CREATED",
        details: "Created order #12345 for customer John Doe",
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        ipAddress: "192.168.1.100",
        userAgent: navigator.userAgent,
      },
      {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        user: currentUser,
        action: "PRODUCT_ASSIGNMENT",
        details: "Assigned 10 units of Samsung Galaxy S24 to Lagos Islands shop",
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        ipAddress: "192.168.1.100",
        userAgent: navigator.userAgent,
      },
      {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        user: currentUser,
        action: "USER_LOGIN",
        details: "User logged into the system",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        ipAddress: "192.168.1.100",
        userAgent: navigator.userAgent,
      },
    ]

    setActivityLogs((prev) => [...sampleActivities, ...prev])
    toast.success("Added sample activities for testing")
  }

  // Helper function to check if order can proceed with partial payment
  const canOrderProceedWithPartialPayment = (order: Order): boolean => {
    const paymentPercentage = (order.paidAmount / order.totalAmount) * 100
    const minimumRequired = order.minimumPaymentPercentage || 70
    return paymentPercentage >= minimumRequired
  }

  // Helper function to get next order status based on payment
  const getNextOrderStatus = (order: Order): OrderStatus => {
    // Handle payment status progression
    if (order.paymentStatus === "paid") {
      // Full payment received - move to confirmed status
      return "confirmed"
    } else if (order.paymentStatus === "confirmed") {
      // Payment confirmed by receptionist - ready for packaging
      return "confirmed"
    } else if (order.paymentStatus === "partial" && canOrderProceedWithPartialPayment(order)) {
      // Partial payment meets threshold - can proceed
      return "partial_payment"
    } else {
      // Insufficient payment - stay pending
      return "pending_payment"
    }
  }

  // Helper function to advance order to next workflow stage
  const advanceOrderToNextStage = (order: Order): OrderStatus => {
    switch (order.status) {
      case "pending_payment":
        // Can only advance if payment conditions are met
        return getNextOrderStatus(order)

      case "partial_payment":
        // Partial payment can advance to confirmed if receptionist approves
        return "confirmed"

      case "paid":
        // Paid orders move to confirmed
        return "confirmed"

      case "confirmed":
        // Confirmed orders ready for packaging assignment
        return "assigned_packager"

      case "assigned_packager":
        // Packager starts packaging
        return "packaging"

      case "packaging":
        // Packaging completed
        return "packaged"

      case "packaged":
        // Ready for pickup or delivery assignment
        return "ready_for_pickup"

      case "ready_for_pickup":
        // Customer picks up
        return "picked_up"

      case "assigned_delivery":
        // Out for delivery
        return "out_for_delivery"

      case "out_for_delivery":
        // Delivered
        return "delivered"

      case "picked_up":
      case "delivered":
        // Order completed
        return "completed"

      default:
        return order.status
    }
  }

  // Helper function to get order progress percentage
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
      picked_up: 95,
      delivered: 100,
      completed: 100,
      cancelled: 0,
      refunded: 0,
    }
    return progressMap[status] || 0
  }

  // Helper function to get status display info
  const getStatusInfo = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
      pending_payment: { label: "Pending Payment", color: "bg-red-100 text-red-800", icon: "⏳" },
      partial_payment: { label: "Partial Payment", color: "bg-yellow-100 text-yellow-800", icon: "💰" },
      paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: "✅" },
      confirmed: { label: "Payment Confirmed", color: "bg-green-100 text-green-800", icon: "✅" },
      assigned_packager: { label: "Assigned to Packager", color: "bg-blue-100 text-blue-800", icon: "👤" },
      packaging: { label: "Being Packaged", color: "bg-blue-100 text-blue-800", icon: "📦" },
      packaged: { label: "Packaged", color: "bg-purple-100 text-purple-800", icon: "📦" },
      assigned_delivery: { label: "Assigned for Delivery", color: "bg-indigo-100 text-indigo-800", icon: "🚚" },
      out_for_delivery: { label: "Out for Delivery", color: "bg-orange-100 text-orange-800", icon: "🚛" },
      picked_up: { label: "Picked Up", color: "bg-green-100 text-green-800", icon: "✋" },
      delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: "🎉" },
      completed: { label: "Completed", color: "bg-gray-100 text-gray-800", icon: "✅" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: "❌" },
      refunded: { label: "Refunded", color: "bg-gray-100 text-gray-800", icon: "💸" },
    }
    return statusConfig[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: "❓" }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-500"
      case "paid":
        return "bg-blue-500"
      case "assigned_packager":
        return "bg-purple-500"
      case "packaged":
        return "bg-orange-500"
      case "picked_up":
        return "bg-green-500"
      case "delivered":
        return "bg-emerald-600"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return "Waiting for Payment"
      case "paid":
        return "Payment Confirmed"
      case "assigned_packager":
        return "Assigned to Packager"
      case "packaged":
        return "Ready for Pickup"
      case "picked_up":
        return "Picked Up"
      case "delivered":
        return "Delivered"
      default:
        return "Unknown"
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "CEO":
      case "Admin":
        return <Users className="h-5 w-5" />
      case "Attendee":
        return <Eye className="h-5 w-5" />
      case "Receptionist":
        return <ShoppingCart className="h-5 w-5" />
      case "Packager":
        return <Package className="h-5 w-5" />
      case "Storekeeper":
        return <Store className="h-5 w-5" />
      case "Cashier":
        return <DollarSign className="h-5 w-5" />
      default:
        return <Users className="h-5 w-5" />
    }
  }

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, ...updates, updatedAt: new Date() }

          // Auto-update order status based on payment if not explicitly set
          if (updates.paymentStatus && !updates.status) {
            updatedOrder.status = getNextOrderStatus(updatedOrder)
          }

          // Ensure balance is calculated correctly
          if (updates.paidAmount !== undefined) {
            updatedOrder.balanceAmount = updatedOrder.totalAmount - updatedOrder.paidAmount
          }

          return updatedOrder
        }
        return order
      }),
    )

    // Log the activity
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      if (updates.paymentStatus) {
        const paymentAmount = updates.paidAmount ? updates.paidAmount - (order.paidAmount || 0) : 0
        if (paymentAmount > 0) {
          logActivity(
            "PAYMENT_RECORDED",
            `Recorded payment of ₦${paymentAmount.toLocaleString()} for order ${order.receiptId}. Status: ${updates.paymentStatus}`
          )
        }
      }

      if (updates.status && updates.status !== order.status) {
        logActivity("ORDER_UPDATED", `Updated order ${order.receiptId} - Status: ${updates.status}`)
      }
    }
  }

  const addOrder = (newOrder: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
    const order: Order = {
      ...newOrder,
      id: (orders.length + 1).toString(),
      paidAmount: newOrder.paidAmount || 0,                    // ✅ Ensure paidAmount has default
      balanceAmount: newOrder.balanceAmount || newOrder.totalAmount,  // ✅ Ensure balanceAmount has default
      paymentHistory: newOrder.paymentHistory || [],           // ✅ Ensure paymentHistory has default
      minimumPaymentPercentage: newOrder.minimumPaymentPercentage || 70, // ✅ Default 70%
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setOrders((prev) => [...prev, order])
    logActivity("ORDER_CREATED", `Created new order ${order.receiptId} for ${order.customerName}`)
  }

  const addPendingChange = (change: Omit<PendingChange, "id" | "submittedAt" | "status">) => {
    const pendingChange: PendingChange = {
      ...change,
      id: (pendingChanges.length + 1).toString(),
      submittedAt: new Date(),
      status: "pending",
    }
    setPendingChanges((prev) => [...prev, pendingChange])
    logActivity("CHANGE_SUBMITTED", `Submitted ${change.type} for approval`)
  }

  const approvePendingChange = (changeId: string) => {
    setPendingChanges((prev) =>
      prev.map((change) => (change.id === changeId ? { ...change, status: "approved" } : change)),
    )
    logActivity("CHANGE_APPROVED", `Approved pending change ${changeId}`)
  }

  const rejectPendingChange = (changeId: string) => {
    setPendingChanges((prev) =>
      prev.map((change) => (change.id === changeId ? { ...change, status: "rejected" } : change)),
    )
    logActivity("CHANGE_REJECTED", `Rejected pending change ${changeId}`)
  }

  const addUser = async (userData: Omit<User, "id" | "createdAt">) => {
    // Log the activity
    logActivity("USER_CREATED", `Created new user: ${userData.username} (${userData.role})`)

    // Refresh the user list to get the latest data from the server
    try {
      await fetchUsers()
    } catch (error) {
      console.error("Error refreshing user list:", error)
      // If fetch fails, still add to local state as fallback
      const newUser: User = {
        ...userData,
        id: (users.length + 1).toString(),
        createdAt: new Date(),
      }
      setUsers((prev) => [...prev, newUser])
    }
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(api.users.update(userId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      const json = await res.json()
      if (!res.ok || !json.status) {
        throw new Error(json.message || "Failed to update user")
      }

      // Log the activity before refreshing
      const user = users.find((u) => u.id === userId)
      if (user) {
        logActivity("USER_UPDATED", `Updated user: ${user.username}`)
      }

      toast.success("User updated successfully")

      // Refresh the user list to get the latest data from the server
      try {
        await fetchUsers()
      } catch (error) {
        console.error("Error refreshing user list:", error)
        // If fetch fails, still update local state as fallback
        setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)))
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    }
  }

  const addShop = async (shopData: Omit<Shop, "id" | "createdAt">) => {
    try {

      const res = await fetch(api.shops.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(shopData),
      })



      if (!res.ok) {
        let errorMessage = "Failed to create shop"
        try {
          const err = await res.json()

          errorMessage = err.message || errorMessage
        } catch (parseError) {

        }

        throw new Error(errorMessage)
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status || !response.data) {
        throw new Error(response.message || "Failed to create shop")
      }

      // Add the created shop with parsed date to local state
      const newShop = {
        ...response.data,
        createdAt: new Date(response.data.createdAt || new Date()),
      }

      setShops((prev) => [...prev, newShop])

      logActivity("SHOP_CREATED", `Created new shop: ${shopData.name}`)
      toast.success("Shop created successfully")

    } catch (err: any) {
      toast.error(err.message || "Failed to create shop")
    }
  }

  const addWarehouse = async (warehouseData: Omit<Warehouse, "id" | "createdAt">) => {
    try {
      const res = await fetch(api.warehouses.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(warehouseData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to create warehouse")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status || !response.data) {
        throw new Error(response.message || "Failed to create warehouse")
      }

      // Add the created warehouse with parsed date to local state
      setWarehouses((prev) => [...prev, {
        ...response.data,
        createdAt: new Date(response.data.createdAt || new Date()),
      }])

      logActivity("WAREHOUSE_CREATED", `Created new warehouse: ${warehouseData.name}`)
      toast.success("Warehouse created successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to create warehouse")
    }
  }

  const updateShop = async (shopId: string, updates: Partial<Shop>) => {
    try {
      const res = await fetch(api.shops.update(shopId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to update shop")
      }

      const response = await res.json()

      // Handle the API response structure: { status, message, data }
      if (!response.status) {
        throw new Error(response.message || "Failed to update shop")
      }

      setShops((prev) => prev.map((shop) => (shop.id === shopId ? { ...shop, ...updates } : shop)))
      logActivity("SHOP_UPDATED", `Updated shop: ${updates.name || shopId}`)
      toast.success("Shop updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to update shop")
    }
  }

  const updateWarehouse = async (warehouseId: string, updates: Partial<Warehouse>) => {
    try {
      const res = await fetch(api.warehouses.update(warehouseId), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      const json = await res.json()
      if (!res.ok || !json.status) {
        throw new Error(json.message || "Failed to update warehouse")
      }

      setWarehouses((prev) =>
        prev.map((warehouse) => (warehouse.id === warehouseId ? { ...warehouse, ...updates } : warehouse)),
      )
      logActivity("WAREHOUSE_UPDATED", `Updated warehouse: ${updates.name || warehouseId}`)
      toast.success("Warehouse updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to update warehouse")
    }
  }

  const renderRoleInterface = () => {
    switch (currentRole) {
      case "Attendee":
        return <AttendeeInterface onOrderSubmit={addOrder} orders={orders} currentUser={currentUser} />
      case "Receptionist":
        return <ReceptionistInterface orders={orders} onUpdateOrder={updateOrder} currentUser={currentUser} users={users} />
      case "Packager":
        return <PackagerInterface orders={orders} onUpdateOrder={updateOrder} />
      case "Storekeeper":
        return <StorekeeperInterface orders={orders} onUpdateOrder={updateOrder} currentUser={currentUser} />
      case "Warehousekeeper":
        return <WarehouseInterface orders={orders} onUpdateOrder={updateOrder} onPendingChange={addPendingChange} />
      case "CEO":
      case "Admin":
        return (
          <Tabs defaultValue="overview" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="text-xs md:text-sm px-2 py-2">Overview</TabsTrigger>
              <TabsTrigger value="shops" className="text-xs md:text-sm px-2 py-2">Shops</TabsTrigger>
              <TabsTrigger value="warehouses" className="text-xs md:text-sm px-2 py-2">Warehouses</TabsTrigger>
              <TabsTrigger value="users" className="text-xs md:text-sm px-2 py-2">Users</TabsTrigger>
              <TabsTrigger value="activities" className="text-xs md:text-sm px-2 py-2">Activities</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs md:text-sm px-2 py-2">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminInterface
                orders={orders}
                onUpdateOrder={updateOrder}
                currentRole={currentRole}
                currentUser={currentUser}
                pendingChanges={pendingChanges}
                onApprovePendingChange={approvePendingChange}
                onRejectPendingChange={rejectPendingChange}
                onLogActivity={logActivity}
              />
            </TabsContent>

            <TabsContent value="shops">
              <ShopManagement
                shops={shops}
                users={users}
                currentUser={currentUser}
                onAddShop={addShop}
                onUpdateShop={updateShop}
              />
            </TabsContent>

            <TabsContent value="warehouses">
              <WarehouseManagement
                warehouses={warehouses}
                users={users}
                currentUser={currentUser}
                onAddWarehouse={addWarehouse}
                onUpdateWarehouse={updateWarehouse}
              />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement
                users={users}
                shops={shops}
                warehouses={warehouses}
                currentUser={currentUser}
                onAddUser={addUser}
                onUpdateUser={updateUser}
              />
            </TabsContent>

            <TabsContent value="activities">
              <ActivityLogs
                logs={activityLogs}
                users={users}
                onRefresh={fetchActivityLogs}
                onAddSample={addSampleActivities}
              />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsInterface shops={shops} warehouses={warehouses} orders={orders} currentUser={currentUser} />
            </TabsContent>
          </Tabs>
        )
      default:
        return (
          <AdminInterface
            orders={orders}
            onUpdateOrder={updateOrder}
            currentRole={currentRole}
            currentUser={currentUser}
            pendingChanges={pendingChanges}
            onApprovePendingChange={approvePendingChange}
            onRejectPendingChange={rejectPendingChange}
            onLogActivity={logActivity}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden">
      <Navbar currentUser={currentUser} currentRole={currentRole} onRoleChange={setCurrentRole} />

      <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Total Orders</p>
                  <p className="text-xl lg:text-2xl font-bold text-blue-600">{orders.length}</p>
                </div>
                <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Pending Payment</p>
                  <p className="text-xl lg:text-2xl font-bold text-yellow-600">
                    {orders.filter((o) => o.status === "pending_payment").length}
                  </p>
                </div>
                <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Ready for Pickup</p>
                  <p className="text-xl lg:text-2xl font-bold text-orange-600">
                    {orders.filter((o) => o.status === "packaged").length}
                  </p>
                </div>
                <Package className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Completed</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">
                    {orders.filter((o) => o.status === "delivered").length}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-Specific Interface */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 overflow-x-hidden">{renderRoleInterface()}</div>
      </div>
    </div>
  )
}

export default Dashboard
