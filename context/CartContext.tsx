"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loadingProductIds: string[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loadingProductIds, setLoadingProductIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserCart(session.user.id);
      } else {
        setUser(null);
        setItems([]);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserCart(session.user.id);
      } else {
        setUser(null);
        setItems([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      setItems([]);
      return false;
    }
    setUser(session.user);
    return true;
  };

  const loadUserCart = async (userId: string) => {
    try {
      setLoadingProductIds(prev => [...prev, userId]);
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          product:product_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const formattedItems = cartItems?.map((item) => ({
        ...item.product,
        quantity: item.quantity,
      })) || [];

      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoadingProductIds(prev => prev.filter(id => id !== userId));
    }
  };

  const addToCart = async (product: Product) => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setLoadingProductIds(prev => [...prev, product.id]);
      const existingItem = items.find(item => item.id === product.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: product.id,
          quantity: newQuantity,
        });

      if (error) throw error;

      if (existingItem) {
        setItems(items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        setItems([...items, { ...product, quantity: 1 }]);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoadingProductIds(prev => prev.filter(id => id !== product.id));
    }
  };

  const removeFromCart = async (productId: string) => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    try {
      setLoadingProductIds(prev => [...prev, productId]);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      setLoadingProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    try {
      setLoadingProductIds(prev => [...prev, productId]);
      if (quantity > 0) {
        const { error } = await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

        if (error) throw error;

        setItems(items.map(item =>
          item.id === productId
            ? { ...item, quantity }
            : item
        ));
      } else {
        await removeFromCart(productId);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setLoadingProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const clearCart = async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    try {
      setLoadingProductIds(prev => [...prev, user.id]);
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoadingProductIds(prev => prev.filter(id => id !== user.id));
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      loadingProductIds,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 