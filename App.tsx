import { Provider as PaperProvider } from "react-native-paper";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/firebase/firebase";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <PaperProvider>
      <AppNavigator user={user} />
    </PaperProvider>
  );
}
