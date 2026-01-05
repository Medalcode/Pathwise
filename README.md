# 👁️ Panoptes

## Data Intelligence & Extraction Suite (formerly BuyScraper)

> **"Data is the new oil, but only if you can refine it."**

**Panoptes** is a professional-grade web scraping and data intelligence suite designed to build viable **Data-as-a-Service (DaaS)** businesses. It moves beyond simple "mining" scripts to providing high-value, clean, and actionable business intelligence.

---

## 🚀 The Business of Data

Panoptes is built around three core business models:

1.  **Data-as-a-Service (DaaS)**: Selling recurrent Excel reports of competitive data.
2.  **Custom Scraper Development**: High-ticket generic scraping solutions.
3.  **Proprietary APIs**: Wrapping scrapers in REST APIs for developers.

### ⚡ "Hefesto" Component (Mobile Hybrid - _Active_)

Leverages physical devices (like Android via ADB) to scrape mobile-only applications.

- **Humanized Interaction**: Uses Gaussian noise in taps and swipes to evade bot detection.
- **Panteon SDK**: Universal communication bridge. Connects PC (Panoptes) and Mobile (Hermes) to a central "Brain" (Hestia).
- **OCR Ready**: Prepared for optical text recognition (Roadmap).

---

## 💻 Quick Start

### Prerequisites

- Python 3.8+
- Playwright
- Android Device (Optional) with USB Debugging enabled.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Medalcode/Panoptes.git
cd Panoptes

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
playwright install
```

### Usage

**1. Desktop Scraping (Market Report):**

```bash
python src/scraper/scrape.py --sites config/sites.yaml --excel
```

**2. Mobile Scraping (Hefesto):**
Connect your Android phone via USB or Wi-Fi (ADB TCP/IP):

```bash
python -m src.hefesto.price_tracker
```

_Tracks products defined in `config/mobile_targets.yaml` and sends data to Hestia._

**3. Local Visualization Dashboard:**
Panoptes includes a local glassmorphism dashboard to view your findings.

```bash
# Start API & Dashboard
uvicorn src.api.main:app --port 8000 --reload
```

👉 Access: **http://localhost:8000/dashboard**

---

## 📊 Features

- **Hybrid Scraping**: Playwright (Desktop) + ADB (Mobile).
- **Local Dashboard**: Real-time visualization of pricing data.
- **Excel/CSV Exports**: Native support for business-readable formats.
- **Panteon SDK**: Unified configuration and logging system across devices.
- **Anti-Detection**: User-Agent rotation and Human-like touch simulation.

## 📂 Project Structure

```
Panoptes/
├── config/                 # YAML Recipes
├── data/                   # Raw Data (CSV/DB)
├── reports/                # Business Reports (Excel)
├── src/
│   ├── api/                # REST API & Local Dashboard
│   ├── dashboard/          # HTML/JS Frontend
│   ├── scraper/            # Core Desktop Logic (Playwright)
│   ├── hefesto/            # ⭐ Mobile Logic (ADB Wrapper + Inspector)
│   ├── panteon.py          # ⭐ Universal SDK
│   └── scripts/            # Utilities
├── docker-compose.yml
└── requirements.txt
```

---

**Author**: Medalcode
**License**: MIT
