'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, redirect } from 'next/navigation';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { Product } from '../product.entity';
import { MdOutlineEdit, MdDeleteOutline, MdLocalShipping, MdSupport, MdPayment } from 'react-icons/md';
import Link from 'next/link';
import { getUserIdFromToken, isUserOwnerProduct, isUserAdmin } from '@/app/config';
import { FaBasketShopping } from 'react-icons/fa6';
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiMessageSquare, FiSend, FiTrash2 } from 'react-icons/fi';

// Pagination constants
const COMMENTS_PER_PAGE = 4; // Number of comments per page

const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-base-100 pt-25">
      {/* Breadcrumbs Skeleton */}
      <div className="text-sm breadcrumbs px-6 py-4 max-w-7xl mx-auto">
        <ul>
          <li>
            <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
          </li>
          <li>
            <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
          </li>
          <li>
            <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
          </li>
          <li>
            <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
          </li>
        </ul>
      </div>

      {/* Product Section Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Skeleton */}
          <div className="flex justify-center lg:justify-start">
            <div className="w-96 h-96 bg-base-300 rounded-lg animate-pulse"></div>
          </div>

          {/* Product Info Skeleton */}
          <div className="flex flex-col gap-6">
            <div className="h-10 w-1/4 bg-base-300 rounded animate-pulse"></div>
            <div className="h-12 w-1/2 bg-base-300 rounded animate-pulse"></div>
            <div className="h-8 w-1/3 bg-base-300 rounded animate-pulse"></div>
            <div className="h-24 w-full bg-base-300 rounded animate-pulse"></div>
            <div className="flex gap-4">
              <div className="h-12 w-40 bg-base-300 rounded-lg animate-pulse"></div>
              <div className="h-12 w-40 bg-base-300 rounded-lg animate-pulse"></div>
              <div className="h-12 w-40 bg-base-300 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-base-100 p-4">
            <div className="h-8 w-1/9 bg-base-300 rounded animate-pulse mb-4"></div>
            <div className="h-8 w-1/9 bg-base-300 rounded animate-pulse mb-6"></div>
            <div className="max-w-7xl mx-auto px-2 py-4 rounded-3xl shadow-lg mb-6">
              <div className="h-4 w-1/4 bg-base-300 m-4 rounded animate-pulse mb-16"></div>
            </div>
            <div className="h-10 w-1/9 bg-base-300 rounded-3xl animate-pulse mb-6"></div>
          </div>
        </div>
      </div>

      {/* Additional Information Skeleton */}
      <div className="max-w-7xl mx-auto px-6 py-12 rounded-lg shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-base-100 p-8">
            <div className="h-8 w-1/2 bg-base-300 rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-base-300 rounded-full animate-pulse"></div>
                <div className="flex flex-col w-full gap-2">
                  <div className="h-4 w-full bg-base-300 rounded animate-pulse"></div>
                  <div className="h-6 w-full bg-base-300 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-base-300 rounded-full animate-pulse"></div>
                <div className="flex flex-col w-full gap-2">
                  <div className="h-4 w-full bg-base-300 rounded animate-pulse"></div>
                  <div className="h-6 w-full bg-base-300 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-base-100 p-8">
            <div className="h-8 w-1/2 bg-base-300 rounded animate-pulse mb-6"></div>
            <div className="space-y-2">
              <div className="h-5 w-full bg-base-300 rounded animate-pulse"></div>
              <div className="h-5 w-full bg-base-300 rounded animate-pulse"></div>
              <div className="h-5 w-full bg-base-300 rounded animate-pulse"></div>
              <div className="h-5 w-full bg-base-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProductDetailsPage() {
  const { id } = useParams(); // Get product ID from URL
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModal, setIsEditModal] = useState<boolean>(false);
  const [editProductForm, setEditProductForm] = useState<Partial<Product>>({
    name: undefined,
    description: undefined,
    price: undefined,
    category: undefined,
    rating: undefined,
  });
  const [comments, setComments] = useState<{ id: string, userId: string, userLogin: string, userAvatar: string, comment: string, rating: number, createdAt: string }[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(0);
  const [isOwner, setOwner] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  async function getCategories() {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data.map((category: any) => category.name));
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  async function fetchProduct() {
    try {
      let headers: any = {};
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = { 'Authorization': `Bearer ${token}` };
      }
      const response = await axios.get(`${API_BASE_URL}/products/${id}`, {headers: headers});
      const productData: Product = {
        id: response.data._id,
        userId: response.data._source.userId,
        name: response.data._source.name,
        description: response.data._source.description,
        price: response.data._source.price,
        category: response.data._source.category,
        rating: response.data._source.rating || 0,
        ratingQuantity: response.data._source.ratingQuantity || 0,
        avatar: response.data._source.avatar || '',
      };
      setProduct(productData);
      setEditProductForm({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
      });

      // Fetch comments
      const commentsResponse = await axios.get(`${API_BASE_URL}/ratings/${id}`);
      setComments(commentsResponse.data);
      setTotalPages(Math.ceil(commentsResponse.data.length / COMMENTS_PER_PAGE));
      setOwner(isUserOwnerProduct(productData));
      getCategories();
    } catch (err) {
      setError('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch product details and comments
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    setIsAdmin(isUserAdmin());

    const newTotalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
    setTotalPages(newTotalPages);
  
    // Ensure currentPage does not exceed totalPages
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage((prevPage) => prevPage - 1); // Decrement currentPage if necessary
    } else if (newTotalPages === 0) {
      setCurrentPage(1); // Reset to page 1 if there are no comments
    }
  }, [comments, currentPage]);

  // Paginate comments
  let paginatedComments = comments.slice(
    (currentPage - 1) * COMMENTS_PER_PAGE,
    currentPage * COMMENTS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const addToCart = async () => {
    try {
      if (product === null) return;

      const newData = {
        "notifications_token": localStorage.getItem("notifications_token"),
        "userId": getUserIdFromToken()?.toString(),
        "productId": product.id
      }

      await axios.post(`${API_BASE_URL}/users/addToCart`, newData, 
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
      )
    } catch (err) {
      setError('Failed to add product to cart.');
    }
  }

  // Handle avatar change
  const handleAvatarChange = async (productId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();

    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      try {
        const formData = new FormData();
        formData.append('avatar', file);
        const notifications_token = localStorage.getItem('notifications_token')!;
        formData.append('notifications_token', notifications_token);

        const response = await axios.patch(`${API_BASE_URL}/products/${productId}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        const newAvatarUrl = response.data.avatarUrl;
        setProduct((prev) => ({ ...prev!, avatar: newAvatarUrl }));
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    };
  };

  // Handle comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = getUserIdFromToken();
    const userLogin = localStorage.getItem('user_login');
    if (!userId) {
      redirect('/auth');
    }

    try {
      await axios.post(`${API_BASE_URL}/ratings`, {
        "notifications_token": localStorage.getItem('notifications_token'),
        productId: id, 
        userId, 
        rating: newRating,
        comment: newComment,
      }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });

      setTimeout(async () => {
        const commentsResponse = await axios.get(`${API_BASE_URL}/ratings/${id}`);
        setComments(commentsResponse.data);
        paginatedComments = comments.slice(
          (currentPage - 1) * COMMENTS_PER_PAGE,
          currentPage * COMMENTS_PER_PAGE
        );
      },2000)

      // Clear the form
      setNewComment('');
      setNewRating(0);
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const newData = {
        "notifications_token": localStorage.getItem('notifications_token'),
      }
      // Call the API to delete the comment
      await axios.post(`${API_BASE_URL}/ratings/${commentId}`, newData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
  
      // Remove the deleted comment from the state
      setComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== commentId)
      );

      paginatedComments = comments.slice(
        (currentPage - 1) * COMMENTS_PER_PAGE,
        currentPage * COMMENTS_PER_PAGE
      );
  
      console.log('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Edit an existing product
  async function editProduct(product: Partial<Product>) {
    try {
      const newData = {
        notifications_token: localStorage.getItem('notifications_token'),
        ...product,
      };
      await axios.patch(`${API_BASE_URL}/products/${id}`, newData, { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      setIsEditModal(false);
      setTimeout(() => router.refresh(), 2000); // Refresh the page to reflect changes
    } catch (error) {
      console.error('Error editing product:', error);
    }
  }

  // Delete a product
  async function deleteProduct() {
    try {
      const newData = {
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/products/${id}`, newData, { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      router.push('/products/categories/all'); // Redirect to products page after deletion
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

  // Handle input changes in forms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditProductForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await editProduct(editProductForm);
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-center text-error">{error}</div>;
  if (!product) return <div className="text-center">Product not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 pt-25">
      {/* Breadcrumbs with Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-sm breadcrumbs px-6 py-4 max-w-7xl mx-auto"
      >
        <ul>
          <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
          <li><Link href="/products/categories/all" className="hover:text-primary transition-colors">All</Link></li>
          <li>
            <Link 
              href={`/products/categories/${product.category}`} 
              className="hover:text-primary transition-colors"
            >
              {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </Link>
          </li>
          <li className="text-primary font-medium">
            {product.name.length > 30 ? `${product.name.substring(0, 30)}...` : product.name}
          </li>
        </ul>
      </motion.div>
  
      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center lg:justify-start relative"
          >
            <div className="relative group w-full max-w-lg">
              {product.avatar ? (
                <img
                  src={product.avatar}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-2xl shadow-xl border border-base-300 transition-all duration-300 group-hover:shadow-2xl"
                />
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-primary to-secondary flex items-center justify-center rounded-2xl shadow-xl">
                  <span className="text-8xl font-bold text-white">
                    {product.name.substring(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Price Badge */}
              <div className="absolute bottom-4 right-4 bg-base-100/90 text-base-content px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm">
                <span className="text-xl font-bold">${product.price}</span>
              </div>
              
              {/* Edit Button (Owner/Admin) */}
              {(isOwner || isAdmin) && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="absolute top-4 right-4"
                >
                  <button
                    onClick={() => handleAvatarChange(product.id)}
                    className="btn btn-circle btn-primary shadow-lg"
                  >
                    <MdOutlineEdit className="text-xl" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
  
          {/* Product Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Category Badge */}
            <div className="badge badge-lg badge-primary text-primary-content px-4 py-3">
              {product.category}
            </div>
  
            {/* Product Title */}
            <h1 className="text-4xl md:text-5xl font-bold break-words bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {product.name}
            </h1>
  
            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="rating rating-lg">
                {Array.from({ length: 5 }, (_, i) => (
                  <input
                    key={i}
                    type="radio"
                    name={`rating-${product.id}`}
                    className={`mask mask-star-2 ${i < product.rating! ? 'bg-yellow-400' : 'bg-gray-300'}`}
                    checked={i === Math.floor(product.rating!) - 1}
                    readOnly
                  />
                ))}
              </div>
              <span className="text-lg">({product.ratingQuantity} reviews)</span>
            </div>
  
            {/* Description */}
            <div className="prose max-w-none text-base-content/80">
              <p>{product.description}</p>
            </div>
  
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={addToCart}
                className="btn btn-primary btn-lg flex-1 min-w-[200px]"
              >
                <FaBasketShopping className="text-xl" />
                Add To Cart
              </motion.button>
  
              {(isOwner || isAdmin) && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditModal(true)}
                    className="btn btn-secondary btn-lg flex-1 min-w-[200px]"
                  >
                    <MdOutlineEdit className="text-xl" />
                    Edit Product
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={deleteProduct}
                    className="btn btn-error btn-lg flex-1 min-w-[200px]"
                  >
                    <MdDeleteOutline className="text-xl" />
                    Delete Product
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
  
      {/* Comment Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-6 py-12"
      >
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <FiMessageSquare className="text-primary" />
          Customer Reviews
        </h2>
        
        {/* Comment Form */}
        <div className="card bg-base-100 p-6 rounded-2xl shadow-lg mb-10">
          <form onSubmit={handleCommentSubmit} className="space-y-4">
            {/* Rating Input */}
            <label className="label">
              <span className="label-text font-medium text-base-content/80">Your Review</span>
            </label>
            <div className="form-control">
              <div className="rating rating-lg gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <input
                    key={star}
                    type="radio"
                    name="rating"
                    className={`mask mask-star-2 ${newRating >= star ? 'bg-accent' : 'bg-base-400'}`}
                    checked={newRating === star}
                    onChange={() => setNewRating(star)}
                  />
                ))}
              </div>
            </div>
            
            {/* Enhanced Textarea */}
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your detailed thoughts about this product..."
                className="textarea w-full h-32 p-4 rounded-xl border-2 border-base-300 bg-base-100 text-base-content/90 focus:ring-2 focus:ring-primary/50 transition-all duration-200 resize-none shadow-sm"
                rows={4}
                maxLength={500}
                required
              />
              <div className="absolute bottom-3 right-3 text-xs text-base-content/50">
                {newComment.length}/500
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary px-8 bg-gradient-to-r from-primary to-neutral hover:from-primary/90 hover:to-neutral/90 transition-all"
              >
                <FiSend className="mr-2" />
                Post Review
              </motion.button>
            </div>
          </form>
        </div>
  
        <div className="space-y-4">
          {paginatedComments.length > 0 ? (
            <AnimatePresence initial={false}>
              {paginatedComments.map((comment) => (
                <motion.div
                  key={`${comment.id}-${comment.createdAt}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, height: 0, padding: 0, margin: 0 }}
                  transition={{ 
                    opacity: { duration: 0.2 },
                    default: { duration: 0.3 }
                  }}
                  layout
                  className="card bg-base-100 p-6 shadow-md overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <Link href={`/profile/${comment.userId}`} className="shrink-0">
                      {comment.userAvatar ? (
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="avatar">
                            <div className="w-12 rounded-full">
                              <img src={comment.userAvatar} alt={comment.userLogin} />
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-12">
                              <span className="text-xl">
                                {comment.userLogin.substring(0, 1).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </Link>
                    
                    {/* Comment Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link 
                            href={`/profile/${comment.userId}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {comment.userLogin}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Rating */}
                        {comment.rating && (
                          <div className="rating rating-sm">
                            {Array.from({ length: 5 }, (_, i) => (
                              <input
                                key={i}
                                type="radio"
                                className={`mask mask-star-2 ${i < comment.rating! ? 'bg-yellow-400' : 'bg-gray-300'}`}
                                checked={i === comment.rating - 1}
                                readOnly
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <p className="mt-2 break-all text-base-content/90">{comment.comment}</p>
                      
                      {/* Delete Button */}
                      {comment.userId?.toString() === getUserIdFromToken()?.toString() && (
                        <div 
                          className="mt-2 flex justify-end"
                        >
                          <motion.button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="btn btn-sm btn-ghost text-error hover:bg-error/10 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-10"
            >
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center text-gray-400">
                <FiMessageSquare size={48} />
              </div>
              <h3 className="text-xl font-medium">No reviews yet</h3>
              <p className="text-gray-500">Be the first to share your thoughts!</p>
            </motion.div>
          )}
        </div>
  
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="join flex justify-center mt-10">
            <button 
              className="join-item btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FiChevronLeft />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`join-item btn ${currentPage === pageNum ? 'btn-active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className="join-item btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </motion.section>
  
      {/* Product Details Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-base-100 py-16"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Product Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Additional Information */}
            <div className="card bg-base-200 p-8 rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Product Details</h2>

              {/* Shipping Information */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-full">
                  <MdLocalShipping className="text-2xl text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Free Shipping</h3>
                  <p className="text-base-content opacity-70">Delivered in 3-5 business days.</p>
                </div>
              </div>

              {/* Payment Options */}
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <MdPayment className="text-2xl text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secure Payment</h3>
                  <p className="text-base-content opacity-70">Pay with credit card, PayPal, or crypto.</p>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="card bg-base-200 p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-bold mb-6">Key Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1">
                    <FiCheckCircle className="text-green-500 text-xl" />
                  </div>
                  <span className="text-base-content/80">Premium quality materials</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1">
                    <FiCheckCircle className="text-green-500 text-xl" />
                  </div>
                  <span className="text-base-content/80">Eco-friendly packaging</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1">
                    <FiCheckCircle className="text-green-500 text-xl" />
                  </div>
                  <span className="text-base-content/80">1-year manufacturer warranty</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1">
                    <FiCheckCircle className="text-green-500 text-xl" />
                  </div>
                  <span className="text-base-content/80">Handcrafted with care</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>
  
      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-primary to-secondary py-16"
      >
        <div className="max-w-7xl mx-auto px-6 text-center text-primary-content">
          <h2 className="text-3xl font-bold mb-6">Ready to Make It Yours?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Add this premium product to your cart today and experience the quality for yourself!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={addToCart}
              className="btn btn-lg btn-secondary"
            >
              <FaBasketShopping className="text-xl" />
              Add To Cart
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                addToCart();
                redirect(`/profile/cart/${getUserIdFromToken()?.toString()}`);
              }}
              className="btn btn-lg btn-primary"
            >
              Buy Now
            </motion.button>
          </div>
        </div>
      </motion.section>
  
      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-base-100 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsEditModal(false)}
                className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4"
              >
                ✕
              </button>
              
              <h3 className="text-2xl font-bold mb-6">
                Edit {editProductForm.name}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Product Name</span>
                  </label>
                  <input
                    name="name"
                    value={editProductForm.name || ""}
                    onChange={handleInputChange}
                    type="text"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    name="description"
                    value={editProductForm.description || ""}
                    onChange={() => handleInputChange}
                    className="textarea textarea-bordered w-full"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Price</span>
                  </label>
                  <input
                    name="price"
                    value={editProductForm.price || ""}
                    onChange={handleInputChange}
                    type="number"
                    className="input input-bordered w-full"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Category</span>
                  </label>
                  <select
                    name="category"
                    value={editProductForm.category || ""}
                    onChange={handleInputChange}
                    className="select select-bordered w-full"
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-action">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}