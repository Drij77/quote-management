import React from 'react';
import { Product } from '@/types';

interface ProductFormProps {
  products: Product[];
  onProductsChange: (products: Product[]) => void;
  disabled?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  products,
  onProductsChange,
  disabled = false
}) => {
  const addProduct = () => {
    onProductsChange([...products, { name: '', price: 0, quantity: 1 }]);
  };

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    onProductsChange(newProducts);
  };

  const removeProduct = (index: number) => {
    onProductsChange(products.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Products</h3>
        {!disabled && (
          <button
            type="button"
            onClick={addProduct}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            + Add Product
          </button>
        )}
      </div>

      {products.map((product, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => updateProduct(index, 'name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={disabled}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              value={product.price}
              onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={disabled}
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={product.quantity}
              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={disabled}
              required
              min="1"
            />
          </div>
          <div className="flex items-end">
            {!disabled && products.length > 1 && (
              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                Remove
              </button>
            )}
            <div className="ml-auto text-sm text-gray-500">
              Subtotal: ${(product.price * product.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No products added yet
        </div>
      )}
    </div>
  );
}; 