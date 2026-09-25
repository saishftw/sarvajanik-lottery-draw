# Sanvordem Ganeshotsav prize announcement

A self-contained static presentation for the 25 September 2026 Mahaprasad Pavti coupons draw. No build, CDN, API, or internet connection is needed at the venue. Existing artwork is kept unchanged.

## Run

From the project folder:

```sh
npm start
```

Open **http://127.0.0.1:4286**. Keep the terminal running. `npm start` takes an optional port, as in `npm start -- 8123`. The same folder can also be deployed on a static host.

The bundled `serve.py` marks every response `no-store`. Plain `python3 -m http.server` sends no cache directives, so a browser reuses old ES modules after an edit and reports a fresh export as missing; if that happens, hard-refresh the page.

Use the same hostname, port, browser, and browser profile for the entire event. `localhost`, `127.0.0.1`, different ports, and a hosted website have separate browser storage. Do not use a private browsing window or open `index.html` with `file://`, which blocks the modules and leaves only the welcome screen with nothing clickable.

## Present

- The four footer controls switch between Welcome, Prizes, 2025 winners, and Draw. Sound and motion controls are in Settings, not on the presentation footer.
- Welcome automatically plays `resources/ganesh-video-01.mp4` as a muted, continuously looping background. The gold Marathi title, invocation, event details and floral ornament stay visible over it, keeping the same composition as the poster. The photograph remains available while loading or if video playback fails.
- The welcome overlay also shows the Mandal name, its 49th year, establishment in 1978, and the confirmed coupon quantity/range. These remain visible when the presenter controls fade.
- Welcome controls fade after five idle seconds. Move the pointer, tap, or use the keyboard to bring them back. They stay visible during keyboard focus, open dialogs, and storage warnings. The other three screens keep their controls visible.
- The previous-winner record is presented two winners at a time, and sponsor artwork is split into smaller groups, so the original lettering can be displayed larger.
- Spotlight, supporter and 2025-winner slides have optional five-second rotation and manual navigation. A manual selection starts a fresh five-second interval. Rotation pauses for dialogs, hidden tabs and still/reduced-motion settings; it never changes the live entry screen.
- The prize page gives the original hall advertisement roughly half the presentation area alongside Spotlight, Supporters and Coupon views. On narrow screens it stacks below the content without cropping. The previous-winner page retains its hall advertisement.
- **All vehicles** is the first/default prize tab, followed by **Spotlight**. It uses the full presentation area for all 18 models, grouped into Cars and Scooters. Every model shows its printed cash component; scooter amounts are marked "each" and their badges show five-prize ranges. Select any vehicle to open its Spotlight view. The hall ad is hidden only in this overview; the gallery does not auto-advance.
- The poster-inspired navy brocade, embossed gold borders and metallic badge highlights are scoped to All vehicles in `all-vehicles.css`. Spotlight, the draw and results retain their existing styling.
- The top three vehicle prizes use arched frames and medallions; the others use coupon-style corner tabs. Burgundy nameplates, rank markers and cash amounts also appear on the results board, with matching prize identification and digit panels on the input screen. Numbers remain the primary content.
- **Coupon** shows the front and back artwork. Opening either image shows only the original image and a close control, without an added visible caption. The image retains an accessible description.
- **Committee** presents the five Mandal personnel as names, roles and phone numbers, without signatures. This is a separate full-width tab under Prizes.
- The site starts in **Rehearsal**. Use **Settings > Draw record** to switch to the independent **Live event** record. Switching loads that record's own settings. Save the switch first before editing its settings.
- Select a prize, type or paste its number, and press **Enter** or **Confirm number**. The default draw sequence is **lucky-book prizes 15 to 1, then main prizes 30 to 1**, ending with the BMW. The picker follows that order and still permits manual selection. **Next undrawn prize** skips confirmed entries and wraps only to pick up missed prizes. Reloading resumes at the first unconfirmed prize in that sequence.
- **All 45 prizes use six-digit coupon numbers from `000000` to `119999`**, including the lucky-book cash prizes. There are 1,20,000 coupons. Leading zeros are required and preserved; the range is fixed and has no settings controls.
- Auto-submit is opt-in. It only reacts to a new input completing the number, never refreshes or restored results. Corrections always require explicit confirmation.
- Repeat numbers trigger an explicit warning across all prizes, including repeats between a book prize and a vehicle prize. Only override it when the actual draw rules permit repeat winners.
- **Correct result** preserves the original confirmed value until the correction is saved. Previous values remain in the JSON correction history.
- **All results** shows three pages of fifteen results. It does not lose the current draft. Select a result to return to that prize.
- The bottom credit strip carries the five witnessing officials above the collection notice and the five Mandal contacts, so the public record of who the draw was held before stays on screen in both the live entry view and the All results board. `DRAW_WITNESSES` in `data.js` owns the names and designations; edit that list to change them.
- **Expand number** hides the results sidebar. The **sun/moon icon** beside it turns the draw screen to a beige ground with dark type, moving the burgundy onto the plates that carry numbers: the digit panels, the prize nameplate, the recent-results rail and each confirmed cell on the board. It is useful when the hall is bright or the projector washes out a dark screen. The icon shows the theme it switches to. The toggle affects the draw screen only, so Welcome, Prizes and the winner gallery keep their dark presentation even while it is on. It resets to dark on reload. Settings has an LED safe-margin adjustment. Browser reduced-motion preferences are respected.
- **Settings > Pause motion** immediately stops ambient flower rotations, the first-prize frame sheen, the welcome video, and celebrations. A playing welcome video freezes on its current frame. Decorative motion and video pause in hidden screens/background tabs, and the ornament behind the number pauses during input. Confirmed digits never animate on a loop.
- **Settings > Sound effects** toggles locally synthesized entry/confirmation sounds immediately. Sound is opt-in on each page load; the welcome video's audio remains muted. Set volume and save the other settings before the event. Top-three celebrations follow a successful save.

