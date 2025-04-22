import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Activity } from "@shared/schema";
import { Loader2, Plus, Filter, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddPointsDialog from "@/components/add-points-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";


export default function ParentPoints() {
  const [addPointsOpen, setAddPointsOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const queryClient = useQueryClient();


  // Fetch children data
  const { data: children, isLoading: isLoadingChildren } = useQuery<User[]>({
    queryKey: ["/api/children"],
  });

  // Helper function to get all child IDs
  const getAllChildIds = () => {
    if (!children) return [];
    return children.map(child => child.id);
  };
  
  // Determine which child IDs to fetch activities for
  const childIdsToFetch = selectedChildId === "all" 
    ? getAllChildIds() 
    : [parseInt(selectedChildId)];

  // Fetch activities for each child
  const activitiesQueries = useQuery<{[key: number]: Activity[]}>({
    queryKey: ["/api/activities", "multiple", childIdsToFetch],
    enabled: childIdsToFetch.length > 0,
    queryFn: async () => {
      const results: {[key: number]: Activity[]} = {};
      await Promise.all(
        childIdsToFetch.map(async (childId) => {
          const response = await fetch(`/api/activities/${childId}`);
          if (!response.ok) throw new Error('Failed to fetch activities');
          results[childId] = await response.json();
        })
      );
      return results;
    }
  });

  // Combine and filter activities
  const getFilteredActivities = () => {
    if (!activitiesQueries.data) return [];
    
    let allActivities: (Activity & {childName?: string})[] = [];
    
    Object.entries(activitiesQueries.data).forEach(([childId, activities]) => {
      const childName = children?.find(c => c.id === parseInt(childId))?.name || 'Unknown';
      allActivities = [
        ...allActivities,
        ...activities.map(activity => ({...activity, childName}))
      ];
    });
    
    // Sort by date (most recent first)
    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter by search query
    if (searchQuery) {
      allActivities = allActivities.filter(activity => 
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.childName?.toLowerCase().includes(searchQuery.toLowerCase())
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
      
      allActivities = allActivities.filter(activity => 
        new Date(activity.date) >= cutoffDate
      );
    }
    
    return allActivities;
  };
  
  const filteredActivities = getFilteredActivities();
  
  // Calculate positive and negative points
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

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoadingChildren || activitiesQueries.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-6 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Points Management</h2>
          <p className="text-gray-600">Assign or deduct points for behaviors and activities</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setAddPointsOpen(true)}>
          Add / Deduct Points
        </Button>
      </div>

      {/* Point Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pointStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Points balance for selected filter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{pointStats.positive}</div>
            <p className="text-xs text-gray-500 mt-1">Positive points awarded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Points Deducted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{pointStats.negative}</div>
            <p className="text-xs text-gray-500 mt-1">Negative points deducted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
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
            
            <div className="flex flex-1 gap-4">
              <div className="w-1/2">
                <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    {children?.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-1/2">
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
          </div>
        </CardContent>
      </Card>

      {/* Activities Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activities Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="positive">Positive</TabsTrigger>
              <TabsTrigger value="negative">Negative</TabsTrigger>
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

      {/* Add Points Dialog */}
      {addPointsOpen && (
        <AddPointsDialog open={addPointsOpen} onOpenChange={(isOpen) => {
          setAddPointsOpen(isOpen);
          if (!isOpen) {
            // Invalidate the query when dialog closes (after adding points)
            queryClient.invalidateQueries({
              queryKey: ["/api/activities", "multiple"],
            });
          }
        }} />
      )}
    </div>
  );
}

interface ActivityItemProps {
  activity: Activity & { childName?: string };
}

function ActivityItem({ activity }: ActivityItemProps) {
  // Format the date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(activity.date));

  return (
    <div className="flex items-start p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
      <div className={`p-2 rounded-full ${activity.points > 0 ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
        {activity.points > 0 ? (
          <Plus className="h-4 w-4" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
          </svg>
        )}
      </div>
      <div className="ml-3 flex-grow">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-800 font-medium">{activity.description}</p>
            {activity.childName && (
              <p className="text-xs text-gray-500">Child: {activity.childName}</p>
            )}
          </div>
          <span className={`font-semibold ${activity.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {activity.points > 0 ? '+' : ''}{activity.points}
          </span>
        </div>
        <p className="text-sm text-gray-500">{formattedDate}</p>
      </div>
    </div>
  );
}
