# Allo Inventory Reservation System

This is a full-stack inventory reservation system built using Next.js, Prisma, PostgreSQL (Neon), and Redis (Upstash).

It solves the race condition problem during checkout by introducing temporary reservations.

---

## 🧠 Problem

When multiple users try to buy the last unit of a product:
- If stock is reduced only after payment → overselling occurs
- If stock is reduced at add-to-cart → inventory gets blocked unnecessarily

### ✅ Solution:
Introduce **reservations**:
- Reserve stock for a short time (10 minutes)
- Confirm → stock is permanently reduced
- Expire/Cancel → stock is released

---

## ⚙️ Tech Stack

- Next.js (App Router)
- TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- Redis (Upstash)
- Tailwind CSS

---

## 📦 Data Model

- **Product**
- **Warehouse**
- **StockLevel**
  - totalUnits
  - reservedUnits
- **Reservation**
  - status: PENDING | CONFIRMED | RELEASED
  - expiresAt

---

## 🔌 API Endpoints

### GET /api/products
Returns all products with available stock per warehouse.

### GET /api/warehouses
Returns all warehouses.

### POST /api/reservations
Creates a reservation.

- Returns **409** if stock is insufficient
- Uses Redis lock to ensure concurrency safety

### POST /api/reservations/:id/confirm
Confirms reservation.

- Returns **410** if expired

### POST /api/reservations/:id/release
Releases reservation early.

---

## 🔒 Concurrency Handling

To prevent race conditions:

- Used **Redis distributed lock**
- Key: `lock:{productId}:{warehouseId}`
- Only one request can reserve at a time
- Other requests receive `409`

Additionally:
- Prisma transactions ensure atomic updates

---

## ⏳ Expiry Handling

Reservations expire after 10 minutes.

### Approach used:
**Lazy cleanup**

- Expired reservations are released during API calls
- Updates status to `RELEASED`
- Decrements reserved units

### Tradeoff:
- Simpler than cron jobs
- May leave short-lived stale data until next request

---

## 🖥️ Frontend

- Product listing page
- Shows stock per warehouse
- Reserve button

Checkout page:
- Countdown timer
- Confirm / Cancel buttons
- Handles 409 and 410 errors

---

## 🧪 Run Locally

```bash
git clone <repo-url>
cd allo-inventory
npm install