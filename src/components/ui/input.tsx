import { cn } from "@/lib/utils";
import { Platform, TextInput } from "react-native";
import { forwardRef, useEffect, useMemo, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

type InputProps = React.ComponentProps<typeof TextInput> & {
  /** Prompts are typed, held, and erased in order while the field is empty. */
  placeholders?: readonly string[];
  animationInterval?: number;
  characterEnterDuration?: number;
  characterExitDuration?: number;
  characterDelayIncrement?: number;
};

function useAnimatedPlaceholder({
  animationInterval,
  characterDelayIncrement,
  characterEnterDuration,
  characterExitDuration,
  placeholder,
  placeholders,
  reduceMotion,
}: {
  animationInterval: number;
  characterDelayIncrement: number;
  characterEnterDuration: number;
  characterExitDuration: number;
  placeholder: string | undefined;
  placeholders: readonly string[] | undefined;
  reduceMotion: boolean;
}): string | undefined {
  const prompts = useMemo(() => {
    const supplied = placeholders?.map((item) => item.trim()).filter(Boolean);
    if (supplied?.length) return supplied;
    return placeholder ? [placeholder] : [];
  }, [placeholder, placeholders]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [characterCount, setCharacterCount] = useState(
    reduceMotion ? (prompts[0]?.length ?? 0) : 0,
  );
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    setPromptIndex(0);
    setCharacterCount(reduceMotion ? (prompts[0]?.length ?? 0) : 0);
    setPhase("enter");
  }, [prompts, reduceMotion]);

  useEffect(() => {
    if (!prompts.length || reduceMotion || prompts.length === 1) return;

    const prompt = (prompts[promptIndex] ?? prompts[0])!;
    const delay = phase === "enter"
      ? characterEnterDuration + characterDelayIncrement
      : phase === "hold"
        ? animationInterval
        : characterExitDuration + characterDelayIncrement;

    const timeout = setTimeout(() => {
      if (phase === "enter") {
        const nextCount = Math.min(characterCount + 1, prompt.length);
        setCharacterCount(nextCount);
        if (nextCount === prompt.length) setPhase("hold");
      } else if (phase === "hold") {
        setPhase("exit");
      } else {
        const nextCount = Math.max(characterCount - 1, 0);
        setCharacterCount(nextCount);
        if (nextCount === 0) {
          setPromptIndex((index) => (index + 1) % prompts.length);
          setPhase("enter");
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [
    animationInterval,
    characterCount,
    characterDelayIncrement,
    characterEnterDuration,
    characterExitDuration,
    phase,
    promptIndex,
    prompts,
    reduceMotion,
  ]);

  if (!prompts.length) return undefined;
  if (reduceMotion || prompts.length === 1) return prompts[0];
  return (prompts[promptIndex] ?? prompts[0])!.slice(0, characterCount);
}

const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    animationInterval = 1800,
    characterDelayIncrement = 12,
    characterEnterDuration = 24,
    characterExitDuration = 12,
    className,
    placeholder,
    placeholders,
    ...props
  },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const animatedPlaceholder = useAnimatedPlaceholder({
    animationInterval,
    characterDelayIncrement,
    characterEnterDuration,
    characterExitDuration,
    placeholder,
    placeholders,
    reduceMotion,
  });

  return (
    <TextInput
      ref={ref}
      className={cn(
        "dark:bg-input/30 border-input bg-background text-foreground font-body flex min-h-12 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 text-base leading-5",
        props.editable === false &&
          cn(
            "opacity-50",
            Platform.select({
              web: "disabled:pointer-events-none disabled:cursor-not-allowed",
            }),
          ),
        Platform.select({
          web: cn(
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          ),
          native: "placeholder:text-muted-foreground/50",
        }),
        className,
      )}
      placeholder={animatedPlaceholder}
      {...props}
    />
  );
});

export { Input };
