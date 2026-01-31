# 🧭 Pathwise - Complete System Documentation

**Unknown Version** (Legacy Panoptes v4.8)  
**Last Update**: January 2026

---

## 📖 Index

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Installation](#installation)
4. [Architecture](#architecture)
5. [Features](#features)
6. [Roadmap](#roadmap)
7. [API Reference](#api-reference)
8. [Deployment](#deployment)

---

## Overview

**Pathwise** (formerly Panoptes) is an intelligent ecosystem for navigating the modern job market. It bridges the gap between manual application and full automation by combining:

- 🔌 **Chrome Extension**: Intelligent form autofill and job extraction.
- 📊 **Web Dashboard**: Central command for profiles and applications.
- 🧠 **AI Engine (Groq + Llama 3)**: Strategy generation and cover letter writing.
- 🔍 **Modular Scrapers**: Distributed recruiting network search.
- 📋 **Kanban System**: Application lifecycle tracking.

---

## Current Status

### ✅ Implemented (v1.0)

#### Backend

- ✅ Robust Persistence with GCS (Retry logic, Change detection)
- ✅ JWT Authentication + bcrypt
- ✅ Multi-profile System
- ✅ Application Tracking (Kanban API)
- ✅ Smart Cover Letter Generator (3 tones)
- ✅ AI-Powered CV Parser
- ✅ Job Scrapers (ChileTrabajos, CompuTrabajo)

#### Frontend

- ✅ Glassmorphism Dashboard
- ✅ Profile Editor & Verification
- ✅ Job Search Interface

#### Extension

- ✅ Form Autofill
- ✅ Backend Synchronization

### ⏳ Pending

- ⏳ Automated Tests (Jest + Playwright)
- ⏳ Auth Frontend (login.html)
- ⏳ Kanban UI (kanban.html)
- ⏳ Cover Letter Generator UI (Standalone)
- ⏳ CI/CD Pipeline

---

## Installation

### Requirements

- Node.js 18+
- Groq API Key
- Google Cloud Account (Optional, for Cloud Sync)

### Local Setup

```bash
# 1. Clone repository
git clone https://github.com/medalcode/Panoptes.git Pathwise
cd Pathwise

# 2. Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials

# 3. Start Server
npm run dev
# Server at http://localhost:8080

# 4. Chrome Extension
# Go to chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select /extension folder
```

### Environment Variables

```env
PORT=8080
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key
GCS_BUCKET_NAME=your_optional_bucket
JWT_SECRET=your_secret_min_32_chars
JWT_EXPIRATION=7d
```

---

## Architecture

### Technology Stack

**Backend**:

- Node.js + Express
- SQLite (Managed via Repository Pattern)
- Google Cloud Storage (Backup)
- Groq SDK (AI)
- JWT + bcrypt (Auth)

**Frontend**:

- HTML/CSS/JS Vanilla
- Pathwise Design System (Glassmorphism)

**Extension**:

- Chrome Manifest V3
- Content scripts + Background worker

### Directory Structure

```
Pathwise/
├── backend/
│   ├── services/
│   │   ├── authService.js       # JWT + bcrypt
│   │   ├── groqService.js       # IA
│   │   ├── jobService.js        # Search Engine
│   │   └── storageService.js    # GCS Sync
│   ├── routes/
│   ├── database/
│   │   ├── db.js                # Database Orchestrator
│   │   ├── schema.js            # Schemas
│   │   └── profilesSystem.js    # Profiles Logic
│   └── middleware/
├── web-dashboard/
│   ├── index.html
│   ├── css/
│   └── js/
└── extension/
    ├── manifest.json
    ├── background/
    └── content/
```

---

## API Reference

### Authentication

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response 201:
{
  "success": true,
  "user": { "id": 1, "email": "..." },
  "token": "eyJhbGc..."
}
```

_Refer to the codebase for full API documentation._

---

## License

MIT © 2026 MedalCode
