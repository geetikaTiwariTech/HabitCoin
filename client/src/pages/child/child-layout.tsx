import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Calendar, 
  Gift, 
  Award, 
  LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  
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
      path: "/child", 
      label: "Dashboard", 
      icon: <LayoutDashboard className="text-xl" /> 
    },
    { 
      path: "/child/activities", 
      label: "Activities", 
      icon: <Calendar className="text-xl" /> 
    },
    { 
      path: "/child/rewards", 
      label: "Rewards", 
      icon: <Gift className="text-xl" /> 
    },
    { 
      path: "/child/badges", 
      label: "Badges", 
      icon: <Award className="text-xl" /> 
    },
  ];

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
        //navigate('/auth');
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

  // Determine if a nav item is active
  const isActive = (path: string) => {
    if (path === "/child" && location === "/child") return true;
    if (path !== "/child" && location.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">HabitCoin</h1>
              <div className="ml-4 bg-white bg-opacity-20 rounded-full px-3 py-1 text-white text-sm">
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
                  className="inline-block mr-1"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{user?.totalPoints || 0}</span> Available Points
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="mr-4">
                <span className="text-white text-sm font-medium">Hi, {user?.name || "Friend"}!</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary font-bold">
                {userInitials}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-primary pb-6 pt-2">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-xl p-4 shadow-md flex items-center justify-between">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`flex flex-col items-center ${
                  isActive(item.path) 
                    ? "text-primary" 
                    : "text-gray-500 hover:text-primary"
                }`}>
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50 min-h-screen">
        {children}
      </main>
      
      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
        <div className="flex justify-around">
          <button 
            onClick={handleLogout}
            className="py-3 flex flex-col items-center justify-center text-gray-500 hover:text-primary"
          >
            <LogOut className="text-xl" />
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
