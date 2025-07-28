package com.llmmediapipe

import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.FileOutputStream

class LlmInferenceModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var llmInferenceModel: LlmInferenceModel? = null

  override fun getName(): String {
    return "LlmInferenceModule"
  }

    private class InferenceModelListener(
    private val module: LlmInferenceModule,
  ) : InferenceListener {
    override fun logging(model: LlmInferenceModel, message: String) {
      module.emitEvent(
        "logging",
        Arguments.createMap().apply {
          this.putString("message", message)
        }
      )
    }

    override fun onError(model: LlmInferenceModel, requestId: Int, error: String) {
      module.emitEvent(
        "onErrorResponse",
        Arguments.createMap().apply {
          this.putInt("requestId", requestId)
          this.putString("error", error)
        }
      )
    }

    override fun onResults(model: LlmInferenceModel, requestId: Int, response: String) {
      module.emitEvent(
        // Todo: change response name to onResponseCompletion
        "onPartialResponse",
        Arguments.createMap().apply {
          this.putInt("requestId", requestId)
          this.putString("response", response)
        }
      )
    }
  }

  @ReactMethod
  fun createModel(
    maxTokens: Int,
    topK: Int,
    temperature: Double,
    randomSeed: Int,
    promise: Promise
  ) {
    try {
      llmInferenceModel =
        LlmInferenceModel(
          this.reactContext,
          maxTokens,
          topK,
          temperature.toFloat(),
          randomSeed,
          inferenceListener = InferenceModelListener(this)
        )
      promise.resolve("Model Creation Successful")
    } catch (e: Exception) {
      promise.reject("Model Creation Failed", e.localizedMessage)
    }
  }


  // close session instead of releasing model
  @ReactMethod
  fun closeSession(promise: Promise) {
    promise.resolve(true)
  }

  @ReactMethod
  fun generateResponse(requestId: Int, prompt: String) {
    llmInferenceModel?.generateResponseAsync(requestId, prompt)  
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    /* Required for RN built-in Event Emitter Calls. */
  }

  @ReactMethod
  fun removeListeners(count: Int?) {
    /* Required for RN built-in Event Emitter Calls. */
  }

  private fun copyFileToInternalStorageIfNeeded(modelName: String, context: Context): File {
    val outputFile = File(context.filesDir, modelName)

    // Check if the file already exists
    if (outputFile.exists()) {
      // The file already exists, no need to copy again
      return outputFile
    }

    val assetList =
      context.assets.list(
        ""
      ) // List all files in the assets root (""), adjust if your file is in a subfolder
    if (modelName !in assetList.orEmpty()) {
      throw IllegalArgumentException("Asset file ${modelName} does not exist.")
    }
    // File doesn't exist, proceed with copying
    context.assets.open(modelName).use { inputStream ->
      FileOutputStream(outputFile).use { outputStream -> inputStream.copyTo(outputStream) }
    }

    return outputFile
  }


  private fun emitEvent(eventName: String, eventData: WritableMap) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, eventData)
  }
}
