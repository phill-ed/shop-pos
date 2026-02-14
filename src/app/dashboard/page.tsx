'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Package,
  Users,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  todaySales: {
    _sum: { totalAmount: number | null };
    _count: number;
  };
  todayOrders: number;
  salesChange: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stockQuantity: number;
    minStock: number;
  }>;
  topProducts: Array<{
    productId: string;
    _sum: { quantity: number | null; totalPrice: number | null };
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    customer?: { firstName: string; lastName: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/orders/report?report=dashboard&period=today');
      const data = await res.json();
      setStats(data.dashboard);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const todayTotal = stats?.todaySales._sum.totalAmount?.toNumber() || 0;
  const todayOrders = stats?.todayOrders || 0;
  const salesChange = stats?.salesChange || 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Real-time overview of your shop</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{formatCurrency(todayTotal)}</p>
            <p className="stat-label">Today's Sales</p>
            <p className={`stat-change ${salesChange >= 0 ? 'positive' : 'negative'}`}>
              {salesChange >= 0 ? '↑' : '↓'} {Math.abs(salesChange).toFixed(1)}% vs yesterday
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{todayOrders}</p>
            <p className="stat-label">Orders Today</p>
            <p className="stat-change positive">
              {formatCurrency(todayTotal / (todayOrders || 1))} avg
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats?.lowStockProducts?.length || 0}</p>
            <p className="stat-label">Low Stock Items</p>
            <p className="stat-change text-yellow-600">Needs attention</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="stat-value">{stats?.recentOrders?.length || 0}</p>
            <p className="stat-label">Recent Orders</p>
            <p className="stat-change">Last hour</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
          </div>
          <div className="card-body">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer 
                          ? `${order.customer.firstName} ${order.customer.lastName}`
                          : 'Walk-in customer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders today yet</p>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
            <span className="badge bg-red-100 text-red-800">
              {stats?.lowStockProducts?.length || 0} items
            </span>
          </div>
          <div className="card-body">
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{product.stockQuantity}</p>
                      <p className="text-xs text-gray-500">min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/dashboard/pos"
              className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-primary-600 mb-2" />
              <span className="font-medium text-primary-600">New Sale</span>
            </a>
            <a
              href="/dashboard/products"
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="h-8 w-8 text-green-600 mb-2" />
              <span className="font-medium text-green-600">Add Product</span>
            </a>
            <a
              href="/dashboard/customers"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <span className="font-medium text-purple-600">Add Customer</span>
            </a>
            <a
              href="/dashboard/reports"
              className="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
              <span className="font-medium text-orange-600">View Reports</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
