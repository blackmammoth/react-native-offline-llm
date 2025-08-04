import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";
import { generateResponseType } from "../lib/types";

/**
 * Interface matching the native Kotlin module "LlmInferenceModule".
 */
export interface Spec extends TurboModule {
  /**
   * Initializes the model.
   * @param maxTokens Maximum number of tokens.
   * @param topK       Sampling top‑k.
   * @param temperature Sampling temperature.
   * @param randomSeed Random seed for reproducibility.
   * @param accelerator Set the accelerator to either GPU/CPU
   * @returns          Resolves to a success message.
   */
  createModel(
    maxTokens: number,
    topK: number,
    temperature: number,
    randomSeed: number,
    accelerator: string
  ): Promise<string>;

  /**
   * Closes the current inference session.
   * @returns Resolves to `true` when the session is closed.
   */
  closeSession(): Promise<boolean>;

  /**
   * Closes the LLM Inference Engine
   * @returns Resolves to `true` when the session is closed.
   */
  closeEngine(): Promise<boolean>;

  /**
   * Sends a prompt to the model.
   * @param requestId Unique request identifier.
   * @param prompt    The text prompt to send.
   */
  generateResponse(
    requestId: number,
    prompt: string
  ): Promise<generateResponseType>;

  /**
   * Subscribes to native events.
   * Required by React Native’s Event Emitter.
   * @param eventName Name of the event to listen for.
   */
  addListener(eventName: string): void;

  /**
   * Removes all native event listeners for this module.
   * @param count Number of listeners to remove.
   */
  // ? What is the purpose of this method?
  removeListeners(count: number): void;
}

/**
 * Retrieves the native module instance, throwing if unavailable.
 */
export default TurboModuleRegistry.getEnforcing<Spec>("NativeLlmMediapipe");
