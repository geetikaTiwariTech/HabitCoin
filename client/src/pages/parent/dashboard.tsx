import { useQuery } from "@tanstack/react-query";
import { User, Activity, RedemptionRequest } from "@shared/schema";
import { Loader2, UserPlus, Award, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
//import AddChildDialog from "@/components/add-child-dialog";
import ChildDialog  from "@/components/child-dialog";
import ViewChildDialog from "@/components/view-child-dialog";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function ParentDashboard() {
  const { toast } = useToast();
  const [addChildOpen, setAddChildOpen] = useState(false);
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

  // Fetch children data
  const { data: children, isLoading: isLoadingChildren, refetch: refetchChildren } = useQuery<User[]>({
    queryKey: ["/api/children"],
  });

  // Fetch pending redemption requests
  const { data: redemptionRequests, isLoading: isLoadingRequests } = useQuery<
    (RedemptionRequest & { reward?: any })[]
  >({
    queryKey: ["/api/redemption-requests"],
  });

  // Handle approval/rejection of redemption requests
  const handleRequestAction = async (id: number, status: "approved" | "rejected") => {
    try {
      await apiRequest("PUT", `/api/redemption-requests/${id}`, { status });
      
      toast({
        title: `Request ${status}`,
        description: `The request has been ${status} successfully.`,
        variant: status === "approved" ? "default" : "destructive",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/redemption-requests"] });
    } catch (error) {
      toast({
        title: "Action failed",
        description: `Failed to ${status} the request. Please try again.`,
        variant: "destructive",
      });
    }
  };

  if (isLoadingChildren || isLoadingRequests) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = redemptionRequests?.filter(
    (request) => request.status === "pending"
  ) || [];

  
  return (
    <div className="py-6 container mx-auto px-4 sm:px-6 lg:px-8">
      {/* <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Parent Dashboard</h2>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div> */}

      {/* Children Overview */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Children Overview</h3>
          <Button onClick={() => setAddChildOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Add Child
          </Button>
        </div>

        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} refetchChildren={refetchChildren} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No children added yet. Add your first child to get started!</p>
              <Button className="mt-4" onClick={() => setAddChildOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Child
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Approvals */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Pending Approvals</h3>

        {pendingRequests.length > 0 ? (
          <Card>
            <CardContent className="p-0 divide-y">
              {pendingRequests.map((request) => (
                <RedemptionRequestCard
                  key={request.id}
                  request={request}
                  onApprove={() => handleRequestAction(request.id, "approved")}
                  onReject={() => handleRequestAction(request.id, "rejected")}
                  childName={
                    children?.find((child) => child.id === request.childId)?.name || "Unknown"
                  }
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No pending redemption requests.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Child Dialog */}
      {/* <AddChildDialog open={addChildOpen} onOpenChange={setAddChildOpen} /> */}
      <ChildDialog open={addChildOpen} onOpenChange={setAddChildOpen} mode="add" onSuccess={refetchChildren}/>
    </div>
  );
}

interface ChildCardProps {
  child: User;
  refetchChildren: () => void; // ✅ Add this
}

function ChildCard({ child, refetchChildren }: ChildCardProps) {
  const [addPointsOpen, setAddPointsOpen] = useState(false);
  const [location, navigate] = useLocation();
  const [editOpen, setEditOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false);

  // Fetch child's activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities", child.id],
    queryFn: async () => {
      const response = await fetch(`/api/activities/${child.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
  });
  
  // Get recent activities
  const recentActivities = activities?.slice(0, 2) || [];

  // Helper function to get relative time
  function getRelativeTime(dateString: string | Date) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  }

  // Calculate child initials
  const initials = child.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Calculate weekly points
  const weeklyPoints = recentActivities
    .filter(activity => {
      const date = new Date(activity.date);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffInDays <= 7;
    })
    .reduce((sum, activity) => sum + activity.points, 0);

  // Fetch rewards
  const { data: redemptions } = useQuery({
      queryKey: ["/api/redemption-requests"],
      queryFn: async () => {
      const res = await fetch(`/api/redemption-requests`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch redemption requests");
      return res.json();
      },
  });

  // Filter for this child
  const childRedemptions = redemptions?.filter((r: any) => r.childId === child.id) || [];
  
  // Fetch all child badges for current user
  const { data: childBadges } = useQuery<(ChildBadge & { badge?: Badge })[]>({
    queryKey: ["/api/child-badges", child.id],
    queryFn: async () => {
      const res = await fetch(`/api/child-badges/${child.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch child badges");
      return res.json();
    },
  });

  const earnedBadgesCount = childBadges?.filter((badge) => badge.childId === child.id).length || 0;


  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div className="flex items-center">
          {child.imageUrl ? (
            <img
              src={child.imageUrl}
              alt={child.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
          )}
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-gray-800">{child.name}</h4>
              <p className="text-sm text-gray-500">Age: {child.age}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-sm text-gray-600">Overall</p>
            <p className="text-xl font-semibold text-gray-800">{child.totalPoints || 0}</p>
          </div>

          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-xl font-semibold text-green-500">+{weeklyPoints}</p>
          </div>

          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-sm text-gray-600">Rewards</p>
            <p className="text-xl font-semibold text-gray-800">{childRedemptions?.length || 0}</p>
          </div>

          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-sm text-gray-600">Badges</p>
            <p className="text-xl font-semibold text-yellow-500">
              {earnedBadgesCount}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-600 mb-2">Recent Activities</h5>
          <div className="space-y-2">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center text-sm">
                  <span className={`${activity.points > 0 ? "text-green-500" : "text-red-500"} mr-2`}>
                    {activity.points > 0 ? "+" : ""}
                    {activity.points}
                  </span>
                  <span className="text-gray-800">{activity.description}</span>
                  <span className="ml-auto text-gray-500 text-xs">
                    {getRelativeTime(activity.date)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activities</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <Button className="flex-1 mr-2" onClick={() => navigate("/parent/points")}>
            Manage Points
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/parent/rewards")}>Manage Rewards</Button>
        </div>
        <ChildDialog open={editOpen} onOpenChange={setEditOpen} mode="edit" initialData={{ id: child.id, name: child.name, age: child.age, username: child.username,password:child.password, imageUrl: child.imageUrl}} onSuccess={refetchChildren}/>
        <ViewChildDialog  open={viewOpen} onOpenChange={setViewOpen} child={{ id: child.id, name: child.name, username: child.username, age: child.age, imageUrl: child.imageUrl}}/>

      </CardContent>
    </Card>
  );
}

interface RedemptionRequestCardProps {
  request: RedemptionRequest & { reward?: any };
  childName: string;
  onApprove: () => void;
  onReject: () => void;
}

function RedemptionRequestCard({
  request,
  childName,
  onApprove,
  onReject,
}: RedemptionRequestCardProps) {
  // Calculate child initials
  const initials = childName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Format request date
  function formatRequestDate(dateString: string | Date) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "yesterday";
    if (diffInDays === 2) return "2 days ago";
    return `${diffInDays} days ago`;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold">
            {initials}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-semibold text-gray-800">{childName}</h4>
            <p className="text-sm text-gray-500">Requested {formatRequestDate(request.requestDate)}</p>
          </div>
        </div>
        <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-sm">
          Pending
        </div>
      </div>

      <div className="mt-4 flex items-center">
        <img
          src={request.reward?.imageUrl || "https://via.placeholder.com/120"}
          alt={request.reward?.name || "Reward"}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div className="ml-4">
          <h5 className="font-medium text-gray-800">{request.reward?.name || "Unknown Reward"}</h5>
          <div className="flex items-center text-gray-600 text-sm mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 text-amber-500"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>{request.reward?.pointsCost || 0} points</span>
          </div>
          {request.note && (
            <p className="text-sm text-gray-600 mt-1">
              <strong>Note:</strong> "{request.note}"
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex space-x-3">
        <Button onClick={onApprove} className="bg-green-500 hover:bg-green-600">
          Approve
        </Button>
        <Button variant="outline" onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
