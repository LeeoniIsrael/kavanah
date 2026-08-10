import { Fragment } from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";

import { colors, spacing, type } from "@/design/theme";
import { parseAssistantContent } from "@/services/assistantFormatting";

type AssistantResponseTextProps = {
  content: string;
  style?: StyleProp<TextStyle>;
};

export function AssistantResponseText({ content, style }: AssistantResponseTextProps): React.JSX.Element | null {
  const blocks = parseAssistantContent(content);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={styles.stack}>
      {blocks.map((block, index) => {
        if (block.kind === "section") {
          return (
            <View key={`${block.kind}-${index}`} style={styles.section}>
              <Text style={[styles.sectionTitle, style]}>{block.title}</Text>
              {block.text ? <Text style={[styles.body, style]}>{renderInlineFormatting(block.text)}</Text> : null}
            </View>
          );
        }

        if (block.kind === "bullet") {
          return (
            <View key={`${block.kind}-${index}`} style={styles.bulletRow}>
              <Text style={[styles.bullet, style]}>•</Text>
              <Text style={[styles.body, styles.bulletText, style]}>{renderInlineFormatting(block.text)}</Text>
            </View>
          );
        }

        return (
          <Text key={`${block.kind}-${index}`} style={[styles.body, style]}>
            {renderInlineFormatting(block.text)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    return (
      <Fragment key={`${index}-${part}`}>
        {isBold ? <Text style={styles.bold}>{part.slice(2, -2)}</Text> : part.replace(/\*\*/g, "")}
      </Fragment>
    );
  });
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm
  },
  section: {
    gap: 3
  },
  sectionTitle: {
    ...type.body,
    color: colors.ink,
    fontWeight: "600"
  },
  body: {
    ...type.body,
    color: colors.ink
  },
  bold: {
    fontWeight: "600"
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  bullet: {
    ...type.body,
    color: colors.ink,
    fontWeight: "600"
  },
  bulletText: {
    flex: 1
  }
});
