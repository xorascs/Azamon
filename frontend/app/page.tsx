'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSearch, FiShoppingBag, FiShoppingCart } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar, FaTwitter, FaInstagram, FaFacebook, FaShoppingCart } from 'react-icons/fa';
import { API_BASE_URL, getUserIdFromToken } from '@/app/config';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BsCartPlus, BsArrowRight } from 'react-icons/bs';
import { Category } from './admin/categories/category.entity';
import { Product } from './products/product.entity';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({
    categories: true,
    products: true,
    hotProducts: true
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data.slice(0,4));
      setLoading(prev => ({ ...prev, categories: false }));
    } catch (err) {
      console.error("Error fetching categories:", err);
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      const productList = response.data.map((item: any) => ({
        id: item._id,
        name: item._source.name,
        description: item._source.description,
        price: item._source.price,
        category: item._source.category,
        rating: item._source.rating || 0,
        ratingQuantity: item._source.ratingQuantity || 0,
        avatar: item._source.avatar || "",
      })).slice(0,4);
      setProducts(productList);
      setLoading(prev => ({ ...prev, products: false }));
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  const addToCart = async (product: any) => {
    const newData = {
      "notifications_token": localStorage.getItem("notifications_token"),
      "userId": getUserIdFromToken()?.toString(),
      "productId": product.id
    }

    await axios.post(`${API_BASE_URL}/users/addToCart`, newData, 
      { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } }
    )
  }

  // Star rating component
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    
    return stars;
  };

  return (
    <div className="bg-base-100 min-h-screen">
      {/* Hero Section */}
      <motion.section 
        className="hero min-h-[70vh] relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div 
          className="hero-overlay bg-opacity-60 absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        <motion.div 
          className="hero-content text-center text-neutral-content relative z-10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="max-w-2xl">
            <motion.h1 
              className="mb-6 text-5xl md:text-6xl font-bold"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              Welcome to <span className="text-primary">Azamon</span>
            </motion.h1>
            
            <motion.p 
              className="mb-8 text-lg md:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Discover amazing products at unbeatable prices. Shop now for the best deals!
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <Link 
                href={`/products/categories/all`} 
                className="btn btn-primary btn-lg rounded-full group"
              >
                <span className="group-hover:scale-105 transition-transform">Shop Now</span>
                <BsArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Floating elements */}
        <motion.div 
          className="absolute top-20 left-20 w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-secondary/20 backdrop-blur-sm"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </motion.section>

      {/* Category Grid */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-center mb-4">Shop by Category</h2>
          <p className="text-center text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Browse our wide range of categories to find exactly what you're looking for
          </p>
        </motion.div>
        
        {loading.categories ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={`categories${category.id}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10 }}
              >
                <Link href={`/products/categories/${category.name}`}>
                  <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden group h-full border border-base-200">
                    <figure className="relative aspect-square">
                      {category.avatar ? (
                        <motion.img
                          src={category.avatar}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="text-4xl font-bold text-white">{category.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </figure>
                    <div className="p-6 text-center">
                      <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                        <FiShoppingCart className="text-primary" />
                        {category.productCount || 0} products
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section className="bg-base-200 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-center mb-4">Featured Products</h2>
            <p className="text-center text-lg text-gray-500 max-w-2xl mx-auto">
              Handpicked selection of our most popular items
            </p>
          </motion.div>
          
          {loading.products ? (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -10 }}
                  className="h-full"
                >
                  <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden h-full flex flex-col group relative border border-base-200">
                    {/* Sale badge */}
                    <div className="absolute top-4 left-4 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                      SALE
                    </div>
                    
                    {/* Add to Cart Button */}
                    <motion.button 
                      className="absolute top-4 right-4 z-10 btn btn-circle btn-secondary btn-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      aria-label="Add to cart"
                    >
                      <BsCartPlus className="text-lg" />
                    </motion.button>
                
                    <Link href={`/products/${product.id}`} className="h-full flex flex-col">
                      <figure className="relative aspect-square overflow-hidden">
                        {product.avatar ? (
                          <motion.img
                            src={product.avatar}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            initial={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">{product.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </figure>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1">
                            {renderStars(product.rating || 0)}
                            <span className="text-xs text-gray-500 ml-1">({product.ratingQuantity})</span>
                          </div>
                          <span className="font-bold text-xl text-primary">
                            &euro; {product.price}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="mt-auto pt-4">
                          <button className="btn btn-outline btn-primary w-full group-hover:btn-primary transition-all">
                            View Details
                          </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Link 
              href="/products/categories/all" 
              className="btn btn-outline btn-primary btn-lg rounded-full group"
            >
              <FiShoppingBag className="mr-2" /> 
              <span>View All Products</span>
              <BsArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Join Our Community of Happy Shoppers
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Sign up or sign in now!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/auth`} className="btn btn-lg btn-accent rounded-full text-white">
                Get started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}