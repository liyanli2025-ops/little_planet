# Beach cinema

Five shared seats on the left beach; click the screen or program board to frame the cinema, click a chair to walk and sit. Click sand to stand and return to the beach view. Clicking the cafe returns through the stairs. The screen close-up reuses the same video element.

Beijing time 18:00–06:00, shared time from cafe polling. Program: Caminandes: Llamigos (150 seconds), a 20-second interval, Big Buck Bunny (596 seconds), a 20-second interval, repeat. The evening schedule resets at 18:00 and continues across midnight. Late arrivals and resumed tabs seek to shared progress; individual visitors cannot pause the public program. Daytime rolls the cloth up and leaves the seating open.

Movies are not included in island preload or deployment bundle. Authenticated GET/HEAD /api/cinema/film/:id proxies only the two allowlisted official 480p sources and forwards a single byte range. No arbitrary URL parameter, redirects, local movie archive, or full-file buffering. Playback uses server egress; source availability and server-to-source bandwidth still matter. The 480p files are approximately 16.7 MB / 78.5 MB for a full playthrough. Consider object storage/CDN with the same license credits if concurrency grows.

Movie audio defaults muted, with an explicit gesture to enable it on mobile. Sea ambience drops to 0.10 while movie sound is on. The independent music player is not stopped or modified; it can be adjusted by the user. Backgrounding pauses the local player; returning catches up to the public schedule. Leaving the cinema releases its video source. Failed streams offer retry and retain the program board.

Credits: dist/assets/coast/CREDITS.txt and the expandable film credits beside the cinema controls. No paid AI or 3D generation calls.
