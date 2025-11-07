import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { productService } from '../../../services/productService';
import type { Product } from '../../../types/product';

const AssignBarcodesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingBarcodes, setEditingBarcodes] = useState<Map<number, string>>(new Map());
  const [printQuantities, setPrintQuantities] = useState<Map<number, string>>(new Map());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(25);

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleBarcodeChange = useCallback((productId: number, value: string) => {
    setEditingBarcodes((prev) => {
      const updated = new Map(prev);
      updated.set(productId, value);
      return updated;
    });
  }, []);

  const handleQuantityChange = useCallback((productId: number, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }
    setPrintQuantities((prev) => {
      const updated = new Map(prev);
      updated.set(productId, value);
      return updated;
    });
  }, []);

  const handleUpdateBarcode = useCallback(
    async (product: Product) => {
      const newBarcode = editingBarcodes.get(product.id);
      
      if (!newBarcode || !newBarcode.trim()) {
        showAlert('error', 'Validation Error', 'Barcode cannot be empty');
        return;
      }

      if (newBarcode === product.barcode) {
        showAlert('info', 'No Change', 'Barcode value is the same');
        return;
      }

      try {
        await productService.updateBarcode({
          id: product.id,
          barcode: newBarcode.trim(),
        });
        
        showAlert('success', 'Success', 'Barcode updated successfully');
        
        // Update the product in the list
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, barcode: newBarcode.trim() } : p))
        );
        
        // Clear editing state
        setEditingBarcodes((prev) => {
          const updated = new Map(prev);
          updated.delete(product.id);
          return updated;
        });
        
        // Fetch products again to get updated barcode image
        fetchProducts();
      } catch (err) {
        console.error('Failed to update barcode', err);
        showAlert('error', 'Update Failed', 'Unable to update barcode. Please try again.');
      }
    },
    [editingBarcodes, showAlert, fetchProducts]
  );

  const handlePrint = useCallback(
    (product: Product) => {
      const quantity = printQuantities.get(product.id) || '1';
      const quantityNum = parseInt(quantity, 10);
      
      if (quantityNum <= 0) {
        showAlert('error', 'Invalid Quantity', 'Quantity must be greater than 0');
        return;
      }

      if (!product.barcode) {
        showAlert('warning', 'No Barcode', 'Please assign a barcode before printing');
        return;
      }

      // Create a print window with the barcode image
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        showAlert('error', 'Print Failed', 'Unable to open print window');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Barcode - ${product.name}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .barcode-item {
                page-break-after: always;
                margin-bottom: 20px;
                text-align: center;
                padding: 10px;
                border: 1px solid #ddd;
              }
              .barcode-item:last-child {
                page-break-after: auto;
              }
              img {
                max-width: 300px;
                height: auto;
              }
              h3 {
                margin: 10px 0;
                font-size: 16px;
              }
              p {
                margin: 5px 0;
                font-size: 14px;
                color: #666;
              }
              @media print {
                body {
                  margin: 0;
                }
                .barcode-item {
                  margin: 10px;
                }
              }
            </style>
          </head>
          <body>
            ${Array(quantityNum)
              .fill(0)
              .map(
                () => `
              <div class="barcode-item">
                <h3>${product.name}</h3>
                <img src="${product.barcodeImage || ''}" alt="Barcode: ${product.barcode}" />
                <p>Barcode: ${product.barcode}</p>
                <p>Price: $${product.price.toFixed(2)}</p>
              </div>
            `
              )
              .join('')}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for images to load before printing
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        showAlert('success', 'Print Initiated', `Printing ${quantityNum} barcode(s)`);
      }, 500);
    },
    [printQuantities, showAlert]
  );

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.productType ?? 'Simple').toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query) ||
      product.price.toString().includes(query)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading products...</p>
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          <div className="text-lg font-semibold">No products found</div>
          <p className="mt-3 text-sm text-slate-500">
            Create products before assigning barcodes.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {/* Icon column - no header text */}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Barcode Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Barcode Print
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => {
                  const currentBarcode = editingBarcodes.get(product.id) ?? product.barcode ?? '';
                  const currentQuantity = printQuantities.get(product.id) || '';
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{product.productType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          <span className="line-through text-slate-400">${product.price.toFixed(2)}</span>
                          <br />
                          <span className="font-semibold text-slate-900">${product.price.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentBarcode}
                            onChange={(e) => handleBarcodeChange(product.id, e.target.value)}
                            placeholder="Enter barcode"
                            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateBarcode(product)}
                            className="rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.barcodeImage ? (
                          <img
                            src={product.barcodeImage}
                            alt={`Barcode for ${product.name}`}
                            className="h-12 w-auto"
                          />
                        ) : (
                          <span className="text-sm text-slate-400">No image</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentQuantity}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            placeholder="Quantity"
                            inputMode="numeric"
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => handlePrint(product)}
                            className="rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Assign Barcodes"
          description="Assign and manage barcodes for your products. Barcodes are automatically generated as images when updated."
        />

          {(alert || error) && (
            <ToastContainer>
              {alert ? (
                <Alert
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              ) : null}
              {error ? (
                <Alert
                  type="error"
                  title="Error"
                  message={error}
                  onClose={() => setError(null)}
                />
              ) : null}
            </ToastContainer>
          )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
              Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    ‹
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value, 10);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="text-sm text-slate-600">of {totalPages}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

          {/* Products Table */}
          {renderContent()}

          <p className="mt-6 text-sm text-slate-500">
            Barcodes are automatically generated as images when you update the barcode number. Use the Print function to generate physical labels.
          </p>
      </div>
    </AdminLayout>
  );
};

export default AssignBarcodesPage;
