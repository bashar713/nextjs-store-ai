"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, Truck } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add products to localStorage cache
    const cachedProducts = localStorage.getItem('products');
    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts));
      setIsLoading(false);
    }

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
//        .limit(8)
//        .range(0, 7); // Fetch first 8 products

      if (error) throw error;

      setProducts(products || []);
      // Cache the products
      localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-gray-900 mb-6"
              >
                Discover Our Premium Collection
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-600 mb-8"
              >
                Explore our curated selection of high-quality products designed to enhance your lifestyle
              </motion.p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: TrendingUp, title: 'Trending Designs', desc: 'Latest furniture trends' },
                { icon: Award, title: 'Premium Quality', desc: 'Crafted with excellence' },
                { icon: Clock, title: 'Fast Delivery', desc: 'Quick and reliable shipping' },
                { icon: Truck, title: 'Free Shipping', desc: 'On orders over $500' },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm"
                >
                  <feature.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
              <p className="text-gray-600">Discover our most popular items</p>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
              <p className="mb-8">Stay updated with our latest products and exclusive offers</p>
              <div className="flex max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-l-lg focus:outline-none text-gray-900"
                />
                <button className="px-6 py-3 bg-secondary text-white rounded-r-lg hover:bg-secondary/90 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
