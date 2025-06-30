export interface ReviewResult {
  score: number; // 0-3 (Again, Hard, Good, Easy)
  interval: number; // days until next review
  nextReview: Date;
}

export function calculateNextReview(
  score: number,
  reviewCount: number,
  lastScore: number = 0
): ReviewResult {
  let intervalDays = 1;

  // Simple spaced repetition algorithm based on SM-2
  switch (score) {
    case 0: // Again - restart interval
      intervalDays = 1;
      break;
    case 1: // Hard - shorter interval
      intervalDays = Math.max(1, Math.floor(reviewCount * 0.5));
      break;
    case 2: // Good - normal progression
      intervalDays = Math.max(1, reviewCount * 2);
      break;
    case 3: // Easy - longer interval
      intervalDays = Math.max(1, reviewCount * 4);
      break;
  }

  // Apply some randomization to avoid review clustering
  const jitter = Math.random() * 0.2 - 0.1; // ±10%
  intervalDays = Math.max(1, Math.floor(intervalDays * (1 + jitter)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);

  return {
    score,
    interval: intervalDays,
    nextReview,
  };
}

export function getReviewDifficulty(score: number): {
  label: string;
  color: string;
  description: string;
} {
  switch (score) {
    case 0:
      return {
        label: "Again",
        color: "red",
        description: "Couldn't recall",
      };
    case 1:
      return {
        label: "Hard",
        color: "yellow",
        description: "Partial recall",
      };
    case 2:
      return {
        label: "Good",
        color: "green",
        description: "Good recall",
      };
    case 3:
      return {
        label: "Easy",
        color: "blue",
        description: "Perfect recall",
      };
    default:
      return {
        label: "Unknown",
        color: "gray",
        description: "No score",
      };
  }
}

export function getMemoriesOnThisDay(memories: any[], date: Date = new Date()): any[] {
  const targetMonth = date.getMonth();
  const targetDay = date.getDate();

  return memories.filter(memory => {
    const memoryDate = new Date(memory.createdAt);
    return (
      memoryDate.getMonth() === targetMonth &&
      memoryDate.getDate() === targetDay &&
      memoryDate.getFullYear() !== date.getFullYear() // Exclude current year
    );
  });
}
