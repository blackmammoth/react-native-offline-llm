package com.blackmammoth.develop

import android.os.Build
import android.os.Bundle
import android.util.Log

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import com.llmmediapipe.LlmInferenceModel
import com.llmmediapipe.InferenceListener

import expo.modules.ReactActivityDelegateWrapper

import java.io.File

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    setTheme(R.style.AppTheme);
    super.onCreate(null)
    Log.d("LlmTest", "===JOB BEGAN===")
    // testLlmModel()
  }

    /**
     * A simple test function to verify LLM inference.
     */
    private fun testLlmModel() {
        // Assume the model file is placed in app's files directory
        val modelFile = File(filesDir, "gemma3-1b-it-int4.task").absolutePath
        val llmModel = LlmInferenceModel(
            context = this,
            modelPath = modelFile,
            maxTokens = 128,
            topK = 40,
            temperature = 0.7f,
            randomSeed = 0
        )
        llmModel.setInferenceListener(object : InferenceListener {
            override fun logging(model: LlmInferenceModel, message: String) {
                Log.d("LLMTest", "Partial result: $message")
            }

            override fun onError(model: LlmInferenceModel, requestId: Int, error: String) {
                Log.e("LLMTest", "Error (id=$requestId): $error")
            }

            override fun onResults(model: LlmInferenceModel, requestId: Int, response: String) {
                Log.d("LLMTest", "Final response (id=$requestId): $response")
            }
        })
        // Fire off a test request
        llmModel.generateResponseAsync(requestId = 1, prompt = "Who are you?")
    }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
