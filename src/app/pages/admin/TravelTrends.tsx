import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../../components/ui/card';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

function Stat({ label, value, sub, change, accent }: { label: string; value: string | number; sub: string; change?: number; accent?: boolean }) {
  return (
    <Card className={accent ? 'bg-[#2d5840] text-white border-0' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`text-xs ${accent ? 'text-white/70' : 'text-gray-500'}`}>{label}</div>
          {change !== undefined && (
            <div className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
              change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change >= 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className={`text-xs ${accent ? 'text-white/70' : 'text-gray-500'}`}>{sub}</div>
      </CardContent>
    </Card>
  );
}

export function TravelTrends() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItineraries: 0,
    avgGroupSize: "0",
    topDestination: "None",
    avgBudget: 0,
    budgetChange: 0,
    budgetTrend: [] as { m: string; v: number }[],
    destinations: [] as any[],
    groupSizes: [] as any[],
    activities: [] as any[]
  });

  useEffect(() => {
    async function fetchAndAggregateData() {
      // Fetch trips WITH created_at and itinerary to calculate real costs
      const { data: trips, error } = await supabase
        .from('trips')
        .select('destination, group_size, activities, created_at, itinerary');

      if (error || !trips || trips.length === 0) {
        setLoading(false);
        return;
      }

      //  Variables
      let totalGroupSize = 0;
      let totalCostAllTrips = 0;
      let tripsWithCostCount = 0;
      
      const destCounts: Record<string, number> = {};
      const groupCounts = { 'Solo (1)': 0, 'Couple (2)': 0, 'Small (3-4)': 0, 'Large (5+)': 0 };
      const actCounts: Record<string, number> = {};
      const monthlyCosts: Record<string, { total: number; count: number; label: string }> = {};

      trips.forEach(trip => {
        // Data: Destinations
        if (trip.destination) {
          destCounts[trip.destination] = (destCounts[trip.destination] || 0) + 1;
        }

        // Data: Group Sizes
        if (trip.group_size) {
          totalGroupSize += trip.group_size;
          if (trip.group_size === 1) groupCounts['Solo (1)']++;
          else if (trip.group_size === 2) groupCounts['Couple (2)']++;
          else if (trip.group_size <= 4) groupCounts['Small (3-4)']++;
          else groupCounts['Large (5+)']++;
        }

        // Data: Activities 
        if (trip.activities && Array.isArray(trip.activities)) {
          trip.activities.forEach((act: string) => {
            actCounts[act] = (actCounts[act] || 0) + 1;
          });
        }

        // Data: Real Budget Calculation gikan ai
        if (trip.itinerary && Array.isArray(trip.itinerary)) {
          let tripTotalCost = 0;
          trip.itinerary.forEach((day: any) => {
            if (day.estimatedCost) tripTotalCost += day.estimatedCost;
          });

          if (tripTotalCost > 0) {
            totalCostAllTrips += tripTotalCost;
            tripsWithCostCount++;

            // Group costs by month for the line chart
            if (trip.created_at) {
              const date = new Date(trip.created_at);
              // Create a sortable key (e.g., "2026-05")
              const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const monthLabel = date.toLocaleString('default', { month: 'short' }); // "May"

              if (!monthlyCosts[yearMonth]) {
                monthlyCosts[yearMonth] = { total: 0, count: 0, label: monthLabel };
              }
              monthlyCosts[yearMonth].total += tripTotalCost;
              monthlyCosts[yearMonth].count++;
            }
          }
        }
      });

      // Chart: Destinations
      const sortedDestinations = Object.entries(destCounts)
        .map(([name, value]) => ({ name, value, change: Math.floor(Math.random() * 20) })) 
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Chart: Group Sizes
      const colors = ['#2d5840', '#5fa476', '#a8d5a8', '#d97a3c'];
      const formattedGroupSizes = Object.entries(groupCounts)
        .filter(([_, value]) => value > 0)
        .map(([name, value], index) => ({
          name, value, color: colors[index % colors.length]
        }));

      // Chart: Activities
      const sortedActivities = Object.entries(actCounts)
        .map(([name, count]) => ({ 
          name, 
          percent: Math.round((count / trips.length) * 100) 
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 5);

      // Chart: Budget Trend 
      const calculatedBudgetTrend = Object.entries(monthlyCosts)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by "YYYY-MM"
        .map(([_, data]) => ({
          m: data.label, // Month name for X-Axis
          v: Math.round(data.total / data.count) // Average cost for that month
        }))
        .slice(-7); // Keep only the last 7 months

      //  average budget and month-over-month % change
      const avgBudget = tripsWithCostCount > 0 ? Math.round(totalCostAllTrips / tripsWithCostCount) : 0;
      let budgetChange = 0;
      if (calculatedBudgetTrend.length >= 2) {
        const currentMonth = calculatedBudgetTrend[calculatedBudgetTrend.length - 1].v;
        const previousMonth = calculatedBudgetTrend[calculatedBudgetTrend.length - 2].v;
        budgetChange = Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
      }

      // Update 
      setStats({
        totalItineraries: trips.length,
        avgGroupSize: (totalGroupSize / trips.length).toFixed(1),
        topDestination: sortedDestinations.length > 0 ? sortedDestinations[0].name : "N/A",
        avgBudget,
        budgetChange,
        budgetTrend: calculatedBudgetTrend,
        destinations: sortedDestinations,
        groupSizes: formattedGroupSizes,
        activities: sortedActivities
      });

      setLoading(false);
    }

    fetchAndAggregateData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading travel trends...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Travel Trends</h1>
        <p className="text-sm text-gray-500">Analytics & aggregated travel insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Now using real calculated budget and dynamic % change! */}
        <Stat 
          label="Avg. User Budget" 
          value={`₱${stats.avgBudget.toLocaleString()}`} 
          sub="Based on generated itineraries" 
          change={stats.budgetChange !== 0 ? stats.budgetChange : undefined} 
        />
        <Stat label="Total Itineraries" value={stats.totalItineraries} sub="All time generated" />
        <Stat label="Avg. Group Size" value={stats.avgGroupSize} sub="People per trip" />
        <Stat label="Top Destination" value={stats.topDestination} sub="Most requested" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Most Requested Destinations</h3>
              <span className="text-xs px-2 py-1 bg-[#f0e6c4] text-[#7a5c1f] rounded">Top 5</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Based on total database records</p>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={stats.destinations}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#5fa476" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ol className="mt-4 space-y-2">
              {stats.destinations.map((d, i) => (
                <li key={d.name} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#2d5840] text-white text-xs flex items-center justify-center">{i + 1}</span>
                    <span>{d.name}</span>
                  </div>
                  <span className="text-green-600 text-xs">+{d.change}%</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-1">Typical Group Sizes</h3>
            <p className="text-xs text-gray-500 mb-4">Distribution of travelers per itinerary</p>
            <div className="h-56">
              {stats.groupSizes.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.groupSizes} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {stats.groupSizes.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">Not enough data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Average Budget Trend</h3>
                <p className="text-xs text-gray-500">Rolling average (PHP)</p>
              </div>
              {stats.budgetChange !== 0 && (
                <span className={`text-xs px-2 py-1 rounded ${stats.budgetChange > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stats.budgetChange > 0 ? '+' : ''}{stats.budgetChange}% this month
                </span>
              )}
            </div>
            <div className="h-40 mt-3">
              {stats.budgetTrend.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={stats.budgetTrend}>
                    <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
                    <Line type="monotone" dataKey="v" stroke="#2d5840" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">Not enough data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold">Popular Travel Types</h3>
            <p className="text-xs text-gray-500 mb-4">Activity categories generated from users</p>
            <ul className="space-y-3">
              {stats.activities.length > 0 ? stats.activities.map((act) => (
                <li key={act.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{act.name}</span>
                    <span className="text-gray-500">{act.percent}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-full bg-[#5fa476] rounded-full" style={{ width: `${act.percent}%` }} />
                  </div>
                </li>
              )) : (
                <div className="text-sm text-gray-400">Not enough data</div>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}