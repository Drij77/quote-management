"use client";

import { Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quoteService } from '@/lib/api/quotes';
import type { Quote } from '@/types';
import { useState, useEffect } from 'react';

function QuoteDetails({ quote, onDelete }: { quote: Quote; onDelete: () => void }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Quotes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{quote.customerName}</h1>
            <p className="text-gray-600">
              Date: {new Date(quote.date).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Status: <span className="capitalize">{quote.status}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              Total: ${quote.total.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quote.products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${(product.price * product.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {quote.notes && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Notes</h2>
            <p className="text-gray-600">{quote.notes}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Link
            href={`/quotes/${quote.id}/edit`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Edit Quote
          </Link>
          <button
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete Quote
          </button>
          <Link
            href="/"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Back to List
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <p className="text-gray-600">Loading quote...</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <div className="mt-4">
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-600 mt-2 inline-block"
          >
            Back to Quotes
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuoteData({ id }: { id: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) {
        setError('Quote ID is required');
        return;
      }

      try {
        console.log('Fetching quote with ID:', id);
        const data = await quoteService.getQuoteById(id);
        console.log('Received quote data:', data);
        setQuote(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching quote:', err);
        let errorMessage = 'Failed to load quote. Please try again later.';
        
        if (err instanceof Error) {
          if (err.message.includes('server is running')) {
            errorMessage = 'Unable to connect to the server. Please ensure the server is running.';
          } else if (err.message.includes('Invalid server response')) {
            errorMessage = 'Server configuration error. Please check the server setup.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setQuote(null);
      }
    };

    fetchQuote();
  }, [id]);

  const handleDelete = async () => {
    if (!quote) return;

    if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await quoteService.deleteQuote(quote.id);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quote');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!quote) {
    return <LoadingState />;
  }

  return <QuoteDetails quote={quote} onDelete={handleDelete} />;
}

export default function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  if (!resolvedParams?.id) {
    return <ErrorState error="Quote ID is required" />;
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <QuoteData id={resolvedParams.id} />
    </Suspense>
  );
} 