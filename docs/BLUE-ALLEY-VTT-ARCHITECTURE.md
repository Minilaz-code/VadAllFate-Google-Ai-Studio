# VadAllFate V2 — Milestone 12 Blue Alley VTT Overhaul & Grid Calibration Specification

**Milestone:** 12 (VTT & Tactical Spatial Engine Overhaul)  
**Author:** Antigravity Engine Architecture Team  
**Status:** APPROVED ARCHITECTURAL SPECIFICATION & AUDIT  
**Target Repositories:**  
- `Minilaz-code/VadAllFate-Google-Ai-Studio` (Frontend Canvas, Calibration Tool, Viewport)  
- `Minilaz-code/VadAllFate` (Runtime Persistence, Authoritative Spatial Projection)  

---

## 1. Executive Summary & Root Cause Audit

### 1.1 The User-Reported Failure Mode
During user acceptance testing with preprinted high-resolution battlemaps (specifically the *Waterdeep: Dungeon of the Mad Mage* and *Blue Alley* modules), users reported:
> "Imported Blue Alley map cannot be aligned to the grid without zooming/cropping away most (~80%) of the image. Map must retain full image when calibrating grid independently."

### 1.2 Mathematical & Architectural Root Cause
Inspection of `src/components/battlemap/BattlemapCanvas.tsx` (lines 1220–1245) and `src/utils/coordinateSystem.ts` identifies three interrelated structural defects:

1. **Coupled Map Plane and Grid Plane:**
   The canvas layout computes the total render surface as:
   $$\text{totalMapWidthPx} = \text{grid.width} \times \text{grid.cellSizePx}$$
   $$\text{totalMapHeightPx} = \text{grid.height} \times \text{grid.cellSizePx}$$
   The background artwork is injected inside an inner `div` with CSS:
   ```html
   <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
     <img style="transform: scale(...) translate(...)" />
   </div>
   ```
   Because `overflow: hidden` is applied directly to the container bounded by $\text{grid.width} \times \text{cellSizePx}$, any attempt to scale the image up or translate it to align preprinted grid squares immediately clips the image against the grid boundaries, destroying ~80% of the visible map area.

2. **Inverse Transform Scaling:**
   In the current implementation, adjusting the map scale scales the *image* rather than scaling the *grid overlay*. In tabletop VTTs, preprinted battlemaps already have artist-drawn 5ft grid squares. The grid overlay must be scaled and offset to match the artwork; the artwork must NEVER be scaled and clipped to fit an arbitrary fixed grid container.

3. **Absence of Two-Point Calibration:**
   Currently, the DM must manually guess `scale`, `offsetX`, and `offsetY` using sliders or text inputs. Because cumulative floating-point errors compound across a 50×50 square map, manual slider adjustment is impossible to align over large distances without extreme drift.

---

## 2. Zero-Crop Full Image Architecture

### 2.1 Coordinate Planes Separation
Milestone 12 establishes four strictly decoupled coordinate spaces:

```
+--------------------------------------------------------------------------+
| 1. Natural Image Plane (Continuous Pixels)                               |
|    Domain: [0, naturalWidth] x [0, naturalHeight]                       |
|    Invariant: Never cropped, distorted, or re-encoded without DM intent. |
+--------------------------------------------------------------------------+
                                    |
                                    v (Calibration Transform)
+--------------------------------------------------------------------------+
| 2. Grid Overlay Plane (Discrete & Fractional Grid Cells)                 |
|    originX, originY (px in natural image space)                          |
|    cellSizePx (pixels per 5ft cell)                                      |
|    cellX = (imageX - originX) / cellSizePx                               |
|    cellY = (imageY - originY) / cellSizePx                               |
+--------------------------------------------------------------------------+
                                    |
                                    v (Tokens, Walls, Fog, Lights)
+--------------------------------------------------------------------------+
| 3. World Spatial Plane (SRD 5.1 Rules & Geometry)                        |
|    feet = cellUnits * feetPerCell (default 5.0)                          |
|    Tokens, walls, doors, Line of Sight rays live in World Space.         |
+--------------------------------------------------------------------------+
                                    |
                                    v (Viewport Matrix)
+--------------------------------------------------------------------------+
| 4. Screen / Viewport Plane (Device Pixels)                               |
|    screenX = containerLeft + panX + (imageX * zoom)                      |
|    screenY = containerTop + panY + (imageY * zoom)                       |
|    Invariant: Pan & zoom affect only the presentation camera; never world|
+--------------------------------------------------------------------------+
```

### 2.2 Invariant Guarantees
1. **Zero-Crop Guarantee:** Upon importing any JPEG, PNG, or WebP image up to 16,384×16,384 px, the initial render displays 100% of the image pixels within the viewport via aspect-ratio-preserving letterboxing (`object-fit: contain`).
2. **Independent Grid Rescaling:** Changing the grid size, cell pitch, or origin shifts only the SVG grid overlay lines. The underlying artwork remains completely stationary and unclipped.
3. **Canvas Extent Decoupling:** The world canvas boundaries can expand beyond the artwork bounds to allow DM staging areas, margin notes, and exterior encounter zones without altering the image aspect ratio.

---

## 3. Two-Point Interactive Calibration Protocol

### 3.1 UX Workflow
1. DM selects the **Grid Calibration Tool** from the VTT toolbar.
2. The canvas enters calibration mode; zoom and pan remain active for sub-pixel accuracy.
3. **Point 1 (Anchor):** DM clicks the intersection of any preprinted grid square on the map. A high-contrast cyan crosshair locks onto $(x_1, y_1)$ in natural image space.
4. **Point 2 (Reference):** DM clicks another grid intersection along the same axis or diagonal (e.g. 10 squares to the right or down). A second crosshair locks onto $(x_2, y_2)$.
5. A modal dialog prompts:
   ```
   Grid Calibration:
   Distance: 10 squares (50 ft)
   Axis: Horizontal [X] / Vertical [Y] / Diagonal [XY]
   ```
