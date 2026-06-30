# ConstructPro ERP — Invoicing & Billing Module

A full-stack invoicing system for a construction ERP. Accountants create invoices, project managers approve them, and clients view only what belongs to them.



## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite, React Router, Axios |
| Backend  | Node.js, Express 4                |
| Database | MongoDB + Mongoose                |
| Auth     | JWT (jsonwebtoken)      |


## How to Run

### 1. Backend

```bash
cd backend
npm install
npm run dev       


### 2. Frontend

```bash
cd frontend
npm install
npm run dev      
```

## Demo Users

All passwords are `password`.

anand@constructpro.com | ADMIN | Everything |
roopan@constructpro.com | ACCOUNTANT | All invoices |
aabitha@constructpro.com | PROJECT_MANAGER |  Approve or reject invoices |
hari@gmail.com | PROJECT_MANAGER |  PAID Only |


## Deployment

The project source code is maintained in GitHub.

### Backend Deployment

The backend is deployed on Render and connected to a MongoDB Atlas cloud cluster.

### Frontend Deployment

The frontend build is deployed on Netlify.

### Demo Link

Frontend: https://constructproerp.netlify.app/


