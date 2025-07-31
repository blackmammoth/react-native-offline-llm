import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import useLLMInference from "./lib/useLLMInference";
import Chat from "./components/Chat";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const llm = useLLMInference();
  // // Todo: Prepare a text input field for user to enter text and a button to submit the text and a box to get the response
  // // // Todo: Use loading spinner to indicate model loading

  // Todo: Do I even need promises for this stuff? If not, then remove them. If needed, make the promise 
  // interface more clear and consistent


  if (!llm.isLoaded) {
    return (
      <SafeAreaProvider>
        {" "}
        {/* provider must wrap EVERY screen render */}
        <View style={styles.container}>
          <Text>Loading LLM model...</Text>
          <StatusBar style="auto" />
        </View>
      </SafeAreaProvider>
    );
  }

  // // Todo: There are multiple listeners being fired. Fix
  // Todo: In the first run, only the final response is recieved with no streaming. In the second run and after, streaming works.

  // Todo: close session of the model when the user exits the app

  // Todo: If model is already loaded, don't create it again. If it's not loaded, create it.
  // Right now, clicking a and doing r, increases the ram a lot. I need to check if it's going
  // to happen again if I prompt the model again and again

  // Todo: Add a button to close the session and release the model resources - check if it frees up the memory

  // Todo: What are the purposes of the request Ids?

  // Todo: Strip down the code to only the necessary parts for the app to run

  // Todo: Add error handling for model loading and response generations

  // Todo: Polish code and replace with typescript

  // Todo: Find a way to send multiple messages

  // Todo: Publish Package (add config option) to NPM


  return (
    <SafeAreaProvider>
      <Chat llm={llm} />
    </SafeAreaProvider>
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
