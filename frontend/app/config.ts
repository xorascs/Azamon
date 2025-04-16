import axios from "axios";
import { Product } from "./products/product.entity";

export const API_BASE_URL = "http://localhost:3001/api";

const decode_token = (): any => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      return payload; 
    } catch (error) {
      return null;
    }
}

export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false; // Prevents execution during SSR
  return decode_token() !== null && window.localStorage ? true : false;
};

export const getUserIdFromToken = (): number | null => {
    const decoded_token = decode_token();
    return decoded_token?.sub ? parseInt(decoded_token.sub.toString()) : null;
};

export const getAccessTokenTime = (): number | null => {
  const decoded_token = decode_token();
  if (!decoded_token?.exp) return null;

  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeLeft = decoded_token.exp - now; // Remaining time in seconds

  return timeLeft > 0 ? timeLeft : null; // Return null if the token is already expired
};

export const isUserOwnerProduct = (product: any): boolean => {
  return product.userId?.toString() === getUserIdFromToken()?.toString();
}

export const isUserOwnerProfile = (profile: any): boolean => { 
  return profile.id.toString() === getUserIdFromToken()?.toString();
}

export const isUserAdmin = (): boolean => {
    const decoded_token = decode_token();
    return decoded_token?.role === "ADMIN" ? true : false;
}

// Fetch cart items
export async function fetchItems(userId: number, item: 'products' | 'cart', setMethod: Function, setError: Function) {
  function mapToProduct(item: any): Product {
    return {
      id: item._id, // Extract `_id` as the product ID
      userId: item._source.userId.toString(), // Convert `userId` to string
      name: item._source.name,
      description: item._source.description,
      price: parseFloat(item._source.price), // Convert price to a number
      category: item._source.category,
      rating: item._source.rating || 0, // Default to 0 if undefined
      ratingQuantity: item._source.ratingQuantity || 0, // Default to 0 if undefined
      avatar: item._source.avatar || undefined, // Use `avatar` if available
    };
  }

  try {
    const config = {
      params: {
        userId: userId,
        items: item
      },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    };

    const response = await axios.get(`${API_BASE_URL}/users/userItems`, config);
    const fetchedItems = response.data;

    const mappedItems = Array.isArray(fetchedItems)
      ? fetchedItems.map(mapToProduct)
      : [];

    setMethod(mappedItems);
  } catch (err) {
    console.error(`Failed to fetch ${item}:`, err);
    setError('Failed to load cart data.');
  }
}