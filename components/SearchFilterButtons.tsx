// components/SearchFilterBar.tsx
import { useTheme } from "@/store/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  showFilterButton?: boolean;
  onPressFilter?: () => void;
  containerStyle?: ViewStyle;
  inputProps?: TextInputProps;
};

const SearchFilterBar = forwardRef<TextInput, Props>(function SearchFilterBar(
  {
    value,
    onChangeText,
    placeholder = "Search…",
    showFilterButton = true,
    onPressFilter,
    containerStyle,
    inputProps,
  },
  ref
) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, containerStyle]}>
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.card, borderColor: colors.subtitle },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.subtitle} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.subtitle}
          style={[styles.input, { color: colors.text }]}
          returnKeyType="search"
          {...inputProps}
        />
      </View>

      {showFilterButton && (
        <TouchableOpacity
          onPress={onPressFilter}
          activeOpacity={0.8}
          style={[
            styles.filterBtn,
            { backgroundColor: colors.card, borderColor: colors.subtitle },
          ]}
        >
          <Ionicons name="options-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
});

export default SearchFilterBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
    marginBottom: 6,
  },
  searchWrap: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, paddingVertical: 6 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
