export interface MediaRecorderOptions {
  videoDuration?: number;
  audioDuration?: number;
  onVideoData?: (data: string) => void;
  onAudioData?: (data: string) => void;
  onVideoTimer?: (seconds: number) => void;
  onAudioTimer?: (seconds: number) => void;
}

export class MediaRecorderHelper {
  private videoRecorder: MediaRecorder | null = null;
  private audioRecorder: MediaRecorder | null = null;
  private videoStream: MediaStream | null = null;
  private audioStream: MediaStream | null = null;
  private videoTimer: NodeJS.Timeout | null = null;
  private audioTimer: NodeJS.Timeout | null = null;
  private videoSeconds = 0;
  private audioSeconds = 0;
  private options: MediaRecorderOptions;

  constructor(options: MediaRecorderOptions = {}) {
    this.options = {
      videoDuration: 24,
      audioDuration: 8,
      ...options,
    };
  }

  async startVideoRecording(): Promise<void> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const chunks: Blob[] = [];
      this.videoRecorder = new MediaRecorder(this.videoStream);

      this.videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.videoRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          this.options.onVideoData?.(base64data);
        };
        reader.readAsDataURL(blob);
      };

      this.videoRecorder.start();
      this.startVideoTimer();
    } catch (error) {
      console.error("Failed to start video recording:", error);
      throw new Error("Failed to access camera and microphone");
    }
  }

  async startAudioRecording(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const chunks: Blob[] = [];
      this.audioRecorder = new MediaRecorder(this.audioStream);

      this.audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.audioRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          this.options.onAudioData?.(base64data);
        };
        reader.readAsDataURL(blob);
      };

      this.audioRecorder.start();
      this.startAudioTimer();
    } catch (error) {
      console.error("Failed to start audio recording:", error);
      throw new Error("Failed to access microphone");
    }
  }

  stopVideoRecording(): void {
    if (this.videoRecorder && this.videoRecorder.state !== "inactive") {
      this.videoRecorder.stop();
    }
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.stopVideoTimer();
  }

  stopAudioRecording(): void {
    if (this.audioRecorder && this.audioRecorder.state !== "inactive") {
      this.audioRecorder.stop();
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
    this.stopAudioTimer();
  }

  private startVideoTimer(): void {
    this.videoSeconds = 0;
    this.videoTimer = setInterval(() => {
      this.videoSeconds++;
      this.options.onVideoTimer?.(this.videoSeconds);
      
      if (this.videoSeconds >= (this.options.videoDuration || 24)) {
        this.stopVideoRecording();
      }
    }, 1000);
  }

  private startAudioTimer(): void {
    this.audioSeconds = 0;
    this.audioTimer = setInterval(() => {
      this.audioSeconds++;
      this.options.onAudioTimer?.(this.audioSeconds);
      
      if (this.audioSeconds >= (this.options.audioDuration || 8)) {
        this.stopAudioRecording();
      }
    }, 1000);
  }

  private stopVideoTimer(): void {
    if (this.videoTimer) {
      clearInterval(this.videoTimer);
      this.videoTimer = null;
    }
  }

  private stopAudioTimer(): void {
    if (this.audioTimer) {
      clearInterval(this.audioTimer);
      this.audioTimer = null;
    }
  }

  getVideoStream(): MediaStream | null {
    return this.videoStream;
  }

  isVideoRecording(): boolean {
    return this.videoRecorder?.state === "recording";
  }

  isAudioRecording(): boolean {
    return this.audioRecorder?.state === "recording";
  }

  cleanup(): void {
    this.stopVideoRecording();
    this.stopAudioRecording();
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
