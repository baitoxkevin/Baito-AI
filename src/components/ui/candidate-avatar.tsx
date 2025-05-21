import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { getCandidateAvatarUrl } from '@/lib/avatar-service';

// Create our own AvatarImage component to fix issues with profile image loading
const AvatarImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  return (
    <img 
      src={src} 
      alt={alt} 
      className={cn("aspect-square h-full w-full object-cover", className)} 
      style={{ objectFit: 'cover' }} // Ensure cover is applied
      onClick={(e) => {
        // Stop event propagation to prevent parent dialog from closing
        e.stopPropagation();
      }}
    />
  );
};

interface CandidateAvatarProps {
  src?: string;
  fallback: string;
  candidateId: string | { id: string } | any;  // Allow object or string
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CandidateAvatar({
  src,
  fallback,
  candidateId,
  className,
  size = 'md'
}: CandidateAvatarProps) {
  // Ensure candidateId is properly extracted if object is passed
  const actualId = typeof candidateId === 'object' && candidateId !== null && 'id' in candidateId ? candidateId.id : candidateId;
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  // Remove loading state entirely - always show image or fallback immediately
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const checkBlacklistAndPhoto = async () => {
      // Ensure actualId is a string
      if (!actualId || typeof actualId !== 'string' || src) {
        if (actualId && typeof actualId !== 'string') {
          console.error('CandidateAvatar: candidateId must be a string, received:', candidateId);
        }
        return;
      }
      
      // For demo candidates with short IDs like "c1", "c2", skip the blacklist check
      const isTestId = actualId.length < 10;
      
      if (!isTestId) {
        try {
          // Get current user
          const { data: authData } = await supabase.auth.getUser();
          
          // Check if candidate is blacklisted by current user
          if (authData?.user) {
            const { data, error } = await supabase
              .from('candidate_blacklist')
              .select('id')
              .eq('candidate_id', actualId)
              .eq('user_id', authData.user.id)
              .single();

            if (!error && data) {
              setIsBlacklisted(true);
            }
          }

          // Use the avatar service to fetch the profile photo
          const photoUrl = await getCandidateAvatarUrl(actualId);
          
          if (photoUrl) {
            setProfilePhoto(photoUrl);
          }
        } catch (error) {
          console.error('Error checking blacklist or fetching photo:', error);
        }
      }
    };

    checkBlacklistAndPhoto();
  }, [actualId, src]);

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Blacklist indicator classes
  const blacklistRingClasses = isBlacklisted 
    ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' 
    : '';

  // Determine which image source to use (prioritize passed src, then fetched profilePhoto, no auto-generation fallback)
  const imageSource = src || profilePhoto;

  return (
    <div
      className={cn(
        "relative rounded-full",
        className
      )}
      onClick={(e) => {
        // Stop event propagation to prevent parent dialog from closing
        e.stopPropagation();
      }}
    >
      {/* If we have an image source, show it immediately without Avatar components */}
      {imageSource ? (
        <div className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          blacklistRingClasses
        )}>
          <img 
            src={imageSource}
            alt={fallback}
            className="aspect-square h-full w-full object-cover"
            style={{ objectFit: 'cover' }}
          />
        </div>
      ) : (
        <Avatar className={cn(sizeClasses[size], blacklistRingClasses)}>
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      )}

      {isBlacklisted && (
        <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold border border-background">
          !
        </div>
      )}
    </div>
  );
}