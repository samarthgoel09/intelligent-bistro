import { Pressable, Text, View } from "react-native";
import type { CartItem } from "../types";

type Props = {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

export function CartRow({ item, onIncrement, onDecrement, onRemove }: Props) {
  const linePrice = item.price * item.quantity;
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-1 pr-3">
        <Text className="font-medium">{item.name}</Text>
        {item.modifiers && item.modifiers.length > 0 && (
          <Text className="text-xs text-gray-500">{item.modifiers.join(", ")}</Text>
        )}
        <Text className="text-sm text-gray-700 mt-1">${linePrice.toFixed(2)}</Text>
      </View>
      <View className="flex-row items-center">
        <Pressable
          onPress={onDecrement}
          className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
          accessibilityLabel="Decrease quantity"
        >
          <Text className="text-lg">−</Text>
        </Pressable>
        <Text className="mx-3 w-6 text-center">{item.quantity}</Text>
        <Pressable
          onPress={onIncrement}
          className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
          accessibilityLabel="Increase quantity"
        >
          <Text className="text-lg">+</Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          className="ml-3 w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
          accessibilityLabel={`Remove ${item.name}`}
        >
          <Text className="text-gray-500">✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
