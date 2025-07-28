import React from "react";
import { NativeEventEmitter, NativeModules } from "react-native";

const { LlmInferenceModule } = NativeModules;

const eventEmitter = new NativeEventEmitter(LlmInferenceModule);

function getLlmInference() {
  return LlmInferenceModule;
}

eventEmitter.addListener("logging", (ev) => {
  console.log(`[${ev.handle}] ${ev.message}`);
});

export default function useLLMInference(config) {
  const modelPath = config.modelPath;
  console.log(modelPath);

  const modelHandle = 1
  React.useEffect(() => {
    let newHandle;
    const modelCreatePromise = getLlmInference().createModel(
      modelPath,
      config.maxTokens ?? 512,
      config.topK ?? 40,
      config.temperature ?? 0.8,
      config.randomSeed ?? 0
    );

    // remove handle part
    modelCreatePromise
      .then((handle) => {
        console.log(`Created model with handle ${handle}`);
      })
      .catch((error) => {
        console.error("createModel", error);
      });

    return () => {
      getLlmInference()
        .closeSession()
        .then(() => {
          console.log(`Closed Session`);
        })
        .catch(() => {
          console.error("Error with closing session");
        });
    };
  }, [
    config.maxTokens,
    config.modelPath,
    config.randomSeed,
    config.temperature,
    config.topK,
  ]);

  const nextRequestIdRef = React.useRef(0);

  const generateResponse = React.useCallback(
    async (prompt, onPartial, onError, abortSignal) => {
      const requestId = nextRequestIdRef.current++;

      // Todo: change to onResponseCompletion
      const partialSub = eventEmitter.addListener("onPartialResponse", (ev) => {
        // console.log(
        //   `[${ev.handle}] partial response ${ev.requestId}: ${ev.partial}`
        // );
        console.log(JSON.stringify(ev));
        if (
          onPartial &&
          requestId === ev.requestId &&
          !(abortSignal?.aborted ?? false)
        ) {
          onPartial(ev.response, ev.requestId);
        }
      });
      const errorSub = eventEmitter.addListener("onErrorResponse", (ev) => {
        console.log(`error ${ev.requestId}: ${ev.error}`);
        if (
          onError &&
          requestId === ev.requestId &&
          !(abortSignal?.aborted ?? false)
        ) {
          onError(ev.error, ev.requestId);
        }
      });

      try {
        return await getLlmInference().generateResponse(
          requestId,
          prompt
        );
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        console.log("finally: removing listeners");
        partialSub.remove();
        errorSub.remove();
      }
    },
    []
  );

  return React.useMemo(
    () => ({ generateResponse, isLoaded: modelHandle !== undefined }),
    [generateResponse]
  );
}
