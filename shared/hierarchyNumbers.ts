/**
 * Builds a map of itemCode → hierarchical display number for a list of actions.
 *
 * Hierarchy rules:
 *   - Groups (isGroup=1, parentCode=null/undefined): numbered 1, 2, 3 … in sortOrder
 *   - Direct children of a group (parentCode === group.itemCode): 1.1, 1.2, 1.3 …
 *   - Sub-items of a child (parentCode === child.itemCode): 1.1.1, 1.1.2 …
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
};

export function buildHierarchicalNumbers(
  items: ActionForHierarchy[]
): Map<string, string> {
  const result = new Map<string, string>();

  // Sort all items by sortOrder so numbering follows visual order
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  // Step 1: number top-level groups
  const groups = sorted.filter((a) => a.isGroup === 1);
  groups.forEach((group, gIdx) => {
    const groupNum = String(gIdx + 1);
    result.set(group.itemCode, groupNum);

    // Step 2: number direct children of this group
    const children = sorted.filter(
      (a) => a.isGroup === 0 && a.parentCode === group.itemCode
    );
    children.forEach((child, cIdx) => {
      const childNum = `${groupNum}.${cIdx + 1}`;
      result.set(child.itemCode, childNum);

      // Step 3: number sub-items of this child
      const subItems = sorted.filter(
        (a) => a.isGroup === 0 && a.parentCode === child.itemCode
      );
      subItems.forEach((sub, sIdx) => {
        result.set(sub.itemCode, `${childNum}.${sIdx + 1}`);
      });
    });
  });

  // Handle orphan items (no group parent — top-level items without a group)
  const orphans = sorted.filter(
    (a) =>
      a.isGroup === 0 &&
      (!a.parentCode || !items.some((g) => g.isGroup === 1 && g.itemCode === a.parentCode))
  );
  orphans.forEach((orphan, oIdx) => {
    if (!result.has(orphan.itemCode)) {
      result.set(orphan.itemCode, String(oIdx + 1));
    }
  });

  return result;
}
