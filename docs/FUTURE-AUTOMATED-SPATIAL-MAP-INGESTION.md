# VadAllFate — Future Automatic Spatial Map Ingestion (Deferred Backlog)

**Decision date:** 2026-10-28  
**Status:** APPROVED FUTURE WORK — NOT IMPLEMENTED, NOT VERIFIED.  
**References:** [Blue Alley VTT Architecture](BLUE-ALLEY-VTT-ARCHITECTURE.md); [Authoritative 2D Spatial Simulation and Starlit Revels Stress Test](V2-AUTHORITATIVE-2D-SPATIAL-SIMULATION-AND-STARLIT-REVELS-TEST.md).  
**Owner:** Existing Python runtime + React VTT workstreams, *not* a third world-state service.

## Intended DM workflow

The Host/DM must **not** have to trace every wall manually in the normal workflow:

1. Import a full-resolution PNG/JPEG/WebP map without cropping; calibrate its printed grid independently from artwork (Blue Alley acceptance fixture).
2. **First preference:** import an existing spatially annotated VTT map format such as Universal VTT (`.uvtt`, `.dd2vtt`) when present; verify format/schema/version and transform source coordinates correctly. External graphics are untrusted.
3. **Second preference:** for an ordinary flat map image, use CPU-friendly computer vision to propose wall segments, enclosed room boundaries, corridors, doors, passable areas and obstacles. Optionally use a provider-agnostic vision model to suggest semantic labels (e.g. staircase, table, door) with confidence/provenance. No per-turn visual inference is needed in gameplay.
4. The DM sees an overlay of **proposed** geometry, can inspect uncertainty, correct/merge/split walls and doors, and explicitly approves it for canonical scene admission. Suggestions remain untrusted and non-authoritative until approved.
5. **Fallback:** smart manual editing—click inside a room to propose its boundary, draw one rectangle to generate four walls, snap corners and joined segments, quickly place door/window openings, support irregular polygon/curve approximations. Keep existing precise manual tools for complex imagery.
6. Save the approved, versioned geometry through R1 Commit Authority and the existing campaign SQLite ownership; include provenance and permit compatible `.vadpack` reuse. No second authoritative DB, arbitrary script import or direct frontend canonical writes.

## Shared spatial contract

Map **artwork** (natural image pixels), **grid calibration**, **canonical scene geometry** (grid cells / feet / world coordinates) and **viewport pan/zoom** must remain separate. Geometric walls may block movement and vision differently from sounds; doors have an authoritative state and separate permissions. Approved rooms, corridor connectivity, terrain, obstacles, stairs, scene exits and entity-sized footprints feed deterministic Python collision/pathfinding/LOS/cover/acoustic queries and actor routines. Player, NPC and mob positions and visibility obey the same scene and R1 ownership contracts. No player exposure to concealed geometry or DM-only facts.

## Delivery order / non-displacement

- **Now:** complete existing Milestone 11B-QA combat and security fixes, Milestone 12 Blue Alley zero-crop VTT and SP-00..SP-03 canonical movement geometry; do not expand the backlog as if implemented today.
- **Future MAP-A:** VTT geometry-format importer (uvtt/dd2vtt), reversible source transforms, validated metadata and round-trip tests.
- **Future MAP-B:** CPU map image segmenter / room-region proposal engine; optional AI semantic recogniser, failure/confidence reporting.
- **Future MAP-C:** editable proposal overlay, smart room detection, rectangle/edge snapping, manual correction, DM review/approval and source audit.
- **Future MAP-D:** persisted geometry fed into Python spatial queries (walls, collision, door state, LOS, pathfinding, NPC routes) and safe role-filtered VTT previews.
- **Future MAP-E:** verify on Blue Alley, irregular caves and multi-room Starlit Revels with screenshots, zero crop, persistent map geometry, correct actor movement/obstruction, strict secrecy and crash/restart recovery.

**Acceptance:** An unannotated map does not magically give perfect semantic knowledge. False detections must be visible and correctable. Human approval is mandatory; only canonical geometry drives rules. The host should ordinarily approve/correct proposed spatial layout, not redraw it wall by wall.

**Do not claim implementation until actual code, tests and human DM acceptance exist.**
