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
  mode?: 'edit' | 'view';
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
  mode = 'edit',
}) => {
  const isViewMode = mode === 'view';
  const readOnlyInputModifiers = isViewMode ? ' cursor-not-allowed bg-gray-100' : '';
  const readOnlyTextareaModifiers = isViewMode ? ' cursor-not-allowed bg-gray-100' : '';
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
    if (isViewMode) {
      return;
    }
    const input = document.getElementById('edit-product-name-input');
    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  }, [isViewMode]);

  const handleChange = useCallback(
    (field: keyof ProductFormValues, value: string | boolean) => {
      if (isViewMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [isViewMode],
  );

  const handleDismiss = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const handleTagsChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    if (isViewMode) {
      return;
    }
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({
      ...prev,
      tagIds: selected,
    }));
  }, [isViewMode]);

  const handleBrandsChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    if (isViewMode) {
      return;
    }
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setFormData((prev) => ({
      ...prev,
      brandIds: selected,
    }));
  }, [isViewMode]);

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
      if (isViewMode) {
        return;
      }
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
    [buildPayload, formData.barcode, formData.productType, isViewMode, onSuccess, product.barcode, product.id, validateForm],
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">{isViewMode ? 'View Product' : 'Edit Product'}</h2>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none"
            aria-label={isViewMode ? 'Close view product modal' : 'Close edit product modal'}
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
          className="flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6">
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
                readOnly={isViewMode}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
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
                  readOnly={isViewMode}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
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
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
                  disabled={isViewMode}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
                  readOnly={isViewMode}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="edit-product-weight-based"
                type="checkbox"
                checked={formData.isWeightBased}
                onChange={(event) => handleChange('isWeightBased', event.target.checked)}
                disabled={isViewMode}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <label htmlFor="edit-product-weight-based" className="text-sm font-medium text-gray-700">
                Enable weight-based pricing
              </label>
              <p className="text-xs text-gray-500">Check this for products sold by weight (e.g., fruits, meat)</p>
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
                  readOnly={isViewMode}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
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
                  readOnly={isViewMode}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-cost" className="text-sm font-medium text-gray-700">
                  Cost
                </label>
                <input
                  id="edit-product-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={formData.cost}
                  onChange={(event) => handleChange('cost', event.target.value)}
                  readOnly={isViewMode}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
                />
                <p className="text-xs text-gray-500">Product cost for margin calculation</p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="edit-product-tax-rate" className="text-sm font-medium text-gray-700">
                  Tax Rate (%)
                </label>
                <input
                  id="edit-product-tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  inputMode="decimal"
                  value={formData.taxRate}
                  onChange={(event) => handleChange('taxRate', event.target.value)}
                  placeholder="0.00"
                  readOnly={isViewMode}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyInputModifiers}`}
                />
                <p className="text-xs text-gray-500">Leave empty or 0 for no tax</p>
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
                readOnly={isViewMode}
                className={`rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${readOnlyTextareaModifiers}`}
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
                  disabled={isViewMode}
                  className="min-h-[7rem] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
                <p className="text-xs text-gray-500">{isViewMode ? 'View only' : 'Use Ctrl/Cmd click to multi-select.'}</p>
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
                  disabled={isViewMode}
                  className="min-h-[7rem] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
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
                <p className="text-xs text-gray-500">{isViewMode ? 'View only' : 'Associate one or more brands.'}</p>
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
                disabled={isViewMode}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode ? (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Update Product'}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default memo(EditProductModal);
