"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/types';
import { supabase } from '@/utils/supabase';

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);

  // Check auth state and load cart
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserCart(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserCart(session.user.id);
      } else {
        setItems([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserCart = async (userId: string) => {
    try {
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          products!cart_items_product_id_fkey(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      if (!cartItems || cartItems.length === 0) {
        setItems([]);
        return;
      }

      const formattedItems = cartItems.map((item: any) => ({
        ...item.products,
        quantity: item.quantity
      }));

      setItems(formattedItems);
    } catch (error: any) {
      console.error('Error loading cart:', error.message || 'Unknown error');
      setItems([]);
    }
  };

  const addToCart = async (product: Product) => {
    if (!user) return;

    try {
      const existingItem = items.find(item => item.id === product.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      // Update or insert in Supabase
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: product.id,
          quantity: newQuantity
        });

      if (error) throw error;

      // Update local state
      setItems(currentItems => {
        if (existingItem) {
          return currentItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...currentItems, { ...product, quantity: 1 }];
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(currentItems => currentItems.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      if (quantity > 0) {
        const { error } = await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            product_id: productId,
            quantity
          });

        if (error) throw error;
      } else {
        await removeFromCart(productId);
      }

      setItems(currentItems =>
        currentItems.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        ).filter(item => item.quantity > 0)
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
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