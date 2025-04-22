import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
// Form schema for adding child
const childSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  age: z.number().int().min(1, "Age must be at least 1").max(100, "Age must be at most 100"),
  imageUrl: z.string().optional(),
});

type ChildFormValues = z.infer<typeof childSchema>;

interface ChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "add" | "edit"; // NEW: toggle mode
  initialData?: {
    id: number;
    name: string;
    age: number;
    username: string;
    password: string;
    imageUrl?: string; // ✅ Add this line
  };
  onSuccess?: () => void;
}

export default function ChildDialog({ open, onOpenChange, mode = "add", initialData, onSuccess }: ChildDialogProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl ?? null);

  // Form setup
  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
        username: initialData?.username ?? "",
      password: "",
      name: initialData?.name ?? "",
      age: initialData?.age ?? 10,
    },
  });
  
  // Add child mutation
  const childMutation = useMutation({
    mutationFn: async (data: ChildFormValues) => {
        if (mode === "edit" && initialData?.id) {
            return await apiRequest("PUT", `/api/children/${initialData.id}`, data);
        } else {
            return await apiRequest("POST", "/api/children", data);
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/children"] });
      
      toast({
        title: mode === "edit" ? "Child updated" : "Child added",
        description: `Child account has been ${mode === "edit" ? "updated" : "created"} successfully.`,
      });
      
      onOpenChange(false);
      form.reset();
      onSuccess?.(); // ✅ Refresh parent data
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${mode === "edit" ? "update" : "create"} child account: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: ChildFormValues) => {
    data.imageUrl = imagePreview || "";
    childMutation.mutate(data);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      form.setValue("imageUrl", base64String);
    };
    reader.readAsDataURL(file);
  };
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit Child" : "Add Child"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter child's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter child's age"
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Choose a username for the child" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Profile Photo</FormLabel>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-full mt-2 object-cover" />
              )}
            </FormItem>

            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={childMutation.isPending}>
                {childMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                 {mode === "edit" ? "Save Changes" : "Create Child Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
