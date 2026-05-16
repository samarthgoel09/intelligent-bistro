import { Pressable, Text, View } from "react-native";
import type { MenuItem } from "../types";

type Props = {
  item: MenuItem;
  onAdd: () => void;
};

const CATEGORY_EMOJI: Record<MenuItem["category"], string> = {
  main: "🍽️",
  side: "🥗",
  drink: "🥤",
  dessert: "🍰",
};

export function MenuCard({ item, onAdd }: Props) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <View className="flex-row justify-between items-start">
        <Text className="text-lg font-semibold flex-1 pr-2">{item.name}</Text>
        <Text className="text-2xl">{CATEGORY_EMOJI[item.category]}</Text>
      </View>
      <Text className="text-sm text-gray-500 mt-1">{item.description}</Text>
      <View className="flex-row justify-between items-center mt-3">
        <Text className="text-lg font-medium">${item.price.toFixed(2)}</Text>
        <Pressable
          onPress={onAdd}
          className="rounded-full bg-brand px-4 py-2"
        >
          <Text className="text-white font-medium">+ Add</Text>
        </Pressable>
      </View>
    </View>
  );
}