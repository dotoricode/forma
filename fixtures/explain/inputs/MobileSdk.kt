// Synthetic fixture input — not a real product's source code.
package com.example.sdk

class MobileSdk private constructor(
    private val policyStore: PolicyStore,
    private val policyClient: PolicyClient,
) {
    private var activePolicy: Policy = Policy.conservativeDefault()

    fun initialize(context: Context, onReady: () -> Unit) {
        val cached = policyStore.loadCachedPolicy()
        val policy = cached ?: Policy.conservativeDefault()
        activePolicy = policy
        onReady()
        scope.launch {
            refreshPolicyWithRetry(maxAttempts = 3)
        }
    }

    private suspend fun refreshPolicyWithRetry(maxAttempts: Int) {
        repeat(maxAttempts) { attempt ->
            val result = policyClient.fetchPolicy()
            if (result != null) {
                policyStore.save(result)
                activePolicy = result
                return
            }
            delay(backoffFor(attempt))
        }
    }

    private fun backoffFor(attempt: Int): Long = (500L * (attempt + 1))
}
