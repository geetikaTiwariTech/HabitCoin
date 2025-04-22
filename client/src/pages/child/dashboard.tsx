import { useQuery } from "@tanstack/react-query";
import { Activity, Badge, ChildBadge, User } from "@shared/schema";
//import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PointCircle from "@/components/point-circle";
import ProgressBar from "@/components/progress-bar";
import BadgeIcon from "@/components/badge-icon";
import ActivityItem from "@/components/activity-item";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function ChildDashboard() {
  //const { user } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  
  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    
    fetchUser();
  }, []);
  
  // Get child's activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities", user?.id],
    enabled: !!user?.id,
  });
  
  // Get child's badges
  const { 
    data: childBadges, 
    isLoading: isLoadingBadges 
  } = useQuery<(ChildBadge & { badge?: Badge })[]>({
    queryKey: ["/api/child-badges", user?.id],
    enabled: !!user?.id,
  });
  
  // Mock data for streaks (would come from API in real implementation)
  const streaks = [
    {
      name: "Homework Streak",
      current: 8,
      target: 10,
      progress: 80,
      remaining: "2 more days for Homework Hero badge!"
    },
    {
      name: "Room Cleaning",
      current: 3,
      target: 10,
      progress: 30,
      remaining: "7 more days for Tidy Champion badge!"
    }
  ];
  
  // Calculate next reward threshold (simplified version)
  const calculateNextRewardThreshold = () => {
    if (!user?.totalPoints) return { current: 0, target: 100, progress: 0 };
    
    // Simple logic: next threshold is in increments of 50
    const target = Math.ceil(user.totalPoints / 50) * 50 + 50;
    const current = user.totalPoints;
    const progress = (current % 50) / 50 * 100;
    const pointsNeeded = target - current;
    
    return { current, target, progress, pointsNeeded };
  };
  
  const rewardProgress = calculateNextRewardThreshold();
  
  // Get recent activities
  const recentActivities = activities?.slice(0, 4) || [];
  
  // Get recent badges
  const recentBadges = childBadges?.slice(0, 3) || [];
  
  if (isLoadingActivities || isLoadingBadges) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Progress Circle */}
      <Card className="mb-6">
        <CardContent className="p-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Progress</h2>
          
          <div className="mb-4">
            <PointCircle 
              percentage={rewardProgress.progress} 
              size={180} 
              strokeWidth={12}
            />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">
              You need <span className="font-semibold text-primary">{rewardProgress.pointsNeeded}</span> more points for your next reward!
            </p>
            <Link href="/child/rewards">
              <Button className="mt-4 bg-primary hover:bg-primary-dark text-white rounded-full">
                View Rewards
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Streak & Badges Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Streaks Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Current Streaks</h3>
            
            <div className="space-y-4">
              {streaks.map((streak, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{streak.name}</span>
                    <span className="text-sm text-primary font-medium">{streak.current} days</span>
                  </div>
                  <ProgressBar 
                    progress={streak.progress} 
                    className="bg-primary h-2.5 rounded-full" 
                  />
                  <p className="text-xs text-gray-500 mt-1">{streak.remaining}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Badges Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Recent Badges</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {recentBadges.length > 0 ? (
                recentBadges.map((childBadge, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <BadgeIcon 
                      icon={childBadge.badge?.icon || "award"} 
                      color="accent" 
                    />
                    <span className="text-xs text-center mt-2 text-gray-700">
                      {childBadge.badge?.name || "Badge"}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <BadgeIcon icon="book" color="accent" />
                    <span className="text-xs text-center mt-2 text-gray-700">Reading Pro</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <BadgeIcon icon="brush" color="success" />
                    <span className="text-xs text-center mt-2 text-gray-700">Art Master</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <span className="text-xs text-center mt-2 text-gray-500">Locked</span>
                  </div>
                </>
              )}
            </div>
            
            <Link href="/child/badges">
              <Button variant="outline" className="w-full mt-4">
                View All Badges
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activities */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activities</h3>
          
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent activities yet.</p>
            )}
          </div>
          
          <Link href="/child/activities">
            <Button variant="outline" className="w-full mt-4">
              View All Activities
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
