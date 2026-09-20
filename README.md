# FC Montagens website

Static HTML, CSS and JavaScript. Live demonstration: https://oricardo123.github.io/fc-montagens/

Four homepages: Portuguese at the root, with equivalent English, Spanish and French versions in `en/`, `es/` and `fr/`. Former work-page URLs redirect to the corresponding homepage section. No build step or content management system is needed to serve the site.

Run `python3 -m http.server 8765` in this folder for a basic preview. A server supporting HTTP Range requests is recommended for video seeking.

## Contact form

`config.js` intentionally has an empty Formspree endpoint. Visitors see a demonstration notice; validation does not send a request. Email and telephone links remain available.

Activation requires a Formspree form owned by FC Montagens, with its verified recipient. Set `formspreeEndpoint` to the activated `https://formspree.io/f/…` endpoint, check the provider settings for the final domain, and perform an authorized real email receipt test. No private key belongs in this repository. The current Free plan starts at 50 submissions/month; confirm the allowance at activation: https://help.formspree.io/articles/account-management/account-limits

`form.mjs` handles local validation, service responses, network failure and timeout. Server acceptance is distinguished from email delivery.

## Media

The opening uses silent 30-second desktop/mobile encodes from the selected edit. A separate silent team montage appears in the Company section. Reduced motion, data saving and unavailable autoplay retain their posters.

The `#trabalho-em-detalhe` gallery features three films: Execution (25.4 s), vertical Details (16.28 s) and Drone views of the installation (18.2 s). The selected video is centered at normal brightness and retains its complete frame; the adjacent posters are smaller and dimmed. SVG arrows, keyboard navigation, side-card selection and horizontal gestures rotate the gallery manually. The old `#videos` anchor remains compatible.

Only the selected foreground film plays, initially muted and looping while visible. Optional sound preserves the recorded audio in Execution and Details; the drone sources are silent. There is no automatic advance. Pause controls the selected film and the silent 12-second animated factory background together. The background is an institutional illustration with fixed architecture and animated vapor. Reduced motion, data saving or playback failure retain a photograph; direct-file links and script-free posters remain available.

Film metadata and translated controls are embedded as `gallery-config` in each homepage. `gallery.mjs` manages playback, selection and responsive layout; `gallery.css` keeps the foreground separate from the scenery. Update media dimensions, duration, posters and all language versions together when replacing a film. New `gallery-` assets preserve the prior video files. Camera originals, editable projects and private production records are not included.

## Publication

Publish this repository to its existing GitHub Pages destination. Moving to the company domain requires the owner's DNS/domain access; this demonstration does not alter `fcmontagens.com`.
