# 06 — Design System

## Philosophy

> Calm. Premium. Spiritual. Uncluttered.

The UI should feel like a quiet ashram — warm, spacious, and intentional.

---

## Colour Palette (Light Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FDFAF6` | Page background (warm ivory) |
| `--bg-surface` | `#FFFFFF` | Cards, modals |
| `--bg-muted` | `#F5F0EB` | Secondary surfaces |
| `--text-primary` | `#1A1A1A` | Body text |
| `--text-secondary` | `#6B6B6B` | Labels, captions |
| `--accent-primary` | `#7C3AED` | Primary actions (deep violet) |
| `--accent-secondary` | `#F59E0B` | Highlights (saffron) |
| `--accent-success` | `#10B981` | Positive scores |
| `--accent-warning` | `#F59E0B` | Mid-range scores |
| `--accent-danger` | `#EF4444` | Low scores |
| `--border` | `#E5E0DB` | Dividers |

Dark mode deferred to v1.1. Use CSS custom properties for easy switch.

---

## Typography

Font: **Inter** (Google Fonts, weights 400/500/600).

| Role | Weight | Size | Line Height |
|------|--------|------|-------------|
| Heading | 600 | 20 px | 28 px |
| Subheading | 500 | 16 px | 24 px |
| Body | 400 | 14 px | 20 px |
| Caption | 400 | 12 px | 16 px |

## Spacing

4 px base. Scale: 4, 8, 16, 24, 32, 48.

## Radius

`sm` 6 px · `md` 12 px · `lg` 16 px · `full` 9999 px.

## Shadows

- `sm`: `0 1px 2px rgba(0,0,0,0.05)`
- `md`: `0 4px 12px rgba(0,0,0,0.08)`
- `lg`: `0 8px 24px rgba(0,0,0,0.12)`

## Icons

Lucide React. Default 20 px, nav 24 px.

## Components

- **Cards**: surface bg, 1px border, radius-md, shadow-sm, 16px padding.
- **Buttons**: primary (violet bg, white text), secondary (outline). Min touch 44×44 px.
- **Toggles**: 44×24 px, accent-primary when checked.
- **Accordions**: header with icon+name+score, chevron rotate, 200ms ease transition.
- **Score Bars**: 4px height, gradient fill (red→amber→green).
- **Bottom Tab Bar**: fixed, 56px, 5 tabs, icon+label.
- **Sidebar (Desktop)**: 240px fixed left, collapsible to 64px.

## Motion

All transitions 100–200 ms, ease/ease-in-out. Use transform/opacity for GPU acceleration.

## Breakpoints

| Name | Min Width | Layout |
|------|-----------|--------|
| Mobile | 0 px | Single column, bottom tabs |
| Tablet | 640 px | Two columns, bottom tabs |
| Desktop | 1024 px | Sidebar + main |
