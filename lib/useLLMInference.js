import React from "react";
import { NativeEventEmitter } from "react-native";
import NativeLlmMediapipe from "../specs/NativeLlmMediapipe";

const eventEmitter = new NativeEventEmitter(NativeLlmMediapipe);

function getLlmInference() {
  return NativeLlmMediapipe;
}

export default function useLLMInference(config = {}) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (isLoaded) return;

    // Todo: Add option for custom model loading parameters
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

  // ? Is there use for the call back here?
  const generateResponse = React.useCallback(
    async (prompt, onPartial, onError) => {
      try {
        eventEmitter.removeAllListeners("onPartialResponse");
        eventEmitter.removeAllListeners("onErrorResponse");

        eventEmitter.addListener("onPartialResponse", (event) => {
          onPartial(event.response, event.requestId);
        });

        eventEmitter.addListener("onErrorResponse", (event) => {
          onError(event.error, event.requestId);
        });

        const response = await getLlmInference().generateResponse(1, prompt);
        // console.log("Response received:", response);
        return response;
      } catch (error) {
        console.error("Error generating LLM response:", error);
        throw error;
      }
    }
  );

  // return isLoaded and generateResponse function from the hook
  // ? Should I memoize this? What is memoization and callbacks?
  return React.useMemo(
    () => ({ isLoaded, generateResponse }),
    [isLoaded, generateResponse]
  );
}
