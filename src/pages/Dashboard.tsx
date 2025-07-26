"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, ShoppingCart, Package, DollarSign, Eye, Clock, CheckCircle, Store } from "lucide-react"
import AttendeeInterface from "@/components/AttendeeInterface"
import ReceptionistInterface from "@/components/ReceptionistInterface"
import PackagerInterface from "@/components/PackagerInterface"
import StoreInterface from "@/components/StoreInterface"
import AdminInterface from "@/components/AdminInterface"
import UserManagement from "@/components/UserManagement"
import ActivityLogs from "@/components/ActivityLogs"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"

export type UserRole =
  | "CEO"
  | "Admin"
  | "Attendee"
  | "Receptionist"
  | "Cashier"
  | "Packager"
  | "Storekeeper"
  | "Customer"

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  fullName: string
  isActive: boolean
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

export interface Order {
  id: string
  customerName: string
  customerPhone?: string
  products: Product[]
  OrderItem?: any[]
  status: "pending_payment" | "paid" | "assigned_packager" | "packaged" | "picked_up" | "delivered"
  attendee: User // Change from string to User
  attendeeId: string
  receptionist?: User
  receptionistId?: string
  packager?: User
  packagerId?: string
  storekeeper?: User
  storekeeperId?: string
  paymentMethod?: "paystack" | "bank_transfer" | "cash"
  paymentStatus: "pending" | "confirmed"
  totalAmount: number
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

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://95.169.205.185:3333/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
      const res = await fetch("http://95.169.205.185:3333/activity-logs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const json = await res.json()

      if (!res.ok || !json.status) throw new Error(json.message || "Failed to fetch activity logs")

      // Parse timestamp field if needed
      const parsedLogs: ActivityLog[] = json.data.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }))

      setActivityLogs(parsedLogs) // ✅ This was incorrectly set to `setUsers`
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchActivityLogs()
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

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    // {
    //   id: "1",
    //   userId: "3",
    //   username: "james_tablet_a",
    //   action: "ORDER_CREATED",
    //   details: "Created order RCP-000234 for Jane Doe",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 30),
    //   ipAddress: "192.168.1.100",
    // },
    // {
    //   id: "2",
    //   userId: "4",
    //   username: "grace_desk_2",
    //   action: "PAYMENT_CONFIRMED",
    //   details: "Confirmed payment for order RCP-000234 via Paystack",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 25),
    //   ipAddress: "192.168.1.101",
    // },
    // {
    //   id: "3",
    //   userId: "4",
    //   username: "grace_desk_2",
    //   action: "PACKAGER_ASSIGNED",
    //   details: "Assigned order RCP-000234 to Tunde - Packager B",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 20),
    //   ipAddress: "192.168.1.101",
    // },
    // {
    //   id: "4",
    //   userId: "5",
    //   username: "tunde_packager_b",
    //   action: "ORDER_PACKAGED",
    //   details: "Marked order RCP-000234 as packaged",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 15),
    //   ipAddress: "192.168.1.102",
    // },
    // {
    //   id: "5",
    //   userId: "6",
    //   username: "emeka_store_a",
    //   action: "ITEMS_RELEASED",
    //   details: "Released items for order RCP-000234 to Tunde - Packager B",
    //   timestamp: new Date(Date.now() - 1000 * 60 * 10),
    //   ipAddress: "192.168.1.103",
    // },
  ])

  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("http://95.169.205.185:3333/orders", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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
      // id: crypto.randomUUID(), // or leave out and let backend generate
      userId: currentUser.id,
      // user: currentUser.username,
      action,
      details,
      // id: "",
      // timestamp: undefined
    }

    // Optimistically update the UI
    setActivityLogs((prev) => [newLog, ...prev])

    // POST to backend
    try {
      await fetch("http://95.169.205.185:3333/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: newLog.userId,
          // user: newLog.user,
          action: newLog.action,
          details: newLog.details,
          // ipAddress: newLog.ipAddress,
          // userAgent: navigator.userAgent,
        }),
      })
    } catch (err: any) {
      console.error("Failed to log activity:", err)
      // Optional: rollback optimistic update
    }
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
      prev.map((order) => (order.id === orderId ? { ...order, ...updates, updatedAt: new Date() } : order)),
    )

    // Log the activity
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      logActivity("ORDER_UPDATED", `Updated order ${order.receiptId} - Status: ${updates.status || order.status}`)
    }
  }

  const addOrder = (newOrder: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
    const order: Order = {
      ...newOrder,
      id: (orders.length + 1).toString(),
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

  const addUser = (userData: Omit<User, "id" | "createdAt">) => {
    const newUser: User = {
      ...userData,
      id: (users.length + 1).toString(),
      createdAt: new Date(),
    }
    setUsers((prev) => [...prev, newUser])
    logActivity("USER_CREATED", `Created new user: ${newUser.username} (${newUser.role})`)
  }

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`http://95.169.205.185:3333/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      const json = await res.json()
      if (!res.ok || !json.status) {
        throw new Error(json.message || "Failed to update user")
      }

      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)))
      const user = users.find((u) => u.id === userId)
      if (user) {
        logActivity("USER_UPDATED", `Updated user: ${user.username}`)
      }
      toast.success("User updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    }
  }

  const renderRoleInterface = () => {
    switch (currentRole) {
      case "Attendee":
        return <AttendeeInterface onOrderSubmit={addOrder} orders={orders} />
      case "Receptionist":
        return <ReceptionistInterface orders={orders} onUpdateOrder={updateOrder} />
      case "Packager":
        return <PackagerInterface orders={orders} onUpdateOrder={updateOrder} />
      case "Storekeeper":
        return <StoreInterface orders={orders} onUpdateOrder={updateOrder} onPendingChange={addPendingChange} />
      case "CEO":
      case "Admin":
        return (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="activities">Activity Logs</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminInterface
                orders={orders}
                onUpdateOrder={updateOrder}
                currentRole={currentRole}
                pendingChanges={pendingChanges}
                onApprovePendingChange={approvePendingChange}
                onRejectPendingChange={rejectPendingChange}
              />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement users={users} currentUser={currentUser} onAddUser={addUser} onUpdateUser={updateUser} />
            </TabsContent>

            <TabsContent value="activities">
              <ActivityLogs logs={activityLogs} users={users} />
            </TabsContent>

            <TabsContent value="system">
              <AdminInterface
                orders={orders}
                onUpdateOrder={updateOrder}
                currentRole={currentRole}
                pendingChanges={pendingChanges}
                onApprovePendingChange={approvePendingChange}
                onRejectPendingChange={rejectPendingChange}
              />
            </TabsContent>
          </Tabs>
        )
      default:
        return (
          <AdminInterface
            orders={orders}
            onUpdateOrder={updateOrder}
            currentRole={currentRole}
            pendingChanges={pendingChanges}
            onApprovePendingChange={approvePendingChange}
            onRejectPendingChange={rejectPendingChange}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar currentUser={currentUser} currentRole={currentRole} onRoleChange={setCurrentRole} />

      <div className="container mx-auto p-4 lg:p-6">
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
        <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">{renderRoleInterface()}</div>
      </div>
    </div>
  )
}

export default Dashboard
