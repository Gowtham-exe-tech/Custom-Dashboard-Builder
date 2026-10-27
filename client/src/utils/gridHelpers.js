// grid math used by the configuration page
import { gridColumns, gridRows } from "./dashboardConfig";

// do two widgets share any cell
export function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// is the rectangle inside the grid
export function insideGrid(rect) {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.w >= 1 &&
    rect.h >= 1 &&
    rect.x + rect.w <= gridColumns &&
    rect.y + rect.h <= gridRows
  );
}

// can this rectangle be placed without touching other widgets
export function isFree(widgets, rect, ignoreId = "") {
  return (
    insideGrid(rect) &&
    !widgets.some(
      (widget) => widget.id !== ignoreId && rectsOverlap(widget, rect),
    )
  );
}

// keep a moving widget inside the grid edges
export function clampPosition(rect) {
  return {
    ...rect,
    x: Math.max(0, Math.min(rect.x, gridColumns - rect.w)),
    y: Math.max(0, Math.min(rect.y, gridRows - rect.h)),
  };
}

// first free spot scanning row by row
export function findFreeSpot(widgets, w, h) {
  for (let y = 0; y + h <= gridRows; y++)
    for (let x = 0; x + w <= gridColumns; x++)
      if (isFree(widgets, { x, y, w, h })) return { x, y };
  return null;
}
