<p align="center">
  <img src="assets/flex-gym-logo.png" alt="Flex Gym Brand Logo" width="140" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(204, 255, 0, 0.25);" />
</p>

<h1 align="center">🏋️‍♂️ FLEX GYM MANAGEMENT SYSTEM</h1>

<p align="center">
  <strong>Next-Generation Enterprise Fitness, Operations & E-Commerce Web Application</strong><br>
  <em>ITS1114 - 2nd Semester Final Project | Advanced Client-Side Architecture</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-v2.5.0-brightgreen.svg?style=for-the-badge&logo=git" alt="Release Version" />
  <img src="https://img.shields.io/badge/Architecture-SPA%20Multi--Portal-blue.svg?style=for-the-badge&logo=html5" alt="Architecture" />
  <img src="https://img.shields.io/badge/Security-JWT%20Bearer%20RBAC-red.svg?style=for-the-badge&logo=jsonwebtokens" alt="Security" />
  <img src="https://img.shields.io/badge/Theme-Dark%20Glassmorphism-black.svg?style=for-the-badge&logo=css3" alt="Theme" />
  <img src="https://img.shields.io/badge/Compatibility-Spring%20Boot%20REST-6DB33F.svg?style=for-the-badge&logo=springboot" alt="Spring Boot Backend" />
</p>

<p align="center">
  <a href="#-project-overview">Overview</a> •
  <a href="#-key-architectural-features">Key Features</a> •
  <a href="#-role-based-portals">Portals</a> •
  <a href="#-e-commerce--live-order-tracking">Order Tracking</a> •
  <a href="#-personal-training-pt-booking-engine">PT Booking</a> •
  <a href="#-fitness-progress--body-transformation">Transformation Tracker</a> •
  <a href="#-flexbot-ai-assistant">FlexBot AI</a> •
  <a href="#-file-structure">File Map</a> •
  <a href="#-setup--installation">Setup</a>
</p>

---

## 📌 Project Overview

The **Flex Gym Management System Frontend** is a high-performance, responsive, enterprise-grade web application engineered to modernize gym operations, member engagement, coach workflows, and fitness retail.

Developed with semantic **HTML5**, a custom neon-accented **Dark Glassmorphism Design System (CSS3)**, and **ES6+ JavaScript / jQuery**, the frontend communicates with a Spring Boot REST API backend (`http://localhost:8080/api`) secured by **JWT Bearer Token Authentication** and granular **Role-Based Access Control (RBAC)**.

---

## 🌟 Key Architectural Features

