"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  name: string;
  price: number;
  quantity: number;
}

export default function NewQuote() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<Product[]>([{ name: '', price: 0, quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addProduct = () => {
    setProducts([...products, { name: '', price: 0, quantity: 1 }]);
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          products,
          date: new Date().toISOString(),
          total: products.reduce((sum, product) => sum + (product.price * product.quantity), 0),
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server responded with status: ${response.status}. ${errorData}`);
      }

      router.push('/');
    } catch (error) {
      console.error('Error creating quote:', error);
      setError('Failed to create quote. Please make sure the server is running on port 3001.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Quote</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <p className="text-sm mt-2">Make sure the server is running on port 3001.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="max-w-2xl">
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
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          {products.map((product, index) => (
            <div key={index} className="mb-4 p-4 border rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={isSubmitting}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    min="1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              {products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="mt-2 text-red-500 hover:text-red-600"
                  disabled={isSubmitting}
                >
                  Remove Product
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addProduct}
            className="text-blue-500 hover:text-blue-600"
            disabled={isSubmitting}
          >
            + Add Another Product
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Quote'}
          </button>
        </div>
      </form>
    </div>
  );
} 