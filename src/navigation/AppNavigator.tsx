import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import VerificationScreen from "../screens/VerificationScreen";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Verification: { email: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Auth">
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Cricket Buddy" }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{ title: "Verify Email", headerShown: false }}
      />
    </Stack.Navigator>
  );
}
