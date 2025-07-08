'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../apiConfig';

// Define the structure of Wallet and Transaction objects
interface Wallet {
  address: string;
  token_quantity: number;
}

interface Transaction {
  id: string; // Use signature as the unique ID
  timestamp: string;
  signature: string;
  protocol: string;
  amount: number;
  transaction_type: 'buy' | 'sell' | 'unknown';
}

interface PaginatedTransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export default function WalletMonitoring() {
  const searchParams = useSearchParams();
  const [walletAddress, setWalletAddress] = useState(searchParams.get('address') || '');
  const [monitoredWallet, setMonitoredWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const handleMonitor = async (page = 1) => {
    if (!walletAddress) {
      setError('Please enter a wallet address.');
      return;
    }
    setLoading(true);
    setError(null);

    if (page === 1) {
      setMonitoredWallet(null);
      setTransactions([]);
    }

    try {
      if (page === 1) {
                const walletRes = await axios.get(`${API_BASE_URL}/wallets/${walletAddress}/`);
        setMonitoredWallet(walletRes.data);
      }

            const txUrl = `${API_BASE_URL}/transactions/?wallet_address=${walletAddress}&page=${page}`;
      const txRes: AxiosResponse<PaginatedTransactionsResponse> = await axios.get(txUrl);
      
      setTransactions(txRes.data.results);
      setNextPageUrl(txRes.data.next);
      setPrevPageUrl(txRes.data.previous);
      setCurrentPage(page);

    } catch (err) {
      setError(`Failed to fetch data for wallet ${walletAddress}. Please check the address and try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const addressFromUrl = searchParams.get('address');
    if (addressFromUrl) {
      setWalletAddress(addressFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (walletAddress) {
      handleMonitor();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

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
            placeholder="Enter Solana wallet address"
            className="flex-grow bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleMonitor(1)}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-600 transition-colors duration-300"
          >
            {loading ? 'Loading...' : 'Monitor Wallet'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {monitoredWallet && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Monitored Wallet</h2>
          <p className="text-gray-400">Address: <span className="font-mono text-purple-400">{monitoredWallet.address}</span></p>
          <p className="text-gray-400">Token Quantity: <span className="font-bold text-white">{monitoredWallet.token_quantity.toLocaleString()}</span></p>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-white">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-800 text-gray-300 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount (SOL)</th>
                  <th className="p-3">Protocol</th>
                  <th className="p-3">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800 transition-colors duration-200">
                    <td className="p-3 font-mono text-gray-400">{formatTimestamp(tx.timestamp)}</td>
                    <td className={`p-3 font-bold ${tx.transaction_type.toLowerCase() === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.transaction_type}
                    </td>
                    <td className="p-3 font-mono text-white">{tx.amount.toFixed(4)}</td>
                    <td className="p-3 text-gray-400">{tx.protocol}</td>
                    <td className="p-3">
                      <a 
                        href={`https://solscan.io/tx/${tx.signature}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 font-mono text-xs"
                      >
                        {`${tx.signature.substring(0, 8)}...`}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-6">
            <button onClick={() => handleMonitor(currentPage - 1)} disabled={!prevPageUrl || loading} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-gray-400">Page {currentPage}</span>
            <button onClick={() => handleMonitor(currentPage + 1)} disabled={!nextPageUrl || loading} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
