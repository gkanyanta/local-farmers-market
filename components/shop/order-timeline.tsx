import { Check, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  currentStatus: string;
}

const statuses = [
  { key: "PENDING_PAYMENT", label: "Payment Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SOURCING", label: "Being Sourced" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { key: "PICKED_UP", label: "Picked Up" },
];

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = statuses.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 text-red-600">
          <Circle className="h-5 w-5 fill-red-600" />
          <span className="font-medium">Order Cancelled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="space-y-4">
        {statuses.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={status.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    isCompleted && "bg-green-500",
                    isCurrent && "bg-primary",
                    isPending && "bg-gray-200"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : isCurrent ? (
                    <Clock className="h-4 w-4 text-white" />
                  ) : (
                    <Circle className="h-3 w-3 text-gray-400" />
                  )}
                </div>
                {index < statuses.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 mt-1",
                      index < currentIndex ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="pt-0.5">
                <p
                  className={cn(
                    "font-medium text-sm",
                    isCompleted && "text-green-600",
                    isCurrent && "text-primary",
                    isPending && "text-gray-400"
                  )}
                >
                  {status.label}
                </p>
                {isCurrent && status.key === "SOURCING" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Freshly sourced from local Zambian farmers
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
