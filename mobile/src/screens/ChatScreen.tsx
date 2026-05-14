import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchMenu, sendChatMessage } from "../api/client";
import { useCart } from "../store/cartStore";
import type { MenuItem } from "../types";
import { Ionicons } from "@expo/vector-icons";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

const SUGGESTIONS = [
  "Add a spicy chicken sandwich",
  "What sides do you have?",
  "I'll have two waters and the salmon",
];

const newId = () => `${Date.now()}-${Math.random()}`;

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  const items = useCart((s) => s.items);
  const applyActions = useCart((s) => s.applyActions);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMenu();
        if (!cancelled) setMenu(data);
      } catch {
        // non-blocking: user can still chat, but ADD actions for unknown items will be skipped
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, sending]);

  const handleSend = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || sending) return;

      const userMsg: ChatMessage = {
        id: newId(),
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

try {
  const response = await sendChatMessage(text, items);
  setMessages((prev) => [
    ...prev,
    { id: newId(), role: "assistant", text: response.reply, timestamp: Date.now() },
  ]);
  applyActions(response.actions, menu);
} catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            text: "Sorry, something went wrong. Try again.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [applyActions, input, items, menu, sending]
  );

  const canSend = input.trim().length > 0 && !sending;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <Text className="text-3xl font-bold">Order with AI</Text>
          {menuLoading && <Text className="text-xs text-gray-400">Loading menu...</Text>}
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View className="mt-2">
              <Text className="text-sm text-gray-500 mb-3">Try one of these:</Text>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setInput(s);
                    handleSend(s);
                  }}
                  className="rounded-full bg-white border border-gray-200 px-4 py-2 mb-2 self-start"
                >
                  <Text className="text-sm">{s}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <View
                key={m.id}
                className="self-end max-w-[80%] bg-black rounded-2xl rounded-br-sm px-4 py-3 mb-2"
              >
                <Text className="text-white">{m.text}</Text>
              </View>
            ) : (
              <View
                key={m.id}
                className="self-start max-w-[80%] bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 mb-2"
              >
                <Text className="text-black">{m.text}</Text>
              </View>
            )
          )}

          {sending && (
            <View className="self-start bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 mb-2">
              <Text className="text-gray-400">•••</Text>
            </View>
          )}
        </ScrollView>

        <View className="px-3 py-2 border-t border-gray-100 bg-white flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Tell us what you'd like..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-gray-100 rounded-full px-4 py-3"
            accessibilityLabel="Message AI assistant"
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            editable={!sending}
            blurOnSubmit={false}
          />
<Pressable
            onPress={() => handleSend()}
            disabled={!canSend}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              canSend ? "bg-black" : "bg-gray-200"
            }`}
            accessibilityLabel="Send message"
          >
            <Ionicons name="arrow-up" size={20} color="white" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
