import React, { useEffect, useState } from "react";
import { View, StyleSheet, Button, Text } from "react-native";
import { auth } from "../firebase/firebase";
import { sendEmailVerification } from "firebase/auth";
