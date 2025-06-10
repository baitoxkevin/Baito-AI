declare module 'react-tinder-card' {
  import { CSSProperties, ReactNode, Ref } from 'react';

  export type Direction = 'left' | 'right' | 'up' | 'down';

  export interface API {
    swipe(dir?: Direction): Promise<void>;
    restoreCard(): Promise<void>;
  }

  export interface TinderCardProps {
    ref?: Ref<API>;
    onSwipe?: (dir: Direction) => void;
    onCardLeftScreen?: (dir: Direction) => void;
    preventSwipe?: Direction[];
    swipeRequirementType?: 'position' | 'velocity';
    swipeThreshold?: number;
    onSwipeRequirementFulfilled?: (dir: Direction) => void;
    onSwipeRequirementUnfulfilled?: () => void;
    className?: string;
    children?: ReactNode;
    flickOnSwipe?: boolean;
  }

  const TinderCard: React.FC<TinderCardProps>;
  
  export default TinderCard;
}