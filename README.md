# FC Montagens website

Static HTML, CSS and JavaScript. Live demonstration: https://oricardo123.github.io/fc-montagens/

Pages: home, industrial pipework, and steel structure assembly. Portuguese at the root; equivalent English, Spanish and French pages in `en/`, `es/` and `fr/`. No build step or content management system is needed to serve the site.

Run `python3 -m http.server 8765` in this folder for a basic preview. A server supporting HTTP Range requests is recommended for video seeking.

## Contact form

`config.js` intentionally has an empty Formspree endpoint. Visitors see a demonstration notice; validation does not send a request. Email and telephone links remain available.

Activation requires a Formspree form owned by FC Montagens, with its verified recipient. Set `formspreeEndpoint` to the activated `https://formspree.io/f/…` endpoint, check the provider settings for the final domain, and perform an authorized real email receipt test. No private key belongs in this repository. The current Free plan starts at 50 submissions/month; confirm the allowance at activation: https://help.formspree.io/articles/account-management/account-limits

`form.mjs` handles local validation, service responses, network failure and timeout. Server acceptance is distinguished from email delivery.

## Media

The background has silent 55.96-second desktop/mobile encodes. Reduced motion, data saving and autoplay failure retain the poster. Playback has a pause control. Case films have native controls without autoplay and preserve their full aspect ratio. The steel assembly website excerpt omits its former named end-card; the original film remains preserved. Stills are decoded directly from available camera/source files; full-size lossless WebP and responsive variants preserve source detail. No camera originals or private project records are included.

## Publication

Publish this repository to its existing GitHub Pages destination. Moving to the company domain requires the owner's DNS/domain access; this demonstration does not alter `fcmontagens.com`.
