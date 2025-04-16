'use client';
import { MdOutlineEdit, MdDeleteOutline, MdEmail, MdAdd } from 'react-icons/md';
import { FaLock, FaSave, FaUser, FaUserShield } from 'react-icons/fa';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { User } from './user.entity';
import { API_BASE_URL } from '@/app/config';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus } from 'react-icons/fa6';

const SkeletonLoader = () => {
  return (
    <div className="overflow-x-auto w-1/3 max-w-3xl mx-auto">
      <table className="table">
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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-base-300 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-base-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </td>
              <td>
                <div className="h-6 w-20 bg-base-300 rounded animate-pulse"></div>
              </td>
              <td>
                <div className="h-6 w-24 bg-base-300 rounded animate-pulse"></div>
              </td>
              <td>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-base-300 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-8 bg-base-300 rounded-lg animate-pulse"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Pagination constants
const USERS_PER_PAGE = 5; // Number of users per page

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditModal, setIsEditModal] = useState<boolean>(false);
  const [isCreateModal, setIsCreateModal] = useState<boolean>(false);
  const [editUserForm, setEditUserForm] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState<Partial<User>>({
    login: undefined,
    email: undefined,
    password: undefined,
    role: undefined,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  async function getUsers() {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      const data = response.data;
      setUsers(data);
      setTotalPages(Math.ceil(data.length / USERS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createUser(user: Partial<User>) {
    try {
      const newData = {
        ...user,
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/users`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setIsCreateModal(false);
      setTimeout(() => getUsers(), 500);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }

  async function editUser(user: Partial<User>) {
    try {
      const newData = {
        ...user,
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.patch(`${API_BASE_URL}/users/${editUserForm!.id}`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setIsEditModal(false);
      setTimeout(() => getUsers(), 500);
    } catch (error) {
      console.error('Error editing user:', error);
    }
  }

  async function deleteUser(id: number) {
    try {
      const newData = {
        notifications_token: localStorage.getItem('notifications_token'),
      };
      await axios.post(`${API_BASE_URL}/users/${id}`, newData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });
      setTimeout(() => getUsers(), 500);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

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

  function actCreateModal() {
    setIsCreateModal(!isCreateModal);
    setNewUserForm({
      login: undefined,
      email: undefined,
      password: undefined,
      role: undefined,
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditModal && editUserForm) {
      await editUser(newUserForm);
    } else if (isCreateModal) {
      await createUser(newUserForm);
    }
  };

  const handleAvatarChange = async (userId: number) => {
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
        const response = await axios.patch(`${API_BASE_URL}/users/${userId}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });
        const newAvatarUrl = response.data.avatarUrl;
        setUsers((prevUsers) =>
          prevUsers.map((user) => (user.id === userId ? { ...user, avatar: newAvatarUrl } : user))
        );
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    };
  };

  // Paginate users
  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

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
            Users Management
          </h1>
          <motion.button
            onClick={actCreateModal}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary rounded-full"
          >
            <MdAdd className="text-xl" />
            Create User
          </motion.button>
        </motion.div>
  
        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-base-100/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-base-300/20"
        >
          <div className="overflow-x-auto">
            <table className="table">
              {/* Table Header */}
              <thead className="bg-base-200/50">
                <tr>
                  <th className="text-lg">User</th>
                  <th className="text-lg">Role</th>
                  <th className="text-lg">Last Updated</th>
                  <th className="text-lg">Actions</th>
                </tr>
              </thead>
  
              {/* Table Body */}
              <tbody>
                <AnimatePresence>
                  {paginatedUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="hover:bg-base-200/30 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="avatar"
                          >
                            <div className="relative group">
                              {user.avatar ? (
                                <div className="mask mask-circle w-12 h-12">
                                  <img src={user.avatar} alt="Avatar" />
                                </div>
                              ) : (
                                <div className="avatar placeholder">
                                  <div className="bg-neutral text-neutral-content w-12 rounded-full">
                                    <span className="text-xl">{user.login.substring(0, 1)}</span>
                                  </div>
                                </div>
                              )}
                              <div className='absolute top-0 left-0 w-full h-full flex justify-center items-center bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                <motion.button
                                  onClick={() => handleAvatarChange(user.id)}
                                  whileHover={{ scale: 1.2 }}
                                  className="btn btn-circle btn-xs btn-primary"
                                >
                                  <MdOutlineEdit />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                          <div>
                            <div className="font-bold">
                              <Link 
                                href={`/profile/${user.id}`} 
                                className="link link-hover hover:text-primary"
                              >
                                {user.login}
                              </Link>
                            </div>
                            <div className="text-sm opacity-70">
                              {user.email.substring(0, 15)}
                              {user.email.length > 15 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <motion.span 
                          whileHover={{ scale: 1.1 }}
                          className={`badge ${user.role === 'ADMIN' ? 'badge-accent' : 'badge-neutral'}`}
                        >
                          {user.role}
                        </motion.span>
                      </td>
                      <td>
                        <div className="text-sm">
                          {new Date(user.updatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => actEditModal(user)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="btn btn-ghost btn-square text-secondary"
                          >
                            <MdOutlineEdit className="text-xl" />
                          </motion.button>
                          <motion.button
                            onClick={() => deleteUser(user.id)}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className="btn btn-ghost btn-square text-error"
                          >
                            <MdDeleteOutline className="text-xl" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
  
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
  
        {/* Edit User Modal */}
        <dialog id="edit_modal" className="modal" open={isEditModal}>
          <AnimatePresence>
            {isEditModal && (
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
                      Edit {newUserForm?.login}
                    </h3>
                    <motion.button
                      onClick={() => actEditModal(null)}
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="btn btn-circle btn-ghost"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </motion.div>
  
                  <form method="patch" onSubmit={handleSubmit} className="space-y-4">
                    {/* Login Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <FaUser className="text-primary" />
                            Username
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="login"
                            value={newUserForm.login || ''}
                            onChange={handleInputChange}
                            type="text"
                            placeholder="Username"
                            className="input input-bordered w-full focus:ring-2 focus:ring-primary/50"
                            required
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Email Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <MdEmail className="text-secondary" />
                            Email
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="email"
                            value={newUserForm.email || ''}
                            onChange={handleInputChange}
                            type="email"
                            placeholder="Email"
                            className="input input-bordered w-full focus:ring-2 focus:ring-secondary/50"
                            required
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Password Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <FaLock className="text-accent" />
                            Password
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="password"
                            value={newUserForm.password || ''}
                            onChange={handleInputChange}
                            type="password"
                            placeholder="Leave blank to keep current"
                            className="input input-bordered w-full focus:ring-2 focus:ring-accent/50"
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Role Selector */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <FaUserShield className="text-info" />
                            Role
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <select
                            name="role"
                            value={newUserForm.role || ''}
                            onChange={handleInputChange}
                            className="select select-bordered w-full focus:ring-2 focus:ring-info/50"
                          >
                            <option disabled value="">Select role</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                          </select>
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
                        onClick={() => actEditModal(null)}
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
                        <FaSave className="mr-2" />
                        Save Changes
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
                  onClick={() => actEditModal(null)}
                />
              </>
            )}
          </AnimatePresence>
        </dialog>
  
        {/* Create User Modal */}
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
                      Create New User
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
  
                  <form method="post" onSubmit={handleSubmit} className="space-y-4">
                    {/* Login Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <FaUser className="text-primary" />
                            Username
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="login"
                            value={newUserForm.login || ''}
                            onChange={handleInputChange}
                            type="text"
                            placeholder="Username"
                            className="input input-bordered w-full focus:ring-2 focus:ring-primary/50"
                            required
                            pattern="^[a-zA-Z0-9]{5,30}$"
                            title="5-30 characters, letters and numbers only"
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Email Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <MdEmail className="text-secondary" />
                            Email
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="email"
                            value={newUserForm.email || ''}
                            onChange={handleInputChange}
                            type="email"
                            placeholder="Email"
                            className="input input-bordered w-full focus:ring-2 focus:ring-secondary/50"
                            required
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Password Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <FaLock className="text-accent" />
                            Password
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <input
                            name="password"
                            value={newUserForm.password || ''}
                            onChange={handleInputChange}
                            type="password"
                            placeholder="Password"
                            className="input input-bordered w-full focus:ring-2 focus:ring-accent/50"
                            required
                            pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{10,60}$"
                            title="10+ chars with at least 1 letter and 1 number"
                          />
                        </motion.div>
                      </label>
                    </motion.div>
  
                    {/* Role Selector */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      <label className="form-control">
                        <div className="label">
                          <span className="label-text text-lg flex items-center gap-2">
                            <FaUserShield className="text-info" />
                            Role
                          </span>
                        </div>
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <select
                            name="role"
                            value={newUserForm.role || ''}
                            onChange={handleInputChange}
                            className="select select-bordered w-full focus:ring-2 focus:ring-info/50"
                            required
                          >
                            <option disabled value="">Select role</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="USER">USER</option>
                          </select>
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
                        <FaUserPlus className="mr-2" />
                        Create User
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