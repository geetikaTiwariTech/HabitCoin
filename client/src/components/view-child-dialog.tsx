// components/view-child-dialog.tsx

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { useQuery } from "@tanstack/react-query";
  import { Award } from "lucide-react";
  import BadgeIcon from "@/components/badge-icon";
  interface ViewChildDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    child: {
      id: number;
      name: string;
      age: number;
      username: string;
      imageUrl?: string; // ✅ Add this line
    };
  }
  
  export default function ViewChildDialog({ open, onOpenChange, child }: ViewChildDialogProps) {
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
  
    // Fetch badges
    const { data: badges } = useQuery({
      queryKey: ["/api/child-badges", child.id],
      queryFn: async () => {
        const res = await fetch(`/api/child-badges/${child.id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch badges");
        
        return res.json();
      },
    });
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Child Details</DialogTitle>
          </DialogHeader>
  
          {/* Child Info */}
          <div className="p-1 rounded-lg text-center mb-4">
          {child.imageUrl ? (
            <img
              src={child.imageUrl}
              alt={child.name}
              className="w-32 h-32 mx-auto rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-32 h-32 mx-auto rounded-full bg-cyan-500 text-white flex items-center justify-center text-3xl font-bold shadow-md">
              {child.name.split(" ").map(n => n[0]).join("")}
            </div>

          )}
        
            <h2 className="text-xl font-semibold mt-2">{child.name}</h2>
            <p className="text-sm text-gray-600">Age: {child.age}</p>
          </div>
  
          {/* Rewards Section */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Recent Rewards</h3>
            <div className="grid grid-cols-2 gap-4">
                {childRedemptions.length > 0 ? (
                childRedemptions.map((r: any) => (
                    <div key={r.id} className="bg-white rounded-lg shadow p-3 flex items-center">
                    <img
                        src={r.reward?.imageUrl || "https://via.placeholder.com/60"}
                        className="w-12 h-12 rounded object-cover mr-3"
                        alt={r.reward?.name}
                    />
                    <div>
                        <p className="font-medium">{r.reward?.name || "Reward"}</p>
                        <p className="text-sm text-gray-500">
                        {r.reward?.pointsCost || 0} pts • Status: {r.status}
                        </p>
                    </div>
                    </div>
                ))
                ) : (
                <p className="text-sm text-gray-500 col-span-2">No rewards claimed yet.</p>
                )}
            </div>
           </div>
  
          {/* Badges Section */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Recent Badges</h3>
            <div className="flex flex-wrap gap-3">
              {badges?.length ? (
                badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2 bg-white border border-blue-500 px-3 py-2 rounded-lg shadow-sm">
                    {b.badge?.icon ? (
                      <div className="text-4xl">{b.badge.icon}</div>
                    ) : (
                      <Award className="text-yellow-500" size={20} />
                    )}
                    <span className="text-sm font-medium text-gray-700">{b.badge?.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No badges earned yet.</p>
              )}
            </div>
          </div>

  
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  