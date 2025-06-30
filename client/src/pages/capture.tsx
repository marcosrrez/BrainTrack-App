import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MediaRecorderHelper, formatTime } from "@/lib/media-recorder";
import { FacialEmotionDetector, type FacialAnalysis } from "@/lib/facial-emotion-detector";
import { apiRequest } from "@/lib/queryClient";
import { insertMemorySchema, type InsertMemory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Video, 
  Mic, 
  Square, 
  Play, 
  Save,
  FileText,
  Brain,
  Eye
} from "lucide-react";
import { useLocation } from "wouter";

interface CaptureFormData {
  title: string;
  description: string;
  emotion: number;
  type: "personal" | "social" | "educational";
  location: string;
  tags: string;
}

export default function CapturePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorderHelper | null>(null);

  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis | null>(null);
  const [emotionDetector] = useState(() => new FacialEmotionDetector());
  const [realTimeEmotions, setRealTimeEmotions] = useState<any[]>([]);

  const form = useForm<CaptureFormData>({
    resolver: zodResolver(insertMemorySchema.omit({ userId: true, videoData: true, audioData: true, tags: true }).extend({
      tags: z.string().optional()
    })),
    defaultValues: {
      title: "",
      description: "",
      emotion: 5,
      type: "personal",
      location: "",
      tags: "",
    },
  });

  useEffect(() => {
    mediaRecorderRef.current = new MediaRecorderHelper({
      videoDuration: 24,
      audioDuration: 8,
      onVideoData: setVideoData,
      onAudioData: setAudioData,
      onVideoTimer: setVideoTime,
      onAudioTimer: setAudioTime,
    });

    return () => {
      mediaRecorderRef.current?.cleanup();
    };
  }, []);

  const createMemoryMutation = useMutation({
    mutationFn: async (data: InsertMemory) => {
      const response = await apiRequest("POST", "/api/memories", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Memory saved!",
        description: "Your memory has been successfully captured and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save memory",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startVideoRecording = async () => {
    try {
      await mediaRecorderRef.current?.startVideoRecording();
      setIsVideoRecording(true);
      setHasVideoAccess(true);

      // Show video stream in preview
      const stream = mediaRecorderRef.current?.getVideoStream();
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Initialize facial emotion detection
        try {
          await emotionDetector.initialize(videoRef.current);
          emotionDetector.startAnalysis((analysis) => {
            setFacialAnalysis(analysis);
            setRealTimeEmotions(prev => [...prev.slice(-10), analysis.emotions]); // Keep last 10 readings
          });
        } catch (emotionError) {
          console.warn('Facial emotion detection failed:', emotionError);
          // Continue without facial analysis
        }
      }
    } catch (error) {
      toast({
        title: "Camera access failed",
        description: "Please allow camera and microphone access to record videos.",
        variant: "destructive",
      });
    }
  };

  const stopVideoRecording = () => {
    mediaRecorderRef.current?.stopVideoRecording();
    setIsVideoRecording(false);

    // Stop facial emotion detection
    emotionDetector.stopAnalysis();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      emotionDetector.cleanup();
    };
  }, [emotionDetector]);

  const startAudioRecording = async () => {
    try {
      await mediaRecorderRef.current?.startAudioRecording();
      setIsAudioRecording(true);
    } catch (error) {
      toast({
        title: "Microphone access failed",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stopAudioRecording();
    setIsAudioRecording(false);
  };

  const compressBlob = async (blob: Blob, maxSize: number = 10 * 1024 * 1024): Promise<Blob> => {
    if (blob.size <= maxSize) return blob;

    // For video/audio, we'll reduce quality
    if (blob.type.startsWith('video/')) {
      // Create a canvas to compress video (simplified approach)
      return blob; // For now, return as-is
    }

    return blob;
  };

  const onSubmit = async (data: CaptureFormData) => {
    if (!videoData && !audioData) {
      toast({
        title: "No media recorded",
        description: "Please record at least video or audio before saving.",
        variant: "destructive",
      });
      return;
    }

    const tags = typeof data.tags === 'string' 
      ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];


    // Compress media files if they're too large
    let processedAudioData = audioData;
    let processedVideoData = videoData;
	let audioBlob = null;
	let videoBlob = null;

	if(audioData){
		audioBlob = await (await fetch(audioData)).blob()
	}
	if(videoData){
		videoBlob = await (await fetch(videoData)).blob()
	}


    if (audioBlob && audioBlob.size > 10 * 1024 * 1024) { // 10MB limit
      const processedAudioBlob = await compressBlob(audioBlob);
      if (processedAudioBlob.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Audio file is too large. Please record a shorter clip.",
          variant: "destructive",
        });
        return;
      }
	  processedAudioData = URL.createObjectURL(processedAudioBlob);
    }

    if (videoBlob && videoBlob.size > 20 * 1024 * 1024) { // 20MB limit
      const processedVideoBlob = await compressBlob(videoBlob);
      if (processedVideoBlob.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video file is too large. Please record a shorter clip.",
          variant: "destructive",
        });
        return;
      }
	   processedVideoData = URL.createObjectURL(processedVideoBlob);
    }



    createMemoryMutation.mutate({
      ...data,
      tags,
      videoData: processedVideoData,
      audioData: processedAudioData,
    });
  };

  const videoProgress = (videoTime / 24) * 100;
  const audioProgress = (audioTime / 8) * 100;

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">Capture New Memory</h1>
        <p className="text-neutral-600">
          Record a 24-second video and 8-second audio to enhance your memory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recording Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recording</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Recording */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Video (24 seconds)</Label>
                <div className="flex items-center space-x-2">
                  {isVideoRecording && (
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <span className="text-sm text-neutral-600">{formatTime(videoTime)}</span>
                </div>
              </div>

              <div className="relative bg-neutral-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                {!hasVideoAccess && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/50">
                    <div className="text-center text-white">
                      <Video className="w-12 h-12 mx-auto mb-2" />
                      <p>Click to start video recording</p>
                    </div>
                  </div>
                )}
              </div>

              {isVideoRecording && (
                <Progress value={videoProgress} className="mb-4" />
              )}

              {/* Real-time emotion analysis */}
              {facialAnalysis && isVideoRecording && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Emotion Detection</span>
                    <Badge variant="secondary" className="text-xs">
                      {facialAnalysis.detected ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {facialAnalysis.detected && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Dominant Emotion:</span>
                        <Badge variant="outline" className="capitalize">
                          {facialAnalysis.emotions.dominantEmotion}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Attention:</span>
                          <span>{Math.round(facialAnalysis.attentionLevel * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Engagement:</span>
                          <span>{Math.round(facialAnalysis.engagementScore * 100)}%</span>
                        </div>
                      </div>

                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(facialAnalysis.emotions)
                          .filter(([key]) => !['dominantEmotion', 'confidence'].includes(key))
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([emotion, value]) => (
                            <Badge key={emotion} variant="secondary" className="text-xs capitalize">
                              {emotion}: {Math.round(value * 100)}%
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={startVideoRecording}
                  disabled={isVideoRecording}
                  className="flex-1"
                  variant={isVideoRecording ? "secondary" : "default"}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {isVideoRecording ? "Recording..." : "Start Video"}
                </Button>
                <Button
                  onClick={stopVideoRecording}
                  disabled={!isVideoRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>

            {/* Audio Recording */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Audio (8 seconds)</Label>
                <div className="flex items-center space-x-2">
                  {isAudioRecording && (
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <span className="text-sm text-neutral-600">{formatTime(audioTime)}</span>
                </div>
              </div>

              <div className="bg-neutral-100 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-neutral-300 rounded-full flex items-center justify-center">
                    <Mic className="w-6 h-6 text-neutral-600" />
                  </div>
                </div>
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isAudioRecording
                          ? "bg-secondary animate-pulse"
                          : "bg-neutral-300"
                      }`}
                      style={{ height: `${20 + Math.random() * 20}px` }}
                    />
                  ))}
                </div>
              </div>

              {isAudioRecording && (
                <Progress value={audioProgress} className="mb-4" />
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={startAudioRecording}
                  disabled={isAudioRecording}
                  className="flex-1"
                  variant={isAudioRecording ? "secondary" : "default"}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {isAudioRecording ? "Recording..." : "Start Audio"}
                </Button>
                <Button
                  onClick={stopAudioRecording}
                  disabled={!isAudioRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Details Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Memory Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Give your memory a title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what happened, your thoughts, or key details"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emotion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotion Rating: {field.value}/10</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <p className="text-xs text-neutral-500">
                        Rate the emotional intensity of this memory
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Memory Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select memory type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Where did this happen?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Add tags separated by commas" {...field} />
                      </FormControl>
                      <p className="text-xs text-neutral-500">
                        Tags help categorize and find your memories later
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMemoryMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createMemoryMutation.isPending ? "Saving..." : "Save Memory"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}