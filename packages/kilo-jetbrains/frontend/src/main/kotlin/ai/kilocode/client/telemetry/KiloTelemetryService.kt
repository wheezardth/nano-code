@file:Suppress("UnstableApiUsage")

package ai.kilocode.client.telemetry

import ai.kilocode.log.KiloLog
import ai.kilocode.rpc.KiloAppRpcApi
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import kotlinx.coroutines.CoroutineScope

object Telemetry {
    fun send(event: String, properties: Map<String, String> = emptyMap()) {
        KiloTelemetryService.getInstance().send(event, properties)
    }
}

@Service(Service.Level.APP)
class KiloTelemetryService internal constructor(
    private val cs: CoroutineScope,
    private val rpc: KiloAppRpcApi?,
) {
    constructor(cs: CoroutineScope) : this(cs, null)

    companion object {
        private val LOG = KiloLog.create(KiloTelemetryService::class.java)

        fun getInstance(): KiloTelemetryService = service()
    }

    // Telemetry disabled (decloud): events are never emitted off-device.
    // In sandbox/dev builds they are logged locally for debugging only.
    fun send(event: String, properties: Map<String, String> = emptyMap()) {
        if (KiloLog.sandbox()) {
            val payload = KiloLog.payload(LOG) + properties
            LOG.info("event=$event ${payload.entries.joinToString(" ") { "${it.key}=${it.value}" }}")
        }
    }
}
