import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Rule } from "@shared/schema";
import { Loader2, Plus, Minus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const BASE = import.meta.env.VITE_API_BASE_URL;

// Form schema for adding points
const addPointsSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  points: z.number().int()
});

type AddPointsFormValues = z.infer<typeof addPointsSchema>;

interface AddPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPointsDialog({ open, onOpenChange }: AddPointsDialogProps) {
  const { toast } = useToast();
  const [actionType, setActionType] = useState<"add" | "deduct">("add");
  const [activeTab, setActiveTab] = useState("manual");
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);

  // Fetch children data
  const { data: children, isLoading: isLoadingChildren } = useQuery<User[]>({
    queryKey: [`${BASE}/api/children`],
  });
  
  // Fetch rules
  const { data: rules, isLoading: isLoadingRules } = useQuery<Rule[]>({
    queryKey: [`${BASE}/api/rules`],
  });
  
  // Filter rules based on action type
  const filteredRules = rules?.filter(rule => 
    actionType === "add" ? rule.points > 0 : rule.points < 0
  ) || [];

  // Form setup
  const form = useForm<AddPointsFormValues>({
    resolver: zodResolver(addPointsSchema),
    defaultValues: {
      childId: "",
      description: "",
      points: 5,
      date: new Date()
    },
  });
  
  // Update points value when action type changes
  const handleActionTypeChange = (type: "add" | "deduct") => {
    setActionType(type);
    const currentPoints = Math.abs(form.getValues().points);
    form.setValue("points", type === "add" ? currentPoints : -currentPoints);
  };
  
  // Handle rule selection
  const handleRuleSelect = (rule: Rule) => {
    setSelectedRuleId(rule.id);
    form.setValue("description", rule.name);
    form.setValue("points", rule.points);
  };
  
  // Add points mutation
  const addPointsMutation = useMutation({
    mutationFn: async (data: AddPointsFormValues) => {
      await apiRequest("POST", `${BASE}/api/activities`, {
        childId: parseInt(data.childId),
        description: data.description,
        points: data.points,
        date: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${BASE}/api/activities`] });
      queryClient.invalidateQueries({ queryKey: [`${BASE}/api/children`] });
      
      toast({
        title: "Points updated",
        description: `Successfully ${actionType === "add" ? "added" : "deducted"} points.`,
      });
      
      onOpenChange(false);
      form.reset({
        childId: "",
        description: "",
        points: 5,
      });
    },
    onError: (error) => {
      console.log("Error:::in adding points:"+ error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} points: ${error.message}`,
        variant: "destructive",
      });
      
    },
  });
  
  // Form submission handler
  const onSubmit = (data: AddPointsFormValues) => {
    addPointsMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === "add" ? "Add Points" : "Deduct Points"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center mb-4">
          <div className="flex rounded-md overflow-hidden border">
            <Button
              type="button"
              variant={actionType === "add" ? "default" : "outline"}
              onClick={() => handleActionTypeChange("add")}
              className="rounded-none flex-1"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Points
            </Button>
            <Button
              type="button"
              variant={actionType === "deduct" ? "default" : "outline"}
              onClick={() => handleActionTypeChange("deduct")}
              className="rounded-none flex-1"
            >
              <Minus className="h-4 w-4 mr-2" /> Deduct Points
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="rules">From Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="childId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a child" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingChildren ? (
                            <div className="flex justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : children && children.length > 0 ? (
                            children.map((child) => (
                              <SelectItem key={child.id} value={child.id.toString()}>
                                {child.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              No children found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
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
                          placeholder={`Describe what the points are ${actionType === "add" ? "for" : "being deducted for"}`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value)) return;
                            
                            // Ensure points are positive or negative based on action type
                            const adjustedValue = actionType === "add" 
                              ? Math.abs(value) 
                              : -Math.abs(value);
                            
                            field.onChange(adjustedValue);
                          }}
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
                  <Button type="submit" disabled={addPointsMutation.isPending}>
                    {addPointsMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {actionType === "add" ? "Add Points" : "Deduct Points"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="rules">
            {isLoadingRules ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredRules.length > 0 ? (
              <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2">
                {filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3 border rounded-md cursor-pointer transition 
                      ${selectedRuleId === rule.id 
                        ? "bg-white ring-2 ring-blue-500" 
                        : "hover:bg-gray-50"}`}
                    onClick={() => handleRuleSelect(rule)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{rule.name}</h4>
                      <span className={`font-semibold ${
                        rule.points > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {rule.points > 0 ? '+' : ''}{rule.points}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">
                  No {actionType === "add" ? "positive" : "negative"} rules found. Create rules in the Rules section.
                </p>
              </div>
            )}
            
            {activeTab === "rules" && filteredRules.length > 0 && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="childId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Child</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a child" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingChildren ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : children && children.length > 0 ? (
                              children.map((child) => (
                                <SelectItem key={child.id} value={child.id.toString()}>
                                  {child.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No children found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addPointsMutation.isPending}>
                      {addPointsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Apply Rule
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
