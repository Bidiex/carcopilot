import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface PlanDistribution {
  name: string;
  value: number;
}

export function useDashboardMetrics() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [premiumUsers, setPremiumUsers] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  
  const [growthData, setGrowthData] = useState<ChartDataPoint[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      setTotalUsers(usersCount || 0);

      // 2. Premium users (pro)
      const { count: premiumCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'pro');
        
      setPremiumUsers(premiumCount || 0);

      // 3. Total vehicles
      const { count: vehiclesCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });
        
      setTotalVehicles(vehiclesCount || 0);

      // 4. Growth Data & Plan Distribution
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at, plan');

      if (profiles) {
        // Plan Distribution
        const planCounts = profiles.reduce((acc, p) => {
          const plan = p.plan || 'free'; // default to free if null
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const distribution = Object.keys(planCounts).map(plan => ({
          name: plan.charAt(0).toUpperCase() + plan.slice(1),
          value: planCounts[plan]
        }));
        
        setPlanDistribution(distribution);

        // Growth Data (Group by Year-Month)
        const growthCounts = profiles.reduce((acc, p) => {
          if (!p.created_at) return acc;
          const date = new Date(p.created_at);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[monthYear] = (acc[monthYear] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedMonths = Object.keys(growthCounts).sort();
        let cumulative = 0;
        // Or we can do cumulative sum. The user might want cumulative or per month. Let's do per month, 
        // as new user acquisition is a standard metric.
        const growth = sortedMonths.map(month => ({
          date: month,
          count: growthCounts[month]
        }));
        
        setGrowthData(growth);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    totalUsers,
    premiumUsers,
    totalVehicles,
    conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0',
    growthData,
    planDistribution,
    loading,
    refresh: fetchMetrics
  };
}
