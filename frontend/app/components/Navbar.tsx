'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import useWebSocket from './WebSocket';
import PremiumToast, { ToastNotification, ToastStatus } from './CustomAlert';
import { API_BASE_URL, getUserIdFromToken, getAccessTokenTime, isUserAdmin } from '../config';
import axios from 'axios';
import { FaBasketShopping } from 'react-icons/fa6';
import { motion } from 'framer-motion';
import { FaSignInAlt, FaSignOutAlt, FaUser } from 'react-icons/fa';

export default function Navbar() {
  const [isAccessExists, setIsAccessExists] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userLogin, setUserLogin] = useState<string | null>(null);

  const getAvatar = async () => {
    const id = getUserIdFromToken();
    setUserId(id);
    if (!id) return;
    const image = await axios.get(`${API_BASE_URL}/users/${id}/avatar`);
    if (image.data === undefined || image.data === null || image.data === "") return;
    setProfileImage(image.data.toString());
  }

  const accessExists = () => {
    return (
      localStorage.getItem('access_token') !== undefined &&
      localStorage.getItem('access_token') !== null
    );
  };

  const ifUserAdmin = () => {
    setIsAdmin(isUserAdmin());
  }

  const logOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_login');
    setIsAccessExists(false);
    redirect("/auth");
  };

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      logOut();
    }

    try {
      let headers: any = {};
      if (refreshToken) {
        headers = { "X-Authorization": `Bearer ${refreshToken}` };

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-access-token`,
          {},
          { headers }
        );
  
        // Update tokens in localStorage
        const { status, accessToken } = response.data;
        if (status !== "success") {
          logOut();
        }
        localStorage.setItem('access_token', accessToken);
  
        console.log("Access token refreshed successfully.");
      }
      else {
        logOut();
      }
    } catch (error) {
      console.error("Error refreshing access token:", error);
      logOut(); // Log out the user if token refresh fails
    }
  };

  useEffect(() => {
    const value = accessExists();
    setIsAccessExists(value);
    getAvatar();
    ifUserAdmin();
    setUserLogin(localStorage.getItem('user_login'));

    if (value) {
      const setupTokenRefresh = async () => {
        const timeLeft = getAccessTokenTime(); // Get remaining time for the token
        console.log(`Time left for token: ${timeLeft} seconds`);

        if (timeLeft !== null && timeLeft > 0) {
          // Set an interval to refresh the token just before it expires
          const refreshThreshold = Math.max(timeLeft - 60, 0) * 1000; // Refresh 60 seconds before expiry
          setTimeout(async () => {
            await refreshAccessToken();
            setupTokenRefresh(); // Recursively set up the next refresh
          }, refreshThreshold);
        } else {
          // If token is already expired or invalid, refresh immediately
          await refreshAccessToken();
          setupTokenRefresh();
        }
      };

      setupTokenRefresh();
    }
  }, []);

  const generateRandomToken = () => {
    let value = Math.random().toString(36).substr(2);
    return value;
  };

  useWebSocket((status: string, message: string) => {
    // Add a new toast notification
    const newToast: ToastNotification = {
      id: generateRandomToken(),
      status: status as ToastStatus, // Cast to ToastStatus
      message,
      duration: 5000, // Longer duration for better visibility
      showProgress: true
    };
    setNotifications((prev) => [...prev, newToast]);
  });

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="navbar bg-base-100/80 backdrop-blur-md shadow-lg fixed top-0 z-50 border-b border-base-300/30"
      >
        {/* Left Side - Mobile Menu */}
        <div className="navbar-start">
          <motion.div 
            className="dropdown"
            whileHover={{ scale: 1.05 }}
          >
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur-lg rounded-box z-[1] mt-3 w-52 p-4 shadow-xl"
            >
              <motion.li whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                <Link href="/" className="text-sm">Homepage</Link>
              </motion.li>
              <motion.li whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                <Link href="/products/categories/all" className="text-sm">Catalog</Link>
              </motion.li>
              {isAdmin && (
                <>
                  <div className="divider">ADMIN PANEL</div>
                  <motion.li whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/admin/users" className="text-sm">Users</Link>
                  </motion.li>
                  <motion.li whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/admin/categories" className="text-sm">Categories</Link>
                  </motion.li>
                  <motion.li whileHover={{ x: 3 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/admin/promo" className="text-sm">Promos</Link>
                  </motion.li>
                </>
              )}
            </ul>
          </motion.div>
        </div>
  
        {/* Center - Logo */}
        <div className="navbar-center">
          <div
          >
            <Link 
              className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
              href="/"
            >
              Azamon
            </Link>
          </div>
        </div>
  
        {/* Right Side - User Controls */}
        <div className="navbar-end gap-2">
          {isAccessExists ? (
            <>
              {/* Cart Button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Link 
                  href={`/profile/cart/${userId}`} 
                  className="btn btn-circle btn-primary btn-outline relative"
                >
                  <FaBasketShopping className="text-lg" />
                </Link>
              </motion.div>
  
              {/* User Avatar Dropdown */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="dropdown dropdown-end"
              >
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  {profileImage ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30"
                    >
                      <img 
                        src={profileImage} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="avatar placeholder"
                    >
                      <div className="bg-neutral text-neutral-content rounded-full w-10">
                        <span className="text-lg font-bold">
                          {userLogin ? userLogin.charAt(0).toUpperCase() : userId?.toString().charAt(0)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur-lg rounded-box z-[1] mt-3 w-52 p-4 shadow-xl"
                >
                  <motion.li whileHover={{ x: 4 }}>
                    <Link href={`/profile/${userId}`} className="text-sm">
                      <FaUser className="text-primary" /> Profile
                    </Link>
                  </motion.li>
                  <motion.li whileHover={{ x: 4 }}>
                    <button onClick={() => logOut()} className="text-sm">
                      <FaSignOutAlt className="text-error" /> Logout
                    </button>
                  </motion.li>
                </ul>
              </motion.div>
            </>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/auth" 
                className="btn btn-primary btn-outline px-6 rounded-full"
              >
                <FaSignInAlt className="mr-2" /> Login
              </Link>
            </motion.div>
          )}
        </div>
      </motion.nav>
  
      {/* Render the CustomAlert with multiple notifications */}
      <PremiumToast notifications={notifications} />
    </>
  );
}