# Public host dialogue verification

Actual model: ModelScope Qwen/Qwen3.5-35B-A3B. This is not a production Tencent model test.
Both hosts were tested with ordinary conversation, requesting an unavailable upstairs
album, following an earlier false promise, asking AI identity, and ordering one drink.
Early runs exposed unsolicited album disclaimers, false AI denial and fictional current
physical actions. Rules were revised; collection hints removed from character backgrounds.
The final ten responses did not promise fetching albums or proactively disclose AI during
ordinary chat. Both identities were answered honestly and both orders invoked the correct
tool with here mode. Backend ignores accompanying model text when an order tool is called:
only the actual server result confirms the order. Fifteen local regression checks passed.
This finite sample does not guarantee all model replies; production needs deployment and
its own provider verification. Raw test replies are in work/host-dialogue-verification.json
outside the repository. No actual user conversation was submitted.
