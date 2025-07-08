'use client';

'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { cache } from '../../cache';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Define the structure of a Transaction object
interface Transaction {
  id: number;
  timestamp: string;
  signature: string;
  source: string; // The protocol is mapped to 'source'
  amount: number; // This is the token quantity, not the raw amount
  transaction_type: 'buy' | 'sell' | 'unknown';
  wallet: string; // The wallet_address is mapped to 'wallet'
  protocol: string; // Add protocol to capture the original field
}

export default function InsightsDashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllTransactions() {
      const cachedData = cache.get('all-transactions');
      if (cachedData) {
        setTransactions(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const allTransactions: Transaction[] = [];
      let url = 'http://localhost:8000/api/transactions/';

      try {
        while (url) {
          const response = await axios.get(url);
          allTransactions.push(...response.data.results);
          url = response.data.next; // Get the URL for the next page
        }
        setTransactions(allTransactions);
        cache.set('all-transactions', allTransactions, 5 * 60 * 1000); // 5 minute TTL
      } catch (err: any) {
        let errorMessage = 'Failed to fetch transaction data. Is the backend server running?';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage += ` (Status: ${err.response.status})`;
          console.error('API Response Error:', err.response.data);
        } else {
          console.error('API Error:', err);
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchAllTransactions();
  }, []);

  // Basic analytics calculations
  const totalVolume = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const buyVolume = transactions.filter(t => t.transaction_type === 'buy').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const sellVolume = transactions.filter(t => t.transaction_type === 'sell').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const netDirection = buyVolume - sellVolume;
  const protocolCounts = transactions.reduce((acc, t) => {
    const protocol = t.source || 'Unknown';
    acc[protocol] = (acc[protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData: ChartData<'pie'> = {
    labels: Object.keys(protocolCounts),
    datasets: [
      {
        data: Object.values(protocolCounts),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#E7E9ED',
          '#8DDF5A',
          '#E84393',
          '#00B894',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#E7E9ED',
          '#8DDF5A',
          '#E84393',
          '#00B894',
        ],
        borderColor: '#4A5568', // A dark border for contrast
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Insights Dashboard</h1>

      {loading && <p className="text-gray-400">Loading insights...</p>}
      {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stat Cards */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Total Volume</h3>
            <p className="text-2xl font-semibold text-white">{totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Net Direction (Buy - Sell)</h3>
            <p className={`text-2xl font-semibold ${netDirection >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netDirection.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Total Transactions</h3>
            <p className="text-2xl font-semibold text-white">{transactions.length}</p>
          </div>

          {/* Protocol Usage Breakdown */}
          <div className="md:col-span-2 lg:col-span-3 bg-gray-900 p-6 rounded-lg mt-6">
            <h2 className="text-xl font-bold mb-4 text-white">Protocol Usage</h2>
            <div style={{ height: '400px', width: '100%' }}>
              <Pie
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: '#E2E8F0', // Light gray for legend text
                        boxWidth: 20,
                        padding: 20,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
