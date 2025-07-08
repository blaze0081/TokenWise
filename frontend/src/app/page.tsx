'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Define the structure of a Wallet object
interface Wallet {
  address: string;
  token_quantity: number;
  balance_usd: number;
}

// Define structure for CoinGecko data
interface SolanaStatsData {
  price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
}

const SolanaStats = () => {
  const [stats, setStats] = useState<SolanaStatsData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolanaData = async () => {
      setLoading(true);
      try {
                const response = await axios.get(`${API_BASE_URL}/solana-stats/`);
        setStats(response.data);
        // The chart data is now a part of the main stats object
        const formattedChartData = response.data.chart_data.map((p: [number, number]) => ({
          date: new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: p[1],
        }));
        setChartData(formattedChartData);
      } catch (error) {
        console.error("Failed to fetch Solana stats from backend", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolanaData();
  }, []);

  if (loading) {
    return <div className="text-center p-8 text-gray-400">Loading Solana market data...</div>;
  }

  if (!stats) {
    return <div className="text-center p-8 text-red-500">Failed to load market data.</div>;
  }

  return (
    <div className="mb-8 p-6 bg-gray-900 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left side: Stats */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center space-x-4">
            <Image src="https://assets.coingecko.com/coins/images/4128/large/solana.png" alt="Solana" width={48} height={48} />
            <div>
              <h2 className="text-2xl font-bold text-white">Solana <span className="text-gray-500">SOL</span></h2>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-white">${stats.price.toLocaleString()}</p>
                <p className={`text-lg font-semibold ${stats.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.price_change_percentage_24h.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Market Cap</p>
              <p className="font-semibold text-white">${stats.market_cap.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Volume (24h)</p>
              <p className="font-semibold text-white">${stats.total_volume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Circulating Supply</p>
              <p className="font-semibold text-white">{stats.circulating_supply.toLocaleString()} SOL</p>
            </div>
            <div>
              <p className="text-gray-400">Total Supply</p>
              <p className="font-semibold text-white">{stats.total_supply.toLocaleString()} SOL</p>
            </div>
          </div>
        </div>

        {/* Right side: Chart */}
        <div className="md:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} 
                labelStyle={{ color: '#D1D5DB' }}
              />
              <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default function TopWalletDiscoveryPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    async function fetchWallets() {
      setLoading(true);
      try {
                const response = await axios.get(`${API_BASE_URL}/wallets/?page=${currentPage}`);
        setWallets(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 10)); // Assuming 10 items per page
      } catch (err) {
        setError('Failed to fetch wallet data. Is the backend server running?');
        console.error('API Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWallets();
  }, [currentPage]);

  return (
    <div className="w-full p-6">
      <SolanaStats />
      
      <h1 className="text-3xl font-bold mb-6 text-white">Top Wallet Holders</h1>

      {/* Display loading state */}
      {loading && <p className="text-gray-400">Loading wallet data...</p>}

      {/* Display error message if fetching fails */}
      {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</p>}

      {/* Display the data table when loading is complete and there's no error */}
      {!loading && !error && (
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Token Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Balance (USD)</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {wallets.map((wallet) => (
                <tr key={wallet.address}>
                  <td 
                    className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400 hover:text-blue-300 cursor-pointer"
                    onClick={() => router.push(`/monitoring?address=${wallet.address}`)}
                  >
                    {wallet.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">{wallet.token_quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">${wallet.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center items-center mt-6">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-l disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 bg-gray-800 text-white">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-r disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
