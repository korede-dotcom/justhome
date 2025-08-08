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
  currentUser?: any
  companyInfo?: {
    name: string
    logo?: string
    address: string
    phone: string
    email: string
    website?: string
  }
}

const ReceiptGenerator = ({ order, trigger, title = "Generate Receipt", currentUser, companyInfo }: ReceiptGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Default company info
  const defaultCompanyInfo = {
    name: "JustHome Store",
    logo: logo,
    address: "123 Business Street, Lagos, Nigeria",
    phone: "+234 123 456 7890",
    email: "info@justhome.com",
    website: "www.justhome.com",
    ...companyInfo
  }

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
              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                background: white;
                color: #333;
              }
              .receipt {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
              }
              .logo {
                width: 80px;
                height: 80px;
                margin: 0 auto 10px;
                border-radius: 8px;
                background: white;
                padding: 5px;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .company-details {
                font-size: 12px;
                opacity: 0.9;
              }
              .content {
                padding: 20px;
              }
              .receipt-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
              }
              .customer-info {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 6px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              .items-table th, .items-table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #eee;
              }
              .items-table th {
                background: #f8f9fa;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
              }
              .totals {
                border-top: 2px solid #667eea;
                padding-top: 15px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
              }
              .total-row.final {
                font-weight: bold;
                font-size: 18px;
                color: #667eea;
                border-top: 1px solid #eee;
                padding-top: 8px;
              }
              .payment-status {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                border-radius: 6px;
              }
              .payment-status.paid {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
              }
              .payment-status.partial {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
              }
              .payment-status.pending {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
              }
              .footer {
                text-align: center;
                padding: 20px;
                background: #f8f9fa;
                font-size: 12px;
                color: #666;
              }
              @media print {
                body { margin: 0; padding: 0; }
                .receipt { border: none; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <img class="logo" src="${defaultCompanyInfo.logo}" alt="${defaultCompanyInfo.name} Logo" />
                <div class="company-name">${defaultCompanyInfo.name}</div>
                <div class="company-details">
                  ${defaultCompanyInfo.address}<br>
                  ${defaultCompanyInfo.phone} | ${defaultCompanyInfo.email}
                </div>
              </div>

              <div class="content">
                <!-- Receipt Info -->
                <div class="receipt-info">
                  <div>
                    <strong>Receipt #</strong><br>
                    ${order?.receiptId}
                  </div>
                  <div style="text-align: right;">
                    <strong>Date</strong><br>
                    ${new Date(order?.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <!-- Customer Info -->
                <div class="customer-info">
                  <strong>Customer Details</strong><br>
                  <strong>${order?.customerName}</strong><br>
                  ${order?.customerPhone || 'No phone provided'}<br>
                  Served by: ${order?.attendee?.fullName || currentUser?.fullName || 'N/A'}
                </div>

                <!-- Items -->
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.products.map(product => `
                      <tr>
                        <td>${product.name}</td>
                        <td>${product.quantity || 1}</td>
                        <td>₦${(product.price || 0).toLocaleString()}</td>
                        <td>₦${((product.price || 0) * (product.quantity || 1)).toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <!-- Totals -->
                <div class="totals">
                  <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₦${order?.totalAmount.toLocaleString()}</span>
                  </div>
                  <div class="total-row final">
                    <span>Total:</span>
                    <span>₦${order?.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <!-- Payment Status -->
                <div class="payment-status ${order?.paymentStatus === 'paid' || order?.paymentStatus === 'confirmed' || order?.paymentStatus === 'overpaid' ? 'paid' : order?.paymentStatus === 'partial' ? 'partial' : 'pending'}">
                  <strong>Payment Status: ${order?.paymentStatus?.toUpperCase()}</strong><br>
                  Paid: ₦${(order?.paidAmount || 0).toLocaleString()}<br>
                  ${order?.paymentStatus === 'overpaid'
                    ? `Overpaid by: ₦${((order?.paidAmount || 0) - (order?.totalAmount || 0)).toLocaleString()}`
                    : (order?.balanceAmount || 0) > 0
                      ? `Balance: ₦${(order?.balanceAmount || 0).toLocaleString()}`
                      : 'Fully Paid'
                  }
                </div>

                <!-- Payment History -->
                ${order?.paymentHistory && order.paymentHistory.length > 0 ? `
                  <div style="margin-top: 20px;">
                    <strong>Payment History:</strong>
                    ${order.paymentHistory.map(payment => `
                      <div style="font-size: 12px; margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px;">
                        ${new Date(payment.timestamp).toLocaleDateString()} -
                        ₦${payment.amount.toLocaleString()} (${payment.method})
                        ${payment.reference ? ` - Ref: ${payment.reference}` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>

              <!-- Footer -->
              <div class="footer">
                <strong>Thank you for your business!</strong><br>
                Generated by: ${currentUser?.fullName || 'System'} (${currentUser?.role || 'Staff'})<br>
                ${new Date().toLocaleString()}<br><br>
                ${defaultCompanyInfo.website || ''}
              </div>
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