The laptop and LED show the same page in a mirrored setup: input, settings, corrections, dialogs, and notifications are public. This site does not generate random winners.

## Backups and recovery

Confirmed numbers and drafts are saved to local storage. This is not cloud sync or a tamper-proof official record. Keep the physical draw record and download backups periodically.

- **Settings > Download JSON backup** saves editable results, drafts, settings, and correction history.
- **Restore backup** validates the event and record type, requires typing `RESTORE 2026`, and downloads the current record before replacement. A rehearsal backup cannot be imported into the live event.
- The **download icon** beside **Save all results** exports the current results page as a PNG. The all-results export is a landscape sheet: one column per prize group side by side, so all 45 results are read at a glance rather than scrolled down a tall strip. The five witnessing officials are credited across its foot. These are purpose-built images with confirmed numbers and printed cash components, not screenshots. Drafts are excluded; rehearsal exports are clearly labelled.
- **Reset saved numbers** requires typing `RESET 2026` and downloads the previous stored record first. It affects only the selected record.
- Malformed data, storage write failures, and changes from another window block further announcements. They never silently discard or replace the stored record. Back up unreadable data before deliberately resetting it. After a normal storage conflict, reload to review the current saved data.
- A damaged record can still be selected for backup/recovery, and does not prevent switching to the healthy record. Damaged presentation preferences have a separate **Reset presentation options only** action which leaves both draw records untouched.

Keep only one active editing window. Revision checks detect stale records, but browser local storage is not a transactional multi-user database. Other devices visiting the same hosted site do not receive this browser's live results.

The fixed-range schema preserves compatible older records without changing number strings. Old confirmed book results or correction-history entries that are not valid six-digit coupons are not padded or reinterpreted automatically: the original stored record is retained for backup and explicit correction. Partial numeric drafts of up to six digits remain valid.

## Vehicle artwork

All 18 models are mapped to the supplied files in `vehicles/` through `media.js`. Filenames, source artwork and embedded marks are preserved. The second VIDA image remains available but is not used.

White-background images sit on nearly white studio panels with a subtle multiply blend; grey-background images use panels matched to their source background. This avoids cutting through white paint, glass, wheels or reflections.

`VEHICLE_OVERVIEW_FRAMING` in `media.js` contains source-pixel framing windows for All vehicles. These remove excess empty space and make smaller-looking cars, such as the Honda Elevate, easier to see. They are rendered as SVG viewports; source files and Spotlight framing are not changed. Keep the whole vehicle and shadow inside the crop when adjusting these values. The existing Hyundai margin crop remains on the other presentation views.

Each scooter model is reused across its five prizes. To replace an image, put its approved file in `vehicles/` and update its path in `media.js`. Transparent images are welcome but not required. Null entries still show an intentional placeholder without requesting a missing file.

Example:

```js
'audi-a4': 'vehicles/audi-a4.png',
```

`data.js` owns the printed model names, ranks, and cash components. Confirm those against the organisers' final coupon before the event. The past-winner gallery uses crops of the supplied 2025 record, preserving the original names and photographs.

The results board deliberately contains prize numbers, model names and winning numbers, not vehicle thumbnails. Images appear in the showcase and the selected-prize announcement, keeping the dense results view readable.

## Welcome video and resources

The original event images and supplied video files live in `resources/`. Supporter artwork supplied by the supporters themselves lives in `resources/supporters/`. Vehicle images remain in `vehicles/`, and the extracted Marathi title remains in `artwork/`. Image, sponsor-crop and full-size-view paths all use those locations.

