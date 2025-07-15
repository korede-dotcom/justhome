"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, X, Eye } from "lucide-react"
import { toast } from "sonner"

interface ProductImageUploadProps {
  productId: string
  productName: string
  currentImage?: string
  onImageUpdate: (productId: string, imageUrl: string) => void
}

const ProductImageUpload = ({ productId, productName, currentImage, onImageUpdate }: ProductImageUploadProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImage || "")
  const [isUploading, setIsUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)

    try {
      // In a real app, you would upload to a cloud service like Cloudinary, AWS S3, etc.
      // For demo purposes, we'll create a local URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImageUrl(result)
        setIsUploading(false)
        toast.success("Image uploaded successfully!")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setIsUploading(false)
      toast.error("Failed to upload image")
    }
  }

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL")
      return
    }

    // Basic URL validation
    try {
      new URL(imageUrl)
    } catch {
      toast.error("Please enter a valid URL")
      return
    }

    onImageUpdate(productId, imageUrl)
    setIsOpen(false)
    toast.success("Product image updated successfully!")
  }

  const removeImage = () => {
    setImageUrl("")
    onImageUpdate(productId, "")
    toast.success("Product image removed")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            {currentImage ? "Update Image" : "Add Image"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Product Image</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Product: {productName}</Label>
            </div>

            {/* Current Image Preview */}
            {imageUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Image:</Label>
                <div className="relative">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={productName}
                    className="w-full h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                    }}
                  />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Upload from Device:
              </Label>
              <Input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
              {isUploading && <p className="text-sm text-gray-500">Uploading...</p>}
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="image-url" className="text-sm font-medium">
                Or Enter Image URL:
              </Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
                Save Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      {currentImage && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{productName}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={currentImage || "/placeholder.svg"}
                alt={productName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=400&width=600"
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default ProductImageUpload
