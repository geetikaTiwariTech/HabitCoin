import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

export default function ParentReports() {
  const [selectedChild, setSelectedChild] = useState<string>("");

  const { data: rewards = [] } = useQuery({
    queryKey: ["rewards-report"],
    queryFn: async () => {
      const res = await fetch("/api/reports/rewards", { credentials: "include" });
      return res.json();
    },
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["top-rules", selectedChild],
    queryFn: async () => {
      const query = selectedChild && selectedChild !== "all" ? `?child=${selectedChild}` : "";
      const res = await fetch(`/api/reports/top-rules${query}`, { credentials: "include" });
      return res.json();
    },
    keepPreviousData: true
  });
  

  const { data: pointsTrend = [] } = useQuery({
    queryKey: ["points-trend", selectedChild],
    queryFn: async () => {
      const query = selectedChild && selectedChild !== "all" ? `?child=${selectedChild}` : "";
      const res = await fetch(`/api/reports/points-trend${query}`, { credentials: "include" });
      return res.json();
    },
    keepPreviousData: true
  });

  const { data: topBadges = [] } = useQuery({
    queryKey: ["top-badges", selectedChild],
    queryFn: async () => {
      const query = selectedChild && selectedChild !== "all" ? `?child=${selectedChild}` : "";
      const res = await fetch(`/api/reports/top-badges${query}`, { credentials: "include" });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid badge data");
      return data;
    },
  });
  

  const childNames = [...new Set(rewards.map(r => r.child))];

  const filteredRewards = selectedChild && selectedChild !== "all"
    ? rewards.filter((r) => r.child === selectedChild)
    : rewards;

  return (
    <div className="py-6 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Child Report</h2>
          <p className="text-gray-600">Visualize engagement, rewards, and performance</p>
        </div>
        <Select value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Child" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childNames.map((child) => (
              <SelectItem key={child} value={child}>{child}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Rules for Earning Points</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rules}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Points Trend Over Time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pointsTrend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="points" stroke="#22c55e" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
  <CardHeader>
    <CardTitle className="text-xl font-semibold text-gray-800">Top Earned Badges</CardTitle>
  </CardHeader>
  <CardContent className="h-[22rem]">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          {topBadges.map((_, index) => (
            <linearGradient id={`grad-${index}`} key={index} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.7} />
              <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
            </linearGradient>
          ))}
        </defs>

        <Pie
          data={topBadges}
          dataKey="count"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          isAnimationActive
          cornerRadius={8}
          labelLine={false}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fill="#333"
              >
                {(percent * 100).toFixed(0)}%
              </text>
            );
          }}
        >
          {topBadges.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#grad-${index})`}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value: any, name: any) => [`${value} earned`, name]}
          contentStyle={{
            borderRadius: 10,
            fontSize: 13,
            color: "#333",
          }}
        />

        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => (
            <span style={{ fontSize: 14, color: "#555" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  </CardContent>
</Card>




        <Card>
          <CardHeader><CardTitle>Redeemed Rewards</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Child</th>
                  <th className="py-2 text-left">Reward</th>
                  <th className="py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRewards.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2">{r.child}</td>
                    <td className="py-2">{r.reward}</td>
                    <td className="py-2">{new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
