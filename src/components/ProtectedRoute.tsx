"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { toast } from "sonner"

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const currentUser = localStorage.getItem("currentUser")

    if (!token || !currentUser) {
      setIsAuthenticated(false)
      toast.error("Please log in to access this page")
      return
    }

    try {
      // Verify token is valid JSON and not expired
      const user = JSON.parse(currentUser)
      if (user && user.id) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Invalid user data:", error)
      localStorage.removeItem("token")
      localStorage.removeItem("currentUser")
      setIsAuthenticated(false)
      toast.error("Session expired. Please log in again.")
    }
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

export default ProtectedRoute
