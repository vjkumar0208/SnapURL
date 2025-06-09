import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout/Layout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Default avatar as a data URL (a simple gray avatar)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Home = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    try {
      if (!originalUrl) {
        setError('Please enter a URL to shorten');
        return;
      }

      setError('');
      setIsLoading(true);
      const res = await axios.post(`${API_URL}/api/short`, { 
        originalUrl,
        userId: user?._id
      });
      setShortUrl(res.data);
      setShortCode(res.data.shortUrl || '');
      setIsSuccess(true);
    } catch (err) {
      console.error("API error", err);
      setError('Failed to shorten URL. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Add handler for URL input change
  const handleUrlChange = (e) => {
    setOriginalUrl(e.target.value);
    setIsSuccess(false); // Reset success state when user starts typing new URL
  };

  return (
    <Layout>
      <div className='min-h-[80vh] flex items-center justify-center p-2 sm:p-4'>
        <div className='bg-white rounded-xl shadow-xl p-4 sm:p-8 w-full max-w-lg mx-2'>
          <div className='flex flex-col items-center space-y-4 sm:space-y-6'>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">SnapURL</h1>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-2 sm:mb-4">Enter your long URL and get a shortened version instantly!</p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg relative w-full text-sm sm:text-base">
                <span className="block pr-8">{error}</span>
                <button
                  className="absolute top-0 bottom-0 right-0 px-2 sm:px-4 py-2 sm:py-3"
                  onClick={() => setError('')}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-4 w-4 sm:h-6 sm:w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <title>Close</title>
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                  </svg>
                </button>
              </div>
            )}

            <div className="w-full space-y-3 sm:space-y-4">
              <input
                value={originalUrl}
                placeholder='Enter the URL to shorten'
                onChange={handleUrlChange}
                type="text"
                className='w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-center'
              />

              <button
                onClick={handleSubmit}
                type='button'
                className='w-full bg-blue-600 text-white rounded-lg py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base font-medium shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all duration-200'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : isSuccess ? (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Shortened!
                  </div>
                ) : (
                  'Go Short'
                )}
              </button>
            </div>

            {shortUrl && (
              <div className='w-full p-3 sm:p-6 bg-gray-50 rounded-xl border border-gray-200 flex flex-col space-y-3 sm:space-y-4 items-center'>
                <p className='text-gray-700 font-bold text-base sm:text-lg'>Shortened URL:</p>
                <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full justify-center'>
                  <a
                    href={shortUrl?.fullShortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className='text-blue-600 hover:underline break-all text-center text-sm sm:text-base'
                  >
                    {shortUrl?.fullShortUrl}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shortUrl?.fullShortUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className='bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-all text-xs sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap'
                  >
                    {copied ? (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <img 
                  src={shortUrl.qrCodeImg} 
                  alt="QR Code" 
                  className="w-32 sm:w-48 max-w-[200px] rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home; 