import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { getReviewDifficulty } from "@/lib/spaced-repetition";
import type { Memory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  RotateCcw,
  CheckCircle,
  Lightbulb,
  Clock,
  Brain,
  Target,
  TrendingUp
} from "lucide-react";
import { ProgressiveDisclosure } from "@/components/progressive-disclosure";

import { RetrievalPractice } from "@/components/RetrievalPractice";

interface ReviewSession {
  memories: Memory[];
  currentIndex: number;
  phase: 'pre-review' | 'review' | 'completed';
  retrievalAttempt: string | null;
}

export default function ReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [session, setSession] = useState<ReviewSession>({
    memories: [],
    currentIndex: 0,
    phase: 'pre-review',
    retrievalAttempt: null,
  });
  
  const [reviewNotes, setReviewNotes] = useState("");
  const [elaborativeNotes, setElaborativeNotes] = useState("");

  // Educational content for review page
  const reviewEducationItems = [
    {
      id: 'active-recall',
      title: 'The Power of Active Recall',
      preview: 'Why testing yourself is more effective than re-reading',
      category: 'memory-science' as const,
      importance: 'high' as const,
      icon: Brain,
      content: (
        <div className="space-y-3">
          <p>
            <strong>Active recall</strong> - trying to remember information without looking at it - is one of 
            the most effective learning techniques, backed by extensive research.
          </p>
          <p>
            When you attempt to recall a memory before viewing it, you strengthen the neural pathways 
            more than passive review. This is why we ask you to think first, then watch.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Even if you can't remember everything perfectly, the act of trying 
              to recall strengthens the memory for future reviews.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'elaborative-notes',
      title: 'Elaborative Processing',
      preview: 'How connecting memories to other experiences strengthens them',
      category: 'memory-science' as const,
      importance: 'medium' as const,
      icon: Target,
      content: (
        <div className="space-y-3">
          <p>
            <strong>Elaborative processing</strong> involves connecting new information to existing knowledge. 
            The reflection questions help you build these connections.
          </p>
          <p>
            When you connect a memory to other experiences, emotions, or knowledge, you create multiple 
            retrieval pathways, making the memory more accessible and durable.
          </p>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Your Notes:</strong> The connections you write become part of the memory record, 
              helping you recall both the original experience and related insights.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'difficulty-ratings',
      title: 'Memory Difficulty Scoring',
      preview: 'How your ratings optimize future review scheduling',
      category: 'feature-explanation' as const,
      importance: 'medium' as const,
      icon: TrendingUp,
      content: (
        <div className="space-y-3">
          <p>Your difficulty ratings directly influence when you'll see each memory again:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="font-medium text-red-800">Again (0)</div>
              <div className="text-sm text-red-700">Review in 1 day</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="font-medium text-yellow-800">Hard (1)</div>
              <div className="text-sm text-yellow-700">Review in 3 days</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-800">Good (2)</div>
              <div className="text-sm text-green-700">Review in 1-2 weeks</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-800">Easy (3)</div>
              <div className="text-sm text-blue-700">Review in 1+ months</div>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Be honest with your ratings - this helps the algorithm optimize your review schedule.
          </p>
        </div>
      )
    }
  ];

  const { data: dueMemories, isLoading } = useQuery<Memory[]>({
    queryKey: ["/api/memories/due"],
  });

  useEffect(() => {
    if (dueMemories && dueMemories.length > 0) {
      // Shuffle the memories to introduce interleaving
      const shuffledMemories = [...dueMemories].sort(() => Math.random() - 0.5);
      setSession(prev => ({
        ...prev,
        memories: shuffledMemories,
        currentIndex: 0,
        phase: 'pre-review',
        retrievalAttempt: null,
      }));
    }
  }, [dueMemories]);

  const submitReviewMutation = useMutation({
    mutationFn: async ({ memoryId, score, notes }: { memoryId: number; score: number; notes?: string }) => {
      const response = await apiRequest("POST", `/api/memories/${memoryId}/review`, { score, notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories/due"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      
      // Move to next memory or complete session
      if (session.currentIndex + 1 < session.memories.length) {
        setSession(prev => ({
          ...prev,
          currentIndex: prev.currentIndex + 1,
          phase: 'pre-review',
        }));
        setReviewNotes("");
        setElaborativeNotes("");
      } else {
        setSession(prev => ({ ...prev, phase: 'completed' }));
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startReview = () => {
    setSession(prev => ({ ...prev, phase: 'review' }));
  };

  const submitScore = (score: number) => {
    const currentMemory = session.memories[session.currentIndex];
    const notes = [
      `Retrieval attempt: ${session.retrievalAttempt}`,
      `Review notes: ${reviewNotes}`,
      `Elaborative notes: ${elaborativeNotes}`,
    ].filter(Boolean).join('\n\n');
    
    submitReviewMutation.mutate({
      memoryId: currentMemory.id,
      score,
      notes,
    });

    toast({
      title: "Review submitted",
      description: `Memory scored as "${getReviewDifficulty(score).label}"`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardContent className="p-8">
            <Skeleton className="h-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dueMemories || (dueMemories as Memory[]).length === 0) {
    return (
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Memory Review</h1>
          <p className="text-neutral-600">Strengthen your memories through spaced repetition</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">All caught up!</h3>
            <p className="text-neutral-600 mb-6">
              You don't have any memories due for review right now. 
              Great job staying on top of your memory practice!
            </p>
            <Button variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              Check back later
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.phase === 'completed') {
    return (
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Review Complete!</h1>
          <p className="text-neutral-600">Great job completing your review session</p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">Session Complete</h3>
            <p className="text-neutral-600 mb-6">
              You've reviewed {session.memories.length} memories. Your brain is getting stronger!
            </p>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Review More
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMemory = session.memories[session.currentIndex];
  const progress = ((session.currentIndex + 1) / session.memories.length) * 100;

  // Add safety check for currentMemory
  if (!currentMemory) {
    return (
      <div className="space-y-8 pb-20 md:pb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">Memory Review</h1>
          <p className="text-neutral-600">Loading memory...</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <Skeleton className="h-48" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Memory Review</h1>
        <p className="text-neutral-600">Strengthen your memories through spaced repetition</p>
      </div>

      {/* Review Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-800">Review Progress</h3>
            <span className="text-sm text-neutral-600">
              {session.currentIndex + 1} of {session.memories.length} completed
            </span>
          </div>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {/* Review Card */}
      {session.phase === 'pre-review' && (
        <RetrievalPractice
          memoryTitle={currentMemory.title}
          onSubmit={(retrievalAttempt) => {
            setSession(prev => ({ ...prev, phase: 'review', retrievalAttempt }));
          }}
        />
      )}

      {session.phase === 'review' && (
        <>
          <Card>
            {/* Memory Info */}
            <div className="bg-neutral-50 p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-800">{currentMemory.title}</h3>
                  <p className="text-sm text-neutral-600">
                    Created {new Date(currentMemory.createdAt).toLocaleDateString()} • {currentMemory.type}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${currentMemory.type === 'personal' ? 'bg-blue-100 text-blue-800' :
                    currentMemory.type === 'social' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {currentMemory.type}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {currentMemory.emotion}/10
                  </Badge>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Media Playback */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Video */}
                {currentMemory.videoData && (
                  <div>
                    <h4 className="font-medium text-neutral-700 mb-3">Video Playback</h4>
                    <div className="relative bg-neutral-900 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        controls
                        src={currentMemory.videoData}
                      />
                    </div>
                  </div>
                )}

                {/* Audio */}
                {currentMemory.audioData && (
                  <div>
                    <h4 className="font-medium text-neutral-700 mb-3">Audio Playback</h4>
                    <div className="bg-neutral-100 rounded-lg p-6">
                      <div className="flex items-center justify-center mb-4">
                        <Button
                          variant="default"
                          size="lg"
                          className="w-16 h-16 rounded-full bg-secondary hover:bg-secondary/90"
                          onClick={() => audioRef.current?.play()}
                        >
                          <Play className="w-6 h-6 text-white" />
                        </Button>
                      </div>
                      <audio ref={audioRef} src={currentMemory.audioData} />
                      <div className="flex justify-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-secondary rounded-full"
                            style={{ height: `${20 + Math.random() * 20}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Memory Details */}
              <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                <h4 className="font-medium text-neutral-800 mb-3">Memory Details</h4>
                <p className="text-neutral-700 mb-4">{currentMemory.description}</p>
                {currentMemory.location && (
                  <p className="text-sm text-neutral-600 mb-2">
                    <strong>Location:</strong> {currentMemory.location}
                  </p>
                )}
                {currentMemory.tags && currentMemory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentMemory.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Elaborative Prompts */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Reflection Questions
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-700 mb-2">What additional details do you remember now?</p>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="border-blue-200 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any new details or insights..."
                    />
                  </div>
                  <div>
                    <p className="text-blue-700 mb-2">How does this memory connect to other experiences?</p>
                    <Textarea
                      value={elaborativeNotes}
                      onChange={(e) => setElaborativeNotes(e.target.value)}
                      rows={3}
                      className="border-blue-200 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe connections to other memories or experiences..."
                    />
                  </div>
                </div>
              </div>

              {/* Scoring */}
              <div className="text-center">
                <h4 className="font-medium text-neutral-800 mb-4">How well did you recall this memory?</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((score) => {
                    const difficulty = getReviewDifficulty(score);
                    const colorClasses = {
                      red: "bg-red-100 text-red-700 hover:bg-red-200",
                      yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                      green: "bg-green-100 text-green-700 hover:bg-green-200",
                      blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
                    };

                    return (
                      <Button
                        key={score}
                        onClick={() => submitScore(score)}
                        disabled={submitReviewMutation.isPending}
                        className={`py-6 ${colorClasses[difficulty.color as keyof typeof colorClasses]}`}
                        variant="ghost"
                      >
                        <div className="text-center">
                          <div className="font-medium">{difficulty.label}</div>
                          <div className="text-xs mt-1">{difficulty.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Educational Content - only show during review phase */}
          <ProgressiveDisclosure
            items={reviewEducationItems}
            title="Review Science"
            subtitle="Understanding the cognitive principles behind effective review"
            maxInitialItems={1}
          />
        </>
      )}
    </div>
  );
}