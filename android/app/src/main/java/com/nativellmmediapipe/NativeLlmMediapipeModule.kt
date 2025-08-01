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
    val id = requestId.toInt()
    if (llmInferenceModel == null) {
      promise.reject("E_NO_MODEL", "LLM model is not initialized")
      return
    }

    // Wrap listener callbacks to tie into this one promise
    llmInferenceModel?.generateResponseAsync(id, prompt, 
      onPartial = { partial ->
        emitEvent("onPartialResponse", Arguments.createMap().apply {
          putInt("requestId", id)
          putString("partial", partial)
        })
      },
      onError = { errorMsg ->
        // Emit event and reject the promise if it hasn’t resolved yet
        emitEvent("onErrorResponse", Arguments.createMap().apply {
          putInt("requestId", id)
          putString("error", errorMsg)
        })
        promise.reject("E_INFERENCE", errorMsg)
      },
      onComplete = { fullResponse ->
        emitEvent("onCompleteResponse", Arguments.createMap().apply {
          putInt("requestId", id)
          putString("response", fullResponse)
        })

        promise.resolve(Arguments.createMap().apply {
          putInt("requestId", id)
          putString("response", fullResponse)
        })
      })
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
