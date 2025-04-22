import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reward } from "@shared/schema";
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AddRewardDialog from "@/components/add-reward-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function ParentRewards() {
  const { toast } = useToast();
  const [addRewardOpen, setAddRewardOpen] = useState(false);
  const [editReward, setEditReward] = useState<Reward | null>(null);
  const [deleteRewardId, setDeleteRewardId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rewards data
  const { data: rewards, isLoading, isError, refetch: refetchRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const response = await fetch("/api/rewards", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch rewards");
      return response.json();
    },
  });

  // Delete reward mutation
  const deleteRewardMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rewards/${id}`);
    },
    onSuccess: () => {
      refetchRewards(); // 🔄 sync with server
      toast({
        title: "Reward deleted",
        description: "The reward has been deleted successfully.",
      });
      setDeleteRewardId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete reward: ${error.message}`,
        variant: "destructive",
      });
    },
  });


  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteRewardId !== null) {
      deleteRewardMutation.mutate(deleteRewardId);
    }
  };

  // Filter rewards based on search query
  const filteredRewards = rewards?.filter(reward =>
    reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (reward.description && reward.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Separate rewards into global and custom categories
  const globalRewards = filteredRewards.filter(reward => reward.isGlobal);
  const customRewards = filteredRewards.filter(reward => !reward.isGlobal);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-6 container mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Failed to load rewards. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-6 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rewards Catalog</h2>
          <p className="text-gray-600">Manage rewards that children can redeem with their points</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => setAddRewardOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Reward
        </Button>
      </div>

      {/* Search bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rewards..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Rewards */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Custom Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {customRewards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {customRewards.map((reward) => (
                <RewardItem
                  key={reward.id}
                  reward={reward}
                  onEdit={() => setEditReward(reward)}
                  onDelete={() => setDeleteRewardId(reward.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No custom rewards found. Add your first reward!</p>
              <Button className="mt-4" onClick={() => setAddRewardOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Reward
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Global Reward Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {globalRewards.map((reward) => (
              <RewardItem
                key={reward.id}
                reward={reward}
                isGlobal={true}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Reward Dialog */}
      <AddRewardDialog
        open={addRewardOpen || !!editReward}
        onOpenChange={(open) => {
          if (!open) {
            setAddRewardOpen(false);
            setEditReward(null);
          }
        }}
        reward={editReward}
        onRewardAdded={refetchRewards} // ✅ Directly refetch
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteRewardId !== null} onOpenChange={(open) => !open && setDeleteRewardId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reward? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRewardId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteRewardMutation.isPending}>
              {deleteRewardMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RewardItemProps {
  reward: Reward;
  isGlobal?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function RewardItem({ reward, isGlobal = false, onEdit, onDelete }: RewardItemProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
      <div className="relative h-40 bg-gray-100">
        {reward.imageUrl ? (
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Gift className="h-12 w-12" />
          </div>
        )}
        {!isGlobal && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-white bg-opacity-80 hover:bg-white" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 bg-white bg-opacity-80 hover:bg-white" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800">{reward.name}</h3>
        {reward.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{reward.description}</p>
        )}
        <div className="flex items-center text-sm text-gray-600 mt-2 mb-3">
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
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{reward.pointsCost} points</span>
        </div>
      </div>
    </div>
  );
}

function Gift(props: React.SVGProps<SVGSVGElement>) {
  return (
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
      {...props}
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}
