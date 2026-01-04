# 👁️ Panoptes

## Data Intelligence & Extraction Suite (formerly BuyScraper)

> **"Data is the new oil, but only if you can refine it."**

**Panoptes** is a professional-grade web scraping and data intelligence suite designed not just to extract code, but to build viable **Data-as-a-Service (DaaS)** businesses. It moves beyond simple "mining" scripts to providing high-value, clean, and actionable business intelligence.

---

## 🚀 The Business of Data: Creating & Selling Specialized Scrapers

In the digital economy, companies pay a premium for fresh, competitive data. Panoptes is built around three core business models designed to turn code into revenue.

### 1. What Data is "Pure Gold"?

Not all data is created equal. Panoptes focuses on high-value targets:

- **Real-Time Price Comparison**: Electronic stores needing to adjust prices hourly against competitors.
- **Sentiment Analysis**: Marketing agencies scraping reviews from Amazon/Google Maps to gauge product reception.
- **Lead Generation**: Real estate agencies looking for property owners the moment an ad goes live.
- **Stock Monitoring**: Resellers tracking limited edition product availability.

### 2. Revenue Models

#### A. Data-as-a-Service (DaaS) - Selling Reports

You don't sell the code; you sell the **insight**.

- **Example**: A weekly report of hotel prices in a tourist zone.
- **Delivery**: Clean Excel/CSV files via email or cloud.
- **Model**: Monthly subscription for the "Data Bulletin".

#### B. Custom Scraper Development

Building tailored solutions for clients on platforms like Upwork/Fiverr.

- **The Panoptes Edge**: Unlike basic scrapers, Panoptes uses **Playwright** and advanced proxy handling to bypass security blocks that stop novice developers.
- **Model**: One-time high-ticket payment ($50 - $500+).

#### C. Proprietary APIs

Wrapping your scraper in an API for other developers to consume.

- **Model**: Usage-based billing.

---

## 🛠️ Technical Architecture

Panoptes creates a professional "Web to Money" pipeline:

1.  **Extraction (Playwright)**: Navigates complex JS-heavy sites, handles infinite scrolls, and interacts with UI elements.
2.  **Refinement (Pandas/Python)**: Cleans "dirty" web data (weird symbols, bad formatting) into pristine datasets.
3.  **Delivery**: Exports to business-ready formats like **Excel (.xlsx)**, CSV, or direct database injection.

### ⚡ "Hefesto" Component (Mobile Hybrid - _Coming Soon_)

Leverages physical devices (like Android via ADB) to scrape mobile-only applications, bypassing desktop-grade anti-scraping protections entirely.

---

## 💻 Quick Start

### Prerequisites

- Python 3.8+
- Playwright

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Medalcode/BuyScraper.git Panoptes
cd Panoptes

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
playwright install
```

### Usage

**Generate a Market Report (Excel Export):**

```bash
python src/scraper/scrape.py --sites config/sites.yaml --excel
```

_Output: `reports/Panoptes_Report_YYYY-MM-DD.xlsx`_

**Docker Quick Start:**

```bash
docker-compose up --build
```

- **Dashboard:** http://localhost:8501
- **API:** http://localhost:8000/docs

---

## 📊 Features

- **Advanced Anti-Detection**: User-Agent rotation and heuristic delays.
- **Excel/CSV Exports**: Native support for business-readable formats.
- **Configurable "Recipes"**: YAML-based configuration for target sites.
- **Robots.txt Compliance**: Ethical scraping by default (configurable).

## 📂 Project Structure

```
Panoptes/
├── config/                 # YAML Recipes
├── data/                   # Raw Data (CSV/DB)
├── reports/                # Business Reports (Excel)
├── src/
│   ├── api/                # REST API
│   ├── dashboard/          # Streamlit UI
│   ├── scraper/            # Core Logic (Playwright)
│   └── scripts/            # Utilities
├── docker-compose.yml
└── requirements.txt
```

---

**Author**: Medalcode
**License**: MIT
