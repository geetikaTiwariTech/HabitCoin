import { useMutation } from "@tanstack/react-query";
import { Reward } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Form schema for redemption request
const redemptionSchema = z.object({
  note: z.string().optional(),
});

type RedemptionFormValues = z.infer<typeof redemptionSchema>;

interface RequestRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: Reward;
}

export default function RequestRedemptionDialog({ 
  open, 
  onOpenChange,
  reward 
}: RequestRedemptionDialogProps) {
  const { toast } = useToast();
  
  // Form setup
  const form = useForm<RedemptionFormValues>({
    resolver: zodResolver(redemptionSchema),
    defaultValues: {
      note: "",
    },
  });
  
  // Create redemption request mutation
  const redemptionMutation = useMutation({
    mutationFn: async (data: RedemptionFormValues) => {
      await apiRequest("POST", "/api/redemption-requests", {
        rewardId: reward.id,
        note: data.note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/redemption-requests"] });
      
      toast({
        title: "Request submitted",
        description: "Your redemption request has been submitted for approval.",
      });
      
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit redemption request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: RedemptionFormValues) => {
    redemptionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redeem Reward</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center mb-4">
          {reward.imageUrl && (
            <img
              src={reward.imageUrl}
              alt={reward.name}
              className="w-20 h-20 object-cover rounded-md mr-4"
            />
          )}
          <div>
            <h3 className="font-semibold text-lg">{reward.name}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
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
            {reward.description && (
              <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
            )}
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want this reward? (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell your parent why you want this reward..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={redemptionMutation.isPending}>
                {redemptionMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
