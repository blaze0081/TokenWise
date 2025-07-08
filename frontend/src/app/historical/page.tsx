'use client';

import { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { cache } from '../../cache';

// Define the structure of a Transaction object
interface Transaction {
  id: string;
  timestamp: string;
  signature: string;
  protocol: string;
  api_amount: number;
  transaction_type: 'buy' | 'sell' | 'unknown';
  wallet_address: string;
}

// Define the structure for the paginated API response
interface PaginatedTransactionsResponse {
  next: string | null;
  results: Transaction[];
}

export default function HistoricalAnalysisPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    const cacheKey = `historicalTransactions-${startDate}-${endDate}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      setTransactions(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let allTransactions: Transaction[] = [];
      let url: string | null = `http://localhost:8000/api/historical-transactions/?start_date=${startDate}&end_date=${endDate}`;

      while (url) {
        const response: AxiosResponse<PaginatedTransactionsResponse> = await axios.get(url);
        allTransactions = allTransactions.concat(response.data.results);
        url = response.data.next;
      }
      setTransactions(allTransactions);
      cache.set(cacheKey, allTransactions);
    } catch (err) {
      setError('Failed to fetch transaction data. Is the backend server running?');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data without date filters
    fetchTransactions();
  }, []); // Run only once on initial load

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Historical Analysis</h1>

      <div className="flex space-x-4 mb-6">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded-lg"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded-lg"
        />
        <button
          onClick={fetchTransactions}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Apply Filter
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading transaction data...</p>}
      {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</p>}

      {!loading && !error && (
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Protocol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Signature</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatTimestamp(t.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.transaction_type === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">{typeof t.api_amount === 'number' ? t.api_amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{t.protocol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{t.wallet_address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400 hover:underline">
                    <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noopener noreferrer">
                      {`${t.signature.substring(0, 6)}...${t.signature.substring(t.signature.length - 6)}`}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
