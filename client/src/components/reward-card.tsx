import { Reward } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: () => void;
}

export default function RewardCard({ reward, userPoints, onRedeem }: RewardCardProps) {
  const canRedeem = userPoints >= reward.pointsCost;
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
      {reward.imageUrl ? (
        <img
          src={reward.imageUrl}
          alt={reward.name}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
          <GiftIcon className="h-12 w-12" />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-800">{reward.name}</h3>
        {reward.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{reward.description}</p>
        )}
        <div className="flex items-center text-sm text-gray-600 mt-1 mb-3">
          <CoinIcon className="mr-1 text-amber-500" />
          <span>{reward.pointsCost} points</span>
          {!canRedeem && (
            <span className="ml-1 text-xs text-red-500">
              ({reward.pointsCost - userPoints} more needed)
            </span>
          )}
        </div>
        
        <Button 
          onClick={onRedeem} 
          className="w-full"
          disabled={!canRedeem}
        >
          Redeem
        </Button>
      </div>
    </div>
  );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
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

function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
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
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
