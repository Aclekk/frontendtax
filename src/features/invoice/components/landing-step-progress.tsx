"use client";

import { Check, User, FileText, ScanSearch, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type LandingStep = "customer" | "invoice-search" | "invoice-confirm" | "success";

const STEPS: { id: "customer" | "invoice-search" | "success"; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "customer", label: "Customer", hint: "Your details", icon: User },
  { id: "invoice-search", label: "Invoice", hint: "Find receipt", icon: FileText },
  { id: "success", label: "Done", hint: "Submitted", icon: Check },
];

function normalizeProgressStep(step: LandingStep) {
  return step === "invoice-confirm" ? "invoice-search" : step;
}

export function LandingStepProgress({
  currentStep,
  onStepSelect,
}: {
  currentStep: LandingStep;
  onStepSelect?: (step: LandingStep) => void;
}) {
  const currentIndex = STEPS.findIndex((step) => step.id === normalizeProgressStep(currentStep));

  return (
    <nav aria-label="Refund progress" className="w-full">
      <ol className="flex w-full items-start justify-between gap-1 sm:gap-4">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const canSelect = Boolean(onStepSelect) && (isCompleted || isCurrent);
          const Icon = step.icon;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-1 items-start justify-center">
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-[calc(50%+1.6rem)] top-[1.6rem] hidden h-px w-[calc(100%-3.2rem)] bg-[#0B1B3B]/12 sm:block"
                />
              )}

              <div className="flex w-full max-w-[150px] flex-col items-center text-center">
                <button
                  type="button"
                  disabled={!canSelect}
                  onClick={() => canSelect && onStepSelect?.(step.id)}
                  className={cn(
                    "relative flex size-11 items-center justify-center rounded-full border transition-all duration-300 sm:size-14",
                    isCompleted &&
                      "border-[#0B1B3B]/12 bg-white text-[#0B1B3B]",
                    isCurrent &&
                      "border-[#0B1B3B] bg-[#0B1B3B] text-white shadow-[0_10px_24px_-6px_rgba(11,27,59,0.4)]",
                    isUpcoming &&
                      "border-[#0B1B3B]/12 bg-white text-[#0B1B3B]/30",
                    canSelect ? "cursor-pointer" : "cursor-default"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </button>

                <span
                  className={cn(
                    "mt-2.5 text-xs font-semibold sm:text-[13px]",
                    isCurrent && "text-[#D9B86B]",
                    isCompleted && "text-[#0B1B3B]/50",
                    isUpcoming && "text-[#0B1B3B]/30"
                  )}
                >
                  {index + 1}
                </span>

                <span
                  className={cn(
                    "mt-1 block text-xs font-semibold sm:text-[13px]",
                    isCurrent && "text-[#0B1B3B]",
                    isCompleted && "text-[#0B1B3B]/70",
                    isUpcoming && "text-[#0B1B3B]/35"
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 hidden text-[11.5px] md:block",
                    isCurrent && "text-[#0B1B3B]/55",
                    isCompleted && "text-[#0B1B3B]/40",
                    isUpcoming && "text-[#0B1B3B]/30"
                  )}
                >
                  {step.hint}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}