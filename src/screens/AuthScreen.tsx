import React, { useState, useEffect } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  Button,
  TextInput,
  Snackbar,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  PhoneAuthProvider,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import * as Google from "expo-auth-session/providers/google";
import {
  ANDROID_CLIENT_ID,
  EXPO_CLIENT_ID,
  IOS_CLIENT_ID,
} from "../firebase/googleConfig";
