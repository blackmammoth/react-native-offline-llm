package com.nativellmmediapipe

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

import android.util.Log

import com.nativellmmediapipe.NativeLlmMediapipeSpec

class NativeLlmMediapipeModule(private val reactContext: ReactApplicationContext) :
  NativeLlmMediapipeSpec(reactContext) {

  private var llmInferenceModel: LlmInferenceModel? = null

  override fun getName() = NAME

  private class InferenceModelListener(
    private val module: NativeLlmMediapipeModule,
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

  override fun createModel(
    maxTokens: Double,
    topK: Double,
    temperature: Double,
    randomSeed: Double,
    promise: Promise
  ) {

  if (llmInferenceModel != null) {
    Log.d("LlmTest", "Model already created")
    promise.resolve("Model already created")
    return
  }

    try {
      llmInferenceModel =
        LlmInferenceModel(
          this.reactContext,
          maxTokens.toInt(),
          topK.toInt(),
          temperature.toFloat(),
          randomSeed.toInt(),
          inferenceListener = InferenceModelListener(this)
        )
        Log.d("LlmTest", "***New Model Created!***")
      promise.resolve("Model Creation Successful")
    } catch (e: Exception) {
      promise.reject("Model Creation Failed", e.localizedMessage)
    }
  }


  // close session instead of releasing model
  override fun closeSession(promise: Promise) {
    llmInferenceModel?.closeSession()
    llmInferenceModel = null // Help GC reclaim the object
    promise.resolve(true)
  }

  override fun generateResponse(requestId: Double, prompt: String, promise: Promise) {
    llmInferenceModel?.generateResponseAsync(requestId.toInt(), prompt, promise)
  }

  override fun addListener(eventName: String?) {
    /* Required for RN built-in Event Emitter Calls. */
  }

  override fun removeListeners(count: Double) {
    /* Required for RN built-in Event Emitter Calls. */
  }

  override fun onCatalystInstanceDestroy() {
  llmInferenceModel?.apply {
    closeSession()        // Close the Mediapipe session
    // If LlmInference has a close() or release() method, call it here too
  }
  llmInferenceModel = null // Help GC reclaim the object
  super.onCatalystInstanceDestroy()
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

  companion object {
    const val NAME = "NativeLlmMediapipe"
  }
}
