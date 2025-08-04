import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { NativeEventEmitter } from "react-native";
import NativeLlmMediapipe from "../specs/NativeLlmMediapipe";
import { generateResponseType } from "./types";

const eventEmitter = new NativeEventEmitter(NativeLlmMediapipe);

export default function useLLMInference(
  modelConfig: {
    maxTokens: number;
    topK: number;
    temperature: number;
    randomSeed: number;
    accelerator: "CPU" | "GPU";
  } = {
    maxTokens: 512,
    topK: 40,
    temperature: 0.8,
    randomSeed: 0,
    accelerator: "CPU",
  }
) {
  const requestIdRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded) return;

    NativeLlmMediapipe.createModel(
      modelConfig.maxTokens,
      modelConfig.topK,
      modelConfig.temperature,
      modelConfig.randomSeed,
      modelConfig.accelerator
    )
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
      // We need the IDs because they allow us to subscribe to different prompts individually.
      // If we can guarantee that only one instance of generateResponse would execute at a time,
      // we could safely remove the requestIds. But the user of the library may decide to generate
      // many responses at the same time, in which case, we would need to track the requestId. This requestId
      // is entirely independent from the requestId in the Chat component UI.

      const requestId = ++requestIdRef.current;

      // Capture subscriptions so we can remove them later individually
      const partialSubscription = eventEmitter.addListener(
        "onPartialResponse",
        (evt) => {
          if (evt.requestId === requestId) {
            onPartial(evt.partial, evt.requestId);
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
        // This would remove the listener only associated with the particular requestId
        partialSubscription.remove();
        errorSubscription.remove();
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
