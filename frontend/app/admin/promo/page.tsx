'use client';
import { MdDeleteOutline, MdAdd } from 'react-icons/md';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Promo } from './promo.entity'; 
import { API_BASE_URL } from '@/app/config';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaMagic, FaPercentage, FaTag, FaUsers } from 'react-icons/fa';

// Skeleton Loader Component
const SkeletonLoader = () => {
  return (
    <div className="overflow-x-auto w-2/3 max-w-3xl mx-auto">
      <table className="table table-xl">
        <thead>
          <tr>
            <th>
              <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
            </th>
            <th>
              <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
            </th>
            <th>
              <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
            </th>
            <th>
              <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td>
                <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
              </td>
              <td>
                <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
              </td>
              <td>
                <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
              </td>
              <td>
                <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PROMOS_PER_PAGE = 8;

export default function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [isCreateModal, setIsCreateModal] = useState<boolean>(false);
  const [newPromoForm, setNewPromoForm] = useState<Partial<Promo>>({
    name: '',
    fee: 0,
    activeUntil: '',
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch all promos
  async function getPromos() {
    try {
      const response = await axios.get(`${API_BASE_URL}/promo`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = response.data;
      setPromos(data);
      setTotalPages(Math.ceil(data.length / PROMOS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching promos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Create a new promo
  async function createPromo(promo: Partial<Promo>) {
    try {
      const newData = {
        ...promo,
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/promo`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setIsCreateModal(false);
      setTimeout(() => getPromos(), 500);
    } catch (error) {
      console.error('Error creating promo:', error);
    }
  }

  // Delete a promo
  async function deletePromo(id: string) {
    try {
      const newData = {
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/promo/${id}`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setTimeout(() => getPromos(), 500);
    } catch (error) {
      console.error('Error deleting promo:', error);
    }
  }

  // Open or close the create modal
  function actCreateModal() {
    setIsCreateModal(!isCreateModal);
    setNewPromoForm({
      name: '',
      fee: 0,
      activeUntil: '',
      status: 'active',
      amount: 0
    });
  }

  // Handle input changes in forms
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPromoForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreateModal) {
      await createPromo(newPromoForm);
    }
  };

  // Fetch promos on component mount
  useEffect(() => {
    getPromos();
  }, []);

  // Paginate promos
  const paginatedPromos = promos.slice(
    (currentPage - 1) * PROMOS_PER_PAGE,
    currentPage * PROMOS_PER_PAGE
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Promo Codes Management
          </h1>
          <motion.button
            onClick={actCreateModal}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary rounded-full"
          >
            <MdAdd className="text-xl" />
            Create Promo
          </motion.button>
        </motion.div>
  
        {/* Promos Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-base-100/80 backdrop-blur-md rounded-2xl shadow-xl overflow-auto border border-base-300/20"
        >
          <table className="table">
            {/* Table Header */}
            <thead className="bg-base-200/50">
              <tr>
                <th className="text-lg">Name</th>
                <th className="text-lg">Discount</th>
                <th className="text-lg">Expires</th>
                <th className="text-lg">Uses</th>
                <th className="text-lg">Status</th>
                <th className="text-lg">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              <AnimatePresence>
                {paginatedPromos.map((promo) => (
                  <motion.tr
                    key={promo.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="hover:bg-base-200/30 transition-colors"
                  >
                    <td className="font-medium">{promo.name}</td>
                    <td>
                      <span className="badge h-full badge-primary">
                        {promo.fee}% OFF
                      </span>
                    </td>
                    <td>
                      {new Date(promo.activeUntil).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>{promo.amount}</td>
                    <td>
                      <motion.span 
                        whileHover={{ scale: 1.1 }}
                        className={`badge ${promo.status === 'active' ? 'badge-success' : 'badge-error'}`}
                      >
                        {promo.status.toUpperCase()}
                      </motion.span>
                    </td>
                    <td>
                      <motion.button
                        onClick={() => deletePromo(promo.name)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="btn btn-ghost btn-square text-error"
                      >
                        <MdDeleteOutline className="text-xl" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
  
          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center p-4"
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
        </motion.div>
  
        {/* Create Promo Modal */}
        <dialog id="create_modal" className="modal" open={isCreateModal}>
          <AnimatePresence>
            {isCreateModal && (
              <>
                <motion.div
                  className="modal-box bg-base-100/95 backdrop-blur-md border border-base-300/30 shadow-2xl"
                >
                  {/* Modal Header */}
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-between items-center mb-6"
                  >
                    <h3 className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Create New Promo
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
                    {/* Promo Name Field */}
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
                            Promo Name
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="name"
                            value={newPromoForm.name || ''}
                            onChange={handleInputChange}
                            type="text"
                            placeholder="SUMMER2023"
                            className="input input-bordered w-full focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </motion.div>
                      </label>
                    </motion.div>

                    {/* Discount Percentage Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <motion.span
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ repeat: Infinity, duration: 3 }}
                            >
                              <FaPercentage className="text-secondary" />
                            </motion.span>
                            Discount Percentage
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }} className="relative">
                          <input
                            name="fee"
                            value={newPromoForm.fee || ''}
                            onChange={handleInputChange}
                            type="number"
                            placeholder="10"
                            min={1}
                            max={100}
                            step={1}
                            className="input input-bordered w-full pr-12 focus:ring-2 focus:ring-secondary/50"
                            required
                          />
                          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-lg">%</span>
                        </motion.div>
                      </label>
                    </motion.div>

                    {/* Expiration Date Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <motion.span
                              animate={{ rotate: [0, 360] }}
                              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                            >
                              <FaClock className="text-accent" />
                            </motion.span>
                            Expiration Date
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="activeUntil"
                            value={newPromoForm.activeUntil || ''}
                            onChange={handleInputChange}
                            type="datetime-local"
                            className="input input-bordered w-full focus:ring-2 focus:ring-accent/50"
                            required
                          />
                        </motion.div>
                      </label>
                    </motion.div>

                    {/* Maximum Uses Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <motion.div
                              animate={{ y: [0, -3, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <FaUsers className="text-info" />
                            </motion.div>
                            Maximum Uses
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="amount"
                            value={newPromoForm.amount || 0}
                            onChange={handleInputChange}
                            type="number"
                            placeholder="100"
                            min={1}
                            className="input input-bordered w-full focus:ring-2 focus:ring-info/50"
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
                      transition={{ delay: 0.6 }}
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
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <FaMagic className="mr-2" />
                        </motion.span>
                        Create Promo
                      </motion.button>
                    </motion.div>
                  </form>
                </motion.div>

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