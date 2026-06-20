"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Zap, DollarSign } from "lucide-react";
import { Card, Badge } from "@/components/ui";

const stats = [
  { icon: Users, label: "Active Users", value: "12,480", delta: "+12.5%" },
  { icon: Zap, label: "API Calls", value: "1.2M", delta: "+8.2%" },
  { icon: DollarSign, label: "Revenue", value: "$48.2k", delta: "+23.1%" },
  { icon: TrendingUp, label: "Conversion", value: "84.3%", delta: "+4.4%" },
];

// Demo data for the bar chart.
const bars = [40, 65, 50, 80, 60, 95, 75, 88, 70, 100, 85, 92];
const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const activity = [
  { who: "Ada Lovelace", what: "completed an AI interview", when: "2m ago" },
  { who: "Alan Turing", what: "uploaded 3 documents", when: "18m ago" },
  { who: "Grace Hopper", what: "started a new project", when: "1h ago" },
  { who: "Katherine Johnson", what: "exported a report", when: "3h ago" },
];

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted">Live overview of your workspace.</p>
        </div>
        <Badge>
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-2" />
          Real-time
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <s.icon className="h-5 w-5 text-accent" />
                <span className="text-xs font-medium text-accent-2">
                  {s.delta}
                </span>
              </div>
              <div className="mt-4 text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <h3 className="mb-6 font-semibold">Activity over time</h3>
          <div className="flex h-56 items-end justify-between gap-2">
            {bars.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 60 }}
                  className="w-full rounded-t-md bg-gradient-to-t from-accent/40 to-accent"
                />
                <span className="text-xs text-muted">{months[i]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <div className="space-y-4">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-medium">
                  {a.who
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="text-sm">
                  <p>
                    <span className="font-medium">{a.who}</span>{" "}
                    <span className="text-muted">{a.what}</span>
                  </p>
                  <p className="text-xs text-muted">{a.when}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
