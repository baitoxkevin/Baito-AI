import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIExtractionSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (model: string) => void;
  currentModel: string;
}

const AI_MODELS = [
  {
    id: 'google/gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash ⭐',
    description: 'Fast, 1M context - same as chatbot (recommended)',
    cost: '$0.075 per 1M tokens'
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Reliable OpenAI model',
    cost: '$0.50 per 1M tokens'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Best reasoning and accuracy',
    cost: '$3.00 per 1M tokens'
  },
  {
    id: 'deepseek/deepseek-chat-v3.1:free',
    name: 'DeepSeek Chat v3.1 (Free)',
    description: 'Free but requires privacy settings',
    cost: 'Free'
  }
];

export function AIExtractionSettings({
  open,
  onOpenChange,
  onSave,
  currentModel
}: AIExtractionSettingsProps) {
  const [selectedModel, setSelectedModel] = useState(currentModel);

  const handleSave = () => {
    onSave(selectedModel);
    onOpenChange(false);
  };

  const selectedModelInfo = AI_MODELS.find(m => m.id === selectedModel);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Model Selection
          </DialogTitle>
          <DialogDescription>
            Choose which AI model to use for candidate information extraction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
            >
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.cost}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModelInfo && (
              <p className="text-sm text-muted-foreground">
                {selectedModelInfo.description}
              </p>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Using OpenRouter API:</strong> Your VITE_OPENROUTER_API_KEY from
              environment variables will be used (same as AI chatbot).
            </AlertDescription>
          </Alert>

          {/* Model Comparison */}
          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Model Comparison:</p>
            <div className="text-xs text-muted-foreground space-y-1 pl-4">
              <div>• <strong>Gemini 2.5 Flash:</strong> Best value, fast, 1M context</div>
              <div>• <strong>GPT-3.5 Turbo:</strong> Reliable and consistent</div>
              <div>• <strong>Claude 3.5 Sonnet:</strong> Highest accuracy</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
