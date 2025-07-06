
import { useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MediaRecorderHelper, formatTime } from "@/lib/media-recorder";
import { FacialEmotionDetector, type FacialAnalysis } from "@/lib/facial-emotion-detector";
import { Video, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  onNext: (videoData: string, audioData: string, facialAnalysis: FacialAnalysis | null) => void;
}

export function Step1_Record({ onNext }: Props) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorderHelper | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [videoData, setVideoData] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis | null>(null);
  const [emotionDetector] = useState(() => new FacialEmotionDetector());

  useEffect(() => {
    mediaRecorderRef.current = new MediaRecorderHelper({
      videoDuration: 24,
      audioDuration: 8,
      onVideoData: setVideoData,
      onAudioData: setAudioData,
      onVideoTimer: setTime,
      onAudioTimer: () => {}, // We only show one timer
    });

    return () => {
      mediaRecorderRef.current?.cleanup();
      emotionDetector.cleanup();
    };
  }, [emotionDetector]);

  const startRecording = async () => {
    try {
      await mediaRecorderRef.current?.startVideoRecording();
      await mediaRecorderRef.current?.startAudioRecording();
      setIsRecording(true);
      setHasVideoAccess(true);

      const stream = mediaRecorderRef.current?.getVideoStream();
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        try {
          await emotionDetector.initialize(videoRef.current);
          emotionDetector.startAnalysis(setFacialAnalysis);
        } catch (emotionError) {
          console.warn('Facial emotion detection failed:', emotionError);
        }
      }
    } catch (error) {
      toast({
        title: "Camera access failed",
        description: "Please allow camera and microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stopVideoRecording();
    setIsRecording(false);
    emotionDetector.stopAnalysis();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (videoData) {
      onNext(videoData, audioData || '', facialAnalysis);
    }
  }, [videoData, audioData, facialAnalysis, onNext]);

  const progress = (time / 24) * 100;

  return (
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
        <Button onClick={isRecording ? stopRecording : startRecording} className="w-full">
          {isRecording ? <Square className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </CardContent>
    </Card>
  );
}
