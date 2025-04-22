import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Rule } from "@shared/schema";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schema for rules
const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  points: z.number().int().min(-100).max(500),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

export default function ParentRules() {
  const { toast } = useToast();
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [deleteRuleId, setDeleteRuleId] = useState<number | null>(null);

  // Fetch rules data
  const { data: rules, isLoading, refetch: refetchRules } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
    queryFn: async () => {
      const response = await fetch("/api/rules", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch rules");
      return response.json();
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (data: RuleFormValues) => {
      if (currentRule) {
        await apiRequest("PUT", `/api/rules/${currentRule.id}`, data);
      } else {
        await apiRequest("POST", "/api/rules", data);
      }
    },
    onSuccess: () => {
      refetchRules(); // 🔄 instant UI update
      toast({
        title: currentRule ? "Rule updated" : "Rule created",
        description: currentRule
          ? "The rule has been updated successfully."
          : "The rule has been created successfully.",
      });
      setIsAddRuleOpen(false);
      setCurrentRule(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${currentRule ? "update" : "create"} rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      refetchRules();
      toast({
        title: "Rule deleted",
        description: "The rule has been deleted successfully.",
      });
      setDeleteRuleId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete rule: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form setup
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      description: "",
      points: 5,
    },
  });

  // Handler to edit a rule
  const handleEditRule = (rule: Rule) => {
    setCurrentRule(rule);
    form.reset({
      name: rule.name,
      description: rule.description,
      points: rule.points,
    });
    setIsAddRuleOpen(true);
  };

  // Handler for form submission
  const onSubmit = (data: RuleFormValues) => {
    createRuleMutation.mutate(data);
  };

  // Handler to open add rule dialog
  const handleAddRule = () => {
    setCurrentRule(null);
    form.reset({
      name: "",
      description: "",
      points: 5,
    });
    setIsAddRuleOpen(true);
  };

  // Handler for delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteRuleId !== null) {
      deleteRuleMutation.mutate(deleteRuleId);
    }
  };

  // Separate rules into positive and negative categories
  const positiveRules = rules?.filter((rule) => rule.points > 0) || [];
  const negativeRules = rules?.filter((rule) => rule.points <= 0) || [];

  if (isLoading) {
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
          <h2 className="text-2xl font-bold text-gray-900">Behavior Rules</h2>
          <p className="text-gray-600">Create rules for awarding or deducting points</p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={handleAddRule}>
          <Plus className="h-4 w-4 mr-2" /> Add Rule
        </Button>
      </div>

      {/* Rules Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Rules</TabsTrigger>
              <TabsTrigger value="positive">Positive</TabsTrigger>
              <TabsTrigger value="negative">Negative</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {rules && rules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rules.map((rule) => (
                    <RuleCard 
                      key={rule.id} 
                      rule={rule} 
                      onEdit={handleEditRule}
                      onDelete={() => setDeleteRuleId(rule.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No rules found. Add your first rule!</p>
                  <Button className="mt-4" onClick={handleAddRule}>
                    <Plus className="h-4 w-4 mr-2" /> Add Rule
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="positive">
              {positiveRules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positiveRules.map((rule) => (
                    <RuleCard 
                      key={rule.id} 
                      rule={rule} 
                      onEdit={handleEditRule}
                      onDelete={() => setDeleteRuleId(rule.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No positive rules found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="negative">
              {negativeRules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {negativeRules.map((rule) => (
                    <RuleCard 
                      key={rule.id} 
                      rule={rule} 
                      onEdit={handleEditRule}
                      onDelete={() => setDeleteRuleId(rule.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No negative rules found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Rule Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Complete homework" {...field} />
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
                        placeholder="Describe the rule and conditions..." 
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
                        placeholder="Points value" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddRuleOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {currentRule ? "Update Rule" : "Create Rule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteRuleId !== null} onOpenChange={(open) => !open && setDeleteRuleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRuleId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteRuleMutation.isPending}>
              {deleteRuleMutation.isPending ? (
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

interface RuleCardProps {
  rule: Rule;
  onEdit: (rule: Rule) => void;
  onDelete: () => void;
}

function RuleCard({ rule, onEdit, onDelete }: RuleCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${rule.points > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-800">{rule.name}</h3>
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${
            rule.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {rule.points > 0 ? '+' : ''}{rule.points} points
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 mb-4">{rule.description}</p>
        <div className="flex justify-end space-x-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(rule)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
