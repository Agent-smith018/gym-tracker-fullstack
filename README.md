# 🏋️ Gym Tracker Fullstack App (React + Node.js + MongoDB + Socket.io)

A fullstack Gym Tracker web application built using **React (Vite)** for the frontend and **Node.js + Express + MongoDB** for the backend.  
This project allows users to register/login, create workouts, add exercise logs, and receive **real-time updates** using **Socket.io**.
It features a modern, premium user interface designed with **Tailwind CSS**, utilizing glassmorphism, micro-animations, and dynamic visual components.

---

## 🚀 Live Demo

Frontend (Render):  
👉 **https://gym-tracker-fullstack-2.onrender.com**

Backend API (Render):  
👉 **https://gym-tracker-fullstack.onrender.com**

---

## 📌 Features

### ✅ Authentication
- User Signup
- User Login
- JWT Token authentication
- Protected API routes

### ✅ UI & User Experience
- **Modern Design:** High-end aesthetic using Tailwind CSS
- **Interactive Dashboard:** Visual analytics with Recharts
- **Calendar Integration:** Track workout dates with React Calendar
- **Responsive:** Fully responsive layouts for desktop and mobile devices

### ✅ Workouts Management (CRUD)
- Create Workout
- View All Workouts
- Delete Workout
- Workouts linked to the logged-in user only

### ✅ Exercise Logs Management (CRUD)
- Add exercise logs to workouts
- View logs per workout
- Delete exercise logs
- Logs linked to the logged-in user only

### ✅ Real-Time Features (Socket.io)
- Real-time workout updates (`workout:created`)
- Real-time exercise log updates (`log:added`)
- Updates reflect instantly across multiple open tabs

### ✅ Deployment
- Backend deployed on **Render Web Service**
- Frontend deployed on **Render Static Site**
- MongoDB hosted on **MongoDB Atlas**
- Root-level scripts configured for smooth Render deployment

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS (v4)
- React Router DOM
- Axios
- Socket.io Client
- Recharts (Data Visualization)
- React Calendar
- React Icons

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs (password hashing)
- Socket.io

### Tools
- Postman (API Testing)
- Git & GitHub (Version control)
- Render (Deployment)

---

## 📂 Project Structure

```text
gym-tracker-fullstack/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── .env.example
│
├── package.json (Root deployment config)
└── README.md
```

---

## ⚙️ Installation & Setup (Local Development)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Agent-smith018/gym-tracker-fullstack.git
cd gym-tracker-fullstack
```

### 🔧 Backend Setup

**2️⃣ Install backend dependencies**
```bash
cd backend
npm install
```

**3️⃣ Create .env file**
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your MongoDB URI and JWT secret to `.env`:
```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5001
```

**4️⃣ Start backend server**
```bash
npm run dev
```
Server will start on `http://localhost:5001`

### 🔧 Frontend Setup

**2️⃣ Install frontend dependencies**
```bash
cd frontend
npm install
```
    
**3️⃣ Create .env file**
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your API URL to `.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

**4️⃣ Start frontend server**
```bash
npm run dev
```
Frontend will start on `http://localhost:5173`