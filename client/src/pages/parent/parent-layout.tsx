import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Award, 
  Gift, 
  BookOpen, 
  BarChart4, 
  Settings, 
  LogOut,
  Menu,
  User,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface ParentLayoutProps {
  children: React.ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  
  // Since we've moved away from the useAuth hook, get the user from props or localStorage
  const [user, setUser] = useState<any>(null);
  
  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  // Navigation items
  const navItems = [
    { 
      path: "/", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      path: "/parent/points", 
      label: "Points", 
      icon: <Award className="h-5 w-5" /> 
    },
    { 
      path: "/parent/rewards", 
      label: "Rewards", 
      icon: <Gift className="h-5 w-5" /> 
    },
    { 
      path: "/parent/rules", 
      label: "Rules", 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      path: "/parent/badges", 
      label: "Badges", 
      icon: <BookOpen className="h-5 w-5" /> 
    },
    { 
      path: "/parent/reports", 
      label: "Reports", 
      icon: <BarChart4 className="h-5 w-5" /> 
    },
  ];

  // Fetch user data on component mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    
    fetchUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account."
        });
        setUser(null); // ← you need this line!
        //navigate('/auth');
        window.location.href = '/auth';
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary">HabitCoin</h1>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a
                      onClick={(e) => {
                        e.preventDefault(); // Prevent default navigation behavior
                        window.location.href = item.path; // Force full page reload
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        (item.path === "/" && location === "/") ||
                        (item.path !== "/" && location.startsWith(item.path))
                          ? "text-white bg-primary"
                          : "text-gray-600 hover:text-primary hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}


                </div>
              </nav>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                      {userInitials}
                    </div>
                    <span className="hidden md:block text-gray-700">{user?.name}</span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mobile Menu Button */}
              <div className="md:hidden ml-3">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <div className="flex flex-col space-y-4 py-4">
                      <h2 className="text-xl font-bold text-primary mb-4">HabitCoin</h2>
                      {navItems.map((item) => (
                        <Link key={item.path} href={item.path}>
                          <a
                            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                              (item.path === "/" && location === "/") || 
                              (item.path !== "/" && location.startsWith(item.path))
                                ? "text-white bg-primary"
                                : "text-gray-600 hover:text-primary hover:bg-gray-100"
                            }`}
                          >
                            {item.icon}
                            <span className="ml-3">{item.label}</span>
                          </a>
                        </Link>
                      ))}
                      <div className="border-t pt-4 mt-4">
                        <Button
                          variant="ghost"
                          className="flex items-center w-full justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
