# ModelScope clothing textures

The existing clothing models remain in use. Clothing 3D generation is disabled.
The same natural-language entry creates a fast color/material preview, or submits
complex artwork to `Qwen/Qwen-Image-Edit`. Known source logos keep their existing
reference artwork. There is no paid image-provider fallback.

## Server setup

After deploying the update bundle, run:

```sh
sudo -u ubuntu -H python3 /home/ubuntu/little-planet/scripts/configure-modelscope.py
```

Paste the ModelScope SDK token at the hidden prompt and press Enter. The script
stores it in the ignored `.env`, protects its permissions, and recreates the app
container. Never put the token in a frontend file or Git commit. Email verification
must be completed in the ModelScope account settings.

The settings are `MODELSCOPE_TOKEN` and optional `MODELSCOPE_IMAGE_MODEL` (default
`Qwen/Qwen-Image-Edit`). ModelScope free inference has quotas/concurrency limits;
an exhausted quota is reported rather than falling back to another service.

## Persistence and rendering

Image requests are asynchronous and keyed by the existing studio request ID.
Completed result metadata is persisted before downloading, since subsequent task
queries may no longer return the result. PNG/JPEG/WebP bytes are retained in the
application SQLite database, with an 8 MiB limit and restricted download hosts.
Only an approved preview changes the outfit. Failed jobs keep the previous outfit.
Saved clothes, headwear, gifts, and wardrobe items retain the texture ID.

Generated cosmetic textures can be read by authenticated users using their opaque
texture IDs so that clothing renders on other bears in shared spaces. Tokens and
provider download URLs are never sent to the browser. Color-only edits preserve
the texture and recolor its background locally. Chest prints are not repeated on
sleeves. Repeating textures use the garment's physical proportions.

## Verification

The integration tests cover queue/restart recovery, failed generation, duplicate
requests, persistence after unequip, color-only edits, headwear, and input validation.
Real API testing uses a separate local token file outside the repository; language
plans in the isolated integration harness are fixtures, not claims of live Tencent
language-model validation. Browser QA uses actual generated image bytes on the
existing bears, including front/back and recolored clothing.

Official API example: https://modelscope.cn/models/Qwen/Qwen-Image-Edit
