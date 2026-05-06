# UI Design Spec (legacy reference)

This document is a **historical design/spec reference** that predates the current design-token system.
The app’s current source of truth is `src/theme/tokens.ts`.

---

ICONS:
Gear_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cog w-5 h-5"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path d="M12 2v2"></path><path d="M12 22v-2"></path><path d="m17 20.66-1-1.73"></path><path d="M11 10.27 7 3.34"></path><path d="m20.66 17-1.73-1"></path><path d="m3.34 7 1.73 1"></path><path d="M14 12h8"></path><path d="M2 12h2"></path><path d="m20.66 7-1.73 1"></path><path d="m3.34 17 1.73-1"></path><path d="m17 3.34-1 1.73"></path><path d="m11 13.73-4 6.93"></path></svg>
Star_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star w-3 h-3"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path></svg>
Plus_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-6 h-6"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
Activities_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity w-5 h-5"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
Profile_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user w-5 h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
Strava_Icon - <svg viewBox="0 0 24 24" class="w-5 h-5 text-muted-foreground" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"></path></svg>
Connect_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link2 w-3.5 h-3.5"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line></svg>
Shoes_Activity_Icon - <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-stretch-horizontal w-3.5 h-3.5"><rect width="20" height="6" x="2" y="4" rx="2"></rect><rect width="20" height="6" x="2" y="14" rx="2"></rect></svg>

FONTS AND COLORS (dark theme):
Page title:

- color: #e7ebef
- font-family: Space Grotesk,sans-serif
- font-size: 18
- font-weight: 700

Plus button:

- background-color: #f97924
- width: 56px
- height: 56px

Bottom navigation:

- background-color: #1d222af2
- backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);

My Gear header filters (active):

- background-color: #f97924
- font-wieght: 500
- color: #ffffff
- font-size: 12
- font-family: Inter,sans-serif

My Gear header filters (non active):

- background-color:#2b303b
- font-wieght: 500
- color: #d1d9e0
- font-size: 12
- font-family: Inter,sans-serif

My Gear item:

- background-color: #1d222a
- border: 1px solid #303540
- border-radius: 12px
  My Gear item header:
- font-wieght: 600
- font-size: 14
- font-family: Space Grotesk,sans-serif
- color: #e7ebef
  My Gear item brand and model:
- font-wieght: 500
- font-size: 14
- font-family: Inter,sans-serif
- color: #7e8a9a
  My Gear item default badge:
- color: #f97924
- font-size: 10
- font-family: Inter,sans-serif

My Gear run badge:

- color: #f97924
- font-weight: 500
- font-size: 12px
- background-color: #f9792426
- border-radius: 10px

My Gear ride badge:

- color: #0da2e7
- font-weight: 500
- font-size: 12px
- background-color: #0da2e726
- border-radius: 10px

My Gear swim badge:

- color: #2bd4bd
- font-weight: 500
- font-size: 12px
- background-color: #2bd4bd26
- border-radius: 10px

My activities list item:

- background-color: #1d222a
- border: 1px solid #303540
- border-radius: 12px

My activities list item header:

- font-wieght: 600
- font-size: 16
- font-family: Space Grotesk,sans-serif
- color: #e7ebef

My activities list item date:

- font-size: 12px
- color: #7e8a9a

My activities list strava badge:

- color: #f97924

My activities list manual badge:

- color: #0da2e7

My activities list item total distance:

- color: #e7ebef
- font-size: 14px
- font-weight: 500
- font-family: Inter,sans-serif

My activities list item shoes and time:

- color: #7e8a9a
- font-size: 12px
- font-weight: 500
- font-family: Inter,sans-serif
