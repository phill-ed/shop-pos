// Reports API route - Real-time analytics and reporting
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Helper function to get date range
function getDateRange(period: string) {
  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { startDate, endDate };
}

// GET - Dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const report = searchParams.get('report') || 'dashboard';
    const period = searchParams.get('period') || 'today';

    const { startDate, endDate } = getDateRange(period);

    switch (report) {
      case 'dashboard': {
        // Today's sales summary
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [
          todaySales,
          todayOrders,
          yesterdaySales,
          lowStockProducts,
          topProducts,
          recentOrders,
        ] = await Promise.all([
          // Today's total sales
          prisma.order.aggregate({
            where: {
              status: 'COMPLETED',
              createdAt: { gte: todayStart },
            },
            _sum: { totalAmount: true },
            _count: true,
          }),
          // Today's order count
          prisma.order.count({
            where: {
              status: 'COMPLETED',
              createdAt: { gte: todayStart },
            },
          }),
          // Yesterday's sales for comparison
          prisma.order.aggregate({
            where: {
              status: 'COMPLETED',
              createdAt: {
                gte: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000),
                lt: todayStart,
              },
            },
            _sum: { totalAmount: true },
          }),
          // Low stock products
          prisma.product.findMany({
            where: {
              isActive: true,
              OR: [
                { stockQuantity: { lte: prisma.product.fields.minStock } },
                { stockQuantity: { lt: 10 } },
              ],
            },
            take: 10,
            orderBy: { stockQuantity: 'asc' },
            select: {
              id: true,
              name: true,
              sku: true,
              stockQuantity: true,
              minStock: true,
            },
          }),
          // Top selling products today
          prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
              order: {
                status: 'COMPLETED',
                createdAt: { gte: todayStart },
              },
            },
            _sum: { quantity: true, totalPrice: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
          }),
          // Recent orders
          prisma.order.findMany({
            where: {
              status: 'COMPLETED',
              createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
            },
            include: {
              customer: {
                select: { firstName: true, lastName: true },
              },
              user: {
                select: { firstName: true, lastName: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
        ]);

        const todayTotal = todaySales._sum.totalAmount?.toNumber() || 0;
        const yesterdayTotal = yesterdaySales._sum.totalAmount?.toNumber() || 0;
        const salesChange = yesterdayTotal > 0 
          ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 
          : 0;

        return NextResponse.json({
          dashboard: {
            todaySales,
            todayOrders,
            salesChange: Math.round(salesChange * 100) / 100,
            lowStockProducts,
            topProducts,
            recentOrders,
          },
        });
      }

      case 'sales': {
        // Sales report
        const salesData = await prisma.order.findMany({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            customer: {
              select: { memberCode: true, firstName: true, lastName: true },
            },
            user: {
              select: { firstName: true, lastName: true },
            },
            items: {
              include: {
                product: {
                  select: { name: true, sku: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const summary = await prisma.order.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: {
            subtotal: true,
            taxAmount: true,
            discountAmount: true,
            totalAmount: true,
            profit: true,
          },
          _count: true,
        });

        return NextResponse.json({
          sales: salesData,
          summary: {
            totalOrders: summary._count,
            totalRevenue: summary._sum.totalAmount?.toNumber() || 0,
            totalProfit: summary._sum.profit?.toNumber() || 0,
            totalTax: summary._sum.taxAmount?.toNumber() || 0,
          },
          period: { startDate, endDate },
        });
      }

      case 'products': {
        // Product performance report
        const productStats = await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              status: 'COMPLETED',
              createdAt: { gte: startDate, lte: endDate },
            },
          },
          _sum: {
            quantity: true,
            totalPrice: true,
            profit: true,
          },
          _count: true,
          orderBy: { _sum: { totalPrice: 'desc' } },
        });

        const products = await prisma.product.findMany({
          where: {
            id: { in: productStats.map((p) => p.productId) },
          },
          include: {
            category: {
              select: { name: true },
            },
          },
        });

        const productPerformance = productStats.map((stat) => {
          const product = products.find((p) => p.id === stat.productId);
          return {
            product: product ? {
              id: product.id,
              name: product.name,
              sku: product.sku,
              category: product.category?.name,
            } : null,
            quantitySold: stat._sum.quantity || 0,
            revenue: stat._sum.totalPrice?.toNumber() || 0,
            profit: stat._sum.profit?.toNumber() || 0,
            orderCount: stat._count,
          };
        });

        return NextResponse.json({
          products: productPerformance,
          period: { startDate, endDate },
        });
      }

      case 'inventory': {
        // Inventory report
        const inventory = await prisma.product.findMany({
          where: { isActive: true },
          include: {
            category: {
              select: { name: true },
            },
          },
          orderBy: { stockQuantity: 'asc' },
        });

        const lowStock = inventory.filter(
          (p) => p.stockQuantity <= p.minStock || p.stockQuantity < 10
        );
        const outOfStock = inventory.filter((p) => p.stockQuantity === 0);

        const totalValue = inventory.reduce((sum, p) => {
          return sum + p.stockQuantity * (p.costPrice?.toNumber() || 0);
        }, 0);

        return NextResponse.json({
          inventory,
          summary: {
            totalProducts: inventory.length,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
            totalInventoryValue: Math.round(totalValue * 100) / 100,
          },
          lowStock: lowStock.slice(0, 20),
          outOfStock,
        });
      }

      case 'customers': {
        // Customer report
        const customers = await prisma.customer.findMany({
          where: { isActive: true },
          orderBy: { totalSpent: 'desc' },
          take: 50,
        });

        const topSpenders = customers.slice(0, 10);
        const recentCustomers = await prisma.order.findMany({
          where: {
            customerId: { not: null },
            createdAt: { gte: startDate, lte: endDate },
          },
          include: {
            customer: {
              select: { id: true, memberCode: true, firstName: true, lastName: true },
            },
          },
          distinct: ['customerId'],
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        return NextResponse.json({
          customers,
          summary: {
            totalCustomers: customers.length,
            totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent.toNumber(), 0),
            totalVisits: customers.reduce((sum, c) => sum + c.visitCount, 0),
          },
          topSpenders,
          recentCustomers,
        });
      }

      case 'staff': {
        // Staff performance report
        const staffStats = await prisma.order.groupBy({
          by: ['userId'],
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: {
            totalAmount: true,
            profit: true,
          },
          _count: true,
          orderBy: { _sum: { totalAmount: 'desc' } },
        });

        const users = await prisma.user.findMany({
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        });

        const staffPerformance = staffStats.map((stat) => {
          const user = users.find((u) => u.id === stat.userId);
          return {
            user: user ? {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              role: user.role,
            } : null,
            totalSales: stat._sum.totalAmount?.toNumber() || 0,
            totalProfit: stat._sum.profit?.toNumber() || 0,
            orderCount: stat._count,
            averageOrderValue: stat._count > 0 
              ? (stat._sum.totalAmount?.toNumber() || 0) / stat._count 
              : 0,
          };
        });

        return NextResponse.json({
          staff: staffPerformance,
          period: { startDate, endDate },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
