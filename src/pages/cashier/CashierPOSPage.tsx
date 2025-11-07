import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CashierLayout from '../../components/layout/CashierLayout';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import PaymentModal from '../../components/cashier/payment/PaymentModal';
import PaymentSuccessModal from '../../components/cashier/payment/PaymentSuccessModal';
import { productService } from '../../services/productService';
import { productCategoryService } from '../../services/productCategoryService';
import { posService } from '../../services/posService';
import type { Product } from '../../types/product';
import type { ProductCategory } from '../../types/taxonomy';
import type { PaymentMethod } from '../../types/payment';
import type { Order } from '../../types/order';
import { useAuth } from '../../hooks/useAuth';

type CategoryKey = 'all' | number;

interface CategoryOption {
  id: CategoryKey;
  name: string;
  icon: string;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  weight?: number | null;
  isWeightBased?: boolean;
}

const TAX_RATE = 0.07;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number): string => currencyFormatter.format(value);

const categoryIconFor = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes('hoodie')) return '🧥';
  if (normalized.includes('shirt') || normalized.includes('tee')) return '👕';
  if (normalized.includes('cap') || normalized.includes('hat')) return '🧢';
  if (normalized.includes('music')) return '🎵';
  if (normalized.includes('poster')) return '🖼️';
  if (normalized.includes('access')) return '👜';
  if (normalized.includes('drink') || normalized.includes('beverage')) return '🥤';
  if (normalized.includes('snack') || normalized.includes('food')) return '🍱';
  return '🛍️';
};

