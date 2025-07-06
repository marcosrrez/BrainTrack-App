
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type InsertMemory } from "@shared/schema";
import { type FacialAnalysis } from "@/lib/facial-emotion-detector";
import { Step1_Record } from "@/components/capture/Step1_Record";
import { Step2_Elaborate, type ElaborationFormData } from "@/components/capture/Step2_Elaborate";
import { Step3_Insight } from "@/components/capture/Step3_Insight";

export default function CapturePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis | null>(null);
  const [userEmotion, setUserEmotion] = useState<number | null>(null);

  const createMemoryMutation = useMutation({
    mutationFn: async (data: InsertMemory) => {
      const response = await apiRequest("POST", "/api/memories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setStep(3);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save memory",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStep1Next = (video: string, audio: string, analysis: FacialAnalysis | null) => {
    setVideoData(video);
    setAudioData(audio);
    setFacialAnalysis(analysis);
    setStep(2);
  };

  const handleStep2Submit = (data: ElaborationFormData) => {
    if (!videoData || !audioData) {
      toast({
        title: "Missing media",
        description: "Video or audio data is missing. Please go back and record again.",
        variant: "destructive",
      });
      return;
    }

    const tags = typeof data.tags === 'string' 
      ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    setUserEmotion(data.emotion);

    createMemoryMutation.mutate({
      ...data,
      tags,
      videoData,
      audioData,
      userId: user!.id,
    });
  };

  const handleStep2Back = () => {
    setStep(1);
    setVideoData(null);
    setAudioData(null);
    setFacialAnalysis(null);
  };

  const handleStep3Finish = () => {
    setLocation("/");
  };

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Capture New Memory</h1>
        <p className="text-neutral-600">
          {step === 1 && "Step 1: Record a 24-second video of your memory."}
          {step === 2 && "Step 2: Add details to help you remember."}
          {step === 3 && "Step 3: See what our AI discovered."}
        </p>
      </div>

      {step === 1 && <Step1_Record onNext={handleStep1Next} />}
      {step === 2 && (
        <Step2_Elaborate
          onSubmit={handleStep2Submit}
          onBack={handleStep2Back}
          isSubmitting={createMemoryMutation.isPending}
        />
      )}
      {step === 3 && (
        <Step3_Insight
          facialAnalysis={facialAnalysis}
          userEmotion={userEmotion}
          onFinish={handleStep3Finish}
        />
      )}
    </div>
  );
}
