import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Reward } from "@shared/schema";
import { Loader2, Search } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getAmazonProducts } from "@/lib/getAmazonProducts";
const BASE = import.meta.env.VITE_API_BASE_URL;

const rewardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  pointsCost: z.number().int().min(1, "Points cost must be at least 1"),
  isGlobal: z.boolean().default(false),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

interface AddRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward?: Reward | null;
  onRewardAdded?: () => void; // 👈 new prop
}

export default function AddRewardDialog({ open, onOpenChange, reward = null,onRewardAdded  }: AddRewardDialogProps) {
  const { toast } = useToast();
  const isEditing = !!reward;
  const [tab, setTab] = useState("manual");
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: reward?.name || "",
      description: reward?.description || "",
      imageUrl: reward?.imageUrl || "",
      pointsCost: reward?.pointsCost || 50,
      isGlobal: reward?.isGlobal || false,
    },
  });

  const rewardMutation = useMutation({
    mutationFn: async (data: RewardFormValues) => {
      if (isEditing && reward) {
        await apiRequest("PUT", `${BASE}/api/rewards/${reward.id}`, data);
      } else {
        await apiRequest("POST", `${BASE}/api/rewards`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${BASE}/api/rewards`] });
      toast({
        title: isEditing ? "Reward updated" : "Reward added",
        description: isEditing ? "Reward has been updated successfully." : "Reward has been created successfully.",
      });
      onOpenChange(false);
      onRewardAdded?.(); // 👈 invalidate the rewards list
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} reward: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RewardFormValues) => {
    rewardMutation.mutate(data);
  };

  // const handleAmazonSearch = () => {
  //   if (!searchTerm.trim()) {
  //     toast({ title: "Please enter a search term." });
  //     return;
  //   }
  //   const url = `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}`;
  //   window.open(url, "_blank", "width=1000,height=700");
  // };
  // Inside AddRewardDialog
  const {
    data: amazonResults,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["amazonSearch", searchTerm],
    queryFn: () => getAmazonProducts(searchTerm),
    enabled: false, // Only run on manual trigger
  });

  const handleAmazonSearch = () => {
    if (!searchTerm.trim()) {
      toast({ title: "Please enter a search term." });
      return;
    }
    refetch();
  };

  const handleSelectProduct = (product: any) => {
    form.setValue("name", product.title || "");
    form.setValue("imageUrl", product.thumbnail || "");
    form.setValue("description", product.link || "");
    setTab("manual");
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Reward" : "Add New Reward"}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="search">Amazon</TabsTrigger>
          </TabsList>

          {/* Manual Entry Tab */}
          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reward name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Reward description (optional)"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amazon Product Link or Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Paste Amazon link or image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        You can copy a product link from Amazon or just use an image URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter points cost"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel>Make global</FormLabel>
                        <FormDescription>
                          Visible to all children if checked.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={rewardMutation.isPending}>
                    {rewardMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Update Reward" : "Create Reward"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Amazon Integration Tab */}
          {/* <TabsContent value="search">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Search a product on Amazon, open in a new tab, and paste the product link back in the manual tab.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Search Amazon products"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleAmazonSearch}>
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            </div>
          </TabsContent> */}
          <TabsContent value="search">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Search for a product and click to autofill reward fields.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Search Amazon products"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleAmazonSearch} disabled={isFetching}>
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>

              {amazonResults && amazonResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                  {amazonResults.map((product: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleSelectProduct(product)}
                      className="cursor-pointer border rounded-lg p-2 flex flex-col hover:shadow-md transition"
                    >
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-32 object-contain mb-2"
                      />
                      <div className="text-sm font-medium">{product.title}</div>
                      {product.price?.raw && (
                        <div className="text-xs text-gray-600 mt-1">{product.price.raw}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
