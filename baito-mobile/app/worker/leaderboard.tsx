import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react-native';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  total_points: number;
  total_shifts: number;
  total_achievements: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })
        .limit(100);

      if (error) throw error;

      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: Trophy, color: '#FFD700', emoji: '🥇' };
      case 2:
        return { icon: Medal, color: '#C0C0C0', emoji: '🥈' };
      case 3:
        return { icon: Award, color: '#CD7F32', emoji: '🥉' };
      default:
        return { icon: null, color: '#6B7280', emoji: '' };
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with Meteors Effect */}
      <View className="bg-gradient-to-br from-purple-600 to-blue-600 px-4 pt-12 pb-6 relative overflow-hidden">
        {/* Meteors Background Effect (simplified) */}
        <View className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              className="absolute bg-white/20 rounded-full"
              style={{
                width: 2,
                height: 2,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </View>

        <View className="relative z-10">
          <View className="flex-row items-center justify-center mb-2">
            <Trophy size={32} color="#FFD700" />
            <Text className="text-3xl font-bold text-white ml-3">Leaderboard</Text>
          </View>
          <Text className="text-purple-100 text-center">
            Top 100 Workers • Real-time Rankings
          </Text>
        </View>
      </View>

      {/* Leaderboard List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {leaderboard.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center">
            <Trophy size={48} color="#9CA3AF" />
            <Text className="text-lg text-gray-500 mt-4">No rankings yet</Text>
            <Text className="text-sm text-gray-400 mt-2 text-center">
              Complete shifts to earn points and appear on the leaderboard
            </Text>
          </View>
        ) : (
          leaderboard.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId;
            const rankInfo = getRankIcon(entry.rank);
            const RankIcon = rankInfo.icon;

            return (
              <View
                key={entry.id}
                className={`rounded-xl p-4 mb-3 border ${getRankStyle(entry.rank)} ${
                  isCurrentUser ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {/* Top 3 Special Styling */}
                {entry.rank <= 3 && (
                  <View className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                    <Text className="text-2xl">{rankInfo.emoji}</Text>
                  </View>
                )}

                <View className="flex-row items-center">
                  {/* Rank Number */}
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      entry.rank <= 3 ? 'bg-white' : 'bg-gray-100'
                    }`}
                  >
                    {RankIcon ? (
                      <RankIcon size={24} color={rankInfo.color} />
                    ) : (
                      <Text className="text-lg font-bold text-gray-700">
                        {entry.rank}
                      </Text>
                    )}
                  </View>

                  {/* User Info */}
                  <View className="flex-1 ml-4">
                    <View className="flex-row items-center">
                      <Text className="text-lg font-bold text-gray-900">
                        {entry.name}
                      </Text>
                      {isCurrentUser && (
                        <View className="ml-2 bg-purple-600 px-2 py-0.5 rounded-full">
                          <Text className="text-white text-xs font-semibold">YOU</Text>
                        </View>
                      )}
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row items-center mt-2 space-x-4">
                      {/* Points */}
                      <View className="flex-row items-center">
                        <Trophy size={14} color="#7C3AED" />
                        <Text className="text-sm font-semibold text-purple-600 ml-1">
                          {entry.total_points.toLocaleString()}
                        </Text>
                      </View>

                      {/* Shifts */}
                      <View className="flex-row items-center">
                        <TrendingUp size={14} color="#10B981" />
                        <Text className="text-sm text-gray-600 ml-1">
                          {entry.total_shifts} shifts
                        </Text>
                      </View>

                      {/* Achievements */}
                      {entry.total_achievements > 0 && (
                        <View className="flex-row items-center">
                          <Award size={14} color="#F59E0B" />
                          <Text className="text-sm text-gray-600 ml-1">
                            {entry.total_achievements} badges
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Meteors Effect for Top 3 */}
                {entry.rank <= 3 && (
                  <View className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50" />
                )}
              </View>
            );
          })
        )}

        {/* Current User Position (if not in top 100) */}
        {currentUserId && !leaderboard.some(e => e.id === currentUserId) && (
          <View className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <Text className="text-center text-purple-700 font-medium">
              Keep earning points to make it to the top 100!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
