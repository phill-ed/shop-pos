'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalTax: number;
}

interface ProductPerformance {
  product: { id: string; name: string; sku: string; category: string | null } | null;
  quantitySold: number;
  revenue: number;
  profit: number;
  orderCount: number;
}

interface PeriodData {
  startDate: string;
  endDate: string;
}

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

type ReportType = 'sales' | 'products' | 'inventory' | 'customers';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    fetchReport();
  }, [activeReport, period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/report?report=${activeReport}&period=${period}`);
      const data = await res.json();

      switch (activeReport) {
        case 'sales':
          setSummary(data.summary);
          setSalesData(data.sales || []);
          break;
        case 'products':
          setProductPerformance(data.products || []);
          break;
        case 'inventory':
          setInventoryData(data);
          break;
        case 'customers':
          setCustomerData(data);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      );
    }

    switch (activeReport) {
      case 'sales':
        return <SalesReport data={salesData} summary={summary} />;
      case 'products':
        return <ProductsReport data={productPerformance} />;
      case 'inventory':
        return <InventoryReport data={inventoryData} />;
      case 'customers':
        return <CustomersReport data={customerData} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Real-time analytics and insights</p>
        </div>
        <button className="btn-secondary">
          <Download className="h-5 w-5 mr-2" />
          Export
        </button>
      </div>

      {/* Report tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { id: 'sales', label: 'Sales', icon: DollarSign },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'inventory', label: 'Inventory', icon: BarChart3 },
            { id: 'customers', label: 'Customers', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as ReportType)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                activeReport === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as typeof period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report content */}
      {renderReportContent()}
    </div>
  );
}

function SalesReport({ data, summary }: { data: any[]; summary: SalesSummary | null }) {
  // Generate chart data from sales
  const chartData = data.slice(0, 20).map((order, index) => ({
    name: order.orderNumber.slice(-8),
    revenue: Number(order.totalAmount),
    profit: Number(order.profit || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <DollarSign className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="stat-card">
          <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{summary?.totalOrders || 0}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>
        <div className="stat-card">
          <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(summary?.totalProfit || 0)}</p>
          <p className="text-sm text-gray-500">Total Profit</p>
        </div>
        <div className="stat-card">
          <Package className="h-8 w-8 text-orange-600 mb-2" />
          <p className="text-2xl font-bold">{formatCurrency(summary?.totalTax || 0)}</p>
          <p className="text-sm text-gray-500">Total Tax</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Revenue Overview</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent sales table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Recent Sales</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Profit</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((order) => (
                <tr key={order.id}>
                  <td className="font-mono text-sm">{order.orderNumber}</td>
                  <td>
                    {order.customer
                      ? `${order.customer.firstName} ${order.customer.lastName}`
                      : 'Walk-in'}
                  </td>
                  <td className="font-medium">{formatCurrency(order.totalAmount)}</td>
                  <td className="text-green-600">{formatCurrency(order.profit || 0)}</td>
                  <td className="text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsReport({ data }: { data: ProductPerformance[] }) {
  const topProducts = data.slice(0, 10);
  const pieData = topProducts.map((p, index) => ({
    name: p.product?.name || 'Unknown',
    value: p.revenue,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <Package className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">
            {data.reduce((sum, p) => sum + p.quantitySold, 0)}
          </p>
          <p className="text-sm text-gray-500">Items Sold</p>
        </div>
        <div className="stat-card">
          <DollarSign className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">
            {formatCurrency(data.reduce((sum, p) => sum + p.revenue, 0))}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="stat-card">
          <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold">
            {formatCurrency(data.reduce((sum, p) => sum + p.profit, 0))}
          </p>
          <p className="text-sm text-gray-500">Total Profit</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Top Products by Revenue</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="product.name" width={150} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold">Revenue Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Product Performance</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 15).map((item, index) => (
                <tr key={item.product?.id || index}>
                  <td className="font-medium">{index + 1}</td>
                  <td className="font-medium">{item.product?.name || 'Unknown'}</td>
                  <td className="text-gray-500">{item.product?.sku}</td>
                  <td>{item.quantitySold}</td>
                  <td className="font-medium">{formatCurrency(item.revenue)}</td>
                  <td className="text-green-600">{formatCurrency(item.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventoryReport({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <Package className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{data.summary?.totalProducts || 0}</p>
          <p className="text-sm text-gray-500">Total Products</p>
        </div>
        <div className="stat-card">
          <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">
            {formatCurrency(data.summary?.totalInventoryValue || 0)}
          </p>
          <p className="text-sm text-gray-500">Inventory Value</p>
        </div>
        <div className="stat-card">
          <BarChart3 className="h-8 w-8 text-yellow-600 mb-2" />
          <p className="text-2xl font-bold text-yellow-600">
            {data.summary?.lowStockCount || 0}
          </p>
          <p className="text-sm text-gray-500">Low Stock</p>
        </div>
        <div className="stat-card">
          <Package className="h-8 w-8 text-red-600 mb-2" />
          <p className="text-2xl font-bold text-red-600">
            {data.summary?.outOfStockCount || 0}
          </p>
          <p className="text-sm text-gray-500">Out of Stock</p>
        </div>
      </div>

      {/* Low stock alerts */}
      {data.lowStock && data.lowStock.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-yellow-600">Low Stock Alerts</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td className="font-mono text-sm">{item.sku}</td>
                    <td className="text-red-600 font-medium">{item.stockQuantity}</td>
                    <td>{item.minStock}</td>
                    <td>
                      <span className="badge bg-red-100 text-red-800">
                        {item.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full inventory table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Full Inventory</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.inventory?.map((item: any) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td>
                    <span className="badge bg-gray-100">{item.category?.name}</span>
                  </td>
                  <td className="font-mono text-sm">{item.sku}</td>
                  <td className={item.stockQuantity <= 10 ? 'text-red-600 font-medium' : ''}>
                    {item.stockQuantity}
                  </td>
                  <td>{formatCurrency(item.stockQuantity * (item.costPrice?.toNumber() || 0))}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.stockQuantity === 0
                          ? 'bg-red-100 text-red-800'
                          : item.stockQuantity <= item.minStock
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.stockQuantity === 0
                        ? 'Out'
                        : item.stockQuantity <= item.minStock
                        ? 'Low'
                        : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CustomersReport({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <Users className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{data.summary?.totalCustomers || 0}</p>
          <p className="text-sm text-gray-500">Total Customers</p>
        </div>
        <div className="stat-card">
          <DollarSign className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">
            {formatCurrency(data.summary?.totalRevenue || 0)}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="stat-card">
          <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold">
            {data.summary?.totalVisits || 0}
          </p>
          <p className="text-sm text-gray-500">Total Visits</p>
        </div>
      </div>

      {/* Top spenders */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Top Customers</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Member Code</th>
                <th>Loyalty Points</th>
                <th>Visits</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {data.topSpenders?.map((customer: any) => (
                <tr key={customer.id}>
                  <td className="font-medium">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="font-mono text-sm">{customer.memberCode}</td>
                  <td>{customer.loyaltyPoints}</td>
                  <td>{customer.visitCount}</td>
                  <td className="font-medium">{formatCurrency(customer.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