### 1. 🔐 Enterprise Security & Instant Route Guards
* **Zero-Flash Head Security Guards:** Each protected dashboard portal (`admin-dashboard.html`, `trainer-dashboard.html`, `receptionist-dashboard.html`, `member-dashboard.html`) contains an inline, pre-render JavaScript guard in `<head>` that immediately redirects unauthorized roles before the DOM tree paints.
* **JWT Claim Decoding & RBAC:** Automatic client-side extraction of user claims (`ROLE_ADMIN`, `ROLE_TRAINER`, `ROLE_RECEPTIONIST`, `ROLE_MEMBER`) via [JS/api.js](file:///d:/Flex-Gym-Management-System-Frontend/JS/api.js) ensuring strict endpoint validation and silent session renewals.
* **Granular HTTP Interceptor:** Differentiates between `401 Unauthorized` (triggers smooth session-expiry alerts and cleanup) and `403 Forbidden` (notifies unauthorized operation without kicking the user out).
* **3-Step Password Recovery Wizard (`forgot-password.html`):**
  1. **OTP Dispatch:** Member inputs registered email ➔ 6-digit cryptographic PIN delivered to inbox.
  2. **OTP Verification:** Active 60-second cooldown timer, resend throttle, and instant token generation.
  3. **Credential Reset:** Interactive password strength meter with real-time entropy calculation and confirmation validation.

---

### 2. 📦 E-Commerce, Dual Payments & Live Courier Order Tracking
* **Dynamic Fitness Storefront (`shop.html`):** Real-time product inventory filtering across Categories (Supplements, Equipment, Gear, Apparel) with live **In Stock** vs. **Out of Stock** badge detection.
* **Dual Payment Checkout (`cart.html`):**
  * **Cash on Delivery (COD):** Islandwide logistics fulfillment with payment collected on delivery.
  * **Interactive Credit/Debit Card Simulator:** Live card number formatting with automatic card network badge detection (**Visa**, **MasterCard**, **Amex**), automatic expiry date slash formatting, CVV masking, and mock 3D-Secure authentication.
* **5-Stage Visual Order Tracking Stepper:**
  $$\text{Order Placed 📝} \longrightarrow \text{Confirmed ✅} \longrightarrow \text{Packing 📦} \longrightarrow \text{Dispatched 🚚} \longrightarrow \text{Delivered 🎉}$$
  * Dynamic animated progress bar with glowing neon accents reflecting real-time package progression.
  * Displays courier partner name, system-generated tracking number (e.g., `FLX-TRK-784920`), recipient shipping address, estimated delivery timeline, and package item breakdown.
* **Instant Tracking Widgets:** Built-in tracking lookup boxes embedded in the public store sidebar (`shop.html`) and landing page (`index.html`) using `OrderService.trackByCode()`.
* **Admin Order Fulfillment Hub:** Full administrative control in `admin-dashboard.html` to update statuses (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), assign courier partners, set tracking codes, and automatically trigger dispatch notification emails to members.

---

### 3. 🏋️ Personal Training (PT) 1-on-1 Booking Engine
* **Dedicated Service Layer (`JS/booking.js`):** Unified AJAX interface connecting with `/bookings/*` backend endpoints.
* **Member Reservation Portal (`member-dashboard.html`):**
  * Book 1-on-1 coaching sessions with certified gym trainers.
  * Select session dates and custom time slots (Early Bird `06:00 AM` through Evening Peak `09:00 PM`).
  * Choose tailored training focus areas:
    * *Hypertrophy & Muscle Building*
    * *Strength & Powerlifting (Squat/Bench/Deadlift)*
    * *Fat Loss, HIIT & Conditioning*
    * *Form Correction & Technique Analysis*
    * *Mobility, Core & Functional Rehab*
    * *Endurance & Athletic Performance*
  * Add custom coach instructions and member goals.
  * View upcoming scheduled sessions and cancel bookings with real-time status updates.
* **Coach Management Portal (`trainer-dashboard.html`):**
  * Real-time table displaying today's scheduled training appointments.
  * Confirm scheduled bookings with a single click.
  * Complete sessions with an interactive coaching feedback prompt to record progressive overload remarks and trainee notes.
* **Admin Master Bookings Oversight (`admin-dashboard.html`):**
  * KPI summary cards tracking **Total Reservations**, **Upcoming/Active**, **Completed**, and **Cancelled** sessions.
  * Real-time search by member, coach, or focus area, plus status filtering and status overrides.

---

### 4. 📈 Fitness Progress & Body Transformation Curve
* **Biometric Metric Tracking (`JS/progress.js`):**
  * Check-in logging modal in `member-dashboard.html` to record **Body Weight (kg)**, **Body Fat %**, **Muscle Mass (kg)**, and circumferences (**Waist**, **Chest**, **Arms**).
  * Automatically recalculates member **BMI** and categorizes results (*Underweight, Normal, Overweight, Obese*).
  * Unlocks milestone fitness badges dynamically upon logging consistent check-ins.
* **Interactive Chart.js Transformation Visualizer:**
  * Chronologically ordered line graph displaying weight fluctuations over time.
  * High-visibility neon lime curve with translucent area gradient fill, smooth bezier curve tension, and interactive tooltips.
* **Measurement History Audit Log:**
  * Tabular display of all previous check-in metrics with date stamps and workout notes.
  * Instant deletion capability with SweetAlert confirmation.

---

### 5. 🤖 FlexBot AI Virtual Assistant
* **Omnipresent Public Assistant (`JS/chatbot.js`):**
  * Floating widget available on all public pages (`index.html`, `about.html`, `membership.html`, `trainer.html`, `workout-plans.html`, `shop.html`, `cart.html`).
  * Fast conversational response engine answering FAQs regarding gym hours, membership tiers, personal trainers, workout programs, store supplements, and online booking.
  * Interactive suggestion chips for quick navigation:
    * `💳 Packages` • `🏋️ Trainers` • `⏰ Opening Hours` • `📅 Book PT` • `📦 Store Orders` • `💪 Workout Plans`
  * Chat history clearing, minimize/maximize animations, and responsive mobile-optimized drawer.

---

## 👥 Role-Based Portals

| Portal | Target Page | Key Responsibilities & Capabilities |
|---|---|---|
| **🛡️ Admin** | `admin-dashboard.html` | Executive business KPI analytics (Revenue, Attendance, Active Subscriptions), Member/Trainer/Receptionist CRUD, Membership package management, Inventory low-stock monitoring, Locker allocations, Financial audit logs, Master PT session coordination, and Logistics order fulfillment. |
| **🏋️ Trainer** | `trainer-dashboard.html` | Assigned trainee directory, workout plan creation and assignment, today's 1-on-1 PT sessions table, session confirmation, completion feedback logger, and member transformation metrics inspection. |
| **🛎️ Receptionist** | `receptionist-dashboard.html` | Front desk daily member check-ins, barcode/ID attendance recording, walk-in member registration, package renewals, cash billing receipts, and locker assignments. |
| **🥇 Member** | `member-dashboard.html` | Digital membership card, active subscription alerts, 1-on-1 PT session booking, body transformation line graph & check-in logger, assigned workout plans, locker status, and real-time order tracking. |

---

## 🌐 Public Web Experience

```
├── index.html            # Landing page featuring hero banner, membership highlights, and order tracking
├── about.html            # Club history, state-of-the-art facility showcase, and mission statement
├── membership.html       # Transparent tiered pricing cards (Basic, Standard, Black Tier VIP)
├── workout-plans.html    # Curated training routines (Hypertrophy, Strength, HIIT, Functional)
├── trainer.html          # Certified coach roster with specialization tags & direct 1-on-1 booking CTA
├── shop.html             # Supplements, apparel, and gym accessories catalog with live tracking box
├── cart.html             # Cart calculation, delivery address forms, and card simulator checkout
├── login.html            # Secure authentication gateway with role redirector
├── signup.html           # Member registration with client-side validation
└── forgot-password.html   # 3-step OTP password recovery wizard
```

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Purpose |
|---|---|---|
| **Structure** | HTML5 Semantic Markup | Clean document outline, accessibility, SEO optimization |
| **Styling** | Custom Vanilla CSS3 | Modular CSS design system, dark mode tokens, CSS Grid, Flexbox, glassmorphism |
| **Logic & DOM** | JavaScript (ES6+), jQuery 3.7.1 | Asynchronous DOM manipulation, event delegation, service patterns |
| **Data Visuals** | Chart.js 4.x | Interactive transformation curves and gym management analytics |
| **Alerts & Modals** | SweetAlert2 | Polished, themed modal dialogues, confirmations, and toast notifications |
| **Typography** | Google Fonts (Inter / Outfit) | Ultra-clean modern typography for dark interfaces |
| **Branding Assets** | [assets/flex-gym-logo.png](assets/flex-gym-logo.png) | High-resolution official Flex Gym brand logo, navbar icons, and favicon |
| **Security Layer** | JWT (JSON Web Token) | Stateless authentication passed via HTTP `Authorization: Bearer <token>` |
| **Backend API** | Spring Boot REST API | Compatible with `http://localhost:8080/api` |

---

## 📁 File Structure

```plaintext
Flex-Gym-Management-System-Frontend/
├── assets/
│   └── flex-gym-logo.png             # Official high-resolution Flex Gym brand logo
├── css/
│   └── style.css                     # Master stylesheet (theme tokens, glassmorphism, order stepper)
├── JS/
│   ├── admin-dashboard.js            # Admin analytics, CRUD tables, order fulfillment, PT master
│   ├── alerts.js                     # SweetAlert2 toast & popup wrapper utilities
│   ├── api.js                        # Unified AJAX wrapper, JWT decode, route guards, RBAC
│   ├── attendance.js                 # Daily attendance & check-in logic
│   ├── auth.js                       # Login submission & session storage
│   ├── booking.js                    # 1-on-1 Personal Training Session booking service
│   ├── cart.js                       # Cart calculations, card simulator, checkout handler
│   ├── chatbot.js                    # FlexBot AI conversational assistant widget
│   ├── forgot-password.js            # 3-Step OTP verification & password reset logic
│   ├── index.js                      # Public landing page animations & mobile navigation
│   ├── inventory-alerts.js           # Low stock visual warnings & inventory notifications
│   ├── locker.js                     # Locker assignment & availability tracking
│   ├── login.js                      # Login credentials validation & portal redirection
│   ├── member-dashboard.js           # Member portal (PT booking, body progress, orders, routines)
│   ├── member.js                     # Member data models & API adapters
│   ├── membership.js                 # Membership packages display & enrollment logic
│   ├── order.js                      # Order tracking modal, stepper visualizer, tracking lookup
│   ├── package.js                    # Package management API helpers
│   ├── payment.js                    # Payment transaction records & invoicing
│   ├── product.js                    # Product catalog loading, category filters, inventory status
│   ├── progress.js                   # Body transformation & biometric progress service
│   ├── receptionist-dashboard.js     # Front desk operations, quick check-ins, locker assignment
│   ├── signup.js                     # Registration form submission & validation
│   ├── trainer-dashboard.js          # Trainer portal (PT sessions, client routines, session notes)
│   ├── trainer.js                    # Trainer profile data loader
│   ├── user.js                       # User profile management & password update
│   └── workout.js                    # Workout routines & program builders
├── about.html                        # About Us public page
├── admin-dashboard.html              # Admin Management Portal
├── cart.html                         # Shopping Cart & Checkout with Card Simulator
├── forgot-password.html              # 3-Step OTP Account Recovery Page
├── index.html                        # Public Landing Page & Showcase
├── login.html                        # Authentication Page
├── member-dashboard.html             # Member Self-Service Portal
├── membership.html                   # Membership Packages & Tiers
├── receptionist-dashboard.html       # Receptionist Front-Desk Portal
├── shop.html                         # E-Commerce Store with Quick Tracking
├── signup.html                       # New Member Registration Page
├── trainer-dashboard.html            # Trainer Coaching & Schedule Portal
├── trainer.html                      # Personal Trainers Directory
├── workout-plans.html                # Workout Programs Catalog
└── README.md                         # Comprehensive System Documentation
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
* Modern web browser with ECMAScript 6+ support (**Google Chrome**, **Microsoft Edge**, **Mozilla Firefox**, or **Brave**).
* **VS Code** with the **Live Server** extension (recommended) or any standard web server (Nginx, Apache, or Python `http.server`).
* **Flex Gym Backend Server (Spring Boot)** running at `http://localhost:8080`.

### 2. Configure Backend API URL
If your backend runs on a custom domain, host, or port, update `API_BASE_URL` in [JS/api.js](file:///d:/Flex-Gym-Management-System-Frontend/JS/api.js):

```javascript
const API_BASE_URL = "http://localhost:8080/api";
```

### 3. Launching Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/chathunga2007/ITS1114-Flex-Gym-Web-App-2nd-Sem-Final-Project-Frontend.git
   cd ITS1114-Flex-Gym-Web-App-2nd-Sem-Final-Project-Frontend
   ```
2. Start the local server:
   * **Using VS Code Live Server:** Right-click on `index.html` and select **"Open with Live Server"**.
   * **Using Python 3:**
     ```bash
     python -m http.server 5500
     ```
     Then open `http://localhost:5500` in your browser.
3. Access the portal:
   * Browse the public website via `index.html`.
   * Log into the respective dashboard via `login.html` using credentials seeded by your Spring Boot backend.

---

## 📄 License & Academic Attribution

Developed for the **ITS1114 - 2nd Semester Final Project**.  
All design assets, brand identity, and application source code are protected under intellectual property guidelines.  

**Copyright © 2026 Flex Gym. All Rights Reserved.**
