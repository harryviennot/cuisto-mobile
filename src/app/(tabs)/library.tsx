import { Button, View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

export default function LibraryScreen() {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Library Tab</Text>

      <Button title="Sign out" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 20,
    fontFamily: "PlayfairDisplay_700Bold",
  },
});
