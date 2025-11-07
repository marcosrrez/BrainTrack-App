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
  private isCleanedUp = false;

  constructor(options: MediaRecorderOptions = {}) {
    this.options = {
      videoDuration: 24,
      audioDuration: 8,
      ...options,
    };
  }

  /**
   * Check browser compatibility for MediaRecorder
   */
  private checkBrowserCompatibility(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Your browser does not support media recording. Please use a modern browser like Chrome, Firefox, or Edge.'
      );
    }

    if (typeof MediaRecorder === 'undefined') {
      throw new Error(
        'MediaRecorder is not supported in your browser. Please update to the latest version.'
      );
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: any, mediaType: 'camera' | 'microphone'): string {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return `${mediaType === 'camera' ? 'Camera and microphone' : 'Microphone'} access was denied. Please allow access in your browser settings and try again.`;
    }

    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return `No ${mediaType} found. Please connect a ${mediaType} and try again.`;
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return `${mediaType === 'camera' ? 'Camera' : 'Microphone'} is already in use by another application. Please close other apps using the ${mediaType} and try again.`;
    }

    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      return `${mediaType === 'camera' ? 'Camera' : 'Microphone'} does not meet the required specifications. Please try a different device.`;
    }

    if (error.name === 'TypeError') {
      return 'Invalid media constraints. Please contact support.';
    }

    return error.message || `Failed to access ${mediaType}. Please check your device settings and try again.`;
  }

  async startVideoRecording(): Promise<void> {
    // Check browser compatibility first
    this.checkBrowserCompatibility();

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const chunks: Blob[] = [];

      // Check if MediaRecorder supports the video stream
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        console.warn('video/webm is not supported, trying video/mp4');
      }

      this.videoRecorder = new MediaRecorder(this.videoStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4',
      });

      this.videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.videoRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: this.videoRecorder?.mimeType || "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          this.options.onVideoData?.(base64data);
        };
        reader.onerror = () => {
          console.error('Failed to read video data');
        };
        reader.readAsDataURL(blob);
      };

      this.videoRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        this.cleanupPartialResources('video');
      };

      this.videoRecorder.start();
      this.startVideoTimer();
    } catch (error: any) {
      console.error("Failed to start video recording:", error);
      // Cleanup any partially created resources
      this.cleanupPartialResources('video');
      throw new Error(this.getErrorMessage(error, 'camera'));
    }
  }

  async startAudioRecording(): Promise<void> {
    // Check browser compatibility first
    this.checkBrowserCompatibility();

    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const chunks: Blob[] = [];

      this.audioRecorder = new MediaRecorder(this.audioStream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      this.audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      this.audioRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: this.audioRecorder?.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          this.options.onAudioData?.(base64data);
        };
        reader.onerror = () => {
          console.error('Failed to read audio data');
        };
        reader.readAsDataURL(blob);
      };

      this.audioRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        this.cleanupPartialResources('audio');
      };

      this.audioRecorder.start();
      this.startAudioTimer();
    } catch (error: any) {
      console.error("Failed to start audio recording:", error);
      // Cleanup any partially created resources
      this.cleanupPartialResources('audio');
      throw new Error(this.getErrorMessage(error, 'microphone'));
    }
  }

  stopVideoRecording(): void {
    try {
      if (this.videoRecorder && this.videoRecorder.state !== "inactive") {
        this.videoRecorder.stop();
      }
    } catch (error) {
      console.error('Error stopping video recorder:', error);
    }

    try {
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.error('Error stopping video track:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error stopping video stream:', error);
    }

    this.stopVideoTimer();
  }

  stopAudioRecording(): void {
    try {
      if (this.audioRecorder && this.audioRecorder.state !== "inactive") {
        this.audioRecorder.stop();
      }
    } catch (error) {
      console.error('Error stopping audio recorder:', error);
    }

    try {
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.error('Error stopping audio track:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error stopping audio stream:', error);
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

  /**
   * Cleanup partially created resources on error
   */
  private cleanupPartialResources(type: 'video' | 'audio'): void {
    try {
      if (type === 'video') {
        if (this.videoRecorder) {
          try {
            if (this.videoRecorder.state !== 'inactive') {
              this.videoRecorder.stop();
            }
          } catch (error) {
            console.error('Error stopping video recorder during cleanup:', error);
          }
          this.videoRecorder = null;
        }

        if (this.videoStream) {
          this.videoStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (error) {
              console.error('Error stopping video track during cleanup:', error);
            }
          });
          this.videoStream = null;
        }

        this.stopVideoTimer();
      } else {
        if (this.audioRecorder) {
          try {
            if (this.audioRecorder.state !== 'inactive') {
              this.audioRecorder.stop();
            }
          } catch (error) {
            console.error('Error stopping audio recorder during cleanup:', error);
          }
          this.audioRecorder = null;
        }

        if (this.audioStream) {
          this.audioStream.getTracks().forEach(track => {
            try {
              track.stop();
            } catch (error) {
              console.error('Error stopping audio track during cleanup:', error);
            }
          });
          this.audioStream = null;
        }

        this.stopAudioTimer();
      }
    } catch (error) {
      console.error(`Error cleaning up partial ${type} resources:`, error);
    }
  }

  /**
   * Cleanup all resources to prevent memory leaks
   * Safe to call multiple times (idempotent)
   */
  cleanup(): void {
    if (this.isCleanedUp) {
      return;
    }

    try {
      this.stopVideoRecording();
      this.stopAudioRecording();

      // Clear all references
      this.videoRecorder = null;
      this.audioRecorder = null;
      this.videoStream = null;
      this.audioStream = null;

      this.isCleanedUp = true;
      console.log('MediaRecorder cleanup completed');
    } catch (error) {
      console.error('Error during MediaRecorder cleanup:', error);
      this.isCleanedUp = true;
    }
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
