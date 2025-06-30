import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  Calendar, 
  Star, 
  TrendingUp, 
  Lightbulb, 
  Trophy,
  AlertCircle
} from "lucide-react";
import type { UserAnalytics, Memory } from "@shared/schema";

export default function AnalyticsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<UserAnalytics>({
    queryKey: ["/api/analytics"],
  });

  const { data: memories, isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
  });

  if (analyticsLoading || memoriesLoading) {
    return (
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate performance by category
  const categorizedMemories = memories?.reduce((acc, memory) => {
    if (!acc[memory.type]) {
      acc[memory.type] = { count: 0, totalScore: 0, avgScore: 0 };
    }
    acc[memory.type].count++;
    acc[memory.type].totalScore += memory.lastScore;
    acc[memory.type].avgScore = acc[memory.type].totalScore / acc[memory.type].count;
    return acc;
  }, {} as Record<string, { count: number; totalScore: number; avgScore: number }>) || {};

  // Generate insights based on data
  const generateInsights = () => {
    const insights = [];
    
    if (analytics) {
      if (analytics.accuracyRate < 75) {
        insights.push({
          type: 'improvement',
          title: 'Improvement Opportunity',
          description: 'Your recall accuracy could be improved. Try adding more sensory details when capturing memories.',
          icon: Lightbulb,
          color: 'blue',
        });
      } else if (analytics.accuracyRate > 90) {
        insights.push({
          type: 'success',
          title: 'Excellent Performance',
          description: 'Your recall accuracy is outstanding! Keep up the great memory practice.',
          icon: Trophy,
          color: 'green',
        });
      }

      if (analytics.reviewStreak > 7) {
        insights.push({
          type: 'success',
          title: 'Great Consistency',
          description: `You've maintained a ${analytics.reviewStreak}-day review streak. Consistency is key to memory improvement!`,
          icon: Calendar,
          color: 'green',
        });
      } else if (analytics.reviewStreak < 3) {
        insights.push({
          type: 'reminder',
          title: 'Consistency Reminder',
          description: 'Try to review memories daily to maximize retention. Even 5 minutes can make a difference.',
          icon: AlertCircle,
          color: 'yellow',
        });
      }

      // Category-specific insights
      const categoryEntries = Object.entries(categorizedMemories);
      if (categoryEntries.length > 1) {
        const sortedCategories = categoryEntries.sort((a, b) => b[1].avgScore - a[1].avgScore);
        const bestCategory = sortedCategories[0];
        const worstCategory = sortedCategories[sortedCategories.length - 1];
        
        if (bestCategory[1].avgScore - worstCategory[1].avgScore > 0.5) {
          insights.push({
            type: 'improvement',
            title: 'Category Performance Gap',
            description: `Your ${bestCategory[0]} memories perform better than ${worstCategory[0]} ones. Consider applying similar techniques across categories.`,
            icon: TrendingUp,
            color: 'blue',
          });
        }
      }
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Analytics & Insights</h1>
        <p className="text-neutral-600">Track your memory enhancement progress and patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Memory Retention</h3>
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              {analytics?.accuracyRate ? `${Math.round(analytics.accuracyRate)}%` : "0%"}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">Tracking your progress</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Review Consistency</h3>
              <Calendar className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-3xl font-bold text-secondary mb-2">
              {analytics?.reviewStreak || 0} days
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">Current streak</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800">Avg. Recall Score</h3>
              <Star className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold text-accent mb-2">
              {analytics?.avgRecallScore ? analytics.avgRecallScore.toFixed(1) : "0.0"}
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-500">Out of 3.0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recall Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-neutral-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>Chart visualization coming soon</p>
                <p className="text-sm">Your progress will be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-neutral-500">
                <Brain className="w-12 h-12 mx-auto mb-2" />
                <p>Distribution chart coming soon</p>
                <div className="text-sm mt-2">
                  {Object.entries(categorizedMemories).map(([type, data]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type}:</span>
                      <span>{data.count} memories</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Generated Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                const colorClasses = {
                  blue: "bg-blue-50 border-blue-200 text-blue-800",
                  green: "bg-green-50 border-green-200 text-green-800",
                  yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
                  red: "bg-red-50 border-red-200 text-red-800",
                };
                
                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${colorClasses[insight.color as keyof typeof colorClasses]}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm opacity-90">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance by Category */}
      {Object.keys(categorizedMemories).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(categorizedMemories).map(([type, data]) => {
                const percentage = (data.avgScore / 3) * 100;
                const colorClass = percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500";
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 ${colorClass} rounded-full`} />
                      <span className="font-medium text-neutral-700 capitalize">{type}</span>
                      <span className="text-sm text-neutral-500">({data.count} memories)</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-neutral-700 w-12">
                        {data.avgScore.toFixed(1)}/3
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
