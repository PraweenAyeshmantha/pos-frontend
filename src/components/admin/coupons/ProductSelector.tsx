import React, { memo, useCallback, useEffect, useState } from 'react';
import { productService } from '../../../services/productService';
import type { Product } from '../../../types/product';

interface ProductSelectorProps {
  selectedProductIds: number[];
  onSelectionChange: (productIds: number[]) => void;
  disabled?: boolean;
}

const ProductSelector: React.FC<ProductSelectorProps> = memo(
  ({ selectedProductIds, onSelectionChange, disabled = false }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      const loadProducts = async () => {
        try {
          setLoading(true);
          const allProducts = await productService.getAll();
          setProducts(allProducts);
        } catch (err) {
          console.error('Error loading products:', err);
        } finally {
          setLoading(false);
        }
      };

      void loadProducts();
    }, []);

    const handleToggleProduct = useCallback(
      (productId: number) => {
        if (disabled) {
          return;
        }

        const isSelected = selectedProductIds.includes(productId);
        const newSelection = isSelected
          ? selectedProductIds.filter((id) => id !== productId)
          : [...selectedProductIds, productId];

        onSelectionChange(newSelection);
      },
      [selectedProductIds, onSelectionChange, disabled],
    );

    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Applicable Products <span className="text-slate-500">(Leave empty for all products)</span>
        </label>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled || loading}
          className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
        />

        {/* Selected Count */}
        {selectedProductIds.length > 0 && (
          <div className="mb-2 text-sm text-slate-600">
            {selectedProductIds.length} product(s) selected
          </div>
        )}

        {/* Product List */}
        <div className="max-h-60 overflow-y-auto border border-slate-300 rounded-lg bg-slate-50">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              {products.length === 0 ? 'No products available' : 'No matching products'}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredProducts.map((product) => (
                <label
                  key={product.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => handleToggleProduct(product.id)}
                    disabled={disabled}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{product.name}</div>
                    {product.sku && (
                      <div className="text-xs text-slate-600">SKU: {product.sku}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-2 text-xs text-slate-500">
          {selectedProductIds.length === 0
            ? 'No products selected - coupon will be applicable to all products'
            : `Coupon will be applicable only to selected products`}
        </div>
      </div>
    );
  },
);

ProductSelector.displayName = 'ProductSelector';

export default ProductSelector;
