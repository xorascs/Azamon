'use client';

import Link from 'next/link';
import { Product } from './product.entity';
import { Category } from '../admin/categories/category.entity';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiZap, FiArrowRight } from 'react-icons/fi';
import { useState } from 'react';
import { FaFireAlt } from 'react-icons/fa';

interface ActualProps {
  categories: Category[];
  hotProducts: Product[] | null;
}

export const ActualSkeletonLoader = () => {
  return (
    <div className="mb-16 space-y-12">
      {/* Categories Section Skeleton */}
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gradient-to-r from-base-300 to-base-200 rounded-full animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-base-300 to-base-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-base-300 rounded-full w-3/4 animate-pulse"></div>
                <div className="h-4 bg-base-300 rounded-full w-1/2 animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hot Products Section Skeleton */}
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gradient-to-r from-base-300 to-base-200 rounded-full animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1, delay: index * 0.1 }}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-base-300 to-base-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-base-300 rounded-full animate-pulse"></div>
                    ))}
                  </div>
                  <div className="h-5 w-12 bg-base-300 rounded-full animate-pulse"></div>
                </div>
                <div className="h-6 bg-base-300 rounded-full w-full animate-pulse"></div>
                <div className="h-5 bg-base-300 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center">
          <div className="h-12 w-48 bg-gradient-to-r from-base-300 to-base-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default function Actual({ categories, hotProducts }: ActualProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  return (
    <div className="mb-16 space-y-12">
      {/* Categories Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <motion.h2 
            className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Shop Categories
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
            >
              <Link
                href={`/products/categories/${category.name}`}
                className="card bg-base-100 shadow-sm hover:shadow-lg transition-all rounded-xl overflow-hidden group"
              >
                <figure className="relative aspect-square">
                  {category.avatar ? (
                    <img
                      src={category.avatar}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{category.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </figure>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <FiShoppingCart className="text-primary" />
                    {category.productCount || 0} products
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Hot Products Section */}
      {hotProducts && hotProducts.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <motion.h2 
              className="text-3xl font-bold bg-gradient-to-r from-warning to-error bg-clip-text text-transparent flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FiZap className="text-warning" />
              Hot Products
            </motion.h2>
            <Link 
              href="/products/hot" 
              className="btn btn-ghost text-sm flex items-center gap-1 group"
            >
              View All
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {hotProducts.map((product) => (
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
                  <div className="card bg-base-100 shadow-sm hover:shadow-lg transition-all rounded-xl overflow-hidden group h-full flex flex-col">
                    <figure className="relative aspect-square">
                      {product.avatar ? (
                        <>
                          <img
                            src={product.avatar}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-warning to-error flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">{product.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </figure>
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1">
                          <div className="rating rating-xs">
                            {Array.from({ length: 5 }, (_, i) => (
                              <input
                                key={i}
                                type="radio"
                                name={`actualRating-${product.id}`}
                                className={`mask mask-star-2 ${i < product.rating! ? 'bg-yellow-400' : 'bg-base-400'}`}
                                checked={i === product.rating! - 1}
                                readOnly
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">({product.ratingQuantity})</span>
                        </div>
                        <span className="font-bold text-lg bg-gradient-to-r from-warning to-error bg-clip-text text-transparent">
                          &euro; {product.price}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      <div className="mt-auto pt-2">
                        <button className="btn btn-sm btn-primary w-full group-hover:btn-secondary transition-all">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
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
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}