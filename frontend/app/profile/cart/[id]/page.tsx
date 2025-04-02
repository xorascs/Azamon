'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL, fetchItems } from '@/app/config';
import { User } from '@/app/admin/users/user.entity';
import { Product } from '@/app/products/product.entity';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiX, FiPlus, FiMinus, FiTruck, FiTag, FiChevronUp, FiChevronDown, FiZap } from 'react-icons/fi';

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 pt-25">
      {/* Breadcrumbs Skeleton */}
      <div className="text-sm breadcrumbs px-6 py-4 max-w-7xl mx-auto">
        <ul className="flex space-x-2">
          {[1, 2, 3].map((item) => (
            <li key={item} className="h-4 w-24 bg-base-300 rounded-full animate-pulse"></li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Shopping Cart Skeleton */}
        <div className="col-span-12 md:col-span-8 space-y-6">
          <div className="h-10 w-48 bg-base-300 rounded-full animate-pulse"></div>
          
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center p-4 bg-base-100 rounded-xl shadow-sm border border-base-300">
                <div className="w-20 h-20 bg-base-300 rounded-lg animate-pulse"></div>
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-base-300 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
                </div>
                <div className="h-10 w-24 bg-base-300 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Skeleton */}
        <div className="col-span-12 md:col-span-4 space-y-6">
          <div className="h-8 w-48 bg-base-300 rounded-full animate-pulse"></div>
          
          <div className="bg-base-100 p-6 rounded-xl shadow-lg border border-base-300 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="space-y-2">
                <div className="h-4 w-32 bg-base-300 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-base-300 rounded-full animate-pulse"></div>
              </div>
            ))}
            <div className="h-12 w-full bg-base-300 rounded-full animate-pulse mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const [cart, setCart] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState<number>(5.0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoDetails, setPromoDetails] = useState<{ name: string; fee: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  async function fetchUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const userData: User = response.data;

      setUser(userData);
      fetchItems(userData.id, 'cart', setCart, setError);
    } catch (err) {
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }

  async function checkForPromo(promoName: string) {
    try {
      localStorage.removeItem('promo_name');
      localStorage.removeItem('promo_fee');
      setPromoDetails(null);
      setPromoError(null);

      const newData = {
        "notifications_token": localStorage.getItem('notifications_token'),
      }
      await axios.post(`${API_BASE_URL}/promo/check/${promoName}`, newData);

      setTimeout(() => {
        const localPromo = localStorage.getItem('promo_name');
        const localFee = localStorage.getItem('promo_fee');
        if (localPromo !== null && localFee !== null) {
          setPromoDetails({ name: localPromo, fee: parseFloat(localFee) });
          setPromoError(null);
        }
        else {
          setPromoError('Invalid promo code or server error.');
        }
      }, 1000)
    } catch (err) {
      setError('Failed to load check promo.');
    }
  }

  useEffect(() => {
    if (cart.length > 0) {
      const initialQuantities: Record<string, number> = {};
      cart.forEach((item) => {
        initialQuantities[item.id] = 1;
      });
      setQuantities(initialQuantities);
    }
  }, [cart]);

  const handleQuantityChange = async (productId: string, delta: number) => {
    const currentQuantity = quantities[productId] || 1;
    const newQuantity = currentQuantity + delta;
    if (newQuantity <= 0) return;

    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: newQuantity,
    }));
  };

  const handleRemoveFromCart = async (productId: string) => {
    setIsRemoving(productId);
    try {
      const token = localStorage.getItem('access_token');
      const notifications_token = localStorage.getItem('notifications_token');
      await axios.post(
        `${API_BASE_URL}/users/removeFromCart`,
        { notifications_token, userId: id, productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTimeout(() => {
        setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
        setQuantities((prevQuantities) => {
          const newQuantities = { ...prevQuantities };
          delete newQuantities[productId];
          return newQuantities;
        });
        setIsRemoving(null);
      }, 300);
    } catch (err) {
      console.error('Error removing item from cart:', err);
      setIsRemoving(null);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/payments/create-intent`, {
        userId: user!.id,
        deliveryType: shippingCost === 5 ? 'standart' : 'express',
        promo: localStorage.getItem('promo_name') ? promoCode : '',
        cartItemsIds: cart.map((item) => ({ productId: item.id, quantity: quantities[item.id] })),
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
  
      const { paymentId, payment } = response.data;
  
      if (paymentId !== null && payment !== null) {
        router.push(
          `/payment?paymentId=${paymentId}&payment=${encodeURIComponent(JSON.stringify(payment))}`
        );
      } else {
        console.error('No required data to checkout.');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  useEffect(() => {
    const calculateTotal = () => {
      let subtotal = 0;
      cart.forEach((product) => {
        subtotal += product.price * (quantities[product.id] || 1);
      });

      if (promoDetails !== null) {
        setTotalCost(subtotal - (subtotal * promoDetails.fee / 100) + shippingCost);
      }
      else {
        setTotalCost(subtotal + shippingCost);
      }
    };

    calculateTotal();
  }, [cart, quantities, shippingCost, promoDetails]);

  useEffect(() => {
    const localPromo = localStorage.getItem('promo_name');
    const localFee = localStorage.getItem('promo_fee');
    if (localPromo !== null && localFee !== null) {
      setPromoDetails({ name: localPromo, fee: parseFloat(localFee) });
      setPromoCode(localPromo);
    }

    fetchUser();
  }, [id]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-center text-error py-20">{error}</div>;
  if (!user) return <div className="text-center py-20">User not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 pt-25">
      {/* Breadcrumbs */}
      <div className="text-sm breadcrumbs px-6 py-4 max-w-7xl mx-auto">
        <ul>
          <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li><Link href={`/profile/${id}`} className="hover:text-primary transition-colors">{user.login}</Link></li>
          <li className="text-primary font-medium">Cart</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shopping Cart */}
        <div className="col-span-12 lg:col-span-7">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-bold mb-8 flex items-center gap-2"
          >
            <FiShoppingCart className="text-primary" />
            Shopping Cart
            {cart.length > 0 && (
              <span className="badge badge-primary ml-2">{cart.length}</span>
            )}
          </motion.h1>

          <AnimatePresence>
            {cart.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="space-y-4 max-h-[520px] overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
                }}
              >
                {cart.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: isRemoving === product.id ? 0.5 : 1, 
                      y: 0,
                      scale: isRemoving === product.id ? 0.95 : 1
                    }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className={`bg-base-100 p-4 rounded-xl shadow-sm border border-base-300 transition-all ${isRemoving === product.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <Link href={`/products/${product.id}`}>
                        {product.avatar ? (
                          <img
                            src={product.avatar}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                            {product.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link href={`/products/${product.id}`}>
                              <h3 className="font-semibold line-clamp-1 link link-hover">{product.name}</h3>
                            </Link>
                            <p className="text-sm text-gray-500">Category: {product.category}</p>
                            <div className="rating rating-xs mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <input
                                  key={i}
                                  type="radio"
                                  name={`cartRating-${product.id}`}
                                  className={`mask mask-star-2 ${i < product.rating! ? 'bg-yellow-400' : 'bg-gray-300'}`}
                                  checked={i === Math.floor(product.rating!) - 1}
                                  readOnly
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(product.id)}
                            className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error hover:text-error-content"
                            disabled={isRemoving === product.id}
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(product.id, -1)}
                              disabled={(quantities[product.id] || 1) <= 1}
                              className="btn btn-sm btn-circle btn-ghost"
                            >
                              <FiMinus size={16} />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {quantities[product.id] || 1}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(product.id, 1)}
                              className="btn btn-sm btn-circle btn-ghost"
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-sm">${product.price.toFixed(2)} each</p>
                            <p className="font-bold">
                              ${(product.price * (quantities[product.id] || 1)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-300 text-center"
              >
                <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShoppingCart size={48} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't added any items yet</p>
                <Link href="/products/categories/all" className="btn btn-primary">
                  Browse Products
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="col-span-12 lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="sticky top-6 space-y-6"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FiTruck className="text-secondary" />
              Order Summary
            </h2>
            
            <div className="bg-base-100 p-6 rounded-xl shadow-lg border border-base-300 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Items ({cart.length})</span>
                  <span>${cart.reduce((acc, product) => acc + product.price * (quantities[product.id] || 1), 0).toFixed(2)}</span>
                </div>
                
                {promoDetails && (
                  <div className="flex justify-between mb-2 text-green-500">
                    <span>Discount ({promoDetails.name})</span>
                    <span>-${(cart.reduce((acc, product) => acc + product.price * (quantities[product.id] || 1), 0) * promoDetails.fee / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-2 p-3 bg-base-100 rounded-lg group">
                <div className="flex items-center gap-2">
                  <FiTruck className="text-gray-500 group-hover:text-primary transition-colors" />
                  <span className="text-gray-600 font-medium">Shipping Method</span>
                </div>
                <div className="dropdown dropdown-end">
                  <label 
                    tabIndex={0} 
                    className="btn btn-sm btn-ghost flex items-center gap-1 px-3 py-1 rounded-lg border border-base-300 group-hover:border-primary bg-base-100 hover:bg-base-200 transition-all"
                  >
                    <span className="font-medium">${shippingCost.toFixed(2)}</span>
                    <div className="flex flex-col items-center">
                      <FiChevronUp className="w-3 h-3 -mb-1 text-gray-400" />
                      <FiChevronDown className="w-3 h-3 -mt-1 text-gray-400" />
                    </div>
                  </label>
                  <ul 
                    tabIndex={0} 
                    className="dropdown-content menu p-3 shadow-lg bg-base-100 rounded-box w-64 border border-base-300 mt-1"
                  >
                    <li>
                      <button 
                        onClick={() => setShippingCost(5.0)} 
                        className={`flex justify-between ${shippingCost === 5.0 ? 'active' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <FiTruck className="text-gray-500" />
                          <span>Standard Delivery</span>
                        </div>
                        <span className="font-medium">$5.00</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setShippingCost(10.0)} 
                        className={`flex justify-between ${shippingCost === 10.0 ? 'active' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <FiZap className="text-yellow-500" />
                          <span>Express Delivery</span>
                        </div>
                        <span className="font-medium">$10.00</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="divider"></div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</span>
              </div>
              
              <div className="space-y-4">
                <div className="collapse collapse-plus bg-base-200">
                  <input type="checkbox" />
                  <div className="collapse-title text-sm font-medium flex items-center gap-2">
                    <FiTag /> Apply Promo Code
                  </div>
                  <div className="collapse-content">
                    <div className="form-control">
                      <div className="input-group flex flex-wrap flex-col">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Enter promo code"
                          className="input input-bordered w-full"
                        />
                        <button
                          className="btn btn-secondary mt-2"
                          onClick={() => checkForPromo(promoCode)}
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && (
                        <div className="text-error text-sm mt-2">{promoError}</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`btn btn-primary w-full ${cart.length === 0 ? 'btn-disabled' : ''}`}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}