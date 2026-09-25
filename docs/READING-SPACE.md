# Content-first reading and quieter interactions

The bench has no persistent reading/status/leave panel. Tap the held 3D book to open the same selected book as the indoor bookshelf; if no book is selected, open the shelf. Closing the dialog keeps the bear seated. Clicking the ground or moving leaves the bench. The daybook reading shortcut also opens the book while seated.

The book detail requests the owner's `/book/info` from the official WeRead gateway. Its `intro` is stored as plain text, escaped at render time, and omitted when absent. Information is cached for 24 hours on the server. Sharing an imported book also shares its cached public book introduction; private books remain private. Another user cannot trigger requests using the owner's credential. Responses after disconnect or deletion are rejected. Full book text is still read in WeRead.

The headphones' padded faces point inward toward the sides of the head. The headband and hinges connect the cups; front-facing decorative discs were removed. Both bear identities use the same fitted geometry. Only actual audio playback makes them visible.

Further copy reduction: remove fridge gesture instructions, bag location/gifting explanation, prototype supply notice, cooking action tutorial and per-step toasts. Shorten reading progress actions and connection headings. Keep explicit sharing/privacy choices, failures and connection setup steps.

Design references inspected:
- Apple Books: tap content to reveal controls, with secondary options in the menu: https://support.apple.com/guide/iphone/read-books-iphc1af7c57/27/ios/27
- Material writing: concise, direct language and progressive disclosure: https://m1.material.io/style/writing.html
- WeRead official `/book/info` contract (`intro`): https://github.com/Tencent/WeChatReading/blob/main/skills/book.md

Validation:
- 45 Node tests passed, including info caching, private/shared visibility, invalid book response, absent intro, disconnect/removal races.
- Mobile browser + actual local backend with a fixture only at the WeRead upstream boundary: shelf → book intro → bench → tap held model → same book → ground exit. HTML in intro remains inert text.
- Chrome mobile and desktop: two permanent nav entries, logo travel/menu, two-button music, continuous audio through home/journal, pause/resume/headphone visibility, no horizontal overflow or page errors.
- Inspected model renders front, side, brown three-quarter, and actual bench scene.
- No real WeRead account credential was available during testing. Availability of book introductions is determined by the official service response.
