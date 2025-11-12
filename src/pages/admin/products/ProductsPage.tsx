import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddProductModal from '../../../components/admin/products/AddProductModal';
import EditProductModal from '../../../components/admin/products/EditProductModal';
import { productService } from '../../../services/productService';
import { productCategoryService } from '../../../services/productCategoryService';
import { tagService } from '../../../services/tagService';
import { brandService } from '../../../services/brandService';
import { stockService } from '../../../services/stockService';
import type { Product, ProductWithStockDetails } from '../../../types/product';
import type { Brand, ProductCategory, Tag } from '../../../types/taxonomy';
import type { ProductWithStock } from '../../../types/stock';
import { useOutlet } from '../../../contexts/OutletContext';

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
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return currencyFormatter.format(value);
};

const resolveTimestamp = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductWithStockDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'view' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [categoryOptions, setCategoryOptions] = useState<ProductCategory[]>([]);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [brandOptions, setBrandOptions] = useState<Brand[]>([]);
  const { currentOutlet } = useOutlet();

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const productsData = await productService.getAll();
      let stockData: ProductWithStock[] = [];
      if (currentOutlet?.id) {
        try {
          stockData = await stockService.getProductStocks(currentOutlet.id);
        } catch (err) {
          console.warn('Failed to fetch stock data:', err);
        }
      }

      // Combine product and stock data
      const productsWithStock: ProductWithStockDetails[] = productsData.map(product => {
        const stockInfo = stockData.find(stock => stock.productId === product.id);
        return {
          ...product,
          customStock: stockInfo?.customStock ?? 0,
          reorderLevel: stockInfo?.reorderLevel,
          maxStockLevel: stockInfo?.maxStockLevel,
          isInStock: (stockInfo?.customStock ?? 0) > 0,
        };
      });

      setProducts(productsWithStock);
    } catch (err) {
      console.error('Error loading products', err);
      setLoadError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOutlet?.id]);

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
      const productWithStock: ProductWithStockDetails = {
        ...product,
        customStock: 0,
        isInStock: false,
      };
      setProducts((prev) => {
        const remaining = prev.filter((existing) => existing.id !== product.id);
        return [productWithStock, ...remaining];
      });
      setLoadError(null);
      setShowAddModal(false);
      showToast('success', 'Product Created', `${product.name} added successfully`);
    },
    [showToast],
  );

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalMode('edit');
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingProduct(null);
    setModalMode(null);
  }, []);

  const handleView = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalMode('view');
  }, []);

  const handleViewClose = useCallback(() => {
    setEditingProduct(null);
    setModalMode(null);
  }, []);

  const handleProductUpdated = useCallback(
    (product: Product) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === product.id) {
            return {
              ...product,
              customStock: p.customStock,
              reorderLevel: p.reorderLevel,
              maxStockLevel: p.maxStockLevel,
              isInStock: p.isInStock,
            };
          }
          return p;
        })
      );
      setEditingProduct(null);
      setModalMode(null);
      showToast('success', 'Product Updated', `${product.name} updated successfully`);
    },
    [showToast],
  );

  const handleDeleteRequest = useCallback((product: Product) => {
    setDeleteConfirm({ open: true, product });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ open: false, product: null });
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
      setDeleteConfirm({ open: false, product: null });
    }
  }, [deleteConfirm.product, showToast]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matchesQuery = (product: Product): boolean => {
      if (!query) {
        return true;
      }

      return [
        product.name,
        product.sku ?? '',
        product.barcode ?? '',
        product.price.toString(),
        formatProductType(product.productType).toLowerCase(),
        product.category ?? '',
  (product.brands ?? []).join(' '),
      ]
        .some((value) => value.toLowerCase().includes(query));
    };

    return products
      .filter((product) => matchesQuery(product))
      .sort((a, b) => {
        const bTimestamp = resolveTimestamp(b.updatedAt ?? b.createdAt);
        const aTimestamp = resolveTimestamp(a.updatedAt ?? a.createdAt);
        return bTimestamp - aTimestamp;
      });
  }, [products, searchQuery]);

  const totalProducts = products.length;
  const activeProducts = useMemo(() => products.filter((product) => product.isActive !== false).length, [products]);

  const handleCreateClick = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading products...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No products yet</div>
      <p className="mt-3 text-sm text-slate-500">
        {totalProducts === 0
          ? 'Add your first product to make it available across the POS and online ordering experiences.'
          : 'Try a different search term to find the product you are looking for.'}
      </p>
      <button
        type="button"
        onClick={handleCreateClick}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add product
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                SKU
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Brand
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tax
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stock
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Updated
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredProducts.map((product) => {
              const isActive = product.isActive !== false && product.recordStatus !== 'INACTIVE';
              const statusClass = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600';
              const statusLabel = isActive ? 'Active' : 'Inactive';
              const brandNames = product.brands ?? [];
              const skuValue = product.sku ?? '—';

              return (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">{skuValue}</td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">{product.category ?? 'Uncategorized'}</td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {brandNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {brandNames.map((brand, index) => (
                          <span
                            key={`${brand}-${index}`}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top text-sm font-semibold text-slate-900">{formatCurrency(product.price)}</td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {product.taxRate ? `${product.taxRate}%` : '—'}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          (product.customStock || 0) === 0
                            ? 'bg-rose-100 text-rose-800'
                            : (product.customStock || 0) <= (product.reorderLevel || 10)
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {product.customStock || 0}
                        </span>
                        {product.reorderLevel && (
                          <span className="text-xs text-slate-500">
                            (Reorder: {product.reorderLevel})
                          </span>
                        )}
                      </div>
                      {product.maxStockLevel && (
                        <div className="text-xs text-slate-400">
                          Max: {product.maxStockLevel}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-500">{formatDateTime(product.updatedAt ?? product.createdAt)}</td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => handleView(product)}
                        className="text-slate-600 transition hover:text-slate-800"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 transition hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(product)}
                        className="text-rose-600 transition hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Products"
          description="Manage products available across registers, kitchen displays, and online ordering. Use quick search to stay focused on what your team needs."
        />

        {!currentOutlet && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-800">
            Select a branch from the top navigation to view outlet-specific stock on hand.
          </div>
        )}

        {(alert || loadError) && (
          <ToastContainer>
            {alert ? (
              <Alert
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            ) : null}
            {loadError ? (
              <Alert
                type="error"
                title="Error"
                message={loadError}
                onClose={() => setLoadError(null)}
              />
            ) : null}
          </ToastContainer>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
              {filteredProducts.length === totalProducts
                ? `Showing ${totalProducts} products`
                : `Showing ${filteredProducts.length} of ${totalProducts} products`}
              {` • ${activeProducts} active`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white md:w-auto"
              >
                Add product
              </button>
            </div>
          </div>
        </section>

        {loading ? renderLoadState() : filteredProducts.length === 0 ? renderEmptyState() : renderTable()}

        {showAddModal ? (
          <AddProductModal
            categories={categoryOptions}
            tags={tagOptions}
            brands={brandOptions}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleProductCreated}
          />
        ) : null}

        {editingProduct && modalMode ? (
          <EditProductModal
            product={editingProduct}
            categories={categoryOptions}
            tags={tagOptions}
            brands={brandOptions}
            onClose={modalMode === 'view' ? handleViewClose : handleEditClose}
            onSuccess={modalMode === 'view' ? () => undefined : handleProductUpdated}
            mode={modalMode}
          />
        ) : null}

        {deleteConfirm.open && deleteConfirm.product ? (
          <ConfirmationDialog
            open={deleteConfirm.open}
            title="Delete Product"
            message={`Are you sure you want to delete "${deleteConfirm.product.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default ProductsPage;
