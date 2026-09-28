# Bear model checks

Arms use a single rounded lathed surface, not overlapping shoulder and joint spheres. The root curves into the torso; existing pivots and wrist reach remain unchanged for accessories.

For future pose/model edits, inspect both identities from front, side and rear in idle, carrying, cooking, sitting and sipping poses. Check silhouette continuity, exposed roots, detached limbs and intersections with held objects. Inspect actual mobile scene screenshots as well as isolated models; static geometry tests cannot establish visual quality alone.

Validated this change with 70 passing tests, a two-identity pose gallery, and the mobile fridge → cooking → carry/store and carry/eat browser flow. Browser plugin was unavailable; Playwright/Chrome fallback was used. The pose regression samples a continuous rotation range and checks that the rounded arm root remains inside the torso.
