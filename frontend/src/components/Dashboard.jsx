import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Default avatar as a data URL (a simple gray avatar)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Dashboard = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchUserUrls();
    }
  }, [user]);

  const fetchUserUrls = async () => {
    if (!user?._id) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/users/${user._id}/urls`);
      setUrls(response.data.urls || []);
      const total = (response.data.urls || []).reduce((sum, url) => sum + (url.clicks || 0), 0);
      setTotalClicks(total);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError('Failed to load URLs. Please try again later.');
      setUrls([]);
      setTotalClicks(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-base sm:text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
            {/* Header with navigation */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            {error && (
              <div className="mb-4 sm:mb-6 bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-xl relative text-sm sm:text-base">
                <span className="block pr-8">{error}</span>
                <button
                  className="absolute top-0 bottom-0 right-0 px-2 sm:px-4 py-2 sm:py-3"
                  onClick={() => setError(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-xl">
                <h3 className="text-base sm:text-lg font-semibold text-blue-700">Total URLs Created</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{urls.length}</p>
              </div>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-xl">
                <h3 className="text-base sm:text-lg font-semibold text-blue-700">Total Clicks</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{totalClicks}</p>
              </div>
            </div>

            {/* URLs List */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Your URLs</h3>
              {isLoading ? (
                <div className="flex justify-center items-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {urls.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No URLs created yet.</p>
                  ) : (
                    urls.map((url) => (
                      <div
                        key={url._id}
                        className="border rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${API_URL}/${url.shortUrl}`}
                            alt="QR Code"
                            className="w-20 h-20 object-contain rounded-lg mx-auto sm:mx-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                              {new Date(url.createdAt).toLocaleDateString()} at {new Date(url.createdAt).toLocaleTimeString()}
                            </p>
                            <a
                              href={url.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all text-sm sm:text-base block text-center sm:text-left"
                            >
                              {url.originalUrl}
                            </a>
                            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                              Short URL:{' '}
                              <a
                                href={`${API_URL}/${url.shortUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {`${API_URL}/${url.shortUrl}`}
                              </a>
                            </p>
                          </div>
                          <div className="flex flex-row sm:flex-col items-center justify-center min-w-[80px] bg-blue-50 px-3 py-1 sm:px-4 sm:py-2 rounded-full">
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">{url.clicks}</p>
                            <p className="text-xs sm:text-sm text-gray-500 ml-1 sm:ml-0">clicks</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 