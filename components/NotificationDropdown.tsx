"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock, CheckCircle, AlertCircle, Mail, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface UserNotification {
  id: string;
  emailType: string;
  subject: string;
  sentAt: Date | null;
  status: string;
  metadata: string | null;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const NOTIFICATION_TYPE_CONFIG = {
  DUE_TODAY: {
    icon: Clock,
    label: "Due Today",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  OVERDUE: {
    icon: AlertCircle,
    label: "Overdue",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  BORROW_CONFIRMATION: {
    icon: CheckCircle,
    label: "Borrow Confirmed",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  RETURN_CONFIRMATION: {
    icon: CheckCircle,
    label: "Return Confirmed",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  DUE_REMINDER: {
    icon: Clock,
    label: "Due Reminder",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  WELCOME: {
    icon: Mail,
    label: "Welcome",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  default: {
    icon: Mail,
    label: "Notification",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Unknown time";
  
  const now = new Date();
  const diffInMilliseconds = now.getTime() - new Date(date).getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onToggle,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/notifications/user?limit=10');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
      
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationConfig = (emailType: string) => {
    return NOTIFICATION_TYPE_CONFIG[emailType as keyof typeof NOTIFICATION_TYPE_CONFIG] 
           || NOTIFICATION_TYPE_CONFIG.default;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className={cn(
          "relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50",
          isOpen 
            ? "text-amber-600 bg-amber-50" 
            : "text-gray-600 hover:text-amber-500 hover:bg-amber-50"
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        
        {/* Notification Count Badge */}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-sm">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-1">No notifications</p>
                <p className="text-gray-400 text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const config = getNotificationConfig(notification.emailType);
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                          config.bgColor
                        )}>
                          <IconComponent className={cn("w-4 h-4", config.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              config.bgColor,
                              config.color
                            )}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(notification.sentAt)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-900 font-medium text-ellipsis overflow-hidden">
                            {notification.subject}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  // Optional: Navigate to full notifications page
                  onClose();
                }}
                className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium py-1 transition-colors"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;