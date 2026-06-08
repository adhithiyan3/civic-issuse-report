# Smart Civic Reporting

🔗 **Live Link:** [https://civic-issuse-report-gamma.vercel.app](https://civic-issuse-report-gamma.vercel.app)

An AI-powered municipal complaint management platform built on the MERN stack. It allows citizens to report civic issues (roads, water, electricity, sanitation) with photos and map coordinates, automatically prioritizes them using an offline CNN+RNN engine, and routes them to the nearest municipal office.

---

## 🚀 Key Features

* **Citizen Reports:** Submit complaints with category, description, photos, and precise leaflet-map locations.
* **Community Voting:** Citizens can upvote/downvote complaints to surface urgent local issues.
* **Offline AI Engine:** Local CNN (ResNet-50) and RNN (BiLSTM) fusion pipeline that automatically assesses priority (High, Medium, Low).
* **Intelligent Routing:** Spatial routing routes complaints to the nearest ward office automatically.
* **Admin Dashboard:** Manage complaints, assign employees, verify resolutions, and view analytical reports (using Recharts).
* **Employee Task Board:** Field workers update status, upload resolution proof photos, and add remarks.
* **Bilingual UI:** Support for English and Tamil (தமிழ்) translation toggles.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite, Tailwind CSS, Leaflet Maps, Recharts, i18next
* **Backend:** Node.js, Express, Mongoose (MongoDB Atlas), JWT, Multer

---

## 📁 Project Directory Structure

```text
civic-issuse-report/
├── client/          # React frontend code (Vite)
├── server/          # Express backend code
└── README.md        # Project documentation
```

---

## ⚙️ Setup & Installation

### 1. Server Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
OTP_EXPIRY=5
```

Seed the database with initial users and office locations:
```bash
node seed.js
```

Start the backend:
```bash
npm run dev
```

### 2. Client Setup
```bash
cd ../client
npm install
npm run dev
```

---

## 🔑 Default Test Accounts
After running `node seed.js`, you can log in with:

| Username | Password | Role | Department / Description |
| :--- | :--- | :--- | :--- |
| **superadmin** | `password123` | Super Admin | Manage offices and users |
| **admin** | `password123` | Admin | Assign tasks & view charts |
| **ravi** | `password123` | Employee | Assigned to **Roads** department |
| **siva** | `password123` | Employee | Assigned to **Water** department |
| **citizen** | `password123` | Citizen | Report issues and upvote |
