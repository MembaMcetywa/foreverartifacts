# Forever Arteffects --- Backend Architecture

## Purpose

This backend exists to produce **deterministic, print-ready physical
photo albums** from constrained user input.

The system is designed so that: - layout correctness is guaranteed
server-side - rendering is repeatable and auditable - geometry errors
are caught before they reach print

The client is a constrained authoring surface.\
The server is authoritative.

------------------------------------------------------------------------

## Core Principles

### 1. Server-Authoritative Layout

-   All layout definitions (grids, templates, geometry) live on the
    server
-   The client never computes or submits millimeter geometry
-   The client submits *intent* (template selection, image assignment,
    text)

### 2. Templates Are Infrastructure

-   Layout templates are hand-authored, code-defined geometry
-   Templates are not user-generated data
-   Templates are treated as executable geometry

Because of this: - templates are validated on application startup -
invalid templates prevent the server from starting

This validation guards against **developer error**, not user error.

------------------------------------------------------------------------

## Layout System

### AlbumSpec

Defines physical constraints: - page size (mm) - margins
(inner/outer/top/bottom) - grid (column count, gutter size) - baseline
rhythm (mm) - page count rules (min / max / step)

### LayoutLibrary

A collection of layout templates bound to an AlbumSpec.

Each template: - defines fixed image/text placements - uses column spans
and baseline-aligned vertical metrics - contains no freeform positioning

------------------------------------------------------------------------

## Template Validation (Internal Check)

Templates are validated **at startup** to enforce geometric correctness.

This is an internal correctness check to protect against: - column
overflow - baseline drift - margin violations - invalid dimensions -
copy--paste or refactor mistakes

If template validation fails: - the application must not start (MVP
behaviour)

This ensures the invariant:

> If the backend is running, all templates are safe to render.

Template validation is **not** user validation and is not tied to
request handling.

------------------------------------------------------------------------

## Asset Pipeline

-   Assets are uploaded directly to object storage (S3-compatible)
-   The backend issues presigned upload URLs
-   The backend stores asset metadata (key, dimensions, mime type)
-   Assets are referenced by key, never embedded

No destructive image processing occurs in v1.

------------------------------------------------------------------------

## Album Draft Model (Minimal Persistence)

The backend persists only what is required to render:

-   albumSpecId
-   ordered list of spreads
-   per-spread:
    -   templateId
    -   image slot assignments
    -   optional caption / metadata text

No layout geometry is persisted.\
All geometry is computed at render time.

------------------------------------------------------------------------

## Render Engine

### Conceptual Model

Rendering is a compilation process:

    AlbumDraft
    + AlbumSpec
    + LayoutLibrary
    + Assets
    → Render Graph (mm-based)
    → PDF/X output

The render engine is not a WYSIWYG system.

------------------------------------------------------------------------

### Render Graph

An internal, server-only representation where: - all positions are
resolved in millimeters - all elements are explicit rectangles - no PDF
or DPI concepts are involved yet

This separation allows: - layout debugging without PDF complexity -
deterministic output - future alternative render targets

------------------------------------------------------------------------

### PDF Strategy

-   Millimeters are converted to PDF points at render time
-   Images are placed with explicit sizing and clipping
-   Fonts are embedded explicitly
-   Target output is print-safe (PDF/X-style constraints)

HTML-to-PDF tools are intentionally avoided.

------------------------------------------------------------------------

## Validation Layers

### Template Validation (Startup / CI)

-   Runs once
-   Guards against internal geometry errors
-   Prevents server startup if invalid

### Instance Validation (Render-Time)

-   Ensures:
    -   referenced templates exist
    -   required image slots are filled
    -   assets exist and are accessible
    -   page counts respect AlbumSpec rules

Instance validation failures block rendering, not startup.

------------------------------------------------------------------------

## Backend Structure (NestJS)

Logical module boundaries:

    LayoutModule   → specs, templates, validation
    AssetsModule   → uploads, metadata
    AlbumsModule   → drafts, spreads, ordering
    RenderModule   → layout compilation, PDF rendering
    StorageModule  → S3-compatible abstraction

Each module has a single responsibility.

------------------------------------------------------------------------

## Explicit Non-Goals (MVP)

The following are intentionally out of scope: - freeform layout -
user-defined templates - real-time collaboration - printer APIs -
background job orchestration - advanced color management

These can be added later without breaking core invariants.

------------------------------------------------------------------------

## Key Invariants

-   Templates are trusted only after validation
-   Geometry is physical and deterministic
-   The server is the source of truth
-   Rendering is repeatable from persisted inputs
-   If something prints incorrectly, it is debuggable

------------------------------------------------------------------------

## Mental Model

This backend behaves more like: - a compiler - a publishing pipeline - a
manufacturing system

...and less like: - a design app - a canvas editor - a typical CRUD API
