import { 
  Award, 
  Book, 
  Brush, 
  Star, 
  Home, 
  Clock, 
  Heart, 
  Activity, 
  CheckSquare, 
  Coffee, 
  Smile,
  Lock
} from "lucide-react";

type IconName = 
  | "award" 
  | "book" 
  | "brush" 
  | "star" 
  | "home" 
  | "clock" 
  | "heart" 
  | "activity" 
  | "check" 
  | "coffee" 
  | "smile";

type ColorName = 
  | "primary" 
  | "secondary" 
  | "accent" 
  | "success" 
  | "warning" 
  | "error" 
  | "muted";

interface BadgeIconProps {
  icon: string;
  color?: ColorName;
  size?: "sm" | "md" | "lg";
  locked?: boolean;
}

// Map color names to Tailwind classes
const colorMap: Record<ColorName, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-light bg-opacity-20", text: "text-primary" },
  secondary: { bg: "bg-cyan-100", text: "text-cyan-500" },
  accent: { bg: "bg-pink-100", text: "text-pink-500" },
  success: { bg: "bg-green-100", text: "text-green-500" },
  warning: { bg: "bg-amber-100", text: "text-amber-500" },
  error: { bg: "bg-red-100", text: "text-red-500" },
  muted: { bg: "bg-gray-200", text: "text-gray-400" }
};

// Map size to Tailwind classes
const sizeMap = {
  sm: { container: "w-10 h-10", icon: "text-xl" },
  md: { container: "w-14 h-14", icon: "text-2xl" },
  lg: { container: "w-16 h-16", icon: "text-3xl" }
};

export default function BadgeIcon({ 
  icon, 
  color = "primary", 
  size = "md",
  locked = false
}: BadgeIconProps) {
  // If locked, override color
  const colorStyles = locked ? colorMap.muted : colorMap[color];
  const sizeStyles = sizeMap[size];
  
  // Map icon name to component
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<IconName, React.ReactNode> = {
      award: <Award />,
      book: <Book />,
      brush: <Brush />,
      star: <Star />,
      home: <Home />,
      clock: <Clock />,
      heart: <Heart />,
      activity: <Activity />,
      check: <CheckSquare />,
      coffee: <Coffee />,
      smile: <Smile />
    };
    
    // Default to Award if icon not found
    return (iconMap[iconName as IconName] || <Award />);
  };

  return (
    <div className={`${sizeStyles.container} rounded-full ${colorStyles.bg} flex items-center justify-center ${colorStyles.text}`}>
      {locked ? (
        <Lock className={sizeStyles.icon} />
      ) : (
        <span className={sizeStyles.icon}>{getIconComponent(icon)}</span>
      )}
    </div>
  );
}
