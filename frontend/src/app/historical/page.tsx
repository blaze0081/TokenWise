'use client';

'use client';

import { useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../apiConfig';
// Define the structure of a Transaction object
interface Transaction {
  id: string;
  timestamp: string;
  signature: string;
  protocol: string;
  amount: number;
  transaction_type: 'buy' | 'sell' | 'unknown';
  wallet_address: string;
}

// Define the structure for the paginated API response
interface PaginatedTransactionsResponse {
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export default function HistoricalAnalysisPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const fetchAllTransactionsForExport = async (): Promise<Transaction[]> => {
    setExporting(true);
    setError(null);
    let allTransactions: Transaction[] = [];
    let url: string | null = `${API_BASE_URL}/historical-transactions/?start_date=${startDate}&end_date=${endDate}`;

    try {
      while (url) {
        const response: AxiosResponse<PaginatedTransactionsResponse> = await axios.get(url);
        allTransactions = allTransactions.concat(response.data.results);
        url = response.data.next;
      }
    } catch (err) {
      setError('Failed to fetch all transaction data for export.');
      console.error('API Error:', err);
      return [];
    } finally {
      setExporting(false);
    }
    return allTransactions;
  };

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
            const url = `${API_BASE_URL}/historical-transactions/?start_date=${startDate}&end_date=${endDate}&page=${page}`;
      const response: AxiosResponse<PaginatedTransactionsResponse> = await axios.get(url);
      setTransactions(response.data.results);
      setNextPageUrl(response.data.next);
      setPrevPageUrl(response.data.previous);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to fetch transaction data. Is the backend server running?');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // Fetch initial data without date filters
    fetchTransactions();
  }, [fetchTransactions]); // Run only once on initial load

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  const exportToCSV = async () => {
    const allTransactions = await fetchAllTransactionsForExport();
    if (!allTransactions.length) {
      alert('No transaction data to export.');
      return;
    }
    const csv = Papa.unparse(allTransactions, {
      header: true,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `transactions_${startDate}_to_${endDate}.csv`);
  };

  const exportToJSON = async () => {
    const allTransactions = await fetchAllTransactionsForExport();
    if (!allTransactions.length) {
      alert('No transaction data to export.');
      return;
    }
    const json = JSON.stringify(allTransactions, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `transactions_${startDate}_to_${endDate}.json`);
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
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Export CSV
        </button>
        <button
          onClick={exportToJSON}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Export JSON
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading transaction data...</p>}
      {exporting && <p className="text-yellow-400">Exporting all data, please wait...</p>}
      {error && <p className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</p>}

      {!loading && !error && (
        <>
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.transaction_type.toLowerCase() === 'buy' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
                      {t.transaction_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-right">{t.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{t.protocol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300">{t.wallet_address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400 hover:underline">
                    <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noopener noreferrer">
                      {`${t.signature.substring(0, 8)}...${t.signature.substring(t.signature.length - 8)}`}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button 
            onClick={() => fetchTransactions(currentPage - 1)} 
            disabled={!prevPageUrl}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-white">Page {currentPage}</span>
          <button 
            onClick={() => fetchTransactions(currentPage + 1)} 
            disabled={!nextPageUrl}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        </>
      )}
    </div>
  );
}
