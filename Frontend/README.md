# 🎓 Academic Project Monitoring System with Milestone and Deadline Reminder Management System 

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)
![React](https://img.shields.io/badge/Frontend-React.js-61DAFB.svg)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933.svg)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg)
![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-black.svg)

[cite_start]A centralized web-based platform developed to improve the management, monitoring, and collaboration of academic projects in educational institutions[cite: 1646]. [cite_start]This system replaces traditional manual tracking with a digital workspace, Phase-wise Milestone tracking, real-time notifications, and automated deadline reminders[cite: 1647, 1650].

---

## 🚀 Key Features

### [cite_start]👥 Role-Based Access Control (RBAC) [cite: 2264]
* [cite_start]**Admin:** Manage students/supervisors, approve proposals, monitor global analytics, and track delayed projects[cite: 1761, 1762, 1763, 1764, 1765, 1766, 1767, 1768, 1769].
* [cite_start]**Supervisor/Teacher:** Review student submissions, evaluate milestones, provide feedback, and manage assigned project groups[cite: 1770, 1771, 1772, 1773, 1774, 1775].
* [cite_start]**Student:** Submit project proposals, upload phase-wise documents, track progress, and communicate with guides[cite: 1776, 1777, 1778, 1779, 1780, 1781].

### 📌 Core Modules
* [cite_start]**Phase-Wise Milestone Tracking:** Projects are divided into structured phases (e.g., Synopsis, UI Design, Backend, Final Report)[cite: 1856]. [cite_start]Status updates dynamically (Pending -> In Review -> Approved)[cite: 2446].
* [cite_start]**Analytics & Visualization Dashboard:** Graphical statistics (Doughnut & Area charts using Recharts) for project health, delayed projects, and completion rates[cite: 1743, 1744, 2522].
* [cite_start]**Automated Deadline Reminders:** Background cron jobs automatically monitor deadlines and send email alerts (Nodemailer) and dashboard warnings before submission dates[cite: 1859, 2507].
* [cite_start]**Real-Time Notifications:** Instant alerts using Socket.io for milestone approvals, feedback, and assignment updates without page reloads[cite: 3057, 3058, 3059, 3060].
* [cite_start]**Secure File Uploads:** Upload and manage academic reports, presentations, and code files securely[cite: 1751, 1752].

---

## [cite_start]🛠️ Technology Stack [cite: 2121]

**Frontend:**
* [cite_start]React.js (Vite) [cite: 2123, 2124]
* [cite_start]Tailwind CSS (for modern, minimal, SaaS-like UI) [cite: 2239]
* Recharts (Data Visualization)
* React Router DOM
* Axios

**Backend:**
* [cite_start]Node.js & Express.js [cite: 2125, 2126, 2127, 2128]
* [cite_start]Socket.IO (WebSockets for real-time features) [cite: 2131, 2132]
* Node-Cron (Task scheduling)
* [cite_start]Nodemailer (Email dispatching) [cite: 2137, 2138]
* [cite_start]JSON Web Tokens (JWT) & bcrypt (Authentication & Security) [cite: 2133, 2134]

**Database & Storage:**
* [cite_start]MongoDB & Mongoose ODM [cite: 2129, 2130]
* [cite_start]Multer / Cloudinary (File Handling) [cite: 2135, 2136]

---

## 📂 Folder Structure

[cite_start]The application is cleanly divided into a `frontend` and `backend` directory following MVC and Service-Oriented Architecture[cite: 2166].

```text
📦 Project Root
 ┣ 📂 backend [cite: 2168]
 ┃ ┣ 📂 config       # Env variables & DB connection [cite: 2185]
 ┃ ┣ 📂 controllers  # Request handlers & logic [cite: 2186]
 ┃ ┣ 📂 models       # Mongoose schemas (User, Project, Milestone, etc.) [cite: 2187]
 ┃ ┣ 📂 routes       # Express API routes [cite: 2188]
 ┃ ┣ 📂 middlewares  # JWT verification, RBAC [cite: 2189]
 ┃ ┣ 📂 services     # Schedulers, Email dispatchers [cite: 2190]
 ┃ ┗ 📜 server.js    # Entry point [cite: 2192]
 ┗ 📂 frontend [cite: 2194]
   ┣ 📂 public       # Static assets [cite: 2197]
   ┣ 📂 src [cite: 2198]
   ┃ ┣ 📂 components # Reusable UI (Cards, Modals) [cite: 2200]
   ┃ ┣ 📂 pages      # Role-based views (Admin, Supervisor, Student) [cite: 2201]
   ┃ ┣ 📂 context    # Global state management [cite: 2202]
   ┃ ┗ 📜 App.jsx    # Application routing [cite: 2215]