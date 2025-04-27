"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quoteService } from '@/lib/api/quotes';
import type { Quote, Product } from '@/types';

export default function EditQuotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<Product[]>([{ name: '', price: 0, quantity: 1 }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const quote = await quoteService.getQuoteById(params.id);
        setCustomerName(quote.customerName);
        setProducts(quote.products);
        setError(null);
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [params.id]);

  const addProduct = () => {
    setProducts([...products, { name: '', price: 0, quantity: 1 }]);
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const total = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
      await quoteService.updateQuote(params.id, {
        customerName,
        products,
        date: new Date().toISOString(),
        total,
        status: 'draft'
      });

      router.push(`/quotes/${params.id}`);
    } catch (error) {
      console.error('Error updating quote:', error);
      setError(error instanceof Error ? error.message : 'Failed to update quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Link 
            href={`/quotes/${params.id}`}
            className="text-blue-500 hover:text-blue-600 mt-2 inline-block"
          >
            Back to Quote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/quotes/${params.id}`}
          className="text-blue-500 hover:text-blue-600"
        >
          ← Back to Quote
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Quote</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Products</h2>
              <button
                type="button"
                onClick={addProduct}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Add Product
              </button>
            </div>

            {products.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove Product
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href={`/quotes/${params.id}`}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 