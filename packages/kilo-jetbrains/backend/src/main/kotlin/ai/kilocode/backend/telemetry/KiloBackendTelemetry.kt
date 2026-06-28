package ai.kilocode.backend.telemetry

import ai.kilocode.backend.dev.KiloDevMode
import ai.kilocode.log.KiloLog
import com.intellij.openapi.components.Service
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.OkHttpClient

@Service(Service.Level.APP)
class KiloBackendTelemetry(
    private val log: KiloLog = KiloLog.create(KiloBackendTelemetry::class.java),
) {
    // Telemetry disabled (decloud): events are never POSTed off-device.
    // In local dev they are logged for debugging only.
    suspend fun capture(http: OkHttpClient?, port: Int, event: String, properties: Map<String, String>) {
        if (KiloDevMode.enabled()) log.info(payload(event, properties))
    }

    suspend fun setEnabled(http: OkHttpClient?, port: Int, enabled: Boolean) {
        // No-op: there is no telemetry backend to enable/disable.
    }

    private fun payload(event: String, properties: Map<String, String>): String = JsonObject(
        mapOf(
            "event" to JsonPrimitive(event),
            "properties" to JsonObject(base() + properties.mapValues { JsonPrimitive(it.value) }),
        ),
    ).toString()

    private fun base(): Map<String, JsonPrimitive> =
        KiloLog.payload(log).mapValues { JsonPrimitive(it.value) }
}
