'use client';
import { MdAdd, MdRefresh } from "react-icons/md";
import { FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiShoppingBag, FiHome } from "react-icons/fi";
import axios from "axios";
import { useEffect, useState, useCallback, useRef } from "react";
import { Product } from "../../product.entity";
import { API_BASE_URL } from "@/app/config";
import Link from "next/link";
import PriceRangeSlider from "../../../components/CustomRange";
import { getUserIdFromToken, isLoggedIn } from "@/app/config";
import Actual, { ActualSkeletonLoader } from "../../Actual";
import { Category } from "../../../admin/categories/category.entity";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BsCartPlus } from "react-icons/bs";

const SkeletonLoader = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
      {[...Array(8)].map((_, index) => (
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
  );
};

const PRODUCTS_PER_PAGE = 8;

export default function ProductsPage() {
  const { id } = useParams(); // Get product NAME from URL
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [actualCategories, setActualCategories] = useState<Category[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [isCreateModal, setIsCreateModal] = useState<boolean>(false);
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    name: undefined,
    description: undefined,
    price: undefined,
    category: undefined,
    rating: undefined,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const priceRangeSliderRef = useRef<{ resetRange: () => void } | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);

  async function getCategories() {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      setCategories(response.data.map((category: any) => category.name));
      setActualCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  async function getHotProducts() {
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
        avatar: item._source.avatar || "",
      }))
      .slice(0, 4);

      setHotProducts(productList);
    } catch (err) {
      console.error("Error fetching hot products:", err);
    }
  }

  // Fetch products
  async function getProducts() {
    setIsLoading(true); // Start loading
    try {
      let response;
      if (id !== "all") {
        const searchData = {
          field: "category",
          value: id,
          searchType: "match",
        };
        response = await axios.post(`${API_BASE_URL}/products/search`, searchData);
      }
      else {
        response = await axios.get(`${API_BASE_URL}/products`);
      }
      const productList = response.data.map((item: any) => ({
        id: item._id,
        name: item._source.name,
        description: item._source.description,
        price: item._source.price,
        category: item._source.category,
        rating: item._source.rating || 0,
        ratingQuantity: item._source.ratingQuantity || 0,
        avatar: item._source.avatar || "",
      }));
      setProducts(productList);
      getCategories();
      getHotProducts();
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  }

  // Create a new product
  async function createProduct(product: Partial<Product>) {
    try {
      const newData = {
        notifications_token: localStorage.getItem("notifications_token"),
        userId: getUserIdFromToken(),
        ...product,
      };
      await axios.post(`${API_BASE_URL}/products`, newData, { headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } });
      setIsCreateModal(false);
      setTimeout(() => getProducts(), 1000);
    } catch (error) {
      console.error("Error creating product:", error);
    }
  }

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

  // Inside ProductsPage component
  const handlePriceRangeChange = useCallback(
    (newRange: { min: number; max: number }) => {
      setPriceRange([newRange.min, newRange.max]);
      setCurrentPage(1);
    },
    []
  );

  // Handle rating filter change
  const handleRatingChange = (value: number) => {
    setRatingFilter(value);
    setCurrentPage(1);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Restore filters and search
  const restoreFilters = () => {
    if (priceRangeSliderRef.current) {
      priceRangeSliderRef.current.resetRange(); // Reset the price range
    }
    setRatingFilter(0); // Reset rating filter
    setSearchQuery(""); // Reset search query
  };

  // Filtered products
  const filteredProducts = products.filter((product) => {
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesRating = ratingFilter === 0 || product.rating! === ratingFilter;
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPrice && matchesRating && matchesSearch;
  });
  // Calculate total pages based on the number of products and items per page
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  // Slice the products array to display only the current page's products
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle input changes in forms
  const handleInputChange = (e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >) => {
    const { name, value } = e.target;
    setNewProductForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreateModal) {
      await createProduct(newProductForm);
      setNewProductForm({
        name: undefined,
        description: undefined,
        price: undefined,
        category: undefined,
        rating: undefined,
      })
    }
  };

  // Fetch products on mount
  useEffect(() => {
    setLoggedIn(isLoggedIn());
    getProducts();
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen pt-32 bg-gradient-to-b from-base-100 to-base-200">
      {/* Breadcrumbs with animation */}
      {id !== "all" && (
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
              <FiShoppingBag className="text-primary" /> {id}
            </li>
          </ul>
        </motion.div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 px-6">
        {/* Mobile Filters Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiFilter /> Filters
          </button>
          {loggedIn && id === "all" && (
            <button 
              onClick={() => setIsCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <MdAdd /> Create Product
            </button>
          )}
        </div>

        {/* Sidebar Filters - Desktop */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`hidden lg:block w-80 p-6 rounded-xl h-fit border border-base-300 bg-base-100 sticky top-32 shadow-lg`}
        >
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FiFilter className="text-primary" /> 
            Filters
          </h2>

          <div className="space-y-8">
            {/* Price Range Filter */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Price Range</h3>
              <PriceRangeSlider
                ref={priceRangeSliderRef}
                min={0.01}
                max={5000}
                onChange={handlePriceRangeChange}
              />
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Rating</h3>
              <div className="rating rating-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <input
                    key={star}
                    type="radio"
                    name="rating"
                    className={`mask mask-star-2 ${ratingFilter >= star ? 'bg-yellow-400' : 'bg-base-400'}`}
                    aria-label={`${star} star`}
                    checked={ratingFilter === star}
                    onChange={() => handleRatingChange(star)}
                  />
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Search</h3>
              <label className="input input-bordered flex items-center gap-2">
                <FiSearch className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="grow"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </label>
            </div>

            {/* Restore Filters Button */}
            <button 
              onClick={restoreFilters}
              className="btn btn-outline w-full flex items-center gap-2"
            >
              <MdRefresh /> Reset Filters
            </button>
          </div>
        </motion.div>

        {/* Mobile Filters - Slide in */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 w-80 p-6 bg-base-100 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiFilter className="text-primary" /> 
                  Filters
                </h2>
                <button 
                  onClick={() => setIsFiltersOpen(false)}
                  className="btn btn-circle btn-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-8">
                {/* Same filter content as desktop */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Price Range</h3>
                  <PriceRangeSlider
                    ref={priceRangeSliderRef}
                    min={0.01}
                    max={5000}
                    onChange={handlePriceRangeChange}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Rating</h3>
                  <div className="rating rating-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <input
                        key={star}
                        type="radio"
                        name="rating"
                        className={`mask mask-star-2 ${ratingFilter >= star ? 'bg-yellow-400' : 'bg-base-400'}`}
                        aria-label={`${star} star`}
                        checked={ratingFilter === star}
                        onChange={() => handleRatingChange(star)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Search</h3>
                  <label className="input input-bordered flex items-center gap-2">
                    <FiSearch className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="grow"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </label>
                </div>

                <button 
                  onClick={restoreFilters}
                  className="btn btn-outline w-full flex items-center gap-2"
                >
                  <MdRefresh /> Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-grow">
          {/* Create Product Button - Desktop */}
          {loggedIn && id === "all" && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:block mb-8"
            >
              <button 
                onClick={() => setIsCreateModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <MdAdd /> Create Product
              </button>
            </motion.div>
          )}

          {/* Products Grid or Skeleton Loader */}
          {isLoading ? (
            <>
              {id === "all" && <ActualSkeletonLoader />}
              <SkeletonLoader />
            </>
          ) : (
            <>
              {id === "all" && (
                <Actual categories={actualCategories} hotProducts={hotProducts} />
              )}

              {filteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl mb-7">
                    {paginatedProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                      >
                        <div className="card bg-base-100 shadow-sm hover:shadow-lg transition-all rounded-xl overflow-hidden h-full flex flex-col group relative">
                          {/* Add to Cart Button (floating) */}
                          <motion.button 
                            className="absolute top-2 right-2 z-10 btn btn-circle btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(product);
                            }}
                            aria-label="Add to cart"
                          >
                            <BsCartPlus />
                          </motion.button>
                      
                          <Link href={`/products/${product.id}`}>
                            <div className="h-full flex flex-col">
                              <figure className="relative aspect-square">
                                {product.avatar ? (
                                  <img
                                    src={product.avatar}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
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
                                          name={`categoriesRating-${product.id}`}
                                          className={`mask mask-star-2 ${i < product.rating! ? 'bg-yellow-400' : 'bg-base-400'}`}
                                          checked={i === product.rating! - 1}
                                          readOnly
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-gray-500">({product.ratingQuantity})</span>
                                  </div>
                                  <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    &euro; {product.price}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
                                <div className="mt-auto pt-2 flex gap-2">
                                  <button className="btn btn-sm btn-primary w-full group-hover:btn-secondary transition-all">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center mt-12"
                    >
                      <div className="join">
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
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-32 h-32 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiSearch size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No products found</h3>
                  <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
                  <button 
                    onClick={restoreFilters}
                    className="btn btn-primary"
                  >
                    Reset Filters
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Product Modal */}
      <AnimatePresence>
        {isCreateModal && (
          <>
            {/* Enhanced Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsCreateModal(false)}
            />
            
            {/* Premium Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                exit={{ y: 20 }}
                className="bg-base-100 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-base-300 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                
                {/* Close Button */}
                <button 
                  onClick={() => setIsCreateModal(false)}
                  className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Modal Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Create New Product
                  </h3>
                  <p className="text-gray-500 mt-1">Fill in the details below</p>
                </div>
                
                {/* Enhanced Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Product Name</span>
                    </label>
                    <div className="relative">
                      <input
                        name="name"
                        value={newProductForm.name || ""}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="e.g. Premium Leather Wallet"
                        className="input input-bordered w-full pl-10 focus:ring-primary"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description Field */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Description</span>
                    </label>
                    <div className="relative">
                      <textarea
                        name="description"
                        value={newProductForm.description || ""}
                        onChange={handleInputChange}
                        placeholder="Brief description of your product"
                        className="textarea textarea-bordered w-full pl-10 h-24 focus:ring-primary"
                        required
                      />
                      <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Field */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Price</span>
                    </label>
                    <div className="relative">
                      <input
                        name="price"
                        value={newProductForm.price || ""}
                        onChange={handleInputChange}
                        type="number"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        className="input input-bordered w-full pl-10 focus:ring-primary p-6"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Category Field */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Category</span>
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={newProductForm.category || ""}
                        onChange={handleInputChange}
                        className="select select-bordered w-full pl-10 focus:ring-primary"
                        required
                      >
                        <option value="" disabled>Select a category</option>
                        {categories.map((category, index) => (
                          <option key={index} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModal(false)}
                      className="btn btn-ghost flex-1 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all"
                    >
                      Create Product
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}