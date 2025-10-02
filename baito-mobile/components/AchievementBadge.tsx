import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Modal, Dimensions } from 'react-native';
import { Trophy, Star, Target, Award, Calendar, Zap, CheckCircle, Flag, Crown } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import LottieView from 'lottie-react-native';

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  icon_name: string;
  unlocked_at: string;
  isNew?: boolean;
}

interface AchievementBadgeProps {
  candidateId: string;
  showAll?: boolean;
  maxDisplay?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function AchievementBadge({ candidateId, showAll = false, maxDisplay = 3 }: AchievementBadgeProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAchievements();
    subscribeToAchievements();
  }, [candidateId]);

  useEffect(() => {
    if (newAchievement) {
      celebrateUnlock();
    }
  }, [newAchievement]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToAchievements = () => {
    const subscription = supabase
      .channel(`achievements_${candidateId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `candidate_id=eq.${candidateId}`,
        },
        (payload) => {
          const newAch = payload.new as Achievement;
          newAch.isNew = true;
          setNewAchievement(newAch);
          setAchievements((prev) => [newAch, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const celebrateUnlock = () => {
    setShowCelebration(true);

    // Animate celebration
    Animated.parallel([
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
    ]).start();

    // Auto-hide celebration after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setNewAchievement(null);
    }, 5000);
  };

  const getIcon = (iconName: string, size: number = 24, color: string = '#FFD700') => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      target: Target,
      award: Award,
      calendar: Calendar,
      zap: Zap,
      'check-circle': CheckCircle,
      flag: Flag,
      crown: Crown,
    };

    const Icon = icons[iconName] || Trophy;
    return <Icon size={size} color={color} />;
  };

  const displayAchievements = showAll ? achievements : achievements.slice(0, maxDisplay);

  const spin = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <View className="p-4">
        <Text className="text-gray-400">Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Achievement List */}
      <ScrollView
        horizontal={!showAll}
        showsHorizontalScrollIndicator={false}
        className="py-2"
      >
        <View className={showAll ? 'space-y-2' : 'flex-row space-x-3'}>
          {displayAchievements.map((achievement, index) => (
            <Animated.View
              key={achievement.id}
              style={{
                opacity: fadeAnimation,
                transform: [
                  {
                    scale: achievement.isNew ? scaleAnimation : 1,
                  },
                ],
              }}
            >
              <TouchableOpacity
                className={`${
                  showAll ? 'flex-row' : ''
                } items-center bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 ${
                  achievement.isNew ? 'shadow-lg' : ''
                }`}
                activeOpacity={0.8}
              >
                <View
                  className={`bg-gradient-to-br from-amber-400 to-orange-400 rounded-full p-2 ${
                    achievement.isNew ? 'animate-pulse' : ''
                  }`}
                >
                  {getIcon(achievement.icon_name, 20, 'white')}
                </View>
                <View className={showAll ? 'ml-3 flex-1' : 'mt-2'}>
                  <Text className="font-bold text-sm text-gray-800">
                    {achievement.achievement_name}
                  </Text>
                  {showAll && (
                    <Text className="text-xs text-gray-600 mt-1">
                      {achievement.achievement_description}
                    </Text>
                  )}
                </View>
                {achievement.isNew && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">NEW!</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* More Achievements Indicator */}
          {!showAll && achievements.length > maxDisplay && (
            <TouchableOpacity className="items-center justify-center bg-gray-100 rounded-xl p-3 min-w-[60px]">
              <Text className="text-gray-600 font-bold">+{achievements.length - maxDisplay}</Text>
              <Text className="text-xs text-gray-500">more</Text>
            </TouchableOpacity>
          )}

          {/* Empty State */}
          {achievements.length === 0 && (
            <View className="items-center justify-center p-8 bg-gray-50 rounded-xl">
              <Trophy size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-2 text-center">No achievements yet</Text>
              <Text className="text-xs text-gray-400 mt-1">Complete shifts to earn badges!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCelebration(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <Animated.View
            style={{
              opacity: fadeAnimation,
              transform: [
                { scale: scaleAnimation },
                { rotate: spin },
              ],
            }}
            className="bg-white rounded-3xl p-8 mx-4 items-center"
          >
            {/* Confetti Background */}
            <View className="absolute inset-0">
              {Array(20).fill(0).map((_, i) => (
                <ConfettiParticle key={i} delay={i * 50} />
              ))}
            </View>

            <View className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-full p-6 mb-4">
              {newAchievement && getIcon(newAchievement.icon_name, 48, 'white')}
            </View>

            <Text className="text-3xl font-bold text-gray-800 mb-2">Achievement Unlocked!</Text>
            {newAchievement && (
              <>
                <Text className="text-xl font-semibold text-amber-600 mb-1">
                  {newAchievement.achievement_name}
                </Text>
                <Text className="text-gray-600 text-center">
                  {newAchievement.achievement_description}
                </Text>
              </>
            )}

            <TouchableOpacity
              className="bg-amber-500 rounded-full px-8 py-3 mt-6"
              onPress={() => setShowCelebration(false)}
            >
              <Text className="text-white font-bold">Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// Confetti Particle Component
function ConfettiParticle({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(-screenHeight)).current;
  const translateX = useRef(new Animated.Value(Math.random() * screenWidth)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 3000 + Math.random() * 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          delay: delay + 2500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        backgroundColor: color,
        transform: [
          { translateY },
          { translateX },
          { rotate: spin },
        ],
        opacity,
      }}
    />
  );
}