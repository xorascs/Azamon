// hooks/useWebSocket.ts
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_WS_URL as string;
const default_on = [
  "error", 
  "authRegister",
  "createUsers", "editUsers", "deleteUsers", "updateAvatarUsers", "addToCart", "removeFromCart",
  "productsCreate", "productsEdit", "productsDelete", "updateAvatarProducts", 
  "categoriesCreate", "categoriesDelete", "updateAvatarCategories",
  "ratingsCreate", "ratingsDelete",
  "promosCreate", "promosDelete",
  "paymentsStatusUpdateSender", "paymentsStatusUpdateReceiver", "paymentsDelete", "paymentsConfirm",
]

export default function useWebSocket(onNotification: (status: string, message: string) => void) {
  const [notificationToken, setNotificationToken] = useState<string>();

  async function fetchToken() {
    const token = localStorage.getItem('notifications_token');

    if (token !== undefined && token !== null) {
      setNotificationToken(token);
    } else {
      const randomToken = generateRandomToken();
      localStorage.setItem('notifications_token', randomToken);
      setNotificationToken(randomToken);
    }
  }

  function generateRandomToken(length = 32) {
    let randomBytes;

    if (typeof window === 'undefined') {
      // Node.js environment
      const crypto = require('crypto');
      randomBytes = crypto.randomBytes(length);
    } else {
      // Browser environment
      randomBytes = new Uint8Array(length);
      window.crypto.getRandomValues(randomBytes);
    }

    // Convert the byte array to a Base64 string
    let base64Token;
    if (typeof Buffer !== 'undefined') {
      // Node.js: Use Buffer for Base64 encoding
      base64Token = Buffer.from(randomBytes).toString('base64');
    } else {
      // Browser: Use btoa for Base64 encoding
      base64Token = btoa(String.fromCharCode(...randomBytes));
    }

    // Make the token URL-safe
    const urlSafeToken = base64Token.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return urlSafeToken;
  }

  // Fetch the IP address on component mount
  useEffect(() => {
    fetchToken();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Establish WebSocket connection after `userIp` is set
  useEffect(() => {
    if (!notificationToken || !SOCKET_SERVER_URL) {
      return;
    }

    const socket = io(SOCKET_SERVER_URL, {
      query: { notificationToken },
    });

    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket Connection Error:", error);
    });

    socket.on("authLogin", (data) => {
      const { status, response, userLogin, accessToken, refreshToken } = data;
      if (status === "success") {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("user_login", userLogin);
        
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }

      onNotification(status, response);
    });

    socket.on("promosCheck", (data) => {
      const { status, response, fee, name } = data;
      onNotification(status, response);

      if (status === "success") {
        localStorage.setItem("promo_name", name);
        localStorage.setItem("promo_fee", fee);
      }
    })

    for (const def of default_on) {
      socket.on(def, (data) => {
        const { status, response } = data;
        onNotification(status, response);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [notificationToken, onNotification]); // Only re-run when `notificationToken` or `onNotification` changes
}