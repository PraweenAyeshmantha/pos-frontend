import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CashierLayout from '../../components/layout/CashierLayout';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import SelectOutletReminder from '../../components/cashier/SelectOutletReminder';
import PaymentModal from '../../components/cashier/payment/PaymentModal';
import PaymentSuccessModal from '../../components/cashier/payment/PaymentSuccessModal';
import ApplyCouponModal from '../../components/cashier/coupon/ApplyCouponModal';
import DiscountModal from '../../components/cashier/discount/DiscountModal';
import CustomProductModal from '../../components/cashier/custom-product/CustomProductModal';
import WeightInputModal from '../../components/cashier/weight-input/WeightInputModal';
import { productService } from '../../services/productService';
import { productCategoryService } from '../../services/productCategoryService';
import { posService } from '../../services/posService';
import { cashierSessionService } from '../../services/cashierSessionService';
import { orderService } from '../../services/orderService';
import { configurationService } from '../../services/configurationService';
import { stockService } from '../../services/stockService';
import type { Product } from '../../types/product';
import type { ProductCategory } from '../../types/taxonomy';
import type { PaymentMethod } from '../../types/payment';
import type { Order } from '../../types/order';
import type { Coupon } from '../../types/coupon';
import { useAuth } from '../../hooks/useAuth';
import { useOutlet } from '../../contexts/OutletContext';

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
  taxRate?: number; // Tax rate percentage (e.g., 10 for 10%)
}

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
  onClose?: () => void;
  mandatory?: boolean;
}> = ({ open, amount, onAmountChange, onConfirm, onClose, mandatory = false }) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            {mandatory ? 'Opening Balance Required' : 'Open Cash Drawer Amount'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mandatory
              ? 'You must enter an opening balance before using the POS.'
              : 'Enter the opening balance for your shift.'}
          </p>
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
          {!mandatory && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex-none sm:px-6"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:flex-none sm:px-6"
          >
            {mandatory ? 'Confirm' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CashierPOSPage: React.FC = () => {
  const { user } = useAuth();
  const { currentOutlet } = useOutlet();
  const selectedOutletId = currentOutlet?.id ?? null;
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
  const [drawerMandatory, setDrawerMandatory] = useState(false);
  const [checkingOpeningBalance, setCheckingOpeningBalance] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [enableOrderNotes, setEnableOrderNotes] = useState(true);
  const [enableSplitPayment, setEnableSplitPayment] = useState(true);
  const [enableCustomProduct, setEnableCustomProduct] = useState(true);
  const [enableStockManagement, setEnableStockManagement] = useState(true);
  const [enableStockValidation, setEnableStockValidation] = useState(true);
  // @ts-ignore - TODO: Implement when product variations are added
  const [showVariationsAsProducts, setShowVariationsAsProducts] = useState(false);
  // @ts-ignore - TODO: Use to conditionally show weight input for products
  const [enableWeightBasedPricing, setEnableWeightBasedPricing] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  
  // Coupon and Discount state
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: 'FIXED' | 'PERCENTAGE'; value: number } | null>(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [customProductModalOpen, setCustomProductModalOpen] = useState(false);
  const [weightInputModalOpen, setWeightInputModalOpen] = useState(false);
  const [weightInputProduct, setWeightInputProduct] = useState<Product | null>(null);

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
        
        // Debug: Log first few products' stock status
        console.log('Products loaded:', activeProducts.length);
        console.log('Sample product stock statuses:', 
          activeProducts.slice(0, 5).map(p => ({
            name: p.name,
            stockStatus: p.stockStatus
          }))
        );
        
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

  // Fetch configuration settings
  useEffect(() => {
    const fetchConfigurations = async () => {
      try {
        const configs = await configurationService.getAllGeneralConfigurations();
        const configMap: Record<string, string> = {};
        configs.forEach(config => {
          configMap[config.configKey] = config.configValue;
        });

        setEnableOrderNotes(configMap.enable_order_note !== 'false');
        setEnableSplitPayment(configMap.enable_split_payment !== 'false');
        setEnableCustomProduct(configMap.enable_custom_product !== 'false');
        setShowVariationsAsProducts(configMap.show_variations_as_products === 'true');
        setEnableWeightBasedPricing(configMap.enable_weight_based_pricing === 'true');

        // Fetch stock configurations
        const stockConfigs = await stockService.getStockConfigurations();
        const stockConfigMap: Record<string, string> = {};
        stockConfigs.forEach(config => {
          stockConfigMap[config.configKey] = config.configValue;
        });

        const stockMgmtEnabled = stockConfigMap.ENABLE_STOCK_MANAGEMENT !== 'false';
        const stockValidationEnabled = stockConfigMap.ENABLE_STOCK_VALIDATION !== 'false';
        
        console.log('Stock Configurations:', {
          ENABLE_STOCK_MANAGEMENT: stockConfigMap.ENABLE_STOCK_MANAGEMENT,
          ENABLE_STOCK_VALIDATION: stockConfigMap.ENABLE_STOCK_VALIDATION,
          stockMgmtEnabled,
          stockValidationEnabled
        });

        setEnableStockManagement(stockMgmtEnabled);
        setEnableStockValidation(stockValidationEnabled);
      } catch (error) {
        console.error('Failed to fetch configurations:', error);
        // Keep default values (true) on error
      }
    };

    fetchConfigurations();
  }, []);

  // Check for opening balance when page loads and outlet is set
  useEffect(() => {
    if (!selectedOutletId) return;

    let mounted = true;

    const checkOpeningBalance = async () => {
      try {
        setCheckingOpeningBalance(true);

        // Check if there's an active cashier session with opening balance already set
        const activeSession = await cashierSessionService.getMyActiveSession(selectedOutletId);

        if (!mounted) return;

        // If there's no active session or opening balance is 0, show mandatory modal
        if (!activeSession || activeSession.openingBalance === 0) {
          setDrawerMandatory(true);
          setDrawerOpen(true);
        }
        // If there's an active session with opening balance > 0, don't show the popup
      } catch (error) {
        console.error('Failed to check opening balance', error);
        if (mounted) {
          // On error, still allow POS usage but show warning
          showToast('warning', 'Opening Balance', 'Unable to verify opening balance. Please check your connection.');
        }
      } finally {
        if (mounted) {
          setCheckingOpeningBalance(false);
        }
      }
    };

    void checkOpeningBalance();

    return () => {
      mounted = false;
    };
  }, [selectedOutletId, showToast]);

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

      // Check stock status only if stock validation is enabled
      if (enableStockValidation) {
        if (product.stockStatus === 'OUT_OF_STOCK') {
          showToast('error', 'Out of Stock', `${product.name} is currently out of stock.`);
          return;
        }
      }

      // Check if weight-based pricing is enabled and product requires weight
      if (enableWeightBasedPricing && product.isWeightBased) {
        setWeightInputProduct(product);
        setWeightInputModalOpen(true);
        return;
      }

      // Add non-weight-based product directly to cart
      addProductToCart(product, null);
    },
    [showToast, enableWeightBasedPricing],
  );

  const addProductToCart = useCallback(
    (product: Product, weight: number | null) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.productId === product.id && item.weight === weight);
        if (existing) {
          return prev.map((item) =>
            item.productId === product.id && item.weight === weight
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
            weight,
            isWeightBased: product.isWeightBased,
            taxRate: product.taxRate ?? 0,
          },
        ];
      });
      showToast('success', 'Cart Updated', `${product.name} added to the cart.`);
    },
    [showToast, enableStockValidation],
  );

  const handleWeightInputSuccess = useCallback(
    (weight: number) => {
      if (weightInputProduct) {
        addProductToCart(weightInputProduct, weight);
        setWeightInputProduct(null);
      }
    },
    [weightInputProduct, addProductToCart],
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

  if (!selectedOutletId) {
    return (
      <CashierLayout>
        <SelectOutletReminder message="Choose a branch from the top navigation before using the POS." />
      </CashierLayout>
    );
  }

  const subtotal = useMemo(
    () => {
      const sum = cartItems.reduce((accumulator, item) => {
        if (item.isWeightBased && item.weight) {
          return accumulator + item.price * item.weight;
        }
        return accumulator + item.price * item.quantity;
      }, 0);
      return Math.round(sum * 100) / 100;
    },
    [cartItems],
  );

  const taxAmount = useMemo(() => {
    // Calculate tax based on each item's individual tax rate
    const tax = cartItems.reduce((acc, item) => {
      const itemSubtotal = item.isWeightBased && item.weight 
        ? item.price * item.weight 
        : item.price * item.quantity;
      const itemTaxRate = (item.taxRate ?? 0) / 100; // Convert percentage to decimal
      return acc + (itemSubtotal * itemTaxRate);
    }, 0);
    // Round to 2 decimals
    return Math.round(tax * 100) / 100;
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    let discount = 0;

    // For coupon: only calculate discount on applicable items
    if (appliedCoupon) {
      // Check if coupon has product restrictions
      const hasProductRestrictions =
        appliedCoupon.applicableProductIds && appliedCoupon.applicableProductIds.length > 0;

      // Calculate applicable subtotal (don't round - keep full precision for calculation)
      let applicableSubtotal = subtotal;
      if (hasProductRestrictions) {
        // Only sum up items that are applicable to the coupon
        applicableSubtotal = cartItems
          .filter((item) => appliedCoupon.applicableProductIds?.includes(item.productId))
          .reduce((acc, item) => {
            if (item.isWeightBased && item.weight) {
              return acc + item.price * item.weight;
            }
            return acc + item.price * item.quantity;
          }, 0);
        // Don't round here - keep full precision for percentage calculation
      }

      // Apply discount only to applicable subtotal
      if (appliedCoupon.discountType === 'PERCENTAGE') {
        discount += (applicableSubtotal * appliedCoupon.discountValue) / 100;
      } else {
        discount += appliedCoupon.discountValue;
      }
      // Round ONLY the final discount amount down to 2 decimals
      discount = Math.floor(discount * 100) / 100;
    }

    // For custom discount: applies to entire subtotal
    if (appliedDiscount) {
      let customDiscount = 0;
      if (appliedDiscount.type === 'PERCENTAGE') {
        customDiscount = (subtotal * appliedDiscount.value) / 100;
      } else {
        customDiscount = appliedDiscount.value;
      }
      // Round to 2 decimals, always rounding down to avoid over-discounting
      customDiscount = Math.floor(customDiscount * 100) / 100;
      discount += customDiscount;
      // Round total discount down to 2 decimals
      discount = Math.floor(discount * 100) / 100;
    }

    // Ensure discount doesn't exceed subtotal
    return Math.min(discount, subtotal);
  }, [subtotal, appliedCoupon, appliedDiscount, cartItems]);

  const totalDue = useMemo(() => {
    const total = subtotal + taxAmount - discountAmount;
    return Math.round(total * 100) / 100;
  }, [subtotal, taxAmount, discountAmount]);

  const handleDrawerConfirm = useCallback(async () => {
    if (!drawerAmount || Number.isNaN(Number.parseFloat(drawerAmount))) {
      showToast('warning', 'Cash Drawer', 'Please enter a valid opening amount.');
      return;
    }

    const amount = Number.parseFloat(drawerAmount);
    if (amount < 0) {
      showToast('warning', 'Cash Drawer', 'Opening balance cannot be negative.');
      return;
    }

    // If this is a mandatory opening balance, start a cashier session
    if (drawerMandatory && selectedOutletId && user?.cashierId) {
      try {
        await cashierSessionService.startSession({
          cashierId: user.cashierId,
          outletId: selectedOutletId,
          openingBalance: amount,
        });
        
        showToast('success', 'Opening Balance', `Opening balance of ${formatCurrency(amount)} has been recorded.`);
        setDrawerMandatory(false);
        setDrawerOpen(false);
        setDrawerAmount('');
      } catch (error) {
        console.error('Failed to start cashier session', error);
        showToast('error', 'Error', 'Failed to record opening balance. Please try again.');
      }
    } else if (drawerMandatory) {
      showToast('error', 'Error', 'Unable to start session. Please log in as a cashier.');
    } else {
      // Optional drawer open (just a notification, not creating transaction)
      showToast('success', 'Cash Drawer', `Opening balance set to ${formatCurrency(amount)}.`);
      setDrawerOpen(false);
      setDrawerAmount('');
    }
  }, [drawerAmount, drawerMandatory, selectedOutletId, user?.cashierId, showToast]);

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
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          discountType: appliedDiscount ? appliedDiscount.type : undefined,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          payments: payments,
          notes: notes || null,
        };

        const order = await posService.createOrder(orderRequest);
        
        setCompletedOrder(order);
        setPaymentModalOpen(false);
        setSuccessModalOpen(true);
        setCartItems([]);
        setAppliedCoupon(null);
        setAppliedDiscount(null);
        
        showToast('success', 'Order Complete', `Order #${order.orderNumber} completed successfully!`);
      } catch (err) {
        console.error('Failed to create order', err);
        const error = err as { response?: { data?: { message?: string }; status?: number } };
        let message = 'Failed to complete the order. Please try again.';
        let title = 'Order Failed';

        if (error.response?.data?.message) {
          const errorMessage = error.response.data.message;

          // Check for stock-related errors
          if (errorMessage.includes('Insufficient stock') || errorMessage.includes('stock')) {
            title = 'Stock Issue';
            message = errorMessage;
            // You could also highlight the problematic items in the cart here
          } else {
            message = errorMessage;
          }
        }

        showToast('error', title, message);
      } finally {
        setProcessingPayment(false);
      }
    },
    [cartItems, discountAmount, appliedCoupon, appliedDiscount, processingPayment, showToast, user?.cashierId, selectedOutletId],
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

  const handlePrintReceipt = useCallback(async () => {
    if (!completedOrder) {
      showToast('warning', 'No Order', 'No completed order to print.');
      return;
    }

    try {
      showToast('info', 'Opening Receipt', 'Preparing receipt for printing...');
      
      const receiptHtml = await orderService.printReceipt(completedOrder.id);
      
      // Open receipt in a new window which will auto-trigger print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
      } else {
        showToast('error', 'Print Failed', 'Please allow pop-ups to print receipts.');
      }
    } catch (error) {
      console.error('Failed to print receipt:', error);
      showToast('error', 'Print Failed', 'Failed to print receipt. Please try again.');
    }
  }, [completedOrder, showToast]);

  const handleQuickAction = useCallback(
    (action: 'coupon' | 'discount' | 'hold') => {
      if (action === 'coupon') {
        if (cartItems.length === 0) {
          showToast('warning', 'Empty Cart', 'Add items to your cart first.');
          return;
        }
        setCouponModalOpen(true);
      } else if (action === 'discount') {
        if (cartItems.length === 0) {
          showToast('warning', 'Empty Cart', 'Add items to your cart first.');
          return;
        }
        setDiscountModalOpen(true);
      } else if (action === 'hold') {
        showToast('info', 'Hold Order', 'Hold order feature is coming soon.');
      }
    },
    [cartItems.length, showToast],
  );

  const handleApplyCoupon = useCallback(
    (coupon: Coupon) => {
      setAppliedCoupon(coupon);
      setCouponModalOpen(false);
      // Clear discount when coupon is applied
      setAppliedDiscount(null);
      showToast('success', 'Coupon Applied', `${coupon.code} applied successfully.`);
    },
    [showToast],
  );

  const handleApplyDiscount = useCallback(
    (discountType: 'FIXED' | 'PERCENTAGE', discountValue: number) => {
      setAppliedDiscount({ type: discountType, value: discountValue });
      setDiscountModalOpen(false);
      // Clear coupon when custom discount is applied
      setAppliedCoupon(null);
      const label = discountType === 'FIXED' ? `$${discountValue.toFixed(2)}` : `${discountValue}%`;
      showToast('success', 'Discount Applied', `${label} discount applied successfully.`);
    },
    [showToast],
  );

  const handleAddCustomProduct = useCallback(
    (productName: string, price: number, quantity: number) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.name === productName && item.price === price);
        if (existing) {
          return prev.map((item) =>
            item.name === productName && item.price === price
              ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
              : item,
          );
        }
        return [
          ...prev,
          {
            productId: 0, // Custom product has no ID
            name: productName,
            price: price,
            quantity: quantity,
            imageUrl: undefined,
            weight: null,
            isWeightBased: false,
            taxRate: 0, // Default tax rate for custom products
          },
        ];
      });
      setCustomProductModalOpen(false);
      showToast('success', 'Product Added', `${productName} added to cart successfully.`);
    },
    [showToast],
  );

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    showToast('info', 'Coupon Removed', 'Coupon has been removed from this order.');
  }, [showToast]);

  const handleRemoveDiscount = useCallback(() => {
    setAppliedDiscount(null);
    showToast('info', 'Discount Removed', 'Discount has been removed from this order.');
  }, [showToast]);

  return (
    <CashierLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-6">
        <div className="flex flex-1 flex-col gap-6 overflow-hidden lg:flex-row">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!drawerMandatory) {
                        setDrawerOpen(true);
                      }
                    }}
                    disabled={checkingOpeningBalance || drawerMandatory}
                    className="inline-flex items-center rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
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
                <div className="flex items-center gap-3">
                  {enableCustomProduct && (
                    <button
                      type="button"
                      onClick={() => setCustomProductModalOpen(true)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Custom Product
                    </button>
                  )}
                  <span className="text-sm text-slate-500">{filteredProducts.length} Result{filteredProducts.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden px-6 pb-6">
              <div className="h-full w-full overflow-y-auto pr-0.5">
                {productLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={`product-skeleton-${index.toString()}`} className="flex items-center gap-4 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                        <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-lg bg-slate-200" />
                        <div className="flex-1">
                          <div className="h-4 w-2/3 rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
                        </div>
                        <div className="h-9 w-24 rounded-md bg-slate-200" />
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
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    {filteredProducts.map((product) => (
                      <article
                        key={product.id}
                        className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">🛒</div>
                          )}
                          {enableStockManagement && product.stockStatus === 'LOW_STOCK' && (
                            <span className="absolute left-1 top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                              Low
                            </span>
                          )}
                          {enableStockManagement && product.stockStatus === 'OUT_OF_STOCK' && (
                            <span className="absolute left-1 top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                              Out
                            </span>
                          )}
                        </div>
                        
                        <div className="flex min-w-0 flex-1 flex-col">
                          <h3 className="truncate text-sm font-semibold text-slate-900">{product.name}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-blue-600">
                              {formatCurrency(product.price ?? 0)}
                              {product.isWeightBased && <span className="text-xs font-normal">/kg</span>}
                            </span>
                            {product.isWeightBased && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                ⚖️ Weight
                              </span>
                            )}
                            {product.sku && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                SKU: {product.sku}
                              </span>
                            )}
                            {enableStockManagement && product.stockStatus !== undefined && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  product.stockStatus === 'IN_STOCK'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : product.stockStatus === 'LOW_STOCK'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {product.stockStatus === 'IN_STOCK'
                                  ? '✓ In stock'
                                  : product.stockStatus === 'LOW_STOCK'
                                    ? '⚠ Low stock'
                                    : '✗ Out of stock'}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={enableStockValidation && product.stockStatus === 'OUT_OF_STOCK'}
                          className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            enableStockValidation && product.stockStatus === 'OUT_OF_STOCK'
                              ? 'bg-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
                          }`}
                        >
                          {product.stockStatus === 'OUT_OF_STOCK'
                            ? 'Out of Stock'
                            : product.stockStatus === 'NO_STOCK_CONFIG'
                              ? 'No Stock Config'
                              : 'Add to Cart'}
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
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Discount</span>
                      <span className="font-semibold text-slate-900">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  {/* Applied Coupon */}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 3.5h6v17H9z" opacity="0.3" />
                          <path d="M12 2l2 4h4l-3 3 1 4-4-3-4 3 1-4-3-3h4l2-4zm0 8h.01M12 13c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm2 9h-4m2-4v4" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs font-semibold">{appliedCoupon.code}</p>
                          <p className="text-[10px] text-emerald-700">Coupon Applied</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="ml-2 text-emerald-600 hover:text-emerald-700"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Applied Custom Discount */}
                  {appliedDiscount && (
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-blue-900">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-3.315 0-6 .895-6 2v9c0 1.105 2.685 2 6 2s6-.895 6-2v-9c0-1.105-2.685-2-6-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 10c0 1.105 2.685 2 6 2s6-.895 6-2" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs font-semibold">
                            {appliedDiscount.type === 'FIXED'
                              ? `$${appliedDiscount.value.toFixed(2)}`
                              : `${appliedDiscount.value}%`}
                          </p>
                          <p className="text-[10px] text-blue-700">Custom Discount</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
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
        onClose={drawerMandatory ? undefined : () => setDrawerOpen(false)}
        mandatory={drawerMandatory}
      />

      <ApplyCouponModal
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        onSuccess={handleApplyCoupon}
        totalAmount={subtotal}
        cartItems={cartItems}
      />

      <DiscountModal
        open={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        onSuccess={handleApplyDiscount}
        totalAmount={subtotal}
      />

      <CustomProductModal
        open={customProductModalOpen}
        onClose={() => setCustomProductModalOpen(false)}
        onSuccess={handleAddCustomProduct}
      />

      <WeightInputModal
        open={weightInputModalOpen}
        onClose={() => {
          setWeightInputModalOpen(false);
          setWeightInputProduct(null);
        }}
        onSuccess={handleWeightInputSuccess}
        productName={weightInputProduct?.name ?? ''}
        unit={weightInputProduct?.unit ?? 'kg'}
      />

      <PaymentModal
        open={paymentModalOpen}
        totalDue={totalDue}
        onConfirm={handlePaymentConfirm}
        onClose={handlePaymentCancel}
        paymentMethods={paymentMethods}
        enableOrderNotes={enableOrderNotes}
        enableSplitPayment={enableSplitPayment}
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
