import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { placeOrder } from "../api/client";
import { CartRow } from "../components/CartRow";
import { useCart } from "../store/cartStore";

export function CartScreen() {
  const navigation = useNavigation<any>();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total)();

  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-500 text-lg mb-4">Your cart is empty</Text>
        <Pressable
          onPress={() => navigation.navigate("Menu")}
          className="rounded-full bg-brand px-6 py-3"
        >
          <Text className="text-white font-medium">Browse menu</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const checkout = async () => {
    setSubmitting(true);
    try {
      await placeOrder(items);
      clear();
      Alert.alert("Order placed!", "Thanks, your order is in.", [
        { text: "OK", onPress: () => navigation.navigate("Menu") },
      ]);
    } catch (e) {
      Alert.alert("Checkout failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pt-2 pb-3">
        <Text className="text-3xl font-bold">Cart</Text>
      </View>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {items.map((item) => (
          <CartRow
            key={item.id}
            item={item}
            onIncrement={() => setQuantity(item.id, item.quantity + 1)}
            onDecrement={() => setQuantity(item.id, item.quantity - 1)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </ScrollView>
      <View className="px-5 pt-3 pb-6 border-t border-gray-100 bg-white">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-base text-gray-600">Total</Text>
          <Text className="text-2xl font-semibold">${total.toFixed(2)}</Text>
        </View>
        <Pressable
          onPress={checkout}
          disabled={submitting}
          className={`rounded-full py-4 items-center ${submitting ? "bg-gray-400" : "bg-brand"}`}
        >
          <Text className="text-white font-semibold">
            {submitting ? "Placing order..." : "Checkout"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

