"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RedemptionRequest, Reward, User } from "@shared/schema";

export default function RedeemedRewardsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/user", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    }
    fetchUser();
  }, []);

  const { data: redemptionRequests, isLoading } = useQuery<
    (RedemptionRequest & { reward?: Reward })[]
  >({
    queryKey: ["/api/redemption-requests"],
    enabled: !!user?.id,
  });

  const redeemed = redemptionRequests?.filter(
    (r) => r.status === "approved"
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Redeemed Rewards</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : redeemed && redeemed.length > 0 ? (
        <div className="space-y-4">
          {redeemed.map((request) => (
            <div key={request.id} className="flex items-center p-4 border border-gray-200 rounded-lg">
              <img
                src={request.reward?.imageUrl || "https://via.placeholder.com/120"}
                alt={request.reward?.name || "Reward"}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="ml-4 flex-grow">
                <h3 className="font-medium text-gray-800">{request.reward?.name}</h3>
                <p className="text-sm text-gray-500">
                  Redeemed on {new Date(request.requestDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm">
                Redeemed
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No redeemed rewards yet.</p>
      )}
    </div>
  );
}
