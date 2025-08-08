"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Download,
  Activity,
  User,
  ShoppingCart,
  Package,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
} from "lucide-react"
import type { ActivityLog, User as UserType } from "@/pages/Dashboard"

interface ActivityLogsProps {
  logs: ActivityLog[]
  users: UserType[]
  onRefresh?: () => void
  onAddSample?: () => void
}

const ActivityLogs = ({ logs, users, onRefresh, onAddSample }: ActivityLogsProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const getActionIcon = (action: string) => {
    switch (action) {
      case "ORDER_CREATED":
        return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case "ORDER_UPDATED":
        return <Package className="h-4 w-4 text-orange-500" />
      case "PAYMENT_CONFIRMED":
        return <CreditCard className="h-4 w-4 text-green-500" />
      case "PACKAGER_ASSIGNED":
        return <User className="h-4 w-4 text-purple-500" />
      case "ORDER_PACKAGED":
        return <Package className="h-4 w-4 text-orange-500" />
      case "ITEMS_RELEASED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "USER_CREATED":
        return <User className="h-4 w-4 text-blue-500" />
      case "USER_UPDATED":
        return <Settings className="h-4 w-4 text-orange-500" />
      case "CHANGE_SUBMITTED":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "CHANGE_APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "CHANGE_REJECTED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "LOGIN":
        return <Eye className="h-4 w-4 text-blue-500" />
      case "LOGOUT":
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "ORDER_CREATED":
        return "bg-blue-100 text-blue-800"
      case "ORDER_UPDATED":
        return "bg-orange-100 text-orange-800"
      case "PAYMENT_CONFIRMED":
        return "bg-green-100 text-green-800"
      case "PACKAGER_ASSIGNED":
        return "bg-purple-100 text-purple-800"
      case "ORDER_PACKAGED":
        return "bg-orange-100 text-orange-800"
      case "ITEMS_RELEASED":
        return "bg-green-100 text-green-800"
      case "USER_CREATED":
        return "bg-blue-100 text-blue-800"
      case "USER_UPDATED":
        return "bg-orange-100 text-orange-800"
      case "CHANGE_SUBMITTED":
        return "bg-yellow-100 text-yellow-800"
      case "CHANGE_APPROVED":
        return "bg-green-100 text-green-800"
      case "CHANGE_REJECTED":
        return "bg-red-100 text-red-800"
      case "LOGIN":
        return "bg-blue-100 text-blue-800"
      case "LOGOUT":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUser = userFilter === "all" || log.userId === userFilter
    const matchesAction = actionFilter === "all" || log.action === actionFilter

    const matchesDate = (() => {
      if (dateFilter === "all") return true
      const logDate = new Date(log.timestamp)
      const today = new Date()

      switch (dateFilter) {
        case "today":
          return logDate.toDateString() === today.toDateString()
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return logDate >= weekAgo
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          return logDate >= monthAgo
        default:
          return true
      }
    })()

    return matchesSearch && matchesUser && matchesAction && matchesDate
  })

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

  const exportToCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Details", "IP Address"]
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map((log) =>
        [log.timestamp.toISOString(), log.user.username, log.action, `"${log.details}"`, log.ipAddress || ""].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getActivityStats = () => {
    const stats = {
      total: logs.length,
      today: logs.filter((log) => {
        const today = new Date()
        return new Date(log.timestamp).toDateString() === today.toDateString()
      }).length,
      thisWeek: logs.filter((log) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return new Date(log.timestamp) >= weekAgo
      }).length,
      uniqueUsers: new Set(logs.map((log) => log.userId)).size,
    }
    return stats
  }

  const stats = getActivityStats()
  const uniqueActions = [...new Set(logs.map((log) => log.action))]

  return (
    <div className="space-y-6">
      {/* Debug Information */}
      {logs.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">No Activities Found</p>
                <p className="text-sm">
                  No activity logs are currently available. This could mean:
                </p>
                <ul className="text-sm mt-2 ml-4 list-disc">
                  <li>The API endpoint is not returning data</li>
                  <li>No activities have been logged yet</li>
                  <li>There's a connection issue with the backend</li>
                </ul>
                <p className="text-sm mt-2">
                  Try clicking "Refresh" to fetch activities or "Add Sample" to add test data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-600">Activity Logs</h2>
        <div className="flex gap-2">
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {onAddSample && (
            <Button onClick={onAddSample} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Sample
            </Button>
          )}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-orange-600">{stats.thisWeek}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.uniqueUsers}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
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
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.fullName} (@{user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace("_", " ")}
                  </SelectItem>
                ))}
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
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
            <div className="text-sm text-gray-600">
              Showing {paginatedLogs.length} of {filteredLogs.length} activities
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => {
                  const user = users.find((u) => u.id === log.userId)
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{log.timestamp.toLocaleDateString()}</div>
                          <div className="text-gray-500">{log.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user?.fullName || "Unknown User"}</div>
                          <div className="text-sm text-gray-500">@{log.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {getActionIcon(log.action)}
                          <span className="ml-1">{log.action.replace("_", " ")}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-sm text-gray-700 truncate" title={log.details}>
                          {log.details}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-gray-600">{log.ipAddress || "-"}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
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
      </Card>
    </div>
  )
}

export default ActivityLogs
