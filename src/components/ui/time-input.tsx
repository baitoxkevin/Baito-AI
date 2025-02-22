import * as React from "react";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./scroll-area";
import { Clock } from "lucide-react";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimeInput({ value, onChange, className }: TimeInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 12 }, (_, i) => 
    String(i + 1).padStart(2, '0')
  );
  const minutes = Array.from({ length: 60 }, (_, i) => 
    String(i).padStart(2, '0')
  );
  const periods = ['AM', 'PM'];

  const [selectedHour, selectedMinute, selectedPeriod] = value.split(' ')[0].split(':')
    .concat(value.split(' ')[1] || 'AM');

  const handleTimeSelect = (type: 'hour' | 'minute' | 'period', selected: string) => {
    const [hour, minute] = value.split(' ')[0].split(':');
    const period = value.split(' ')[1] || 'AM';

    let newValue = '';
    if (type === 'hour') {
      newValue = `${selected}:${minute} ${period}`;
    } else if (type === 'minute') {
      newValue = `${hour}:${selected} ${period}`;
    } else {
      newValue = `${hour}:${minute} ${selected}`;
    }
    onChange(newValue);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="grid grid-cols-3 gap-2 p-3">
          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-2">
              {hours.map((hour) => (
                <Button
                  key={hour}
                  variant={selectedHour === hour ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTimeSelect('hour', hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="h-[200px] rounded-md border">
            <div className="p-2">
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  variant={selectedMinute === minute ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleTimeSelect('minute', minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="space-y-2">
            {periods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleTimeSelect('period', period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
