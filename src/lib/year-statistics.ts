import { supabase } from './supabase';

export async function getYearProjectsCount(year: number): Promise<number> {
  try {
    // 获取指定年份的所有项目
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    // 查询在指定年份内的所有项目
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .or(`and(start_date.gte.${startDate},start_date.lte.${endDate}),and(end_date.gte.${startDate},end_date.lte.${endDate}),and(start_date.lte.${startDate},end_date.gte.${endDate})`);
    
    if (error) {
      console.error('Error fetching year projects count:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getYearProjectsCount:', error);
    return 0;
  }
}

// 缓存年度数据，避免重复查询
const yearCache = new Map<number, { count: number; timestamp: number }>();
const CACHE_DURATION = 60000; // 1分钟缓存

export async function getCachedYearProjectsCount(year: number): Promise<number> {
  const cached = yearCache.get(year);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.count;
  }
  
  const count = await getYearProjectsCount(year);
  yearCache.set(year, { count, timestamp: now });
  
  return count;
}