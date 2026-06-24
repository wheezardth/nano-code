import type { AnnotationMeta } from "./review-annotations"

export function createReviewAnnotationSpeechRenderer(_props: {
  enabled: () => boolean
  model: () => string
  keys: () => Set<string>
}): { active: () => false; render: (meta: AnnotationMeta) => undefined } {
  return {
    active: () => false,
    render: () => undefined,
  }
}
