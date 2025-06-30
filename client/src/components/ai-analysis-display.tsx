import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Mic, Eye, FileText, Heart } from "lucide-react";

interface TextAnalysis {
  sentiment: number;
  keywords: string[];
  themes: string[];
  complexity: number;
  emotionalTone: string;
}

interface EmotionAnalysis {
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    neutral: number;
  };
  dominantEmotion: string;
  intensity: number;
}

interface VoiceAnalysis {
  tone: {
    confident: number;
    anxious: number;
    excited: number;
    calm: number;
    stressed: number;
  };
  pace: number;
  energy: number;
  clarity: number;
  dominantTone: string;
  confidence: number;
}

interface FacialAnalysis {
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    neutral: number;
    dominantEmotion: string;
    confidence: number;
  };
  attentionLevel: number;
  engagementScore: number;
  detected: boolean;
}

interface AIAnalysisDisplayProps {
  textAnalysis?: TextAnalysis;
  emotionAnalysis?: EmotionAnalysis;
  voiceAnalysis?: VoiceAnalysis;
  facialAnalysis?: FacialAnalysis;
  className?: string;
}

export function AIAnalysisDisplay({
  textAnalysis,
  emotionAnalysis,
  voiceAnalysis,
  facialAnalysis,
  className = "",
}: AIAnalysisDisplayProps) {
  const formatPercentage = (value: number) => Math.round(value * 100);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5" />
        <h3 className="text-lg font-semibold">AI Analysis Results</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Text Analysis */}
        {textAnalysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Sentiment</span>
                  <span className={textAnalysis.sentiment > 0 ? 'text-green-600' : textAnalysis.sentiment < 0 ? 'text-red-600' : 'text-neutral-600'}>
                    {textAnalysis.sentiment > 0.1 ? 'Positive' : textAnalysis.sentiment < -0.1 ? 'Negative' : 'Neutral'}
                  </span>
                </div>
                <Progress value={((textAnalysis.sentiment + 1) / 2) * 100} className="h-2" />
              </div>

              <div>
                <span className="text-sm font-medium block mb-1">Emotional Tone</span>
                <Badge variant="outline" className="capitalize">
                  {textAnalysis.emotionalTone}
                </Badge>
              </div>

              <div>
                <span className="text-sm font-medium block mb-1">Complexity</span>
                <Progress value={textAnalysis.complexity * 100} className="h-2" />
              </div>

              {textAnalysis.keywords.length > 0 && (
                <div>
                  <span className="text-sm font-medium block mb-1">Key Topics</span>
                  <div className="flex flex-wrap gap-1">
                    {textAnalysis.keywords.slice(0, 3).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Emotion Analysis */}
        {emotionAnalysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Emotional State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Dominant Emotion</span>
                  <Badge variant="outline" className="capitalize">
                    {emotionAnalysis.dominantEmotion}
                  </Badge>
                </div>
                <Progress value={emotionAnalysis.intensity * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(emotionAnalysis.emotions)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([emotion, value]) => (
                    <div key={emotion} className="flex justify-between">
                      <span className="capitalize">{emotion}:</span>
                      <span>{formatPercentage(value)}%</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Analysis */}
        {voiceAnalysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Dominant Tone</span>
                  <Badge variant="outline" className="capitalize">
                    {voiceAnalysis.dominantTone}
                  </Badge>
                </div>
                <Progress value={voiceAnalysis.confidence * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Energy:</span>
                  <span>{formatPercentage(voiceAnalysis.energy)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pace:</span>
                  <span>{formatPercentage(voiceAnalysis.pace)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Clarity:</span>
                  <span>{formatPercentage(voiceAnalysis.clarity)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span>{formatPercentage(voiceAnalysis.tone.confident)}%</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium block mb-1">Tone Distribution</span>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(voiceAnalysis.tone)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([tone, value]) => (
                      <Badge key={tone} variant="secondary" className="text-xs capitalize">
                        {tone}: {formatPercentage(value)}%
                      </Badge>
                    ))
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Facial Analysis */}
        {facialAnalysis && facialAnalysis.detected && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Facial Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Dominant Expression</span>
                  <Badge variant="outline" className="capitalize">
                    {facialAnalysis.emotions.dominantEmotion}
                  </Badge>
                </div>
                <Progress value={facialAnalysis.emotions.confidence * 100} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Attention:</span>
                  <span>{formatPercentage(facialAnalysis.attentionLevel)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Engagement:</span>
                  <span>{formatPercentage(facialAnalysis.engagementScore)}%</span>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium block mb-1">Expression Mix</span>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(facialAnalysis.emotions)
                    .filter(([key]) => !['dominantEmotion', 'confidence'].includes(key))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([emotion, value]) => (
                      <Badge key={emotion} variant="secondary" className="text-xs capitalize">
                        {emotion}: {formatPercentage(value)}%
                      </Badge>
                    ))
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}