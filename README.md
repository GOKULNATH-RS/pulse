# Pulse - Real-Time Personalized Email Campaign Optimizer

A full-stack system that optimizes e-commerce email campaigns in real-time based on live user behavior and product availability.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Dashboard UI │  │  API Gateway │  │  Simulation   │  │
│  │  (React)      │  │  (JWT Auth)  │  │  Engine       │  │
│  └──────────────┘  └──────┬───────┘  └───────────────┘  │
│                           │                              │
│  ┌──────────────┐  ┌──────▼───────┐  ┌───────────────┐  │
│  │  Campaign     │  │  Event       │  │  Churn ML     │  │
│  │  Trigger      │  │  Processor   │  │  Prediction   │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │         Redis 7            │
          │  Events · Profiles · Queue │
          └────────────────────────────┘
                        │
          ┌─────────────▼──────────────┐
          │   Google Apps Script       │
          │   Email Generation &       │
          │   Delivery via Gmail       │
          └────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Recharts, Lucide Icons
- **Backend**: Next.js API Routes with JWT authentication
- **Data Layer**: Redis 7 (streams, sorted sets, hashes, lists)
- **Email**: Google Apps Script Web App
- **Containerization**: Docker multi-stage build + Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- (Optional) Google Apps Script deployment for real email delivery

### Quick Start with Docker

```bash
docker compose up --build
```

This starts the Next.js app on `http://localhost:3000` and Redis on port `6379`.

### Local Development

```bash
# Install dependencies
npm install

# Start Redis (Docker)
docker compose up redis -d

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard.

### Environment Variables

Create `.env.local`:

```env
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
GOOGLE_APPS_SCRIPT_URL=  # Optional: deployed GAS Web App URL
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/token` | No | Generate JWT token |
| POST | `/api/events` | JWT | Ingest user behavior events |
| GET | `/api/metrics` | No | Real-time metrics snapshot |
| POST | `/api/simulation` | No | Start/stop/status simulation |
| GET | `/api/simulation` | No | Simulation status |
| GET | `/api/campaigns` | No | Recent campaign activity |
| POST | `/api/churn` | No | Churn risk prediction |
| GET | `/api/users/:userId` | No | User profile lookup |

### Authentication

```bash
# Get a token
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"clientId": "my-app", "clientSecret": "my-secret"}'

# Send events
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "u1", "eventType": "product_view", "timestamp": 1709827200000, "data": {"productId": "p1"}}'
```

## Event Types

| Event | Description |
|-------|-------------|
| `page_view` | User visits a page |
| `product_view` | User views a product |
| `add_to_cart` | User adds item to cart |
| `remove_from_cart` | User removes item from cart |
| `purchase` | User completes a purchase |
| `search` | User searches for products |
| `wishlist` | User adds to wishlist |

## Campaign Triggers

| Trigger | Condition |
|---------|-----------|
| Cart Abandonment | Items in cart + 30min inactive |
| Browse Abandonment | 3+ products viewed, no cart, 15min inactive |
| Post-Purchase Cross-sell | Purchase within last 24 hours |
| Re-engagement | 5+ sessions + 7 days inactive |
| High Churn Risk | Churn score > 0.7 |

## Dashboard Features

- **Metrics Grid**: Total events, events/sec, active users, campaigns triggered, emails pending/sent, success rate, avg latency
- **Event Throughput Chart**: Real-time area chart of events per minute
- **Email Performance Chart**: Sent vs failed email tracking
- **Processing Latency Chart**: Average latency over time
- **Simulation Controls**: Start/stop with adjustable rate (100-10,000 events/min)
- **Campaign Feed**: Live feed of sent/failed campaigns with trigger type badges

## Google Apps Script Setup

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Paste contents of `google-apps-script/Code.gs`
4. Deploy as Web App (Execute as: Me, Access: Anyone)
5. Set the deployment URL in `.env.local` as `GOOGLE_APPS_SCRIPT_URL`

Without the GAS URL configured, the system simulates email delivery with a 95% success rate.

## Churn Prediction Model

A logistic-regression-style scoring model that evaluates:

- Days since last activity (30% weight)
- Engagement score (20%)
- Session frequency (15%)
- Purchase history (15%)
- Spending level (10%)
- Cart status (5%)
- Account age (5%)

Outputs a 0-1 churn probability score. Users with score > 0.7 trigger re-engagement campaigns.
