import { useState, useEffect } from "react";

interface PointCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  textColor?: string;
  subTextColor?: string;
  subText?: string;
}

export default function PointCircle({
  percentage,
  size = 180,
  strokeWidth = 12,
  circleColor = "#E9ECEF",
  progressColor = "#4361EE",
  textColor = "#4361EE",
  subTextColor = "#6C757D",
  subText = "towards next reward"
}: PointCircleProps) {
  const [progress, setProgress] = useState(0);
  
  // Calculate circle properties
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Animate progress on mount and when percentage changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(percentage);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={circleColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="transparent"
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
        />
      </svg>
      
      {/* Text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-4xl font-bold"
          style={{ color: textColor }}
        >
          {Math.round(progress)}%
        </span>
        {subText && (
          <span 
            className="text-sm"
            style={{ color: subTextColor }}
          >
            {subText}
          </span>
        )}
      </div>
    </div>
  );
}
