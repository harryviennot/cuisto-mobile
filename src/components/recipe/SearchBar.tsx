/**
 * SearchBar component for recipe search
 * Beautiful, accessible search input with design tokens
 */
import { useState, useEffect, useRef } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { MagnifyingGlass, X } from "phosphor-react-native";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounceMs?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSearch,
  placeholder = "Search recipes...",
  isLoading = false,
  debounceMs = 150, // Reduced from 300ms for snappier feel
  readOnly = false,
  autoFocus = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search effect (skip if readOnly)
  useEffect(() => {
    if (readOnly) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only search if there's a query
    if (value.trim().length > 0) {
      debounceTimerRef.current = setTimeout(() => {
        onSearch(value.trim());
      }, debounceMs);
    }

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, debounceMs, onSearch, readOnly]);

  const handleClear = () => {
    onChangeText("");
    onSearch(""); // Trigger search with empty query to show all recipes
  };

  return (
    <View
      className={`flex-row items-center px-4 py-3 rounded-xl bg-surface-elevated border ${
        isFocused ? "border-primary" : "border-border"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isFocused ? 0.1 : 0.05,
        shadowRadius: 3,
        elevation: isFocused ? 2 : 1,
      }}
    >
      {/* Search Icon */}
      <MagnifyingGlass size={20} color={isFocused ? "#334d43" : "#5a4f3e"} weight="duotone" />

      {/* Text Input */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a8a29e"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="flex-1 ml-3 text-lg text-foreground-heading font-regular leading-6"
        style={{ outlineStyle: "none" } as any} // Remove web outline
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        editable={!readOnly}
        autoFocus={autoFocus}
        onSubmitEditing={() => {
          if (value.trim().length > 0) {
            onSearch(value.trim());
          }
        }}
      />

      {/* Clear Button - always reserve space to prevent layout shift */}
      <View style={{ width: 32, height: 32, justifyContent: "center", alignItems: "center" }}>
        {value.length > 0 && (
          <Pressable
            onPress={handleClear}
            className="p-1 rounded-full active:bg-surface"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#5a4f3e" weight="bold" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
