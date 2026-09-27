# Refrigerator

The refrigerator uses `dist/food-catalog.js` as the shared inventory allowlist. Existing item IDs, quantities and gift event references are unchanged; adding a catalogue entry does not add it to an existing save.

- 52 foods in seven categories, with individual procedural models in `food-models.js`.
- Upper refrigeration and lower freezer doors open separately. Drinks/condiments use door racks where space allows; shelves and transparent drawers hold the other foods.
- Each page shows up to 18 refrigerated and 6 frozen stock entries. Pages include all positive-quantity entries, including separate gifts. Quantity is not rendered; the model disappears only when the entry is exhausted.
- Select a model to extend it and reveal its name, eat and pack actions. Keyboard focus targets follow each model. Closed compartment contents cannot be selected.
- Raw ingredients have eating disabled. This change does not add new cooking recipes. Existing cooking recipes and gift permissions remain in force.
- Owner-only stocking adds one serving per click, up to the existing per-entry cap. Bag and database validation share the expanded catalogue.

Validation: geometry bounds for all foods; SQLite stock/bag persistence and visitor restrictions; real browser mobile/desktop stocking, selection, eating, packing, independent doors, all 52 foods over three pages, and empty refrigerator.
