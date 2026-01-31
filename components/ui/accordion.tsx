"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  value: string | null;
  onValueChange: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

interface AccordionProps {
  type?: "single" | "multiple";
  collapsible?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Accordion({ children, className, collapsible }: AccordionProps) {
  const [value, setValue] = React.useState<string | null>(null);

  const onValueChange = (newValue: string) => {
    if (collapsible && value === newValue) {
      setValue(null);
    } else {
      setValue(newValue);
    }
  };

  return (
    <AccordionContext.Provider value={{ value, onValueChange }}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div className={cn("border-b", className)} data-value={value}>
      {children}
    </div>
  );
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  const itemRef = React.useRef<HTMLButtonElement>(null);

  const itemValue = itemRef.current?.closest("[data-value]")?.getAttribute("data-value") || "";
  const isOpen = context?.value === itemValue;

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={() => context?.onValueChange(itemValue)}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

function AccordionContent({ children, className }: AccordionContentProps) {
  const context = React.useContext(AccordionContext);
  const itemRef = React.useRef<HTMLDivElement>(null);

  const itemValue = itemRef.current?.closest("[data-value]")?.getAttribute("data-value") || "";
  const isOpen = context?.value === itemValue;

  if (!isOpen) return null;

  return (
    <div
      ref={itemRef}
      className={cn("overflow-hidden text-sm pb-4 pt-0", className)}
    >
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
