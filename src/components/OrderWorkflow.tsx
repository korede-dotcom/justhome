import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CreditCard,
  UserCheck,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  PackageCheck,
  TruckIcon,
  Home,
  Star
} from 'lucide-react';
import type { Order, OrderStatus } from '@/pages/Dashboard';

interface OrderWorkflowProps {
  order: Order;
}

const OrderWorkflow = ({ order }: OrderWorkflowProps) => {
  const getProgressValue = (status: OrderStatus): number => {
    const progressMap: Record<OrderStatus, number> = {
      pending_payment: 5,
      partial_payment: 15,
      paid: 25,
      confirmed: 35,
      assigned_packager: 45,
      packaging: 55,
      packaged: 65,
      assigned_delivery: 75,
      out_for_delivery: 85,
      picked_up: 95,
      delivered: 100,
      completed: 100,
      cancelled: 0,
      refunded: 0,
    };
    return progressMap[status] || 0;
  };

  const getStatusColor = (status: OrderStatus): string => {
    const colorMap: Record<OrderStatus, string> = {
      pending_payment: 'text-red-600',
      partial_payment: 'text-yellow-600',
      paid: 'text-green-600',
      confirmed: 'text-green-600',
      assigned_packager: 'text-blue-600',
      packaging: 'text-blue-600',
      packaged: 'text-purple-600',
      assigned_delivery: 'text-indigo-600',
      out_for_delivery: 'text-orange-600',
      picked_up: 'text-green-600',
      delivered: 'text-green-600',
      completed: 'text-gray-600',
      cancelled: 'text-red-600',
      refunded: 'text-gray-600',
    };
    return colorMap[status] || 'text-gray-600';
  };

  const getStatusIcon = (status: OrderStatus) => {
    const iconMap: Record<OrderStatus, React.ReactNode> = {
      pending_payment: <Clock className="h-4 w-4" />,
      partial_payment: <DollarSign className="h-4 w-4" />,
      paid: <CreditCard className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      assigned_packager: <User className="h-4 w-4" />,
      packaging: <Package className="h-4 w-4" />,
      packaged: <PackageCheck className="h-4 w-4" />,
      assigned_delivery: <TruckIcon className="h-4 w-4" />,
      out_for_delivery: <Truck className="h-4 w-4" />,
      picked_up: <Home className="h-4 w-4" />,
      delivered: <CheckCircle className="h-4 w-4" />,
      completed: <Star className="h-4 w-4" />,
      cancelled: <AlertCircle className="h-4 w-4" />,
      refunded: <AlertCircle className="h-4 w-4" />,
    };
    return iconMap[status] || <AlertCircle className="h-4 w-4" />;
  };

  const workflowSteps = [
    {
      id: 'pending_payment',
      title: 'Waiting for Payment',
      description: 'Order created, awaiting payment',
      icon: Clock,
      status: 'pending_payment',
      completed: !['pending_payment'].includes(order.status)
    },
    {
      id: 'partial_payment',
      title: 'Partial Payment',
      description: 'Partial payment received',
      icon: DollarSign,
      status: 'partial_payment',
      completed: !['pending_payment', 'partial_payment'].includes(order.status)
    },
    {
      id: 'paid',
      title: 'Payment Confirmed',
      description: 'Full payment received and confirmed',
      icon: CreditCard,
      status: 'paid',
      completed: !['pending_payment', 'partial_payment', 'paid'].includes(order.status)
    },
    {
      id: 'assigned_packager',
      title: 'Assigned to Packager',
      description: 'Order assigned to packaging team',
      icon: User,
      status: 'assigned_packager',
      completed: !['pending_payment', 'partial_payment', 'paid', 'confirmed', 'assigned_packager'].includes(order.status)
    },
    {
      id: 'packaging',
      title: 'Being Packaged',
      description: 'Order is currently being packaged',
      icon: Package,
      status: 'packaging',
      completed: !['pending_payment', 'partial_payment', 'paid', 'confirmed', 'assigned_packager', 'packaging'].includes(order.status)
    },
    {
      id: 'packaged',
      title: 'Packaged',
      description: 'Order packaged and ready',
      icon: PackageCheck,
      status: 'packaged',
      completed: ['picked_up', 'delivered'].includes(order.status)
    },
    {
      id: 'picked_up',
      title: 'Picked Up',
      icon: Truck,
      completed: ['delivered'].includes(order.status)
    },
    {
      id: 'delivered',
      title: 'Delivered',
      icon: CheckCircle,
      completed: order.status === 'delivered'
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Progress</CardTitle>
          <Badge className={getStatusColor(order.status)}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <Progress value={getProgressValue(order.status)} className="w-full" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === order.status;
            const isCompleted = step.completed;
            
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-full border-2 
                  ${isCompleted 
                    ? 'bg-green-100 border-green-500 text-green-600' 
                    : isActive 
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1">
                  <p className={`font-medium ${
                    isCompleted ? 'text-green-600' : 
                    isActive ? 'text-blue-600' : 
                    'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  
                  {step.id === 'assigned_packager' && order.packager && (
                    <p className="text-sm text-gray-600">
                      Assigned to: {order.packager.fullName}
                    </p>
                  )}
                  
                  {step.id === 'paid' && order.paymentMethod && (
                    <p className="text-sm text-gray-600">
                      Payment: {order.paymentMethod.replace('_', ' ').toUpperCase()}
                    </p>
                  )}
                </div>
                
                {isActive && (
                  <AlertCircle className="h-4 w-4 text-blue-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Receipt ID</p>
              <p className="font-mono font-medium">{order.receiptId}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Amount</p>
              <p className="font-bold text-green-600">
                ₦{order.totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Attendee</p>
              <p className="font-medium">{order.attendee.fullName}</p>
            </div>
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">
                {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderWorkflow;
