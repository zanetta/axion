# Mobile Accessibility (Light)

> Platform depth belongs in native reviews; this file covers **minimum** cross-platform habits for RN/Flutter/web-mobile.

## Basics

| Topic | Practice |
|-------|----------|
| **Touch targets** | Comfortable size and spacing (~44×44 pt class) |
| **Text scaling** | Don't clip/truncate essential UI at larger text sizes |
| **Screen readers** | Labels on icons; announce state changes thoughtfully |
| **Gestures** | Offer alternatives if a gesture is the only path |
| **Orientation** | Support both unless locked with a strong reason |

## Platform Hints (examples, not cookbooks)

- **iOS**: VoiceOver, Dynamic Type, `accessibilityLabel` / traits
- **Android**: TalkBack, scalable text, content descriptions
- **RN**: Prefer accessibility props over reinventing roles

## Decision Tree

```
Mobile-only issue?
│
├── Hit target too small → increase size/padding
├── Text overflow at large sizes → allow wrap / scroll; don't freeze font
├── Icon button unnamed → accessibility label
└── Custom gesture only → add button/control alternative
```

## Out of Scope Here

Full App Store / Play Console accessibility questionnaires and platform certification — escalate to platform specialists when required.
