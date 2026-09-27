# Imported food assets

The user supplied `3dFoodStyloo.zip` on 2026-09-28.
SHA-256: `430431AA5D3F35EDCED17F2DEA1AC95F8954C3A3FEF333066DD0F296DB603645`.

Author: **styloo / stylo0**. Source: https://styloo.itch.io/3dfood
License: **CC0**, expressly stated in the archive's `read me .txt`, preserved as `dist/assets/styloo/AUTHOR-README.txt`.

## Included assets

26 source models/components, listed in `scripts/import-styloo.mjs`, and 20 shared base-color textures are shipped locally. No remote model viewer, login, or API is required at runtime. Other source FBX/GLTF files and the ZIP are not deployed.

Adaptations: bake scene transforms, normalize pivot to bottom center, merge primitives per material, round attributes to five decimals, omit the source static steam billboard, convert PNG to WebP quality 86, retain UVs and normals. Geometry is about 511 KB and textures about 311 KB uncompressed on disk. Textures load when used and are reference-counted until the last material is disposed.

Rebuild with Node 24 and Python/Pillow:

```sh
node scripts/import-styloo.mjs /path/to/extracted/3dFoodStyloo/GLTF
```

## User-facing mapping

Direct replacements: butter, cheese, cookie, cake, bread, strawberry, tomato, lemon, beef, flour, noodles, sushi, ice cream.
Composed from imported pieces: cucumber slices and vegetable salad.
Cooked dishes: four distinct noodle toppings and shrimp sushi; beef toppings use cooked meat instead of the raw inventory model. Existing inventory IDs, quantities, recipes and ownership are unchanged.

The archive has no matching dumpling or roujiamo asset; those keep their original models. The refined drink models remain original procedural geometry. Not every food in the app has been replaced.

The single-dish table centers the meal and uses a closer camera so the new detail is visible on phones.