const CashDrawerModal: React.FC<{
  open: boolean;
  amount: string;
  onAmountChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ open, amount, onAmountChange, onConfirm, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">Open Cash Drawer Amount</h2>
          <p className="mt-2 text-sm text-slate-500">Enter the opening balance for your shift.</p>
        </div>
        <label className="block text-left text-sm font-medium text-slate-700">
          Enter Amount
          <div className="mt-2 flex rounded-xl border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="flex items-center justify-center px-3 text-sm text-slate-500">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                const value = event.target.value;
                if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                  onAmountChange(value);
                }
              }}
              placeholder="0.00"
              className="flex-1 rounded-r-xl border-0 bg-transparent py-3 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </label>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex-none sm:px-6"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:flex-none sm:px-6"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const CashierPOSPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([{ id: 'all', name: 'All', icon: '🛍️' }]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [productLoading, setProductLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [drawerAmount, setDrawerAmount] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setToast({ type, title, message });
  }, []);

  const checkScrollArrows = useCallback(() => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  const scrollCategories = useCallback((direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = categoryScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      categoryScrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      setTimeout(checkScrollArrows, 300);
    }
  }, [checkScrollArrows]);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setProductLoading(true);
        const data = await productService.getAll();
        if (!mounted) {
          return;
        }
        const activeProducts = data.filter((product) => product.recordStatus !== 'INACTIVE');
        setProducts(activeProducts);
      } catch (error) {
        console.error('Failed to load products for POS', error);
        if (mounted) {
          showToast('error', 'Products', 'Unable to load products. Please try again.');
        }
      } finally {
        if (mounted) {
          setProductLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);
        const data = await productCategoryService.getAll({ active: true });
        if (!mounted) {
          return;
        }
        const mapped = data
          .filter((category) => category.recordStatus !== 'INACTIVE')
          .map((category: ProductCategory) => ({
            id: category.id,
            name: category.name,
            icon: categoryIconFor(category.name),
          }));
        setCategories([{ id: 'all', name: 'All', icon: '🛍️' }, ...mapped]);
      } catch (error) {
        console.error('Failed to load categories for POS', error);
        if (mounted) {
          showToast('error', 'Categories', 'Unable to load categories. Showing all products.');
        }
      } finally {
        if (mounted) {
          setCategoryLoading(false);
          setTimeout(checkScrollArrows, 100);
        }
      }
    };

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, [showToast, checkScrollArrows]);

  // Initialize outlet from sessionStorage
  useEffect(() => {
    const storedOutletId = sessionStorage.getItem('selectedOutletId');
    if (storedOutletId) {
      setSelectedOutletId(Number(storedOutletId));
    } else {
      // TODO: Implement outlet selection screen
      // For now, default to outlet 1 if not set
      // This should be replaced with a proper outlet selection UI
      console.warn('No outlet selected. Defaulting to outlet ID 1. Please implement outlet selection.');
      setSelectedOutletId(1);
      sessionStorage.setItem('selectedOutletId', '1');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPaymentMethods = async () => {
      try {
        const data = await posService.getPaymentMethods();
        if (!mounted) {
          return;
        }
        const activeMethods = data.filter((method) => method.recordStatus !== 'INACTIVE');
        setPaymentMethods(activeMethods);
      } catch (error) {
        console.error('Failed to load payment methods', error);
        if (mounted) {
          showToast('error', 'Payment Methods', 'Unable to load payment methods.');
        }
      }
    };

    void loadPaymentMethods();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      if (!normalizedQuery) {
        return matchesCategory;
      }
      const haystacks = [
        product.name,
        product.sku ?? '',
        product.barcode ?? '',
        product.category ?? '',
      ].map((value) => value.toLowerCase());
      const matchesSearch = haystacks.some((value) => value.includes(normalizedQuery));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleSelectCategory = useCallback((categoryId: CategoryKey) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (product.recordStatus === 'INACTIVE') {
        showToast('warning', 'Unavailable', `${product.name} is not active and cannot be added.`);
        return;
      }

      setCartItems((prev) => {
        const existing = prev.find((item) => item.productId === product.id);
        if (existing) {
          return prev.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
              : item,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price ?? 0,
            quantity: 1,
            imageUrl: product.imageUrl,
            weight: null,
            isWeightBased: product.isWeightBased,
          },
        ];
      });
      showToast('success', 'Cart Updated', `${product.name} added to the cart.`);
    },
    [showToast],
  );

  const updateCartQuantity = useCallback((productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) {
            return item;
          }
          const nextQuantity = item.quantity + delta;
          if (nextQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: Math.min(nextQuantity, 99) };
        })
        .filter((item): item is CartItem => item !== null),
    );
  }, []);

  const removeCartItem = useCallback((productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateCartWeight = useCallback((productId: number, weight: number | null) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, weight } : item,
      ),
    );
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((accumulator, item) => {
      if (item.isWeightBased && item.weight) {
        // For weight-based products: price per unit × weight
        return accumulator + item.price * item.weight;
      }
      // For regular products: price × quantity
      return accumulator + item.price * item.quantity;
    }, 0),
    [cartItems],
  );

  const taxAmount = useMemo(() => subtotal * TAX_RATE, [subtotal]);
  const discountAmount = 0;
  const totalDue = subtotal + taxAmount - discountAmount;

  const handleDrawerConfirm = useCallback(() => {
    if (!drawerAmount || Number.isNaN(Number.parseFloat(drawerAmount))) {
      showToast('warning', 'Cash Drawer', 'Please enter a valid opening amount.');
      return;
    }
    showToast('success', 'Cash Drawer', `Opening balance set to ${formatCurrency(Number.parseFloat(drawerAmount))}.`);
    setDrawerOpen(false);
  }, [drawerAmount, showToast]);

  const handleProceedToPay = useCallback(() => {
    if (cartItems.length === 0) {
      showToast('warning', 'Checkout', 'Add at least one item to proceed.');
      return;
    }
    
    // Check if any weight-based products are missing weight
    const missingWeight = cartItems.find(item => item.isWeightBased && (!item.weight || item.weight <= 0));
    if (missingWeight) {
      showToast('warning', 'Weight Required', `Please enter weight for ${missingWeight.name} before checkout.`);
      return;
    }
    
    if (paymentMethods.length === 0) {
      showToast('error', 'Payment Methods', 'No payment methods available. Please contact administrator.');
      return;
    }
    setPaymentModalOpen(true);
  }, [cartItems, paymentMethods.length, showToast]);

  const handlePaymentConfirm = useCallback(
    async (payments: { paymentMethodId: number; amount: number }[], notes: string) => {
      if (processingPayment) return;
      
      try {
        setProcessingPayment(true);

        // Validate we have the required IDs
        if (!user?.cashierId) {
          showToast('error', 'Error', 'Cashier ID not found. Please log in again.');
          setProcessingPayment(false);
          return;
        }

        if (!selectedOutletId) {
          showToast('error', 'Error', 'Please select an outlet before completing a sale.');
          setProcessingPayment(false);
          return;
        }

        // Prepare order request
        const orderRequest = {
          outletId: selectedOutletId,
          cashierId: user.cashierId,
          orderType: 'COUNTER' as const,
          items: cartItems.map((item) => ({
            productId: item.productId,
            productName: item.name,
            // For weight-based products, quantity should always be 1
            quantity: item.isWeightBased ? 1 : item.quantity,
            // For weight-based products, unitPrice is calculated as price per unit × weight
            unitPrice: item.isWeightBased && item.weight ? item.price * item.weight : item.price,
            discountAmount: 0,
            notes: null,
            weight: item.weight,
          })),
          discountAmount: discountAmount,
          discountType: 'FIXED' as const,
          payments: payments,
          notes: notes || null,
        };

        const order = await posService.createOrder(orderRequest);
        
        setCompletedOrder(order);
        setPaymentModalOpen(false);
        setSuccessModalOpen(true);
        setCartItems([]);
        
        showToast('success', 'Order Complete', `Order #${order.orderNumber} completed successfully!`);
      } catch (err) {
        console.error('Failed to create order', err);
        const error = err as { response?: { data?: { message?: string }; status?: number } };
        let message = 'Failed to complete the order. Please try again.';
        if (error.response?.data?.message) {
          message = error.response.data.message;
        }
        showToast('error', 'Order Failed', message);
      } finally {
        setProcessingPayment(false);
      }
    },
    [cartItems, discountAmount, processingPayment, showToast, user?.cashierId, selectedOutletId],
  );

  const handlePaymentCancel = useCallback(() => {
    setPaymentModalOpen(false);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setSuccessModalOpen(false);
    setCompletedOrder(null);
  }, []);

  const handleNewOrder = useCallback(() => {
    setSuccessModalOpen(false);
    setCompletedOrder(null);
    setCartItems([]);
    showToast('info', 'New Order', 'Ready for next order.');
  }, [showToast]);

  const handlePrintReceipt = useCallback(() => {
    showToast('info', 'Print Receipt', 'Receipt printing will be available soon.');
  }, [showToast]);

  const handleQuickAction = useCallback(
    (action: 'coupon' | 'discount' | 'hold') => {
      const labels: Record<typeof action, string> = {
        coupon: 'Coupon',
        discount: 'Discount',
        hold: 'Hold Order',
      };
      showToast('info', labels[action], `${labels[action]} flow is coming soon.`);
    },
    [showToast],
  );

  return (
    <CashierLayout>
      <div className="box-border flex h-[calc(100vh-56px)] flex-col gap-6 overflow-hidden px-6 py-6">
        <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Open Drawer
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                    onClick={() => showToast('info', 'Sync', 'Product sync will be available soon.')}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-100 bg-white px-6 py-4">
              <div className="relative flex items-center">
                {/* Left Arrow */}
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  disabled={!showLeftArrow || categoryLoading}
                  className={`absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition ${
                    !showLeftArrow || categoryLoading
                      ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Categories */}
                <div className="flex-1 overflow-hidden px-10">
                  {categoryLoading ? (
                    <div className="flex items-center gap-3 overflow-x-auto">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={`category-skeleton-${index.toString()}`}
                          className="h-11 w-28 flex-shrink-0 animate-pulse rounded-xl bg-slate-100"
                        />
                      ))}
                    </div>
                  ) : (
                    <div 
                      ref={categoryScrollRef}
                      onScroll={checkScrollArrows}
                      className="flex items-center gap-3 overflow-x-auto scrollbar-none"
                    >
                      {categories.map((category) => {
                        const isActive = selectedCategory === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => handleSelectCategory(category.id)}
                            className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span className="text-lg">{category.icon}</span>
                            {category.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Arrow */}
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  disabled={!showRightArrow || categoryLoading}
                  className={`absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition ${
                    !showRightArrow || categoryLoading
                      ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Search product by title, SKU or barcode"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                    onClick={() => showToast('info', 'Barcode', 'Barcode scanning will be available soon.')}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a1 1 0 011-1h2m12 2V5a1 1 0 00-1-1h-2M4 17v2a1 1 0 001 1h2m12-2v2a1 1 0 01-1 1h-2M9 7v10m4-10v10m4-10v10" />
                    </svg>
                  </button>
                </div>
                <span className="text-sm text-slate-500 lg:ml-4">{filteredProducts.length} Result{filteredProducts.length === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden px-6 pb-6">
              <div className="h-full w-full overflow-y-auto pr-0.5">
                {productLoading ? (
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6 xl:grid-cols-7">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <div key={`product-skeleton-${index.toString()}`} className="rounded-lg border border-slate-100 bg-slate-50 p-1.5 shadow-sm">
                        <div className="mb-1.5 aspect-square w-full rounded-md bg-slate-200" />
                        <div className="h-2.5 w-3/4 rounded bg-slate-200" />
                        <div className="mt-1 h-2.5 w-2/3 rounded bg-slate-200" />
                        <div className="mt-1.5 h-6 w-full rounded-md bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-800">No products found</h3>
                    <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
                      Try adjusting your filters or search term. All active products will appear here for quick checkout.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-1.5 pb-2 sm:grid-cols-6 xl:grid-cols-7">
                    {filteredProducts.map((product) => (
                      <article
                        key={product.id}
                        className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        <div className="relative mb-1 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-slate-50">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">🛒</span>
                          )}
                          {product.stockStatus === 'LOW_STOCK' && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                              Low stock
                            </span>
                          )}
                          {product.stockStatus === 'OUT_OF_STOCK' && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                              Out of stock
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 min-h-[2.1rem] text-sm font-semibold text-slate-900">{product.name}</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs">
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(product.price ?? 0)}
                            {product.isWeightBased && <span className="text-[10px] font-normal">/kg</span>}
                          </span>
                          {product.isWeightBased && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
                              ⚖️ Weight
                            </span>
                          )}
                          {product.sku && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">SKU • {product.sku}</span>
                          )}
                          {product.stockStatus && (
                            <span
                              className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                product.stockStatus === 'IN_STOCK'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : product.stockStatus === 'LOW_STOCK'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {product.stockStatus === 'IN_STOCK' ? 'In stock' : product.stockStatus === 'LOW_STOCK' ? 'Low stock' : 'Out of stock'}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="mt-1.5 inline-flex items-center justify-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                        >
                          Add to Cart
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 w-full max-w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg lg:w-[380px] xl:w-[420px]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cart Items</h2>
                <p className="text-xs text-slate-500">{cartItems.length} item{cartItems.length === 1 ? '' : 's'} in current sale</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  onClick={() => showToast('info', 'Hold Sale', 'Pause order is coming soon.')}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6M4 5h16v14H4z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  onClick={() => setCartItems([])}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h5m11 11v5m0 0h-5m5 0l-6-6M7 20H5a1 1 0 01-1-1V7m16-3l-4 4m0 0H9m4 0v6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cartItems.length === 0 ? (
                  <div className="mt-16 flex flex-col items-center text-center text-slate-500">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">🛒</div>
                    <p className="text-sm font-medium">Your cart is empty</p>
                    <p className="mt-1 text-xs text-slate-400">Search or browse products to start a new order.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl">🛍️</span>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                            <button
                              type="button"
                              className="text-slate-400 transition hover:text-rose-500"
                              onClick={() => removeCartItem(item.productId)}
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.isWeightBased ? `${formatCurrency(item.price)}/kg` : `${formatCurrency(item.price)} each`}
                          </p>
                          {item.isWeightBased && (
                            <div className="mt-2">
                              <label htmlFor={`weight-${item.productId}`} className="text-xs text-slate-600">
                                Weight (kg):
                              </label>
                              <input
                                id={`weight-${item.productId}`}
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.weight ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value ? parseFloat(e.target.value) : null;
                                  updateCartWeight(item.productId, value);
                                }}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter weight"
                              />
                            </div>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            {item.isWeightBased ? (
                              // For weight-based products, show only the calculated total
                              <span className="text-xs text-slate-500">
                                {item.weight ? `${item.weight} kg × ${formatCurrency(item.price)}/kg` : 'Enter weight'}
                              </span>
                            ) : (
                              // For regular products, show quantity picker
                              <div className="flex items-center rounded-full border border-slate-200 bg-white">
                                <button
                                  type="button"
                                  className="px-2 py-1 text-slate-600 hover:text-slate-900"
                                  onClick={() => updateCartQuantity(item.productId, -1)}
                                >
                                  −
                                </button>
                                <span className="px-3 text-sm font-semibold text-slate-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  className="px-2 py-1 text-slate-600 hover:text-slate-900"
                                  onClick={() => updateCartQuantity(item.productId, 1)}
                                >
                                  +
                                </button>
                              </div>
                            )}
                            <span className="text-sm font-semibold text-slate-900">
                              {item.isWeightBased && item.weight 
                                ? formatCurrency(item.price * item.weight)
                                : formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-5">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tax</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Discount</span>
                    <span className="font-semibold text-slate-900">-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Applied Coupon(s)</span>
                    <span className="font-semibold text-slate-900">N/A</span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickAction('coupon')}
                    className="flex h-12 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Coupon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('discount')}
                    className="flex h-12 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    % Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAction('hold')}
                    className="flex h-12 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Hold Order
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPay}
                  className="mt-5 flex w-full items-center justify-between rounded-2xl bg-blue-600 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  <span>Proceed to Pay</span>
                  <div className="flex items-center gap-3">
                    <span>{formatCurrency(totalDue)}</span>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <CashDrawerModal
        open={drawerOpen}
        amount={drawerAmount}
        onAmountChange={setDrawerAmount}
        onConfirm={handleDrawerConfirm}
        onClose={() => setDrawerOpen(false)}
      />

      <PaymentModal
        open={paymentModalOpen}
        totalDue={totalDue}
        onConfirm={handlePaymentConfirm}
        onClose={handlePaymentCancel}
        paymentMethods={paymentMethods}
        enableOrderNotes={true}
      />

      <PaymentSuccessModal
        open={successModalOpen}
        order={completedOrder}
        onClose={handleSuccessClose}
        onPrintReceipt={handlePrintReceipt}
        onNewOrder={handleNewOrder}
      />

      <ToastContainer>
        {toast && (
          <Alert
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </ToastContainer>
    </CashierLayout>
  );
};

export default CashierPOSPage;
