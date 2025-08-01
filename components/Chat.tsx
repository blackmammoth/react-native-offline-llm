import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

type LLM = {
  generateResponse: (
    prompt: string,
    onPartial?: (partial: string, requestId: number | undefined) => void,
    onError?: (message: string, requestId: number | undefined) => void
  ) => Promise<string>;
};

const Chat: React.FC = ({ generateResponse }: LLM) => {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text) return;

    // Reset
    setPartial("");
    setFinalText(null);
    setError(null);
    setLoading(true);

    try {
      const result = await generateResponse(
        text,
        // Callback to handle partial responses
        (newPartial, requestId) => {
          setPartial((prev) => prev + newPartial);
        },
        (message, requestId) => {
          setError(message);
          setLoading(false);
        }
      );

      setFinalText(result);
    } catch (err) {
      setError("Failed to generate response");
      console.error("Error generating response:", err);
    } finally {
      setLoading(false);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };
    setMessages((prev) => [...prev, newMessage]);
    setPrompt("");
    // Scroll to bottom after new message
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  console.log("Partial response:", partial);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <SafeAreaView style={styles.innerContainer}>
        <View style={styles.messagesContainer}>
          {/* placeholder only if no messages AND no streaming in progress */}
          {messages.length === 0 && !partial && (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Incoming messages will appear here....
              </Text>
            </View>
          )}

          {partial !== "" && (
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>{partial}</Text>
            </View>
          )}
        </View>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Type your prompt here..."
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1 },
  messagesContainer: { padding: 16, flexGrow: 1, justifyContent: "flex-end" },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { fontSize: 16, color: "#888" },
  messageBubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 8,
    maxWidth: "80%",
    backgroundColor: "#f0f0f0",
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#DCF8C5" },
  botBubble: { alignSelf: "flex-start", backgroundColor: "#ECECEC" },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  sendButton: { marginLeft: 8 },
});

export default Chat;
