import React, { forwardRef, ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// Types
interface BaseProps {
  children?: ReactNode;
  className?: string;
}

interface ButtonProps extends BaseProps {
  variant?: "default" | "primary" | "ghost" | "icon";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
}

interface CardProps extends BaseProps {
  variant?: "default" | "inset" | "floating";
  padding?: "sm" | "md" | "lg" | "xl";
  hover?: boolean;
}

interface InputProps extends BaseProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

interface ProgressProps extends BaseProps {
  value: number;
  max?: number;
  animated?: boolean;
}

interface ToggleProps extends BaseProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

// Neomorphism Card Component
export const NeoCard = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, className, variant = "default", padding = "md", hover = true },
    ref,
  ) => {
    const variants = {
      default: "neo-card",
      inset: "neo-card-inset",
      floating: "neo-floating",
    };

    const paddings = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          variants[variant],
          paddings[padding],
          hover &&
            "transition-all duration-300 hover:transform hover:scale-[1.02]",
          className,
        )}
        whileHover={hover ? { y: -2 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    );
  },
);

NeoCard.displayName = "NeoCard";

// Neomorphism Button Component
export const NeoButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "default",
      size = "md",
      disabled = false,
      onClick,
      icon: Icon,
    },
    ref,
  ) => {
    const variants = {
      default: "neo-button",
      primary: "neo-button neo-button-primary",
      ghost: "bg-transparent hover:bg-white/10 text-gray-600",
      icon: "neo-icon-button",
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          variants[variant],
          variant !== "icon" && sizes[size],
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { y: -1 } : undefined}
        whileTap={!disabled ? { y: 0 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {Icon && <Icon className="w-5 h-5" />}
        {variant !== "icon" && children}
      </motion.button>
    );
  },
);

NeoButton.displayName = "NeoButton";

// Neomorphism Input Component
export const NeoInput = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", placeholder, value, onChange, disabled },
    ref,
  ) => {
    return (
      <motion.input
        ref={ref}
        type={type}
        className={cn("neo-input", disabled && "opacity-50", className)}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        whileFocus={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    );
  },
);

NeoInput.displayName = "NeoInput";

// Neomorphism Progress Component
export const NeoProgress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  animated = false,
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("neo-progress", className)}>
      <motion.div
        className={cn(
          "neo-progress-fill",
          animated && "relative overflow-hidden",
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

// Neomorphism Toggle Component
export const NeoToggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        "neo-toggle",
        checked && "active",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onClick={() => !disabled && onChange(!checked)}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
    >
      <motion.div
        className="neo-toggle-thumb"
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </motion.div>
  );
};

// Neomorphism Icon Button
export const NeoIconButton: React.FC<{
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "primary" | "accent";
}> = ({
  icon: Icon,
  onClick,
  className,
  disabled = false,
  variant = "default",
}) => {
  const variants = {
    default: "neo-icon-button",
    primary:
      "neo-icon-button bg-gradient-to-br from-blue-500 to-purple-600 text-white",
    accent:
      "neo-icon-button bg-gradient-to-br from-pink-500 to-orange-500 text-white",
  };

  return (
    <motion.button
      className={cn(variants[variant], disabled && "opacity-50", className)}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -2, scale: 1.05 } : undefined}
      whileTap={!disabled ? { y: 0, scale: 0.95 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  );
};

// Neomorphism Container
export const NeoContainer: React.FC<
  BaseProps & { size?: "sm" | "md" | "lg" | "xl" | "full" }
> = ({ children, className, size = "lg" }) => {
  const sizes = {
    sm: "max-w-sm mx-auto",
    md: "max-w-md mx-auto",
    lg: "max-w-4xl mx-auto",
    xl: "max-w-6xl mx-auto",
    full: "w-full",
  };

  return (
    <div className={cn("px-4 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </div>
  );
};

// Neomorphism Section
export const NeoSection: React.FC<BaseProps & { background?: boolean }> = ({
  children,
  className,
  background = true,
}) => {
  return (
    <section
      className={cn(
        "py-12 sm:py-16 lg:py-20",
        background && "bg-gradient-to-br from-gray-50 via-white to-gray-100",
        className,
      )}
    >
      {children}
    </section>
  );
};

// Neomorphism Grid
export const NeoGrid: React.FC<
  BaseProps & {
    cols?: 1 | 2 | 3 | 4 | 5 | 6;
    gap?: "sm" | "md" | "lg" | "xl";
  }
> = ({ children, className, cols = 3, gap = "md" }) => {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
  };

  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-10",
  };

  return (
    <div className={cn("grid", colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
};

// Neomorphism Feature Card
export const NeoFeatureCard: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
  gradient?: boolean;
}> = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
  gradient = false,
}) => {
  return (
    <motion.div
      className={cn(
        "neo-card p-6 cursor-pointer group",
        gradient && "neo-gradient-border",
        className,
      )}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        className="flex flex-col items-center text-center space-y-4"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <div className="neo-icon-button w-16 h-16 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h3 className="neo-title text-lg font-semibold mb-2">{title}</h3>
          <p className="neo-text-muted text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Neomorphism Stats Card
export const NeoStatsCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}> = ({ icon: Icon, label, value, change, className }) => {
  return (
    <NeoCard className={cn("p-6", className)} padding="md">
      <div className="flex items-center justify-between">
        <div>
          <p className="neo-text-muted text-sm font-medium">{label}</p>
          <p className="neo-title text-2xl font-bold mt-1">{value}</p>
          {change && (
            <div
              className={cn(
                "flex items-center mt-2 text-sm",
                change.positive ? "text-green-600" : "text-red-600",
              )}
            >
              <span>
                {change.positive ? "+" : ""}
                {change.value}%
              </span>
            </div>
          )}
        </div>
        <div className="neo-icon-button w-12 h-12">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
    </NeoCard>
  );
};

// Neomorphism Loading Spinner
export const NeoSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className }) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <motion.div
      className={cn(
        "rounded-full border-2 border-gray-300 border-t-indigo-600",
        sizes[size],
        className,
      )}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

// Components are already exported individually above

// Default export for convenience
export default {
  Card: NeoCard,
  Button: NeoButton,
  Input: NeoInput,
  Progress: NeoProgress,
  Toggle: NeoToggle,
  IconButton: NeoIconButton,
  Container: NeoContainer,
  Section: NeoSection,
  Grid: NeoGrid,
  FeatureCard: NeoFeatureCard,
  StatsCard: NeoStatsCard,
  Spinner: NeoSpinner,
};
