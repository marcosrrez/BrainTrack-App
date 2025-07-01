import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemoryCard } from "@/components/memory-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";
import { 
  Brain, 
  Clock, 
  Flame, 
  Target, 
  Video, 
  RotateCcw,
  Calendar,
  TrendingUp
} from "lucide-react";
import type { Memory, UserAnalytics } from "@shared/schema";
import { getMemoriesOnThisDay } from "@/lib/spaced-repetition";
import { ProgressiveDisclosure, type DisclosureItem } from "@/components/progressive-disclosure"; // Ensure this component exists

// Define educational items
const dashboardEducationItems: DisclosureItem[] = [
  {
    id: "welcome",
    title: "Welcome to MemoryBoost!",
    content: "MemoryBoost is designed to help you enhance your memory using spaced repetition and other techniques.",
    preview: "Learn about MemoryBoost",
    icon: Brain,
    category: "feature-explanation",
    importance: "high",
  },
  {
    id: "spaced-repetition",
    title: "The Science of Spaced Repetition",
    content: "Spaced repetition involves reviewing information at increasing intervals. This technique leverages the forgetting curve to optimize memory retention.",
    preview: "Learn about spaced repetition",
    icon: Clock,
    category: "memory-science",
    importance: "high",
  },
  {
    id: "data-usage",
    title: "How MemoryBoost Uses Your Data",
    content: "MemoryBoost analyzes your performance to personalize your review schedule. This ensures you review memories when they're most likely to be forgotten, maximizing learning efficiency.",
    preview: "Learn about data usage",
    icon: Target,
    category: "data-usage",
    importance: "high",
  },
  {
    id: "tracking-progress",
    title: "Tracking Your Progress",
    content: "Monitor your review streak and accuracy rate to track your memory enhancement journey. Consistent effort leads to better results!",
    preview: "Learn about progress tracking",
    icon: TrendingUp,
    category: "feature-explanation",
    importance: "medium",
  },
  {
    id: "capture-new-memories",
    title: "Capture New Memories Regularly",
    content: "The more memories you capture, the more you'll benefit from the spaced repetition system. Make it a habit to record new video and audio memories.",
    preview: "Learn about capturing memories",
    icon: Video,
    category: "feature-explanation",
    importance: "high",
  },
];


export default function Dashboard() {
  const { user } = useAuth();

  const { data: memories, isLoading: memoriesLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<UserAnalytics>({
    queryKey: ["/api/analytics"],
  });

  const { data: dueMemories, isLoading: dueLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories/due"],
  });

  const recentMemories = memories?.slice(0, 5) || [];
  const onThisDayMemories = memories ? getMemoriesOnThisDay(memories) : [];

  const firstName = user?.name.split(" ")[0] || "there";

  if (memoriesLoading || analyticsLoading) {
    return (
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">
          Welcome back, {firstName}
        </h1>
        <p className="text-neutral-600">Continue your memory enhancement journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Memories</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {analytics?.totalMemories || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Due for Review</p>
                <p className="text-2xl font-bold text-accent">
                  {analytics?.dueForReview || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Review Streak</p>
                <p className="text-2xl font-bold text-secondary">
                  {analytics?.reviewStreak || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Accuracy Rate</p>
                <p className="text-2xl font-bold text-secondary">
                  {analytics?.accuracyRate ? `${Math.round(analytics.accuracyRate)}%` : "0%"}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Ready to Review?</h3>
                <p className="text-primary-100 mb-4">
                  You have {analytics?.dueForReview || 0} memories due for review
                </p>
                <Link href="/review">
                  <Button variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start Review
                  </Button>
                </Link>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <RotateCcw className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-secondary to-secondary/80 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Capture New Memory</h3>
                <p className="text-secondary-100 mb-4">
                  Record a new video and audio memory
                </p>
                <Link href="/capture">
                  <Button variant="secondary">
                    <Video className="w-4 h-4 mr-2" />
                    Start Capture
                  </Button>
                </Link>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Video className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* On This Day */}
      {onThisDayMemories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 text-accent mr-2" />
              On This Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onThisDayMemories.slice(0, 3).map((memory) => (
                <MemoryCard key={memory.id} memory={memory} showActions={false} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Memories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Memories</CardTitle>
            <Button variant="ghost" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentMemories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600 mb-4">No memories yet</p>
              <Link href="/capture">
                <Button>
                  <Video className="w-4 h-4 mr-2" />
                  Create Your First Memory
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMemories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educational Content */}
      <ProgressiveDisclosure 
        items={dashboardEducationItems}
        title="Understanding MemoryBoost"
        subtitle="Learn about the science behind your memory enhancement"
        showProgress={true}
        maxInitialItems={1}
      />
    </div>
  );
}