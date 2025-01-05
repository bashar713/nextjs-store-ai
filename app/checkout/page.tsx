"use client";
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Shield } from 'lucide-react';
import Image from 'next/image';
import { getCardType, formatCardNumber, formatExpiryDate, cardTypes } from '@/utils/cardUtils';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('unknown');
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Fetch user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const shippingAddress = {
        street: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip'),
      };

      // First check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }

      // Create the order with the actual user's ID
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: session.user.id,  // This stores the actual customer's ID
            status: 'pending',
            payment_method: paymentMethod,
            shipping_address: shippingAddress,
            total_amount: totalPrice,

          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear the cart
      await clearCart();

      // Show success message
      toast.success('Order placed successfully! Thank you for your purchase.', {
        duration: 3000,
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error: any) {
      console.error('Error processing order:', error);
      setError(error.message || 'Failed to process order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {/* Checkout Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
              <p className="text-gray-600">Please fill in your information to complete your order.</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      defaultValue={userProfile?.full_name?.split(' ')[0] || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      defaultValue={userProfile?.full_name?.split(' ').slice(1).join(' ') || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    defaultValue={user?.email || ''}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                  />
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    required
                    defaultValue={userProfile?.address || ''}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      required
                      defaultValue={userProfile?.city || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      required
                      defaultValue={userProfile?.state || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-900 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      required
                      defaultValue={userProfile?.zip_code || ''}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod('card')}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span className="text-gray-900">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod('cash')}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <span className="text-gray-900">Cash on Delivery</span>
                  </label>
                </div>
              </div>

              {/* Conditionally render the Payment Information section */}
              {paymentMethod === 'card' && (
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                  <div>
                    <label htmlFor="card" className="block text-sm font-medium text-gray-900 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="card"
                        required
                        value={cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          if (formatted.length <= 19) { // Max length for non-AMEX cards
                            setCardNumber(formatted);
                            setCardType(getCardType(formatted));
                          }
                        }}
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8">
                        {cardType === 'unknown' ? (
                          <CreditCard className="w-6 h-6 text-gray-400" />
                        ) : (
                          <Image
                            src={cardTypes[cardType as keyof typeof cardTypes].icon}
                            alt={cardType}
                            width={32}
                            height={32}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium text-gray-900 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        id="expiry"
                        required
                        value={expiryDate}
                        onChange={(e) => {
                          const formatted = formatExpiryDate(e.target.value);
                          if (formatted.length <= 5) {
                            setExpiryDate(formatted);
                          }
                        }}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                      />
                    </div>
                    <div>
                      <label htmlFor="cvc" className="block text-sm font-medium text-gray-900 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        id="cvc"
                        required
                        maxLength={4}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          e.target.value = value;
                        }}
                        placeholder="123"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
                  ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90'}`}
              >
                {loading ? 'Processing...' : paymentMethod === 'card' 
                  ? `Pay $${totalPrice.toFixed(2)}`
                  : 'Place Order'
                }
              </button>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-8"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={item.image_url || "https://via.placeholder.com/150"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900 pt-2">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-gray-400" />
                  <span>Free shipping worldwide</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 