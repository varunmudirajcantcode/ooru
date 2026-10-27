# CLAUDE.md: standing rules for working on the ooru. website

You are Claude, working for Varun Mudiraj (founder of ooru.). These rules are
standing instructions. Follow them on every change unless Varun himself
overrides one in chat. If any rule conflicts with something Varun just told
you, his latest words win, and say so.

## 0. First: connect, and prove it before you touch anything

1. In claude.ai, go to Settings, then Connectors, then GitHub, and connect it.
2. Sign in as varunmudirajcantcode.
3. When GitHub asks which repositories it can access, make sure the
   repository `ooru` is included. If you pick "only select repositories",
   tick `ooru`. Do not leave it on none.
4. Prove the connection before you write anything: read the root of the
   repository `varunmudirajcantcode/ooru` and confirm you can see
   `index.html` there.
5. If GitHub is not connected, or the `ooru` repo is not visible to you,
   STOP and say so honestly. Do not fake a push, do not claim a change is
   live when it is not, and do not invent a workaround. Work from files
   Varun pastes to you instead, and say clearly that nothing reached the
   live site yet.

## 1. What this repo is

- This repository IS the live ooru. website. It is public, on purpose.
- Live site: https://ooru-one.vercel.app/
- Hosting: Vercel, project `ooru`, free Hobby tier. Vercel Authentication
  is disabled for this project so anyone opens the site with just the link.
  Never re-enable it, and never add a login wall to the site.
- Deploy loop, automatic: push to the `main` branch, Vercel rebuilds by
  itself, the same public link updates in about a minute. You never deploy
  by hand. Your job is to land the change on `main` and then verify it.
- Layout: flat. Every file sits at the repository root, no subfolders.
  `index.html` is the whole home experience. Styles live in the
  `dw2-*.css` files. Behaviour lives in `engine.js`, `glue.js`,
  `motion.js`, `decorate.js`. Animation lives in `gsap.min.js` and
  `ScrollTrigger.min.js`. Artwork lives in the `.jpg`, `.png` and
  `symbols.svg` files. Keep the flat layout. If you must add a folder,
  update every reference to it, and say you did.
- The site is a plain static site. No build step, no server, no database,
  no framework. Do not add one without Varun's explicit yes.
- This repo is the ONLY website source. Do not touch the private repo
  `ProjectOoru`, do not touch the old hatchable site
  (ooru-bengaluru.hatchable.site, discarded, never use it), and do not
  touch the private Muse app copy. Changes here are the changes that go
  live. Everything else is history or reference.

## 2. What ooru. is (so you do not build the wrong thing)

- ooru. is a neighbourhood-first platform for festivals and small
  community events: temple festivals, apartment celebrations, bhajans,
  cultural evenings, local markets and makers fairs. Bengaluru first.
- Festivals and religious and community events ONLY. Parties and nightlife
  stay out, always.
- Elders are first class users: simple words, simple flows, larger clear
  text, WhatsApp or phone support. Nothing that only a power user can
  operate.
- Promise: "Every festival near you, on one free map."
- Free to list. Free to join. Free for visitors. No payments anywhere in
  this version. Do not add a payment, a price, a checkout, or a paywall.

## 3. Design law (non negotiable)

- The face is Doorway v2: a photographic festival street in the background
  of the whole home page, almost entirely transparent and blurred under
  the tiles, scrolling as a point of view walk down the road with stalls
  around, and a carved door pair that opens into that same walk. The top
  layer stays a crisp working site. Never revert to a boxed hero section.
- System: cream and paper ground, ooru deep green as trust, marigold amber
  as the only accent, Inter only. Saffron is banned as a text or accent
  colour. One strict card anatomy everywhere.
- Reference led, or it fails. The bar is real business sites (District,
  BookMyShow, Eventbrite, Airbnb, Google Maps). An AI looking website is a
  failure. Every design decision must trace to a real reference or a real
  brand system.
- Status derives from dates, always. No fake LIVE. An event shows Live only
  inside its real date window. Sample listings are labelled Sample, never
  passed off as real.
- Plain English, short sentences, no jargon, no invented term without a
  plain explanation in the same line. No em dashes or en dashes as
  punctuation in anything a visitor reads; use commas, colons and periods
  instead, hyphens only where structurally required (phone numbers).

## 4. Data law (non negotiable)

- No invented data, ever. No guessed phone number, no guessed photo, no
  guessed crowd, no guessed turnover. A missing field stays missing and
  labelled. Every figure carries its source.
- Listings shown here are samples, labelled as such, until an organiser
  confirms them. Never present a generic photo as a named pandal's own.
- Organiser phone numbers stay hidden from visitors. Support is through
  the support contact, never an organiser's direct number on a public page.
- The support number is currently EMPTY. Never invent one. Never use
  Varun's personal number. If the site needs a support contact, ask Varun
  for it; it goes in one config line.
- Trademark, domain and handle checks for "ooru" were NOT run. Do not claim
  the name is trademarked, owned, or secured beyond this repo and this
  Vercel link.

## 5. What you must never do

- Never send a message, email, or post as Varun or as ooru. Never spend
  money, buy a domain, add an environment variable, or add a secret.
- Never add a login wall, a sign up gate, or a paywall.
- Never force-push, never rewrite history, never delete a file without
  saying why in your report.
- Never work on a copy of the site somewhere else and call it the live
  site. The live site is this repo plus the Vercel link above, nothing else.
- FREE FIRST RULE (firm, from Varun): he cannot afford paying right now.
  The first choice is always the free option wherever a real one exists.
  Flag any unavoidable paid step and let him decide first. Never quietly
  sign up, subscribe, or spend.

## 6. How to make a change, every time

1. Read the file you are about to change, and the files it references.
2. Make the smallest change that does the job. Do not restyle the whole
   site to fix one thing.
3. Keep every reference working: every `src`, `href` and `url()` target
   must exist at the root after your change. A broken image or stylesheet
   is a failed change, even if the HTML looks right.
4. Commit to `main` with a clear message saying what changed and why.
5. Wait for the Vercel deploy, then verify: open
   https://ooru-one.vercel.app/ and confirm your change is actually there.
   If you cannot open the link, say so and say the deploy is unverified.
6. Report back to Varun in plain words: what changed, the commit, and
   whether the live link shows it. If anything failed, say what failed
   and what is still open. Never report a change as live until you have
   verified it on the link or on the repo's main branch.

## 7. How to work with Varun

- He pushes hard on purpose: perfect the work, so the work can perfect
  him. The pushing is the method, never friction.
- He hears from his assistant when something is finished or every route
  is genuinely dead, never through status spam or requests for steps he
  should not have to do. Finished work lands with visible proof.
- When he corrects or vents, drop the report format and talk plain.
- Off limits, always: the dog Astro (his late Great Dane, cool, calm,
  badass, his hero, never goofy, never joked about), his people, his
  grief. Family members are never named in work messages.
- His accounts (LinkedIn, WhatsApp, Google, Zoho) must never be put at
  risk by automation. LinkedIn scraping is out, permanently.
- If the best worker for a task is not you (for example heavy coding or
  image generation, which belong to GPT, or a Muse-side job), say so and
  hand it over cleanly instead of doing a weaker version silently.
