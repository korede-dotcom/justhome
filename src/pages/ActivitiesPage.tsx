"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Download,
  Activity,
  User,
  Package,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import Navbar from "@/components/Navbar"
import { exportToCSV, exportToExcel } from "@/utils/exportUtils"

interface ActivityLog {
  id: string
  timestamp: string
  user: string
  userRole: string
  action: string
  entity: string
  entityId: string
  description: string
  status: "success" | "warning" | "error" | "info"
  ipAddress: string
  userAgent: string
}

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  const [currentUser] = useState(() => {
    const user = localStorage.getItem("currentUser")
    return user ? JSON.parse(user) : null
  })
  const [currentRole] = useState(() => {
    return localStorage.getItem("currentRole") || "Attendee"
  })

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockActivities: ActivityLog[] = [
      {
        id: "1",
        timestamp: "2024-01-15T10:30:00Z",
        user: "John Admin",
        userRole: "Admin",
        action: "CREATE",
        entity: "USER",
        entityId: "user_123",
        description: "Created new user account for Sarah Manager",
        status: "success",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      {
        id: "2",
        timestamp: "2024-01-15T10:25:00Z",
        user: "Sarah Manager",
        userRole: "Storekeeper",
        action: "UPDATE",
        entity: "PRODUCT",
        entityId: "prod_456",
        description: "Updated inventory quantity for Modern Sofa Set",
        status: "success",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      {
        id: "3",
        timestamp: "2024-01-15T10:20:00Z",
        user: "Mike Packager",
        userRole: "Packager",
        action: "UPDATE",
        entity: "ORDER",
        entityId: "ord_789",
        description: "Marked order ORD-2024-001 as shipped",
        status: "success",
        ipAddress: "192.168.1.102",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      {
        id: "4",
        timestamp: "2024-01-15T10:15:00Z",
        user: "Lisa Reception",
        userRole: "Receptionist",
        action: "CREATE",
        entity: "ORDER",
        entityId: "ord_101",
        description: "Created new order ORD-2024-003 for customer Bob Johnson",
        status: "success",
        ipAddress: "192.168.1.103",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      },
      {
        id: "5",
        timestamp: "2024-01-15T10:10:00Z",
        user: "Tom Attendee",
        userRole: "Attendee",
        action: "LOGIN",
        entity: "SYSTEM",
        entityId: "sys_001",
        description: "User logged into the system",
        status: "success",
        ipAddress: "192.168.1.104",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      {
        id: "6",
        timestamp: "2024-01-15T10:05:00Z",
        user: "Unknown User",
        userRole: "Unknown",
        action: "LOGIN",
        entity: "SYSTEM",
        entityId: "sys_001",
        description: "Failed login attempt with invalid credentials",
        status: "error",
        ipAddress: "192.168.1.999",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      {
        id: "7",
        timestamp: "2024-01-15T09:55:00Z",
        user: "John Admin",
        userRole: "Admin",
        action: "DELETE",
        entity: "PRODUCT",
        entityId: "prod_999",
        description: "Deleted discontinued product from inventory",
        status: "warning",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      {
        id: "8",
        timestamp: "2024-01-15T09:50:00Z",
        user: "System",
        userRole: "System",
        action: "BACKUP",
        entity: "DATABASE",
        entityId: "db_001",
        description: "Automated database backup completed successfully",
        status: "info",
        ipAddress: "127.0.0.1",
        userAgent: "System Process",
      },
    ]
    setActivities(mockActivities)
    setFilteredActivities(mockActivities)
  }, [])

  // Filter activities based on search and filters
  useEffect(() => {
    let filtered = activities

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (userFilter !== "all") {
      filtered = filtered.filter((activity) => activity.userRole === userFilter)
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((activity) => activity.action === actionFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((activity) => activity.status === statusFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter((activity) => new Date(activity.timestamp) >= filterDate)
      }
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, userFilter, actionFilter, statusFilter, dateFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "info":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "info":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Package className="h-4 w-4 text-green-600" />
      case "UPDATE":
        return <Settings className="h-4 w-4 text-blue-600" />
      case "DELETE":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "LOGIN":
        return <User className="h-4 w-4 text-purple-600" />
      case "LOGOUT":
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const handleExportCSV = () => {
    const exportData = filteredActivities.map((activity) => ({
      Timestamp: new Date(activity.timestamp).toLocaleString(),
      User: activity.user,
      Role: activity.userRole,
      Action: activity.action,
      Entity: activity.entity,
      "Entity ID": activity.entityId,
      Description: activity.description,
      Status: activity.status,
      "IP Address": activity.ipAddress,
    }))

    exportToCSV(exportData, `activity-logs-${new Date().toISOString().split("T")[0]}`)
    toast.success("Activity logs exported to CSV successfully!")
  }

  const handleExportExcel = () => {
    const exportData = filteredActivities.map((activity) => ({
      Timestamp: new Date(activity.timestamp).toLocaleString(),
      User: activity.user,
      Role: activity.userRole,
      Action: activity.action,
      Entity: activity.entity,
      "Entity ID": activity.entityId,
      Description: activity.description,
      Status: activity.status,
      "IP Address": activity.ipAddress,
      "User Agent": activity.userAgent,
    }))

    exportToExcel(exportData, `activity-logs-${new Date().toISOString().split("T")[0]}`, "Activity Logs")
    toast.success("Activity logs exported to Excel successfully!")
  }

  const stats = {
    total: activities.length,
    success: activities.filter((a) => a.status === "success").length,
    warning: activities.filter((a) => a.status === "warning").length,
    error: activities.filter((a) => a.status === "error").length,
    info: activities.filter((a) => a.status === "info").length,
  }

  const uniqueUsers = [...new Set(activities.map((a) => a.userRole))].filter((role) => role !== "Unknown")
  const uniqueActions = [...new Set(activities.map((a) => a.action))]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} currentRole={currentRole} onRoleChange={() => {}} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Logs</h1>
          <p className="text-gray-600">Monitor system activities and user actions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success</p>
                  <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Info</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.info}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>System Activity Logs</CardTitle>
                <CardDescription>
                  Track all user actions and system events ({filteredActivities.length} of {activities.length})
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handleExportExcel} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueUsers.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activities Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden lg:table-cell">Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden xl:table-cell">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(activity.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-gray-500">{activity.userRole}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          {getActionIcon(activity.action)}
                          <span className="font-medium">{activity.action}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate" title={activity.description}>
                          {activity.description}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{activity.entity}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(activity.status)}
                          <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell font-mono text-sm">{activity.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredActivities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activities found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ActivitiesPage
