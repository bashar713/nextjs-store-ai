"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import Header from '@/components/Header';
import { Package } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_items: {
    quantity: number;
    product: {
      name: string;
      price: number;
    };
  }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        window.location.href = '/login';
        return;
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            product:products (
              name,
              price
            )
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the orders data
      const formattedOrders = orders?.map(order => ({
        ...order,
        total: order.order_items.reduce((sum: number, item: any) => 
          sum + (item.product.price * item.quantity), 0),
      })) || [];

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl font-semibold text-gray-800">Loading orders...</div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Package className="h-8 w-8 text-gray-800" />
          <h1 className="text-3xl font-bold text-gray-800">Your Orders</h1>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-700">
              You haven't placed any orders yet.
            </p>
            <p className="mt-2 text-gray-500">
              When you do, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <div key={order.id} className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Order placed: {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Order ID: <span className="font-mono">{order.id}</span>
                      </p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4">
                  <div className="divide-y divide-gray-200">
                    {order.order_items.map((item, index) => (
                      <div 
                        key={`${order.id}-item-${index}`} 
                        className="py-4 flex justify-between items-center"
                      >
                        <div className="pr-4">
                          <p className="text-base font-medium text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="text-base font-medium text-gray-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <p className="text-base font-semibold text-gray-900">Order Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${(order.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 