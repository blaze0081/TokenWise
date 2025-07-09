'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiConfig';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartData,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Define the structure for the dashboard data from the new endpoint
interface ProtocolUsage {
  protocol: string;
  count: number;
}

interface WalletActivity {
  wallet_address: string;
  transaction_count: number;
}

interface PaginatedTransactionsResponse {
  next: string | null;
  results: { wallet_address: string }[];
}

interface DashboardData {
  total_volume: number;
  net_direction: number;
  total_transactions: number;
  protocol_usage: ProtocolUsage[];
}

export default function InsightsDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletActivity, setWalletActivity] = useState<WalletActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
            const response = await axios.get<DashboardData>(`${API_BASE_URL}/dashboard-metrics/`);
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try refreshing.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWalletActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      let allTransactions: { wallet_address: string }[] = [];
      let url: string | null = `${API_BASE_URL}/historical-transactions/`;
      while (url) {
        const response: { data: PaginatedTransactionsResponse } = await axios.get(url);
        allTransactions = allTransactions.concat(response.data.results);
        url = response.data.next;
      }

      const activityCounts = allTransactions.reduce((acc, tx) => {
        acc[tx.wallet_address] = (acc[tx.wallet_address] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sortedActivity = Object.entries(activityCounts)
        .map(([wallet_address, transaction_count]) => ({ wallet_address, transaction_count }))
        .sort((a, b) => b.transaction_count - a.transaction_count)
        .slice(0, 10); // Top 10

      setWalletActivity(sortedActivity);
    } catch (err) {
      setError('Failed to fetch wallet activity data.');
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchWalletActivity();
  }, [fetchDashboardData, fetchWalletActivity]);

  const activityChartData: ChartData<'bar'> = {
    labels: walletActivity.map(a => `${a.wallet_address.substring(0, 6)}...${a.wallet_address.substring(a.wallet_address.length - 4)}`),
    datasets: [
      {
        label: 'Number of Transactions',
        data: walletActivity.map(a => a.transaction_count),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        borderWidth: 1,
      },
    ],
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
            await axios.post(`${API_BASE_URL}/refresh-data/`);
      // After refresh is initiated, refetch the metrics to get the latest data
      await fetchDashboardData();
    } catch (err) {
      setError('Failed to start data refresh. The backend might be busy.');
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const chartData: ChartData<'pie'> = {
    labels: dashboardData?.protocol_usage.map(p => p.protocol || 'Unknown') || [],
    datasets: [
      {
        data: dashboardData?.protocol_usage.map(p => p.count) || [],
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Insights Dashboard</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading insights...</p>}
      {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</p>}

      {!loading && !error && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stat Cards */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Total Volume</h3>
            <p className="text-2xl font-semibold text-white">{dashboardData.total_volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Net Direction (Buy - Sell)</h3>
            <p className={`text-2xl font-semibold ${dashboardData.net_direction >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dashboardData.net_direction.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium">Total Transactions</h3>
            <p className="text-2xl font-semibold text-white">{dashboardData.total_transactions.toLocaleString()}</p>
          </div>

          {/* Protocol Usage Breakdown */}
          {/* Wallet Activity Chart */}
          <div className="md:col-span-2 lg:col-span-3 bg-gray-900 p-6 rounded-lg mt-6">
            <h2 className="text-xl font-bold mb-4 text-white">Top 10 Wallets by Activity</h2>
            {loadingActivity ? (
              <p className="text-gray-400">Loading wallet activity...</p>
            ) : (
              <div style={{ height: '400px', width: '100%' }}>
                <Bar
                  data={activityChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: '#E2E8F0' },
                        grid: { color: '#4A5568' },
                      },
                      x: {
                        ticks: { color: '#E2E8F0' },
                        grid: { color: '#4A5568' },
                      },
                    },
                  }}
                />
              </div>
            )}
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
