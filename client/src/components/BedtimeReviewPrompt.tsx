import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Clock } from "lucide-react";

export function BedtimeReviewPrompt() {
  return (
    <Card className="bg-gradient-to-r from-purple-500 to-purple-400 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bedtime Review Reminder</h3>
            <p className="text-purple-100 mb-4">
              Reviewing before sleep helps consolidate memories. Take a moment to review now.
            </p>
            <Link href="/review">
              <Button variant="secondary">
                <Clock className="w-4 h-4 mr-2" />
                Start Bedtime Review
              </Button>
            </Link>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
