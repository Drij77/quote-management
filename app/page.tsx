"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Quote {
  id: string;
  customerName: string;
  products: {
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  date: string;
}

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/quotes');
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        setQuotes(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quotes:', err);
        setError('Failed to load quotes. Please make sure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Saved Quotes</h1>
        <Link 
          href="/quotes/new"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add New Quote
        </Link>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading quotes...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <p className="text-sm mt-2">Make sure the server is running on port 3001.</p>
        </div>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No quotes found. Create your first quote!</p>
        </div>
      )}

      <div className="grid gap-4">
        {quotes.map((quote) => (
          <div 
            key={quote.id}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{quote.customerName}</h2>
                <p className="text-gray-600">Date: {new Date(quote.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">Total: ${quote.total.toFixed(2)}</p>
                <Link 
                  href={`/quotes/${quote.id}`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 