import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import useLLMInference from "./lib/useLLMInference";

export default function App() {
  const llm = useLLMInference();
  // // Todo: Use loading spinner to indicate model loading
  if (!llm.isLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading LLM model...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Todo: Use llm.generateResponse to generate responses based on user input - have a function for it

  // Todo: Prepare a text input field for user to enter text and a button to submit the text and a box to get the response

  // Todo: close session of the model when the user exits the app

  // Todo: If model is already loaded, don't create it again. If it's not loaded, create it.
  // Right now, clicking a and doing r, increases the ram a lot. I need to check if it's going 
  // to happen again if I prompt the model again and again

  // Todo: Add a button to close the session and release the model resources - check if it frees up the memory

  // Todo: What are the purposes of the request Ids?

  // Todo: Do I even need promises for this stuff? If not, then remove them.

  // Todo: Add error handling for model loading and response generations
  return (
    <View style={styles.container}>
      <Text>Check yousadsadsad sadas sadhas</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
