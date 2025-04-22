import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
export const BASE = import.meta.env.VITE_API_BASE_URL;
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerParentSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.literal("parent"),
});

const registerChildSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.literal("child"),
  parentId: z.number({
    required_error: "Parent ID is required for child accounts",
    invalid_type_error: "Parent ID must be a number",
  }),
  age: z.number({
    required_error: "Age is required",
    invalid_type_error: "Age must be a number", 
  }).int().positive(),
});

export default function AuthPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  // Define forms
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerParentSchema>>({
    resolver: zodResolver(registerParentSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "parent"
    },
  });

  // Handle form submissions
  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      const response = await fetch(`${BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const user = await response.json();
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      
      // Redirect based on role
      window.location.href = user.role === "parent" ? "/" : "/child";
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const onRegisterSubmit = async (data: any) => {
    try {
      // Always register as parent
      const response = await fetch(`${BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'parent'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const user = await response.json();
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
      
      // Redirect based on role
      window.location.href = user.role === "parent" ? "/" : "/child";
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // No need for register type change since we only allow parent registration

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Authentication forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">HabitCoin</CardTitle>
            <CardDescription>Track tasks, earn rewards!</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <div className="mb-4">
                  {/* Child accounts should only be created by parents, not through self-registration */}
                  <div className="flex justify-center mb-2">
                    <Button
                      type="button"
                      variant="default" 
                      className="w-full"
                      disabled={true}
                    >
                      Parent Account
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-1">
                    Child accounts can only be created by parents after logging in
                  </p>
                </div>

                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Child fields are removed since we're only allowing parent registration */}

                    <Button type="submit" className="w-full">
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 p-6 flex flex-col justify-center bg-primary text-white">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Reward Good Behavior</h1>
          <p className="text-xl mb-6">
            HabitCoin helps parents track tasks, assign points, and reward children for positive behavior.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-4 bg-white rounded-full p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                  <path d="M12 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                  <path d="M12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                  <path d="M14 4v4h8v2h-8v4h8v2h-8v4h-2v-4H4v-2h8v-4H4V8h8V4h2z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Track Points</h3>
                <p>Assign points for completed tasks and track progress over time.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mr-4 bg-white rounded-full p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Motivate Children</h3>
                <p>Gamify tasks and chores to make them fun and rewarding.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mr-4 bg-white rounded-full p-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">Redeem Rewards</h3>
                <p>Let children redeem their points for rewards they love.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
