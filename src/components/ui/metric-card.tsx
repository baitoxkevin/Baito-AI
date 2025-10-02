import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp, 
  className 
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm hover:shadow-md transition-all border overflow-hidden",
        className
      )}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
              
              {trend && (
                <p className={cn(
                  "text-xs flex items-center mt-2",
                  trendUp 
                    ? "text-green-600 dark:text-green-400" 
                    : trendUp === false 
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-500 dark:text-slate-400"
                )}>
                  {trendUp !== undefined && (
                    trendUp 
                      ? <TrendingUp className="h-3 w-3 mr-1" /> 
                      : <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {trend}
                </p>
              )}
            </div>
            
            <div className="rounded-lg p-2 bg-slate-100 dark:bg-slate-800">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}