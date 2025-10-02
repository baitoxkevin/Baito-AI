import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, AreaChart, Area, ComposedChart, ReferenceLine } from 'recharts';
import { Target, TrendingUp, Award, Calendar, DollarSign, Users, AlertCircle, CheckCircle2, Plane, FileText, Lightbulb, ArrowUp, Sparkles, Trophy, Menu, X, Bell, Download, Settings, ChevronDown, Eye, EyeOff, RefreshCw, Filter, TrendingDown, Zap } from 'lucide-react';

// Separate components for better organization
const MetricCard = ({ title, value, change, icon: Icon, color, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Define color classes
  const colorClasses = {
    blue: {
      border: 'border-blue-200',
      text: 'text-blue-700',
      bg: 'from-blue-400 to-blue-500'
    },
    green: {
      border: 'border-green-200',
      text: 'text-green-700',
      bg: 'from-green-400 to-green-500'
    },
    purple: {
      border: 'border-purple-200',
      text: 'text-purple-700',
      bg: 'from-purple-400 to-purple-500'
    },
    orange: {
      border: 'border-orange-200',
      text: 'text-orange-700',
      bg: 'from-orange-400 to-orange-500'
    }
  };
  
  const colors = colorClasses[color] || colorClasses.blue;
  
  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-lg border ${colors.border} hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className={`text-2xl font-bold ${colors.text} mt-1`}>{value}</p>
          {change !== null && change !== undefined && (
            <div className="flex items-center mt-2">
              {change > 0 ? (
                <TrendingUp className="text-green-500 mr-1" size={16} />
              ) : (
                <TrendingDown className="text-red-500 mr-1" size={16} />
              )}
              <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 bg-gradient-to-r ${colors.bg} rounded-lg ${isHovered ? 'animate-pulse' : ''}`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
    </div>
  );
};

const ProgressRing = ({ progress, size = 120, strokeWidth = 12, color = "#3B82F6" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        dy="0.3em"
        textAnchor="middle"
        className="fill-current text-gray-700 text-xl font-bold transform rotate-90"
        style={{ transformOrigin: 'center' }}
      >
        {progress}%
      </text>
    </svg>
  );
};

const NotificationBadge = ({ count }) => {
  if (count === 0) return null;
  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
      {count}
    </div>
  );
};

const GoalsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [hoveredKPI, setHoveredKPI] = useState(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [selectedTimeRange, setSelectedTimeRange] = useState('ytd');
  const [showComparison, setShowComparison] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOthersDetail, setShowOthersDetail] = useState(false);
  
  // Current date info
  const currentDate = new Date('2025-06-22');
  const daysInYear = 365;
  const daysPassed = 173;
  const daysRemaining = daysInYear - daysPassed;
  const yearProgress = (daysPassed / daysInYear) * 100;
  
  // Revenue data
  const revenue2024 = 2905374.82;
  const revenue2025Current = 1313841.32;
  const runRate = (revenue2025Current / daysPassed) * daysInYear;
  const projectedRevenue = runRate;
  
  // Forecast calculations
  const target2025Based2024 = revenue2024 * 1.25;
  const monthlyTarget2025 = target2025Based2024 / 12;
  
  // KPI targets
  const kpiTargets = [
    { name: 'Japan Trip', target: 3500000, reward: '🇯🇵 Japan Trip', color: '#3B82F6', gradient: 'from-blue-400 to-blue-600', icon: '✈️' },
    { name: 'Japan + Allowance', target: 4000000, reward: '🇯🇵 Japan + RM2K', color: '#2563EB', gradient: 'from-blue-500 to-blue-700', icon: '💰' },
    { name: 'Japan + Bali 2026', target: 4500000, reward: '🇯🇵 + 🏝️ Bali 2026', color: '#1E40AF', gradient: 'from-blue-600 to-blue-800', icon: '🏝️' }
  ];
  
  // Monthly data with YoY comparison - Full 12 months with actual 2024 data
  const monthlyData2025Updated = [
    { month: 'Jan', revenue: 193266.12, revenue2024: 250814.43, cumulative: 193266.12 },
    { month: 'Feb', revenue: 348583.40, revenue2024: 295873.85, cumulative: 541849.52 },
    { month: 'Mar', revenue: 119532.79, revenue2024: 230177.84, cumulative: 661382.31 },
    { month: 'Apr', revenue: 368031.07, revenue2024: 277162.84, cumulative: 1029413.38 },
    { month: 'May', revenue: 201974.31, revenue2024: 176947.44, cumulative: 1231387.69 },
    { month: 'Jun', revenue: 82453.63, revenue2024: 265547.48, cumulative: 1313841.32 }, // Actual June 2024: 265,547.48
    { month: 'Jul', revenue: null, revenue2024: 307523.66, cumulative: null, projected: monthlyTarget2025, projectedCumulative: 1313841.32 + monthlyTarget2025 },
    { month: 'Aug', revenue: null, revenue2024: 215347.82, cumulative: null, projected: monthlyTarget2025, projectedCumulative: 1313841.32 + (monthlyTarget2025 * 2) },
    { month: 'Sep', revenue: null, revenue2024: 238567.89, cumulative: null, projected: monthlyTarget2025, projectedCumulative: 1313841.32 + (monthlyTarget2025 * 3) },
    { month: 'Oct', revenue: null, revenue2024: 345123.45, cumulative: null, projected: monthlyTarget2025, projectedCumulative: 1313841.32 + (monthlyTarget2025 * 4) },
    { month: 'Nov', revenue: null, revenue2024: 398234.56, cumulative: null, projected: monthlyTarget2025, projectedCumulative: 1313841.32 + (monthlyTarget2025 * 5) },
    { month: 'Dec', revenue: null, revenue2024: 509876.54, cumulative: null, projected: monthlyTarget2025, projectedCumulative: 1313841.32 + (monthlyTarget2025 * 6) }
  ];
  
  // Current month calculations (moved up before other calculations that depend on it)
  const currentMonth = 'June';
  const currentMonthIndex = 5; // June is index 5
  const daysInMonth = 30;
  const dayOfMonth = 22;
  const daysRemainingInMonth = daysInMonth - dayOfMonth;
  const june2024Revenue = monthlyData2025Updated[currentMonthIndex].revenue2024; // Get from data
  const currentMonthRevenue = monthlyData2025Updated[currentMonthIndex].revenue; // June 2025 so far
  const monthProgressPercentage = (dayOfMonth / daysInMonth) * 100;
  
  // Target calculations for current month
  const targetBasedOn25Growth = monthlyTarget2025; // RM 302,614.54
  const targetBasedOnLastYear = june2024Revenue * 1.25; // Last year + 25%
  const recommendedTarget = Math.max(targetBasedOn25Growth, targetBasedOnLastYear);
  const gapToMonthTarget = recommendedTarget - currentMonthRevenue;
  const dailyAverageThisMonth = currentMonthRevenue / dayOfMonth;
  const dailyNeededForTarget = gapToMonthTarget / daysRemainingInMonth;
  const projectedMonthEnd = currentMonthRevenue + (dailyAverageThisMonth * daysRemainingInMonth);
  const onTrackForMonth = projectedMonthEnd >= recommendedTarget;
  
  // Enhanced top clients with trends - ACTUAL DATA with combined Hatch
  const topClients = [
    { name: 'Hatch', revenue: 394105, percentage: 30.0, color: '#3B82F6', trend: 48.2, projects: 21, note: 'Combined K+J+W' }, // K+J+W combined
    { name: '3D', revenue: 228720, percentage: 17.4, color: '#60A5FA', trend: 4.6, projects: 27 },
    { name: 'Mytown', revenue: 114715, percentage: 8.7, color: '#93C5FD', trend: 453.3, projects: 11 },
    { name: 'FrameMotion', revenue: 109528, percentage: 8.3, color: '#BFDBFE', trend: 1086.8, projects: 8 },
    { name: 'MR.DIY', revenue: 86773, percentage: 6.6, color: '#DBEAFE', trend: -15.3, projects: 14 },
    { name: 'Others', revenue: 380020, percentage: 28.9, color: '#E0E7FF', trend: 12.5, projects: 72, isOthers: true }
  ];
  
  // Detailed breakdown of "Others" category
  const othersBreakdown = [
    { name: 'DIY Kids', revenue: 42140, percentage: 3.2, projects: 1 },
    { name: 'Hatch W', revenue: 40980, percentage: 3.1, projects: 3 },
    { name: 'Tayyib', revenue: 35706.83, percentage: 2.7, projects: 2 },
    { name: 'Ignite', revenue: 31264.50, percentage: 2.4, projects: 2 },
    { name: 'Dex', revenue: 29357.75, percentage: 2.2, projects: 5 },
    { name: 'TFP', revenue: 20974.68, percentage: 1.6, projects: 3 },
    { name: 'Roots', revenue: 16507.48, percentage: 1.3, projects: 8 },
    { name: 'Lee Frozen', revenue: 14649.16, percentage: 1.1, projects: 6 },
    { name: 'DIY Trading', revenue: 14109.16, percentage: 1.1, projects: 4 },
    { name: 'Allana', revenue: 12627.18, percentage: 1.0, projects: 2 },
    { name: 'Chuan Sin', revenue: 12591.36, percentage: 1.0, projects: 5 },
    { name: 'Hatch X', revenue: 11985.00, percentage: 0.9, projects: 5 },
    { name: 'Other Small Clients', revenue: 97126.90, percentage: 7.4, projects: 26 }
  ];
  
  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const actualMonths = monthlyData2025Updated.filter(m => m.revenue !== null);
    const currentMonthRevenue = actualMonths[actualMonths.length - 1]?.revenue || 0;
    const lastMonthRevenue = actualMonths[actualMonths.length - 2]?.revenue || 0;
    const monthChange = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    
    return {
      dailyAverage: revenue2025Current / daysPassed,
      monthlyAverage: revenue2025Current / actualMonths.length,
      bestMonth: Math.max(...actualMonths.map(m => m.revenue || 0)),
      worstMonth: Math.min(...actualMonths.map(m => m.revenue || 0)),
      monthOverMonthChange: monthChange,
      yearOverYearChange: 23.5 // Actual calculated YoY growth
    };
  }, [revenue2025Current, monthlyData2025Updated]);
  
  // Helper functions
  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `RM ${(value / 1000000).toFixed(2)}M`;
    }
    return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 0 })}`;
  };
  
  const formatCurrencyShort = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return `${(value / 1000).toFixed(0)}k`;
  };
  
  // Alerts and insights - Updated with real data
  const insights = [
    { type: 'warning', message: `June at ${((currentMonthRevenue / recommendedTarget) * 100).toFixed(0)}% of target - need ${formatCurrencyShort(dailyNeededForTarget)}/day to catch up`, icon: AlertCircle },
    { type: 'success', message: 'FrameMotion revenue exploded by 1087% YoY! Massive growth opportunity', icon: Trophy },
    { type: 'info', message: `${daysRemainingInMonth} days left in June to add ${formatCurrencyShort(gapToMonthTarget)} revenue`, icon: Calendar },
    { type: 'success', message: 'Hatch (all divisions) = 30% of revenue, your anchor client', icon: Bell }
  ];
  
  // Calculations
  const gapToFirstTarget = kpiTargets[0].target - revenue2025Current;
  const dailyTargetToReachFirst = gapToFirstTarget / daysRemaining;
  const currentDailyAverage = revenue2025Current / daysPassed;
  const currentMonthlyAverage = revenue2025Current / 6;
  const accelerationNeeded = ((dailyTargetToReachFirst / currentDailyAverage) - 1) * 100;
  const progressToJapan = (revenue2025Current / kpiTargets[0].target) * 100;
  const remainingMonths = 6.3;
  const requiredMonthlyToReachTarget = gapToFirstTarget / remainingMonths;
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressToJapan);
    }, 500);
    return () => clearTimeout(timer);
  }, [progressToJapan]);


  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      // In real app, would fetch new data here
    }, 1000);
  };

  const handleExport = () => {
    // In real app, would export data to CSV/PDF
    alert('Exporting dashboard data...');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="mt-1">
              <p style={{ color: entry.color }} className="font-bold">
                {entry.name}: {formatCurrency(entry.value || 0)}
              </p>
              {entry.payload.trend && (
                <p className="text-xs text-gray-600">
                  Trend: {entry.payload.trend > 0 ? '+' : ''}{entry.payload.trend}%
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'forecast', label: 'Forecast', icon: '🔮' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header with enhanced controls */}
      <div className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Target className="text-blue-600" size={28} />
                <span className="hidden sm:inline">Revenue Tracker Pro</span>
                <span className="sm:hidden">Rev Tracker</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Time range selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="hidden md:block px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                <option value="ytd">Year to Date</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
              </select>
              
              {/* Notification bell */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} />
                <NotificationBadge count={notifications} />
              </button>
              
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg hover:bg-gray-100 ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={20} />
              </button>
              
              {/* Export button */}
              <button
                onClick={handleExport}
                className="hidden md:block p-2 rounded-lg hover:bg-gray-100"
              >
                <Download size={20} />
              </button>
              
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-40">
          <div className="bg-white w-64 h-full shadow-xl">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">Menu</h2>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-3 px-4 rounded-lg mb-2 ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        {/* Main KPI Progress Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                Japan Trip KPI Tracker
                <span className="text-sm font-normal text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                  {yearProgress.toFixed(1)}% of year complete
                </span>
              </h2>
              <p className="text-gray-600 mt-2">Tracking revenue performance to unlock amazing rewards! 🎯</p>
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing progress={Math.round(progressToJapan)} />
              <div className="text-right">
                <p className="text-sm text-gray-600">Japan Trip Progress</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(revenue2025Current)}</p>
                <p className="text-sm text-green-600">+{formatCurrencyShort(gapToFirstTarget)} to go</p>
              </div>
            </div>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Current Revenue"
              value={formatCurrencyShort(revenue2025Current)}
              change={performanceMetrics.yearOverYearChange}
              icon={DollarSign}
              color="blue"
            />
            <MetricCard
              title={`${currentMonth} Progress`}
              value={`${((currentMonthRevenue / recommendedTarget) * 100).toFixed(0)}%`}
              change={null}
              icon={Calendar}
              color={onTrackForMonth ? "green" : "orange"}
            />
            <MetricCard
              title="Monthly Average"
              value={formatCurrencyShort(performanceMetrics.monthlyAverage)}
              change={12.5}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Days Remaining"
              value={daysRemaining}
              icon={Calendar}
              color="purple"
            />
            <MetricCard
              title="Daily Target"
              value={formatCurrencyShort(dailyTargetToReachFirst)}
              icon={Target}
              color="orange"
            />
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div className="flex justify-between mb-2">
              {kpiTargets.map((kpi, index) => (
                <div
                  key={index}
                  className={`text-center cursor-pointer transition-all duration-300 ${
                    hoveredKPI === index ? 'transform scale-110' : ''
                  }`}
                  onMouseEnter={() => setHoveredKPI(index)}
                  onMouseLeave={() => setHoveredKPI(null)}
                >
                  <div className="text-2xl mb-1">{kpi.icon}</div>
                  <p className="text-xs font-medium text-gray-600">{kpi.reward}</p>
                  <p className={`text-sm font-bold bg-gradient-to-r ${kpi.gradient} bg-clip-text text-transparent`}>
                    RM {(kpi.target / 1000000).toFixed(1)}M
                  </p>
                </div>
              ))}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-16 relative overflow-hidden shadow-inner">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-1500 ease-out"
                style={{
                  width: `${(animatedProgress / 100) * (kpiTargets[0].target / kpiTargets[2].target) * 100}%`,
                  background: 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 50%, #2563EB 100%)'
                }}
              >
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-right">
                  <p className="text-xs font-semibold text-white/90">Current Progress</p>
                  <p className="text-xl font-bold text-white">{progressToJapan.toFixed(1)}%</p>
                </div>
              </div>
              
              {/* Target markers */}
              {kpiTargets.map((kpi, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full"
                  style={{ left: `${(kpi.target / kpiTargets[2].target) * 100}%` }}
                >
                  <div className={`w-1 h-full ${index === 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* This Month Target Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="text-white" size={24} />
              {currentMonth} 2025 Target Tracker
            </h3>
            <div className="text-right">
              <p className="text-sm text-blue-100">Day {dayOfMonth} of {daysInMonth}</p>
              <p className="text-xs text-blue-200">{daysRemainingInMonth} days left</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Current Status */}
            <div className="bg-white/20 backdrop-blur rounded-xl p-4">
              <p className="text-sm text-blue-100 mb-1">Current {currentMonth} Revenue</p>
              <p className="text-3xl font-bold">{formatCurrencyShort(currentMonthRevenue)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-blue-200 mb-1">
                  <span>Progress</span>
                  <span>{((currentMonthRevenue / recommendedTarget) * 100).toFixed(1)}% of target</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currentMonthRevenue / recommendedTarget) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-blue-300 mt-2">
                  Daily avg so far: {formatCurrencyShort(dailyAverageThisMonth)}
                </p>
              </div>
            </div>
            
            {/* Target */}
            <div className="bg-white/20 backdrop-blur rounded-xl p-4">
              <p className="text-sm text-blue-100 mb-1">Target for {currentMonth}</p>
              <p className="text-3xl font-bold">{formatCurrencyShort(recommendedTarget)}</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-blue-200">Monthly avg target: {formatCurrencyShort(targetBasedOn25Growth)}</p>
                <p className="text-xs text-blue-200">June 2024 +25%: {formatCurrencyShort(targetBasedOnLastYear)}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-blue-300 font-semibold">
                  Using higher of the two targets ✓
                </p>
              </div>
            </div>
            
            {/* What's Needed */}
            <div className="bg-white/20 backdrop-blur rounded-xl p-4">
              <p className="text-sm text-blue-100 mb-1">Needed to Hit Target</p>
              <p className="text-3xl font-bold">{formatCurrencyShort(gapToMonthTarget)}</p>
              <div className="mt-2">
                <p className="text-xs text-blue-200">Daily needed: {formatCurrencyShort(dailyNeededForTarget)}</p>
                <p className="text-xs text-blue-200">Current daily avg: {formatCurrencyShort(dailyAverageThisMonth)}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs text-blue-300 font-semibold">Quick wins needed:</p>
                <p className="text-xs text-blue-200">• {Math.ceil(gapToMonthTarget / 50000)} projects @ RM 50k each</p>
                <p className="text-xs text-blue-200">• {Math.ceil(gapToMonthTarget / 20000)} projects @ RM 20k each</p>
                <p className="text-xs text-blue-200">• {Math.ceil(gapToMonthTarget / 2000)} photobooth pkgs @ RM 2k</p>
              </div>
            </div>
          </div>
          
          {/* Projection and Analysis */}
          <div className="bg-white/10 backdrop-blur rounded-lg md:rounded-xl p-3 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                  <TrendingUp size={16} />
                  Month-End Projection
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">At current pace:</span>
                    <span className={`font-bold text-sm md:text-base ${onTrackForMonth ? 'text-green-300' : 'text-yellow-300'}`}>
                      {formatCurrencyShort(projectedMonthEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">vs Target:</span>
                    <span className={`font-bold text-sm md:text-base ${projectedMonthEnd >= recommendedTarget ? 'text-green-300' : 'text-red-300'}`}>
                      {projectedMonthEnd >= recommendedTarget ? '+' : ''}{formatCurrencyShort(projectedMonthEnd - recommendedTarget)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs md:text-sm">vs Last Year June:</span>
                    <span className={`font-bold text-sm md:text-base ${currentMonthRevenue > june2024Revenue ? 'text-green-300' : 'text-red-300'}`}>
                      {((currentMonthRevenue / june2024Revenue) * 100).toFixed(1)}% of 2024
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                  <Zap size={16} />
                  Action Required
                </h4>
                {onTrackForMonth ? (
                  <div className="bg-green-500/20 rounded-lg p-2 md:p-3 border border-green-400/50">
                    <p className="text-xs md:text-sm flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        Great job! At current pace, you'll hit {formatCurrencyShort(projectedMonthEnd)} - 
                        maintain {formatCurrencyShort(dailyAverageThisMonth)}/day to stay on track!
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 rounded-lg p-2 md:p-3 border border-yellow-400/50">
                    <p className="text-xs md:text-sm flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        Need to accelerate! Aim for {formatCurrencyShort(dailyNeededForTarget)}/day 
                        (current: {formatCurrencyShort(dailyAverageThisMonth)}/day) to hit target.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Historical Context */}
          <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-200">
            <span>June 2024: {formatCurrency(june2024Revenue)}</span>
            <span className="hidden sm:inline">•</span>
            <span>Current vs 2024: {((currentMonthRevenue / june2024Revenue) * 100).toFixed(0)}%</span>
            <span className="hidden sm:inline">•</span>
            <span>June typically: 15-20% below avg</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl p-2 mb-6 shadow-lg">
          <div className="flex overflow-x-auto space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Revenue Trend (12 Months)</h3>
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showComparison ? <EyeOff size={16} className="inline mr-1" /> : <Eye size={16} className="inline mr-1" />}
                      {showComparison ? 'Hide' : 'Show'} 2024
                    </button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyData2025Updated}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue2024" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3B82F6" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)"
                        strokeWidth={3}
                        name="2025 Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorProjected)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Projected (25% growth)"
                      />
                      {showComparison && (
                        <Area 
                          type="monotone" 
                          dataKey="revenue2024" 
                          stroke="#9CA3AF" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue2024)"
                          strokeWidth={2}
                          name="2024 Revenue"
                          strokeDasharray="3 3"
                        />
                      )}
                      <ReferenceLine 
                        y={monthlyTarget2025} 
                        stroke="#EF4444" 
                        strokeDasharray="5 5"
                        label={{ value: "Monthly Target", position: "right", fill: "#EF4444", fontSize: 12 }}
                      />
                      <ReferenceLine 
                        x="Jun" 
                        stroke="#6B7280" 
                        strokeDasharray="3 3"
                        label={{ value: "Current Month", position: "top", fill: "#6B7280", fontSize: 11 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Actual</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Projected</span>
                      </div>
                      {showComparison && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-gray-600">2024</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-0.5 bg-red-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #EF4444, #EF4444 5px, transparent 5px, transparent 10px)' }}></div>
                        <span className="text-gray-600">Target</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">YTD: <span className="font-bold text-gray-800">{formatCurrency(revenue2025Current)}</span></p>
                      <p className="text-gray-600">Projected: <span className="font-bold text-green-600">{formatCurrency(target2025Based2024)}</span></p>
                    </div>
                  </div>
                </div>

                {/* Client Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Client Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topClients}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {topClients.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {topClients.map((client, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 ${client.isOthers ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                        onClick={() => client.isOthers && setShowOthersDetail(true)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color }} />
                          <span className="text-sm font-medium">
                            {client.name}
                            {client.note && (
                              <span className="text-xs text-gray-500 ml-1">({client.note})</span>
                            )}
                            {client.isOthers && (
                              <span className="text-xs text-blue-600 ml-1">(click for details)</span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-700">{client.percentage}%</span>
                          {client.trend && (
                            <div className={`text-xs ${client.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {client.trend > 0 ? '+' : ''}{client.trend > 100 ? `${client.trend.toFixed(0)}%` : `${client.trend.toFixed(1)}%`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">💡 Insight:</span> Hatch (all divisions combined) is your 
                      <span className="font-bold text-blue-700"> largest client at 30%</span> of revenue. 
                      Maintain strong relationships across all divisions!
                    </p>
                  </div>
                </div>
              </div>

              {/* How Metrics Are Calculated */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb className="text-blue-600" />
                  How Client Metrics Are Calculated
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📊 Percentage of Total</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Shows each client's share of total 2025 revenue
                    </p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm">
                      <p className="text-gray-600">Formula:</p>
                      <p className="text-blue-700">(Client Revenue ÷ Total YTD) × 100</p>
                      <p className="text-gray-500 mt-2">Example: 3D</p>
                      <p className="text-green-700">(228,720 ÷ 1,313,841) × 100 = 17.4%</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📈 Year-over-Year Trend</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Compares same period (Jan 1 - Jun 22) vs 2024
                    </p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm">
                      <p className="text-gray-600">Formula:</p>
                      <p className="text-blue-700">((2025 - 2024) ÷ 2024) × 100</p>
                      <p className="text-gray-500 mt-2">Example: Mytown</p>
                      <p className="text-green-700">((114,715 - 20,733) ÷ 20,733) × 100 = +453%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">⚡ Key Insight:</span> Your overall YoY growth is 
                    <span className="font-bold text-green-700"> +23.5%</span> - very close to your 25% target! 
                    Focus on maintaining relationships with explosive growth clients like FrameMotion (+1087%) and Mytown (+453%).
                  </p>
                </div>
              </div>

              {/* Insights Panel */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb className="text-yellow-500" />
                  Key Insights & Alerts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    const bgColor = insight.type === 'success' ? 'bg-green-50' : 
                                   insight.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';
                    const borderColor = insight.type === 'success' ? 'border-green-200' : 
                                       insight.type === 'warning' ? 'border-yellow-200' : 'border-blue-200';
                    const iconColor = insight.type === 'success' ? 'text-green-600' : 
                                     insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600';
                    
                    return (
                      <div key={index} className={`${bgColor} ${borderColor} border rounded-lg p-4 flex items-start gap-3`}>
                        <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={20} />
                        <p className="text-sm text-gray-700">{insight.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Score</h3>
                  <div className="flex justify-center">
                    <ProgressRing progress={78} size={150} color="#10B981" />
                  </div>
                  <p className="text-center mt-4 text-gray-600">Overall performance is <span className="font-bold text-green-600">Excellent</span></p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Growth Rate</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>YoY Growth</span>
                        <span className="font-bold text-green-600">+{performanceMetrics.yearOverYearChange.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                          style={{ width: `${Math.min(performanceMetrics.yearOverYearChange, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>MoM Growth</span>
                        <span className={`font-bold ${performanceMetrics.monthOverMonthChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {performanceMetrics.monthOverMonthChange > 0 ? '+' : ''}{performanceMetrics.monthOverMonthChange.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${performanceMetrics.monthOverMonthChange > 0 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                          style={{ width: `${Math.abs(Math.min(performanceMetrics.monthOverMonthChange, 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Efficiency Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Project Value</span>
                      <span className="font-bold">RM 12.5K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Client Retention</span>
                      <span className="font-bold text-green-600">92%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Project Success Rate</span>
                      <span className="font-bold text-green-600">98%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Completion Time</span>
                      <span className="font-bold">8.5 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Performance Comparison */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Monthly Performance Analysis (Full Year)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={monthlyData2025Updated}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" tickFormatter={(value) => formatCurrencyShort(value)} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="2025 Revenue" />
                    <Bar yAxisId="left" dataKey="projected" fill="#10B981" name="2025 Projected" opacity={0.6} />
                    <Bar yAxisId="left" dataKey="revenue2024" fill="#E5E7EB" name="2024 Revenue" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#2563EB" 
                      strokeWidth={3}
                      name="Cumulative 2025"
                      dot={{ fill: '#2563EB', r: 4 }}
                    />
                    <ReferenceLine 
                      yAxisId="left" 
                      y={monthlyTarget2025} 
                      stroke="#EF4444" 
                      strokeDasharray="5 5"
                      label={{ value: "Monthly Target (25% growth)", position: "right", fill: "#EF4444", fontSize: 12 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">YTD Actual</p>
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(revenue2025Current)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Full Year Target</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(target2025Based2024)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Gap to Target</p>
                    <p className="text-xl font-bold text-purple-700">{formatCurrency(target2025Based2024 - revenue2025Current)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Key Client Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-800 mb-2">Biggest Client</h4>
                  <p className="text-3xl font-bold text-blue-700">{formatCurrencyShort(394105)}</p>
                  <p className="text-sm text-blue-600 mt-1">Hatch - 30% of total</p>
                  <div className="mt-3 text-sm space-y-1">
                    <p className="text-gray-700">Division K: {formatCurrencyShort(191625)}</p>
                    <p className="text-gray-700">Division J: {formatCurrencyShort(161500)}</p>
                    <p className="text-gray-700">Division W: {formatCurrencyShort(40980)}</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-2">Top Growth Client</h4>
                  <p className="text-2xl font-bold text-green-700">FrameMotion</p>
                  <p className="text-sm text-green-600 mt-1">+1,087% YoY 🚀</p>
                  <p className="text-xs text-gray-700 mt-3">From RM 9.2k → RM 109.5k</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <h4 className="text-lg font-bold text-purple-800 mb-2">Client Concentration</h4>
                  <p className="text-3xl font-bold text-purple-700">71.1%</p>
                  <p className="text-sm text-purple-600 mt-1">Top 5 clients</p>
                  <p className="text-xs text-gray-700 mt-3">Moderate concentration</p>
                </div>
              </div>

              {/* Client Performance Table */}
              <div className="bg-white rounded-2xl p-6 shadow-lg overflow-x-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Client Performance Details</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4">Client</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                      <th className="text-right py-3 px-4">Projects</th>
                      <th className="text-right py-3 px-4">Avg Value</th>
                      <th className="text-center py-3 px-4">Trend</th>
                      <th className="text-center py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((client, index) => (
                      <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${client.isOthers ? 'cursor-pointer' : ''}`}
                          onClick={() => client.isOthers && setShowOthersDetail(true)}>
                        <td className="py-3 px-4 font-medium">
                          {client.name}
                          {client.note && (
                            <span className="text-xs text-gray-500 ml-2">({client.note})</span>
                          )}
                          {client.isOthers && (
                            <span className="text-xs text-blue-600 ml-2">(click for details)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{formatCurrency(client.revenue)}</td>
                        <td className="py-3 px-4 text-right">{client.projects}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(client.revenue / client.projects)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center ${client.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {client.trend > 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                            {client.trend > 100 ? `${Math.round(client.trend)}%` : `${client.trend.toFixed(1)}%`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            client.trend > 100 ? 'bg-purple-100 text-purple-800' : 
                            client.trend > 20 ? 'bg-green-100 text-green-800' : 
                            client.trend > 0 ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {client.trend > 100 ? 'Explosive' : client.trend > 20 ? 'Growing' : client.trend > 0 ? 'Stable' : 'At Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Client Acquisition & Retention */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Client Acquisition Funnel</h3>
                  <div className="space-y-3">
                    {[
                      { stage: 'Leads', count: 45, percentage: 100, color: 'bg-blue-200' },
                      { stage: 'Qualified', count: 28, percentage: 62, color: 'bg-blue-300' },
                      { stage: 'Proposals', count: 18, percentage: 40, color: 'bg-blue-400' },
                      { stage: 'Won', count: 12, percentage: 27, color: 'bg-blue-600' }
                    ].map((stage, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{stage.stage}</span>
                          <span>{stage.count} ({stage.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className={`${stage.color} h-3 rounded-full`} style={{ width: `${stage.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Client Health Score</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={[
                      { name: 'At Risk', value: 8, fill: '#EF4444' },
                      { name: 'Stable', value: 32, fill: '#3B82F6' },
                      { name: 'Growing', value: 60, fill: '#10B981' }
                    ]}>
                      <RadialBar minAngle={15} dataKey="value" />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-around mt-4">
                    <div className="text-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Growing</p>
                      <p className="font-bold">60%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Stable</p>
                      <p className="font-bold">32%</p>
                    </div>
                    <div className="text-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">At Risk</p>
                      <p className="font-bold">8%</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* How Metrics Are Calculated */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Lightbulb className="text-blue-600" />
                  How Client Metrics Are Calculated
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📊 Percentage of Total</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Shows each client's share of total 2025 revenue
                    </p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm">
                      <p className="text-gray-600">Formula:</p>
                      <p className="text-blue-700">(Client Revenue ÷ Total YTD) × 100</p>
                      <p className="text-gray-500 mt-2">Example: 3D</p>
                      <p className="text-green-700">(228,720 ÷ 1,313,841) × 100 = 17.4%</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">📈 Year-over-Year Trend</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Compares same period (Jan 1 - Jun 22) vs 2024
                    </p>
                    <div className="bg-white rounded-lg p-3 font-mono text-sm">
                      <p className="text-gray-600">Formula:</p>
                      <p className="text-blue-700">((2025 - 2024) ÷ 2024) × 100</p>
                      <p className="text-gray-500 mt-2">Example: Mytown</p>
                      <p className="text-green-700">((114,715 - 20,733) ÷ 20,733) × 100 = +453%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">⚡ Key Insight:</span> Your overall YoY growth is 
                    <span className="font-bold text-green-700"> +23.5%</span> - very close to your 25% target! 
                    Focus on maintaining relationships with explosive growth clients like FrameMotion (+1087%) and Mytown (+453%).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Scenario Planning */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Revenue Forecast Scenarios (Full Year View)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyData2025Updated.map((month, index) => ({
                    ...month,
                    conservative: index < 6 ? month.revenue : monthlyTarget2025 * 0.9,
                    realistic: index < 6 ? month.revenue : monthlyTarget2025,
                    optimistic: index < 6 ? month.revenue : monthlyTarget2025 * 1.2
                  }))}>
                    <defs>
                      <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRealistic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#6B7280" fill="#E5E7EB" strokeWidth={2} name="Actual" />
                    <Area type="monotone" dataKey="conservative" stroke="#EF4444" fill="url(#colorConservative)" strokeWidth={2} strokeDasharray="5 5" name="Conservative" />
                    <Area type="monotone" dataKey="realistic" stroke="#3B82F6" fill="url(#colorRealistic)" strokeWidth={2} strokeDasharray="5 5" name="Realistic (25% growth)" />
                    <Area type="monotone" dataKey="optimistic" stroke="#10B981" fill="url(#colorOptimistic)" strokeWidth={2} strokeDasharray="5 5" name="Optimistic" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                  <h4 className="text-lg font-bold text-red-800 mb-2">Conservative Scenario</h4>
                  <p className="text-3xl font-bold text-red-700">RM {((revenue2025Current + (monthlyTarget2025 * 0.9 * 6)) / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-red-600 mt-2">Assumes 10% below target</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-700">❌ Misses Japan target</p>
                    <p className="text-sm text-gray-700">📉 Below 2024 performance</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-800 mb-2">Realistic Scenario</h4>
                  <p className="text-3xl font-bold text-blue-700">RM {(target2025Based2024 / 1000000).toFixed(2)}M</p>
                  <p className="text-sm text-blue-600 mt-2">Matches 2024 + 25%</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-700">✅ Achieves Japan trip!</p>
                    <p className="text-sm text-gray-700">📊 Sustainable growth</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-green-800 mb-2">Optimistic Scenario</h4>
                  <p className="text-3xl font-bold text-green-700">RM {((revenue2025Current + (monthlyTarget2025 * 1.2 * 6)) / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-green-600 mt-2">20% above target pace</p>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-700">🎯 Unlocks all rewards!</p>
                    <p className="text-sm text-gray-700">🚀 Requires major wins</p>
                  </div>
                </div>
              </div>

              {/* Action Items for Forecast */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Actions to Achieve Forecast</h3>
                
                {/* June Urgent Actions */}
                <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Urgent: June Actions ({daysRemainingInMonth} days left!)
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      Need <span className="font-bold text-red-700">{formatCurrency(gapToMonthTarget)}</span> more to hit June target
                    </p>
                    <p className="text-sm text-gray-700">
                      Target daily revenue: <span className="font-bold text-red-700">{formatCurrency(dailyNeededForTarget)}/day</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Quick wins: Close pending projects, push photobooth packages, urgent client outreach
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { priority: 'Urgent', action: `Close June deals NOW - need ${formatCurrencyShort(gapToMonthTarget)}`, deadline: 'June 30', impact: formatCurrencyShort(gapToMonthTarget) },
                    { priority: 'High', action: 'Close pending Hatch projects (RM 85k potential)', deadline: 'July 15', impact: 'RM 85k' },
                    { priority: 'High', action: 'Launch festival season packages', deadline: 'July 1', impact: 'RM 200k' },
                    { priority: 'Medium', action: 'Expand photobooth services to corporate events', deadline: 'Aug 1', impact: 'RM 150k' },
                    { priority: 'Medium', action: 'Secure 2 new retainer clients', deadline: 'Sep 1', impact: 'RM 120k' },
                    { priority: 'High', action: 'Year-end campaign preparation', deadline: 'Oct 1', impact: 'RM 300k' }
                  ].map((item, index) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.priority === 'Urgent' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        item.priority === 'Urgent' ? 'bg-red-200 text-red-800 animate-pulse' :
                        item.priority === 'High' ? 'bg-red-100 text-red-700' :
                        item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.priority}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.action}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>📅 {item.deadline}</span>
                          <span>💰 {item.impact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* AI-Powered Insights */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="text-yellow-300" size={32} />
                  <h3 className="text-2xl font-bold">AI-Powered Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                    <p className="font-semibold mb-2">🎯 Next Best Action</p>
                    <p className="text-sm">Focus on closing Hatch projects this week. Historical data shows 78% close rate when engaged within 7 days.</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                    <p className="font-semibold mb-2">📈 Revenue Opportunity</p>
                    <p className="text-sm">Festival season starting in 45 days. Last year generated RM 450k. Start preparations now!</p>
                  </div>
                </div>
              </div>

              {/* Pattern Recognition */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Pattern Recognition</h3>
                <div className="space-y-4">
                  {[
                    { pattern: 'June Performance Alert', description: `Currently at ${((currentMonthRevenue / recommendedTarget) * 100).toFixed(0)}% of target with ${daysRemainingInMonth} days left`, action: `Focus on quick wins - need ${formatCurrencyShort(dailyNeededForTarget)}/day` },
                    { pattern: 'Seasonal Peak', description: 'Q4 typically generates 35% of annual revenue', action: 'Prepare capacity for Q4 surge' },
                    { pattern: 'Client Behavior', description: 'Hatch orders spike 2 weeks before major holidays', action: 'Pre-emptive outreach scheduled' },
                    { pattern: 'June Historical Trend', description: 'June is typically 40% below average month', action: 'Push hard in final week to beat historical trend' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.pattern}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <p className="text-sm text-blue-600 mt-2">→ {item.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">⚠️ Risk Factors</h3>
                  <div className="space-y-3">
                    {[
                      { risk: 'June Revenue Drop', level: 'High', mitigation: 'Launch mid-year promotion' },
                      { risk: 'Client Concentration', level: 'Medium', mitigation: 'Diversify client base' },
                      { risk: 'Seasonal Dependency', level: 'Medium', mitigation: 'Develop off-season products' },
                      { risk: 'Competition', level: 'Low', mitigation: 'Maintain service quality' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            item.level === 'High' ? 'bg-red-500' :
                            item.level === 'Medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="font-medium">{item.risk}</span>
                        </div>
                        <span className={`text-sm px-2 py-1 rounded ${
                          item.level === 'High' ? 'bg-red-100 text-red-700' :
                          item.level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>{item.level}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Success Factors</h3>
                  <div className="space-y-3">
                    {[
                      { factor: 'Client Relationships', score: 92, trend: 'up' },
                      { factor: 'Service Quality', score: 98, trend: 'stable' },
                      { factor: 'Market Position', score: 85, trend: 'up' },
                      { factor: 'Team Performance', score: 88, trend: 'up' }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{item.factor}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{item.score}%</span>
                            {item.trend === 'up' ? (
                              <TrendingUp className="text-green-500" size={14} />
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Dashboard Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={showComparison} onChange={(e) => setShowComparison(e.target.checked)} className="rounded" />
                    <span>Show year-over-year comparison</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default time range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>Year to Date</option>
                    <option>Quarterly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency display</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option>MYR (RM)</option>
                    <option>USD ($)</option>
                  </select>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Others Detail Modal */}
        {showOthersDetail && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Other Clients Breakdown</h3>
                <button
                  onClick={() => setShowOthersDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total "Others" Revenue</span>
                  <span className="text-xl font-bold text-gray-800">{formatCurrency(380020)}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Representing {othersBreakdown.length} smaller clients (28.9% of total)
                </div>
              </div>
              
              <div className="space-y-2">
                {othersBreakdown.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.projects} project{client.projects !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">{formatCurrency(client.revenue)}</div>
                      <div className="text-sm text-gray-600">{client.percentage}% of total</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">💡 Opportunity:</span> While these clients are smaller individually, 
                  together they represent nearly 30% of revenue. Consider strategies to grow these relationships or 
                  identify which ones have expansion potential.
                </p>
              </div>
              
              <button
                onClick={() => setShowOthersDetail(false)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsPage;