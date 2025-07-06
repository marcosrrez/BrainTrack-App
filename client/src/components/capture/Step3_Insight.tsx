import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, User, Bot } from "lucide-react";
import { type FacialAnalysis } from "@/lib/facial-emotion-detector";

interface Props {
  facialAnalysis: FacialAnalysis | null;
  userEmotion: number | null;
  onFinish: () => void;
}

const emotionMap: { [key: string]: number } = {
  happy: 8,
  sad: 2,
  neutral: 5,
  surprised: 7,
  angry: 1,
  fearful: 2,
  disgusted: 1,
};

export function Step3_Insight({ facialAnalysis, userEmotion, onFinish }: Props) {
  const aiEmotion = facialAnalysis?.emotions.dominantEmotion;
  const aiEmotionRating = aiEmotion ? emotionMap[aiEmotion] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          AI Analysis Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-neutral-600">
          Here's a comparison of your self-reported emotion and our AI's analysis. This feedback helps you become more aware of your emotional state, strengthening your memories.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 mr-2 text-blue-700" />
              <h4 className="font-semibold text-blue-800">Your Rating</h4>
            </div>
            <p className="text-4xl font-bold text-blue-900">{userEmotion}/10</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center mb-2">
              <Bot className="w-5 h-5 mr-2 text-purple-700" />
              <h4 className="font-semibold text-purple-800">AI Detection</h4>
            </div>
            {aiEmotionRating !== null ? (
              <p className="text-4xl font-bold text-purple-900">{aiEmotionRating}/10</p>
            ) : (
              <p className="text-sm text-purple-900">Not available</p>
            )}
            {aiEmotion && <p className="text-sm text-purple-700 capitalize">Detected: {aiEmotion}</p>}
          </div>
        </div>
        {facialAnalysis && (
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <h5 className="font-medium">Detailed Analysis</h5>
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
          </div>
        )}
        <Button onClick={onFinish} className="w-full">Go to Dashboard</Button>
      </CardContent>
    </Card>
  );
}