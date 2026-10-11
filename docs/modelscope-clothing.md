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


## Semantic brief and visual review

The clothing planner now produces an `imageBrief` (complete subject/composition description plus an explicit lettering whitelist). Clothing instructions are isolated from legacy 3D routing instructions. Color/fabric-only changes still bypass image generation.

With `MODELSCOPE_TOKEN` configured (unless `MODELSCOPE_IMAGE_REVIEW=false`), generated textures are checked by `MODELSCOPE_REVIEW_MODEL` (default `Qwen/Qwen3.5-35B-A3B`). Only the print and its artwork requirements are sent, never account identifiers or conversation history. Review is enabled by default using the verified Qwen visual model. A rejected picture gets at most one new image generation, using the review feedback; a second rejection fails without overwriting the outfit. API errors and malformed review responses never count as acceptance. The extra generation uses the same ModelScope quota; there is no paid fallback.

Visual review is a defect filter, not a proof of exact trademark fidelity. Brand marks without a reliable reference cannot be guaranteed merely by prompting. Existing verified source marks continue to bypass generative approximation.

2026-10-11: local contract/persistence tests passed. Live review attempt returned HTTP 401 (`user token expired`) from InternVL; ERNIE returned invalid_model. A controlled invalid-token comparison confirmed that the existing token authenticates successfully to the image task API. This is not evidence that the user token expired. Qwen/Qwen3.5-35B-A3B subsequently authenticated successfully and rejected the bad polo symbol and unsolicited ARLUEN lettering. The live results and remaining visual defects are documented below.


## Generic brand references

Simple Icons 14.15.0 supplies 3,307 monochrome brand marks (not 3,307 clothing brands). The language planner resolves a requested brand to its English name; the server matches that name against the catalog and uses the vector mark instead of asking the image generator to invent one. Each mark loads only when needed, independently of the small title index. Existing verified Ralph Lauren and Arc’teryx sources remain supported. This library is finite and does not include every brand or every logo variant; unknown brands remain subject to image fidelity limits. Source: https://github.com/simple-icons/simple-icons/tree/14.15.0 ; original license retained in simple-icons-LICENSE.txt.

Live QA used Qwen/Qwen3.5-35B-A3B as the language planner (the production Tencent planner still needs post-deployment checking). Nike hat and Adidas top matched vector sources without any image task. HELLO lettering was drawn directly. The fox first generated a garment mockup; visual review rejected it, and the one corrective image task produced an isolated fox motif. Crocodile art was rejected after correction. The spotted leopard sample remained visually unsatisfactory despite the reviewer accepting it: visual review is an imperfect defect filter, not a guaranteed quality certification.
