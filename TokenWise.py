import os
import sys
from pathlib import Path
import django
import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import datetime, timedelta

# --- Django Setup ---
PROJECT_ROOT = Path(__file__).resolve().parent / 'tokenwise'
sys.path.append(str(PROJECT_ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tokenwise.settings')
django.setup()

from tracker.models import Wallet, Transaction

# --- Helper Functions ---
def load_data(start_date, end_date):
    """Load wallets and filtered transactions from the database."""
    wallets = Wallet.objects.all().order_by('-balance')
    transactions = Transaction.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    ).order_by('-timestamp')
    return wallets, transactions

def to_csv(df):
    """Convert DataFrame to CSV for download."""
    return df.to_csv(index=False).encode('utf-8')

# --- Main Dashboard --- 
def main():
    st.set_page_config(layout="wide", page_title="TokenWise Insights Dashboard")
    st.title("TokenWise Insights Dashboard")

    # --- Sidebar and Filters ---
    st.sidebar.header("Filters")
    start_date = st.sidebar.date_input("Start Date", datetime.now() - timedelta(days=7))
    end_date = st.sidebar.date_input("End Date", datetime.now())

    if start_date > end_date:
        st.sidebar.error("Error: End date must fall after start date.")
        return

    # --- Load Data ---
    wallets, transactions = load_data(start_date, end_date)

    if not transactions.exists():
        st.warning("No transactions found for the selected date range.")
        return

    # --- Prepare DataFrames ---
    tx_df = pd.DataFrame.from_records(transactions.values(
        'timestamp', 'wallet__address', 'transaction_type', 'amount', 'protocol', 'signature'
    ))
    tx_df.rename(columns={'wallet__address': 'wallet_address'}, inplace=True)

    # --- Key Metrics ---
    st.header("Real-Time Transaction Insights")
    total_buys = tx_df[tx_df['transaction_type'] == 'BUY']['amount'].count()
    total_sells = tx_df[tx_df['transaction_type'] == 'SELL']['amount'].count()
    net_direction = total_buys - total_sells

    col1, col2, col3 = st.columns(3)
    col1.metric("Total Buys", f"{total_buys:,}")
    col2.metric("Total Sells", f"{total_sells:,}")
    col3.metric("Net Direction", f"{net_direction:,}", delta=f"{net_direction:+} transactions")

    # --- Visualizations ---
    st.header("Visual Analysis")
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Protocol Usage")
        protocol_counts = tx_df['protocol'].value_counts().reset_index()
        protocol_counts.columns = ['protocol', 'count']
        fig_protocol = px.pie(protocol_counts, names='protocol', values='count', 
                                title="Transaction Distribution by Protocol", hole=.3)
        st.plotly_chart(fig_protocol, use_container_width=True)

    with col2:
        st.subheader("Repeated Activity")
        activity_counts = tx_df['wallet_address'].value_counts().reset_index()
        activity_counts.columns = ['wallet_address', 'transaction_count']
        fig_activity = px.bar(activity_counts.head(10), x='wallet_address', y='transaction_count',
                                title="Top 10 Wallets by Transaction Volume")
        st.plotly_chart(fig_activity, use_container_width=True)

    # --- Historical Data Table ---
    st.header("Historical Transaction Data")
    st.dataframe(tx_df, use_container_width=True)
    st.download_button(
        label="Download Data as CSV",
        data=to_csv(tx_df),
        file_name=f'tokenwise_transactions_{start_date}_to_{end_date}.csv',
        mime='text/csv',
    )

    # --- Top Wallet Holders ---
    st.header("Top Wallet Holders")
    if wallets.exists():
        wallet_df = pd.DataFrame.from_records(wallets.values('address', 'balance'))
        st.dataframe(wallet_df, use_container_width=True)
    else:
        st.warning("No wallet data found.")

if __name__ == '__main__':
    main()
