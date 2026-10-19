/**
 * VadAllFate — Battlemap Definition & View Models (AIUI-CP002A)
 *
 * Provisional data models for the integrated lightweight tactical battlemap workspace.
 * In accordance with AIUI-CP002A architecture boundaries:
 * - This model manages visual representation, geometry, and visibility previews.
 * - This model DOES NOT own authoritative D&D combat rules, initiative, damage, or persistence.
 * - Authoritative mechanics belong solely to the canonical Python R1 runtime.
 */

export interface MapGridConfig {
  width: number;           // Grid columns (cells)
  height: number;          // Grid rows (cells)
  cellSizePx: number;      // Render size per cell in pixels (e.g. 40px)
  feetPerCell: number;     // Standard D&D 5ft per cell
  showGrid: boolean;       // Grid line overlay visibility
  gridColor: string;       // Hex or rgba grid color
  originX?: number;        // Grid horizontal alignment offset in pixels
  originY?: number;        // Grid vertical alignment offset in pixels
}

export interface MapBackgroundArtwork {
  url: string;
  name: string;
  scale: number;           // Zoom multiplier (default 1.0)
  offsetX: number;         // X offset in pixels
  offsetY: number;         // Y offset in pixels
  opacity: number;         // 0.0 - 1.0
  aspectRatio?: string;
  isLocalBlob?: boolean;   // True if created from local file input (session-only)
  naturalWidth?: number;   // Image original pixel width
  naturalHeight?: number;  // Image original pixel height
}

export interface RectangularRoom {
  id: string;
  name: string;
  x: number;               // Cell coordinate X
  y: number;               // Cell coordinate Y
  width: number;           // Cell width
  height: number;          // Cell height
  floorType: 'stone' | 'wood' | 'dirt' | 'water' | 'tiles';
  wallColor?: string;
}

export interface CorridorSegment {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  widthCells: number;
  floorType?: 'stone' | 'wood' | 'dirt' | 'water' | 'tiles';
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  blocksMovement: boolean;
  blocksVision: boolean;
  thickness?: number;
}

export interface DoorSegment {
  id: string;
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
  state: 'open' | 'closed' | 'locked';
  blocksVisionWhenClosed: boolean;
}

export interface MapGeometry {
  rooms: RectangularRoom[];
  corridors: CorridorSegment[];
  walls: WallSegment[];
  doors: DoorSegment[];
}

export type BattlemapEditorTool =
  | 'select'     // Select geometry or inspect elements
  | 'token'      // Token movement mode (default play mode)
  | 'pan'        // Pan canvas viewport
  | 'room'       // Draw rectangular room
  | 'corridor'   // Draw connecting corridor
  | 'wall'       // Draw line-segment wall
  | 'door'       // Place / toggle doors
  | 'measure';   // Distance ruler tool

export interface SelectedGeometryRef {
  type: 'room' | 'corridor' | 'wall' | 'door';
  id: string;
}

export interface BattlemapLayerVisibility {
  artwork: boolean;
  geometry: boolean;
  grid: boolean;
  walls: boolean;
  fog: boolean;
  tokens: boolean;
  overlays: boolean;
}

export interface FogOfWarState {
  enabled: boolean;
  defaultState: 'hidden' | 'revealed';
  revealedCells: string[]; // Format: "x,y"
  previousExploredCells: string[];
}

export interface LineOfSightConfig {
  enabled: boolean;
  blocksOnWalls: boolean;
  blocksOnClosedDoors: boolean;
  maxSightRadiusFeet: number;
}

export interface MapTokenPlacement {
  id: string;
  entityId: string;
  entityType: 'character' | 'npc';
  name: string;
  x: number; // Percent 0-100 or grid cell
  y: number;
  sizeCells: number; // 1 = Medium/Small (5ft), 2 = Large (10ft), 3 = Huge (15ft)
  isVisibleToPlayers: boolean;
  elevationFt: number;
}

export interface BattlemapDefinition {
  id: string;
  name: string;
  locationId: string;
  sceneSummary: string;
  grid: MapGridConfig;
  backgroundArtwork?: MapBackgroundArtwork;
  geometry: MapGeometry;
  fog: FogOfWarState;
  lineOfSight: LineOfSightConfig;
  tokens: MapTokenPlacement[];
  notes?: string;
}

/**
 * Pre-configured demonstration battlemaps for VadAllFate scenes
 */
