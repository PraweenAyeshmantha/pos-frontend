import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddProductModal from '../../../components/admin/products/AddProductModal';
import EditProductModal from '../../../components/admin/products/EditProductModal';
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
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; product: Product | null }>({
    show: false,
    product: null,
  });
  const alertTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
    }
    setAlert({ type, title, message });
    alertTimeoutRef.current = window.setTimeout(() => setAlert(null), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

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

  const handleProductCreated = useCallback(
    (product: Product) => {
      setProducts((prev) => {
        const remaining = prev.filter((existing) => existing.id !== product.id);
        return [product, ...remaining];
      });
      setError(null);
      setShowAddModal(false);
      showToast('success', 'Product Created', `${product.name} added successfully`);
    },
    [showToast],
  );

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingProduct(null);
  }, []);

  const handleProductUpdated = useCallback(
    (product: Product) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      setEditingProduct(null);
      showToast('success', 'Product Updated', `${product.name} updated successfully`);
    },
    [showToast],
  );

  const handleDeleteRequest = useCallback((product: Product) => {
    setDeleteConfirm({ show: true, product });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ show: false, product: null });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.product) return;

    try {
      await productService.delete(deleteConfirm.product.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.product!.id));
      showToast('success', 'Product Deleted', `${deleteConfirm.product.name} deleted successfully`);
    } catch (err) {
      console.error('Failed to delete product', err);
      showToast('error', 'Delete Failed', 'Unable to delete product. Please try again.');
    } finally {
      setDeleteConfirm({ show: false, product: null });
    }
  }, [deleteConfirm.product, showToast]);

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
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Product
              </button>
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
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="rounded-lg border border-blue-600 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                aria-label={`Edit ${product.name}`}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(product)}
                                className="rounded-lg border border-red-600 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                aria-label={`Delete ${product.name}`}
                              >
                                Delete
                              </button>
                            </div>
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

      {/* Modals and Dialogs */}
      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onSuccess={handleProductCreated} />
      )}

      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={handleEditClose} 
          onSuccess={handleProductUpdated} 
        />
      )}

      {deleteConfirm.show && deleteConfirm.product && (
        <ConfirmationDialog
          open={deleteConfirm.show}
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteConfirm.product.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {(alert || error) && (
        <ToastContainer>
          {error && <Alert type="error" title="Error" message={error} />}
          {alert && <Alert type={alert.type} title={alert.title} message={alert.message} />}
        </ToastContainer>
      )}
    </AdminLayout>
  );
};

export default ProductsPage;
