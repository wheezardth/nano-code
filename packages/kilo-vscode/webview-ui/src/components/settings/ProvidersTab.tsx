import { Button } from "@kilocode/kilo-ui/button"
import { Card } from "@kilocode/kilo-ui/card"
import { useDialog } from "@kilocode/kilo-ui/context/dialog"
import { ProviderIcon } from "@kilocode/kilo-ui/provider-icon"
import { Tag } from "@kilocode/kilo-ui/tag"
import { showToast } from "@kilocode/kilo-ui/toast"
import { Component, For, Show, createMemo } from "solid-js"
import { useConfig } from "../../context/config"
import { useLanguage } from "../../context/language"
import { useProvider } from "../../context/provider"
import { useVSCode } from "../../context/vscode"
import type { Provider } from "../../types/messages"
import CustomProviderDialog from "./CustomProviderDialog"
import ProviderConnectDialog from "./ProviderConnectDialog"
import { providerIcon } from "./provider-catalog"
import { visibleConnectedIds } from "./provider-visibility"
import { isCustomProviderPackage } from "../../../../src/shared/provider-model"
import { createProviderAction } from "../../utils/provider-action"

type ProviderSource = "env" | "api" | "config" | "custom"

const ProvidersTab: Component = () => {
  const dialog = useDialog()
  const { config } = useConfig()
  const provider = useProvider()
  const language = useLanguage()
  const vscode = useVSCode()
  const action = createProviderAction(vscode)

  const connectedProviders = createMemo(() => {
    const ids = visibleConnectedIds(provider.connected(), provider.authStates())
    const all = provider.providers()
    return ids
      .map((id) => all[id])
      .filter((item): item is Provider => !!item)
  })

  function source(item: Provider): ProviderSource | undefined {
    if (!("source" in item)) return
    const value = (item as Provider & { source?: string }).source
    if (value === "env" || value === "api" || value === "config" || value === "custom") return value
    return
  }

  function sourceTag(item: Provider) {
    const current = source(item)
    if (current === "env") return language.t("settings.providers.tag.environment")
    if (current === "api") return language.t("provider.connect.method.apiKey")
    if (current === "config") {
      const cfg = config().provider?.[item.id]
      if (isCustomProviderPackage(cfg?.npm)) return language.t("settings.providers.tag.custom")
      return language.t("settings.providers.tag.config")
    }
    if (item.id === "openai" && current === "custom") return language.t("settings.providers.tag.chatgpt")
    if (current === "custom") return language.t("settings.providers.tag.custom")
    return language.t("settings.providers.tag.other")
  }

  function canDisconnect(item: Provider) {
    return source(item) !== "env"
  }

  function isCustom(item: Provider) {
    const cfg = config().provider?.[item.id]
    return isCustomProviderPackage(cfg?.npm)
  }

  function editProvider(item: Provider) {
    const cfg = config().provider?.[item.id]
    if (!cfg) return
    dialog.show(() => <CustomProviderDialog existing={{ providerID: item.id, name: item.name, config: cfg }} />)
  }

  function disconnect(providerID: string, name: string) {
    action.send(
      { type: "disconnectProvider", providerID },
      {
        onDisconnected: () => {
          showToast({
            variant: "success",
            icon: "circle-check",
            title: language.t("provider.disconnect.toast.disconnected.title", { provider: name }),
            description: language.t("provider.disconnect.toast.disconnected.description", { provider: name }),
          })
        },
        onError: (message) => {
          showToast({ title: language.t("common.requestFailed"), description: message.message })
        },
      },
    )
  }

  function connectChatGPT(item: Provider) {
    dialog.show(() => <ProviderConnectDialog providerID={item.id} oauthOnly />)
  }

  function chatgpt(item: Provider) {
    if (item.id !== "openai") return false
    if (source(item) === "custom") return false
    return (provider.authMethods()[item.id] ?? []).some((method) => method.type === "oauth")
  }

  return (
    <div>
      {/* Connected providers */}
      <h4 style={{ "margin-top": "16px", "margin-bottom": "8px" }}>
        {language.t("settings.providers.section.connected")}
      </h4>
      <Card>
        <Show
          when={connectedProviders().length > 0}
          fallback={
            <div
              style={{
                padding: "16px 0",
                "font-size": "var(--kilo-font-size-14)",
                color: "var(--text-weak-base, var(--vscode-descriptionForeground))",
              }}
            >
              {language.t("settings.providers.connected.empty")}
            </div>
          }
        >
          <For each={connectedProviders()}>
            {(item) => (
              <div
                style={{
                  display: "flex",
                  "flex-wrap": "wrap",
                  "align-items": "center",
                  "justify-content": "space-between",
                  gap: "16px",
                  "min-height": "56px",
                  padding: "12px 0",
                  "border-bottom": "1px solid var(--border-weak-base)",
                }}
              >
                <div style={{ display: "flex", "align-items": "center", gap: "12px", "min-width": 0 }}>
                  <ProviderIcon id={providerIcon(item)} width={20} height={20} />
                  <span
                    style={{
                      "font-size": "var(--kilo-font-size-14)",
                      "font-weight": "500",
                      color: "var(--vscode-foreground)",
                      overflow: "hidden",
                      "text-overflow": "ellipsis",
                      "white-space": "nowrap",
                    }}
                  >
                    {item.name}
                  </span>
                  <Tag>{sourceTag(item)}</Tag>
                </div>
                <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                  <Show when={!canDisconnect(item)}>
                    <span
                      style={{
                        "font-size": "var(--kilo-font-size-14)",
                        color: "var(--text-base, var(--vscode-descriptionForeground))",
                        "padding-right": "12px",
                      }}
                    >
                      {language.t("settings.providers.connected.environmentDescription")}
                    </span>
                  </Show>
                  <Show when={chatgpt(item)}>
                    <Button size="large" variant="ghost" onClick={() => connectChatGPT(item)}>
                      {language.t("settings.providers.action.signInChatGPT")}
                    </Button>
                  </Show>
                  <Show when={canDisconnect(item)}>
                    <Show when={isCustom(item)}>
                      <Button size="large" variant="ghost" onClick={() => editProvider(item)}>
                        {language.t("provider.custom.edit.title")}
                      </Button>
                    </Show>
                    <Button size="large" variant="ghost" onClick={() => disconnect(item.id, item.name)}>
                      {language.t(isCustom(item) ? "common.delete" : "common.disconnect")}
                    </Button>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </Show>
      </Card>

      {/* Add provider */}
      <div style={{ "margin-top": "16px" }}>
        <Button variant="ghost" onClick={() => dialog.show(() => <CustomProviderDialog />)} style={{ padding: "0" }}>
          {language.t("provider.custom.title")}
        </Button>
      </div>
    </div>
  )
}

export default ProvidersTab
