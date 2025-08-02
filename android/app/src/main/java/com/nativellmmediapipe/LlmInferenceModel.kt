package com.nativellmmediapipe

import android.content.Context
import android.util.Log

import com.facebook.react.bridge.Promise
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import java.io.File
import java.io.FileOutputStream

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * A helper class for running LLM inference with a persistent session.
 */
class LlmInferenceModel(
    private val context: Context,
    private val maxTokens: Int = 256,
    private val topK: Int = 40,
    private val temperature: Float = 0.7f,
    private val randomSeed: Int = 0,
) {

    private var llmInference: LlmInference
    private var session: LlmInferenceSession
    private var requestId: Int = 0
    private var requestContent: String = ""

   init {
    val modelFile = File(context.filesDir, "gemma3-1b-it-int4.task")
    require(modelFile.exists()) { "Model file not found at ${modelFile.path}" }
    val options = LlmInference.LlmInferenceOptions.builder()
      .setModelPath(modelFile.absolutePath)
      .setMaxTokens(maxTokens)
      .setPreferredBackend(LlmInference.Backend.GPU)
      .build()
    llmInference = LlmInference.createFromOptions(context, options)
    session = buildSession(llmInference)
    Log.d("LlmTest", "Initialized…")
  }

    private fun buildSession(engine: LlmInference): LlmInferenceSession {
        val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
            .setTopK(topK)
            .setTopP(0.9f)
            .setTemperature(temperature)
            .build()
        Log.d("LlmTest", "Session built with options: $sessionOptions")
        return LlmInferenceSession.createFromOptions(engine, sessionOptions)
    }

    /**
     * Launches an async generation of the given prompt.
     */
    fun generateResponseAsync(requestId: Int, prompt: String,     onPartial: (String) -> Unit,
    onError: (String) -> Unit,
    onComplete: (String) -> Unit) {
        this.requestId = requestId

        session.addQueryChunk(prompt)
        
        session.generateResponseAsync { partial, done ->
            if (!done) {
                onPartial(partial)
                // Incrementally build the response
                requestContent += partial
            } else {
                // Final bit received
                onComplete(requestContent + partial)
                Log.d("LlmTest", "/// Request $requestId completed with response: $requestContent ///")
                requestContent = "" // Reset for next request
            }
        }
    }

    /**
     * Closes the LLM session, clearing prior context.
     */
    fun closeSession() {
            try {
      session.close()
      Log.d("LlmTest", "Session has been reset successfully.")
    } catch (e: Exception) {
      Log.e("LlmTest", "Failed to close the LLM Inference session: ${e.message}")
      throw Exception("Failed to close the LLM Inference session: ${e.message}")
    }
        
    }

    /**
      *  Close the LLM session and LLM Inference engine altogether.
     */
     fun closeEngine() {

        try {
            
        closeSession()
        llmInference.close()
        Log.d("LlmTest", "LLM Inference session and engine CLOSED.")
        } catch (e: Exception) {
      Log.e("LlmTest", "Failed to close the LLM Inference engine: ${e.message}")
      throw Exception("Failed to close the LLM Inference engine: ${e.message}")
    }
     }

    /**
    * Reset the model instance to allow for a fresh session
     */

     fun resetSession() {
        try {
            closeSession()
            // Rebuild the session with the same engine
            session = buildSession(llmInference)
            Log.d("LlmTest", "LLM session RESET successfully.")
        } catch (e: Exception) {
            Log.e("LlmTest", "Failed to reset the LLM Inference session: ${e.message}")
            throw Exception("Failed to reset the LLM Inference session: ${e.message}")
        }

     }

    /**
     * Stops current inference if running.
     */
    fun stopResponse() {
        session.cancelGenerateResponseAsync()
    }

    // companion object {
    // @Volatile private var instance: LlmInferenceModel? = null

    // /**  
    //  * Thread-safe lazy getter for the single model.  
    //  */
    // fun getInstance(
    //   context: Context,
    //   maxTokens: Int = 256,
    //   topK: Int = 40,
    //   temperature: Float = 0.7f,
    //   randomSeed: Int = 0
    // ): LlmInferenceModel {
    //   return instance
    // }
// }
}