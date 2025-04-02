'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL, isUserAdmin, fetchItems, getUserIdFromToken } from '@/app/config';
import { User } from '@/app/admin/users/user.entity';
import { Product } from '@/app/products/product.entity';
import { isUserOwnerProfile } from '@/app/config';
import Link from 'next/link';
import { MdAccessTime, MdEmail, MdOutlineEdit } from 'react-icons/md';
import { FaExclamationTriangle, FaLock, FaUser } from 'react-icons/fa';
import { FaBasketShopping, FaCheck, FaClock, FaDollarSign } from 'react-icons/fa6';
import { io } from 'socket.io-client';
import { RxCross1, RxCross2, RxCrossCircled } from 'react-icons/rx';
import { motion } from "framer-motion";

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-base-100 pt-25">
      {/* Breadcrumbs Skeleton */}
      <div className="text-sm breadcrumbs px-6 py-4 max-w-7xl mx-auto">
        <ul>
          <li>
            <div className="h-4 w-12 bg-base-300 rounded animate-pulse"></div>
          </li>
          <li>
            <div className="h-4 w-12 bg-base-300 rounded animate-pulse"></div>
          </li>
        </ul>
      </div>

      {/* User Section Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Avatar Skeleton */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-96 h-96 bg-base-300 rounded-lg animate-pulse"></div>
          </div>

          {/* User Details Skeleton */}
          <div className="flex flex-col gap-2">
            <div className='flex'>
              <div className="h-9 w-1/4 bg-base-300 rounded animate-pulse"></div>
              <div className="h-6 w-1/10 m-2 bg-base-300 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
            <div className="h-14 w-1/4 mt-4 bg-base-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Additional Information Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-base-100 p-8 rounded-3xl shadow-lg">
            <div className="h-8 w-1/2 bg-base-300 rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="flex flex-row justify-between">
                <div className="flex items-center w-1/2 gap-4 mb-6">
                  <div className="p-8 bg-base-300 rounded-lg animate-pulse"></div>
                  <div className="flex flex-col w-full gap-2">
                    <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-4 w-1/3 bg-base-300 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center w-1/2 gap-4 mb-6">
                  <div className="p-8 bg-base-300 rounded-lg animate-pulse"></div>
                  <div className="flex flex-col w-full gap-2">
                    <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-4 w-1/3 bg-base-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-base-100 p-8 rounded-3xl shadow-lg">
            <div className="h-8 w-1/2 bg-base-300 rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="flex flex-row justify-between">
                <div className="flex items-center w-1/2 gap-4 mb-6">
                  <div className="p-8 bg-base-300 rounded-lg animate-pulse"></div>
                  <div className="flex flex-col w-full gap-2">
                    <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-4 w-1/3 bg-base-300 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center w-1/2 gap-4 mb-6">
                  <div className="p-8 bg-base-300 rounded-lg animate-pulse"></div>
                  <div className="flex flex-col w-full gap-2">
                    <div className="h-4 w-1/2 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-4 w-1/3 bg-base-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_WS_URL as string;

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [privateOrders, setPrivateOrders] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<{ successfulOrders: number, failedOrders: number }>();
  const [selectedPrivateOrder, setSelectedPrivateOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setOwner] = useState<boolean>(false);
  const [isAdmin, setAdmin] = useState<boolean>(false);

  const [editUserForm, setEditUserForm] = useState<User | null>(null);
  const [isEditModal, setIsEditModal] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState<Partial<User>>({
    login: undefined,
    email: undefined,
    password: undefined,
    role: undefined,
  });
  function actEditModal(user: User | null) {
    setIsEditModal(!isEditModal);
    setEditUserForm(user);
    if (user) {
      setNewUserForm({
        id: user.id,
        login: user.login,
        email: user.email,
        password: undefined,
        role: user.role,
      });
    }
  }

  const [statusFilter, setStatusFilter] = useState<string>('all'); 
  const [sortOption, setSortOption] = useState<string>('newest'); 
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  const handleSortChange = (value: string) => {
    setSortOption(value);
  };
  const filteredAndSortedOrders = useMemo(() => {
    let filteredOrders = privateOrders;
  
    // Apply status filter
    if (statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter((order) => order.status === statusFilter);
    }
  
    // Apply sorting
    switch (sortOption) {
      case 'newest':
        filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filteredOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'totalAsc':
        filteredOrders.sort((a, b) => a.total - b.total);
        break;
      case 'totalDesc':
        filteredOrders.sort((a, b) => b.total - a.total);
        break;
      default:
        break;
    }
  
    return filteredOrders;
  }, [privateOrders, statusFilter, sortOption]);

  async function editUser(user: Partial<User>) {
    try {
      const newData = {
        ...user,
        notifications_token: localStorage.getItem("notifications_token"),
      };
      await axios.patch(`${API_BASE_URL}/users/${editUserForm!.id}`, newData, { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      setIsEditModal(false);
    } catch (error) {
      console.error("Error editing user:", error);
    }
  }

  async function getPayments(userId: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders.');
    }
  }

  async function getPrivatePayments(userId: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/private?userId=${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setPrivateOrders(response.data);
    } catch (err) {
      setError('Failed to load orders.');
    }
  }

  async function getOrdersData(userId: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/ordersData/${userId}`);
      const { successfulOrders, failedOrders } = response.data;
      setOrdersData({successfulOrders, failedOrders});
    } catch (err) {
      setError('Failed to load orders.');
    }
  }

  // Add this function to your component
  const updateOrderStatusSender = async (orderId: number, status: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/payments/sender/${orderId}`, 
        { 
          "notifications_token": localStorage.getItem('notifications_token'),
          status
        },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
      );
    } catch (error) {
      setError('Failed to update order');
    }
  };

  // Add this function to your component
  const updateOrderStatusReceiver = async (orderId: number, status: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/payments/receiver/${orderId}`, 
        { 
          "notifications_token": localStorage.getItem('notifications_token'),
          status
        },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
      );
    } catch (error) {
      setError('Failed to update order');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditModal && editUserForm) {
      await editUser(newUserForm);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserForm((prev) => ({ ...prev, [name]: value }));
  };

  async function fetchUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`);
      const userData: User = response.data;

      setUser(userData);
      fetchItems(userData.id, 'products', setProducts, setError);
      getOwner(userData);
      getAdmin();
      getOrdersData(userData.id);
      if (isUserAdmin() || isUserOwnerProfile(userData)) {
        getPayments(userData.id);
        getPrivatePayments(userData.id);
      }
    } catch (err) {
      setError('Failed to load user details.');
    } finally {
        setLoading(false);
    }
  }

  const handleAvatarChange = async (userId: number) => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    // Trigger the file dialog
    fileInput.click();
    
    // Handle file selection
    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement; // Cast the event target to HTMLInputElement
      const file = target.files?.[0]; // Safely access the first file in the files array
  
      if (!file) return;
  
      try {
        // Create FormData to send the file to the backend
        const formData = new FormData();
        formData.append('avatar', file);
        const notifications_token = localStorage.getItem('notifications_token')!;
        formData.append('notifications_token', notifications_token);
  
        // Send the image to the backend API
        const response = await axios.patch(`${API_BASE_URL}/users/${userId}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
  
        // Assuming the backend returns the new avatar URL in the response
        const newAvatarUrl = response.data.avatarUrl;

        setUser({...user!, avatar: newAvatarUrl});
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    };
  };   

  function getOwner(user: User) {
    setOwner(isUserOwnerProfile(user));
  }

  function getAdmin() {
    setAdmin(isUserAdmin());
  }

  useEffect(() => {
    fetchUser();
  }, [id]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      query: { notificationToken: localStorage.getItem('notifications_token') },
    });
  
    // Handle payments status updates
    socket.on('paymentsStatusUpdateSender', (res) => {
      if (res.status === 'fail' || res.status === 'error') return;

      const { cartId, cartItems } = res.data || {};
  
      if (!cartId || !Array.isArray(cartItems)) {
        console.error("Invalid data received from socket:", res);
        return;
      }
  
      // Helper function to update cart items
      const updateCartItems = (items: any[]) =>
        items.map((item) => {
          const updatedItem = cartItems.find((ci) => ci.id === item.id);
          return updatedItem
            ? { ...item, completed: updatedItem.completed }
            : item;
        });
  
      // Update private orders (seller view)
      setPrivateOrders((prev) =>
        prev.map((order) =>
          order.id === cartId
            ? {
                ...order,
                cartItems: updateCartItems(order.cartItems),
              }
            : order
        )
      );
  
      // Update regular orders (buyer view)
      setOrders((prev) =>
        prev.map((order) =>
          order.id === cartId
            ? {
                ...order,
                cartItems: updateCartItems(order.cartItems),
              }
            : order
        )
      );
  
      // Update currently open modal if needed (private orders)
      if (selectedPrivateOrder?.id === cartId) {
        setSelectedPrivateOrder((prev: any) => ({
          ...prev!,
          cartItems: updateCartItems(prev!.cartItems),
        }));
      }
  
      // Update currently open modal if needed (regular orders)
      if (selectedOrder?.id === cartId) {
        setSelectedOrder((prev: any) => ({
          ...prev!,
          cartItems: updateCartItems(prev!.cartItems),
        }));
      }
    });

    // Inside the useEffect for socket.io
    socket.on('paymentsStatusUpdateReceiver', (res) => {
      if (res.status === 'fail' || res.status === 'error') return;

      const { cartId, cartItem, cartStatus } = res.data || {};

      if (!cartId || !cartItem) {
        console.error("Invalid data received from socket:", res);
        return;
      }

      // Update private orders (seller view)
      setPrivateOrders((prev) =>
        prev.map((order) =>
          order.id === cartId
            ? {
                ...order,
                status: cartStatus || order.status,
                cartItems: order.cartItems.map((item: any) =>
                  item.id === cartItem.id
                    ? { ...item, received: cartItem.received }
                    : item
                ),
              }
            : order
        )
      );

      // Update regular orders (buyer view)
      setOrders((prev) =>
        prev.map((order) =>
          order.id === cartId
            ? {
                ...order,
                status: cartStatus || order.status,
                cartItems: order.cartItems.map((item: any) =>
                  item.id === cartItem.id
                    ? { ...item, received: cartItem.received }
                    : item
                ),
              }
            : order
        )
      );

      // Update currently open modal if needed (private orders)
      if (selectedPrivateOrder?.id === cartId) {
        setSelectedPrivateOrder((prev: any) => ({
          ...prev!,
          status: cartStatus || prev!.status,
          cartItems: prev!.cartItems.map((item: any) =>
            item.id === cartItem.id
              ? { ...item, received: cartItem.received }
              : item
          ),
        }));
      }

      // Update currently open modal if needed (regular orders)
      if (selectedOrder?.id === cartId) {
        setSelectedOrder((prev: any) => ({
          ...prev!,
          status: cartStatus || prev!.status,
          cartItems: prev!.cartItems.map((item: any) =>
            item.id === cartItem.id
              ? { ...item, received: cartItem.received }
              : item
          ),
        }));
      }
    });
  
    return () => {
      socket.disconnect();
    };
  }, [selectedPrivateOrder, selectedOrder]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-center text-error">{error}</div>;
  if (!user) return <div className="text-center">User not found.</div>;

  return (
    <div className="min-h-screen bg-base-100 pt-25">
      {/* Breadcrumbs */}
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-sm breadcrumbs px-6 py-4 max-w-7xl mx-auto"
      >
        <ul>
          <li><a href="/">Home</a></li>
          <li>{user.login}</li>
        </ul>
      </motion.div>

      {/* User Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        >
          {/* Avatar */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative group">
            {user.avatar ? (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                src={user.avatar}
                alt={`${user.login}'s avatar`}
                className="w-96 h-96 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-96 h-96 bg-gray-200 rounded-lg flex items-center justify-center text-4xl font-bold text-gray-600"
              >
                {user.login?.charAt(0).toUpperCase()}
              </motion.div>
            )}
            {(isOwner || isAdmin) && (
              <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleAvatarChange(user.id)}
                  className="cursor-pointer text-white bg-primary p-2 rounded-full"
                >
                  <MdOutlineEdit />
                </button>
              </div>
            )}
            </div>
          </div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3"
          >
            {/* Username with Role and Edit */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.login}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`badge ${user.role === "ADMIN" ? "badge-accent" : "badge-neutral"} gap-1`}>
                  {user.role === "ADMIN" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10a1 1 0 01-1.64 0l-7-10A1 1 0 014 7h4V2a1 1 0 011-1h2.3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                  {user.role}
                </span>
                
                {isAdmin && (
                  <button 
                    onClick={() => actEditModal(user)} 
                    className="btn btn-circle btn-ghost btn-sm tooltip" 
                    data-tip="Edit Profile"
                  >
                    <MdOutlineEdit className="text-lg" />
                  </button>
                )}
              </div>
            </div>

            {/* User Meta Information */}
            <motion.div 
              className="flex flex-col gap-2 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 text-base-content/80">
                <MdEmail className="text-base-content/60" />
                <span>{user.email}</span>
                <span className="badge badge-xs badge-ghost">Verified <FaCheck className='text-xs' /></span>
              </div>
              
              <div className="flex items-center gap-2 text-base-content/80">
                <MdAccessTime className="text-base-content/60" />
                <span>
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="text-xs text-base-content/40">
                  {Math.floor(((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} days
                </span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="stats shadow bg-base-200 mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="stat p-4">
                <div className="stat-figure text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-title">Successful Orders</div>
                <div className="stat-value text-secondary">{ordersData?.successfulOrders}</div>
              </div>
              <div className="stat p-4">
                <div className="stat-figure text-error">
                  <RxCrossCircled className='h-6 w-6' />
                </div>
                <div className="stat-title">Failed Orders</div>
                <div className="stat-value text-error">{ordersData?.failedOrders}</div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            {isOwner && (
              <motion.div 
                className="flex flex-wrap gap-3 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Link 
                  href={`/profile/cart/${user.id}`}
                  className="btn btn-primary gap-2"
                >
                  <FaBasketShopping />
                  View Cart ({user.cart || 0})
                </Link>
                
                {isAdmin && (
                  <button className="btn btn-outline gap-2" onClick={() => actEditModal(user)} >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security Settings
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Products and Cart Items */}
      <div className="max-w-7xl mx-auto px-6 py-6">
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
          {/* Products Section */}
          <div className="bg-base-100 p-6 rounded-box shadow-lg border border-base-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-primary">{isOwner ? "Your" : `${user.login}`} Creations</h2>
                <p className="text-sm text-base-content/60">Manage your product portfolio</p>
              </div>
              <div className="stats shadow bg-base-200 overflow-hidden">
                <div className="stat">
                  <div className="stat-title">Total Products</div>
                  <div className="stat-value text-primary">{products.length}</div>
                </div>
              </div>
            </div>

            {products.length > 0 ? (
              <div className="flex flex-col h-[500px]"> {/* Fixed height container */}
                {/* Scrollable content area with custom scrollbar */}
                <div className="overflow-y-auto p-7 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-base-100 hover:scrollbar-thumb-primary/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((product) => (
                      <Link 
                        href={`/products/${product.id}`}
                        key={product.id} 
                        className="card rounded-3xl bg-base-100 image-full shadow-xl hover:shadow-2xl transition-shadow duration-300 group"
                      >
                        <figure className="relative h-44"> {/* Fixed height */}
                          {product.avatar ? (
                            <img 
                              src={product.avatar} 
                              alt={product.name} 
                              className="brightness-90 hover:brightness-75 transition-all duration-500 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <span className="text-5xl font-bold text-primary-content opacity-80">
                                {product.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Rating badge - always shows, defaults to 0 */}
                          {product.rating ? (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-base-100/80 px-2 py-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-medium text-base-content">
                              {(product.rating || 0).toFixed(1)}
                            </span>
                          </div>
                          ) : (<></>)}
                        </figure>
                        <div className="card-body justify-end p-4">
                          <div className="backdrop-blur-sm bg-base-100/30 rounded-box p-3 -mx-3 -mb-3">
                            <div className="flex justify-between items-center">
                              <h3 className="card-title text-base text-base-content line-clamp-1">
                                {product.name}
                              </h3>
                              {/* Compact price display */}
                              <span className="text-md font-semibold text-primary">
                                &euro; {product.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="hero bg-base-200 rounded-box py-12">
                <div className="hero-content text-center">
                  <div className="max-w-md">
                    <div className="text-6xl mb-4">✨</div>
                    <h3 className="text-2xl font-bold text-base-content">Your Gallery Awaits</h3>
                    <p className="py-4 text-base-content/70">You haven't created any products yet. Start building your collection!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orders Section */}
          {(isOwner || isAdmin) && (
          <div className="bg-base-100 p-6 rounded-box shadow-lg border border-base-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-primary">Order History</h2>
                <p className="text-sm text-base-content/60">Track your purchases</p>
              </div>
              <div className="stats shadow bg-base-200 overflow-hidden">
                <div className="stat">
                  <div className="stat-title">Total Orders</div>
                  <div className="stat-value text-primary">{orders.length}</div>
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="hero bg-base-200 rounded-box py-12">
                <div className="hero-content text-center">
                  <div className="max-w-md">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-2xl font-bold text-base-content">No Orders Yet</h3>
                    <p className="py-4 text-base-content/70">Your completed orders will appear here</p>
                    <Link href="/products/categories/all" className="btn btn-primary gap-2">
                      Browse Products
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[500px]"> {/* Fixed height container */}
                {/* Scrollable content area with custom scrollbar */}
                <div className="overflow-y-auto p-7 pb-12 max-sm:p-1 max-sm:pb-7 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-base-100 hover:scrollbar-thumb-primary/30">
                  <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-base-200"
                      >
                        <div className="card-body p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                Order #{order.id}
                                <div className={`badge badge-sm text-white ${
                                  ['received'].includes(order?.status) ? 'badge-success' : 
                                  ['paid', 'pending'].includes(order?.status) ? 'badge-warning' : 
                                  ['partially_received', 'pending'].includes(order?.status) ? 'badge-secondary' : 
                                  'badge-error'
                                }`}>
                                  {order?.status === "paid" ? (
                                    <>
                                      <FaDollarSign className="h-3 w-3 mr-1" />
                                      Paid
                                    </>
                                  ) : order?.status === "partially_received" ? (
                                    <>
                                      <FaExclamationTriangle className="h-3 w-3 mr-1" />
                                      Partially Received
                                    </>
                                  ) : order?.status === "cancelled" ? (
                                    <>
                                      <RxCross1 className="h-3 w-3 mr-1" />
                                      Cancelled
                                    </>
                                  ) : order?.status === "received" ? (
                                    <>
                                      <FaCheck className="h-3 w-3 mr-1" />
                                      Received
                                    </>
                                  ) : order?.status === "lost" ? (
                                    <>
                                      <RxCross1 className="h-3 w-3 mr-1" />
                                      Lost
                                    </>
                                  ) : order?.status === "partially_lost" ? (
                                    <>
                                      <FaExclamationTriangle className="h-3 w-3 mr-1" />
                                      Partially Lost
                                    </>
                                  ) : (
                                    <>
                                      <FaClock className="h-3 w-3 mr-1" />
                                      Pending
                                    </>
                                  )}
                                </div>
                              </h3>
                              <p className="text-sm text-base-content/60 mt-1">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                &euro; {order.total}
                              </p>
                              <p className="text-xs text-base-content/60">
                                {order.cartItems.length} {order.cartItems.length === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-base-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-base-content/70">
                                {order.deliveryType} delivery
                              </span>
                              <button 
                                className="btn btn-sm btn-ghost text-primary"
                                onClick={() => setSelectedOrder(order)}
                              >
                                Details
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>

    {/* Private Orders Section - Add this below your existing sections */}
    {(isOwner || isAdmin) && (
      <motion.div 
        className="max-w-7xl mx-auto px-6 pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="bg-base-100 p-6 rounded-box shadow-lg border border-base-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-primary">{isOwner ? "Your" : `${user.login}`} Sales</h2>
              <p className="text-sm text-base-content/60">Manage orders placed on your products</p>
            </div>
            <div className="stats shadow bg-base-200 overflow-hidden">
              <div className="stat">
                <div className="stat-title">Total Sales</div>
                <div className="stat-value text-primary">{privateOrders.length}</div>
              </div>
            </div>
          </div>

          {privateOrders.length === 0 ? (
            <motion.div 
              className="hero bg-base-200 rounded-box py-12"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="hero-content text-center">
                <div className="max-w-md">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-2xl font-bold text-base-content">No Sales Yet</h3>
                  <p className="py-4 text-base-content/70">Orders placed on your products will appear here</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-3 mb-6">
                {/* Status Filter */}
                <select
                  defaultValue="all"
                  className="select select-bordered select-sm"
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="received">Received</option>
                  <option value="partially_received">Partially Received</option>
                  <option value="lost">Lost</option>
                  <option value="partially_lost">Partially Lost</option>
                </select>

                {/* Sort By */}
                <select
                  defaultValue="newest"
                  className="select select-bordered select-sm"
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="totalAsc">Total (Low to High)</option>
                  <option value="totalDesc">Total (High to Low)</option>
                </select>
              </div>

              {/* Orders List */}
              <div className="flex flex-col h-[500px]">
                <div className="overflow-y-auto p-7 pb-12 max-sm:p-1 max-sm:pb-7 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-base-100 hover:scrollbar-thumb-primary/30">
                  <div className="grid grid-cols-1 gap-4">
                    {filteredAndSortedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-base-200"
                      >
                        <div className="card-body p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                Order #{order.id}
                                <div className={`badge badge-sm text-white ${
                                  ['received'].includes(order?.status) ? 'badge-success' : 
                                  ['paid', 'pending'].includes(order?.status) ? 'badge-warning' : 
                                  ['partially_received', 'pending'].includes(order?.status) ? 'badge-secondary' : 
                                  'badge-error'
                                }`}>
                                  {order?.status === "paid" ? (
                                    <>
                                      <FaDollarSign className="h-3 w-3 mr-1" />
                                      Paid
                                    </>
                                  ) : order?.status === "partially_received" ? (
                                    <>
                                      <FaExclamationTriangle className="h-3 w-3 mr-1" />
                                      Partially Received
                                    </>
                                  ) : order?.status === "cancelled" ? (
                                    <>
                                      <RxCross1 className="h-3 w-3 mr-1" />
                                      Cancelled
                                    </>
                                  ) : order?.status === "received" ? (
                                    <>
                                      <FaCheck className="h-3 w-3 mr-1" />
                                      Received
                                    </>
                                  ) : order?.status === "lost" ? (
                                    <>
                                      <RxCross1 className="h-3 w-3 mr-1" />
                                      Lost
                                    </>
                                  ) : order?.status === "partially_lost" ? (
                                    <>
                                      <FaExclamationTriangle className="h-3 w-3 mr-1" />
                                      Partially Lost
                                    </>
                                  ) : (
                                    <>
                                      <FaClock className="h-3 w-3 mr-1" />
                                      Pending
                                    </>
                                  )}
                                </div>
                              </h3>
                              <p className="text-sm text-base-content/60 mt-1">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-primary">
                                &euro; {order.total}
                              </p>
                              <p className="text-xs text-base-content/60">
                                {order.cartItems.length} {order.cartItems.length === 1 ? 'item' : 'items'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-base-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-base-content/70">
                                {order.deliveryType} • Ordered by {order.userId || 'guest'}
                              </span>
                              <div className="flex gap-2">
                                {(order.cartItems.some(
                                    (item: any) => item.productId !== '...' && item.completed === null
                                  ) && isOwner) && (
                                  <>
                                    <button
                                      onClick={() => updateOrderStatusSender(order.id, "sent")}
                                      className="btn btn-sm btn-success"
                                    >
                                      <FaCheck className="mr-1" />
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => updateOrderStatusSender(order.id, "cancelled")}
                                      className="btn btn-sm btn-error"
                                    >
                                      <RxCross1 className="mr-1" />
                                      Cancel
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => setSelectedPrivateOrder(order)}
                                  className="btn btn-sm btn-ghost text-primary"
                                >
                                  Details
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )}

    {/* Private Order Details Modal */}
    <dialog id="private_order_modal" className={`modal ${selectedPrivateOrder ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-primary">Sale #{selectedPrivateOrder?.id}</h3>
          <div className="flex items-center gap-3">
            <div className="flex opacity-50 items-center">
              <FaClock className='mx-1' /> 
              {new Date(selectedPrivateOrder?.updatedAt).toLocaleString()}
            </div>
            <div className={`badge badge-lg text-white ${
              ['received'].includes(selectedPrivateOrder?.status) ? 'badge-success' : 
              ['paid', 'pending'].includes(selectedPrivateOrder?.status) ? 'badge-warning' : 
              ['partially_received', 'pending'].includes(selectedPrivateOrder?.status) ? 'badge-secondary' : 
              'badge-error'
            }`}>
              {selectedPrivateOrder?.status === "paid" ? (
                <>
                  <FaDollarSign className="h-3 w-3 mr-1" />
                  Paid
                </>
              ) : selectedPrivateOrder?.status === "partially_received" ? (
                <>
                  <FaExclamationTriangle className="h-3 w-3 mr-1" />
                  Partially Received
                </>
              ) : selectedPrivateOrder?.status === "cancelled" ? (
                <>
                  <RxCross1 className="h-3 w-3 mr-1" />
                  Cancelled
                </>
              ) : selectedPrivateOrder?.status === "received" ? (
                <>
                  <FaCheck className="h-3 w-3 mr-1" />
                  Received
                </>
              ) : selectedPrivateOrder?.status === "lost" ? (
                <>
                  <RxCross1 className="h-3 w-3 mr-1" />
                  Lost
                </>
              ) : selectedPrivateOrder?.status === "partially_lost" ? (
                <>
                  <FaExclamationTriangle className="h-3 w-3 mr-1" />
                  Partially Lost
                </>
              ) : (
                <>
                  <FaClock className="h-3 w-3 mr-1" />
                  Pending
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="divider my-2"></div>
        
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-base-200 p-4 rounded-box">
              <p className="text-sm font-semibold text-gray-500">Customer ID</p>
              <p className="text-lg">
                {selectedPrivateOrder?.userId || 'Guest'}
              </p>
            </div>
            <div className="bg-base-200 p-4 rounded-box">
              <p className="text-sm font-semibold text-gray-500">Delivery Type</p>
              <p className="text-lg">{selectedPrivateOrder?.deliveryType}</p>
            </div>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-box">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  &euro; {selectedPrivateOrder?.total}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-lg font-bold">Purchased Items</p>
              <div className="text-sm text-base-content/70">
                {selectedPrivateOrder?.cartItems.filter((i: any) => i.completed === "sent").length} of {selectedPrivateOrder?.cartItems.length} items fulfilled
              </div>
            </div>
            <motion.div 
              className="max-h-[400px] overflow-y-auto pr-2" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
              }}
            >
              <ul className="space-y-3">
                {selectedPrivateOrder?.cartItems.map((item: any) => (
                  <li key={item.id} className="group flex justify-between items-center py-3 px-4 rounded-lg hover:bg-base-200 transition-colors border border-base-200">
                    <div className="flex items-center gap-4 w-full">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg border border-base-300"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xl font-bold text-gray-600">
                          {item.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-lg">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="text-gray-700 font-bold">
                            &euro; {!isNaN(item.price) ? (item.price * item.quantity).toFixed(2) : '...'}
                          </p>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-center">
                          <span className={`badge gap-1 text-white
                            ${(['received'].includes(item.received)) ? 'badge-success' : 
                            (item.completed === null && item.received === null) ? 'badge-warning' : 
                            (item.completed === "sent" && item.received === null) ? 'badge-secondary' : 
                            'badge-error'
                            }`}>
                            {item.completed === "sent" ? (
                              item.received === "received" ? (
                                <>
                                  <FaCheck className="h-3 w-3" />
                                  Received
                                </>
                              ) : item.received === "lost" ? (
                                <>
                                  <RxCross1 className="h-3 w-3" />
                                  Lost
                                </>
                              ) : (
                                <>
                                  <FaCheck className="h-3 w-3" />
                                  Awaiting confirmation
                                </>
                              )
                            ) : item.completed === "cancelled" ? (
                              <>
                                <RxCross1 className="h-3 w-3" />
                                Cancelled
                              </>
                            ) : (
                              <>
                                <FaClock className="h-3 w-3" />
                                Pending
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setSelectedPrivateOrder(null)}>close</button>
      </form>
    </dialog>

    {/* DaisyUI Modal for Order Details */}
    <dialog id="order_modal" className={`modal ${selectedOrder ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-primary">Order #{selectedOrder?.id}</h3>
          <div className="flex items-center gap-3">
            <div className="flex opacity-50 items-center">
              <FaClock className='mx-2' /> {new Date(selectedOrder?.updatedAt).toLocaleString()}
            </div>
            <div className={`badge badge-lg text-white ${
              ['received'].includes(selectedOrder?.status) ? 'badge-success' : 
              ['paid', 'pending'].includes(selectedOrder?.status) ? 'badge-warning' : 
              ['partially_received', 'pending'].includes(selectedOrder?.status) ? 'badge-secondary' : 
              'badge-error'
            }`}>
              {selectedOrder?.status === "paid" ? (
                <>
                  <FaDollarSign className="h-3 w-3 mr-1" />
                  Paid
                </>
              ) : selectedOrder?.status === "partially_received" ? (
                <>
                  <FaExclamationTriangle className="h-3 w-3 mr-1" />
                  Partially Received
                </>
              ) : selectedOrder?.status === "cancelled" ? (
                <>
                  <RxCross1 className="h-3 w-3 mr-1" />
                  Cancelled
                </>
              ) : selectedOrder?.status === "received" ? (
                <>
                  <FaCheck className="h-3 w-3 mr-1" />
                  Received
                </>
              ) : selectedOrder?.status === "lost" ? (
                <>
                  <RxCross1 className="h-3 w-3 mr-1" />
                  Lost
                </>
              ) : selectedOrder?.status === "partially_lost" ? (
                <>
                  <FaExclamationTriangle className="h-3 w-3 mr-1" />
                  Partially Lost
                </>
              ) : (
                <>
                  <FaClock className="h-3 w-3 mr-1" />
                  Pending
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="divider my-2"></div>
        
        <div className="py-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-base-200 p-4 rounded-box">
              <p className="text-sm font-semibold text-gray-500">Delivery Type</p>
              <p className="text-lg">{selectedOrder?.deliveryType}</p>
            </div>
            <div className="bg-base-200 p-4 rounded-box">
              <p className="text-sm font-semibold text-gray-500">Promo Code</p>
              <p className="text-lg">{selectedOrder?.promo || 'None'}</p>
            </div>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-box">
            <p className="text-sm font-semibold text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-primary">&euro; {selectedOrder?.total}</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-lg font-bold">Order Items</p>
              <div className="text-sm text-base-content/70">
                {selectedOrder?.cartItems.filter((i: any) => i.completed === "sent").length} of {selectedOrder?.cartItems.length} items received
              </div>
            </div>
            <motion.div 
              className="max-h-[400px] overflow-y-auto pr-2" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent',
              }}
            >
              <ul className="space-y-3">
                {selectedOrder?.cartItems.map((item: any) => (
                  <li key={item.id} className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-base-200 transition-colors border border-base-200">
                    <div className="flex items-center gap-4">
                      <div className={`indicator ${item.completed === "sent" ? '' : 'opacity-60'}`}>
                        {item.completed === "sent" && (
                          <span className="indicator-item badge badge-success p-1">
                            <FaCheck className="h-3 w-3" />
                          </span>
                        )}
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg border border-base-300"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xl font-bold text-gray-600">
                            {item.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-lg">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                        <span className={`badge gap-1 text-white
                          ${(['received'].includes(item.received)) ? 'badge-success' : 
                          (item.completed === null && item.received === null) ? 'badge-warning' : 
                          (item.completed === "sent" && item.received === null) ? 'badge-secondary' : 
                          'badge-error'
                          }`}>
                          {item.completed === "sent" ? (
                            item.received === "received" ? (
                              <>
                                <FaCheck className="h-3 w-3" />
                                Received
                              </>
                            ) : item.received === "lost" ? (
                              <>
                                <RxCross1 className="h-3 w-3" />
                                Lost
                              </>
                            ) : (
                              <>
                                <FaCheck className="h-3 w-3" />
                                Awaiting confirmation
                              </>
                            )
                          ) : item.completed === "cancelled" ? (
                            <>
                              <RxCross1 className="h-3 w-3" />
                              Cancelled
                            </>
                          ) : (
                            <>
                              <FaClock className="h-3 w-3" />
                              Pending
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                      {(isOwner && item.completed === "sent" && item.received === null) && (
                      <div className="flex flex-between gap-2">
                          <button 
                            onClick={() => updateOrderStatusReceiver(item.id, "received")}
                            className="btn btn-xs btn-success"
                          >
                            <FaCheck className="mr-1" />
                            Received
                          </button>
                          <button 
                            onClick={() => updateOrderStatusReceiver(item.id, "lost")}
                            className="btn btn-xs btn-error"
                          >
                            <RxCross1 className="mr-1" />
                            Lost
                          </button>
                      </div>
                      )}
                    <p className="text-gray-700 font-bold">
                      &euro; {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setSelectedOrder(null)}>close</button>
      </form>
    </dialog>

    {/* Edit Modal */}
    <dialog id="edit_modal" className="modal" open={isEditModal}>
    <div className="modal-box">
        <h3 className="font-bold text-lg">Edit {newUserForm?.login}</h3>
        <form method="patch" onSubmit={handleSubmit}>
        <label className="input validator">
            <FaUser />
            <input
            name="login"
            value={newUserForm.login || ""}
            onChange={handleInputChange}
            type="input"
            placeholder="Login"
            />
        </label>
        <label className="input validator">
            <MdEmail />
            <input
            name="email"
            value={newUserForm.email || ""}
            onChange={handleInputChange}
            type="input"
            placeholder="Email"
            />
        </label>
        <label className="input validator">
            <FaLock />
            <input
            name="password"
            value={newUserForm.password || ""}
            onChange={handleInputChange}
            type="password"
            placeholder="Password"
            />
        </label>
        <select
            name="role"
            value={newUserForm.role || ""}
            onChange={handleInputChange}
            className="select"
        >
            <option disabled value="">
            Pick a role
            </option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
        </select>
        <div className="modal-action">
            <button type="submit" className="btn btn-primary">
            Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => actEditModal(null)}>
            Cancel
            </button>
        </div>
        </form>
    </div>
    <form method="dialog" className="modal-backdrop">
        <button style={{ cursor: "default !important" }} onClick={() => actEditModal(null)}>
        close
        </button>
    </form>
    </dialog>
    </div>
  );
}