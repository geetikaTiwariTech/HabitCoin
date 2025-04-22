import { useQuery } from "@tanstack/react-query";
import { Badge, ChildBadge, User } from "@shared/schema";
//import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BadgeIcon from "@/components/badge-icon";
import { useState, useEffect } from "react";

export default function ChildBadges() {
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
  // Get badges and child's earned badges
  // Get badges data
  const { data: badges, isLoading: isLoadingBadges } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch("/api/badges", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
  });

  // Get child's earned badges
  const {
    data: childBadges,
    isLoading: isLoadingChildBadges,
  } = useQuery<(ChildBadge & { badge?: Badge })[]>({
    queryKey: ["/api/child-badges", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/child-badges/${user!.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch child badges");
      return res.json();
    },
  });
  
  // Helper function to check if a badge is earned
  const isBadgeEarned = (badgeId: number) => {
    return childBadges?.some(cb => cb.badgeId === badgeId);
  };
  
  // Helper function to get badge earned date
  const getBadgeEarnedDate = (badgeId: number) => {
    const childBadge = childBadges?.find(cb => cb.badgeId === badgeId);
    return childBadge ? new Date(childBadge.dateEarned).toLocaleDateString() : null;
  };
  
  // Create placeholder badges if none are available
  const placeholderBadges = [
    {
      id: 1,
      name: "Reading Pro",
      description: "Read a book every day for 5 days in a row",
      icon: "book",
      requiredDays: 5,
      activityType: "reading",
      parentId: 0,
      earned: true,
      earnedDate: "2023-05-15"
    },
    {
      id: 2,
      name: "Art Master",
      description: "Complete 10 art projects",
      icon: "brush",
      requiredDays: 10,
      activityType: "art",
      parentId: 0,
      earned: true,
      earnedDate: "2023-06-20"
    },
    {
      id: 3,
      name: "Homework Hero",
      description: "Complete homework for 10 days straight",
      icon: "award",
      requiredDays: 10,
      activityType: "homework",
      parentId: 0,
      earned: false
    },
    {
      id: 4,
      name: "Tidy Champion",
      description: "Clean your room for 10 days in a row",
      icon: "home",
      requiredDays: 10,
      activityType: "cleaning",
      parentId: 0,
      earned: false
    },
    {
      id: 5,
      name: "Helper Star",
      description: "Help with house chores 15 times",
      icon: "star",
      requiredDays: 15,
      activityType: "helping",
      parentId: 0,
      earned: false
    },
    {
      id: 6,
      name: "Exercise Explorer",
      description: "Complete 20 exercise activities",
      icon: "activity",
      requiredDays: 20,
      activityType: "exercise",
      parentId: 0,
      earned: false
    }
  ];
  
  // Determine which badges to display (real badges or placeholders)
  const displayBadges = badges && badges.length > 0 
    ? badges.map(badge => ({
        ...badge,
        earned: isBadgeEarned(badge.id),
        earnedDate: getBadgeEarnedDate(badge.id)
      }))
    : placeholderBadges;
  
  // Separate badges into earned and unearned
  const earnedBadges = displayBadges.filter(badge => badge.earned);
  const unearnedBadges = displayBadges.filter(badge => !badge.earned);

  if (isLoadingBadges || isLoadingChildBadges) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Badges</h2>
        <p className="text-gray-600">Collect badges by completing streaks and achievements</p>
      </div>
      
      {/* Earned Badges */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Earned Badges</CardTitle>
        </CardHeader>
        <CardContent>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {earnedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={true}
                  earnedDate={badge.earnedDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't earned any badges yet. Complete streaks to earn badges!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Badges to Earn */}
      <Card>
        <CardHeader>
          <CardTitle>Badges to Earn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {unearnedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                earned={false}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BadgeCardProps {
  badge: Badge & { earned?: boolean; earnedDate?: string | null };
  earned: boolean;
  earnedDate?: string | null;
}

function BadgeCard({ badge, earned, earnedDate }: BadgeCardProps) {
  return (
    <div className={`flex flex-col items-center p-4 rounded-lg border ${earned ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
      <BadgeIcon 
        icon={badge.icon} 
        color={earned ? "primary" : "muted"} 
        size="lg"
        locked={!earned}
      />
      <h3 className="font-medium text-center mt-2">{badge.name}</h3>
      <p className="text-xs text-gray-600 text-center mt-1">{badge.description}</p>
      
      {earned && earnedDate && (
        <div className="text-xs text-primary font-medium mt-2">
          Earned on {earnedDate}
        </div>
      )}
      
      {!earned && (
        <div className="text-xs text-gray-500 mt-2 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Required: {badge.requiredDays} days</span>
        </div>
      )}
    </div>
  );
}
