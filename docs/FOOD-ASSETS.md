# Food asset sources

Research date: 2026-09-28. No external model from this list has been imported yet.

## Preferred coherent collection

- Author: styloo / stylo0
- Author distribution: https://styloo.itch.io/3dfood
- Sketchfab sample: https://sketchfab.com/3d-models/food-pack-1-06270d2d89ff40debb0df520b2403c3b
- Archive: 3dFoodStyloo.zip, 19 MB, free tier. Do not request the paid HD package.
- Author distribution explicitly lists CC0 (https://creativecommons.org/publicdomain/zero/1.0/), 125+ models, FBX/GLTF, 512px textures. Sketchfab sample separately lists CC Attribution; preserve the license supplied with the actual downloaded archive.
- Relevant pieces: ramen bowl/noodles/egg/pork/greens, sushi, salad, bread, flour, meat, butter, cake, cookie, strawberry, tomato, lemon, ice cream.
- Download blocked by the site's browser security verification in this environment. User can download through their own browser. Do not extract protected viewer resources as a replacement for the official archive.
- Before importing: inspect archive license, inspect rendered quality and dimensions, normalize per-item pivots, preserve texture maps, load only selected assets, record exact files and attribution. Do not replace all foods with unrelated shapes just because an asset exists.

## Other candidates (metadata verified through search, downloads not verified)

- Pollypipe, Stylized fastfood set, CC Attribution, 4.6k triangles (whole set): https://sketchfab.com/3d-models/stylized-fastfood-set-a7f9bf6d97ce4ff88168fbc54d7e7004
  Burger, fries, drink with straw, sauces. Direct page fetch returned HTTP 403.
- loafbrr, Food Pack, CC Attribution, 22.2k displayed triangles: https://sketchfab.com/3d-models/food-pack-df3e943292bb412eb5238038e51a49ea
  Fruits, vegetables, bread, meat. Direct page fetch returned HTTP 403.
- AntijnvanderGun, Dumplings, CC Attribution, 10.7k displayed triangles: https://sketchfab.com/3d-models/dumplings-3e1a010fca414a599b53affa93cf088c
  Supplement only if consistent with selected collection; direct page fetch returned HTTP 403.

Do not ship search previews as if they were downloaded models. Do not use NoDerivatives assets for adaptation, or paid assets without acquisition.

## Current drink implementation

`beverage-models.js` is original procedural geometry, not a Sketchfab import. It shares the shelf and held drink model, with a cap-free drinking variant and a mouth-aligned rigid straw. Other foods remain the existing procedural models until the external archive is available and inspected.
