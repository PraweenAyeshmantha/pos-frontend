import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { productService } from '../../../services/productService';
import type {
  Product,
  ProductFormValues,
  ProductType,
  ProductUpsertRequest,
} from '../../../types/product';
import type { RecordStatus } from '../../../types/configuration';
import type { Brand, ProductCategory, Tag } from '../../../types/taxonomy';

interface EditProductModalProps {
  product: Product;
  categories: ProductCategory[];
  tags: Tag[];
  brands: Brand[];
  onClose: () => void;
  onSuccess: (product: Product) => void;
}

const PRODUCT_TYPES: Array<{ label: string; value: ProductType }> = [
  { label: 'Simple Product', value: 'Simple' },
  { label: 'Variation Product', value: 'Variation' },
];

const STATUS_OPTIONS: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  categories,
  tags,
  brands,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<ProductFormValues>(() => ({
    name: product.name,
    price: product.price.toString(),
    productType: product.productType ?? 'Simple',
    barcode: product.barcode ?? '',
    sku: product.sku ?? '',
    description: product.description ?? '',
    cost: product.cost?.toString() ?? '',
    taxRate: product.taxRate?.toString() ?? '',
    categoryId: product.categoryId ? product.categoryId.toString() : '',
    unit: product.unit ?? '',
    isWeightBased: product.isWeightBased ?? false,
    imageUrl: product.imageUrl ?? '',
    recordStatus: product.recordStatus ?? 'ACTIVE',
    tagIds: product.tagIds?.map((id) => id.toString()) ?? [],
    brandIds: product.brandIds?.map((id) => id.toString()) ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const input = document.getElementById('edit-product-name-input');
    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  }, []);

  const handleChange = useCallback(
    (field: keyof ProductFormValues, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleTagsChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({
      ...prev,
      tagIds: selected,
    }));
  }, []);

  const handleBrandsChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({
      ...prev,
      brandIds: selected,
    }));
  }, []);

  const buildPayload = useCallback((): ProductUpsertRequest => {
    const tagIds = formData.tagIds.map((id) => Number.parseInt(id, 10)).filter((id) => !Number.isNaN(id));
    const brandIds = formData.brandIds.map((id) => Number.parseInt(id, 10)).filter((id) => !Number.isNaN(id));
    const categoryId = formData.categoryId ? Number.parseInt(formData.categoryId, 10) : undefined;

    return {
      name: formData.name.trim(),
      price: Number.parseFloat(formData.price),
      ...(formData.sku.trim() ? { sku: formData.sku.trim() } : {}),
      ...(formData.description.trim() ? { description: formData.description.trim() } : {}),
      ...(formData.cost.trim() ? { cost: Number.parseFloat(formData.cost) } : {}),
      ...(formData.taxRate.trim() ? { taxRate: Number.parseFloat(formData.taxRate) } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(formData.unit.trim() ? { unit: formData.unit.trim() } : {}),
      isWeightBased: formData.isWeightBased,
      ...(formData.imageUrl.trim() ? { imageUrl: formData.imageUrl.trim() } : {}),
      recordStatus: formData.recordStatus,
      tagIds,
      brandIds,
    };
  }, [formData]);

  const validateForm = useCallback((): string | null => {
    if (!formData.name.trim()) {
      return 'Product name is required.';
    }

    if (!formData.price.trim()) {
      return 'Product price is required.';
    }

    const priceValue = Number.parseFloat(formData.price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      return 'Enter a valid price greater than 0.';
    }

    return null;
  }, [formData.name, formData.price]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      const validationMessage = validateForm();
      if (validationMessage) {
        setError(validationMessage);
        return;
      }

      setSaving(true);
      try {
  const payload = buildPayload();
  let updatedProduct = await productService.update(product.id, payload);
        const trimmedBarcode = formData.barcode.trim();
        const originalBarcode = product.barcode ?? '';
        if (trimmedBarcode && trimmedBarcode !== originalBarcode) {
          updatedProduct = await productService.updateBarcode({ id: product.id, barcode: trimmedBarcode });
        }
        onSuccess({ ...updatedProduct, productType: formData.productType });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update product.';
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, formData.barcode, formData.productType, onSuccess, product.barcode, product.id, validateForm],
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none"
            aria-label="Close edit product modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          <div className="space-y-6 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-product-name-input" className="text-sm font-medium text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-product-name-input"
                type="text"
                required
                value={formData.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-price" className="text-sm font-medium text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  required
                  value={formData.price}
                  onChange={(event) => handleChange('price', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-type" className="text-sm font-medium text-gray-700">
                  Product Type
                </label>
                <select
                  id="edit-product-type"
                  value={formData.productType}
                  onChange={(event) => handleChange('productType', event.target.value as ProductType)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-category" className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="edit-product-category"
                  value={formData.categoryId}
                  onChange={(event) => handleChange('categoryId', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a category</option>
                  {categories.length === 0 ? (
                    <option value="" disabled>
                      No categories available
                    </option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500">Categories are managed from catalog settings.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-unit" className="text-sm font-medium text-gray-700">
                  Unit
                </label>
                <input
                  id="edit-product-unit"
                  type="text"
                  value={formData.unit}
                  onChange={(event) => handleChange('unit', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-sku" className="text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  id="edit-product-sku"
                  type="text"
                  value={formData.sku}
                  onChange={(event) => handleChange('sku', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-barcode" className="text-sm font-medium text-gray-700">
                  Barcode
                </label>
                <input
                  id="edit-product-barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={(event) => handleChange('barcode', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-product-description" className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="edit-product-description"
                rows={3}
                value={formData.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-tags" className="text-sm font-medium text-gray-700">
                  Tags
                </label>
                <select
                  id="edit-product-tags"
                  multiple
                  value={formData.tagIds}
                  onChange={handleTagsChange}
                  className="min-h-[6.5rem] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {tags.length === 0 ? (
                    <option value="" disabled>
                      No tags available
                    </option>
                  ) : (
                    tags.map((tag) => (
                      <option key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500">Hold Ctrl or Cmd to multi-select.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-brands" className="text-sm font-medium text-gray-700">
                  Brands
                </label>
                <select
                  id="edit-product-brands"
                  multiple
                  value={formData.brandIds}
                  onChange={handleBrandsChange}
                  className="min-h-[6.5rem] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {brands.length === 0 ? (
                    <option value="" disabled>
                      No brands available
                    </option>
                  ) : (
                    brands.map((brand) => (
                      <option key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500">Matches the brand filter options on the listing.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="edit-product-status" className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="edit-product-status"
                value={formData.recordStatus}
                onChange={(event) => handleChange('recordStatus', event.target.value as RecordStatus)}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default memo(EditProductModal);
