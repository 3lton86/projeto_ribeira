/**
 * Builds a map of item id → hierarchical display number for a list of actions.
 *
 * Hierarchy rules (per area — groups restart at 1 in each area):
 *   - Groups (isGroup=1, parentCode=null/undefined): numbered 1, 2, 3 … by sortOrder
 *   - Direct children of a group (parentCode === group.itemCode): 1.1, 1.2, 1.3 …
 *   - Sub-items of a child (parentCode === child.itemCode): 1.1.1, 1.1.2 …
 *
 * IMPORTANT: The key is the item's numeric `id` (not `itemCode`) because itemCode
 * values are reused across different areas (e.g. every area has a group with itemCode "1").
 * Using id as key avoids collisions and produces correct per-area numbering.
 *
 * The function is purely derived from the data — it does NOT mutate the database.
 * Use the returned map to display numbers in the UI alongside the internal itemCode.
 */
export type ActionForHierarchy = {
  id: number;
  itemCode: string;
  parentCode?: string | null;
  isGroup: number;
  sortOrder: number;
  area: string;
};

export function buildHierarchicalNumbers(
  items: ActionForHierarchy[]
): Map<number, string> {
  const result = new Map<number, string>();

  // Process each area independently so group numbering restarts at 1 per area
  const areas = Array.from(new Set(items.map((a) => a.area)));

  for (const area of areas) {
    const areaItems = items
      .filter((a) => a.area === area)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Step 1: number top-level groups within this area
    const groups = areaItems.filter((a) => a.isGroup === 1);

    groups.forEach((group, gIdx) => {
      const groupNum = String(gIdx + 1);
      result.set(group.id, groupNum);

      // Step 2: number direct children of this group
      const children = areaItems.filter(
        (a) => a.isGroup === 0 && a.parentCode === group.itemCode
      );

      children.forEach((child, cIdx) => {
        const childNum = `${groupNum}.${cIdx + 1}`;
        result.set(child.id, childNum);

        // Step 3: number sub-items of this child
        const subItems = areaItems.filter(
          (a) => a.isGroup === 0 && a.parentCode === child.itemCode
        );

        subItems.forEach((sub, sIdx) => {
          result.set(sub.id, `${childNum}.${sIdx + 1}`);
        });
      });
    });

    // Handle orphan items (no group parent within this area)
    const orphans = areaItems.filter(
      (a) =>
        a.isGroup === 0 &&
        (!a.parentCode ||
          !areaItems.some((g) => g.isGroup === 1 && g.itemCode === a.parentCode))
    );
    orphans.forEach((orphan, oIdx) => {
      if (!result.has(orphan.id)) {
        result.set(orphan.id, String(oIdx + 1));
      }
    });
  }

  return result;
}
