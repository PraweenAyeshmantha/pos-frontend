import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { productService } from '../../../services/productService';
import type { Product } from '../../../types/product';

const formatProductType = (type: string): string => {
  const labels: Record<string, string> = {
    Simple: 'Simple',
    Variation: 'Variation',
  };
  return labels[type] ?? type;
};

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alert] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const typeMatch = formatProductType(product.productType).toLowerCase().includes(query);
      return (
        product.name.toLowerCase().includes(query) ||
        (product.barcode ?? '').toLowerCase().includes(query) ||
        product.price.toString().includes(query) ||
        typeMatch
      );
    });
  }, [products, searchQuery]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">Products</h1>
                <p className="mt-2 text-gray-600">
                  View and manage your product catalog, prices, and barcodes.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {filteredProducts.length === products.length
                  ? `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`
                  : `Showing ${filteredProducts.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`}
              </div>
              <input
                type="text"
                placeholder="Search by name, barcode, price, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-96 rounded-lg border border-gray-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            </div>
          )}

          {/* Products Table */}
          {!loading && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Updated At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          {searchQuery
                            ? 'No products found matching your search.'
                            : 'No products available.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{product.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatProductType(product.productType)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {product.barcode || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDateTime(product.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDateTime(product.updatedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500">
            If you enjoy using our POS, please consider leaving us a 5-star review. Your feedback keeps us motivated!
          </p>
        </div>
      </div>

      {/* Alert Toast */}
      {alert && (
        <ToastContainer>
          <Alert type={alert.type} title={alert.title} message={alert.message} />
        </ToastContainer>
      )}
    </AdminLayout>
  );
};

export default ProductsPage;
