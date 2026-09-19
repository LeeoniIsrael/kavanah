import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Fragment } from "react";
import { View, type StyleProp, type TextStyle } from "react-native";

import { parseAssistantContent } from "@/services/assistantFormatting";

type AssistantResponseTextProps = {
  content: string;
  style?: StyleProp<TextStyle>;
  className?: string;
};

export function AssistantResponseText({
  content,
  style,
  className,
}: AssistantResponseTextProps): React.JSX.Element | null {
  const blocks = parseAssistantContent(content);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      {blocks.map((block, index) => {
        if (block.kind === "section") {
          return (
            <View key={`${block.kind}-${index}`} className="gap-[3px]">
              <Text
                className={cn(
                  "text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading",
                  className,
                )}
                style={style}
              >
                {block.title}
              </Text>
              {block.text ? (
                <Text
                  className={cn(
                    "text-[16px] leading-[22px] font-normal tracking-normal text-foreground font-body",
                    className,
                  )}
                  style={style}
                >
                  {renderInlineFormatting(block.text)}
                </Text>
              ) : null}
            </View>
          );
        }

        if (block.kind === "bullet") {
          return (
            <View
              key={`${block.kind}-${index}`}
              className="flex-row items-start gap-2"
            >
              <Text
                className={cn(
                  "text-[16px] leading-[22px] font-semibold tracking-normal text-foreground font-heading",
                  className,
                )}
                style={style}
              >
                •
              </Text>
              <Text
                className={cn(
                  "text-[16px] leading-[22px] font-normal tracking-normal text-foreground font-body",
                  "flex-1",
                  className,
                )}
                style={style}
              >
                {renderInlineFormatting(block.text)}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={`${block.kind}-${index}`}
            className={cn(
              "text-[16px] leading-[22px] font-normal tracking-normal text-foreground font-body",
              className,
            )}
            style={style}
          >
            {renderInlineFormatting(block.text)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      const isBold = part.startsWith("**") && part.endsWith("**");
      return (
        <Fragment key={`${index}-${part}`}>
          {isBold ? (
            <Text className="font-semibold">{part.slice(2, -2)}</Text>
          ) : (
            part.replace(/\*\*/g, "")
          )}
        </Fragment>
      );
    });
}