export const SAMPLE_BATTLEMAPS: BattlemapDefinition[] = [
  {
    id: 'map-yawning-portal',
    name: 'The Yawning Portal — Taproom',
    locationId: 'loc-yawning-portal',
    sceneSummary: 'The bustling taproom surrounding the famous 40-foot dry well leading into Undermountain.',
    grid: {
      width: 20,
      height: 16,
      cellSizePx: 44,
      feetPerCell: 5,
      showGrid: true,
      gridColor: 'rgba(217, 119, 6, 0.25)',
    },
    backgroundArtwork: {
      url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
      name: 'Tavern Stone & Wood Floor',
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      opacity: 0.35,
      aspectRatio: '5:4',
    },
    geometry: {
      rooms: [
        { id: 'r1', name: 'Main Taproom', x: 2, y: 2, width: 16, height: 12, floorType: 'wood' },
        { id: 'r2', name: 'The Entry Well Platform', x: 8, y: 6, width: 4, height: 4, floorType: 'stone' },
      ],
      corridors: [],
      walls: [
        { id: 'w1', x1: 2, y1: 2, x2: 18, y2: 2, blocksMovement: true, blocksVision: true },
        { id: 'w2', x1: 18, y1: 2, x2: 18, y2: 14, blocksMovement: true, blocksVision: true },
        { id: 'w3', x1: 18, y1: 14, x2: 2, y2: 14, blocksMovement: true, blocksVision: true },
        { id: 'w4', x1: 2, y1: 14, x2: 2, y2: 2, blocksMovement: true, blocksVision: true },
      ],
      doors: [
        { id: 'd1', x: 10, y: 14, orientation: 'horizontal', state: 'closed', blocksVisionWhenClosed: true },
      ],
    },
    fog: {
      enabled: false,
      defaultState: 'revealed',
      revealedCells: [],
      previousExploredCells: [],
    },
    lineOfSight: {
      enabled: false,
      blocksOnWalls: true,
      blocksOnClosedDoors: true,
      maxSightRadiusFeet: 60,
    },
    tokens: [
      { id: 'tok-kaelen', entityId: 'char-kaelen', entityType: 'character', name: 'Kaelen Shadowstrider', x: 25, y: 35, sizeCells: 1, isVisibleToPlayers: true, elevationFt: 0 },
      { id: 'tok-brother-vaelin', entityId: 'npc-brother-vaelin', entityType: 'npc', name: 'Brother Vaelin', x: 30, y: 40, sizeCells: 1, isVisibleToPlayers: true, elevationFt: 0 },
      { id: 'tok-lyra', entityId: 'npc-lyra', entityType: 'npc', name: 'Lyra Moonshadow', x: 45, y: 30, sizeCells: 1, isVisibleToPlayers: true, elevationFt: 0 },
      { id: 'tok-cultist', entityId: 'npc-cultist-leader', entityType: 'npc', name: 'Shadow Initiate (Hidden)', x: 80, y: 80, sizeCells: 1, isVisibleToPlayers: false, elevationFt: 0 },
    ],
  },
  {
    id: 'map-sunken-vault',
    name: 'The Sunken Vault — Lower Crypts',
    locationId: 'loc-sunken-vault',
    sceneSummary: 'Ancient flooded Netherese vault carved beneath the city sewers with damp stone masonry.',
    grid: {
      width: 24,
      height: 18,
      cellSizePx: 40,
      feetPerCell: 5,
      showGrid: true,
      gridColor: 'rgba(56, 189, 248, 0.2)',
    },
    backgroundArtwork: {
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      name: 'Subterranean Cavern Stone',
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      opacity: 0.25,
      aspectRatio: '4:3',
    },
    geometry: {
      rooms: [
        { id: 'r1', name: 'Antechamber', x: 2, y: 2, width: 6, height: 6, floorType: 'stone' },
        { id: 'r2', name: 'Inner Sanctum', x: 14, y: 8, width: 8, height: 8, floorType: 'tiles' },
      ],
      corridors: [
        { id: 'c1', startX: 8, startY: 5, endX: 14, endY: 10, widthCells: 2 },
      ],
      walls: [
        { id: 'w1', x1: 2, y1: 2, x2: 8, y2: 2, blocksMovement: true, blocksVision: true },
        { id: 'w2', x1: 8, y1: 2, x2: 8, y2: 4, blocksMovement: true, blocksVision: true },
        { id: 'w3', x1: 8, y1: 6, x2: 8, y2: 8, blocksMovement: true, blocksVision: true },
      ],
      doors: [
        { id: 'd1', x: 8, y: 5, orientation: 'vertical', state: 'closed', blocksVisionWhenClosed: true },
      ],
    },
    fog: {
      enabled: true,
      defaultState: 'hidden',
      revealedCells: ['2,2', '3,2', '4,2', '2,3', '3,3', '4,3', '5,3'],
      previousExploredCells: [],
    },
    lineOfSight: {
      enabled: true,
      blocksOnWalls: true,
      blocksOnClosedDoors: true,
      maxSightRadiusFeet: 30,
    },
    tokens: [
      { id: 'tok-kaelen-vault', entityId: 'char-kaelen', entityType: 'character', name: 'Kaelen Shadowstrider', x: 15, y: 20, sizeCells: 1, isVisibleToPlayers: true, elevationFt: 0 },
      { id: 'tok-cultist-ambush', entityId: 'npc-cultist-leader', entityType: 'npc', name: 'Shadow Initiate (Ambusher)', x: 75, y: 65, sizeCells: 1, isVisibleToPlayers: false, elevationFt: 0 },
    ],
  },
  {
    id: 'map-high-road',
    name: 'High Road — Wilderness Outpost',
    locationId: 'loc-high-road',
    sceneSummary: 'A windswept ruined watchtower along the Trade Way north toward Neverwinter.',
    grid: {
      width: 22,
      height: 16,
      cellSizePx: 42,
      feetPerCell: 5,
      showGrid: true,
      gridColor: 'rgba(74, 222, 128, 0.2)',
    },
    geometry: {
      rooms: [
        { id: 'r1', name: 'Ruined Watchtower Foundation', x: 8, y: 4, width: 6, height: 6, floorType: 'stone' },
      ],
      corridors: [],
      walls: [
        { id: 'w1', x1: 8, y1: 4, x2: 14, y2: 4, blocksMovement: true, blocksVision: true },
        { id: 'w2', x1: 14, y1: 4, x2: 14, y2: 10, blocksMovement: true, blocksVision: true },
      ],
      doors: [],
    },
    fog: {
      enabled: false,
      defaultState: 'revealed',
      revealedCells: [],
      previousExploredCells: [],
    },
    lineOfSight: {
      enabled: false,
      blocksOnWalls: true,
      blocksOnClosedDoors: true,
      maxSightRadiusFeet: 120,
    },
    tokens: [
      { id: 'tok-kaelen-road', entityId: 'char-kaelen', entityType: 'character', name: 'Kaelen Shadowstrider', x: 45, y: 55, sizeCells: 1, isVisibleToPlayers: true, elevationFt: 0 },
    ],
  },
];
