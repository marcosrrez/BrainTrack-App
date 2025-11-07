
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MediaRecorderHelper, formatTime } from "@/lib/media-recorder";
import { FacialEmotionDetector, type FacialAnalysis } from "@/lib/facial-emotion-detector";
import { Video, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Props {
  onNext: (videoData: string, audioData: string, facialAnalysis: FacialAnalysis | null) => void;
}

export function Step1_Record({ onNext }: Props) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorderHelper | null>(null);
  const emotionDetectorRef = useRef<FacialEmotionDetector | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [time, setTime] = useState(0);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis | null>(null);

  // Comprehensive cleanup function
  const cleanupResources = () => {
    try {
      // Cleanup media recorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.cleanup();
      }

      // Cleanup emotion detector
      if (emotionDetectorRef.current) {
        emotionDetectorRef.current.cleanup();
      }

      // Cleanup video element
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (error) {
              console.error('Error stopping track:', error);
            }
          });
          videoRef.current.srcObject = null;
        }
      }

      console.log('Step1_Record cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  useEffect(() => {
    // Initialize media recorder
    mediaRecorderRef.current = new MediaRecorderHelper({
      videoDuration: 24,
      audioDuration: 8,
      onVideoData: setVideoData,
      onAudioData: setAudioData,
      onVideoTimer: setTime,
      onAudioTimer: () => {}, // We only show one timer
    });

    // Initialize emotion detector
    emotionDetectorRef.current = new FacialEmotionDetector();

    // Add beforeunload cleanup to prevent memory leaks on page navigation
    const handleBeforeUnload = () => {
      cleanupResources();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupResources();
    };
  }, []);

  const startRecording = async () => {
    if (isStarting || isRecording) return;

    setIsStarting(true);
    try {
      if (!mediaRecorderRef.current) {
        throw new Error('MediaRecorder not initialized');
      }

      // Start video and audio recording
      await mediaRecorderRef.current.startVideoRecording();
      await mediaRecorderRef.current.startAudioRecording();

      setIsRecording(true);
      setHasVideoAccess(true);

      const stream = mediaRecorderRef.current.getVideoStream();
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Initialize facial emotion detection
        try {
          if (emotionDetectorRef.current) {
            await emotionDetectorRef.current.initialize(videoRef.current);
            emotionDetectorRef.current.startAnalysis(setFacialAnalysis);
          }
        } catch (emotionError) {
          console.warn('Facial emotion detection failed:', emotionError);
          // Continue without emotion detection
        }
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);

      // Cleanup on error
      cleanupResources();
      setIsRecording(false);
      setHasVideoAccess(false);

      toast({
        title: "Recording failed",
        description: error.message || "Please allow camera and microphone access.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const stopRecording = () => {
    if (isStopping || !isRecording) return;

    setIsStopping(true);
    try {
      // Stop video recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stopVideoRecording();
      }

      // Stop emotion analysis
      if (emotionDetectorRef.current) {
        emotionDetectorRef.current.stopAnalysis();
      }

      // Stop video element and tracks
      if (videoRef.current) {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (error) {
              console.error('Error stopping track:', error);
            }
          });
        }
        videoRef.current.srcObject = null;
      }

      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: "Error stopping recording",
        description: "An error occurred while stopping the recording.",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  useEffect(() => {
    if (videoData) {
      onNext(videoData, audioData || '', facialAnalysis);
    }
  }, [videoData, audioData, facialAnalysis, onNext]);

  const progress = (time / 24) * 100;
  const isButtonDisabled = isStarting || isStopping;

  return (
    <ErrorBoundary>
      <Card>
      <CardContent className="pt-6">
        <div className="relative bg-neutral-900 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!hasVideoAccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800/50">
              <div className="text-center text-white">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <p>Click to start recording</p>
              </div>
            </div>
          )}
        </div>
        {isRecording && <Progress value={progress} className="mb-4" />}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-neutral-600">{formatTime(time)} / 0:24</span>
        </div>
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          className="w-full"
          disabled={isButtonDisabled}
        >
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : isStopping ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Stopping...
            </>
          ) : isRecording ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Video className="w-4 h-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>
      </CardContent>
    </Card>
    </ErrorBoundary>
  );
}
