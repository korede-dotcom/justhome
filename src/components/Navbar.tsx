"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  ShoppingCart,
  Users,
  Package,
  Store,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  BarChart3,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import logo from "../logo.png"
import type { User, UserRole } from "@/pages/Dashboard"

interface NavbarProps {
  currentUser: User
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
}

const Navbar = ({ currentUser, currentRole, onRoleChange }: NavbarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("currentUser")
    toast.success("Logged out successfully")
    navigate("/")
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  const getNavItems = () => {
    const baseItems = [{ icon: Home, label: "Dashboard", path: "/dashboard" }]

    switch (currentRole) {
      case "CEO":
      case "Admin":
        return [
          ...baseItems,
          // { icon: Users, label: "User Management", path: "/dashboard/users" },
          // { icon: Package, label: "Inventory", path: "/dashboard/inventory" },
          // { icon: ShoppingCart, label: "All Orders", path: "/dashboard/orders" },
          // { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
          // { icon: Activity, label: "Activity Logs", path: "/dashboard/activities" },
          // { icon: Settings, label: "System Settings", path: "/dashboard/settings" },
        ]
      case "Storekeeper":
        return [
          ...baseItems,
          { icon: Store, label: "Store Management", path: "/dashboard/store" },
          { icon: Package, label: "Products", path: "/dashboard/products" },
          { icon: ShoppingCart, label: "Order History", path: "/dashboard/orders" },
        ]
      case "Receptionist":
        return [
          ...baseItems,
          { icon: ShoppingCart, label: "Orders", path: "/dashboard/orders" },
          { icon: Package, label: "Packages", path: "/dashboard/packages" },
        ]
      case "Packager":
        return [
          ...baseItems,
          { icon: Package, label: "Packaging", path: "/dashboard/packaging" },
          { icon: ShoppingCart, label: "My Tasks", path: "/dashboard/tasks" },
        ]
      case "Attendee":
        return [
          ...baseItems,
          { icon: ShoppingCart, label: "Create Order", path: "/dashboard/create-order" },
          { icon: Package, label: "My Orders", path: "/dashboard/my-orders" },
        ]
      default:
        return baseItems
    }
  }

  const navItems = getNavItems()

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard"
    }
    return location.pathname.startsWith(path)
  }

  const NavContent = () => (
    <div className="flex flex-col space-y-2 p-4">
      {navItems.map((item) => (
        <Button
          key={item.path}
          variant={isActive(item.path) ? "default" : "ghost"}
          className="justify-start w-full"
          onClick={() => handleNavigation(item.path)}
        >
          <item.icon className="h-4 w-4 mr-2" />
          {item.label}
        </Button>
      ))}
    </div>
  )

  return (
    <nav className="bg-background shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <img src={logo || "/placeholder.svg"} alt="Logo" className="h-10 w-12" />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-foreground">Just Homes</h1>
              <p className="text-xs text-muted-foreground">Interior Designs</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                className="flex items-center space-x-2"
                onClick={() => handleNavigation(item.path)}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
            </Button>

            {/* Ecommerce Button */}
            <Button
              onClick={() => navigate("/shop")}
              className="hidden md:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shop Online
            </Button>

            {/* Role Badge */}
            <Badge variant="outline" className="hidden md:flex">
              {currentRole}
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {currentUser.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{currentUser.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col h-full">
                  <div className="flex items-center space-x-2 p-4 border-b">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {currentUser.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{currentUser.fullName}</p>
                      <Badge variant="outline" className="text-xs">
                        {currentRole}
                      </Badge>
                    </div>
                  </div>

                  <NavContent />

                  <div className="mt-auto p-4 border-t">
                    <Button
                      onClick={() => navigate("/shop")}
                      className="w-full mb-2 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Shop Online
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full text-red-600 border-red-600 bg-transparent"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
