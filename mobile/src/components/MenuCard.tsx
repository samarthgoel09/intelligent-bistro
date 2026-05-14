import { Pressable, Text, View } from "react-native";
import type { MenuItem } from "../types";

type Props = {
  item: MenuItem;
  onAdd: () => void;
};

export function MenuCard({ item, onAdd }: Props) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <Text className="text-lg font-semibold">{item.name}</Text>
      <Text className="text-sm text-gray-500 mt-1">{item.description}</Text>
      <View className="flex-row justify-between items-center mt-3">
        <Text className="text-lg font-medium">${item.price.toFixed(2)}</Text>
        <Pressable
          onPress={onAdd}
          className="rounded-full bg-brand px-4 py-2"
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name} to cart`}
        >
          <Text className="text-white font-medium">+ Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
