
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb } from "lucide-react";

interface Props {
  memoryTitle: string;
  onSubmit: (retrievalAttempt: string) => void;
}

export function RetrievalPractice({ memoryTitle, onSubmit }: Props) {
  const [retrievalAttempt, setRetrievalAttempt] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="w-5 h-5 mr-2" />
          Active Recall
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-neutral-600">
          Before you review this memory, try to recall the key details about "<strong>{memoryTitle}</strong>". What do you remember?
        </p>
        <Textarea
          value={retrievalAttempt}
          onChange={(e) => setRetrievalAttempt(e.target.value)}
          placeholder="Write down everything you can remember..."
          rows={5}
        />
        <Button onClick={() => onSubmit(retrievalAttempt)} className="w-full">
          Reveal Memory
        </Button>
      </CardContent>
    </Card>
  );
}
