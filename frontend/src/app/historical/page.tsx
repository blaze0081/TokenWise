'use client';

import { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';

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

  useEffect(() => {
    async function fetchTransactions() {
      try {
        let allTransactions: Transaction[] = [];
        let url: string | null = 'http://localhost:8000/api/transactions/';
        while (url) {
          const response: AxiosResponse<PaginatedTransactionsResponse> = await axios.get(url);
          allTransactions = allTransactions.concat(response.data.results);
          url = response.data.next;
        }
        setTransactions(allTransactions);
      } catch (err) {
        setError('Failed to fetch transaction data. Is the backend server running?');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Historical Analysis</h1>

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
