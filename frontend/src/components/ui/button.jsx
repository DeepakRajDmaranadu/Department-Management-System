import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", loading, loadingText, children, disabled, ...props }, ref) => {
    // Helper to get loading text dynamically from string children
    const getLoadingText = () => {
      if (loadingText) return loadingText;
      if (typeof children === "string") {
        const text = children.trim().toLowerCase();
        if (text.startsWith("create")) return "Creating";
        if (text.startsWith("update")) return "Updating";
        if (text.startsWith("delete")) return "Deleting";
        if (text.startsWith("save")) return "Saving";
        if (text.startsWith("submit")) return "Submitting";
        if (text.startsWith("login") || text.includes("sign in")) return "Signing in";
        if (text.startsWith("logout") || text.includes("sign out")) return "Signing out";
        if (text.startsWith("upload")) return "Uploading";
        if (text.startsWith("send")) return "Sending";
        if (text.startsWith("approve")) return "Approving";
        if (text.startsWith("reject")) return "Rejecting";
        if (text.startsWith("generate")) return "Generating";
        if (text.startsWith("export")) return "Exporting";
      }
      return "Processing";
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary/90":
              variant === "default",
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90":
              variant === "destructive",
            "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground":
              variant === "outline",
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
            <span>{getLoadingText()}</span>
            <span className="loading-dots" />
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
