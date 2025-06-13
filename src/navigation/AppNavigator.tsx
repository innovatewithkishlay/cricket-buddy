import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import VerificationScreen from "../screens/VerificationScreen";
import NewMatchScreen from "../screens/NewMatchScreen";
import PastMatchesScreen from "../screens/PastMatchesScreen";
import ExportScreen from "../screens/ExportScreen";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Verification: { email: string };
  NewMatch: undefined;
  PastMatches: undefined;
  Export: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Cricket Buddy", headerShown: false }}
        />
        <Stack.Screen
          name="Verification"
          component={VerificationScreen}
          options={{ title: "Verify Email", headerShown: false }}
        />
        <Stack.Screen
          name="NewMatch"
          component={NewMatchScreen}
          options={{ title: "New Match" }}
        />
        <Stack.Screen
          name="PastMatches"
          component={PastMatchesScreen}
          options={{ title: "Past Matches" }}
        />
        <Stack.Screen
          name="Export"
          component={ExportScreen}
          options={{ title: "Export Data" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
