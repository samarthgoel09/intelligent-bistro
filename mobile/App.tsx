import "./global.css";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MenuScreen } from "./src/screens/MenuScreen";
import { CartScreen } from "./src/screens/CartScreen";
import { ChatScreen } from "./src/screens/ChatScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Menu"
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#15803D",
            tabBarInactiveTintColor: "#9ca3af",
            tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
          }}
        >
          <Tab.Screen
  name="Menu"
  component={MenuScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="restaurant-outline" size={size} color={color} />
    ),
  }}
/>
<Tab.Screen
  name="Cart"
  component={CartScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="cart-outline" size={size} color={color} />
    ),
  }}
/>
<Tab.Screen
  name="Chat"
  component={ChatScreen}
  options={{
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
    ),
  }}
/>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
