# UniMarket — Student Marketplace

> V1 PRD: `UniMarket_PRD_V2.2.docx`
> Stack: **Expo** + **Node.js/Express** + **Supabase** + **Railway** + **Vercel**
> Timeline: 12 weeks to Android production launch

---

## Project Structure

```
www2k/
├── backend/        ← Node.js + Express API → deployed to Railway
├── mobile/         ← Expo React Native app → Android APK + PWA
├── admin/          ← Vite React admin panel → deployed to Vercel
├── supabase/
│   └── schema.sql  ← Run once in Supabase SQL Editor
└── README.md
```

---

## Quick Start

### 1. Supabase Setup
1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste entire `supabase/schema.sql` → Run
3. Create 2 Storage buckets: `product-images` (public), `payment-screenshots` (private)
4. Copy your **Project URL** and **anon key** + **service role key**

### 2. Backend (Railway)
```bash
cd backend
cp .env.example .env    # Fill in your Supabase keys
npm install
npm run dev             # Runs on http://localhost:3000
# Test: curl http://localhost:3000/health
```

**Deploy to Railway:**
1. Push to GitHub
2. Connect repo at [railway.app](https://railway.app)
3. Add env vars from `.env.example` in Railway dashboard
4. Set spending limit to **$10/month** on Day 1 ⚠️

### 3. Mobile (Expo)
```bash
cd mobile
cp .env.example .env    # Fill in your Supabase keys + Railway API URL
npx expo start
# Press 'a' for Android emulator or scan QR with Expo Go
```

### 4. Admin Panel (Vercel)
```bash
cd admin
npm run dev             # http://localhost:5173
```

---

## Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (never expose to client) |
| `SUPABASE_ANON_KEY` | Anon key (for JWT verification) |
| `PORT` | Server port (Railway sets automatically) |

### mobile/.env
| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `EXPO_PUBLIC_API_URL` | Your Railway backend URL |

---

## Subscription Tiers

| Tier | Price | Max Products | Feed Priority |
|---|---|---|---|
| Free | ₹0 (1 month) | 3 | Lowest |
| Pro | ₹999/month | 10 | Mid |
| Premium | ₹2,500/month | 30 | Top |

---

## API Routes

| Method | Route | Auth |
|---|---|---|
| `POST` | `/auth/register` | No |
| `GET` | `/products?category=&search=` | No |
| `GET` | `/products/:id` | No |
| `POST` | `/products` | Seller |
| `PATCH` | `/products/:id` | Seller (own) |
| `DELETE` | `/products/:id` | Seller (own) |
| `GET` | `/sellers/:id` | No |
| `POST` | `/sellers/register` | Buyer |
| `GET` | `/sellers/me` | Seller |
| `POST` | `/orders` | Buyer |
| `GET` | `/orders/me` | Buyer |
| `GET` | `/orders/incoming` | Seller |
| `PATCH` | `/orders/:id/status` | Seller |
| `POST` | `/reviews` | Buyer |
| `GET` | `/reviews/:sellerId` | No |
| `POST` | `/subscriptions/request` | Seller |
| `GET` | `/admin/sellers/pending` | Admin |
| `PATCH` | `/admin/sellers/:id/approve` | Admin |
| `GET` | `/admin/subscriptions/pending` | Admin |
| `PATCH` | `/admin/subscriptions/:id/verify` | Admin |
| `GET` | `/admin/subscriptions/expiring` | Admin |
| `PATCH` | `/admin/sellers/:id/downgrade` | Admin |
| `GET` | `/admin/stats` | Admin |

---

## Week 1 Checklist
- [ ] Supabase project created + schema.sql executed
- [ ] Supabase storage buckets created
- [ ] Backend running locally (`/health` returns `{"status":"ok"}`)
- [ ] Railway project created, env vars added, spending limit set to $10
- [ ] Backend deployed to Railway — health endpoint live
- [ ] GitHub repo created with branch protection on `main`
- [ ] Supabase egress monitoring added to daily checklist

---

*UniMarket PRD V2.2 — Confidential | February 2026*
