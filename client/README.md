# Forever Arteffects Client

## Purpose

The client is a calm, guided interface for creating physical photo albums.

It is not a design tool.
It is not a canvas editor.
It is not responsible for print geometry or PDF generation.

The backend owns:
- layout templates
- album specifications
- geometry
- validation
- rendering
- storage

The client owns:
- photo selection
- album flow
- template selection
- slot assignment
- preview
- render trigger
- final review

---

## Experience Principle

The interface should always make the next meaningful action obvious.

At any moment, the user should understand:

> What do I need to do right now?

The client should reduce noise, not increase control surface.

---

## Product Feel

The application should feel:
- light
- quiet
- spacious
- neutral
- deliberate
- calm

It should avoid:
- dashboards
- dense controls
- decorative UI
- gamification
- Canva-like editing
- unnecessary customization

---

## Initial Flow

1. Add photos
2. Create album
3. Build spreads
4. Review
5. Render/download

The user starts with photos, not settings.

---

## Technical Constraints

- No client-side PDF generation
- No client-side print geometry
- No freeform canvas layout
- No arbitrary dragging/resizing
- Use backend templates as source of truth
- Use TanStack Query for server state