# Scene kitchen and unified storage

Cooking now starts after arriving at the cooker. The scene uses one back-facing chef animation and a projected speech bubble, with a random draw from all recipes. Selecting raw fridge food narrows the draw to matching recipes. Missing ingredients are supplied automatically; existing unreserved ingredients are consumed when available. Reserved gifts are protected. No separate cooking dialog or renderer is created.

The finished dish is persisted as `cooked_<recipe>` in the current home's fridge before the two destination buttons become available. This is the recovery location if the browser closes before a choice. Serving atomically moves it to the table; the eating animation then consumes that table meal. Storing leaves it in the fridge and animates carrying it there and opening the door. Recipe IDs remain intact so inventory and table use the same model.

At database startup, the `unified-storage-v1` migration moves legacy bag food into each owner's fridge without changing totals. Flowers move to `world.life.flowers`, used directly by vase interactions. Legacy `bags` fields remain only for save compatibility; the bag UI and packing workflow are removed. Harvested produce now enters the owner's fridge. Gifting is available from the owner's fridge.

Validation: 70 automated tests passed, including migration/restart, empty-fridge automatic supply, selected-ingredient validation and reserved-gift protection, command idempotency, exact cooked-recipe persistence, serving/eating and valid subsequent saves. Browser QA (Playwright fallback; Browser plugin not available) covered walking to cooker, rolling names, chef animation, result buttons, both destination animations, persistent stored food and no cooking dialog or bag navigation. Screenshots saved outside the repository under outputs/echoo-kitchen-*.png.

Fridge selection displays 去烹饪 for raw food and 吃掉 for ready food, with no stock quantities or manual refill step. Mobile QA covers both labels and the selected raw food route into scene cooking.
