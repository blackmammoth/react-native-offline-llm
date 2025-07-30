import React from "react";
import { NativeEventEmitter } from "react-native";
import NativeLlmMediapipe from "../specs/NativeLlmMediapipe";

const eventEmitter = new NativeEventEmitter(NativeLlmMediapipe);

function getLlmInference() {
  return NativeLlmMediapipe;
}

eventEmitter.addListener("logging", (ev) => {
  console.log(`${ev.message}`);
});

export default function useLLMInference(config = {}) {
  const [isLoaded, setIsLoaded] = React.useState(false);


  React.useEffect(() => {
    if (isLoaded) return;

    getLlmInference()
      .createModel(512, 40, 0.8, 0)
      .then(() => {
        setIsLoaded(true);
        console.log("LLM model loaded successfully");
      })
      .catch((error) => {
        console.error("Error loading LLM model:", error);
      });

    return () => {
      getLlmInference().closeSession();
      console.log("LLM session closed");
      setIsLoaded(false);
    };
  }, []);

  const generateResponse = React.useCallback(
    async (inputText) => {
      if (!isLoaded) {
        throw new Error("LLM model is not loaded yet");
      }

      try {
        const response = getLlmInference().generateResponse(1, inputText);
        console.log("LLM response:", response);
        return response;
      } catch (error) {
        console.error("Error generating LLM response:", error);
        throw error;
      }
    }
  );

  generateResponse("Hello, how are you?");

  // return isLoaded and generateResponse function from the hook
  return React.useMemo(() => ({ isLoaded, generateResponse }), [isLoaded, generateResponse]);
}
