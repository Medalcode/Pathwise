# 🚀 Deployment Guide - Pathwise on Google Cloud Run

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy to Cloud Run](#deploy-to-cloud-run)
3. [Environment Configuration](#environment-configuration)
4. [Chrome Extension Installation](#chrome-extension-installation)
5. [Publish to Chrome Web Store](#publish-to-chrome-web-store)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### 1. **Google Cloud Account**

- Create an account on [Google Cloud](https://cloud.google.com/)
- Create a new project or use an existing one
- Enable billing (Cloud Run has a free tier)

### 2. **Installed Tools**

```bash
# Verify installations
gcloud --version  # Google Cloud SDK
docker --version  # Docker
```

### 3. **Install Google Cloud SDK** (if not installed)

```bash
# Linux/Mac
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize
gcloud init
```

---

## 🚀 Deploy to Cloud Run

### **Option 1: Automatic Script** (Recommended)

```bash
# Run deployment script
./deploy-cloud-run.sh YOUR_PROJECT_ID us-central1
```

**Example:**

```bash
./deploy-cloud-run.sh pathwise-prod us-central1
```

The script will automatically:

- ✅ Configure the project
- ✅ Enable necessary APIs
- ✅ Build the Docker image
- ✅ Push to Container Registry
- ✅ Deploy to Cloud Run
- ✅ Show your application URL

---

### **Option 2: Manual Deployment**

#### **Step 1: Configure Project**

```bash
# Configure project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### **Step 2: Authenticate Docker**

```bash
gcloud auth configure-docker
```

#### **Step 3: Build Image**

```bash
# Build image
docker build -t gcr.io/YOUR_PROJECT_ID/pathwise:latest .

# Push image
docker push gcr.io/YOUR_PROJECT_ID/pathwise:latest
```

#### **Step 4: Deploy to Cloud Run**

```bash
gcloud run deploy pathwise \
  --image gcr.io/YOUR_PROJECT_ID/pathwise:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --port 8080
```

---

### **Option 3: Automatic Cloud Build**

#### **Connect with GitHub**

```bash
# Connect repository
gcloud builds submit --config cloudbuild.yaml
```

#### **Configure Automatic Trigger**

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Create Trigger"
3. Connect your GitHub repository
4. Configure trigger to run on each push to `main`
5. Use `cloudbuild.yaml` file

---

## ⚙️ Environment Configuration

### **Configure GROQ_API_KEY**

```bash
gcloud run services update pathwise \
  --region us-central1 \
  --set-env-vars GROQ_API_KEY=gsk_your_api_key_here
```

### **View Configured Variables**

```bash
gcloud run services describe pathwise \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

### **Configure Multiple Variables**

```bash
gcloud run services update pathwise \
  --region us-central1 \
  --set-env-vars \
    NODE_ENV=production,\
    GROQ_API_KEY=gsk_...,\
    PORT=8080
```

---

## 🌐 Get Application URL

```bash
gcloud run services describe pathwise \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

**URL Example:**

```
https://pathwise-abc123xyz-uc.a.run.app
```

---

## 📦 Chrome Extension Installation

### **Step 1: Update Configuration**

Edit `extension/config.js`:

```javascript
const CONFIG = {
  ENVIRONMENT: "production",

  API_URLS: {
    development: "http://localhost:3000/api",
    production: "https://YOUR-CLOUD-RUN-URL.run.app/api", // ← Update here
  },

  DASHBOARD_URLS: {
    development: "http://localhost:3000",
    production: "https://YOUR-CLOUD-RUN-URL.run.app", // ← Update here
  },
};
```

### **Step 2: Install in Chrome (Developer Mode)**

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle **"Developer mode"** (top right)
3. Click **"Load unpacked"**
4. Select `extension/` folder
5. Done! The extension will appear in your toolbar

### **Step 3: Package for Distribution**

```bash
# Run package script
./package-extension.sh
```

This will create: `dist/pathwise-extension-v1.0.0.zip`

---

## 🏪 Publish to Chrome Web Store

### **Requirements**

- Google Account
- One-time **$5 USD** fee for developer registration
- Packaged extension (`.zip`)

### **Steps**

1. **Register as Developer**
   - Go to: [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay registration fee ($5 USD)

2. **Upload Extension**
   - Click "New Item"
   - Upload `dist/pathwise-extension-v1.0.0.zip` file

3. **Complete Information**
   - **Name:** Pathwise - Intelligent Career Navigation
   - **Description:** Automate your job applications with AI
   - **Category:** Productivity
   - **Language:** English / Spanish
   - **Screenshots:** Minimum 1, maximum 5 (1280x800 or 640x400)
   - **Icon:** 128x128 px

4. **Privacy**
   - Declare permissions used and why
   - Privacy Policy (required)

5. **Submit for Review**
   - Click "Submit for review"
   - Review time: 1-3 business days

---

## 🎨 Recommended Screenshots

For Chrome Web Store, include:

1. **Main Dashboard** showing statistics
2. **Professional Profiles Modal**
3. **Autofilled Form** in action
4. **API Key Configuration**
5. **Extension in Use** on a job site

**Dimensions:** 1280x800 px or 640x400 px

---

## 📊 Monitoring and Logs

### **View Real-Time Logs**

```bash
gcloud run services logs read pathwise \
  --region us-central1 \
  --follow
```

### **View Metrics**

```bash
gcloud run services describe pathwise \
  --region us-central1 \
  --format="value(status.traffic)"
```

### **Cloud Run Dashboard**

[https://console.cloud.google.com/run](https://console.cloud.google.com/run)

---

## 🔒 Security

### **Configure Authentication** (Optional)

```bash
gcloud run services update pathwise \
  --region us-central1 \
  --no-allow-unauthenticated
```

### **Configure CORS** (Already configured in code)

The server already has CORS enabled to allow requests from the extension.

---

## 💰 Estimated Costs

### **Cloud Run - Free Tier**

- 2 million requests/month
- 360,000 GB-seconds/month
- 180,000 vCPU-seconds/month

### **Estimate for 1000 users/month:**

- **Cost:** ~$0-5 USD/month
- **Traffic:** Within free tier

### **Chrome Web Store**

- **Registration:** $5 USD (one-time)
- **Publishing:** Free

---

## 🐛 Troubleshooting

### **Error: "Permission denied"**

```bash
# Verify authentication
gcloud auth login
gcloud auth configure-docker
```

### **Error: "Service not found"**

```bash
# Verify region
gcloud run services list --platform managed
```

### **Error: "Build failed"**

```bash
# View build logs
gcloud builds list
gcloud builds log [BUILD_ID]
```

### **Extension not connecting to server**

1. Verify URL in `config.js` is correct
2. Verify Cloud Run is running
3. Check browser console (F12)

### **Database not persisting**

Cloud Run is stateless. For persistence:

- Use Cloud SQL
- Use Cloud Storage
- Use Firestore

---

## 📝 Deployment Checklist

- [ ] Google Cloud Account created
- [ ] Project configured
- [ ] gcloud CLI installed
- [ ] Docker installed
- [ ] Image built and pushed
- [ ] Service deployed to Cloud Run
- [ ] GROQ_API_KEY configured
- [ ] Production URL obtained
- [ ] `extension/config.js` updated with Production URL
- [ ] Extension tested locally
- [ ] Extension packaged
- [ ] Screenshots prepared
- [ ] Chrome Web Store Developer Account created
- [ ] Extension published

---

## 🎯 Next Steps

1. **Deploy backend** to Cloud Run
2. **Update extension** with production URL
3. **Test** full application
4. **Publish** to Chrome Web Store
5. **Share** with users

---

## 📞 Support

- **Cloud Run Documentation:** https://cloud.google.com/run/docs
- **Chrome Extensions:** https://developer.chrome.com/docs/extensions/
- **Chrome Web Store:** https://developer.chrome.com/docs/webstore/

---

**Developed by:** MedalCode  
**Date:** 2026-01-31  
**Version:** 1.0.0
