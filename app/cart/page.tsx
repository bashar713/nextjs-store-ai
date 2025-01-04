"use client";
import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-12 text-center"
          >
            <div className="flex flex-col items-center">
              <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
              <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
              <Link href="/">
                <button className="bg-primary text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
                <p className="text-gray-500 mt-1">{items.length} items</p>
              </div>
              
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.id} className="p-6 flex items-center">
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="ml-6 flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1">{item.description}</p>
                        </div>
                        <p className="text-lg font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="text-gray-900 w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-600 transition-colors flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="text-sm">Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex justify-between text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Including VAT</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Proceed to Checkout
                </button>
                <Link href="/">
                  <button className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 