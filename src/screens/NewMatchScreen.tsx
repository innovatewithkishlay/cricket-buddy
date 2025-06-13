import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { auth, db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
