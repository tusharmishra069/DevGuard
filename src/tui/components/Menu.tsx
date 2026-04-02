import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";

export interface MenuItem {
  label: string;
  description: string;
  value: string;
}

export interface MenuProps {
  items: MenuItem[];
  onSelect: (value: string) => void;
}

export function Menu({ items, onSelect }: MenuProps): React.JSX.Element {
  const [index, setIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setIndex((current) => (current > 0 ? current - 1 : items.length - 1));
      return;
    }

    if (key.downArrow) {
      setIndex((current) => (current + 1) % items.length);
      return;
    }

    if (key.return) {
      onSelect(items[index]?.value ?? "");
      return;
    }

    if (/^[1-9]$/.test(input)) {
      const numericIndex = Number(input) - 1;
      if (numericIndex >= 0 && numericIndex < items.length) {
        onSelect(items[numericIndex]?.value ?? "");
      }
    }
  });

  const renderedItems = useMemo(
    () =>
      items.map((item, currentIndex) => {
        const selected = currentIndex === index;
        return (
          <Box key={item.value}>
            <Text color={selected ? "cyan" : "white"}>
              {selected ? "›" : " "} {currentIndex + 1}. {item.label}
            </Text>
            <Text color="gray"> — {item.description}</Text>
          </Box>
        );
      }),
    [index, items]
  );

  return <Box flexDirection="column">{renderedItems}</Box>;
}
