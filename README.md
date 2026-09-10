# BhoomiSetu - GIS-Enabled National Land Acquisition & Management System

> **Smart India Hackathon 2026 Prototype**
> **Problem Statement:** SIH26016 - Real-Time National Land Acquisition & Management System for End-to-End Digital Monitoring and Decision Support.

BhoomiSetu is a modern, full-stack government enterprise application designed to streamline, digitize, and monitor the entire land acquisition lifecycle. It serves as a unified platform bridging Central Authorities, State Nodal Officers, District Magistrates, and Field Surveyors to bring complete transparency to land valuation, R&R (Resettlement & Rehabilitation), and legal dispute resolution.

## ✨ Core Features
*   **Role-Based Access Control (RBAC):** Secure authorization architecture routing distinct features to Central, State, District, and Field-level officials.
*   **2D Mapbox GIS Integration:** Interactive geographical mapping and tracking of active land parcels connected directly to real-time administrative status.
*   **3D Property Visualization:** Advanced Three.js powered interactive 3D property visualization to evaluate granular acquisition footprints and structural impacts.
*   **AI Decision Support (Gemini AI):** Automated executive summaries, deterministic risk scoring, bottleneck detection, and administrative action recommendations.
*   **Comprehensive Lifecycle Management:** End-to-end tracking from initial Proposal through Verification, Notification, Award, Compensation, R&R, and final Possession.

## 🛠 Tech Stack
*   **Database:** MongoDB, Mongoose
*   **Backend:** Node.js, Express.js
*   **Frontend:** React.js, Tailwind CSS
*   **GIS & 3D:** Mapbox GL JS, GeoJSON, React-Three-Fiber (Three.js)
*   **AI Engine:** Google Gemini SDK

## ⚙️ Prerequisites & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/bhoomi-setu.git
cd bhoomi-setu
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure the following secrets:
```env
# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_secure_random_string

# Mapbox (Required for 2D GIS)
VITE_MAPBOX_TOKEN=your_mapbox_public_token

# AI (Required for Decision Support)
GEMINI_API_KEY=your_google_gemini_api_key

# Email/SMTP (Optional - for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### 4. Start the Application
```bash
# Start both the frontend Vite server and backend Node/Express server concurrently
npm run dev
```
*The frontend will typically run on `http://localhost:3000` depending on your environment configuration.*

## 🔐 Demo Credentials & User Registration

**Important:** For security and demonstration integrity, this application does **not** rely on pre-seeded or dummy databases. 

To access the platform, you must register a new official account using the standard registration portal. If your role is elevated (e.g. `CENTRAL_AUTHORITY` or `STATE_AUTHORITY`), you may require the Official Secret Key defined by your environment administrator during the registration phase to prevent unauthorized privilege escalation.

---
*Built for SIH 2026. Empowering transparent governance through technology.*
