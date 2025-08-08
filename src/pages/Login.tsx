"use client"

import type React from "react"
import axios from 'axios';

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, LogIn, Shield } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import logo from '../logo.png';
const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  // Demo credentials
  const demoCredentials = [
    { username: "admin", password: "admin123", role: "Admin", name: "System Administrator" },
    { username: "ceo", password: "ceo123", role: "CEO", name: "Chief Executive Officer" },
    { username: "james", password: "james123", role: "Attendee", name: "James Okafor" },
    { username: "grace", password: "grace123", role: "Receptionist", name: "Grace Adebayo" },
    { username: "tunde", password: "tunde123", role: "Packager", name: "Tunde Akinola" },
    { username: "emeka", password: "emeka123", role: "Storekeeper", name: "Emeka Okonkwo" },
  ]


const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch(api.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    console.log("🚀 ~ handleLogin ~ response:", response)

    // Support both 200 and 201 responses
    if (response.status !== 200 && response.status !== 201) {
      throw new Error('Unexpected response from server');
    }

    const data = await response.json();
    console.log("🚀 ~ handleLogin ~ data:", data)

    if (!data.data.access_token || !data.data.user) {
      toast.error('Login failed. Please try again.');
      return;
    }

    toast.success(`Welcome back, ${data.data.user.fullName || data.data.user.username}!`);

    localStorage.setItem('token', data.data.access_token);
    localStorage.setItem('currentUser', JSON.stringify(data.data.user));

    navigate('/dashboard');
  } catch (error) {
    console.error("Login error:", error);
    toast.error('Login failed. Please check your credentials and try again.');
  } finally {
    setIsLoading(false);
  }
};


  const handleDemoLogin = (credentials: (typeof demoCredentials)[0]) => {
    setUsername(credentials.username)
    setPassword(credentials.password)
    toast.info(`Demo credentials loaded for ${credentials.role}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {/* <Shield className="h-12 w-12 text-blue-600" /> */}
          {/* <img src={logo} alt="Logo" className="mx-auto mt-4 h-20 w-23" /> */}

          </div>
          {/* <h1 className="text-3xl font-bold text-gray-900">Smart Retail Management</h1>
          <p className="text-gray-600 mt-2">Just Homes Interior Designs</p> */}
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader>
          <img src={logo} alt="Logo" className="mx-auto mt-4 h-20 w-23" />
            <CardTitle className="text-center text-sm">Just Homes Interior Designs</CardTitle>
            <CardTitle className="text-center text-xl">Sign In to Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        {/* <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-lg">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>Click on any role below to auto-fill login credentials for testing.</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-2">
              {demoCredentials.map((cred) => (
                <Button
                  key={cred.username}
                  variant="outline"
                  className="justify-between h-auto p-3 bg-transparent"
                  onClick={() => handleDemoLogin(cred)}
                >
                  <div className="text-left">
                    <div className="font-medium">{cred.name}</div>
                    <div className="text-sm text-gray-500">@{cred.username}</div>
                  </div>
                  <Badge variant="secondary">{cred.role}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Just Homes Interior Designs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
