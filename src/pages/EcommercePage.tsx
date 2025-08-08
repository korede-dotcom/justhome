"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ShoppingCart,
  Heart,
  Star,
  Search,
  ArrowLeft,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw,
  Play,
  ChevronRight,
  Award,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import logo from "../logo.png"

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  category: string
  image?: string
  rating: number
  reviews: number
  description: string
  inStock: boolean
  featured: boolean
}

interface CartItem extends Product {
  quantity: number
}

const EcommercePage = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [isLoading, setIsLoading] = useState(true)
  const [showLanding, setShowLanding] = useState(true)

  // Sample products data
  const sampleProducts: Product[] = [
    {
      id: "1",
      name: "Luxury Sofa Set",
      price: 250000,
      originalPrice: 300000,
      category: "Living Room",
      image: "/placeholder.svg?height=300&width=400",
      rating: 4.8,
      reviews: 124,
      description: "Premium quality sofa set with modern design and comfortable seating.",
      inStock: true,
      featured: true,
    },
    {
      id: "2",
      name: "Coffee Table",
      price: 85000,
      category: "Living Room",
      image: "/placeholder.svg?height=300&width=400",
      rating: 4.6,
      reviews: 89,
      description: "Elegant coffee table perfect for modern living rooms.",
      inStock: true,
      featured: false,
    },
    {
      id: "3",
      name: "Dining Table Set",
      price: 180000,
      originalPrice: 220000,
      category: "Dining",
      image: "/placeholder.svg?height=300&width=400",
      rating: 4.9,
      reviews: 156,
      description: "Beautiful dining table set for 6 people with matching chairs.",
      inStock: true,
      featured: true,
    },
    {
      id: "4",
      name: "King Size Bed",
      price: 320000,
      category: "Bedroom",
      image: "/placeholder.svg?height=300&width=400",
      rating: 4.7,
      reviews: 203,
      description: "Comfortable king size bed with premium mattress included.",
      inStock: false,
      featured: false,
    },
    {
      id: "5",
      name: "Office Chair",
      price: 75000,
      category: "Office",
      image: "/placeholder.svg?height=300&width=400",
      rating: 4.5,
      reviews: 67,
      description: "Ergonomic office chair with lumbar support and adjustable height.",
      inStock: true,
      featured: false,
    },
    {
      id: "6",
      name: "Wardrobe",
      price: 450000,
      originalPrice: 500000,
      category: "Bedroom",
      image: "/placeholder.svg?height=300&width=400",
      rating: 4.8,
      reviews: 98,
      description: "Spacious wardrobe with multiple compartments and mirror.",
      inStock: true,
      featured: true,
    },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setProducts(sampleProducts)
      setIsLoading(false)
    }, 1000)
  }, [])

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "featured":
          return b.featured ? 1 : -1
        default:
          return 0
      }
    })

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    toast.success(`${product.name} added to cart`)
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
    toast.info("Item removed from cart")
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        toast.info("Removed from wishlist")
        return prev.filter((id) => id !== productId)
      } else {
        toast.success("Added to wishlist")
        return [...prev, productId]
      }
    })
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing furniture...</p>
        </div>
      </div>
    )
  }

  if (showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Navigation */}
        <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-white/30"></div>
                <img src={logo || "/placeholder.svg"} alt="Logo" className="h-10 w-12" />
                <div>
                  <h1 className="text-xl font-bold">Just Homes</h1>
                  <p className="text-xs opacity-80">Interior Designs</p>
                </div>
              </div>
              <Button onClick={() => setShowLanding(false)} className="bg-white text-purple-900 hover:bg-gray-100">
                Shop Now
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative min-h-screen flex items-center">
          {/* Background Animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-3000"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">Premium Quality Furniture</span>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                    Transform Your
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                      {" "}
                      Space
                    </span>
                  </h1>
                  <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                    Discover premium furniture that combines style, comfort, and quality. Create the home of your dreams
                    with our curated collection.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setShowLanding(false)}
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Shop Collection
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg bg-transparent"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Watch Tour
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">500+</div>
                    <div className="text-gray-400">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">10K+</div>
                    <div className="text-gray-400">Happy Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">15+</div>
                    <div className="text-gray-400">Years Experience</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Product Showcase */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {sampleProducts.slice(0, 4).map((product, index) => (
                    <div
                      key={product.id}
                      className={`relative group cursor-pointer transform transition-all duration-500 hover:scale-105 ${
                        index % 2 === 0 ? "animate-float" : "animate-float-delayed"
                      }`}
                    >
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <img
                          src={product.image || "/placeholder.svg?height=200&width=200"}
                          alt={product.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                          }}
                        />
                        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                        <p className="text-pink-400 font-bold">₦{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="relative py-20 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Choose Just Homes?</h2>
              <p className="text-xl text-gray-300">Experience the difference with our premium services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Truck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Free Delivery</h3>
                <p className="text-gray-300">Free delivery on all orders across Nigeria</p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Guarantee</h3>
                <p className="text-gray-300">Premium quality furniture with warranty</p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Award className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Design</h3>
                <p className="text-gray-300">Professional interior design consultation</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Transform Your Home?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of satisfied customers who have created their dream spaces with Just Homes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowLanding(false)}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-4 text-lg"
              >
                Start Shopping
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-12 py-4 text-lg bg-transparent"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(-10px); }
            50% { transform: translateY(-30px); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 6s ease-in-out infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-3000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setShowLanding(true)} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Landing</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <img src={logo || "/placeholder.svg"} alt="Logo" className="h-10 w-12" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Just Homes</h1>
                <p className="text-xs text-gray-600">Online Store</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="relative">
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="products" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="cart" className="relative">
              Cart
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <div className="max-w-2xl">
                <h2 className="text-4xl font-bold mb-4">Transform Your Space</h2>
                <p className="text-xl mb-6">Discover premium furniture that combines style, comfort, and quality.</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Free Delivery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Quality Guarantee</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="h-5 w-5" />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search furniture..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category === "all" ? "All Categories" : category}
                    </Button>
                  ))}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.image || "/placeholder.svg?height=250&width=300"}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=250&width=300"
                      }}
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.featured && <Badge className="bg-purple-600">Featured</Badge>}
                      {product.originalPrice && (
                        <Badge variant="destructive">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </Badge>
                      )}
                      {!product.inStock && <Badge variant="secondary">Out of Stock</Badge>}
                    </div>

                    {/* Wishlist Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleWishlist(product.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${wishlist.includes(product.id) ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>

                      <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>

                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-green-600">₦{product.price.toLocaleString()}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              ₦{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => addToCart(product)}
                        disabled={!product.inStock}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.inStock ? "Add to Cart" : "Out of Stock"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cart" className="space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Add some amazing furniture to get started</p>
                <Button onClick={() => document.querySelector('[value="products"]')?.click()}>Continue Shopping</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-2xl font-bold">Shopping Cart ({getTotalItems()} items)</h2>

                  {cart.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                          <img
                            src={item.image || "/placeholder.svg?height=80&width=80"}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                            }}
                          />

                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.category}</p>
                            <p className="text-lg font-bold text-green-600">₦{item.price.toLocaleString()}</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-bold">₦{(item.price * item.quantity).toLocaleString()}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Subtotal ({getTotalItems()} items)</span>
                          <span>₦{getTotalPrice().toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Delivery</span>
                          <span className="text-green-600">Free</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-green-600">₦{getTotalPrice().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Proceed to Checkout
                      </Button>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4" />
                          <span>Free delivery on all orders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Secure payment guaranteed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RotateCcw className="h-4 w-4" />
                          <span>30-day return policy</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default EcommercePage
