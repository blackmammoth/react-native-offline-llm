import { useEffect, useState, useCallback, useMemo } from "react";
import { NativeEventEmitter } from "react-native";
import NativeLlmMediapipe from "../specs/NativeLlmMediapipe";
import { generateResponseType } from "./types";

const eventEmitter = new NativeEventEmitter(NativeLlmMediapipe);

export default function useLLMInference() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded) return;

    // Todo: Add option for custom model loading parameters
    NativeLlmMediapipe.createModel(512, 40, 0.8, 0)
      .then(() => {
        setIsLoaded(true);
        console.log("LLM model loaded successfully");
      })
      .catch((error) => {
        console.error("Error loading LLM model:", error);
      });

    return () => {
      console.log("LLM session closed");
      setIsLoaded(false);
    };
  }, []);

  // ? Is there use for the call back here?
  const generateResponse = useCallback(
    async (
      prompt: string,
      onPartial: (partial: string, requestId: number) => void,
      onError: (error: string, requestId: number) => void
    ): Promise<generateResponseType> => {
      const requestId = 1;

      // Capture subscriptions so we can remove them later individually
      const partialSubscription = eventEmitter.addListener(
        "onPartialResponse",
        (evt) => {
          if (evt.requestId === requestId) {
            onPartial(evt.partial, evt.requestId);
            console.log(
              "===>In partial=> " + evt.partial + " " + evt.requestId
            );
          }
        }
      );

      const errorSubscription = eventEmitter.addListener(
        "onErrorResponse",
        (evt) => {
          if (evt.requestId === requestId) onError(evt.error, evt.requestId);
        }
      );

      const p = NativeLlmMediapipe.generateResponse(requestId, prompt);

      // cleanup
      p.finally(() => {
        partialSubscription.remove()
        errorSubscription.remove()
      });

      return p;
    },
    []
  );

  // return isLoaded and generateResponse function from the hook
  // ? Should I memoize this? What is memoization and callbacks?
  return useMemo(
    () => ({ isLoaded, generateResponse }),
    [isLoaded, generateResponse]
  );
}
