import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (productName: string, price: number, quantity: number) => void;
}

interface CustomProductData {
  name: string;
  price: string;
  quantity: string;
}

const CustomProductModal: React.FC<CustomProductModalProps> = memo(({ open, onClose, onSuccess }) => {
  const [product, setProduct] = useState<CustomProductData>({ name: '', price: '', quantity: '1' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProduct({ name: '', price: '', quantity: '1' });
      setError(null);
      const input = document.getElementById('product-name-input');
      if (input instanceof HTMLInputElement) {
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
  }, [open]);

  const validateProduct = useCallback((): string | null => {
    if (!product.name.trim()) {
      return 'Product name is required.';
    }

    if (product.name.length > 200) {
      return 'Product name cannot exceed 200 characters.';
    }

    if (!product.price.trim()) {
      return 'Price is required.';
    }

    const price = Number.parseFloat(product.price);
    if (Number.isNaN(price) || price <= 0) {
      return 'Price must be greater than 0.';
    }

    if (price > 999999.99) {
      return 'Price cannot exceed $999,999.99.';
    }

    if (!product.quantity.trim()) {
      return 'Quantity is required.';
    }

    const quantity = Number.parseFloat(product.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      return 'Quantity must be greater than 0.';
    }

    if (quantity > 99) {
      return 'Quantity cannot exceed 99.';
    }

    return null;
  }, [product]);

  const handleAddProduct = useCallback(() => {
    const validationError = validateProduct();
    if (validationError) {
      setError(validationError);
      return;
    }

    onSuccess(
      product.name.trim(),
      Number.parseFloat(product.price),
      Number.parseFloat(product.quantity)
    );
    setProduct({ name: '', price: '', quantity: '1' });
    setError(null);
  }, [product, validateProduct, onSuccess]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddProduct();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleAddProduct, onClose],
  );

  const handleInputChange = useCallback((field: keyof CustomProductData, value: string) => {
    setProduct(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  }, [error]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Add Custom Product</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label htmlFor="product-name-input" className="block text-sm font-medium text-slate-700">
              Product Name *
            </label>
            <input
              id="product-name-input"
              type="text"
              value={product.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onKeyDown={handleKeyDown}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Enter product name"
              maxLength={200}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="product-price-input" className="block text-sm font-medium text-slate-700">
              Price *
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">$</span>
              <input
                id="product-price-input"
                type="text"
                inputMode="decimal"
                value={product.price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                    handleInputChange('price', value);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="block w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="product-quantity-input" className="block text-sm font-medium text-slate-700">
              Quantity *
            </label>
            <input
              id="product-quantity-input"
              type="text"
              inputMode="decimal"
              value={product.quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                  handleInputChange('quantity', value);
                }
              }}
              onKeyDown={handleKeyDown}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="1"
              min="0.01"
              max="99"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddProduct}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});

CustomProductModal.displayName = 'CustomProductModal';

export default CustomProductModal;