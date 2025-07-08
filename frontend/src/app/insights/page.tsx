'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

// Define the structure of a Transaction object
interface Transaction {
  id: number;
  timestamp: string;
  signature: string;
  source: string;
  amount: number; // This is the token quantity, not the raw amount
  transaction_type: 'buy' | 'sell' | 'unknown';
  wallet: string;
}

export default function InsightsDashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllTransactions() {
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
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const buyVolume = transactions.filter(t => t.transaction_type === 'buy').reduce((acc, t) => acc + t.amount, 0);
  const sellVolume = transactions.filter(t => t.transaction_type === 'sell').reduce((acc, t) => acc + t.amount, 0);
  const netDirection = buyVolume - sellVolume;
  const protocolCounts = transactions.reduce((acc, t) => {
    const protocol = t.source || 'Unknown';
    acc[protocol] = (acc[protocol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
            <ul className="space-y-2">
              {Object.entries(protocolCounts).map(([protocol, count]) => (
                <li key={protocol} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                  <span className="font-mono text-gray-300">{protocol}</span>
                  <span className="font-semibold text-white">{count} transactions</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
