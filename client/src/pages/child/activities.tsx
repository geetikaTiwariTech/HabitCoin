import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, User } from "@shared/schema";
//import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ActivityItem from "@/components/activity-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChildActivities() {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  
  // Get child's activities
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities", user?.id],
    enabled: !!user?.id,
  });

  // Filter activities based on search query and time range
  const getFilteredActivities = () => {
    if (!activities) return [];
    
    let filteredActivities = [...activities];
    
    // Sort by date (most recent first)
    filteredActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter by search query
    if (searchQuery) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by time range
    if (timeRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (timeRange === "today") {
        cutoffDate.setHours(0, 0, 0, 0);
      } else if (timeRange === "week") {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeRange === "month") {
        cutoffDate.setMonth(now.getMonth() - 1);
      }
      
      filteredActivities = filteredActivities.filter(activity => 
        new Date(activity.date) >= cutoffDate
      );
    }
    
    return filteredActivities;
  };
  
  const filteredActivities = getFilteredActivities();
  
  // Calculate points totals
  const calculatePointStats = () => {
    let positive = 0;
    let negative = 0;
    
    filteredActivities.forEach(activity => {
      if (activity.points > 0) {
        positive += activity.points;
      } else {
        negative += activity.points;
      }
    });
    
    return { positive, negative, total: positive + negative };
  };
  
  const pointStats = calculatePointStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Activities</h2>
        <p className="text-gray-600">Track your points and achievements</p>
      </div>

      {/* Point Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white">
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full p-3 bg-blue-100 text-primary mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold">{user?.totalPoints || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full p-3 bg-green-100 text-green-500 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Earned (Selected Period)</p>
              <p className="text-2xl font-bold text-green-500">+{pointStats.positive}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6 flex items-center">
            <div className="rounded-full p-3 bg-red-100 text-red-500 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 15 6-6 6 6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lost (Selected Period)</p>
              <p className="text-2xl font-bold text-red-500">{pointStats.negative}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="positive">Earned</TabsTrigger>
              <TabsTrigger value="negative">Lost</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="space-y-4">
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No activities found</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="positive">
              <div className="space-y-4">
                {filteredActivities.filter(a => a.points > 0).length > 0 ? (
                  filteredActivities
                    .filter(a => a.points > 0)
                    .map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No positive activities found</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="negative">
              <div className="space-y-4">
                {filteredActivities.filter(a => a.points < 0).length > 0 ? (
                  filteredActivities
                    .filter(a => a.points < 0)
                    .map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No negative activities found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
