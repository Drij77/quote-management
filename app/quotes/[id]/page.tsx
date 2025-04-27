"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { quoteService } from '@/lib/api/quotes';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ProductForm } from '@/components/quotes/ProductForm';
import type { Quote, Product } from '@/types';

export default function QuoteDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const data = await quoteService.getQuoteById(id);
        setQuote(data);
        setCustomerName(data.customerName);
        setProducts(data.products);
        setError(null);
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (quote) {
      setCustomerName(quote.customerName);
      setProducts(quote.products);
    }
  };

  const handleSave = async () => {
    try {
      const total = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      
      const updatedQuote = await quoteService.updateQuote(id, {
        customerName,
        products,
        date: quote?.date || new Date().toISOString(),
        total,
        status: quote?.status || 'draft'
      });

      setQuote(updatedQuote);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating quote:', error);
      setError(error instanceof Error ? error.message : 'Failed to update quote');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await quoteService.deleteQuote(id);
      router.push('/');
    } catch (error) {
      console.error('Error deleting quote:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete quote');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" className="my-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={error} 
          onRetry={() => router.refresh()} 
          className="mb-4" 
        />
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← Back to Quotes
        </Link>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Quote not found</p>
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          ← Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Edit Quote' : 'Quote Details'}
        </h1>
        <Link 
          href="/"
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Quotes
        </Link>
      </div>

      {isEditing ? (
        <div className="max-w-2xl">
          <div className="mb-6">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <ProductForm
            products={products}
            onProductsChange={setProducts}
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quote Information
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Customer Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {quote.customerName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(quote.date).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Status
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Total
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${quote.total.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <ProductForm
            products={quote.products}
            onProductsChange={() => {}}
            disabled
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Quote'}
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Edit Quote
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 