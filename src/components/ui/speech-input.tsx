import * as React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface SpeechInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSpeechResult?: (transcript: string) => void;
  multiline?: boolean;
  rows?: number;
}

const SpeechInput = React.forwardRef<HTMLInputElement, SpeechInputProps>(
  ({ className, onSpeechResult, onChange, value, multiline = false, rows = 3, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(value || '');

    const handleSpeechResult = React.useCallback((transcript: string) => {
      const newValue = localValue ? `${localValue} ${transcript}` : transcript;
      setLocalValue(newValue);

      // Create a synthetic event to trigger onChange
      if (onChange) {
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }

      if (onSpeechResult) {
        onSpeechResult(transcript);
      }
    }, [localValue, onChange, onSpeechResult]);

    const { isListening, startListening, stopListening, isSupported, transcript } = useSpeechToText({
      onResult: handleSpeechResult,
    });

    // Sync external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setLocalValue(value as string);
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
      if (onChange) {
        onChange(e as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const toggleListening = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

    const inputClasses = cn(
      'pr-10',
      isListening && 'ring-2 ring-violet-500 border-violet-500',
      className
    );

    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            value={localValue}
            onChange={handleInputChange}
            className={inputClasses}
            rows={rows}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <Input
            ref={ref}
            value={localValue}
            onChange={handleInputChange}
            className={inputClasses}
            {...props}
          />
        )}

        {isSupported && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleListening}
                  className={cn(
                    'absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0',
                    isListening && 'text-violet-600 bg-violet-100 hover:bg-violet-200'
                  )}
                >
                  {isListening ? (
                    <Mic className="h-4 w-4 animate-pulse text-violet-600" />
                  ) : (
                    <Mic className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{isListening ? 'Stop listening' : 'Click to speak'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Live transcript indicator */}
        {isListening && transcript && (
          <div className="absolute -bottom-6 left-0 text-xs text-violet-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="truncate max-w-[200px]">{transcript}</span>
          </div>
        )}
      </div>
    );
  }
);
SpeechInput.displayName = 'SpeechInput';

export { SpeechInput };
