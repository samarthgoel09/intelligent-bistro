import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchMenu } from "../api/client";
import { MenuCard } from "../components/MenuCard";
import { useCart } from "../store/cartStore";
import type { MenuItem } from "../types";

const CATEGORY_ORDER: MenuItem["category"][] = ["main", "side", "drink", "dessert"];
const CATEGORY_LABEL: Record<MenuItem["category"], string> = {
  main: "Mains",
  side: "Sides",
  drink: "Drinks",
  dessert: "Desserts",
};

export function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cartItems = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const cartCount = cartItems.reduce((n, it) => n + it.quantity, 0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMenu();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator />
        <Text className="text-gray-500 mt-2">Loading menu...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <Pressable onPress={load} className="rounded-full bg-black px-6 py-3">
          <Text className="text-white font-medium">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items.filter((it) => it.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold">Bistro</Text>
        {cartCount > 0 && (
          <View className="bg-brand rounded-full px-3 py-1">
            <Text className="text-white text-xs font-medium">{cartCount} in cart</Text>
          </View>
        )}
      </View>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {grouped.map((group) => (
          <View key={group.category}>
            <Text className="text-xs uppercase tracking-wider text-gray-400 mt-6 mb-2">
              {CATEGORY_LABEL[group.category]}
            </Text>
            {group.items.map((item) => (
              <MenuCard key={item.id} item={item} onAdd={() => addItem(item, 1)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
