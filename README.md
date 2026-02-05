# 🧭 Pathwise - Intelligent Career Navigation

**Formerly known as Panoptes (AutoApply)**

**Version**: 1.0 (Reforged January 2026)

Pathwise is an intelligent ecosystem designed to navigate the complexity of modern job searching. It combines a powerful Chrome Extension, a premium Web Dashboard, and an advanced AI Engine to automate, optimize, and track your career journey.

---

## 🎯 Core Capabilities

- **🔌 Chrome Extension**: Intelligent form autofill and job data extraction.
- **📊 Premium Web Dashboard**: Glassmorphism UI with fluid animations for a superior user experience.
- **🧠 AI Engine (Groq + Llama 3)**: Resume optimization and tailored cover letter generation.
- **📄 Deep Extract PDF Parser**: Visual analysis of CV structure, detecting gaps and skills automatically.
- **⚡ Instant Generation**: Smart local caching for extreme performance.
- **🔍 Advanced Search**: Distributed job search engine with analytical match scoring.
- **🔐 Secure Identity**: Multi-user JWT authentication system.
- **🌎 Global Ready**: Native English/Spanish support.
- **🎨 Visual Themes**: Persistent Dark/Light modes.
- **💾 Robust Persistence**: Automatic synchronization with Google Cloud Storage.

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/medalcode/Panoptes.git Pathwise
cd Pathwise

# 2. Start Web Dashboard (Local)
# Open web-dashboard/index.html in your browser
# Or use Live Server
```

**Chrome Extension**:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `/extension` folder

---

## 📚 Documentation

- **📖 [DOCUMENTATION.md](DOCUMENTATION.md)** - Complete System Documentation
- **🚀 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment Guide
- **⚙️ [INSTALL.md](INSTALL.md)** - Detailed Installation
- **🧯 [ISSUES.md](ISSUES.md)** - Known Issues and Technical Debt

---

## 🆕 Pathwise Features (v1.0)

### ✅ Deep Extract Engine

- **Layout Aware**: Detects 2-column layouts and processes text in visual logical order.
- **Split View Interface**: Integrated PDF viewer for immediate visual validation.
- **Visual Career Timeline**: Interactive chart visualizing career trajectory and gaps.
- **ATS Compatibility Score**: Real-time analysis of resume machine-readability.

### ✅ Premium Strategy Generation

- **Career Personas**: Generate customized profiles for different market segments (e.g., "Senior Frontend" vs "Tech Lead").
- **Salary Market Value**: AI-estimated salary ranges based on role and location.
- **Smart Caching**: Local persistence of generated assets.

### ✅ Job Tracking & Kanban

- **Application Kanban**: Trello-style board to manage applications (Saved, Applied, Interview, Offer).
- **Match Analysis**: Visual compatibility scoring.
- **Cover Letter AI**: Instant generation of tone-adjusted cover letters.

---

## 🛡️ System Reliability (New in v1.1)

We are obsessed with reliability. Critical flows like CV Upload are protected by explicit contracts and automated integration tests.

- **Contract-First Development**: See [API_CONTRACT_UPLOAD_CV.md](API_CONTRACT_UPLOAD_CV.md).
- **Resilient Architecture**: Anti-DoS protection and deterministic error handling.
- **Automated Validation**: `npm test` runs rigorous integration scenarios including "Worst Case" validation.
- **Upload Integration Coverage**: invalid PDF, technical parser failure, AI fallback, and DB partial-failure rollback.

---

## 🛠️ Technology Stack

**Backend**: Node.js, Express, SQLite (Managed), Google Cloud Storage, Groq SDK  
**Frontend**: HTML5, CSS3 (Tailwind + Custom Variables), Vanilla JS (ES6+ Modules)  
**Extension**: Chrome Manifest V3  
**AI**: Llama 3.3 70B (Groq)

---

## 🎯 Roadmap

### High Priority

1. Automated Tests (Jest + Playwright)
2. Backend Persistence for Kanban (Cloud Sync)
3. Resume Tailoring (Job-specific PDF generation)

### Medium Priority

4. Multi-site Extension Support (LinkedIn, Indeed)
5. CI/CD Pipeline
6. Market Salary Analysis with IA

---

© 2026 MedalCode. Built for the modern professional.
