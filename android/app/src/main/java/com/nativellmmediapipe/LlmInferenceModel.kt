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

    private val llmInference: LlmInference
    private var session: LlmInferenceSession
    private var requestId: Int = 0
    private var requestContent: String = ""

    init {
        val modelFile = File(context.filesDir, "gemma3-1b-it-int4.task")
        val modelPath = modelFile.absolutePath

        // Ensure model file exists
        require(modelFile.exists()) { "Model file not found at $modelPath" }
        
        // Build engine options
        val optionsBuilder = LlmInference.LlmInferenceOptions.builder()
            .setModelPath(modelPath)
            .setMaxTokens(maxTokens)
            .setPreferredBackend(LlmInference.Backend.GPU)

        val options = optionsBuilder.build()

        // Create engine and initial session
        llmInference = LlmInference.createFromOptions(context, options)
        session = buildSession()
        Log.d("LlmInferenceModel", "Initialized LLM session with model: $modelPath")
    }

    private fun buildSession(): LlmInferenceSession {
        val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
            .setTopK(topK)
            .setTopP(0.9f)
            .setTemperature(temperature)
            .build()
        return LlmInferenceSession.createFromOptions(llmInference, sessionOptions)
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
        session.close()
        Log.d("LlmTest", "Session reset")
    }

    /**
     * Stops current inference if running.
     */
    fun stopResponse() {
        session.cancelGenerateResponseAsync()
    }
}