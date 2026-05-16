# ForkHub — Simple Food Ordering System

A full-stack web application for browsing a restaurant menu, placing customized orders, and managing the restaurant backend. Built with **React 19** (frontend) and **Express 5** (API server).

---

## Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [How the App Works](#how-the-app-works)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [How to Run](#how-to-run)
- [API Endpoints](#api-endpoints)
- [Scope](#scope)
- [Limitations](#limitations)

---

## About

ForkHub is a capstone project that simulates a real-world online food ordering platform. Customers can browse a categorized menu, customize items (size, add-ons, quantity), add them to a cart, and place orders. An admin panel allows restaurant staff to manage the menu, update order statuses, and upload images. The app uses JWT authentication, browser localStorage for cart persistence, and JSON files for data storage with optional PostgreSQL support.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router DOM 7, Vite 8 |
| Backend | Node.js, Express 5 |
| Authentication | bcrypt 6, jsonwebtoken 9 |
| Storage | JSON files (default), PostgreSQL (optional) |
| Maps | Leaflet (CDN) |
| Styling | Custom CSS (~6100 lines) |
| Linting | ESLint 9 |

---

## Features

- **Menu Browsing** — Items grouped by category and subcategory
- **Item Customization** — Choose size, quantity, and add-on options per item
- **Shopping Cart** — Persistent cart stored in localStorage (survives page refreshes)
- **User Authentication** — Register and login with JWT tokens
- **Order Placement** — Checkout with service type (pickup/delivery), address selection via map
- **Order Tracking** — Public page to look up orders by ID or phone number (no login required)
- **User Dashboard** — View order history and profile details
- **Admin Panel** — Full CRUD for menu items, order status management, drag-and-drop image upload
- **Account Management** — Profile updates and account deletion with 5-day grace period and restore
- **Responsive UI** — Works on desktop and mobile screens

---

## How the App Works

### User Flow

```
Home Page → Browse Menu → View Category Items → Customize Item → Add to Cart
                                                                        ↓
                                                                   Cart Page
                                                                        ↓
                                                    Checkout (pickup/delivery, map, address)
                                                                        ↓
                                                             Place Order
                                                                        ↓
                                                          Tracking / Dashboard
```

1. **Home** — Landing page with hero section, features, and navigation
2. **Menu** — Items displayed by category (Pizza, Chicken, Pasta, Beverages, Desserts, Sides, Extras). Clicking a category opens a modal with items.
3. **Customize** — For each item, the user selects size, quantity, and any special options before adding to cart.
4. **Cart** — View cart contents, update quantities, or remove items. Cart is stored in localStorage and synced across tabs via custom events.
5. **Checkout** — User chooses pickup or delivery. For delivery, a Leaflet map lets them drop a pin for their address. They review the order and place it.
6. **Tracking** — After placing, the user can track their order status (Pending, Preparing, Ready, Out for Delivery, Delivered). The tracking page is public — anyone with an order ID or phone number can look it up.
7. **Dashboard** — Logged-in users see their order history and profile information.

### Admin Flow

```
Login as admin → Admin Panel (/admin)
                    ├── List Items — View, edit, delete menu items
                    ├── Add Item — Add new items with name, price, category, image
                    └── Orders — View all orders, update status
```

### Authentication Flow

- Register → password is hashed with bcrypt (10 salt rounds) → user saved to `users.json`
- Login → credentials verified → JWT issued (default 1h expiry) → token stored in localStorage as `auth_token`
- Protected routes check for valid JWT; admin routes additionally check `role === "admin"`
- A custom `auth-changed` DOM event fires on login/logout/profile update to sync all open tabs

### Data Storage Flow

- **Default**: JSON files in `data/` (`users.json`, `menu.json`, `orders.json`) — read/written with atomic temp-file-rename pattern
- **Optional PostgreSQL**: If `DATABASE_URL` is set, orders are stored in a `fh_orders` table (JSONB column) instead of `orders.json`
- **Cart**: Entirely client-side via `localStorage` under key `fh_cart_items`

---

## Project Structure

```
forkhub/
├── data/                   # JSON file storage (users, menu, orders)
│   ├── menu.json           # Seeded menu items (~30 items)
│   ├── orders.json         # Order records
│   └── users.json          # User accounts (bcrypt-hashed passwords)
├── docs/                   # Documentation
│   ├── HLD.txt             # High-Level Design (339 lines)
│   ├── HLD_Navigation.md   # Navigation & routing spec (421 lines)
│   ├── erd/                # Entity Relationship Diagram
│   ├── system_design/      # System architecture diagram
│   └── uml/                # Activity & sequence diagrams
├── public/                 # Static assets
│   ├── design-frames/      # 14 UI mockup PNGs (Figma exports)
│   ├── images/             # Food item images (organized by category)
│   ├── favicon.svg
│   └── icons.svg
├── server/                 # Express backend
│   ├── index.js            # Server entry point
│   ├── app.js              # Express app (middleware, CORS, routes)
│   ├── config.js           # Config (PORT, JWT, file paths)
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT verification middleware
│   ├── routes/
│   │   ├── auth.routes.js  # Register, login, profile, admin-check
│   │   ├── menu.routes.js  # Menu CRUD + image upload
│   │   └── order.routes.js # Order placement, history, tracking
│   ├── services/
│   │   ├── userStore.js    # JSON read/write for users
│   │   ├── menuStore.js    # JSON read/write for menu
│   │   └── orderStore.js   # Order store (JSON, optional PostgreSQL)
│   └── utils/
│       ├── httpErrors.js   # HTTP error factory
│       └── validators.js   # Email/password validators
├── src/                    # React frontend
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root component (routing, auth checks)
│   ├── App.css             # Main stylesheet
│   ├── index.css           # Global CSS variables
│   ├── assets/             # SVGs, images (17 files)
│   ├── components/         # Reusable UI (AuthOverlay, Button, CategoryModal, etc.)
│   ├── contexts/           # AuthModalContext (login/register modal state)
│   ├── features/           # Feature modules (auth, dashboard)
│   ├── pages/              # Page-level components (Home, Menu, Cart, Order, etc.)
│   ├── routes/             # Route definitions (AppRoutes.jsx)
│   └── services/           # API client modules (auth, cart, menu, order)
├── index.html              # Vite entry HTML
├── vite.config.js          # Vite config (proxy, React plugin)
├── package.json            # Dependencies & scripts
└── .env.example            # Environment template
```

---

## Installation & Setup

### Prerequisites

- **Node.js** v18 or later
- **npm**

### Steps

```bash
# 1. Navigate to project
cd forkhub

# 2. Install dependencies
npm install

# 3. Create environment config
cp .env.example .env
```

Edit `.env`:

```
PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
```

Optional additions:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ADMIN_SECRET=your-admin-secret
VITE_API_BASE_URL=http://localhost:3001
```

---

## How to Run

You need **two terminals**.

### Terminal 1 — Backend API

```bash
cd forkhub
npm run server
```

The Express server runs on **http://localhost:3001**.

### Terminal 2 — Frontend Dev Server

```bash
cd forkhub
npm run dev
```

Vite runs on **http://localhost:5173** (proxies `/api` and `/images` to the backend).

### Production Build

```bash
cd forkhub
npm run build      # Builds to dist/
npm run preview    # Preview the build
```

### Lint

```bash
npm run lint
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Sign in |
| GET | `/profile` | Yes | Get profile |
| PUT | `/profile` | Yes | Update profile |
| DELETE | `/profile` | Yes | Delete account (5-day grace) |
| POST | `/restore` | No | Restore deleted account |
| GET | `/admin-check` | Yes | Check admin status |

### Menu (`/api/menu`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List all items |
| GET | `/:id` | No | Get single item |
| POST | `/` | Admin | Add item |
| PUT | `/:id` | Admin | Update item |
| DELETE | `/:id` | Admin | Delete item |
| POST | `/upload/:id` | Admin | Upload image |

### Orders (`/api/orders`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | User's orders |
| GET | `/track` | No | Track by ID or phone |
| POST | `/` | Yes | Place order |
| PUT | `/:id/status` | Admin | Update status |

---

## Scope

- Online food ordering for a **single restaurant branch**
- Menu categorized into sections (Pizza, Chicken, Pasta, Beverages, Desserts, Sides, Extras)
- Per-item customization (size, quantity, add-on options)
- Cart persisted in the browser via localStorage
- User registration, login, and profile management
- JWT-based protected routes (user + admin levels)
- Order placement with pickup or delivery options
- Interactive map for delivery address selection (Leaflet)
- Public order tracking by order ID or phone number
- Admin dashboard for menu CRUD, order management, and image uploads
- Account deletion with 5-day grace period and restore endpoint
- Responsive design for desktop and mobile
- Optional PostgreSQL for order storage (falls back to JSON)

---

## Limitations

| Limitation | Details |
|------------|---------|
| **JSON file storage** | Default storage is file-based; writes are queued but not fully atomic across reads. Not suitable for concurrent multi-user production traffic |
| **No real-time updates** | Order status requires manual refresh; no WebSocket, SSE, or polling mechanism |
| **No notifications** | No email, SMS, or push notifications for order confirmations or status changes |
| **Basic search** | Menu filtered by category only; no full-text or keyword search |
| **No reviews/ratings** | Users cannot rate or review menu items |
| **Accessibility** | No ARIA labels, keyboard navigation optimization, or screen reader support |
| **CSS monolith** | All styles in a single ~6100-line `App.css` — no CSS modules, CSS-in-JS, or component scoping |
| **No tests** | No unit, integration, or end-to-end tests |
| **No rate limiting** | API endpoints are unthrottled |
| **No password recovery** | No "forgot password" flow |
| **No localization** | English only; no i18n support |
