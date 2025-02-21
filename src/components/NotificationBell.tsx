import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../components/ui/hover-card';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications</p>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-2 rounded-lg ${
                    notification.read ? 'bg-muted/50' : 'bg-muted'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="text-sm font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
