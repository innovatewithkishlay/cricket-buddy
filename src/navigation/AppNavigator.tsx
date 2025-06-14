import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { User } from "firebase/auth";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import VerificationScreen from "../screens/VerificationScreen";
import NewMatchScreen from "../screens/NewMatchScreen";
import PastMatchesScreen from "../screens/PastMatchesScreen";
import ExportScreen from "../screens/ExportScreen";
import MatchScoringScreen from "../screens/MatchScoringScreen";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Verification: { email: string };
  NewMatch: undefined;
  PastMatches: undefined;
  Export: undefined;
  MatchScoring: { matchId: string }; // NEW
};

interface AppNavigatorProps {
  user: User | null;
}

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator({ user }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "Home" : "Auth"}>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Cricket Buddy", headerShown: false }}
            />
            <Stack.Screen
              name="NewMatch"
              component={NewMatchScreen}
              options={{ title: "New Match", headerShown: true }}
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
            <Stack.Screen
              name="MatchScoring"
              component={MatchScoringScreen}
              options={{ title: "Live Scoring" }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Verification"
              component={VerificationScreen}
              options={{ title: "Verify Email", headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
