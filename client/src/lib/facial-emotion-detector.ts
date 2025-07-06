import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface FacialEmotion {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  neutral: number;
  dominantEmotion: string;
  confidence: number;
}

export interface FacialAnalysis {
  emotions: FacialEmotion;
  attentionLevel: number;
  engagementScore: number;
  detected: boolean;
  timestamp: number;
}

export class FacialEmotionDetector {
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private isInitialized = false;
  private videoElement: HTMLVideoElement | null = null;
  private onAnalysisCallback?: (analysis: FacialAnalysis) => void;
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.faceMesh = null;
    this.camera = null;
  }

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    if (this.isInitialized) return;

    this.videoElement = videoElement;

    try {
      // Initialize MediaPipe FaceMesh
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.faceMesh.onResults(this.onFaceMeshResults.bind(this));

      // Initialize camera
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.faceMesh && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
            await this.faceMesh.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      this.isInitialized = true;
      console.log('Facial emotion detector initialized');
    } catch (error) {
      console.error('Failed to initialize facial emotion detector:', error);
      throw error;
    }
  }

  startAnalysis(callback: (analysis: FacialAnalysis) => void): void {
    if (!this.isInitialized || !this.camera) {
      throw new Error('Detector not initialized');
    }

    this.onAnalysisCallback = callback;
    this.camera.start();
  }

  stopAnalysis(): void {
    if (this.camera) {
      this.camera.stop();
    }
    
    this.onAnalysisCallback = undefined;
  }

  private onFaceMeshResults(results: any): void {
    // Process face mesh results for emotion detection
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      this.analyzeFacialLandmarks(landmarks);
    }
  }

  private analyzeFacialLandmarks(landmarks: any[]): void {
    // Extract key facial points for emotion analysis
    const emotionFeatures = this.extractEmotionFeatures(landmarks);
    const emotions = this.calculateEmotions(emotionFeatures);
    
    const analysis: FacialAnalysis = {
      emotions,
      attentionLevel: this.calculateAttentionLevel(landmarks),
      engagementScore: this.calculateEngagementScore(landmarks),
      detected: true,
      timestamp: Date.now(),
    };

    if (this.onAnalysisCallback) {
      this.onAnalysisCallback(analysis);
    }
  }

  private extractEmotionFeatures(landmarks: any[]): any {
    // Key facial landmark indices for emotion detection
    const features = {
      // Eye landmarks
      leftEyeTop: landmarks[159],
      leftEyeBottom: landmarks[145],
      rightEyeTop: landmarks[386],
      rightEyeBottom: landmarks[374],
      
      // Mouth landmarks
      mouthLeft: landmarks[61],
      mouthRight: landmarks[291],
      mouthTop: landmarks[13],
      mouthBottom: landmarks[14],
      upperLip: landmarks[12],
      lowerLip: landmarks[15],
      
      // Eyebrow landmarks
      leftBrowInner: landmarks[70],
      leftBrowOuter: landmarks[107],
      rightBrowInner: landmarks[300],
      rightBrowOuter: landmarks[336],
      
      // Cheek landmarks
      leftCheek: landmarks[116],
      rightCheek: landmarks[345],
      
      // Nose landmarks
      noseTip: landmarks[1],
      noseBase: landmarks[2],
    };

    return features;
  }

  private calculateEmotions(features: any): FacialEmotion {
    // Calculate emotion scores based on facial geometry
    const emotions = {
      joy: this.calculateJoy(features),
      sadness: this.calculateSadness(features),
      anger: this.calculateAnger(features),
      fear: this.calculateFear(features),
      surprise: this.calculateSurprise(features),
      neutral: 0.5, // Base neutral state
    };

    // Normalize emotions to sum to 1
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    const normalizedEmotions = Object.fromEntries(
      Object.entries(emotions).map(([key, val]) => [key, val / total])
    );

    // Find dominant emotion
    const dominantEmotion = Object.entries(normalizedEmotions)
      .reduce((a, b) => normalizedEmotions[a[0]] > normalizedEmotions[b[0]] ? a : b)[0];

    const confidence = normalizedEmotions[dominantEmotion];

    return {
      ...normalizedEmotions,
      dominantEmotion,
      confidence,
    } as FacialEmotion;
  }

  private calculateJoy(features: any): number {
    // Joy: mouth corners up, cheeks raised, eye crinkles
    const mouthWidth = this.distance(features.mouthLeft, features.mouthRight);
    const mouthHeight = this.distance(features.mouthTop, features.mouthBottom);
    const mouthRatio = mouthWidth / mouthHeight;
    
    const upperLipPosition = features.upperLip.y;
    const lowerLipPosition = features.lowerLip.y;
    const mouthCurve = (upperLipPosition - lowerLipPosition) / mouthWidth;
    
    // Higher ratio and positive curve indicate smile
    const joyScore = Math.max(0, (mouthRatio - 2.5) * 0.3 + mouthCurve * 0.7);
    return Math.min(1, joyScore);
  }

  private calculateSadness(features: any): number {
    // Sadness: mouth corners down, eyebrows down
    const mouthLeft = features.mouthLeft.y;
    const mouthRight = features.mouthRight.y;
    const mouthCenter = features.mouthTop.y;
    
    const mouthDownward = Math.max(0, (mouthLeft + mouthRight) / 2 - mouthCenter);
    
    const leftBrowHeight = features.leftBrowInner.y - features.leftEyeTop.y;
    const rightBrowHeight = features.rightBrowInner.y - features.rightEyeTop.y;
    const browDown = Math.max(0, -(leftBrowHeight + rightBrowHeight) / 2);
    
    return Math.min(1, (mouthDownward + browDown) * 0.5);
  }

  private calculateAnger(features: any): number {
    // Anger: eyebrows down and together, mouth tense
    const browDistance = this.distance(features.leftBrowInner, features.rightBrowInner);
    const eyeDistance = this.distance(features.leftEyeTop, features.rightEyeTop);
    const browTension = Math.max(0, (eyeDistance - browDistance) / eyeDistance);
    
    const mouthTension = this.distance(features.upperLip, features.lowerLip) / 
                        this.distance(features.mouthLeft, features.mouthRight);
    
    return Math.min(1, (browTension * 0.6 + mouthTension * 0.4));
  }

  private calculateFear(features: any): number {
    // Fear: wide eyes, raised eyebrows
    const leftEyeHeight = this.distance(features.leftEyeTop, features.leftEyeBottom);
    const rightEyeHeight = this.distance(features.rightEyeTop, features.rightEyeBottom);
    const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2;
    
    const leftBrowRaise = Math.max(0, features.leftBrowOuter.y - features.leftEyeTop.y);
    const rightBrowRaise = Math.max(0, features.rightBrowOuter.y - features.rightEyeTop.y);
    const avgBrowRaise = (leftBrowRaise + rightBrowRaise) / 2;
    
    return Math.min(1, (avgEyeHeight + avgBrowRaise) * 0.5);
  }

  private calculateSurprise(features: any): number {
    // Surprise: raised eyebrows, wide eyes, open mouth
    const eyeOpenness = (
      this.distance(features.leftEyeTop, features.leftEyeBottom) +
      this.distance(features.rightEyeTop, features.rightEyeBottom)
    ) / 2;
    
    const mouthOpenness = this.distance(features.mouthTop, features.mouthBottom);
    
    const browRaise = (
      (features.leftBrowOuter.y - features.leftEyeTop.y) +
      (features.rightBrowOuter.y - features.rightEyeTop.y)
    ) / 2;
    
    return Math.min(1, (eyeOpenness + mouthOpenness + browRaise) * 0.33);
  }

  private calculateAttentionLevel(landmarks: any[]): number {
    // Calculate attention based on gaze direction and eye openness
    const leftEyeOpenness = this.distance(landmarks[159], landmarks[145]);
    const rightEyeOpenness = this.distance(landmarks[386], landmarks[374]);
    const avgEyeOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;
    
    // Head pose estimation (simplified)
    const noseTip = landmarks[1];
    const faceCenter = landmarks[9];
    const headTilt = Math.abs(noseTip.x - faceCenter.x);
    
    return Math.max(0, Math.min(1, avgEyeOpenness * 10 - headTilt * 2));
  }

  private calculateEngagementScore(landmarks: any[]): number {
    // Overall engagement based on facial expressiveness
    const eyeMovement = this.calculateEyeMovement(landmarks);
    const facialExpression = this.calculateFacialExpression(landmarks);
    
    return (eyeMovement + facialExpression) / 2;
  }

  private calculateEyeMovement(landmarks: any[]): number {
    // Simplified eye movement detection
    const leftPupil = landmarks[468];
    const rightPupil = landmarks[473];
    
    // Calculate relative position within eye area
    const leftEyeCenter = this.calculateCentroid([landmarks[33], landmarks[7], landmarks[163], landmarks[144], landmarks[145], landmarks[153]]);
    const rightEyeCenter = this.calculateCentroid([landmarks[362], landmarks[398], landmarks[384], landmarks[385], landmarks[386], landmarks[387]]);
    
    const leftMovement = this.distance(leftPupil, leftEyeCenter);
    const rightMovement = this.distance(rightPupil, rightEyeCenter);
    
    return (leftMovement + rightMovement) / 2;
  }

  private calculateFacialExpression(landmarks: any[]): number {
    // Overall facial expressiveness
    const mouthMovement = this.distance(landmarks[13], landmarks[14]);
    const browMovement = Math.abs(landmarks[70].y - landmarks[107].y) + Math.abs(landmarks[300].y - landmarks[336].y);
    
    return Math.min(1, (mouthMovement + browMovement) * 0.5);
  }

  private distance(point1: any, point2: any): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateCentroid(points: any[]): any {
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  

  cleanup(): void {
    this.stopAnalysis();
    if (this.faceMesh) {
      this.faceMesh.close();
    }
    this.isInitialized = false;
  }
}