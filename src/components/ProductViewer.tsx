"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Eye, ShoppingCart, Package } from "lucide-react"
import type { Product } from "@/pages/Dashboard"

interface ProductViewerProps {
  products: Product[]
  onAddToCart?: (product: Product) => void
  showAddToCart?: boolean
  title?: string
}

const ProductViewer = ({
  products,
  onAddToCart,
  showAddToCart = false,
  title = "Product Catalog",
}: ProductViewerProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category || 'Uncategorized')))]

  // Filter products
  const filteredProducts = products.filter((product) => {
    const categoryName = product.category || 'Uncategorized'
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || categoryName === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === "all" ? "All Categories" : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square relative bg-gray-100">
              <img
                src={product.image || "/placeholder.svg?height=200&width=200"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                }}
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">{product.name}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <img
                        src={product.image || "/placeholder.svg?height=400&width=400"}
                        alt={product.name}
                        className="w-full aspect-square object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=400&width=400"
                        }}
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {product.category || 'Uncategorized'}
                        </Badge>
                        <h3 className="text-2xl font-bold">{product.name}</h3>
                      </div>
                      <div className="text-3xl font-bold text-green-600">₦{product.price.toLocaleString()}</div>

                      {/* Stock Information */}
                      <div className="space-y-2">
                        <h4 className="font-semibold">Stock Information:</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm text-blue-600 font-medium">Total Stock</div>
                            <div className="text-xl font-bold text-blue-800">{product.totalStock || 0}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600 font-medium">Available Stock</div>
                            <div className="text-xl font-bold text-green-800">{product.availableStock || 0}</div>
                          </div>
                        </div>
                        {(product.availableStock || 0) === 0 && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                            <div className="text-red-800 font-medium">Out of Stock</div>
                            <div className="text-sm text-red-600">This product is currently unavailable</div>
                          </div>
                        )}
                        {(product.availableStock || 0) > 0 && (product.availableStock || 0) <= 5 && (
                          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                            <div className="text-orange-800 font-medium">Low Stock</div>
                            <div className="text-sm text-orange-600">Only {product.availableStock} items remaining</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Product Details:</h4>
                        <p className="text-gray-600">
                          High-quality {(product.category || 'product').toLowerCase()} designed for modern homes.
                          Crafted with premium materials and attention to detail.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Features:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Premium quality materials</li>
                          <li>• Modern design</li>
                          <li>• Durable construction</li>
                          <li>• Easy maintenance</li>
                        </ul>
                      </div>
                      {showAddToCart && (
                        <Button onClick={() => handleAddToCart(product)} className="w-full" size="lg">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Order
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  <Badge variant="outline" className="text-xs ml-2">
                    {product.category || 'Uncategorized'}
                  </Badge>
                </div>
                <div className="text-lg font-bold text-green-600">₦{product.price.toLocaleString()}</div>

                {/* Stock Information */}
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Total: {product.assignedQuantity || product.totalStock || 0}</span>
                  <span className={`font-medium ${
                    (product.shopAvailableQuantity || product.availableStock || 0) === 0 ? 'text-red-600' :
                    (product.shopAvailableQuantity || product.availableStock || 0) <= 5 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    Available: {product.shopAvailableQuantity || product.availableStock || 0}
                  </span>
                </div>

                {/* Stock Status Badge */}
                {(product.assignedQuantity ||	product.availableStock || 0) === 0 && (
                  <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                )}
                {(product.shopAvailableQuantity	 || product.availableStock || 0) > 0 && (product.assignedQuantity || product.availableStock || 0) <= 5 && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Low Stock</Badge>
                )}
                {(product.assignedQuantity || product.availableStock || 0) > 5 && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">In Stock</Badge>
                )}

                {showAddToCart && (
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-full"
                    size="sm"
                    disabled={(product.availableStock || 0) === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {(product.availableStock || 0) === 0 ? 'Out of Stock' : 'Add to Order'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No Products Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProductViewer
