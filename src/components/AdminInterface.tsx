import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Eye,
  AlertTriangle,
  Download,
  Calendar,
  CheckCircle
} from 'lucide-react';
import OrderWorkflow from './OrderWorkflow';
import type { Order, UserRole, PendingChange } from '@/pages/Dashboard';

interface AdminInterfaceProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  currentRole: UserRole;
  pendingChanges: PendingChange[];
  onApprovePendingChange: (changeId: string) => void;
  onRejectPendingChange: (changeId: string) => void;
}

const AdminInterface = ({ orders, onUpdateOrder, currentRole, pendingChanges, onApprovePendingChange, onRejectPendingChange }: AdminInterfaceProps) => {
  const { toast } = useToast();

  const totalRevenue = orders
    .filter(order => order.paymentStatus === 'confirmed')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.createdAt);
    return orderDate.toDateString() === today.toDateString();
  });

  const getOrdersByStatus = () => {
    const statusCounts = {
      pending_payment: 0,
      paid: 0,
      assigned_packager: 0,
      packaged: 0,
      picked_up: 0,
      delivered: 0
    };

    orders.forEach(order => {
      statusCounts[order.status]++;
    });

    return statusCounts;
  };

  const statusCounts = getOrdersByStatus();

  const getRevenueByPaymentMethod = () => {
    const methodRevenue = { paystack: 0, bank_transfer: 0, cash: 0 };
    
    orders
      .filter(order => order.paymentStatus === 'confirmed' && order.paymentMethod)
      .forEach(order => {
        methodRevenue[order.paymentMethod!] += order.totalAmount;
      });

    return methodRevenue;
  };

  const revenueByMethod = getRevenueByPaymentMethod();

  const getStaffActivity = () => {
    const activity = {
      attendees: new Set(),
      receptionists: new Set(),
      packagers: new Set(),
      storekeepers: new Set()
    };

    orders.forEach(order => {
      if (order.attendee) activity.attendees.add(order.attendee);
      if (order.receptionist) activity.receptionists.add(order.receptionist);
      if (order.packager) activity.packagers.add(order.packager);
      if (order.storekeeper) activity.storekeepers.add(order.storekeeper);
    });

    return {
      attendees: activity.attendees.size,
      receptionists: activity.receptionists.size,
      packagers: activity.packagers.size,
      storekeepers: activity.storekeepers.size
    };
  };

  const staffActivity = getStaffActivity();

  const handleApproveChange = (changeId: string) => {
    onApprovePendingChange(changeId);
    toast({
      title: "Change approved",
      description: "The change has been approved successfully.",
    });
  };

  const handleRejectChange = (changeId: string) => {
    onRejectPendingChange(changeId);
    toast({
      title: "Change rejected",
      description: "The change has been rejected.",
    });
  };

  const getChangeTypeText = (type: PendingChange['type']) => {
    switch (type) {
      case 'category_edit': return 'Category Edit';
      case 'category_delete': return 'Category Delete';
      case 'product_edit': return 'Product Edit';
      case 'product_delete': return 'Product Delete';
      default: return 'Unknown Change';
    }
  };

  const getChangeDescription = (change: PendingChange) => {
    switch (change.type) {
      case 'category_edit':
        return `Edit "${change.originalItem?.name}" category`;
      case 'category_delete':
        return `Delete "${change.originalItem?.name}" category`;
      case 'product_edit':
        return `Edit "${change.originalItem?.name}" product`;
      case 'product_delete':
        return `Delete "${change.originalItem?.name}" product`;
      default:
        return 'Unknown change';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-600">
          {currentRole} Dashboard
        </h2>
        <div className="flex items-center gap-4">
          {pendingChanges.filter(c => c.status === 'pending').length > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingChanges.filter(c => c.status === 'pending').length} Pending Approvals
            </Badge>
          )}
          <Badge variant="outline" className="text-lg px-3 py-1">
            Full Access
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="approvals">
            Approvals
            {pendingChanges.filter(c => c.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {pendingChanges.filter(c => c.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="staff">Staff Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Total Revenue</p>
                    <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Today's Orders</p>
                    <p className="text-2xl font-bold">{todayOrders.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Active Staff</p>
                    <p className="text-2xl font-bold">
                      {staffActivity.attendees + staffActivity.receptionists + staffActivity.packagers + staffActivity.storekeepers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100">Completion Rate</p>
                    <p className="text-2xl font-bold">
                      {orders.length > 0 ? Math.round((statusCounts.delivered / orders.length) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Order Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {status.replace('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">All Orders ({orders.length})</h3>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <OrderWorkflow key={order.id} order={order} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Pending Approvals</h3>
            <Badge variant="outline">
              {pendingChanges.filter(c => c.status === 'pending').length} pending
            </Badge>
          </div>

          {pendingChanges.filter(c => c.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">No Pending Approvals</h3>
                <p className="text-gray-500">All changes have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingChanges
                .filter(change => change.status === 'pending')
                .map((change) => (
                  <Card key={change.id} className="border-2 border-orange-200">
                    <CardHeader className="bg-orange-50">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg text-orange-800">
                          {getChangeTypeText(change.type)}
                        </CardTitle>
                        <Badge className="bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Pending Review
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Submitted by:</strong> {change.submittedBy}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Date:</strong> {change.submittedAt.toLocaleDateString()}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Change Description:</h4>
                        <p className="text-sm text-gray-700">{getChangeDescription(change)}</p>
                      </div>

                      {change.type.includes('edit') && change.newItem && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Proposed Changes:</h4>
                          <div className="space-y-1 text-sm">
                            <div><strong>Name:</strong> {change.originalItem?.name} → {change.newItem?.name}</div>
                            {change.newItem?.description && (
                              <div><strong>Description:</strong> {change.originalItem?.description} → {change.newItem?.description}</div>
                            )}
                            {change.newItem?.price && (
                              <div><strong>Price:</strong> ₦{change.originalItem?.price?.toLocaleString()} → ₦{change.newItem?.price?.toLocaleString()}</div>
                            )}
                            {change.newItem?.totalStock && (
                              <div><strong>Stock:</strong> {change.originalItem?.totalStock} → {change.newItem?.totalStock}</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproveChange(change.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectChange(change.id)}
                          variant="outline"
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Show recent approved/rejected changes */}
          {pendingChanges.filter(c => c.status !== 'pending').length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Recent Decisions</h4>
              <div className="space-y-2">
                {pendingChanges
                  .filter(change => change.status !== 'pending')
                  .slice(0, 5)
                  .map((change) => (
                    <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm">{getChangeDescription(change)}</span>
                      <Badge variant={change.status === 'approved' ? 'default' : 'secondary'}>
                        {change.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Paystack</span>
                    <span className="font-bold">₦{revenueByMethod.paystack.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bank Transfer</span>
                    <span className="font-bold">₦{revenueByMethod.bank_transfer.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cash</span>
                    <span className="font-bold">₦{revenueByMethod.cash.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Processing Times */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Pending Payments</span>
                    <Badge variant={statusCounts.pending_payment > 5 ? "destructive" : "secondary"}>
                      {statusCounts.pending_payment}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Processing Orders</span>
                    <Badge variant="secondary">
                      {statusCounts.paid + statusCounts.assigned_packager + statusCounts.packaged}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completed Today</span>
                    <Badge variant="secondary">
                      {todayOrders.filter(o => o.status === 'delivered').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sales Attendees</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{staffActivity.attendees}</p>
                <p className="text-sm text-gray-600">Active today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Receptionists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{staffActivity.receptionists}</p>
                <p className="text-sm text-gray-600">Processing orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Packagers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-pink-600">{staffActivity.packagers}</p>
                <p className="text-sm text-gray-600">Active assignments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Storekeepers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-indigo-600">{staffActivity.storekeepers}</p>
                <p className="text-sm text-gray-600">Items released</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Staff Activity */}
          {currentRole === 'CEO' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Eye className="h-5 w-5" />
                  Audit Trail (CEO Only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orders.slice(0, 10).map((order) => (
                    <div key={order.id} className="text-sm p-2 bg-gray-50 rounded">
                      <strong>{order.receiptId}</strong> - {order.customerName} 
                      {' '}handled by {order.attendee}
                      {order.receptionist && ` → ${order.receptionist}`}
                      {order.packager && ` → ${order.packager}`}
                      {order.storekeeper && ` → ${order.storekeeper}`}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminInterface;
