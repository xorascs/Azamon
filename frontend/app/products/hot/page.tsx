'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/app/config';
import { Product } from '../product.entity';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiChevronLeft, FiChevronRight, FiHome, FiShoppingBag } from 'react-icons/fi';
import { FaFireAlt } from 'react-icons/fa';

// Constants for pagination
const PRODUCTS_PER_PAGE = 8;

const SkeletonLoader = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, index) => (
        <motion.div 
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 animate-pulse"
        >
          <figure className="overflow-hidden">
            <div className="w-full h-56 bg-gradient-to-r from-gray-200 to-gray-300 rounded-t-lg"></div>
          </figure>
          <div className="card-body p-4">
            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default function HotProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/products/hot`);
        const productList = response.data.map((item: any) => ({
          id: item._id,
          name: item._source.name,
          description: item._source.description,
          price: item._source.price,
          category: item._source.category,
          rating: item._source.rating || 0,
          ratingQuantity: item._source.ratingQuantity || 0,
          avatar: item._source.avatar || '',
        }));
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching hot products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate total pages based on the number of products and items per page
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  // Slice the products array to display only the current page's products
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) return <SkeletonLoader />;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-32 px-4 sm:px-6 bg-gradient-to-b from-base-100 to-base-200"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100 * Math.sin(i)],
              y: [0, 100 * Math.cos(i)],
              rotate: [0, 360],
            }}
            transition={{
              duration: 20 + i * 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
            className="absolute w-4 h-4 rounded-full bg-primary/10"
            style={{
              left: `${10 + (i * 10)}%`,
              top: `${10 + (i * 5)}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm breadcrumbs px-6 py-4 justify-center flex max-w-6xl mx-auto overflow-x-hidden"
      >
        <ul className="bg-base-100/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-sm">
          <li>
            <Link href="/" className="flex items-center gap-1">
              <FiHome className="text-primary" /> Home
            </Link>
          </li>
          <li>
            <Link href="/products/categories/all" className="flex items-center gap-1">
              <FiShoppingBag className="text-primary" /> Products
            </Link>
          </li>
          <li className="flex items-center gap-1 font-bold text-primary">
            <FaFireAlt className="text-primary" /> Hot Products
          </li>
        </ul>
      </motion.div>

      {/* Product Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto px-4"
      >
        <AnimatePresence>
          {paginatedProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ y: -5 }}
              onHoverStart={() => setHoveredProduct(product.id)}
              onHoverEnd={() => setHoveredProduct(null)}
              className="relative"
            >
              <Link href={`/products/${product.id}`}>
                <div className="card bg-base-100 shadow-xl group hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                  {/* Hot badge */}
                  <motion.div 
                    animate={{ 
                      scale: hoveredProduct === product.id ? [1, 1.1, 1] : 1,
                      rotate: hoveredProduct === product.id ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1"
                  >
                    <FaFireAlt /> HOT
                  </motion.div>

                  <figure className="px-4 pt-4 overflow-hidden">
                    {product.avatar ? (
                      <div 
                        className="relative group w-full"
                      >
                        <motion.img
                          src={product.avatar}
                          alt={product.name}
                          className="rounded-xl h-60 w-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    ) : (
                      <motion.div 
                        className="relative group w-full"
                        animate={{ 
                          background: hoveredProduct === product.id 
                            ? "linear-gradient(45deg, #3b82f6, #8b5cf6)" 
                            : "linear-gradient(45deg, #64748b, #475569)"
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="rounded-xl h-60 w-full flex items-center justify-center">
                          <motion.span 
                            className="text-4xl text-white"
                            animate={{ 
                              scale: hoveredProduct === product.id ? 1.2 : 1 
                            }}
                          >
                            {product.name.charAt(0)}
                          </motion.span>
                        </div>
                      </motion.div>
                    )}
                  </figure>
                  <div className="card-body pt-4 flex-grow">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <div className="rating rating-xs">
                          {Array.from({ length: 5 }, (_, i) => (
                            <input
                              key={i}
                              type="radio"
                              name={`rating-${product.id}`}
                              className={`mask mask-star-2 ${i < product.rating! ? 'bg-yellow-400' : 'bg-base-300'}`}
                              checked={i === Math.floor(product.rating!) - 1}
                              readOnly
                            />
                          ))}
                        </div>
                        <span className="text-sm opacity-70">({product.ratingQuantity})</span>
                      </div>
                      <div 
                        className="font-bold text-lg bg-gradient-to-r from-warning to-error bg-clip-text text-transparent"
                      >
                        &euro; {product.price}
                      </div>
                    </div>
                    <h2 
                      className="font-bold text-lg bg-gradient-to-r from-warning to-error bg-clip-text text-transparent"
                    >
                      {product.name.substring(0,24)}{(product.name.length > 24 ? "..." : "")}
                    </h2>
                    <div className="mt-auto pt-2">
                      <button className="btn btn-sm btn-primary w-full group-hover:btn-secondary transition-all">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="join flex justify-center mt-12 mb-8"
        >
          <button
            className="join-item btn btn-primary btn-outline"
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
              <motion.button
                key={pageNum}
                className={`join-item btn ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handlePageChange(pageNum)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {pageNum}
              </motion.button>
            );
          })}

          <button
            className="join-item btn btn-primary btn-outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FiChevronRight />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}