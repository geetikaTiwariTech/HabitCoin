import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ParentLayout from "./pages/parent/parent-layout";
import ParentDashboard from "./pages/parent/dashboard";
import ParentPoints from "./pages/parent/points";
import ParentRewards from "./pages/parent/rewards";
import ParentRules from "./pages/parent/rules";
import ParentBadges from "./pages/parent/badges";
import ChildLayout from "./pages/child/child-layout";
import ChildDashboard from "./pages/child/dashboard";
import ChildActivities from "./pages/child/activities";
import ChildRewards from "./pages/child/rewards";
import ChildBadges from "./pages/child/badges";
import RedeemedRewardsPage from "./pages/child/redeemed-rewards";
import ParentReports from "./pages/parent/report";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
const BASE = import.meta.env.VITE_API_BASE_URL;



// Create a protected route component
function ProtectedRoute({ 
  component: Component, 
  role, 
  user, 
  isLoading,
  ...rest 
}: { 
  component: React.ComponentType<any>, 
  role?: "parent" | "child",
  user: any,
  isLoading: boolean,
  path: string,
  exact?: boolean 
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (role && user.role !== role) {
    return <Redirect to={user.role === "parent" ? "/" : "/child"} />;
  }
  
  return <Component {...rest} />;
}

function App() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`${BASE}/api/user`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUser();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/auth">
          {user ? (
            <Redirect to={user.role === "parent" ? "/" : "/child"} />
          ) : (
            <AuthPage />
          )}
        </Route>
        
        {/* Parent routes */}
        <Route path="/">
          <ProtectedRoute 
            component={() => (
              <ParentLayout>
                <ParentDashboard />
              </ParentLayout>
            )} 
            role="parent"
            user={user}
            isLoading={isLoading}
            path="/"
          />
        </Route>
        
        <Route path="/parent/points">
          <ProtectedRoute 
            component={() => (
              <ParentLayout>
                <ParentPoints />
              </ParentLayout>
            )} 
            role="parent"
            user={user}
            isLoading={isLoading}
            path="/parent/points"
          />
        </Route>
        
        <Route path="/parent/rewards">
          <ProtectedRoute 
            component={() => (
              <ParentLayout>
                <ParentRewards />
              </ParentLayout>
            )} 
            role="parent"
            user={user}
            isLoading={isLoading}
            path="/parent/rewards"
          />
        </Route>
        
        <Route path="/parent/rules">
          <ProtectedRoute 
            component={() => (
              <ParentLayout>
                <ParentRules />
              </ParentLayout>
            )} 
            role="parent"
            user={user}
            isLoading={isLoading}
            path="/parent/rules"
          />
        </Route>

        <Route path="/parent/badges">
          <ProtectedRoute 
            component={() => (
              <ParentLayout>
                <ParentBadges />
              </ParentLayout>
            )} 
            role="parent"
            user={user}
            isLoading={isLoading}
            path="/parent/badges"
          />
        </Route>

        <Route path="/parent/reports">
          <ProtectedRoute 
            component={() => (
              <ParentLayout>
                <ParentReports />
              </ParentLayout>
            )} 
            role="parent"
            user={user}
            isLoading={isLoading}
            path="/parent/badges"
          />
        </Route>
        
        {/* Child routes */}
        <Route path="/child">
          <ProtectedRoute 
            component={() => (
              <ChildLayout>
                <ChildDashboard />
              </ChildLayout>
            )} 
            role="child"
            user={user}
            isLoading={isLoading}
            path="/child"
          />
        </Route>
        
        <Route path="/child/activities">
          <ProtectedRoute 
            component={() => (
              <ChildLayout>
                <ChildActivities />
              </ChildLayout>
            )} 
            role="child"
            user={user}
            isLoading={isLoading}
            path="/child/activities"
          />
        </Route>
        
        <Route path="/child/rewards">
          <ProtectedRoute 
            component={() => (
              <ChildLayout>
                <ChildRewards />
              </ChildLayout>
            )} 
            role="child"
            user={user}
            isLoading={isLoading}
            path="/child/rewards"
          />
        </Route>
        
        <Route path="/child/badges">
          <ProtectedRoute 
            component={() => (
              <ChildLayout>
                <ChildBadges />
              </ChildLayout>
            )} 
            role="child"
            user={user}
            isLoading={isLoading}
            path="/child/badges"
          />
        </Route>

        <Route path="/child/redeemed-rewards">
          <ProtectedRoute 
            component={() => (
              <ChildLayout>
                <RedeemedRewardsPage />
              </ChildLayout>
            )} 
            role="child"
            user={user}
            isLoading={isLoading}
            path="/child/redeemed-rewards"
          />
        </Route>

        {/* Fallback to 404 */}
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
