# TokenWise - Solana On-Chain Intelligence Platform

TokenWise is a full-stack web application designed to provide actionable intelligence on the Solana blockchain. It moves beyond simple transaction tracking to offer strategic insights by focusing on the market's most influential wallets. By caching and analyzing on-chain data, TokenWise delivers a fast, responsive, and insightful user experience.

## Features

- **Insights Dashboard:** Get a real-time overview of the market with key metrics like Total Volume and Net Direction.
- **Top Wallet Discovery:** Identify and monitor the largest token holders and their balances in USD.
- **Deep Historical Analysis:** Dive into the complete transaction history of any tracked wallet with powerful filtering and pagination.
- **Protocol Usage Visualization:** Understand which dApps and protocols are trending with a clean, intuitive pie chart.
- **Asynchronous Data Refresh:** The application's data can be refreshed from live on-chain sources in the background without interrupting the user experience.

## Architecture Overview

TokenWise is built on a modern, decoupled architecture:

- **Frontend:** A responsive and interactive UI built with **Next.js** and **TypeScript**.
- **Backend:** A powerful REST API powered by **Django** and **Django REST Framework**.
- **Database:** A **PostgreSQL** database that serves as the single source of truth, caching all on-chain and market data.
- **Asynchronous Task Queue:** A **Celery** and **Redis** system to handle long-running data ingestion tasks in the background, ensuring the application remains fast and responsive.
- **External Data Sources:** Leverages the **Helius API** for all Solana blockchain data and the **CoinGecko API** for cryptocurrency market data.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Axios, Tailwind CSS
- **Backend:** Python, Django, Django REST Framework
- **Database:** PostgreSQL
- **Task Processing:** Celery, Redis
- **APIs:** Helius, CoinGecko

---

## Getting Started: Setup and Installation

Follow these instructions to get the TokenWise application running on your local machine.

### Prerequisites

- Python 3.10+
- Node.js v18+ and npm
- PostgreSQL
- Redis

### 1. Clone the Repository

```bash
git clone https://github.com/blaze0081/TokenWise
cd TokenWise
```

### 2. Backend Setup (Django)

The backend is located in the `tokenwise/` directory.

**a. Create and Activate a Virtual Environment:**

```bash
cd tokenwise
python3 -m venv venv
source venv/bin/activate
```

**b. Install Python Dependencies:**

```bash
pip install -r requirements.txt
```

**c. Configure Environment Variables:**

Create a `.env` file in the `tokenwise/tokenwise/` directory (alongside `settings.py`). Add the following, replacing the placeholder values:

```env
# SOLANA RPC
SOLANA_RPC_URL

```

**d. Set up the Database:**

Make sure your PostgreSQL server is running. Then, run the migrations to create the database tables:

```bash
python manage.py migrate
```
Change you PostgreSQL settings in settings.py

### 3. Frontend Setup (Next.js)

The frontend is located in the `frontend/` directory.

**a. Navigate to the Frontend Directory:**

```bash
cd ../frontend
```

**b. Install Node.js Dependencies:**

```bash
npm install

npm run build
```

The frontend is configured to connect to the backend at `http://localhost:8000` and needs no further setup.

---

## Running the Application

To run the application, you need to start the Redis server, the Celery worker, the Django backend, and the Next.js frontend.

**1. Start Redis:**

Open a new terminal. Make sure your Redis server is running.

```bash
redis-server
```

**2. Start the Celery Worker:**

Open a new terminal. Navigate to the `tokenwise/` directory and activate the virtual environment.

```bash
cd tokenwise
source venv/bin/activate
celery -A tokenwise worker -l info
```

**3. Start the Django Backend Server:**

Open a new terminal. Navigate to the `tokenwise/` directory and activate the virtual environment.

```bash
cd tokenwise
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

**4. Start the Next.js Frontend Server:**

Open a new terminal. Navigate to the `frontend/` directory.

```bash
cd frontend
npm run dev
```

**5. Populate the Database:**

Your application is now running, but the database is empty. Open a new terminal, navigate to the `tokenwise/` directory, activate the virtual environment, and run the `refresh_data` command.

```bash
cd tokenwise
source venv/bin/activate
python manage.py refresh_data
```

This command will fetch all necessary data from the Helius and CoinGecko APIs and populate your database. You can re-run this command anytime you want to refresh the data.

Once the command completes, you can access the application at **http://localhost:3000** in your web browser.
