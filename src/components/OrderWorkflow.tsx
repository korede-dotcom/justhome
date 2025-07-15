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
  AlertCircle
} from 'lucide-react';
import type { Order } from '@/pages/Dashboard';

interface OrderWorkflowProps {
  order: Order;
}

const OrderWorkflow = ({ order }: OrderWorkflowProps) => {
  const getProgressValue = (status: Order['status']) => {
    switch (status) {
      case 'pending_payment': return 20;
      case 'paid': return 40;
      case 'assigned_packager': return 60;
      case 'packaged': return 80;
      case 'picked_up': return 90;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending_payment': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-blue-600 bg-blue-100';
      case 'assigned_packager': return 'text-purple-600 bg-purple-100';
      case 'packaged': return 'text-orange-600 bg-orange-100';
      case 'picked_up': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const workflowSteps = [
    {
      id: 'pending_payment',
      title: 'Waiting for Payment',
      icon: Clock,
      completed: ['paid', 'assigned_packager', 'packaged', 'picked_up', 'delivered'].includes(order.status)
    },
    {
      id: 'paid',
      title: 'Payment Confirmed',
      icon: CreditCard,
      completed: ['assigned_packager', 'packaged', 'picked_up', 'delivered'].includes(order.status)
    },
    {
      id: 'assigned_packager',
      title: 'Assigned to Packager',
      icon: UserCheck,
      completed: ['packaged', 'picked_up', 'delivered'].includes(order.status)
    },
    {
      id: 'packaged',
      title: 'Packaged',
      icon: Package,
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
