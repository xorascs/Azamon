'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoMdInformationCircleOutline,
  IoMdWarning,
  IoMdClose 
} from "react-icons/io";
import { 
  FaRocket, 
  FaRegCheckCircle,
  FaRegTimesCircle
} from 'react-icons/fa';
import { HiOutlineSparkles } from "react-icons/hi2";

export type ToastStatus = 'success' | 'error' | 'info' | 'warning' | 'premium';

export interface ToastNotification {
  id: string;
  status: ToastStatus;
  title?: string;
  message: string;
  duration?: number;
  icon?: React.ReactNode;
  showProgress?: boolean;
}

interface PremiumToastProps {
  notifications: ToastNotification[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onDismiss?: (id: string) => void;
}

const statusConfig = {
  success: {
    icon: <FaRegCheckCircle className="text-emerald-400" />,
    bg: 'bg-gradient-to-br from-emerald-600 to-emerald-800',
    border: 'border-emerald-500/30',
    progress: 'bg-emerald-300',
    accent: 'text-emerald-300'
  },
  error: {
    icon: <FaRegTimesCircle className="text-rose-400" />,
    bg: 'bg-gradient-to-br from-rose-600 to-rose-800',
    border: 'border-rose-500/30',
    progress: 'bg-rose-300',
    accent: 'text-rose-300'
  },
  info: {
    icon: <IoMdInformationCircleOutline className="text-blue-400" />,
    bg: 'bg-gradient-to-br from-blue-600 to-blue-800',
    border: 'border-blue-500/30',
    progress: 'bg-blue-300',
    accent: 'text-blue-300'
  },
  warning: {
    icon: <IoMdWarning className="text-amber-400" />,
    bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
    border: 'border-amber-500/30',
    progress: 'bg-amber-300',
    accent: 'text-amber-300'
  },
  premium: {
    icon: <HiOutlineSparkles className="text-purple-300" />,
    bg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-rose-800',
    border: 'border-pink-500/30',
    progress: 'bg-purple-300',
    accent: 'text-purple-300'
  }
};

export default function PremiumToast({ 
  notifications, 
  position = 'top-right',
  onDismiss
}: PremiumToastProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<ToastNotification[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [startTimes, setStartTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    // Add new notifications and record their start times
    setVisibleNotifications((prev) => {
      const existingIds = new Set(prev.map(n => n.id));
      const newNotifications = notifications.filter(n => !existingIds.has(n.id));
      
      // Record start times for new notifications
      const now = Date.now();
      const newStartTimes = newNotifications.reduce((acc, notif) => {
        acc[notif.id] = now;
        return acc;
      }, {} as Record<string, number>);
      
      setStartTimes(prev => ({ ...prev, ...newStartTimes }));

      return [...prev, ...newNotifications];
    });
  }, [notifications]);

  useEffect(() => {
    // Progress bar animation frame
    let animationFrameId: number;
    let lastUpdateTime = 0;
    const updateInterval = 16; // ~60fps

    const updateProgress = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= updateInterval) {
        lastUpdateTime = timestamp;
        
        setProgress(prev => {
          const newProgress = { ...prev };
          const now = Date.now();
          
          visibleNotifications.forEach(notification => {
            const startTime = startTimes[notification.id] || now;
            const duration = notification.duration || 5000;
            const elapsed = now - startTime;
            const remaining = Math.max(0, duration - elapsed);
            newProgress[notification.id] = (remaining / duration) * 100;
          });

          return newProgress;
        });
      }

      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visibleNotifications, startTimes]);

  useEffect(() => {
    // Auto-dismiss logic
    const timeouts: Record<string, NodeJS.Timeout> = {};

    visibleNotifications.forEach(notification => {
      const duration = notification.duration || 5000;
      
      if (!timeouts[notification.id]) {
        timeouts[notification.id] = setTimeout(() => {
          handleDismiss(notification.id);
        }, duration);
      }
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [visibleNotifications]);

  const handleDismiss = (id: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
    notifications.pop();
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
    setStartTimes(prev => {
      const newStartTimes = { ...prev };
      delete newStartTimes[id];
      return newStartTimes;
    });
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed z-[9999] space-y-3 ${positionClasses[position]}`}>
      <AnimatePresence>
        {visibleNotifications.map((notification) => {
          const config = statusConfig[notification.status] || statusConfig.info;
          
          return (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { type: 'spring', damping: 25, stiffness: 300 }
              }}
              exit={{ 
                opacity: 0, 
                x: position.includes('right') ? 100 : -100,
                transition: { duration: 0.2 } 
              }}
              whileHover={{ scale: 1.02 }}
              className={`
                relative w-80 overflow-hidden rounded-xl shadow-2xl
                ${config.bg} ${config.border} border
                backdrop-blur-sm bg-opacity-90
                text-white
              `}
            >
              {/* Glow effect */}
              <div className={`absolute -inset-1 rounded-xl bg-${notification.status}-500/20 blur-md opacity-70`}></div>
              
              {/* Content */}
              <div className="relative z-10 p-4">
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${config.accent}`}>
                    {notification.icon || config.icon}
                  </div>
                  
                  <div className="flex-1">
                    {notification.title && (
                      <h3 className="font-bold text-lg mb-1">
                        {notification.title}
                      </h3>
                    )}
                    <p className="text-sm opacity-90">
                      {notification.message}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleDismiss(notification.id)}
                    className={`text-lg cursor-pointer opacity-70 hover:opacity-100 transition-opacity ${config.accent}`}
                  >
                    <IoMdClose />
                  </button>
                </div>
                
                {/* Progress bar */}
                {notification.showProgress !== false && (
                  <motion.div 
                    className={`absolute bottom-0 left-0 h-1 ${config.progress}`}
                    style={{ width: `${progress[notification.id] || 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </div>
              
              {/* Special effects for premium toasts */}
              {notification.status === 'premium' && (
                <>
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                  >
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-white"></div>
                    <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-white"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-white"></div>
                  </motion.div>
                  <FaRocket className="absolute -bottom-4 -right-4 text-white/10 text-6xl" />
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}