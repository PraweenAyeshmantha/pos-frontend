import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
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

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
    window.setTimeout(() => setAlert(null), 3000);
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
      product.productType.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query) ||
      product.price.toString().includes(query)
    );
  });

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-700">
          No products found. Create products before assigning barcodes.
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Barcode Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Barcode Print
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const currentBarcode = editingBarcodes.get(product.id) ?? product.barcode ?? '';
                  const currentQuantity = printQuantities.get(product.id) || '';
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{product.productType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <span className="line-through text-gray-400">${product.price.toFixed(2)}</span>
                          <br />
                          <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentBarcode}
                            onChange={(e) => handleBarcodeChange(product.id, e.target.value)}
                            placeholder="Enter barcode"
                            className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateBarcode(product)}
                            className="rounded-md border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
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
                          <span className="text-sm text-gray-400">No image</span>
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
                            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => handlePrint(product)}
                            className="rounded-md border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
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
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800">Assign Barcodes</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Assign and manage barcodes for your products. Update barcode numbers and print barcode labels for inventory management.
            </p>
          </header>

          {/* Alert */}
          {alert && (
            <ToastContainer>
              <Alert type={alert.type} title={alert.title} message={alert.message} />
            </ToastContainer>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-600">
              {filteredProducts.length === products.length
                ? `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`
                : `Showing ${filteredProducts.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`}
            </div>
            <input
              type="text"
              placeholder="Search by name, type, barcode, or price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-96 rounded-lg border border-gray-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Products Table */}
          {renderContent()}

          <p className="mt-6 text-sm text-gray-500">
            Barcodes are automatically generated as images when you update the barcode number. Use the Print function to generate physical labels.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AssignBarcodesPage;
