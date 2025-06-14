import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Button, Card, TextInput, Divider } from "react-native-paper";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import { db, auth } from "../firebase/firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

type MatchScoringScreenRouteProp = RouteProp<
  RootStackParamList,
  "MatchScoring"
>;
type Props = { route: MatchScoringScreenRouteProp };
