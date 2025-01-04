"use client";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Shield } from 'lucide-react';
import Image from 'next/image';
import { getCardType, formatCardNumber, formatExpiryDate, cardTypes } from '@/utils/cardUtils';

export default function Checkout() {
  const { items, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardType, setCardType] = useState('unknown');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Add payment processing logic here
    setTimeout(() => setLoading(false), 2000);
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
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
                  ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90'}`}
              >
                {loading ? 'Processing...' : `Pay $${totalPrice.toFixed(2)}`}
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