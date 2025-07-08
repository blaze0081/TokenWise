'use client';

import { useState } from 'react';
import axios from 'axios';

// Define the structure of Wallet and Transaction objects
interface Wallet {
  address: string;
  token_quantity: number;
}

interface Transaction {
  id: number;
  timestamp: string;
  signature: string;
  source: string;
  amount: number;
  transaction_type: 'buy' | 'sell' | 'unknown';
}

export default function WalletMonitoringPage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [monitoredWallet, setMonitoredWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMonitor = async () => {
    if (!walletAddress) {
      setError('Please enter a wallet address.');
      return;
    }
    setLoading(true);
    setError(null);
    setMonitoredWallet(null);
    setTransactions([]);

    try {
      // Fetch wallet details and transactions concurrently
      const [walletRes, txRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/wallets/${walletAddress}/`),
        axios.get(`http://localhost:8000/api/transactions/?wallet=${walletAddress}`)
      ]);

      setMonitoredWallet(walletRes.data);
      setTransactions(txRes.data);

    } catch (err) {
      setError(`Failed to fetch data for wallet ${walletAddress}. Please check the address and try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => new Date(ts).toLocaleString();

  return (
    <div className="w-full p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Wallet Monitoring</h1>

      {/* Input Form */}
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana Wallet Address"
            className="flex-grow bg-gray-800 text-white placeholder-gray-500 rounded-md p-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleMonitor}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Monitor Wallet'}
          </button>
        </div>
        {error && !loading && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* Results Display */}
      {monitoredWallet && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white">Monitoring Details</h2>
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <p className="text-gray-400">Address: <span className="font-mono text-white">{monitoredWallet.address}</span></p>
            <p className="text-gray-400">Token Balance: <span className="font-semibold text-white">{monitoredWallet.token_quantity.toLocaleString()}</span></p>
          </div>

          <h3 className="text-xl font-bold mb-4 text-white">Recent Transactions</h3>
          <div className="bg-gray-900 rounded-lg shadow-lg overflow-x-auto">
            <table className="min-w-full">
              {/* Table similar to historical analysis */}
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Protocol</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">{t.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{t.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
