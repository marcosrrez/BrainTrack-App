
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronRight, 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Shield,
  BookOpen,
  Zap,
  Target,
  Clock,
  Eye,
  Heart
} from 'lucide-react';

interface DisclosureItem {
  id: string;
  title: string;
  preview: string;
  content: React.ReactNode;
  icon: React.ComponentType<any>;
  category: 'memory-science' | 'data-usage' | 'feature-explanation' | 'personalization';
  importance: 'high' | 'medium' | 'low';
}

interface ProgressiveDisclosureProps {
  items: DisclosureItem[];
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  maxInitialItems?: number;
}

export function ProgressiveDisclosure({ 
  items, 
  title = "Learn More", 
  subtitle,
  showProgress = false,
  maxInitialItems = 2
}: ProgressiveDisclosureProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAllItems, setShowAllItems] = useState(false);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const visibleItems = showAllItems ? items : items.slice(0, maxInitialItems);
  const progress = showProgress ? (expandedItems.size / items.length) * 100 : 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'memory-science': return 'bg-blue-100 text-blue-800';
      case 'data-usage': return 'bg-green-100 text-green-800';
      case 'feature-explanation': return 'bg-purple-100 text-purple-800';
      case 'personalization': return 'bg-orange-100 text-orange-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg text-blue-900">{title}</CardTitle>
            {subtitle && <p className="text-sm text-blue-700 mt-1">{subtitle}</p>}
          </div>
        </div>
        {showProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-700 mb-2">
              <span>Learning Progress</span>
              <span>{expandedItems.size}/{items.length} explored</span>
            </div>
            <Progress value={progress} className="bg-blue-100" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedItems.has(item.id);
          
          return (
            <div key={item.id} className="border border-neutral-200 rounded-lg bg-white/80 backdrop-blur-sm">
              <button
                onClick={() => toggleExpanded(item.id)}
                className="w-full p-4 text-left hover:bg-neutral-50 transition-colors duration-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {Icon && <Icon className="w-5 h-5 text-neutral-600" />}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-neutral-800">{item.title}</h4>
                        <Badge className={getCategoryColor(item.category)} variant="secondary">
                          {item.category?.replace('-', ' ') || 'uncategorized'}
                        </Badge>
                        {item.importance === 'high' && (
                          <Badge className="bg-red-100 text-red-800" variant="secondary">
                            Important
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{item.preview}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-neutral-100 pt-4 bg-neutral-50/50">
                  <div className="prose prose-sm max-w-none">
                    {item.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {!showAllItems && items.length > maxInitialItems && (
          <Button
            variant="outline"
            onClick={() => setShowAllItems(true)}
            className="w-full bg-white/80 hover:bg-white"
          >
            Show {items.length - maxInitialItems} more insights
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-defined educational content
export const memoryEducationItems: DisclosureItem[] = [
  {
    id: 'spaced-repetition',
    title: 'The Science of Spaced Repetition',
    preview: 'Why reviewing memories at increasing intervals strengthens them',
    category: 'memory-science',
    importance: 'high',
    icon: Clock,
    content: (
      <div className="space-y-3">
        <p>
          Spaced repetition is based on the <strong>forgetting curve</strong>, discovered by psychologist Hermann Ebbinghaus. 
          Without reinforcement, we forget about 50% of new information within an hour and 70% within 24 hours.
        </p>
        <p>
          By reviewing memories just before you're likely to forget them, you strengthen the neural pathways and 
          extend the time until the next review is needed. This creates increasingly durable memories.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Your Data:</strong> MemoryBoost tracks your review performance to calculate optimal intervals, 
            typically ranging from 1 day to several months based on how well you recall each memory.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'emotion-memory',
    title: 'Emotional Memory Enhancement',
    preview: 'How emotions strengthen memory formation and recall',
    category: 'memory-science',
    importance: 'high',
    icon: Heart,
    content: (
      <div className="space-y-3">
        <p>
          The <strong>amygdala</strong> (brain's emotional center) works with the <strong>hippocampus</strong> (memory center) 
          to encode emotionally significant events more strongly. This is why you remember emotional moments more vividly.
        </p>
        <p>
          When you rate the emotional intensity of your memories (1-10), you're helping the app understand which 
          memories are naturally stronger and may need less frequent review.
        </p>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Your Data:</strong> High-emotion memories (7-10) in your collection show 23% better recall rates 
            and longer intervals between reviews.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'ai-analysis',
    title: 'AI-Powered Memory Analysis',
    preview: 'How machine learning enhances your memory practice',
    category: 'feature-explanation',
    importance: 'medium',
    icon: Brain,
    content: (
      <div className="space-y-3">
        <p>
          Our AI analyzes multiple aspects of your memories using TensorFlow models:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Sentiment Analysis:</strong> Understands emotional tone from your descriptions</li>
          <li><strong>Voice Analysis:</strong> Detects confidence, energy, and emotional state from audio</li>
          <li><strong>Facial Emotion:</strong> Recognizes emotions from video recordings</li>
          <li><strong>Pattern Recognition:</strong> Identifies themes and connections between memories</li>
        </ul>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Privacy:</strong> All AI analysis happens locally in your browser or on secure servers. 
            Your raw media never leaves our platform.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'data-usage',
    title: 'How We Use Your Data',
    preview: 'Transparent explanation of data collection and usage',
    category: 'data-usage',
    importance: 'high',
    icon: Shield,
    content: (
      <div className="space-y-3">
        <p>We collect and use your data to provide personalized memory enhancement:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-800 mb-2">What We Collect:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Memory content (video/audio/text)</li>
              <li>• Review performance scores</li>
              <li>• Usage patterns and timing</li>
              <li>• AI analysis results</li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="font-medium text-green-800 mb-2">How We Use It:</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Optimize review scheduling</li>
              <li>• Generate personalized insights</li>
              <li>• Improve AI recommendations</li>
              <li>• Track your progress</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-neutral-600">
          Your data is never shared with third parties and remains encrypted at rest.
        </p>
      </div>
    )
  },
  {
    id: 'personalization',
    title: 'Adaptive Learning Algorithm',
    preview: 'How the app learns your unique memory patterns',
    category: 'personalization',
    importance: 'medium',
    icon: Target,
    content: (
      <div className="space-y-3">
        <p>
          MemoryBoost continuously adapts to your individual memory patterns using machine learning:
        </p>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Zap className="w-4 h-4 text-yellow-500 mt-1" />
            <div>
              <strong>Performance Tracking:</strong> Monitors which memory types you recall best
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500 mt-1" />
            <div>
              <strong>Difficulty Adjustment:</strong> Adjusts review intervals based on your success rate
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Eye className="w-4 h-4 text-blue-500 mt-1" />
            <div>
              <strong>Pattern Recognition:</strong> Identifies optimal review times and memory types for you
            </div>
          </div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Your Learning Profile:</strong> The algorithm builds a unique profile of your memory strengths 
            and areas for improvement, making the app more effective over time.
          </p>
        </div>
      </div>
    )
  }
];
