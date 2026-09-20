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

The `#videos` section features four on-demand films: Execution, Details, Installation and Other areas of the installation. One player loads only the selected film after interaction, with native controls and fullscreen; the vertical Details film retains its complete frame. Existing sound is preserved. There is no automatic next film. Responsive posters and direct-file links provide an alternative when JavaScript or playback is unavailable.

Film metadata is embedded as `showcase-data` in each homepage; localized labels and descriptions accompany the shared media paths. Update dimensions, duration, posters and all language versions together when replacing a film. Existing video assets and former platform assets are preserved, while the platform presentation remains withdrawn. No camera originals or private project records are included.

## Publication

Publish this repository to its existing GitHub Pages destination. Moving to the company domain requires the owner's DNS/domain access; this demonstration does not alter `fcmontagens.com`.
