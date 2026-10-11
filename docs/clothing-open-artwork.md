# Natural-language artwork routing

The shipped brand catalog no longer intercepts new clothing requests by default.
The language model returns a semantic imageBrief; canonical brand names trigger
an on-demand Wikimedia Commons reference search, independently of the local list.
Only bounded raster downloads from upload.wikimedia.org or thumb.wikimedia.org are accepted. Candidate
references are visually checked. Front logos use the accepted original raster directly,
with aspect-preserving fitting and uniform-background removal; monochrome marks
use the requested accent, while multicolor marks keep their colors. Repeats use
Qwen-Image-Edit to arrange the accepted reference.
The original source is recorded in the job plan. It is a public reference, not a
claim that Wikimedia is the brand's official website or that rights are granted.
If discovery fails, Qwen/Qwen-Image draws from the semantic brief and the output
must still pass review. A reference outage is never recorded as a successful find.
Qwen/Qwen-Image-Edit also corrects a rejected actual image once; the failed image,
not a blank seed, is supplied. A second rejected result does not change clothing.
Model configuration: MODELSCOPE_GENERATION_MODEL controls drawing, and
MODELSCOPE_IMAGE_MODEL controls reference editing. Neither routes to a paid 3D API.
The semantic artwork prompt omits garment names, conversation text and fabric
weave; those previously caused garment mockups and unwanted material noise.

Colors and materials alone retain the existing artwork. Exact requested text is
drawn directly. New 3D clothing generation remains disabled.

`CLOTHING_REFERENCE_CACHE=true` explicitly enables the previous shipped reference
shortcuts for compatibility; the default is off. Existing saved clothing continues
to display its original cached marks.

Live reference discovery: initial requests returned HTTP 403. Using a descriptive
project User-Agent restored the API, and a real Nike search, raster download and
visual check succeeded. The downloaded swoosh was also visually inspected. The
same Lacoste search did not yield an accepted reference. No claim of universal
brand coverage is made. Live generation results are recorded in the work/*-qa.json
reports; queued jobs and automated approvals are not human visual acceptance.
Qwen-Image produced a recognizable leopard tile in a direct model comparison;
full pipeline samples also exposed incorrect subjects, borders and fabric noise.
Visual review is fallible and does not certify logo fidelity by itself.

Final live verification: “耐克logo，米色鸭舌帽” returned a ready verified-reference
proposal using an on-demand Commons download, without an image redraw or 3D call.
A separate real text-image squirrel/acorn top was also rendered and visually inspected.
Targeted regression checks: 46 passed. Exact Ralph Lauren reproduction and arbitrary
brand discovery are not universally certified.
