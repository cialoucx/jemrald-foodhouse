# Jemrald Foodhouse — Ordering Platform

![React](https://img.shields.io/badge/react-19.2-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vue](https://img.shields.io/badge/vue-3.5-%234FC08D.svg?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/vite-6.0-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.99-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-18+-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**Jemrald Foodhouse** is a modern, full-stack web application designed for a seamless Japanese-inspired food ordering experience. Built with React 19, Supabase, and Node.js, the platform offers an intuitive ordering interface, GrabFood-style address autocomplete with map selection, real-time order status tracking, automated inventory management, and a custom Facebook Messenger to Discord bridge for kitchen operations.

---

## 🌟 Key Features

- 🏮 **Japanese Brand & Design System**: Custom red Torii Gate brand logo and Japanese-inspired visual elements styled with responsive Vanilla CSS and Framer Motion micro-animations.
- 📍 **GrabFood-Style Address Autocomplete & Maps**:
  - Live address search autocomplete powered by OpenStreetMap / Nominatim geocoding, restricted to the Philippines.
  - Interactive Leaflet map pin placement and GPS location detection.
  - Fallback location handling and troubleshooting alerts tailored for Facebook Messenger in-app browsers.
- 🍱 **Dynamic Menu & Ordering Interface**:
  - Categorized menu catalog (e.g., *Sushi Solo*, *Rice Meal*, *Combos*) with category filters and instant live search.
  - Interactive modals for menu item details, customized ingredient options, and cart drawer management.
- ⚡ **Real-Time Order Tracking**:
  - Customer order status tracking with live Supabase subscriptions through stages: *Pending*, *Preparing*, *On the Way*, and *Delivered*.
  - Dual view support for main site users (`OrderTracker`) and Facebook Messenger webview (`FBOrderTracker`).
- 💳 **Secure Payment Processing**:
  - Options for **Cash on Delivery (COD)** and **GCash** (Account: *Jemmalyn A.*).
  - Built-in validation for 13-digit GCash reference numbers and secure receipt image upload via Supabase Storage.
- 📦 **Automated Inventory & Ingredient Management**:
  - Dynamic stock verification and automatic ingredient deduction upon checkout.
  - Interactive ingredient catalog modal in the admin dashboard to monitor stock levels and prevent overselling.
- 🤖 **Facebook Messenger & Discord Bridge**:
  - Dedicated webview routes (`FBOrderView`, `FBLandingView`) optimized for mobile Messenger users.
  - Express.js backend service (`fb-discord-bridge`) that forwards new orders and payment receipt attachments instantly to staff Discord channels.
- 🛠️ **Administrative Dashboard**:
  - Centralized order fulfillment board, real-time status management, catalog CRUD operations, and inventory metrics.
- ⚡ **Hybrid Framework Architecture**:
  - Integrates Vue 3 components seamlessly within React 19 using a lightweight custom React-Vue wrapper (`VueWrapper`).

---

## 🏗️ Project Architecture

```text
jemrald-foodhouse/
├── src/
│   ├── components/       # Reusable React & Vue components
│   │   ├── AuthModal.jsx            # User authentication modal
│   │   ├── CartDrawer.jsx           # Slide-out cart drawer with location picker
│   │   ├── Chatbot.jsx              # Customer assistant chatbot widget
│   │   ├── FBLandingView.jsx        # Landing hero for FB Messenger webview
│   │   ├── FBMenuCard.jsx           # Card component optimized for FB webview
│   │   ├── FBOrderTracker.jsx       # Order status tracker for Messenger users
│   │   ├── IngredientModal.jsx      # Inventory & ingredient stock modal
│   │   ├── MenuCard.jsx             # Standard menu item card
│   │   ├── MenuModal.jsx            # Item detail & customization modal
│   │   ├── Navbar.jsx               # Header navigation bar with cart badge
│   │   ├── NotificationPanel.jsx    # Real-time alert notifications
│   │   ├── OrderTracker.jsx         # Real-time customer order tracker
│   │   ├── SampleVueComponent.vue   # Embedded Vue 3 component example
│   │   └── VueWrapper.jsx           # React wrapper for Vue components
│   ├── context/          # React state providers (Auth, Cart, Orders)
│   ├── lib/              # Supabase client setup, geocoding helpers, API utils
│   ├── pages/            # Page layouts
│   │   ├── AdminView.jsx            # Full admin management portal
│   │   ├── CustomerView.jsx         # Main customer ordering view
│   │   ├── FBOrderView.jsx          # Mobile FB Messenger optimized view
│   │   ├── LandingPage.jsx          # Marketing landing page
│   │   └── ProfilePage.jsx          # Customer profile & past orders
│   ├── App.jsx           # Application routing and setup
│   ├── main.jsx          # React app entry point
│   └── index.css         # Global design system & theme styling
├── fb-discord-bridge/    # Express backend service for Discord webhook relay
├── scripts/              # Database seeding and migration helper scripts
├── supabase/             # Database schema, migrations, and storage policies
├── Dockerfile            # Docker build setup for frontend
├── docker-compose.yml    # Docker Compose config for full multi-service deployment
└── nginx.conf            # Nginx web server configuration for production builds
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project (PostgreSQL database & Storage bucket)
- A configured Discord Bot Token and Channel ID (for order notifications)

---

### Installation & Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jemrald-foodhouse.git
   cd jemrald-foodhouse
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend bridge dependencies**
   ```bash
   cd fb-discord-bridge
   npm install
   cd ..
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the root directory for the React frontend:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Create a `.env` file inside `fb-discord-bridge/` for the integration backend:
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_CHANNEL_ID=your_discord_channel_id
   SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_KEY=your_supabase_service_role_key
   PORT=3000
   ```

---

### Running Locally

1. **Start the Frontend Server**
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173`.

2. **Start the Discord Bridge Backend**
   ```bash
   cd fb-discord-bridge
   npm run dev
   ```
   The backend API service will listen on `http://localhost:3000`.

---

### 🐳 Running with Docker

You can launch both the frontend and backend bridge services using Docker Compose:

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Populate `.env` with your Supabase and Discord credentials.

2. **Build and start services**
   ```bash
   docker compose up --build
   ```
   - Frontend: `http://localhost` (Port 80)
   - Integration Backend: `http://localhost:3000`

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend Core** | React 19, Vue 3 (Hybrid component support), Vite 6, React Router v7 |
| **Styling & UI** | Vanilla CSS (Japanese theme design tokens), Framer Motion, Lucide Icons |
| **Maps & Location** | Leaflet, React-Leaflet, OpenStreetMap / Nominatim Geocoding API |
| **Forms & Validation** | React Hook Form, Zod |
| **Backend & Database** | Supabase (Postgres Database, Realtime subscriptions, Storage, Auth) |
| **Integration Backend**| Node.js, Express.js, Discord.js API |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
