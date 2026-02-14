// Orders API route - Core POS functionality
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession, auditLog } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
});

const createOrderSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'DIGITAL']),
  amountPaid: z.number().nonnegative(),
  discountAmount: z.number().min(0).default(0),
  note: z.string().optional(),
});

// GET - List orders
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, Date>).lte = new Date(endDate);
    }

    // Non-admin users can only see their own orders
    if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
      where.userId = session.userId;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, memberCode: true, firstName: true, lastName: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new order (checkout)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Get tax rate from settings
    const taxSetting = await prisma.setting.findUnique({
      where: { key: 'tax_rate' },
    });
    const taxRate = parseFloat(taxSetting?.value || '10');

    // Calculate totals
    let subtotal = 0;
    let totalCost = 0;

    for (const item of data.items) {
      const itemTotal = item.unitPrice * item.quantity - item.discount;
      subtotal += itemTotal;

      // Get product cost price
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { costPrice: true },
      });

      if (product?.costPrice) {
        totalCost += product.costPrice * item.quantity;
      }
    }

    const taxAmount = Math.round((subtotal - data.discountAmount) * (taxRate / 100) * 100) / 100;
    const totalAmount = subtotal - data.discountAmount + taxAmount;
    const changeAmount = data.amountPaid - totalAmount;

    if (changeAmount < 0) {
      return NextResponse.json(
        { error: 'Insufficient payment' },
        { status: 400 }
      );
    }

    // Calculate profit
    const profit = subtotal - data.discountAmount - totalCost;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerId: data.customerId,
          userId: session.userId,
          status: 'COMPLETED',
          paymentMethod: data.paymentMethod,
          subtotal,
          taxAmount,
          discountAmount: data.discountAmount,
          totalAmount,
          amountPaid: data.amountPaid,
          changeAmount,
          profit,
          note: data.note,
          completedAt: new Date(),
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              totalPrice: item.unitPrice * item.quantity - item.discount,
            })),
          },
        },
        include: {
          customer: {
            select: { id: true, memberCode: true, firstName: true, lastName: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      });

      // Update product stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: -item.quantity,
            previousStock: 0, // Would need to fetch previous stock
            newStock: 0,
            reference: newOrder.orderNumber,
          },
        });
      }

      // Update customer stats
      if (data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalSpent: { increment: totalAmount },
            visitCount: { increment: 1 },
            loyaltyPoints: { increment: Math.floor(totalAmount) },
          },
        });
      }

      return newOrder;
    });

    await auditLog({
      userId: session.userId,
      action: 'CREATE',
      entity: 'order',
      entityId: order.id,
      newValues: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount.toString(),
        itemCount: data.items.length,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
