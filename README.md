# Dashboard-Summary

# 📊 Full Stack Summary Dashboard

**Billings • Bookings • Backlogs**

---

## 📌 Overview

This project is a **full-stack interactive summary dashboard** that visualizes **Bookings, Billings, and Backlogs** across multiple business dimensions such as **Region, Product, and Customer**.

The dashboard helps stakeholders:

* Monitor monthly trends
* Analyze book-to-bill ratios
* Understand backlog distribution
* Drill down into detailed summaries

---

## 🏗️ Architecture

```
Excel (.xlsx)
   ↓
Node.js (Express API)
   ↓
React + MUI + Recharts Dashboard
```

---

## 📁 Input Data

The provided Excel file contains **three sheets**:

1. **Bookings**
2. **Billings**
3. **Backlogs**

Each sheet includes the following fields:

* Customer
* Region
* Product
* Amount
* Date (for Bookings & Billings)

---

## ✅ Features Implemented

### 🔹 Summary Cards (Top Section)

* **Total Bookings (MTD)**
* **Total Billings (MTD)**
* **Total Backlog Amount**
* **Book-to-Bill Ratio**

> All summary metrics update dynamically based on applied filters.

---

### 📈 Charts

* **Monthly Trend of Bookings vs Billings** (Line Chart)
* **Backlog by Region** (Bar Chart)
* **Bookings Distribution by Product** (Pie Chart)

---

### 🔍 Filters

* Date Range
* Region
* Product
* Customer

> Filters affect **summary cards, charts, and table data**.

---

### 📋 Drill-Down Table

**Columns:**

* Customer
* Region
* Product
* Total Bookings
* Total Billings
* Backlog
* Book-to-Bill Ratio

**Additional Features:**

* Conditional formatting for low Book-to-Bill ratio (< 0.9)
* Export filtered table data to CSV

---

## 🧰 Tech Stack

### Frontend

* React (TypeScript)
* Material UI (MUI)
* Recharts
* Axios

### Backend

* Node.js
* Express.js
* XLSX (Excel parsing)

---

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd fullstack-summary-dashboard
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Place the Excel file at:

```
backend/data/FullStack_Summary_Dashboard_Data.xlsx
```

Start the backend server:

```bash
node server.js
```

Backend will run on:

```
http://localhost:4000
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will run on:

```
http://localhost:3000
```

---

## 🔄 Data Flow

1. Backend parses Excel sheets and applies **date filtering**
2. REST API exposes aggregated and raw data
3. Frontend applies **Region / Product / Customer filters**
4. Summary cards, charts, and table update in real time

---

## 🧠 Design Decisions

* Date filtering handled in backend to reduce payload size
* Business filters handled in frontend for fast interactivity
* Summary calculations derived from filtered data to ensure accuracy
* Clear separation of concerns between backend and frontend

---

## 🧪 Validation

* Metrics validated against Excel source data
* Book-to-Bill ratios calculated accurately
* Charts and summary remain synchronized under all filters

---

## 📤 Export

* Export filtered drill-down table as **CSV**

---

## 📌 Future Enhancements

* Year-to-Date (YTD) toggle
* Backlog forecasting using expected shipping dates
* Authentication and role-based access
* Database integration (PostgreSQL / MongoDB)

---

## 👤 Author

**Pranav Sharma**
Senior Software Engineer

---

## 📝 License

This project is created for **assessment and learning purposes only**.
