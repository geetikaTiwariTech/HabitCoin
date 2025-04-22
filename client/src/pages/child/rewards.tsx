import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Reward, RedemptionRequest } from "@shared/schema";
//import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RewardCard from "@/components/reward-card";
import RequestRedemptionDialog from "@/components/request-redemption-dialog";
import { useToast } from "@/hooks/use-toast";

import { User } from "@shared/schema";

export default function ChildRewards() {
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
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  
  // Get available rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: !!user?.id,
  });
  
  // Get pending redemption requests
  const { 
    data: redemptionRequests, 
    isLoading: isLoadingRequests 
  } = useQuery<(RedemptionRequest & { reward?: Reward })[]>({
    queryKey: ["/api/redemption-requests"],
    enabled: !!user?.id,
  });
  
  // Filter rewards based on search query
  const filteredRewards = rewards?.filter(reward =>
    reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reward.description && reward.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Get pending rewards
  const pendingRewards = redemptionRequests?.filter(
    request => request.status === "pending"
  ) || [];

  // Handle reward selection for redemption request
  const handleRewardSelect = (reward: Reward) => {
    // Check if user has enough points
    if (user && user.totalPoints < reward.pointsCost) {
      toast({
        title: "Not enough points",
        description: `You need ${reward.pointsCost - user.totalPoints} more points to redeem this reward.`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedReward(reward);
  };

  if (isLoadingRewards || isLoadingRequests) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Reward Shop */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <CardTitle>Reward Shop</CardTitle>
            
            <div className="flex items-center text-primary">
            <a href="/child/redeemed-rewards" className="text-sm text-blue-600 hover:underline ml-auto"> View Redeemed Rewards </a>  
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="mb-6">
            <div className="flex relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rewards..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Rewards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.length > 0 ? (
              filteredRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={user?.totalPoints || 0}
                  onRedeem={() => handleRewardSelect(reward)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No rewards found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Pending Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRewards.length > 0 ? (
            <div className="space-y-4">
              {pendingRewards.map((request) => (
                <div key={request.id} className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <img
                    src={request.reward?.imageUrl || "https://via.placeholder.com/120"}
                    alt={request.reward?.name || "Reward"}
                    className="w-16 h-16 object-cover rounded"
                  />
                  
                  <div className="ml-4 flex-grow">
                    <h3 className="font-medium text-gray-800">{request.reward?.name || "Unknown Reward"}</h3>
                    <p className="text-sm text-gray-500">
                      Requested {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-sm">
                    Pending
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending rewards</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Redemption Dialog */}
      {selectedReward && (
        <RequestRedemptionDialog
          open={!!selectedReward}
          onOpenChange={(open) => !open && setSelectedReward(null)}
          reward={selectedReward}
        />
      )}
    </div>
  );
}
