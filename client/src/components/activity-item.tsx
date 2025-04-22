import { Activity } from "@shared/schema";
import { Plus, Minus } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  // Format date relative to now
  const formatRelativeTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays} days ago`;
    }
    
    // Format as date for older activities
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="flex items-start p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
      <div className={`p-2 rounded-full ${
        activity.points > 0 
          ? 'bg-green-100 text-green-500' 
          : 'bg-red-100 text-red-500'
      }`}>
        {activity.points > 0 ? (
          <Plus className="h-4 w-4" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </div>
      <div className="ml-3 flex-grow">
        <div className="flex justify-between">
          <p className="text-gray-800 font-medium">{activity.description}</p>
          <span className={`font-semibold ${
            activity.points > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {activity.points > 0 ? '+' : ''}{activity.points}
          </span>
        </div>
        <p className="text-sm text-gray-500">{formatRelativeTime(activity.date)}</p>
      </div>
    </div>
  );
}
