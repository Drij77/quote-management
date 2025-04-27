import React from 'react';
import { Product } from '@/types';

interface ProductFormProps {
  product: Product;
  onChange: (product: Product) => void;
  onRemove: () => void;
}

export default function ProductForm({ product, onChange, onRemove }: ProductFormProps) {
  const handleChange = (field: keyof Product, value: string | number) => {
    onChange({
      ...product,
      [field]: value,
    });
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleChange('name', e.target.value)}
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
            onChange={(e) => handleChange('price', parseFloat(e.target.value))}
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
            onChange={(e) => handleChange('quantity', parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            required
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 hover:text-red-600"
      >
        Remove Product
      </button>
    </div>
  );
} 