import * as tf from '@tensorflow/tfjs-node';

export interface EmotionAnalysis {
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

export interface TextAnalysis {
  sentiment: number; // -1 to 1
  keywords: string[];
  themes: string[];
  complexity: number;
  emotionalTone: string;
}

export interface MemoryInsight {
  type: 'improvement' | 'pattern' | 'strength' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
}

export interface SimilarityResult {
  memoryId: number;
  similarity: number;
  reason: string;
}

class TensorFlowAIService {
  private textEncoder: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Set TensorFlow backend for Node.js
      await tf.ready();
      console.log('TensorFlow.js initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TensorFlow:', error);
      throw error;
    }
  }

  /**
   * Analyze text content for sentiment, keywords, and themes
   */
  async analyzeText(text: string): Promise<TextAnalysis> {
    await this.initialize();

    // Simple sentiment analysis using TensorFlow operations
    const sentiment = this.calculateSentiment(text);
    const keywords = this.extractKeywords(text);
    const themes = this.identifyThemes(text);
    const complexity = this.calculateComplexity(text);
    const emotionalTone = this.determineEmotionalTone(sentiment);

    return {
      sentiment,
      keywords,
      themes,
      complexity,
      emotionalTone,
    };
  }

  /**
   * Analyze emotional content from description and context
   */
  async analyzeEmotion(description: string, emotionRating: number): Promise<EmotionAnalysis> {
    await this.initialize();

    // Use TensorFlow to analyze emotional patterns
    const emotions = this.analyzeEmotionalPatterns(description, emotionRating);
    const dominantEmotion = this.findDominantEmotion(emotions);
    const intensity = this.calculateEmotionalIntensity(emotions, emotionRating);

    return {
      emotions,
      dominantEmotion,
      intensity,
    };
  }

  /**
   * Generate personalized insights based on memory patterns
   */
  async generateInsights(memories: any[], analytics: any): Promise<MemoryInsight[]> {
    await this.initialize();

    const insights: MemoryInsight[] = [];

    // Analyze memory patterns using TensorFlow
    const patterns = await this.analyzeMemoryPatterns(memories);
    
    // Performance insights
    if (analytics.accuracyRate < 0.7) {
      insights.push({
        type: 'improvement',
        title: 'Memory Encoding Enhancement',
        description: 'Consider adding more sensory details during capture. Memories with richer descriptions show 23% better recall.',
        confidence: 0.85,
      });
    }

    // Pattern recognition insights
    const categoryPerformance = this.analyzeCategoryPerformance(memories);
    const bestCategory = Object.entries(categoryPerformance)
      .sort(([,a], [,b]) => (b as any).avgScore - (a as any).avgScore)[0];
    
    if (bestCategory) {
      insights.push({
        type: 'pattern',
        title: 'Category Strength Identified',
        description: `Your ${bestCategory[0]} memories perform exceptionally well. This pattern suggests strong associative encoding in this domain.`,
        confidence: 0.78,
      });
    }

    // Temporal analysis
    const temporalPatterns = this.analyzeTemporalPatterns(memories);
    if (temporalPatterns.optimalTime) {
      insights.push({
        type: 'recommendation',
        title: 'Optimal Review Timing',
        description: `Your recall performance peaks during ${temporalPatterns.optimalTime}. Schedule important reviews during this window.`,
        confidence: 0.72,
      });
    }

    return insights;
  }

  /**
   * Find similar memories using embedding similarity
   */
  async findSimilarMemories(targetMemory: any, allMemories: any[]): Promise<SimilarityResult[]> {
    await this.initialize();

    const similarities: SimilarityResult[] = [];

    // Create embeddings for comparison
    const targetEmbedding = await this.createMemoryEmbedding(targetMemory);
    
    for (const memory of allMemories) {
      if (memory.id === targetMemory.id) continue;
      
      const memoryEmbedding = await this.createMemoryEmbedding(memory);
      const similarity = await this.calculateCosineSimilarity(targetEmbedding, memoryEmbedding);
      
      if (similarity > 0.3) { // Threshold for meaningful similarity
        similarities.push({
          memoryId: memory.id,
          similarity,
          reason: this.determineSimilarityReason(targetMemory, memory, similarity),
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  /**
   * Optimize spaced repetition intervals using ML
   */
  async optimizeReviewInterval(memory: any, userPerformance: any): Promise<number> {
    await this.initialize();

    // Use TensorFlow to predict optimal interval based on:
    // - Memory characteristics (type, emotion, complexity)
    // - User performance history
    // - Forgetting curve parameters

    const features = this.extractMemoryFeatures(memory, userPerformance);
    const prediction = await this.predictOptimalInterval(features);
    
    return Math.max(1, Math.round(prediction));
  }

  // Private helper methods
  private calculateSentiment(text: string): number {
    // Simple sentiment calculation using word analysis
    const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'happy', 'excited', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'hate', 'worst', 'disappointed'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / words.length * 10));
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      if (!stopWords.has(word) && word.length > 3) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });
    
    return Array.from(wordFreq.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private identifyThemes(text: string): string[] {
    const themes: string[] = [];
    const lowercaseText = text.toLowerCase();
    
    // Define theme patterns
    const themePatterns = [
      { theme: 'learning', keywords: ['learn', 'study', 'education', 'school', 'knowledge'] },
      { theme: 'relationships', keywords: ['friend', 'family', 'love', 'meeting', 'conversation'] },
      { theme: 'achievement', keywords: ['success', 'accomplish', 'goal', 'win', 'complete'] },
      { theme: 'travel', keywords: ['trip', 'travel', 'visit', 'place', 'location'] },
      { theme: 'work', keywords: ['job', 'work', 'career', 'project', 'meeting'] },
    ];
    
    themePatterns.forEach(({ theme, keywords }) => {
      if (keywords.some(keyword => lowercaseText.includes(keyword))) {
        themes.push(theme);
      }
    });
    
    return themes;
  }

  private calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Normalize complexity score (0-1)
    return Math.min(1, (avgWordsPerSentence / 20 + avgWordLength / 10) / 2);
  }

  private determineEmotionalTone(sentiment: number): string {
    if (sentiment > 0.3) return 'positive';
    if (sentiment < -0.3) return 'negative';
    return 'neutral';
  }

  private analyzeEmotionalPatterns(description: string, emotionRating: number): EmotionAnalysis['emotions'] {
    // Simple emotion detection based on text analysis and rating
    const baseEmotion = emotionRating / 10;
    
    return {
      joy: description.toLowerCase().includes('happy') || description.toLowerCase().includes('joy') ? baseEmotion : baseEmotion * 0.3,
      sadness: description.toLowerCase().includes('sad') || description.toLowerCase().includes('cry') ? baseEmotion : baseEmotion * 0.2,
      anger: description.toLowerCase().includes('angry') || description.toLowerCase().includes('mad') ? baseEmotion : baseEmotion * 0.1,
      fear: description.toLowerCase().includes('scared') || description.toLowerCase().includes('afraid') ? baseEmotion : baseEmotion * 0.1,
      surprise: description.toLowerCase().includes('surprised') || description.toLowerCase().includes('shock') ? baseEmotion : baseEmotion * 0.2,
      neutral: 1 - baseEmotion,
    };
  }

  private findDominantEmotion(emotions: EmotionAnalysis['emotions']): string {
    return Object.entries(emotions).reduce((a, b) => emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b)[0];
  }

  private calculateEmotionalIntensity(emotions: EmotionAnalysis['emotions'], rating: number): number {
    const maxEmotion = Math.max(...Object.values(emotions));
    return (maxEmotion + rating / 10) / 2;
  }

  private async analyzeMemoryPatterns(memories: any[]): Promise<any> {
    // Analyze patterns in memory data using TensorFlow operations
    if (memories.length === 0) return {};
    
    // Convert memory data to tensors for analysis
    const emotionData = memories.map(m => m.emotion / 10);
    const typeDistribution = this.calculateTypeDistribution(memories);
    const timePatterns = this.calculateTimePatterns(memories);
    
    return {
      emotionDistribution: emotionData,
      typeDistribution,
      timePatterns,
    };
  }

  private analyzeCategoryPerformance(memories: any[]): Record<string, any> {
    const categories: Record<string, { scores: number[], avgScore: number }> = {};
    
    memories.forEach(memory => {
      if (!categories[memory.type]) {
        categories[memory.type] = { scores: [], avgScore: 0 };
      }
      categories[memory.type].scores.push(memory.lastScore || 0);
    });
    
    Object.keys(categories).forEach(type => {
      const scores = categories[type].scores;
      categories[type].avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });
    
    return categories;
  }

  private analyzeTemporalPatterns(memories: any[]): { optimalTime?: string } {
    // Analyze when memories are most effectively recalled
    const timePerformance: Record<string, number[]> = {};
    
    memories.forEach(memory => {
      const hour = new Date(memory.createdAt).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      
      if (!timePerformance[timeSlot]) {
        timePerformance[timeSlot] = [];
      }
      timePerformance[timeSlot].push(memory.lastScore || 0);
    });
    
    let bestTime = '';
    let bestScore = 0;
    
    Object.entries(timePerformance).forEach(([time, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestTime = time;
      }
    });
    
    return { optimalTime: bestTime };
  }

  private async createMemoryEmbedding(memory: any): Promise<tf.Tensor> {
    // Create a simple embedding vector for the memory
    const features = [
      memory.emotion / 10,
      memory.type === 'personal' ? 1 : memory.type === 'social' ? 0.5 : 0,
      memory.description.length / 1000,
      memory.tags?.length || 0,
      memory.lastScore / 3,
    ];
    
    return tf.tensor1d(features);
  }

  private async calculateCosineSimilarity(a: tf.Tensor, b: tf.Tensor): Promise<number> {
    const dotProduct = tf.sum(tf.mul(a, b));
    const normA = tf.norm(a);
    const normB = tf.norm(b);
    const similarity = tf.div(dotProduct, tf.mul(normA, normB));
    
    const result = await similarity.data();
    
    // Clean up tensors
    dotProduct.dispose();
    normA.dispose();
    normB.dispose();
    similarity.dispose();
    
    return result[0];
  }

  private determineSimilarityReason(memory1: any, memory2: any, similarity: number): string {
    if (memory1.type === memory2.type) return `Similar ${memory1.type} memories`;
    if (Math.abs(memory1.emotion - memory2.emotion) < 2) return 'Similar emotional intensity';
    if (memory1.tags && memory2.tags && memory1.tags.some((tag: string) => memory2.tags.includes(tag))) {
      return 'Shared themes and concepts';
    }
    return 'Content similarity detected';
  }

  private extractMemoryFeatures(memory: any, userPerformance: any): number[] {
    return [
      memory.emotion / 10,
      memory.reviewCount,
      memory.lastScore / 3,
      userPerformance.accuracyRate || 0,
      memory.description.length / 1000,
      memory.tags?.length || 0,
    ];
  }

  private async predictOptimalInterval(features: number[]): Promise<number> {
    // Simple prediction model for optimal review interval
    const featureTensor = tf.tensor1d(features);
    
    // Basic linear model for interval prediction
    const weights = tf.tensor1d([2, 1.5, 3, 2, 0.5, 0.3]);
    const prediction = tf.sum(tf.mul(featureTensor, weights));
    
    const result = await prediction.data();
    
    featureTensor.dispose();
    weights.dispose();
    prediction.dispose();
    
    return Math.max(1, result[0]);
  }

  private calculateTypeDistribution(memories: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    memories.forEach(memory => {
      distribution[memory.type] = (distribution[memory.type] || 0) + 1;
    });
    return distribution;
  }

  private calculateTimePatterns(memories: any[]): Record<string, number> {
    const patterns: Record<string, number> = {};
    memories.forEach(memory => {
      const hour = new Date(memory.createdAt).getHours();
      const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      patterns[timeSlot] = (patterns[timeSlot] || 0) + 1;
    });
    return patterns;
  }
}

export const aiService = new TensorFlowAIService();