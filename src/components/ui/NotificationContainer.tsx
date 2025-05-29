import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

export default function NotificationContainer() {
  const { notifications } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
} 