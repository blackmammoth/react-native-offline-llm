import React, { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import useLLMInference from "./lib/useLLMInference";
import Chat from "./components/Chat";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App(): JSX.Element {
  const { isLoaded, generateResponse } = useLLMInference({
    maxTokens: 512,
    topK: 40,
    temperature: 0.8,
    randomSeed: 0,
    accelerator: "CPU",
  });

  if (!isLoaded) {
    return (
      <SafeAreaProvider>
        {/* Provider must wrap every screen render */}
        <View style={styles.container}>
          <Text>Loading LLM model...</Text>
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Chat generateResponse={generateResponse} />
    </SafeAreaProvider>
  );
}

// Define your stylesheet with proper typing
interface Styles {
  container: ViewStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
