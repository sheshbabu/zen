# Styling Guidelines

Plain CSS with custom properties for theming. **Read `assets/index.css` first** — it is
the full list of design tokens (colors, spacing, typography, shadows, radius, icons,
z-index, transitions) and the source of truth for their values. Never hardcode a value
that an existing token already covers.

## CSS Classes
- One component, one stylesheet, one root class named after the component: `.notes-editor-menu`
- Flat, kebab-case names prefixed with the root class: `.notes-editor-menu-option` (not BEM `__`/`--`)
- 4-space indentation
- Use CSS nesting with `&` for modifiers and pseudo-elements: `&.is-open`, `&:hover`, `&::before`
- Child classes and elements nested directly without `&`: `.child-class`, `svg.lucide`
- Nest all child/descendant selectors under their parent instead of declaring them flat at the top level — only declare a new top-level selector for a class that is a genuinely separate component, not a child of an existing one
- Nest at most 4 levels deep; extract a sub-component past that
- State classes use `is-`/`has-` prefixes: `&.is-open`, `&.is-selected`, `&.has-preview`. Variants (`&.primary`, `&.danger`), layout modes (`&.left`, `&.grid`) and link identities (`&.new`, `&.templates`) aren't states and stay unprefixed
- A component styles its inside; the parent positions it — no `margin` on a root class, use `gap` on the parent
- Namespace `@keyframes` with the component prefix: `toast-slide-up`, not `fade-in`
- Conditional classes using template literals
- Minimal inline styles, prefer CSS classes
- Keep these at zero: `!important`, ID selectors, `rem`/`em` outside `index.css`, tabs, `prefers-color-scheme` in a component file

## Design Tokens
Non-obvious rules the token list does not tell you:

- Typography goes through the `font` shorthand, never a bare `font-size`/`line-height`. The shorthand **resets** `font-weight`, `line-height` and `font-family` — put any of those AFTER it, never before. Declaring `font-family` alone is fine when a block should change family but inherit its size
- Colors: no hex/rgb/named literals. Exception: a color that must stay constant across themes (white text on a permanently dark overlay) — no theme-aware token applies
- For a translucent variant of a token color use relative color syntax: `rgb(from var(--yellow-400) r g b / 0.1)`, not a hardcoded rgba
- Theming: every themed token is declared once in `:root` as `light-dark(<light>, <dark>)`; `[data-theme]` only sets `color-scheme`. Never add a second block redefining tokens
- Use `50%` for circles, not `--radius-full` — `50%` follows the aspect ratio and stays correct if the element is not square
- z-index layers are semantic: `--z-base` overlays, `--z-modal` backdrops and mobile navbar, `--z-popover` toasts and tooltips, `--z-critical` offline indicator
- No `rem`/`em` outside `assets/index.css`; use `px` for one-off sizes no token covers
