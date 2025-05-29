# YWC Financial Coaching Platform

A full-stack financial coaching application that allows **Admins**, **Coaches**, and **Clients** to manage financial forms, documents, and user data in a structured and role-based system.

---

## 🌟 Features

### 👤 Role-based Access:
- **Admin**: Manages users (Admins, Coaches, Clients), roles, and access control.
- **Coach**: Manages own clients, can create/update/download/delete forms.
- **Client**: Fills and updates own personal financial details and documents.
- **Guest**: Can view public content (limited access).

### 📑 Form Management:
- Fill structured personal, employment, income, assets, liabilities, and expense data.
- Each form is linked to a `personalId`, controlled by role context.
- Coaches can manage their own clients' forms.

### 📦 Backend (Express + PostgreSQL):
- RESTful API endpoints for user and form management.
- Seed data for roles and demo users (admin and coach).
- Secure password hashing and JWT-based authentication.

### 🎨 Frontend (YWC-UI using React + Vite + TailwindCSS):
- Role-based dashboards with responsive UI.
- Dynamic form builder and PDF preview before download.
- Supports themes and layouts per role (Admin, Coach, Client).
- Mobile-friendly, highly accessible interface.

---

## 📁 Tech Stack

| Layer     | Tech                  |
|-----------|-----------------------|
| Frontend  | React, Vite, Tailwind |
| Backend   | Express.js, PostgreSQL |
| Auth      | JWT (JSON Web Tokens) |
| Styling   | Tailwind CSS          |
| Deployment| Docker (optional)     |

---

## 🧱 Project Setup

### 🔧 Backend Setup

```bash
cd ywc-backend
npm install
# Setup .env for DB credentials
npm run migrate         # Run schema setup
npm run seed            # Seed roles & demo users
npm run dev             # Start development server
