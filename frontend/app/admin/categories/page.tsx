'use client';
import { MdOutlineEdit, MdDeleteOutline, MdAdd } from 'react-icons/md';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Category } from './category.entity';
import { API_BASE_URL } from '@/app/config';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTag } from 'react-icons/fa';

// SkeletonLoader Component for Cards
const SkeletonLoader = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-7xl mx-auto p-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-base-100 shadow-lg rounded-lg overflow-hidden animate-pulse">
          {/* Card Image Placeholder */}
          <div className="h-48 bg-base-300"></div>
          {/* Card Content Placeholder */}
          <div className="p-6 space-y-4">
            <div className="h-6 w-3/4 bg-base-300 rounded"></div>
            <div className="h-4 w-1/2 bg-base-300 rounded"></div>
            <div className="h-10 w-24 bg-base-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CATEGORIES_PER_PAGE = 10;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateModal, setIsCreateModal] = useState<boolean>(false);
  const [newCategoryForm, setNewCategoryForm] = useState<Partial<Category>>({
    name: undefined,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch all categories
  async function getCategories() {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = response.data;
      setCategories(data);
      setTotalPages(Math.ceil(data.length / CATEGORIES_PER_PAGE));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  // Create a new category
  async function createCategory(category: Partial<Category>) {
    try {
      const newData = {
        ...category,
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/categories`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setIsCreateModal(false);
      setTimeout(() => getCategories(), 500);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  }

  // Delete a category
  async function deleteCategory(id: number) {
    try {
      const newData = {
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/categories/${id}`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setTimeout(() => getCategories(), 2500);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  const handleAvatarChange = async (categoryId: number) => {
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
        const response = await axios.patch(`${API_BASE_URL}/categories/${categoryId}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const newAvatarUrl = response.data.avatarUrl;
        setCategories((prevCategories) =>
            prevCategories.map((category) => (category.id === categoryId ? { ...category, avatar: newAvatarUrl } : category))
        );
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    };
  };

  // Open or close the create modal
  function actCreateModal() {
    setIsCreateModal(!isCreateModal);
    setNewCategoryForm({
      name: undefined,
    });
  }

  // Handle input changes in forms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreateModal) {
      await createCategory(newCategoryForm);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    getCategories();
  }, []);

  // Paginate categories
  const paginatedCategories = categories.slice(
    (currentPage - 1) * CATEGORIES_PER_PAGE,
    currentPage * CATEGORIES_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render skeleton loader while loading
  if (loading) return <SkeletonLoader />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 pt-35 px-4"
    >
      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Product Categories
          </h1>
          <motion.button
            onClick={actCreateModal}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary rounded-full"
          >
            <MdAdd className="text-xl" />
            Create Category
          </motion.button>
        </motion.div>
  
        {/* Categories Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          <AnimatePresence>
            {paginatedCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
                whileHover={{ y: -5 }}
                className="card bg-base-100/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300"
              >
                {/* Card Image */}
                <motion.figure 
                  className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary/10"
                  whileHover={{ scale: 1.02 }}
                >
                  {category.avatar ? (
                    <div className="relative group w-40 h-40">
                      <img
                        src={category.avatar}
                        alt="Category Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <motion.button
                          onClick={() => handleAvatarChange(category.id)}
                          whileHover={{ scale: 1.2 }}
                          className="btn btn-circle btn-sm btn-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MdOutlineEdit />
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group w-full h-full flex justify-center items-center">
                      <div className="bg-neutral text-neutral-content w-40 h-40 rounded-full flex justify-center items-center text-4xl font-bold">
                        {category.name.substring(0, 1)}
                      </div>
                      <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <motion.button
                          onClick={() => handleAvatarChange(category.id)}
                          whileHover={{ scale: 1.2 }}
                          className="btn btn-circle btn-sm btn-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MdOutlineEdit />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.figure>
  
                {/* Card Content */}
                <motion.div 
                  className="card-body p-4"
                  layout
                >
                  <motion.h2 
                    className="card-title"
                    whileHover={{ color: "var(--p)" }}
                  >
                    <Link 
                      href={`/products/categories/${category.name}`} 
                      className="link link-hover"
                    >
                      {category.name}
                    </Link>
                  </motion.h2>
                  <p className="text-sm opacity-70">Products: {category.productCount}</p>
                  <div className="card-actions justify-end mt-2">
                    <motion.button
                      onClick={() => deleteCategory(category.id)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="btn btn-square btn-ghost btn-sm text-error"
                    >
                      <MdDeleteOutline className="text-xl" />
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
  
        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mt-8"
          >
            <div className="join">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="join-item btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                «
              </motion.button>
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
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`join-item btn ${currentPage === pageNum ? 'btn-active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="join-item btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                »
              </motion.button>
            </div>
          </motion.div>
        )}
  
        {/* Create Category Modal */}
        <dialog id="create_modal" className="modal" open={isCreateModal}>
          <AnimatePresence>
            {isCreateModal && (
              <>
                <div
                  className="modal-box bg-base-100/95 backdrop-blur-md border border-base-300/30 shadow-2xl"
                >
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between items-center mb-6"
                  >
                    <h3 className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Create New Category
                    </h3>
                    <motion.button
                      onClick={() => actCreateModal()}
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="btn btn-circle btn-ghost"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </motion.div>
  
                  <form method="post" onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <motion.span
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <FaTag className="text-primary" />
                            </motion.span>
                            Category Name
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="name"
                            value={newCategoryForm.name || ''}
                            onChange={handleInputChange}
                            type="text"
                            placeholder="Electronics, Clothing, etc."
                            className="input input-bordered w-full focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Action Buttons */}
                    <motion.div 
                      className="modal-action mt-8 flex justify-end gap-4"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button
                        type="button"
                        onClick={() => actCreateModal()}
                        whileHover={{ 
                          scale: 1.05,
                          backgroundColor: "var(--bc)",
                          color: "var(--b1)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-outline px-8 rounded-full"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: "0 4px 15px var(--pf)"
                        }}
                        whileTap={{ 
                          scale: 0.95,
                        }}
                        className="btn btn-primary px-8 rounded-full bg-gradient-to-r from-primary to-secondary border-none text-white"
                      >
                        <FaPlus className="mr-2" />
                        Create Category
                      </motion.button>
                    </motion.div>
                  </form>
                </div>
  
                {/* Modal Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="modal-backdrop bg-black/50 backdrop-blur-sm"
                  onClick={() => actCreateModal()}
                />
              </>
            )}
          </AnimatePresence>
        </dialog>
      </div>
    </motion.div>
  );
}