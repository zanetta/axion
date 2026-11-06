# Media and Motion

> Moving content must remain controllable; media needs alternatives.

## Media

| Content | Provide |
|---------|---------|
| Prerecorded video with audio | Captions |
| Audio-only | Transcript when informative |
| Complex video | Audio description when visuals carry meaning |
| Autoplay | Avoid; if used, easy pause/stop and no surprise audio |

## Motion

1. Honor `prefers-reduced-motion` — reduce or replace non-essential animation
2. No content that flashes more than safe thresholds
3. Parallax / large movement optional — never required to complete a task
4. Carousels: pause, keyboard operable, don't steal focus

## Decision Tree

```
Animation present?
│
├── Essential to meaning? → keep minimal; still pausable if continuous
└── Decorative? → gate behind reduced-motion / offer static alternative
```
