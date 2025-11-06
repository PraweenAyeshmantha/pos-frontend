import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddProductModal from '../../../components/admin/products/AddProductModal';
import EditProductModal from '../../../components/admin/products/EditProductModal';
import { productService } from '../../../services/productService';
import { productCategoryService } from '../../../services/productCategoryService';
import { tagService } from '../../../services/tagService';
import { brandService } from '../../../services/brandService';
import type { Product } from '../../../types/product';
import type { Brand, ProductCategory, Tag } from '../../../types/taxonomy';

const formatProductType = (type?: string): string => {
  if (!type) {
    return 'Simple';
  }
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
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatStockStatus = (status?: string): { label: string; color: string } => {
  if (!status || status === 'IN_STOCK') {
    return { label: 'In stock', color: 'text-green-600' };
  }
  if (status === 'OUT_OF_STOCK') {
    return { label: 'Out of stock', color: 'text-red-600' };
  }
  if (status === 'LOW_STOCK') {
    return { label: 'Low stock', color: 'text-yellow-600' };
  }
  return { label: 'In stock', color: 'text-green-600' };
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
  
  // New filter states
  const [activeTab, setActiveTab] = useState<'all' | 'published'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedProductType, setSelectedProductType] = useState<string>('');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [categoryOptions, setCategoryOptions] = useState<ProductCategory[]>([]);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [brandOptions, setBrandOptions] = useState<Brand[]>([]);

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

  const fetchTaxonomy = useCallback(async () => {
    try {
      const [categories, tags, brands] = await Promise.all([
        productCategoryService.getAll({ active: true }),
        tagService.getAll({ active: true }),
        brandService.getAll({ active: true }),
      ]);
      setCategoryOptions(categories);
      setTagOptions(tags);
      setBrandOptions(brands);
    } catch (err) {
      console.error('Error loading catalog taxonomy', err);
      showToast('error', 'Catalog Metadata', 'Failed to load categories, tags, or brands.');
    }
  }, [showToast]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    void fetchTaxonomy();
  }, [fetchTaxonomy]);

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
    let filtered = products;

    // Filter by tab
    if (activeTab === 'published') {
      filtered = filtered.filter((p) => p.isActive !== false);
    }

    // Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((product) => {
        const typeMatch = formatProductType(product.productType).toLowerCase().includes(query);
        return (
          product.name.toLowerCase().includes(query) ||
          (product.barcode ?? '').toLowerCase().includes(query) ||
          (product.sku ?? '').toLowerCase().includes(query) ||
          product.price.toString().includes(query) ||
          typeMatch
        );
      });
    }

    // Filter by category
    if (selectedCategoryId) {
      const categoryIdNumber = Number.parseInt(selectedCategoryId, 10);
      filtered = filtered.filter((p) => (p.categoryId ?? -1) === categoryIdNumber);
    }

    // Filter by product type
    if (selectedProductType) {
      filtered = filtered.filter((p) => (p.productType ?? 'Simple') === selectedProductType);
    }

    // Filter by stock status
    if (selectedStockStatus) {
      filtered = filtered.filter((p) => (p.stockStatus ?? 'IN_STOCK') === selectedStockStatus);
    }

    // Filter by brand
    if (selectedBrandId) {
      const brandIdNumber = Number.parseInt(selectedBrandId, 10);
      filtered = filtered.filter((p) => (p.brandIds ?? []).includes(brandIdNumber));
    }

    return filtered;
  }, [products, searchQuery, activeTab, selectedCategoryId, selectedProductType, selectedStockStatus, selectedBrandId]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const publishedCount = products.filter((p) => p.isActive !== false).length;

  // Get unique values for filters
  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map((p) => p.id));
    }
  }, [paginatedProducts, selectedProducts.length]);

  const handleSelectProduct = useCallback((id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }, []);

  const handleToggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleDuplicate = useCallback(() => {
    // TODO: Implement duplicate functionality
    showToast('info', 'Coming Soon', 'Duplicate functionality will be implemented soon');
  }, [showToast]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-full px-5 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b pb-5">
            <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
            >
              Add new product
            </button>
          </div>

          {/* Tabs and Search */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={activeTab === 'all' ? 'text-blue-600 underline' : 'text-gray-600 hover:text-blue-600'}
              >
                All ({products.length})
              </button>
              <span className="text-gray-400">|</span>
              <button
                type="button"
                onClick={() => setActiveTab('published')}
                className={activeTab === 'published' ? 'text-blue-600 underline' : 'text-gray-600 hover:text-blue-600'}
              >
                Published ({publishedCount})
              </button>
              <span className="text-gray-400">|</span>
              <button type="button" className="text-gray-600 hover:text-blue-600">
                Sorting
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex items-center gap-2">
            <select
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value=""
              onChange={() => {}}
            >
              <option value="">Bulk actions</option>
              <option value="delete">Delete</option>
            </select>
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Apply
            </button>
            <select
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                handleApplyFilters();
              }}
            >
              <option value="">Select a category</option>
              {categoryOptions.length === 0 ? (
                <option value="" disabled>
                  No categories available
                </option>
              ) : (
                categoryOptions.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
            <select
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={selectedProductType}
              onChange={(e) => {
                setSelectedProductType(e.target.value);
                handleApplyFilters();
              }}
            >
              <option value="">Filter by product type</option>
              <option value="Simple">Simple</option>
              <option value="Variation">Variation</option>
            </select>
            <select
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                handleApplyFilters();
              }}
            >
              <option value="">Filter by stock status</option>
              <option value="IN_STOCK">In stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
              <option value="LOW_STOCK">Low stock</option>
            </select>
            <select
              className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={selectedBrandId}
              onChange={(e) => {
                setSelectedBrandId(e.target.value);
                handleApplyFilters();
              }}
            >
              <option value="">Filter by brand</option>
              {brandOptions.length === 0 ? (
                <option value="" disabled>
                  No brands available
                </option>
              ) : (
                brandOptions.map((brand) => (
                  <option key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded border border-blue-600 bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Filter
            </button>
          </div>

          {/* Products count */}
          <div className="mb-3 text-sm text-gray-600">
            {filteredProducts.length} items
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
            <div className="overflow-hidden border border-gray-200 bg-white">
              <table className="w-full border-collapse">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="w-10 border-b border-gray-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="w-12 border-b border-gray-200 px-3 py-2"></th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      SKU
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Stock
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Categories
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Tags
                    </th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Brands
                    </th>
                    <th className="w-8 border-b border-gray-200 px-3 py-2"></th>
                    <th className="border-b border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery
                          ? 'No products found matching your search.'
                          : 'No products available.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => {
                      const stockStatus = formatStockStatus(product.stockStatus);
                      return (
                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-3">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div>
                              <div className="font-medium text-blue-600 hover:underline">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(product)}
                                  className="text-left"
                                >
                                  {product.name}
                                </button>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                ID: {product.id} |{' '}
                                <button
                                  type="button"
                                  onClick={() => handleEdit(product)}
                                  className="text-blue-600 hover:underline"
                                >
                                  Edit
                                </button>{' '}
                                |{' '}
                                <button
                                  type="button"
                                  onClick={() => handleEdit(product)}
                                  className="text-blue-600 hover:underline"
                                >
                                  Quick Edit
                                </button>{' '}
                                |{' '}
                                <button
                                  type="button"
                                  onClick={() => handleEdit(product)}
                                  className="text-blue-600 hover:underline"
                                >
                                  View
                                </button>{' '}
                                |{' '}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRequest(product)}
                                  className="text-red-600 hover:underline"
                                >
                                  Trash
                                </button>{' '}
                                |{' '}
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate()}
                                  className="text-blue-600 hover:underline"
                                >
                                  Duplicate
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">{product.sku || '—'}</td>
                          <td className={`px-3 py-3 text-sm font-medium ${stockStatus.color}`}>
                            {stockStatus.label}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-sm text-blue-600">
                            {product.category || '—'}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            {product.tags && product.tags.length > 0 ? product.tags.join(', ') : '—'}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            {product.brands && product.brands.length > 0 ? product.brands.join(', ') : '—'}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleFavorite(product.id)}
                              className="text-gray-400 hover:text-yellow-500"
                            >
                              {favorites.has(product.id) ? (
                                <svg className="h-5 w-5 fill-yellow-500" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700">
                            <div>Published</div>
                            <div className="text-xs text-gray-500">{formatDateTime(product.createdAt)}</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {filteredProducts.length} items
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                >
                  «
                </button>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value, 10);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-12 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                />
                <span className="text-sm text-gray-600">of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                >
                  »
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals and Dialogs */}
      {showAddModal && (
        <AddProductModal
          categories={categoryOptions}
          tags={tagOptions}
          brands={brandOptions}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleProductCreated}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categoryOptions}
          tags={tagOptions}
          brands={brandOptions}
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
