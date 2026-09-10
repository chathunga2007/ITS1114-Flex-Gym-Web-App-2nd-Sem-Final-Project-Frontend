# 🏋️‍♂️ Flex Gym Management System - Frontend

> **ITS1114 - 2nd Semester Final Project**  
> A modern, responsive, and role-based web-based Gym Management System frontend interface designed to streamline gym operations, member engagement, trainer workflows, and store management.

---

## 📌 Project Overview

The **Flex Gym Management System Frontend** provides a complete user interface for modern fitness centers. Built with clean HTML5, custom modern CSS, and JavaScript (jQuery), it connects seamlessly to a Spring Boot REST API backend (`http://localhost:8080/api`) with JWT-based authentication and role-based access control.

---

## ✨ Key Features

### 🔐 1. Authentication & Role-Based Access Control
- **JWT Authentication:** Secure token storage with automatic session validation.
- **Smart Role Routing:** Automatically redirects users to their designated dashboard based on role:
  - `ROLE_ADMIN` ➔ **Admin Dashboard**
  - `ROLE_TRAINER` ➔ **Trainer Dashboard**
  - `ROLE_RECEPTIONIST` ➔ **Receptionist Dashboard**
  - `ROLE_MEMBER` ➔ **Member Portal**

### 📊 2. Dedicated Role Dashboards
- **Admin Dashboard (`admin-dashboard.html`):**
  - Comprehensive analytics overview (members, trainers, revenue, attendance).
  - Full CRUD operations for Members, Trainers, Receptionists, and Packages.
  - Inventory management with stock alerts for products.
  - Locker allocations, attendance logs, and payment reports.
- **Trainer Dashboard (`trainer-dashboard.html`):**
  - View and manage assigned trainees/members.
  - Assign and customize workout plans & routines.
  - Track member fitness progress and metrics.
- **Receptionist Dashboard (`receptionist-dashboard.html`):**
  - Quick member check-in and attendance recording.
  - Walk-in member registration & package enrollment.
  - Locker assignment and payment processing.
- **Member Portal (`member-dashboard.html`):**
  - Personal profile & fitness progress tracking (BMI, Weight targets).
  - Active membership status and renewal alerts.
  - Assigned workout routines and trainer contact details.
  - Locker status and store purchase history.

### 🌐 3. Public Web Pages & E-Commerce
- **Landing Page (`index.html`):** Hero section, membership tiers, feature highlights, and testimonials.
- **About Us (`about.html`):** Facility information, gym mission, and core values.
- **Membership Plans (`membership.html`):** Interactive package comparison and online registration.
- **Workout Programs (`workout-plans.html`):** Curated fitness guides and training programs.
- **Trainer Directory (`trainer.html`):** Trainer bios, specializations, and qualifications.
- **Gym Store & Cart (`shop.html`, `cart.html`):** Product catalog (supplements, gear, accessories), shopping cart, and checkout flow.
- **AI Chatbot (`chatbot.js`):** Interactive virtual assistant for gym FAQs and support.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 (Semantic elements) |
| **Styling** | Custom Vanilla CSS3 (Dark theme, Glassmorphism, Responsive Grid/Flexbox) |
| **Interactivity** | JavaScript (ES6+), jQuery 3.7.1 |
| **UI Alerts** | SweetAlert2 |
| **Typography** | Google Fonts (Inter) |
| **API Communication** | RESTful AJAX requests with JWT Bearer Token |
| **Backend Compatibility** | Spring Boot REST API (`http://localhost:8080/api`) |

---

## 📁 Directory Structure

```plaintext
Flex-Gym-Management-System-Frontend/
├── CSS/
│   └── style.css                 # Main stylesheet with unified design system
├── JS/
│   ├── admin-dashboard.js        # Admin portal logic & API calls
│   ├── alerts.js                 # SweetAlert2 toast & modal helpers
│   ├── api.js                    # Global AJAX wrapper & backend API config
│   ├── attendance.js             # Attendance tracking operations
│   ├── auth.js                   # Authentication & role redirection
│   ├── cart.js                   # Cart management & localStorage sync
│   ├── chatbot.js                # Virtual assistant widget
│   ├── index.js                  # Landing page interactions
│   ├── inventory-alerts.js       # Low-stock notification utilities
│   ├── locker.js                 # Locker booking & status
│   ├── login.js                  # Login form handler
│   ├── member-dashboard.js       # Member portal logic
│   ├── member.js                 # Member service helpers
│   ├── membership.js             # Membership package logic
│   ├── order.js                  # Order processing
│   ├── package.js                # Package management
│   ├── payment.js                # Payment processing
│   ├── product.js                # Shop products loading
│   ├── receptionist-dashboard.js # Front-desk portal logic
│   ├── signup.js                 # Registration handler
│   ├── trainer-dashboard.js      # Trainer portal logic
│   ├── trainer.js                # Trainer profile helpers
│   ├── user.js                   # User profile management
│   └── workout.js                # Workout plans handler
├── about.html                    # About page
├── admin-dashboard.html          # Admin management portal
├── cart.html                     # Shopping cart & checkout
├── index.html                    # Main landing page
├── login.html                    # Login page
├── member-dashboard.html         # Member personal portal
├── membership.html               # Membership packages page
├── receptionist-dashboard.html   # Receptionist desk portal
├── shop.html                     # Fitness store
├── signup.html                   # Member registration page
├── trainer-dashboard.html        # Trainer management portal
├── trainer.html                  # Trainers catalog
├── workout-plans.html            # Workout plans showcase
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- A modern web browser (Google Chrome, Microsoft Edge, Firefox, etc.).
- VS Code (with the **Live Server** extension recommended) or any local HTTP server.
- Flex Gym Backend Server (Spring Boot) running on `http://localhost:8080`.

### 2. Configuration
If your backend API is hosted on a different URL or port, open [JS/api.js](JS/api.js) and update the `API_BASE_URL`:

```javascript
const API_BASE_URL = "http://localhost:8080/api";
```

### 3. Running the Project
1. Clone or download the repository:
   ```bash
   git clone https://github.com/chathunga2007/ITS1114-Flex-Gym-Management-System-2nd-Sem-Final-Project-Frontend.git
   ```
2. Open the project folder in **VS Code**.
3. Right-click on `index.html` and select **"Open with Live Server"** (or open `index.html` directly in your browser).
4. Navigate to `login.html` to access the dashboards with corresponding user credentials.

---

## 👥 Default Roles & Portals

| Role | Default Target Dashboard | Primary Responsibilities |
|---|---|---|
| **Admin** | `admin-dashboard.html` | Overall gym control, staff/member management, packages, inventory, financial reports |
| **Trainer** | `trainer-dashboard.html` | Client training management, workout plan assignments, member progress tracking |
| **Receptionist** | `receptionist-dashboard.html` | Daily member check-ins, walk-in signups, locker allocations, billing |
| **Member** | `member-dashboard.html` | Viewing assigned workouts, membership validity, store orders, locker access |

---

## 📄 License & Credits

Developed as part of the **ITS1114 - 2nd Semester Final Project**.  
All rights reserved © 2026 **Flex Gym**.
