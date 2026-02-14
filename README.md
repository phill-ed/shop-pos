# 🏪 Shop POS - Point of Sale System

A complete, secure web-based Point of Sale system built with Next.js 14 and PostgreSQL.

## Features

### Core Functionality
- 💳 **Point of Sale** - Fast, intuitive checkout with cart management
- 📦 **Inventory Management** - Track stock levels, low stock alerts
- 👥 **Customer Management** - Loyalty program, purchase history
- 📊 **Real-time Reports** - Sales, products, inventory, customers analytics
- 🏷️ **Category Management** - Organize products with colors

### Security
- 🔐 **JWT Authentication** - Secure token-based sessions
- 👤 **Role-based Access** - Admin, Manager, Cashier roles
- 📝 **Audit Logging** - Track all important actions
- ✅ **Input Validation** - Zod schema validation
- 🔒 **Password Hashing** - bcrypt with 12 rounds

### Technical Features
- ⚡ **Real-time Dashboard** - Live sales updates every 30 seconds
- 📈 **Interactive Charts** - Recharts for data visualization
- 🎨 **Modern UI** - Tailwind CSS with responsive design
- 🔄 **Auto-refresh** - Data updates automatically
- 🧾 **Receipt Generation** - Print-ready receipts

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT + bcrypt
- **State Management:** React Hook Form + Zustand
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

1. **Clone and install dependencies:**
```bash
cd shop-pos
npm install
```

2. **Setup database:**
```bash
# Create PostgreSQL database
createdb shop_pos

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/shop_pos"

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Seed with demo data
npm run db:seed
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:3000
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shoppos.com | admin123 |
| Cashier | cashier@shoppos.com | cashier123 |

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
shop-pos/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts         # Database seeding
├── src/
│   ├── app/
│   │   ├── api/        # API routes
│   │   │   ├── auth/   # Authentication
│   │   │   ├── products/
│   │   │   ├── orders/ # Orders & Reports
│   │   │   └── categories/
│   │   ├── dashboard/  # Dashboard pages
│   │   │   ├── pos/    # Point of Sale
│   │   │   ├── products/
│   │   │   ├── reports/
│   │   │   └── ...
│   │   └── login/      # Login page
│   ├── lib/
│   │   ├── prisma.ts   # Database client
│   │   ├── auth.ts     # Auth utilities
│   │   ├── utils.ts    # Helper functions
│   │   └── audit.ts    # Audit logging
│   └── types/          # TypeScript types
├── .env.example        # Environment template
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order (checkout)
- `GET /api/orders/report?report=...` - Reports

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

## Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_NAME="Shop POS"
```

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT

---

Built with ❤️ for retail shops
