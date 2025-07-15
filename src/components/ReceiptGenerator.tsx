"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, PrinterIcon as Print, Share } from "lucide-react"
import { toast } from "sonner"
import type { Order } from "@/pages/Dashboard"
import logo from '../logo.png'

interface ReceiptGeneratorProps {
  order: Order
  trigger?: React.ReactNode
  title?: string
}

const ReceiptGenerator = ({ order, trigger, title = "Generate Receipt" }: ReceiptGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const generatePDF = () => {
    // In a real app, this would generate an actual PDF
    toast.success("Receipt PDF generated successfully!")
  }

  const printReceipt = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${order?.receiptId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; }
              .receipt-id { font-size: 18px; margin: 10px 0; }
              .section { margin: 15px 0; }
              .product-item { display: flex; justify-content: space-between; padding: 5px 0; }
              .total { font-weight: bold; font-size: 18px; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
              .img { width: 200px; height: auto; }
            </style>
          </head>
          <body>
            <div class="header">
            <img class="img" src=${logo} alt="Logo" />
              <div class="company-name">Just Homes Interior Designs</div>
              <div>Smart Retail Management System</div>
              <div class="receipt-id">Receipt: ${order?.receiptId}</div>
            </div>
            
            <div class="section">
              <strong>Customer Information:</strong><br>
              Name: ${order?.customerName}<br>
              ${order?.customerPhone ? `Phone: ${order?.customerPhone}<br>` : ""}
              Date: ${order?.createdAt.toLocaleDateString()}<br>
              Time: ${order?.createdAt.toLocaleTimeString()}
            </div>
            
            <div class="section">
              <strong>Products:</strong><br>
              ${order.products
                .map(
                  (product) => `
                <div class="product-item">
                  <span>${product.name} (x${product.quantity})</span>
                  <span>₦${(product.price * product.quantity).toLocaleString()}</span>
                </div>
              `,
                )
                .join("")}
            </div>
            
            <hr>
            
            <div class="section">
              <div class="product-item total">
                <span>Total Amount:</span>
                <span>₦${order?.totalAmount.toLocaleString()}</span>
              </div>
              ${
                order?.paymentMethod
                  ? `<div>Payment Method: ${order?.paymentMethod.replace("_", " ").toUpperCase()}</div>`
                  : ""
              }
              <div>Status: ${order.status.replace("_", " ").toUpperCase()}</div>
            </div>
            
            <div class="section">
              <strong>Staff Information:</strong><br>
              Attendee: ${order?.attendee?.fullName || "N/A"}<br>
              ${order?.receptionist ? `Receptionist: ${order?.receptionist?.fullName}<br>` : ""}
              ${order?.packager ? `Packager: ${order?.packager?.fullName}<br>` : ""}
              ${order?.storekeeper ? `Storekeeper: ${order?.storekeeper?.fullName}<br>` : ""}
            </div>
            
            <div class="footer">
              Thank you for choosing Just Homes Interior Designs!<br>
              For inquiries, contact us at info@justhomes.com
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const shareReceipt = () => {
    if (navigator.share) {
      navigator.share({
        title: `Receipt ${order?.receiptId}`,
        text: `Receipt for ${order?.customerName} - Total: ₦${order?.totalAmount.toLocaleString()}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(
        `Receipt ${order?.receiptId} - Customer: ${order?.customerName} - Total: ₦${order?.totalAmount.toLocaleString()}`,
      )
      toast.success("Receipt details copied to clipboard!")
    }
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-blue-100 text-blue-800"
      case "assigned_packager":
        return "bg-purple-100 text-purple-800"
      case "packaged":
        return "bg-orange-100 text-orange-800"
      case "picked_up":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-emerald-100 text-emerald-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Receipt - {order?.receiptId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="text-center space-y-2">
         <img src={logo} alt="Logo" className="mx-auto mt-4 h-20 w-23" />
            <h2 className="text-2xl font-bold text-blue-600">Just Homes Interior Designs</h2>
            <p className="text-gray-600">Smart Retail Management System</p>
            <div className="text-lg font-semibold">Receipt: {order.receiptId}</div>
            <Badge className={getStatusColor(order?.status)}>{order.status.replace("_", " ").toUpperCase()}</Badge>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">{order?.customerName}</p>
              </div>
              {order?.customerPhone && (
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Date:</span>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>

            </div>
          </div>

          <Separator />

          {/* Products */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Products</h3>
            <div className="space-y-2">
              {order.OrderItem.map((orders) => (
                <div key={orders.product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{orders.product?.name}</div>
                    <div className="text-sm text-gray-600">
                    { /* {orders.product?.category}*/} • ₦{orders.product?.price.toLocaleString()} each
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">x{orders?.quantity}</div>
                    <div className="font-semibold text-green-600">
                      ₦{(orders.product.price * orders.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total Amount:</span>
              <span className="text-green-600">₦{order.totalAmount.toLocaleString()}</span>
            </div>
            {order?.paymentMethod && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <Badge variant="outline">{order?.paymentMethod.replace("_", " ").toUpperCase()}</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Staff Information */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Staff Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Attendee:</span>
                <p className="font-medium">{order.attendee?.fullName}</p>
              </div>
              {order?.receptionist && (
                <div>
                  <span className="text-gray-600">Receptionist:</span>
                  <p className="font-medium">{order?.receptionist.fullName}</p>
                </div>
              )}
              {order?.packager && (
                <div>
                  <span className="text-gray-600">Packager:</span>
                  <p className="font-medium">{order?.packager.fullName}</p>
                </div>
              )}
              {order?.storekeeper && (
                <div>
                  <span className="text-gray-600">Storekeeper:</span>
                  <p className="font-medium">{order?.storekeeper.fullName}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button onClick={shareReceipt} variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button onClick={printReceipt} variant="outline" size="sm">
              <Print className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={generatePDF} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 pt-4">
            Thank you for choosing Just Homes Interior Designs!
            <br />
            For inquiries, contact us at info@justhomes.com
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptGenerator
