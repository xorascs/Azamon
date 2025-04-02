'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useElements, useStripe, Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiCreditCard, FiGlobe, FiLoader, FiLock, FiMail, FiMapPin, FiPhone, FiShield, FiShoppingCart, FiTag, FiTruck } from 'react-icons/fi';

// Load the Stripe instance
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_WS_URL as string;

export default function PaymentWrapper() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentPage />
    </Elements>
  );
}

function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [subtotal, setSubtotal] = useState<number>(0);
  const [deliveryPrice, setDeliveryPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cart, setCart] = useState<any | null>(null); // Cart data
  const [isCartLoading, setIsCartLoading] = useState<boolean>(true); // New state for cart loading
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const stripe = useStripe();
  const elements = useElements();

  const payment = searchParams.get('payment');

  useEffect(() => {
    // Fetch cart details
    const fetchCartDetails = async () => {
      try {
        if (!payment) {
          setMessage('Missing payment ID.');
          setIsCartLoading(false); // Stop loading if no payment ID
          return;
        }

        const parsedPayment = JSON.parse(payment);
        parsedPayment.cartItems = JSON.parse(parsedPayment.cartItems);

        let cartItemsTotal = 0;
        const deliveryPrice = parsedPayment.deliveryType === 'standart' ? 5 : 10;
        for (const cartItem of parsedPayment.cartItems) {
          cartItemsTotal = cartItemsTotal + cartItem.price * cartItem.quantity;
        }
        setSubtotal(cartItemsTotal);
        setDeliveryPrice(deliveryPrice);
        if (localStorage.getItem('promo_name') !== null && localStorage.getItem('promo_fee') !== null) {
          const promoFee = (parseFloat(localStorage.getItem('promo_fee')!) / 100);
          setDiscount(cartItemsTotal * promoFee);
        }

        setCart(parsedPayment);
      } catch (err) {
        console.error('Error fetching cart details:', err);
        setMessage('Failed to load cart details.');
      } finally {
        setIsCartLoading(false); // Stop loading after fetching or error
      }
    };

    fetchCartDetails();

    // Connect to the WebSocket server
    const socket = io(SOCKET_SERVER_URL, {
      query: { notificationToken: localStorage.getItem('notifications_token') },
    });

    // Listen for payment responses
    socket.on('paymentsConfirm', (data) => {
      const { status, response } = data;

      if (status === 'success') {
        localStorage.removeItem('promo_name');
        localStorage.removeItem('promo_fee');
        setTimeout(() => router.push('/success?success=true'), 3000);
      } else if (status === 'error') {
        setMessage(response);
        setTimeout(() => router.push(`/success?success=false&reason=${response}`), 3000);
      } else {
        setMessage('Payment processing...');
        setLoading(false);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [router, payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setMessage('Stripe is not initialized.');
      return;
    }

    const paymentId = searchParams.get('paymentId');
    if (!paymentId) {
      setMessage('Missing payment id.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setMessage('Card element not found.');
      return;
    }

    // Validate form data
    const { phone, address, city, state, postalCode, country } = formData;
    if (!phone || !address || !city || !state || !postalCode || !country) {
      setMessage('Please fill in all required fields.');
      return;
    }

    try {
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          phone: formData.phone,
          address: {
            line1: formData.address,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            country: formData.country,
          },
        },
      });

      if (paymentMethodError) {
        setMessage(paymentMethodError.message || 'Failed to create payment method.');
        return;
      }

      setLoading(true);

      await axios.post(
        `${API_BASE_URL}/payments/confirm-payment`,
        {
          notifications_token: localStorage.getItem('notifications_token'),
          paymentIntentId: paymentId,
          paymentMethodId: paymentMethod.id,
          customerDetails: formData,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );
    } catch (err) {
      setMessage('An error occurred while processing your payment.');
      console.error('Payment error:', err);
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 flex items-center justify-center pt-14"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 max-lg:m-5"
      >
        {/* Left Side: Cart Details */}
        <div 
          className="flex-1 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiShoppingCart className="text-2xl text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Order Summary</h2>
          </div>
  
          {/* Skeleton Loader for Cart Details */}
          {isCartLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-4 border-b border-gray-200 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                      <div className="h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                </motion.div>
              ))}
              <div className="mt-8 flex justify-between animate-pulse">
                <div className="h-6 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
                <div className="h-6 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded"></div>
              </div>
            </div>
          ) : cart ? (
            <AnimatePresence>
              <motion.div 
                layout
                className="max-h-[400px] overflow-y-auto pr-2" // Added scrollable container
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
                }}
              >
                <motion.ul layout>
                  {cart.cartItems.map((item: any, index: number) => (
                    <motion.li
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center justify-between py-4 border-b border-gray-200 last:border-none"
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ rotate: 5 }}
                          className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center text-lg font-semibold uppercase shadow-inner"
                        >
                          {item.avatar ? (
                            <img 
                              src={item.avatar} 
                              alt={item.name} 
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-primary">{item.name.charAt(0)}</span>
                          )}
                        </motion.div>
                        <div>
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-gray-700 font-medium">
                        &euro; {(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </motion.li>
                    ))}
                </motion.ul>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 py-8 text-center"
            >
              Failed to load cart details.
            </motion.p>
          )}
  
          {/* Total Section */}
          {!isCartLoading && cart && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-8 border-t border-gray-200"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">&euro; {subtotal.toFixed(2)}</span>
              </div>
              {(localStorage.getItem('promo_name') !== null && localStorage.getItem('promo_fee') !== null) && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-green-600">-&euro; {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-gray-800">
                  &euro; {deliveryPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-800">Total:</span>
                <span className="text-xl font-bold text-primary">
                  &euro; {parseFloat(cart.total).toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}
  
          {!isCartLoading && cart && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-sm text-gray-600 space-y-2"
            >
              <p className="flex items-center gap-2">
                <FiTruck className="text-primary" />
                <span>Delivery: <span className="font-medium">{cart.deliveryType}</span></span>
              </p>
              {cart.promo && (
                <p className="flex items-center gap-2">
                  <FiTag className="text-primary" />
                  <span>Promo Code: <span className="font-medium">{cart.promo}</span></span>
                </p>
              )}
            </motion.div>
          )}
        </div>
  
        {/* Right Side: Payment Form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-96 bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiCreditCard className="text-2xl text-primary" />
            <h2 className="text-2xl font-bold text-gray-800">Complete Payment</h2>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="+1234567890"
                  required
                />
                <FiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </motion.div>
  
            {/* Address Details */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="123 Main St"
                  required
                />
                <FiMapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </motion.div>
  
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="NY"
                  required
                />
              </div>
            </motion.div>
  
            {/* Postal Code */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <div className="relative">
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="10001"
                  required
                />
                <FiMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </motion.div>
  
            {/* Country */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <div className="relative">
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="USA"
                  required
                />
                <FiGlobe className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </motion.div>
  
            {/* Card Details Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Details</label>
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="mt-1 p-3 border border-gray-300 rounded-lg shadow-sm bg-white"
              >
                <CardElement
                  options={{
                    hidePostalCode: true,
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#32325d',
                        fontFamily: '"Inter", sans-serif',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#fa755a',
                      },
                    },
                  }}
                />
              </motion.div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <FiLock className="text-primary" />
                Your payment is securely processed. We never store your card details.
              </p>
            </motion.div>
  
            {/* Error Message */}
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2"
              >
                <FiAlertCircle className="text-lg" />
                <span>{message}</span>
              </motion.div>
            )}
  
            {/* Submit Button */}
            <motion.button
              type="submit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full cursor-pointer py-3 px-6 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg hover:shadow-primary/30 transition-all duration-300 ${
                loading || !stripe ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={!stripe || loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    <FiLoader className="text-lg" />
                  </motion.span>
                  Processing Payment...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FiCreditCard className="text-lg" />
                  Pay &euro; {cart ? parseFloat(cart.total).toFixed(2) : '0.00'}
                </span>
              )}
            </motion.button>
  
            {/* Security Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center gap-4 pt-4"
            >
              <FiShield className="text-green-500 text-xl" />
              <span className="text-xs text-gray-500">256-bit SSL Encryption</span>
              <FiCheckCircle className="text-green-500 text-xl" />
              <span className="text-xs text-gray-500">PCI Compliant</span>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}