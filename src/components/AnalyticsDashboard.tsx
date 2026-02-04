import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  BarChart,
  TrendingUp,
  Hash,
  Calendar,
  Star,
  Zap,
  X,
} from "lucide-react";
import {
  getAnalytics,
  getDailyStats,
  getUsageStreak,
  resetAnalytics,
} from "@/lib/analytics";

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsDashboard({
  isOpen,
  onClose,
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState(getAnalytics());
  const [dailyStats, setDailyStats] = useState(getDailyStats(7));
  const [streak, setStreak] = useState(getUsageStreak());

  useEffect(() => {
    if (isOpen) {
      refreshAnalytics();
    }
  }, [isOpen]);

  const refreshAnalytics = () => {
    setAnalytics(getAnalytics());
    setDailyStats(getDailyStats(7));
    setStreak(getUsageStreak());
  };

  const totalLast7Days = dailyStats.reduce((sum, day) => sum + day.count, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshAnalytics}>
              Refresh
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="text-2xl font-bold">{analytics.totalTweetsGenerated}</div>
              <div className="text-xs text-muted-foreground">Total Tweets</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{analytics.favoriteCount}</div>
              <div className="text-xs text-muted-foreground">Favorites</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{totalLast7Days}</div>
              <div className="text-xs text-muted-foreground">Last 7 Days</div>
            </Card>
          </div>

          {/* Style Breakdown */}
          {Object.keys(analytics.tweetsByStyle).length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Tweets by Style</h3>
              <div className="space-y-2">
                {Object.entries(analytics.tweetsByStyle)
                  .sort(([, a], [, b]) => b - a)
                  .map(([style, count]) => (
                    <div key={style} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{style}</span>
                          <span className="text-muted-foreground">
                            {count} tweets
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(count / analytics.totalTweetsGenerated) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Daily Activity Chart (Simple Bar) */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Last 7 Days Activity</h3>
            <div className="flex items-end justify-between gap-2 h-32">
              {dailyStats.map((day) => {
                const maxCount = Math.max(...dailyStats.map((d) => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <div className="text-xs text-muted-foreground text-center truncate w-full">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "narrow",
                      })}
                    </div>
                    <div className="text-xs text-center font-medium">
                      {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Most Used Topics */}
          {analytics.mostUsedTopics.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Recent Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {analytics.mostUsedTopics.slice(0, 10).map((topic, index) => (
                  <span
                    key={index}
                    className="text-xs px-3 py-1 bg-secondary rounded-full"
                  >
                    {topic.length > 20 ? topic.substring(0, 20) + "..." : topic}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Reset Analytics */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Reset all analytics data? This cannot be undone.")) {
                  resetAnalytics();
                  refreshAnalytics();
                }
              }}
            >
              Reset Analytics
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
