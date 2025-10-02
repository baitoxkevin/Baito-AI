import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { Sparkles, TrendingUp, Trophy } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface PointsDisplayProps {
  candidateId: string;
  showRank?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function PointsDisplay({ candidateId, showRank = false, size = 'medium' }: PointsDisplayProps) {
  const [points, setPoints] = useState(0);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  // Size configurations
  const sizeConfig = {
    small: { fontSize: 24, iconSize: 16, padding: 8 },
    medium: { fontSize: 36, iconSize: 20, padding: 12 },
    large: { fontSize: 48, iconSize: 24, padding: 16 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    fetchPoints();
    subscribeToPoints();
  }, [candidateId]);

  useEffect(() => {
    // Animate point counter when points change
    if (points !== previousPoints) {
      Animated.parallel([
        // Number ticker animation
        Animated.timing(animatedValue, {
          toValue: points,
          duration: 1500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        // Pulse animation
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(pulseAnimation, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // Sparkle animation
        Animated.sequence([
          Animated.timing(sparkleAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnimation, {
            toValue: 0,
            duration: 300,
            delay: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      setPreviousPoints(points);
    }
  }, [points, previousPoints]);

  const fetchPoints = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_candidate_stats', { p_candidate_id: candidateId });

      if (error) throw error;

      if (data && data.length > 0) {
        setPoints(data[0].total_points);
        setPreviousPoints(data[0].total_points);
        if (showRank) {
          setRank(data[0].rank);
        }
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPoints = () => {
    const subscription = supabase
      .channel(`points_${candidateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_log',
          filter: `candidate_id=eq.${candidateId}`,
        },
        (payload) => {
          // Add new points to current total
          const newPoints = payload.new as any;
          setPoints((prev) => prev + newPoints.points);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const displayValue = animatedValue.interpolate({
    inputRange: [0, points],
    outputRange: [previousPoints, points],
  });

  const sparkleOpacity = sparkleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const sparkleScale = sparkleAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  if (isLoading) {
    return (
      <View className="flex-row items-center justify-center p-3">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="relative">
      <Animated.View
        style={{
          transform: [{ scale: pulseAnimation }],
          padding: config.padding,
        }}
        className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-200"
      >
        {/* Sparkle Effect */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            opacity: sparkleOpacity,
            transform: [{ scale: sparkleScale }],
          }}
        >
          <Sparkles size={config.iconSize} color="#FFD700" />
        </Animated.View>

        {/* Main Content */}
        <View className="flex-row items-center space-x-2">
          <View className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-2">
            <Trophy size={config.iconSize} color="white" />
          </View>

          <View>
            <Text className="text-gray-600 text-xs font-medium">Total Points</Text>
            <View className="flex-row items-baseline">
              <AnimatedNumber
                value={displayValue}
                fontSize={config.fontSize}
                fontWeight="bold"
              />
              {points > previousPoints && (
                <View className="ml-2 flex-row items-center">
                  <TrendingUp size={16} color="#10B981" />
                  <Text className="text-green-500 text-sm font-semibold ml-1">
                    +{points - previousPoints}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Rank Display */}
        {showRank && rank && (
          <View className="mt-2 pt-2 border-t border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600 text-sm">Leaderboard Rank</Text>
              <View className="flex-row items-center">
                {rank <= 3 && <Text className="mr-1">{getRankEmoji(rank)}</Text>}
                <Text className="font-bold text-lg text-purple-600">#{rank}</Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Particles Effect (simplified for React Native) */}
      {points > previousPoints && <FloatingParticles />}
    </View>
  );
}

// Animated Number Component
function AnimatedNumber({ value, fontSize, fontWeight }: any) {
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const listener = value.addListener((v: any) => {
      setDisplayValue(Math.round(v.value).toLocaleString());
    });

    return () => {
      value.removeListener(listener);
    };
  }, [value]);

  return (
    <Text
      style={{
        fontSize,
        fontWeight,
        color: '#7C3AED', // purple-600
      }}
    >
      {displayValue}
    </Text>
  );
}

// Floating Particles Effect
function FloatingParticles() {
  const particles = Array(5).fill(0).map((_, i) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -50,
          duration: 2000,
          delay: i * 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          delay: i * 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        key={i}
        style={{
          position: 'absolute',
          top: '50%',
          left: `${20 + i * 15}%`,
          transform: [{ translateY }],
          opacity,
        }}
      >
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#FFD700',
          }}
        />
      </Animated.View>
    );
  });

  return <>{particles}</>;
}

function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}