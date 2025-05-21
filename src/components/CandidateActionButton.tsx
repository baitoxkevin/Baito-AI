import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Share2, Loader2, Check, ShieldCheck, MoreHorizontal
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CandidateActionButtonProps {
  candidateId: string;
  candidateIc?: string;
  candidateName?: string;
  className?: string;
  showDropdown?: boolean;
}

export function CandidateActionButton({
  candidateId,
  candidateIc,
  candidateName,
  className = "",
  showDropdown = false
}: CandidateActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // Generate and handle the candidate update URL
  const generateUpdateUrl = async (useSecureToken = false): Promise<string | null> => {
    try {
      // Use secure token generation if requested
      if (useSecureToken) {
        const { data: secureUrl, error } = await supabase.rpc("generate_secure_candidate_token", {
          p_candidate_id: candidateId
        });

        if (error) {
          console.error("Error generating secure URL:", error);
          // Fall back to standard URL generation
          return generateUpdateUrl(false);
        }

        if (!secureUrl) {
          throw new Error("Failed to generate secure token");
        }

        return secureUrl;
      }

      // Create the verification URL directly if we have the IC
      if (candidateIc) {
        const cleanIC = candidateIc.replace(/[^0-9]/g, "");
        const lastFour = cleanIC.slice(-4);
        // Using window.location.origin to get the base URL dynamically
        const baseUrl = window.location.origin;
        return `${baseUrl}/candidate-update/${candidateId}?code=${lastFour}`;
      }

      // Otherwise use the database function to generate the URL
      const { data: url, error } = await supabase.rpc("generate_candidate_update_url", {
        p_candidate_id: candidateId
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!url) {
        throw new Error("Candidate may not have an IC number");
      }

      return url;
    } catch (error) {
      console.error("Error generating update URL:", error);
      return null;
    }
  };

  // Handle copying the update form URL to clipboard
  const handleCopyUpdateUrl = async (e: React.MouseEvent, useSecureToken = false) => {
    // Stop event propagation to prevent the table row click event
    e.stopPropagation();
    e.preventDefault();

    setIsLoading(true);

    try {
      // Generate URL
      const url = await generateUpdateUrl(useSecureToken);

      if (!url) {
        toast({
          title: "Error",
          description: "Failed to generate update URL",
          variant: "destructive",
        });
        return;
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(url);

      // Show success state
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast({
        title: "Copied!",
        description: useSecureToken ?
          "Secure update form URL copied to clipboard" :
          "Update form URL copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      console.error("Error copying update URL:", error);
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors duration-200 ${className}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => handleCopyUpdateUrl(e as React.MouseEvent)}>
            <Share2 className="h-4 w-4 mr-2" />
            <span>Share update link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => handleCopyUpdateUrl(e as React.MouseEvent, true)}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            <span>Share secure update link</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors duration-200 ${className}`}
            disabled={isLoading}
            onClick={(e) => handleCopyUpdateUrl(e)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Copy update form link to clipboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}