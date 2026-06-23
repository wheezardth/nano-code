import { TelemetryEventName, type TelemetryPropertiesProvider } from "./types"

/**
 * Stubbied out — telemetry removed from this extension.
 * All capture calls are no-ops. This file stays so imports resolve
 * and interface types remain compatible.
 */
export class TelemetryProxy {
  private readonly provider: TelemetryPropertiesProvider | undefined

  private constructor() {}

  static getInstance(): TelemetryProxy {
    return new TelemetryProxy()
  }

  static capture(_event: TelemetryEventName, _properties?: Record<string, unknown>) {}

  configure(_url: string, _password: string) {}

  setProvider(_provider: TelemetryPropertiesProvider) {}

  isVSCodeTelemetryEnabled(): boolean {
    return false
  }

  capture(_event: TelemetryEventName, _properties?: Record<string, unknown>) {}

  setEnabled(_enabled: boolean) {}

  shutdown() {}
}
