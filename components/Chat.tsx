import { useState, useRef } from "react";
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
    onPartial?: (partial: string, timestampId: number | undefined) => void,
    onError?: (message: string, timestampId: number | undefined) => void
  ) => Promise<string>;
};

const Chat: React.FC = ({ generateResponse }: LLM) => {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const flatListRef = useRef<FlatList<Message>>(null);

  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text) return;

    const timestampId = Date.now().toString();

    // Add the user’s message, then a bot **placeholder**
    setMessages((prev) => [
      ...prev,
      { id: timestampId + "-u", text: prompt, sender: "user" },
      { id: timestampId, text: "", sender: "bot" },
    ]);

    setPrompt("");
    setLoading(true);

    try {
      await generateResponse(
        text,
        // Callback to handle partial responses
        (newPartial) => {
          // route each partial chunk into the right message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === timestampId
                ? { ...msg, text: msg.text + newPartial }
                : msg
            )
          );
        },
        (errMessage) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === timestampId
                ? { ...msg, text: `[Error] ${errMessage}` }
                : msg
            )
          );
        }
      );
    } catch (err) {
      console.error("Error generating response:", err);
    } finally {
      setLoading(false);
    }

    // Scroll to bottom after new message
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <SafeAreaView style={styles.innerContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(msg) => msg.id}
          contentContainerStyle={styles.messagesContainer}
          // automatically scroll when content changes
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isUser = item.sender === "user";
            return (
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            );
          }}
          ListEmptyComponent={() =>
            !loading ? (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>
                  Incoming messages will appear here…
                </Text>
              </View>
            ) : null
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Type your prompt here..."
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            // disabled={loading}
          >
            {loading ? (
              <Ionicons name="hourglass" size={24} color="#888" />
            ) : (
              <Ionicons name="send" size={24} color="#007AFF" />
            )}
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
