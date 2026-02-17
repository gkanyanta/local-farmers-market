"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function getToday(): DateRange {
  const today = new Date().toISOString().split("T")[0];
  return { from: today, to: today, label: "Today" };
}

function getThisWeek(): DateRange {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  return {
    from: start.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    label: "This week",
  };
}

function getThisMonth(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: start.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    label: "This month",
  };
}

function getLast30Days(): DateRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 30);
  return {
    from: start.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
    label: "Last 30 days",
  };
}

const presets = [
  { label: "Today", getRange: getToday },
  { label: "This week", getRange: getThisWeek },
  { label: "This month", getRange: getThisMonth },
  { label: "Last 30 days", getRange: getLast30Days },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(value.label === "Custom");
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const handlePreset = (preset: (typeof presets)[0]) => {
    setShowCustom(false);
    onChange(preset.getRange());
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo, label: "Custom" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={value.label === preset.label ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
        <Button
          variant={showCustom ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCustom(true)}
        >
          Custom
        </Button>
      </div>
      {showCustom && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="date-from" className="text-xs">From</Label>
            <Input
              id="date-from"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-auto"
            />
          </div>
          <div>
            <Label htmlFor="date-to" className="text-xs">To</Label>
            <Input
              id="date-to"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button size="sm" onClick={handleCustomApply}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

export { getThisMonth };
