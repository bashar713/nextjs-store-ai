"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddProductForm from '@/components/admin/AddProductForm';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import EditProductForm from '@/components/admin/EditProductForm';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  created_at: string;
  stock_quantity: number;
}

interface OrderWithDetails {
  id: string;
  created_at: string;
  status: string;
  payment_method: string;
  total: number;
  total_amount: number;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  managed_users: {
    email: string;
  };
  order_items: {
    quantity: number;
    price_at_time: number;
    product: {
      name: string;
    };
  }[];
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('managed_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched managed users:', data); // Debug log
      setUsers(data || []);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error fetching managed users:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);

    try {
      // First delete from managed_users table
      const { error: managedUserError } = await supabase
        .from('managed_users')
        .delete()
        .eq('id', userToDelete.id);

      if (managedUserError) {
        console.error('Managed users delete error:', managedUserError);
        throw new Error('Failed to delete from managed users');
      }

      // Then delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);

      if (profileError) {
        console.error('Profile delete error:', profileError);
        throw new Error('Failed to delete from profiles');
      }

      // Update local state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Show success message
      setError('User successfully deleted from all tables');
      setTimeout(() => setError(null), 3000);

    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setProductToDelete(product);
    setShowDeleteProductModal(true);
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete) return;
    setDeleteProductLoading(true);

    try {
      // Delete product image from storage if it exists
      if (productToDelete.image_url) {
        const fileName = productToDelete.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('product-images')
            .remove([fileName]);
        }
      }

      // Delete product from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteProductModal(false);
      setProductToDelete(null);
      setError('Product successfully deleted');
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    } finally {
      setDeleteProductLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditProductModal(false);
    setError('Product updated successfully!');
    setTimeout(() => setError(null), 3000);
    fetchProducts(); // Refresh products list
  };

  const handleAddSuccess = () => {
    setShowAddProductModal(false);
    setError('Product added successfully!');
    setTimeout(() => setError(null), 3000);
    fetchProducts(); // Refresh the products list
  };

  const fetchOrders = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          managed_users!id (
            email
          ),
          order_items (
            quantity,
            price_at_time,
            product:product_id (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      // Get current user session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Check if user has admin role using their ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to verify admin status');
      }

      if (profile?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can update order status');
      }

      // Update the order status in the database
      const { data, error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(updateError.message);
      }

      if (!data) {
        throw new Error('Failed to update order status');
      }

      // Update local state immediately for better UX
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId
            ? { ...order, ...data }
            : order
        )
      );
      
      toast.success('Order status updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update order status';
      console.error('Error updating order:', errorMessage);
      toast.error(errorMessage);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    // Set up real-time subscription for order status updates
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // Update the orders list when a change occurs
          setOrders(currentOrders =>
            currentOrders.map(order =>
              order.id === payload.new.id
                ? { ...order, status: payload.new.status }
                : order
            )
          );
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-bold text-gray-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Back to Store
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className={`mb-4 p-4 rounded ${
            error.includes('successfully') 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Managed Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Products</h2>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-12 rounded-lg overflow-hidden">
                        <img
                          src={product.image_url || "https://via.placeholder.com/150"}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${product.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setProductToEdit(product);
                            setShowEditProductModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Customer Orders</h2>
          </div>

          {loadingOrders ? (
            <div className="text-center py-4">Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.managed_users?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-sm rounded-full px-3 py-1 border transition-colors duration-200 ${getStatusStyle(order.status)}`}
                        >
                          <option value="pending" className="bg-white text-gray-800">Pending</option>
                          <option value="processing" className="bg-white text-gray-800">Processing</option>
                          <option value="completed" className="bg-white text-gray-800">Completed</option>
                          <option value="cancelled" className="bg-white text-gray-800">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total_amount ? Number(order.total_amount).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 animate-modal">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
              <button
                onClick={handleDeleteCancel}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete user{' '}
                <span className="font-semibold text-gray-700">
                  {userToDelete?.full_name || 'N/A'}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {showDeleteProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Product</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteProductModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={deleteProductLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProductConfirm}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
                disabled={deleteProductLoading}
              >
                {deleteProductLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Product</h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <AddProductForm 
              onSuccess={handleAddSuccess}
              onCancel={() => setShowAddProductModal(false)}
            />
          </div>
        </div>
      )}

      {showEditProductModal && productToEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
              <button
                onClick={() => {
                  setShowEditProductModal(false);
                  setProductToEdit(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <EditProductForm 
              product={productToEdit}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditProductModal(false);
                setProductToEdit(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-8 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.managed_users?.email}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shipping_address.street}<br />
                  {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}<br />
                  {selectedOrder.shipping_address.zip}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-4">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.order_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${(item.price_at_time * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-base font-medium text-gray-900">Total</p>
                <p className="text-lg font-bold text-gray-900">${selectedOrder.total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}