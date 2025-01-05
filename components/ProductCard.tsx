import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { loadingProductIds } = useCart();
  const isLoading = loadingProductIds.includes(product.id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            className="p-2 bg-white rounded-full shadow-md hover:bg-primary hover:text-white transition-colors"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
          <button
            onClick={onAddToCart}
            disabled={isLoading}
            className={`px-4 py-2 bg-primary text-white rounded-full text-sm font-medium 
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'} 
              transition-colors`}
          >
            {isLoading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
} 