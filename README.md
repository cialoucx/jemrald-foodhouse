# Jemrald Foodhouse

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)

Jemrald Foodhouse is a full-stack web application designed to facilitate an efficient and reliable food ordering system. Developed with React and Supabase, the platform provides a responsive user interface, real-time order tracking, comprehensive inventory management, and an automated integration bridging Facebook Messenger and Discord to streamline internal operations.

## Key Features

- **Dynamic Ordering Interface**: An interactive menu featuring category filtering, live search functionality, and a responsive design enhanced by Framer Motion.
- **Real-Time Order Tracking**: Integrates Supabase real-time subscriptions to allow customers to track their order status through distinct stages (Pending, Preparing, On the Way, Delivered).
- **Secure Payment Processing**: Supports Cash on Delivery and GCash, incorporating strict validation for 13-digit reference numbers and secure receipt image uploads via Supabase Storage.
- **Automated Inventory Management**: Implements dynamic stock verification and automated ingredient deduction upon checkout to ensure accurate inventory levels and prevent overselling.
- **Order Scheduling**: Provides functionality for customers to place immediate orders or schedule deliveries for specific future dates and times.
- **System Integrations (Facebook & Discord)**: Includes a custom Node.js backend that automatically forwards incoming order data and receipt attachments to a designated Discord channel, enabling efficient staff coordination.
- **Administrative Dashboard**: Features role-based access control for administrators to manage menu catalogs, monitor inventory metrics, and process live orders.

## Project Architecture

```text
jemrald-foodhouse/
├── src/
│   ├── components/       # Reusable React components (MenuCard, Modals)
│   ├── context/          # React context providers for application state
│   ├── lib/              # Utility functions and Supabase client configuration
│   ├── pages/            # Primary application views (FBOrderView, Dashboard)
│   └── App.jsx           # Main application routing and entry point
├── fb-discord-bridge/    # Node.js backend service for third-party integrations
├── scripts/              # Utility scripts for database seeding and management
├── public/               # Static assets
└── supabase/             # Database schema and migration files
```

## Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A configured [Supabase](https://supabase.com/) project
- A configured Discord Bot Token for backend integration

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jemrald-foodhouse.git
   cd jemrald-foodhouse
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd fb-discord-bridge
   npm install
   cd ..
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory for the frontend application:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   Create a `.env` file in the `fb-discord-bridge` directory for the backend service:
   ```env
   DISCORD_BOT_TOKEN=your_discord_token
   DISCORD_CHANNEL_ID=your_channel_id
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   ```

### Running the Application

1. **Start the Frontend Development Server**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

2. **Start the Integration Backend**
   ```bash
   cd fb-discord-bridge
   npm run dev
   ```

### Running with Docker

You can build and run both the React/Vite frontend and the Node/Express backend services together inside Docker containers using Docker Compose.

1. **Setup environment variables**
   Copy the `.env.example` file to `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```
   Fill in the required Supabase and Discord environment variables in the newly created `.env` file.

2. **Build and start both services**
   ```bash
   docker compose up --build
   ```
   Once started, the frontend will be served at `http://localhost` (port 80) and the backend API will run on `http://localhost:3000`.

3. **Running services in isolation**
   For debugging or testing a single service, you can run it in isolation:
   - **Just the Backend API**:
     ```bash
     docker compose up --build backend
     ```
   - **Just the Frontend**:
     ```bash
     docker compose up --build frontend
     ```

## Technology Stack

- **Frontend**: React 19, Vite, React Router
- **Styling & UI**: Vanilla CSS (CSS Variables), Framer Motion, Lucide React
- **Backend & Database**: Supabase (PostgreSQL, Realtime APIs, Storage, Authentication)
- **Services & Integration**: Express.js, Discord.js, Axios, Node.js

## Future Roadmap

- **Payment Gateway Integration**: Automate transaction processing via APIs such as PayMongo or Stripe.
- **Data Analytics Dashboard**: Develop data visualization tools to track sales trends and inventory turnover rates.
- **Logistics Integration**: Implement automated delivery dispatching through third-party logistics providers (e.g., Lalamove, Grab).

---
*This repository serves to demonstrate competencies in full-stack web development, scalable architecture design, and system integration within a production-like environment.*
