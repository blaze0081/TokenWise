'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiConfig';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Define the structure for the dashboard data from the new endpoint
interface ProtocolUsage {
  protocol: string;
  count: number;
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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
