import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  role,
  exact = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  role?: "parent" | "child";
  exact?: boolean;
}) {
  try {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Route>
      );
    }

    if (!user) {
      return (
        <Route path={path}>
          <Redirect to="/auth" />
        </Route>
      );
    }

    if (role && user.role !== role) {
      return (
        <Route path={path}>
          <Redirect to={user.role === "parent" ? "/" : "/child"} />
        </Route>
      );
    }

    // For exact path matching, we need to be careful with the path definition
    const routePath = exact ? path : `${path}/:rest*`;
    
    return <Route path={routePath} component={Component} />;
  } catch (error) {
    console.error("Authentication error in ProtectedRoute:", error);
    // If authentication fails, redirect to auth page
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
}