Each entry in `SPONSOR_PANELS` (`media.js`) names its own `source`, source `width`/`height` and the `crop` window shown on the Supporters page. Three optional fields carry the lettering printed on the coupon: `caption` (a name and role for photographs with no lettering of their own), `printed` (lines set inside the card beside a logo, such as a phone number or tagline) and `title` with `titleColour` for lettering-only supporters. A lettering-only panel may also take a `mark`: supplied artwork cropped to a silhouette and recoloured to the title's own ink, so it reads as part of the type rather than a pasted-in logo. Sai Opticians uses one — a full spectacle frame set above the name in the same blue, cropped to the artwork's own ink so no transparent padding is carried into the card. Of the twenty-one panels, eighteen supporters use their own artwork, Rajesh Kudalkar and Sai Opticians are set in type rather than enlarged from a soft crop, and only Bandekar Offset is still cut from the printed coupon back (`resources/coupon-back.jpeg`). To swap that one in, drop the file in `resources/supporters/` and point its panel at the new source and crop.

One file is derived, with the supplied source kept beside it: `landmark-mg-goa.png` is a 1600 px rasterisation of `MG Logo 3.5 X 2.5 Cm.pdf`. `sandy-toes-sheet.jpeg` holds the mark in six colours, and the panel crop shows the green one printed on the coupon. `honda.jpeg`, `hero.svg` and `tata.jpeg` are superseded by the later `honda-logo.png`, `hero-logo.png` and `tata-logo.webp`, which the panels use.

Every panel is normalised to one frame so no supporter is shown larger than another: the artwork is scaled to fit a box of 820 px by 52vh (46vh where a printed line shares the card), and lettering-only panels fill a card of the same size. A panel is never enlarged past twice its own crop, which keeps the one remaining coupon crop from being blown up into a soft patch. The beige frame is drawn as the card's border and the artwork sits on white, so logos supplied on a transparent background read the same as the ones supplied on white. A lettering-only name is held to a single line by capping its type against the card's width and the length of the name. The two captioned portraits carry their credit below the photograph, set small and tight on a single line each where it fits, because every line the caption saves is height the portrait takes instead.

The active video is selected in `media.js`:

```js
export const WELCOME_VIDEO = 'resources/ganesh-video-01.mp4';
```

The supplied 1280 x 720 video loops behind the welcome design, with its audio muted. Only the fallback photograph disappears when playback begins: the Marathi title, event details and decorative overlay remain. A missing or unplayable video reports an error and restores the photograph rather than leaving a blank screen. To replace it later, update `WELCOME_VIDEO`; set it to `null` to use only the poster.

The title remains a separate website overlay, so it does not need to be baked into future video renders:

- `artwork/ganesh-title.png`: transparent 535 x 207 wordmark, cropped from the lower part of the supplied identity artwork.
- `artwork/ganesh-title-source.png`: untouched 535 x 645 supplied source.

The selected source contains 72-pixel black bars at both the top and bottom. `welcome.css` displays its 1280 x 576 picture through a clipped video frame (125% height, -12.5% top offset), removing the bars without modifying the original MP4. Horizontal framing positions Ganesh to the left of the text on presentation screens; the video stacks above the text on phones. Check these crop values when replacing the source, especially if the next render has no baked-in bars. The website continues to own all live numbers, results, sounds, and navigation.

For more detail on a large display, re-render from the original high-resolution artwork at 1080p or 4K. Enlarging or sharpening the existing 720p file cannot restore details that were not captured. The website does not modify the video file.

## LED setup

The physical 12 x 8 ft panel is 3:2. Confirm the actual pixel resolution and feed mapping with the LED operator; browser responsiveness cannot fix controller-generated black bars. Use fullscreen, start with the default safe margin, and review digit legibility from the back of the venue. The responsive layouts cover 3:2 and widescreen desktop canvases; phones stack content and allow scrolling.

### Typefaces

Every face is bundled in `fonts/` (declared in `fonts.css`, SIL Open Font License), so the venue needs no font download and every laptop renders the same letters. Each face keeps the widths and line heights of the system font it replaced, so layouts did not move.

- **Gelasio** (`--serif`), headings and names. It has Georgia's exact widths, drawn with sturdier strokes. Rank markers use its lining figures, because old-style numerals shrink to lowercase height on a coarse panel.
- **Source Sans 3** (`--sans`), labels, controls, prize names and amounts. A humanist sans in Trebuchet's spirit with open apertures. It is scaled to Trebuchet's widths, which leaves it an x-height close to Trebuchet's.
- **Lexend** (`--numerals`), coupon numbers only: digit panels, results rail, board cells and the exported sheet. Its open 3, 6 and 9 and plain zero stay distinct when a digit is only a few LED pixels wide. Slashed or dotted zeros were rejected because they blur towards 8.
- **Tiro Devanagari Marathi** (`--devanagari`), the invocation and the exported Marathi title. It uses traditional Marathi conjunct forms instead of whichever Devanagari font the operating system supplies.

When adding text, keep it at or above the existing size floors. At a typical 3.9 mm pitch, a 12 ft wall is only about 940 LED pixels across, so a 1920-wide laptop feed is shown at roughly half size. Small print such as the witness roles will not be readable from the audience.

## State checks

No packages need installing:

```sh
npm test
```
