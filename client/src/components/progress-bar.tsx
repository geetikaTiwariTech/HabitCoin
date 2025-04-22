import { useState, useEffect } from "react";

interface ProgressBarProps {
  progress: number;
  height?: string;
  className?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  height = "h-2.5",
  className = "bg-primary",
  backgroundColor = "bg-gray-200",
  animated = true
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  
  // Animate progress on mount and when progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(progress);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`w-full rounded-full ${height} ${backgroundColor}`}>
      <div
        className={`${height} rounded-full ${className} ${animated ? 'transition-all duration-500 ease-out' : ''}`}
        style={{ width: `${width}%` }}
      ></div>
    </div>
  );
}
