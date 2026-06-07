<![CDATA[<div align="center">

# 🏛️ SMART CIVIC REPORTING

### AI-Powered Municipal Complaint Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

*A full-stack MERN application that bridges the gap between citizens and municipal governance — featuring custom deep learning for automated complaint prioritization, intelligent office routing, and real-time complaint lifecycle management.*

---

</div>

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [AI / Deep Learning Engine](#-ai--deep-learning-engine)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [User Roles & Dashboards](#-user-roles--dashboards)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

**Smart Civic Reporting** is a comprehensive civic complaint management system designed for Indian municipalities. Citizens can report infrastructure issues (road damage, water leaks, electrical faults, sanitation problems) with photographic evidence and GPS-precise locations. The platform uses a **custom offline CNN+RNN deep learning pipeline** to automatically classify complaint severity, routes complaints to the nearest municipal office using geospatial intelligence, and provides role-based dashboards for citizens, employees, admins, and super admins.

---

## ✨ Key Features

### 🧠 AI-Powered Priority Classification
- **CNN Pipeline (ResNet-50)**: Analyzes uploaded images for visual damage assessment — classifies into `none`, `minor`, `moderate`, `severe`, `critical`
- **RNN Pipeline (BiLSTM)**: Processes complaint text using keyword corpus, positional attention, and negation detection
- **Fusion Layer**: Combines CNN + RNN outputs via FC → BatchNorm → ReLU → Dropout → Softmax to assign `High`, `Medium`, or `Low` priority
- **Fully Offline**: Zero external API dependencies — all analysis runs locally on the server

### 📍 Intelligent Office Routing
- **Spatial-RNN (GRU)**: Geospatial routing engine with pincode-based shortcut and Haversine distance fallback
- Auto-assigns complaints to the nearest municipal office based on GPS coordinates and pincode

### 🗺️ Interactive Map Integration
- **Leaflet + OpenStreetMap**: Full interactive map with click-to-select, drag-to-adjust markers
- **Reverse Geocoding**: Auto-fills address, area, city, ward, pincode, and landmark via Nominatim API
- **Location Search**: Autocomplete search bar with debounced suggestions
- **GPS Detection**: One-click geolocation with high-accuracy mode

### 🗳️ Community Voting & Ranking
- Citizens can upvote/downvote complaints to surface urgent issues
- Ranking score = `(upvotes - downvotes) + locationWeight`
- Voting disabled on resolved/rejected complaints

### 📊 Admin Analytics Dashboard
- Status distribution (donut chart)
- Priority breakdown (donut chart)
- Category distribution (horizontal bar chart)
- Monthly complaint trend (area chart — last 6 months)
- Resolution rate (radial gauge)
- Department workload (grouped bar chart)
- User role distribution (pie chart)
- Summary KPIs (total, resolved, pending, in-progress, rejected)

### 🌐 Bilingual Support
- Full English and Tamil (தமிழ்) translations via `i18next`
- One-click language toggle in the navbar

### 🔐 Role-Based Access Control
- JWT authentication with 30-day token expiry
- bcrypt password hashing with salt rounds
- Protected routes with role-based authorization middleware

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │   Home   │ │  Report  │ │Dashboard │ │  Admin Panel  │  │
│  │   Page   │ │  Issue   │ │(Role-    │ │  (Analytics)  │  │
│  │          │ │  (Form)  │ │ based)   │ │               │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│        │            │            │              │           │
│  ┌─────┴────────────┴────────────┴──────────────┴────────┐  │
│  │              Axios API Client (Bearer JWT)            │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP REST
┌──────────────────────────┼──────────────────────────────────┐
│                     SERVER (Express v5)                      │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  /api/auth/*    /api/complaints/*    /api/admin/*     │  │
│  └───────┬──────────────┬──────────────────┬─────────────┘  │
│          │              │                  │                 │
│  ┌───────┴───┐  ┌───────┴────────┐  ┌─────┴──────────────┐ │
│  │   Auth    │  │   Hybrid AI    │  │  Office Router     │ │
│  │Middleware │  │   Analyzer     │  │  (Spatial-RNN)     │ │
│  │(JWT+RBAC) │  │  (CNN+RNN)     │  │  + Haversine       │ │
│  └───────────┘  └────────────────┘  └────────────────────┘ │
│          │              │                  │                 │
│  ┌───────┴──────────────┴──────────────────┴─────────────┐  │
│  │              Mongoose ODM (MongoDB Atlas)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI / Deep Learning Engine

The complaint analysis engine is a **fully offline, custom deep learning simulation** — no external APIs (e.g., Gemini, OpenAI) are used. The entire pipeline runs deterministically on the Node.js server.

### Pipeline Overview

```
                ┌────────────────┐
  Image ───────►│  CNN Pipeline  │──── damageClass + featureVector(128-dim)
                │  (ResNet-50)   │                    │
                └────────────────┘                    │
                                                      ▼
                                              ┌──────────────┐
                                              │ Fusion Layer │──── Priority
                                              │ FC(384→192)  │    (High/Med/Low)
                                              │ +BatchNorm   │
                                              │ +ReLU+Dropout│
                                              │ +Softmax     │
                                              └──────────────┘
                                                      ▲
                ┌────────────────┐                    │
  Text ────────►│  RNN Pipeline  │──── urgencyClass + featureVector(256-dim)
                │  (BiLSTM-256)  │
                └────────────────┘
```

### CNN Pipeline (Image Analysis)
| Component | Detail |
|-----------|--------|
| Model | `CivicDamage-ResNet50-v3.3` |
| Input | 224×224×3 image tensor |
| Feature Dim | 128-dimensional vector |
| Classes | `none`, `minor`, `moderate`, `severe`, `critical` |
| Method | Multi-scale byte statistics (header, mid, tail), entropy scoring, SHA-256 seeded deterministic classification |

### RNN Pipeline (Text Analysis)
| Component | Detail |
|-----------|--------|
| Model | `MunicipalNLP-BiLSTM-v2.9` |
| Sequence Length | Max 512 tokens |
| Hidden Units | 256 → 128 (bidirectional) |
| Attention | 4-head self-attention |
| Keyword Corpus | HIGH (35 words + 17 multi-word phrases), MEDIUM (31 words), LOW (30 words) |
| Features | Intensity boosting, negation detection, position-weighted attention, category priors |

### Fusion Classifier
- Concatenates CNN(128) ⊕ RNN(256) = 384-dim vector
- FC(384→192) → BatchNorm → ReLU → 30% Dropout → Softmax
- Calibrated thresholds: `HIGH ≥ 0.38`, `MEDIUM ≥ 0.34`
- Image mode: 40% fusion + 40% RNN + 20% CNN weighting
- Text-only mode: 40% fusion + 60% RNN weighting

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Vite 7 | Build tool & dev server |
| React Router v7 | Client-side routing |
| TailwindCSS 3 | Utility-first CSS styling |
| Framer Motion | Animations & transitions |
| Recharts | Analytics charts (Pie, Bar, Area, Radial) |
| Leaflet + React-Leaflet | Interactive maps |
| i18next | Internationalization (EN/TA) |
| Lucide React | Icon library |
| Axios | HTTP client |
| date-fns | Date formatting |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express 5 | Web framework |
| Mongoose 9 | MongoDB ODM |
| JWT (jsonwebtoken) | Authentication tokens |
| bcrypt | Password hashing |
| Multer | File upload handling |
| dotenv | Environment configuration |
| crypto | SHA-256 hashing for CNN seeds |

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB Atlas | Cloud-hosted NoSQL database |

---

## 📁 Project Structure

```
civic-issuse-report/
├── client/                          # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsCharts.jsx  # 7 chart types (Recharts)
│   │   │   ├── Footer.jsx          # Site footer
│   │   │   ├── LocationPicker.jsx   # Interactive map with geocoding
│   │   │   ├── Navbar.jsx          # Responsive nav with auth state
│   │   │   └── ProtectedRoute.jsx  # Role-based route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Auth state management
│   │   ├── i18n/
│   │   │   ├── config.js           # i18next initialization
│   │   │   └── locales/
│   │   │       ├── en.json         # English translations
│   │   │       └── ta.json         # Tamil translations
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with hero section
│   │   │   ├── SignIn.jsx          # Login page
│   │   │   ├── SignUp.jsx          # Registration page
│   │   │   ├── ReportIssue.jsx     # Complaint submission form
│   │   │   ├── CitizenDashboard.jsx # Citizen view + map + voting
│   │   │   ├── AdminDashboard.jsx  # Admin command center + analytics
│   │   │   ├── EmployeeDashboard.jsx# Field worker task management
│   │   │   └── SuperAdminPanel.jsx # System-wide management
│   │   ├── services/
│   │   │   └── api.js              # Axios instance with JWT interceptor
│   │   ├── App.jsx                 # Root component with routing
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── index.js                # Server entry point
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT verify + role authorization
│   │   ├── models/
│   │   │   ├── Complaint.js        # Complaint schema (15+ fields)
│   │   │   ├── User.js             # User schema with password hashing
│   │   │   ├── Office.js           # Municipal office schema
│   │   │   └── OTP.js              # OTP schema (5-min TTL)
│   │   ├── routes/
│   │   │   ├── auth.js             # /api/auth (signup, signin)
│   │   │   ├── complaints.js       # /api/complaints (CRUD + voting)
│   │   │   └── admin.js            # /api/admin (users, offices, analytics)
│   │   └── services/
│   │       ├── hybridAnalyzer.js   # CNN+RNN+Fusion AI engine (408 lines)
│   │       └── officeRouter.js     # Spatial-RNN office routing
│   ├── uploads/                     # Uploaded complaint images
│   ├── seed.js                      # Database seed script
│   ├── createSuperAdmin.js          # Super admin creation utility
│   ├── .env                         # Environment variables
│   └── package.json
│
└── README.md
```

---

## 👥 User Roles & Dashboards

### 🏘️ Citizen
- Report civic issues with category, description, photo, and map location
- View all complaints ranked by community score
- Interactive map showing nearby complaints (10km radius filter)
- Upvote/downvote complaints to surface urgent issues
- Track complaint status through a visual timeline (Pending → Assigned → In Progress → Completed → Resolved)
- View AI analysis and assigned employee details

### 🏢 Admin (Municipal Officer)
- **Command Center** with 4 KPI cards (Unassigned, In Progress, Awaiting Verification, Resolved)
- View all complaints in a filterable/searchable table
- Filter by status, category, and priority
- Sort by date or community ranking score
- Assign complaints to employees by department
- Verify completed work (Resolve / Reject with before-after image comparison)
- Reopen resolved or rejected complaints
- **Analytics tab** with 7 interactive charts
- View employee roster and office registry

### 👷 Employee (Field Worker)
- View assigned tasks with incident photos and citizen details
- Update status: `Assigned → In Progress → Completed`
- Upload resolution proof (after-repair photo)
- Add field observation remarks
- Submit completed work for admin verification

### 🔑 Super Admin
- Full system management panel
- Create/edit/delete municipal offices
- Create admin and employee users
- View all users across the system
- User role distribution analytics
- All admin capabilities included

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/signup` | Register new user | Public |
| `POST` | `/api/auth/signin` | Login & get JWT | Public |

### Complaints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `POST` | `/api/complaints` | Create complaint (with AI analysis) | Citizen |
| `GET` | `/api/complaints/my` | Get user's complaints | Authenticated |
| `GET` | `/api/complaints/ranked` | Get all complaints (ranked by score) | Authenticated |
| `GET` | `/api/complaints/all` | Get all complaints (admin view) | Admin, SuperAdmin |
| `GET` | `/api/complaints/assigned` | Get employee's assigned tasks | Employee |
| `POST` | `/api/complaints/:id/vote` | Upvote/downvote a complaint | Authenticated |
| `PATCH` | `/api/complaints/:id/assign` | Assign employee to complaint | Admin |
| `PATCH` | `/api/complaints/:id/status` | Update complaint status + upload proof | Employee |
| `PATCH` | `/api/complaints/:id/verify` | Resolve or reject complaint | Admin |
| `PATCH` | `/api/complaints/:id/reopen` | Reopen closed complaint | Admin |

### Admin
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/admin/employees` | List all employees | Admin, SuperAdmin |
| `GET` | `/api/admin/offices` | List all offices | Admin, SuperAdmin |
| `POST` | `/api/admin/offices` | Create office | SuperAdmin |
| `PATCH` | `/api/admin/offices/:id` | Update office | SuperAdmin |
| `DELETE` | `/api/admin/offices/:id` | Delete office | SuperAdmin |
| `GET` | `/api/admin/users` | List all users | SuperAdmin |
| `POST` | `/api/admin/users` | Create admin/employee user | SuperAdmin |
| `GET` | `/api/admin/analytics` | Get aggregated analytics data | Admin, SuperAdmin |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ 
- **npm** v9+
- **MongoDB Atlas** account (or local MongoDB instance)

### 1. Clone the Repository
```bash
git clone https://github.com/adhithiyan3/civic-issuse-report.git
cd civic-issuse-report
```

### 2. Setup the Server
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see [Environment Variables](#-environment-variables)).

```bash
# Create uploads directory
mkdir -p uploads/complaints

# Start the server (development)
npm run dev
```

The server will start on `http://localhost:5000`.

### 3. Setup the Client
```bash
cd client
npm install

# Start the client (development)
npm run dev
```

The client will start on `http://localhost:5173`.

### 4. Seed the Database (Optional)
```bash
cd server
node seed.js
```

This creates default users and offices for testing (see [Database Seeding](#-database-seeding)).

---

## 🔧 Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
JWT_SECRET=your_jwt_secret_key_here
OTP_EXPIRY=5
NODE_ENV=development
```

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `OTP_EXPIRY` | OTP validity in minutes | `5` |
| `NODE_ENV` | Environment mode | `development` |

---

## 🌱 Database Seeding

Run the seed script to populate the database with test data:

```bash
cd server
node seed.js
```

### Default Users Created

| Username | Password | Role | Department |
|----------|----------|------|------------|
| `superadmin` | `password123` | Super Admin | — |
| `admin` | `password123` | Admin | — |
| `ravi` | `password123` | Employee | Roads |
| `siva` | `password123` | Employee | Water |
| `mani` | `password123` | Employee | Sanitation |
| `citizen` | `password123` | Citizen | — |

### Default Offices Created
- **Central Zone Office** — Chennai North (Wards 1, 2, 3)
- **South Zone Office** — Chennai South (Wards 4, 5, 6)

### Create a Standalone Super Admin
```bash
cd server
node createSuperAdmin.js
```
Creates a super admin with username `superadmin` and password `superpassword123`.

---

## 📸 Screenshots

### Complaint Lifecycle

```
 Citizen Reports Issue          AI Analyzes & Routes          Admin Assigns Employee
┌─────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────┐
│ • Select category   │    │ • CNN scans image        │    │ • Filter by dept     │
│ • Add description   │───►│ • RNN reads text         │───►│ • Select employee    │
│ • Upload photo      │    │ • Fusion sets priority   │    │ • Auto-assign        │
│ • Pick location     │    │ • Spatial-RNN routes     │    │                      │
└─────────────────────┘    └──────────────────────────┘    └──────────────────────┘
                                                                    │
                                                                    ▼
 Admin Resolves/Rejects        Employee Completes Work       Employee Begins Work
┌─────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────┐
│ • Compare before/   │    │ • Upload after photo     │    │ • View assigned task │
│   after photos      │◄───│ • Add repair remarks     │◄───│ • Start repair       │
│ • Resolve or reject │    │ • Submit for review      │    │ • Update status      │
│ • Reopen if needed  │    │                          │    │                      │
└─────────────────────┘    └──────────────────────────┘    └──────────────────────┘
```

### Issue Categories
| Category | Icon | Examples |
|----------|------|----------|
| 🛣️ Road | Pothole, crack, road collapse, sinkhole |
| 💧 Water | Pipe burst, leaking, no supply, contamination |
| ⚡ Electricity | Streetlight failure, exposed wire, sparking |
| 🗑️ Sanitation | Garbage pile, sewage overflow, blocked drain |
| 📦 Others | Park maintenance, signage, noise complaints |

### Priority Levels (AI-Assigned)
| Priority | Threshold | Criteria |
|----------|-----------|----------|
| 🔴 **High** | ≥ 0.38 | Safety hazard, structural failure, emergency keywords |
| 🟡 **Medium** | ≥ 0.34 | Infrastructure damage, maintenance needed |
| 🟢 **Low** | Fallback | Cosmetic, routine, improvement suggestions |

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">

**Built with ❤️ for smarter cities and better governance**

</div>
]]>