6. Upon confirmation, the calibration engine solves for `cellSizePx`, `originX`, and `originY`.

### 3.2 Mathematical Formulation
Given anchor point $P_1 = (x_1, y_1)$ and reference point $P_2 = (x_2, y_2)$ separated by $N$ grid units along axis $u$:

$$\Delta x = |x_2 - x_1|, \quad \Delta y = |y_2 - y_1|$$

For a horizontal calibration along $N_x$ squares:
$$\text{cellSizePx} = \frac{\Delta x}{N_x}$$
$$\text{originX} = x_1 \pmod{\text{cellSizePx}}$$
$$\text{originY} = y_1 \pmod{\text{cellSizePx}}$$

For an arbitrary 2D diagonal calibration across $N_x$ horizontal and $N_y$ vertical squares:
$$\text{cellSizePx}_x = \frac{\Delta x}{N_x}, \quad \text{cellSizePx}_y = \frac{\Delta y}{N_y}$$

If square grid constraint is enforced:
$$\text{cellSizePx} = \frac{\sqrt{\Delta x^2 + \Delta y^2}}{\sqrt{N_x^2 + N_y^2}}$$

### 3.3 Fine Nudge Controls
After solving, the DM is provided a floating HUD:
- **Nudge X / Y:** $\pm 1\text{ px}$ micro-steppers for alignment over long distances.
- **Pitch Fine-Tune:** $\pm 0.1\text{ px/cell}$ slider to eliminate drift across large 100-cell maps.
- **Grid Offset Snap:** Snaps walls, doors, and fog to the new calibrated cell coordinates.

---

## 4. Architectural Implementation Blueprint

### 4.1 Schema Update (`src/types/battlemap.ts`)
```typescript
export interface GridCalibrationMetadata {
  isCalibrated: boolean;
  calibratedAtUtc?: string;
  calibratedByActorId?: string;
  anchorPoint?: { x: number; y: number };
  referencePoint?: { x: number; y: number };
  measuredUnitCount?: number;
  measuredAxis?: 'horizontal' | 'vertical' | 'diagonal';
  pitchPxPerCell: number;
  originOffsetX: number;
  originOffsetY: number;
  rotationDegrees?: number;
}

export interface MapBackgroundArtwork {
  url: string;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
  aspectRatio: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  calibration?: GridCalibrationMetadata;
}
```

### 4.2 Canvas Component Refactoring (`BattlemapCanvas.tsx`)
1. Remove `overflow-hidden` from the map container.
2. Render artwork in a dedicated `ArtworkLayer` sized exactly to `naturalWidth` and `naturalHeight`.
3. Overlay an SVG `<pattern>` grid sized to `cellSizePx` with offset `originX, originY`.
4. Wrap both layers in a single zoom/pan viewport container that supports infinite canvas panning.

### 4.3 Persistence & Single Commit Authority Integration
- When calibration is saved, an `ActionEnvelope` with action type `UPDATE_BATTLEMAP_STATE` is dispatched:
  ```json
  {
    "actionType": "UPDATE_BATTLEMAP_STATE",
    "payload": {
      "mapId": "map-blue-alley",
      "gridDimensions": {
        "width": 64,
        "height": 72,
        "cellSizePx": 45.2,
        "originX": 12.4,
        "originY": 8.1
      },
      "backgroundArtwork": {
        "url": "/assets/maps/blue_alley_uncompressed.png",
        "naturalWidth": 2893,
        "naturalHeight": 3254,
        "calibration": { ... }
      }
    }
  }
  ```
- Persisted durably into campaign authoring store SQLite and verified via SHA-256 state hashes.

---

## 5. Verification Fixtures & Acceptance Criteria
1. **Full Image Fidelity:** Importing a 3000×4000 Blue Alley map displays 100% of the image borders upon initial load. Zero pixels cropped.
2. **Two-Point Alignment:** Clicking 10 squares along a corridor calibrates the entire map within 2 seconds.
3. **Drift-Free Precision:** The 50th grid square aligns with $< 2\text{ px}$ error against the preprinted art.
4. **Transform Persistence:** Refreshing the browser or restarting the Python runtime restores the exact calibrated grid and token positions without drift.


## Authoritative 2D Actor Simulation and Starlit Revels Acceptance (2026-10-28)

**Mandatory companion spec:** [V2 Authoritative 2D Spatial Simulation and Starlit Revels Stress Test](V2-AUTHORITATIVE-2D-SPATIAL-SIMULATION-AND-STARLIT-REVELS-TEST.md).

The image-first/grid calibration work must share the same scene/world coordinate boundary as durable Python-owned actor movement. Current React click/drag emits 0–100 percentage positions, while Python `MOVE_TOKEN` takes integer `targetX/targetY` with hardcoded 0–30 bounds; do not treat these as equivalent. Fix through a versioned typed adapter and backend scene geometry contract, not a rendering-only transform.

Maintain individual PC, named NPC, and mob scene positions, footprints, occupancy, pathfinding, LOS, and AI-requested movement with R1 authority and save/restart persistence. The Starlit Revels (*Devil of a Night*, planned `CV_EVENT_STARLIT_REVELS`, 14 named guests plus optional crowd) is the full simulation acceptance fixture; no automatic scenario trigger or privileged player knowledge leakage. SP-00..SP-05 are subgates, not separate app/runtime or an excuse to defer Blue Alley zero-crop UX.
