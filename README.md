# 🌾 AgriSmart - Advanced Agricultural Platform

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application that connects farmers, buyers, and agricultural experts. Features include a smart marketplace, AI-based crop recommendations, real-time chat, expert consultation, disease detection, weather integration, and comprehensive analytics dashboards.

---

## 🚀 Features

### Core Features (All Implemented)
1. **🔐 Authentication System** - JWT-based login/signup with OTP email verification
2. **🌾 Farmer Dashboard** - Crop management, product upload, sales analytics
3. **🛒 Agri Marketplace** - Product listing, search, filter, cart & checkout
4. **🤖 AI Crop Recommendation** - Location & soil-based crop suggestions
5. **🌦️ Weather Integration** - Real-time weather data via OpenWeatherMap API
6. **💬 Real-time Chat** - Socket.io powered messaging between users
7. **🧪 Disease Detection** - Plant disease identification via image upload
8. **📊 Analytics Dashboard** - Recharts-powered sales & crop trend visualizations
9. **🧑‍🌾 Expert Consultation** - Q&A forum for farmers and experts
10. **📍 Location Services** - Ready for map integration (Leaflet configured)
11. **🔔 Notifications** - Real-time alerts via Socket.io
12. **📦 Admin Panel** - User/product/order management with reports

### Bonus Features
- 🎨 Modern responsive UI with Tailwind CSS
- 📱 Mobile-friendly design
- 🔄 Real-time updates via WebSockets
- 📧 Email notifications via Nodemailer
- ☁️ Cloud image storage via Cloudinary

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **Vite** | Build Tool |
| **React Router DOM** | Client-side routing |
| **Tailwind CSS** | Utility-first CSS framework |
| **Axios** | HTTP client |
| **Recharts** | Data visualization |
| **Leaflet** | Open-source maps |
| **Socket.io-client** | Real-time communication |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **JWT** | Authentication |
| **bcryptjs** | Password hashing |
| **Socket.io** | Real-time bidirectional events |
| **Nodemailer** | Email service |
| **Cloudinary** | Image upload & storage |
| **Multer** | File upload middleware |

### Additional Services
| Service | Why Used |
|---------|----------|
| **OpenWeatherMap API** | Real-time weather & forecasts |
| **Cloudinary CDN** | Image optimization & delivery |
| **Leaflet.js** | Free alternative to Google Maps |

---

## 📁 Project Structure

```
AgriSmart/
├── BackEnd/
│   ├── config/         # Database configuration
│   ├── controllers/    # Request handlers (8 controllers)
│   ├── middleware/     # Auth, role, error middleware
│   ├── models/         # Mongoose schemas (8 models)
│   ├── routes/         # API route definitions (8 routes)
│   ├── socket/         # Socket.io handlers
│   ├── utils/          # Email, Cloudinary, Weather utilities
│   ├── .env            # Environment variables
│   ├── server.js       # Express server entry
│   └── package.json
│
├── FrontEnd/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── auth/           # Login, Register, OTP
│   │   │   ├── common/         # Navbar, Footer, Loader
│   │   │   ├── dashboard/      # Role-based dashboards
│   │   │   ├── marketplace/    # Cart, Checkout, ProductDetail
│   │   │   └── analytics/      # Recharts components
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── hooks/          # useSocket hook
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Main routing
│   │   └── main.jsx        # Entry point
│   ├── .env
│   ├── tailwind.config.js
│   └── package.json
│
├── PROJECT_PLAN.md
├── TODO.md
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Backend Setup

```bash
cd BackEnd
npm install
```

Create `.env` file (already provided):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/agriSmart
JWT_SECRET=your_super_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
WEATHER_API_KEY=your_openweather_api_key
```

Start the server:
```bash
npm run dev    # Development with nodemon
# or
npm start      # Production
```

### 2. Frontend Setup

```bash
cd FrontEnd
npm install
```

Create `.env` file (already provided):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔑 API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/verify-otp` | OTP verification |
| `POST /api/auth/login` | User login |
| `GET /api/auth/me` | Get current user |
| `GET /api/products` | List products (public) |
| `POST /api/products` | Create product (farmer) |
| `POST /api/orders` | Place order |
| `GET /api/orders/my-orders` | Get buyer orders |
| `GET /api/crops/recommendations` | AI crop suggestions |
| `GET /api/chat` | Get user's chats |
| `GET /api/expert/consultations` | Get consultations |
| `GET /api/admin/stats` | Admin dashboard stats |

---

## 🎭 User Roles

| Role | Permissions |
|------|-------------|
| **Farmer** | List products, manage crops, view sales analytics |
| **Buyer** | Browse marketplace, purchase products, track orders |
| **Expert** | Answer consultations, chat with farmers |
| **Admin** | Manage users, products, orders, view reports |

---

## 📦 Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables in hosting dashboard
2. Connect MongoDB Atlas
3. Deploy with `npm start`

### Frontend (Vercel/Netlify)
1. Set `VITE_API_URL` to production backend URL
2. Build with `npm run build`
3. Deploy `dist/` folder

---

## 🔮 Future Enhancements

- [ ] Voice assistant for farmers
- [ ] Multi-language support
- [ ] PWA (Progressive Web App) offline mode
- [ ] Blockchain-based supply tracking
- [ ] Stripe/Razorpay payment integration
- [ ] Firebase push notifications
- [ ] Advanced ML disease detection model

---

## 📝 License

MIT License - feel free to use for personal or commercial projects.

---

Built with ❤️ for the agricultural community.

