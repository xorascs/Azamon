'use client';

import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthForm() {
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    login: '',
    email: '',
    password: '',
  });
  const [isRegister, setIsRegister] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error messages when the user starts typing
    setErrors({ ...errors, [name]: '' });
  };

  const clearFormData = () => {
    setFormData({login: "", email: "", password: ""});
  } 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister) {
      register();
    } else {
      login();
    }
    clearFormData();
  };

  const register = async () => {
    const newData = {
        "notifications_token": localStorage.getItem("notifications_token"),
        "login": formData.login,
        "password": formData.password,
        "email": formData.email,
        "role": "USER"
    }

    await axios.post(`${API_BASE_URL}/auth/register`, newData);
  };

  const login = async () => {
    const newData = {
        "notifications_token": localStorage.getItem("notifications_token"),
        "login": formData.login,
        "password": formData.password,
    }

    await axios.post(`${API_BASE_URL}/auth/login`, newData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-base-100 to-base-200"
    >
      <motion.div
        layout
        key={isRegister ? "register" : "login"}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="card glass w-full max-w-md shadow-2xl border border-base-300/30 rounded-xl backdrop-blur-lg bg-base-100/70 overflow-hidden"
      >
        <div className="card-body p-8">
          {/* Header with animated transition */}
          <motion.div layout className="text-center mb-6">
            <motion.h2 
              layout
              className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              {isRegister ? "Create Account" : "Welcome Back"}
            </motion.h2>
            <motion.p 
              layout
              className="text-base-content/70 mt-2"
            >
              {isRegister ? "Join our community" : "Sign in to continue"}
            </motion.p>
          </motion.div>
  
          <div className="divider my-4"></div>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <motion.div layout>
              <label className="input input-bordered flex items-center gap-2 w-full bg-base-200/50">
                <FaUser className="text-base-content/70" />
                <input
                  type="text"
                  name="login"
                  placeholder="Username"
                  value={formData.login}
                  onChange={handleChange}
                  minLength={5}
                  required
                  className="w-full bg-transparent"
                />
              </label>
              {errors.login && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-error text-sm mt-1"
                >
                  {errors.login}
                </motion.p>
              )}
            </motion.div>
  
            {/* Email Field (animated appearance/disappearance) */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="input input-bordered flex items-center gap-2 w-full bg-base-200/50">
                    <FaEnvelope className="text-base-content/70" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required={isRegister}
                      className="w-full bg-transparent"
                    />
                  </label>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-error text-sm mt-1"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
  
            {/* Password Field */}
            <motion.div layout>
              <label className="input input-bordered flex items-center gap-2 w-full bg-base-200/50">
                <FaLock className="text-base-content/70" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={10}
                  required
                  className="w-full bg-transparent"
                />
              </label>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-error text-sm mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </motion.div>
  
            {/* Submit Button */}
            <motion.div layout className="pt-2">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary w-full bg-gradient-to-r from-primary to-secondary border-none text-white"
              >
                {isRegister ? (
                  <>
                    <FaUserPlus className="mr-2" />
                    Register
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="mr-2" />
                    Login
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>
  
          {/* Toggle between login/register */}
          <motion.div layout className="text-center mt-6">
            <p className="text-base-content/70">
              {isRegister ? "Already have an account?" : "Don't have an account?"}
            </p>
            <motion.button
              onClick={() => setIsRegister(!isRegister)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="link link-primary font-medium mt-1"
            >
              {isRegister ? "Sign in instead" : "Create account"}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}