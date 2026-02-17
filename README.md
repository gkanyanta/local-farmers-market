# Local Farmers Market

A mobile-first Progressive Web App (PWA) for ordering fresh produce and everyday goods sourced from local Zambian farmers. Built for Lusaka, Zambia with pickup-based fulfillment.

## Features

- **Mobile-first PWA**: Installable on iOS/Android with offline support
- **Customer Portal**: Browse products, cart, checkout, order tracking
- **Admin Dashboard**: Manage products, orders, categories, payments
- **Lenco Payment Integration**: Secure payment processing with webhook verification
- **Daily Picking Lists**: Aggregated order items with CSV export
- **Role-based Access**: Customer, Admin, and Staff roles

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (credentials)
- **Payments**: Lenco
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted like Supabase)
- Lenco merchant account (for payments)

### Installation

1. **Clone and install dependencies**

```bash
cd market-app
npm install
```

2. **Set up environment variables**

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/farmers_market?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# App
APP_BASE_URL="http://localhost:3000"

# Lenco Payment Gateway
LENCO_SECRET_KEY="your-lenco-secret-key"
LENCO_PUBLIC_KEY="your-lenco-public-key"
LENCO_WEBHOOK_SECRET="your-lenco-webhook-secret"
LENCO_BASE_URL="https://api.lenco.co"
```

3. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npm run db:seed
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Login Credentials

After seeding, you can log in with:

- **Admin**: admin@localfarmersmarket.zm / admin123
- **Staff**: staff@localfarmersmarket.zm / staff123
- **Customer**: customer@test.zm / customer123

## Project Structure

```
market-app/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (shop)/            # Customer pages (shop, cart, checkout, orders)
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── offline/           # PWA offline page
├── components/            # React components
│   ├── ui/               # UI primitives (button, card, etc.)
│   ├── layout/           # Layout components (header, footer)
│   ├── shop/             # Shop-specific components
│   └── cart/             # Cart components and provider
├── lib/                   # Utilities and services
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── lenco.ts          # Lenco payment integration
│   └── validations.ts    # Zod schemas
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Seed data
└── public/               # Static assets
    ├── manifest.json     # PWA manifest
    └── sw.js            # Service worker
```

## Core Workflows

### Order Flow

1. Customer browses and adds items to cart
2. Cart enforces K200 minimum order value
3. Checkout collects pickup details (own rider vs book rider)
4. Payment initiated via Lenco
5. Order created as `PENDING_PAYMENT`
6. Lenco webhook confirms payment → Order becomes `CONFIRMED`
7. Admin moves order through: `SOURCING` → `READY_FOR_PICKUP` → `PICKED_UP`

### Order Statuses

| Status | Description |
|--------|-------------|
| PENDING_PAYMENT | Awaiting payment confirmation |
| CONFIRMED | Payment verified, ready for sourcing |
| SOURCING | Items being sourced from farmers |
| READY_FOR_PICKUP | Order ready for customer pickup |
| PICKED_UP | Order collected |
| CANCELLED | Order cancelled |

## Lenco Integration

### Webhook Setup

1. In your Lenco dashboard, configure the webhook URL:
   ```
   https://your-domain.com/api/webhooks/lenco
   ```

2. Copy the webhook secret to your `LENCO_WEBHOOK_SECRET` env var

3. The webhook handler:
   - Verifies signature using HMAC-SHA256
   - Prevents duplicate processing (idempotency)
   - Updates payment and order status

### Testing Webhooks Locally

Use a tool like [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL as your webhook endpoint in Lenco's dashboard.

### Adjusting the Integration

The Lenco integration is in `lib/lenco.ts`. Modify these functions based on actual Lenco API documentation:

- `createPaymentIntent()` - Initiate payment
- `verifyWebhookSignature()` - Verify webhook authenticity
- `parseWebhookEvent()` - Parse webhook payload

## PWA Features

### Installation

- **Android**: Chrome will prompt "Add to Home Screen" automatically
- **iOS**: Tap Share → "Add to Home Screen"

### Offline Support

The service worker caches:
- App shell (HTML, CSS, JS)
- Previously visited pages
- Shows offline page when network unavailable

### Icons

Generate PWA icons using a tool like [PWA Asset Generator](https://github.com/nickvdyck/pwa-asset-generator):

```bash
npx pwa-asset-generator logo.png public/icons
```

## Deployment to Vercel

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Connect to Vercel**

- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables in project settings
- Deploy

3. **Set up database**

- Use Vercel Postgres or an external provider like Supabase
- Update `DATABASE_URL` in Vercel environment variables
- Run migrations: The `postinstall` script runs `prisma generate` automatically

4. **Configure Lenco Webhook**

Update your Lenco webhook URL to your production domain:
```
https://your-app.vercel.app/api/webhooks/lenco
```

## Currency

All prices are in Zambian Kwacha (ZMW). The minimum order value is K200.

## Important Notes

### Messaging

- Never mention specific markets to customers
- Always refer to "local hardworking Zambian farmers"
- Include delivery disclaimer: "We are not a delivery company. Pickup is via your rider or a rider booked at your cost."

### Inventory

- **Perishables**: No stock tracking; sourced fresh after confirmed orders
- **Non-perishables**: Stock quantity tracked and decremented on pickup

### Pickup Options

1. **Own Rider**: Customer sends their rider
2. **Book Rider**: Platform helps arrange a rider (fees paid separately by customer)

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run db:push    # Push Prisma schema to database
npm run db:migrate # Create and apply migrations
npm run db:seed    # Seed database with sample data
npm run db:studio  # Open Prisma Studio
```

## License

Private - All rights reserved.
