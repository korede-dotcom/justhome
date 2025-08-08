"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, ShoppingCart, User } from "lucide-react"
import { toast } from "sonner"
import TransactionTable from "@/components/TransactionTable"
import ProductViewer from "@/components/ProductViewer"
import ReceiptGenerator from "@/components/ReceiptGenerator"
import MyShopProducts from "@/components/MyShopProducts"
import type { Order, Product, User } from "@/pages/Dashboard"
import { api, getAuthHeaders } from "@/lib/api"

interface AttendeeInterfaceProps {
  onOrderSubmit: (order: Omit<Order, "id" | "createdAt" | "updatedAt">) => void
  orders: Order[]
  currentUser?: User
}

const AttendeeInterface = ({ onOrderSubmit, orders, currentUser }: AttendeeInterfaceProps) => {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Enhanced sample products with images
  // const availableProducts: Product[] = [
  //   {
  //     id: "1",
  //     name: "Luxury Sofa Set",
  //     price: 250000,
  //     category: "Living Room",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "2",
  //     name: "Coffee Table",
  //     price: 85000,
  //     category: "Living Room",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "3",
  //     name: "Dining Table",
  //     price: 180000,
  //     category: "Dining",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "4",
  //     name: "Wardrobe",
  //     price: 320000,
  //     category: "Bedroom",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "5",
  //     name: "Bookshelf",
  //     price: 120000,
  //     category: "Study",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "6",
  //     name: "TV Stand",
  //     price: 95000,
  //     category: "Living Room",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "7",
  //     name: "Office Chair",
  //     price: 75000,
  //     category: "Office",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "8",
  //     name: "Bed Frame",
  //     price: 180000,
  //     category: "Bedroom",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "9",
  //     name: "Kitchen Cabinet",
  //     price: 450000,
  //     category: "Kitchen",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  //   {
  //     id: "10",
  //     name: "Study Desk",
  //     price: 95000,
  //     category: "Study",
  //     quantity: 1,
  //     image: "/placeholder.svg?height=300&width=400",
  //   },
  // ]

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(api.products.list, {
          method: "GET",
          headers: getAuthHeaders(),
        })
        const json = await res.json()

        if (!res.ok || !json.status) {
          throw new Error(json.message || "Failed to fetch products")
        }

        setAvailableProducts(json.data)
        toast.success("Products loaded successfully")
      } catch (err: any) {
        toast.error("Failed to fetch products:", err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.id === product.id)
    if (existing) {
      setSelectedProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)))
    } else {
      setSelectedProducts((prev) => [...prev, { ...product, quantity: 1 }])
    }
    toast.success(`${product.name} added to selection`)
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
    toast.info("Product removed from selection")
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId)
      return
    }
    setSelectedProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, quantity } : p)))
  }

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, product) => total + product.price * product.quantity, 0)
  }

  // const handleSubmitOrder = () => {
  //   if (!customerName.trim()) {
  //     toast.error("Please enter customer name")
  //     return
  //   }

  //   if (selectedProducts.length === 0) {
  //     toast.error("Please select at least one product")
  //     return
  //   }

  //   const newOrder = {
  //     customerName: customerName.trim(),
  //     customerPhone: customerPhone.trim() || undefined,
  //     products: selectedProducts,
  //     status: "pending_payment" as const,
  //     attendee: "James - Tablet A",
  //     paymentStatus: "pending" as const,
  //     totalAmount: getTotalAmount(),
  //     receiptId: `RCP-${String(Date.now()).slice(-6)}`,
  //   }

  //   onOrderSubmit(newOrder)
  //   toast.success("Order submitted to reception!")

  //   // Reset form
  //   setCustomerName("")
  //   setCustomerPhone("")
  //   setSelectedProducts([])
  // }

  // Filter orders for this attendee

  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter customer name")
      return
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product")
      return
    }

    const attendee = JSON.parse(localStorage.getItem("currentUser") || "{}")

    // Transform products to match API specification (only id and quantity)
    const transformedProducts = selectedProducts.map(product => ({
      id: product.id,
      quantity: product.quantity
    }))

    const totalAmount = getTotalAmount()
    const newOrder = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      products: transformedProducts,
      status: "pending_payment" as const,
      attendeeId: attendee.id,
      paymentStatus: "pending" as const,
      totalAmount: totalAmount,
      paidAmount: 0,                                    // ✅ Initialize with 0
      balanceAmount: totalAmount,                       // ✅ Initialize with total amount
      paymentHistory: [],                               // ✅ Initialize empty array
      minimumPaymentPercentage: 70,                     // ✅ Default 70%
      receiptId: `RCP-${String(Date.now()).slice(-6)}`,
    }

    try {
      const response = await fetch(api.orders.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newOrder),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit order")
      }

      toast.success("Order submitted to reception!")

      // Reset form
      setCustomerName("")
      setCustomerPhone("")
      setSelectedProducts([])
    } catch (error: any) {
      console.error("Order submission error:", error)
      toast.error(error.message || "Something went wrong while submitting order")
    }
  }
  // const categories = ["all", ...new Set(availableProducts.map((p) => p.category))]

  const myOrders = orders.filter((order) => order.attendee === "James - Tablet A")

  return (
    <div className="space-y-4 lg:space-y-6">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="products" className="text-xs lg:text-sm">
            Product Catalog
          </TabsTrigger>
          <TabsTrigger value="create-order" className="text-xs lg:text-sm">
            Create Order
          </TabsTrigger>
          <TabsTrigger value="my-orders" className="text-xs lg:text-sm">
            My Orders ({myOrders.length})
          </TabsTrigger>
          <TabsTrigger value="shop-products" className="text-xs lg:text-sm">
            Shop Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductViewer
            products={availableProducts}
            onAddToCart={addProduct}
            showAddToCart={true}
            title="Product Catalog - Show to Customer"
          />
        </TabsContent>

        <TabsContent value="create-order" className="space-y-4 lg:space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 text-lg lg:text-xl">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer's full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+234..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ShoppingCart className="h-5 w-5" />
                  Selected Products ({selectedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 bg-gray-50 rounded-lg space-y-3 lg:space-y-0"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={product.image || "/placeholder.svg?height=50&width=50"}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=50&width=50"
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-600">₦{product.price.toLocaleString()} each</p>
                          <p className="text-xs text-gray-500">Category: {product.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, product.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{product.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, product.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeProduct(product.id)}
                          className="ml-2"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-col lg:flex-row justify-between items-center mb-4 space-y-2 lg:space-y-0">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">₦{getTotalAmount().toLocaleString()}</span>
                  </div>

                  <Button
                    onClick={handleSubmitOrder}
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                    size="lg"
                  >
                    Submit Order to Reception
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-orders">
          <TransactionTable
            orders={myOrders}
            title="My Orders"
            showActions={true}
            onViewOrder={(order) => <ReceiptGenerator order={order} title="View Receipt" />}
          />
        </TabsContent>

        <TabsContent value="shop-products">
          <MyShopProducts
            currentUser={currentUser}
            userShopId={currentUser?.shopId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AttendeeInterface
