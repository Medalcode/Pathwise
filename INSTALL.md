# 🚀 Installation Guide - Pathwise

Follow these steps to get the full Pathwise ecosystem running.

## ✅ Prerequisites

- Node.js (v16 or higher)
- Google Chrome or Chromium
- Git

## 📦 Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all necessary dependencies:

- Express (web server)
- SQLite3 (database)
- Multer (file handling)
- PDF-Parse (PDF text extraction)
- CORS (security)

## 🗄️ Step 2: Initialize Database

The database will be initialized automatically when the server starts for the first time.

## ▶️ Step 3: Start the Backend

```bash
npm start
```

Or for development mode with auto-reload:

```bash
npm run dev
```

You should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Pathwise Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 API running on: http://localhost:3000/api
🌐 Dashboard: http://localhost:3000
✅ Health check: http://localhost:3000/api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🌐 Step 4: Access Web Dashboard

Open your browser and go to:

```
http://localhost:3000
```

Here you can:

- ✅ Upload your CV in PDF
- ✅ Manually complete your profile
- ✅ View completeness statistics
- ✅ Track applications

## 🧩 Step 5: Install Chrome Extension

### Method 1: Manual (Development)

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle **"Developer mode"** (top right)
3. Click on **"Load unpacked"**
4. Select the `/extension` folder of this project
5. Done! You will see the Pathwise icon in your toolbar

### Method 2: From Dashboard

1. In the web dashboard, click on **"Install Extension"**
2. Follow the instructions

## 🎯 Step 6: Configure Your Profile

### Option A: Upload CV in PDF

1. In the dashboard, go to **"Upload CV"**
2. Drag and drop your CV or click to select
3. The Deep Extract engine will automatically parse:
   - Name and contact info
   - LinkedIn
   - Technical skills
   - Experience and Education timelines

### Option B: Manual Entry

1. Go to **"My Profile"**
2. Fill in the fields:
   - **Personal Info**: Name, email, phone, etc.
   - **Professional Info**: Title, LinkedIn, portfolio
   - **Skills**: Add skills (press Enter after each)
   - **Summary**: Brief professional summary
3. Click **"Save Profile"**

## 🚀 Step 7: Use the Extension!

1. Go to any job board (LinkedIn, Indeed, etc.)
2. Open an application form
3. Click on the **Pathwise** icon in the toolbar
4. Click **"Fill Form"**
5. ✨ Magic! The extension will autocomplete the fields

### Tested Sites

- ✅ LinkedIn
- ✅ Indeed
- ✅ GetOnBoard
- ✅ Workday
- ✅ Greenhouse
- ✅ Lever

## 🔧 Troubleshooting

### Backend fails to start

```bash
# Verify Node.js version
node --version

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Extension not loading

1. Verify **Developer mode** is on
2. Check errors console in `chrome://extensions/`
3. Reload the extension

### Extension not filling fields

1. Verify backend is running
2. Check if extension shows "Connected"
3. Ensure you have a saved profile
4. Some custom fields might not be detected

## 📊 Verify Installation

### Test 1: Backend

```bash
curl http://localhost:3000/api/health
```

Should response: `{"status":"ok",...}`

### Test 2: Dashboard

Open: `http://localhost:3000`
You should see the Pathwise Glassmorphism dashboard.

### Test 3: Extension

1. Click on the Pathwise icon
2. Should show your name and stats
3. Status must be **"Connected"** (green dot)

## 🆘 Support

Issues? Open a ticket on GitHub.

---

**Pathwise is ready to navigate your career! 🚀**
