
fix npm run build and ESLint errors

if needed, run: 
tree -I 'node_modules|dist|.git'


Let's move on to the @nextItems.md 

For reference: @overview.md  @techstack.md  @designGuide.md  

Also remember, we have to maintain high level modularity of the code, and proper folder and component structuring. Please proceed as you seem fit, you have complete autonomy as you are the prime developer here. feel free to issue commands to make folders or install anything, and make progress in any sequence as you see fit.




Now, you need to provide me in detail what would be the best next major high priority steps after what we have done till now, make sure we adhere to @overview.md 
Then cross-reference if the steps that you have mentioned are already present in @nextItems.md , if they are not, then add it accoringly to appropriate places. if we have done something extra, then add that as well.
Also mark the items we have achieved till now in @nextItems.md 
Try not to remove any item as it is good to have old items there for project tracking



We are tasked with implementing error handling to every file and components in the webapp, we track our progress in @errorHandling.md and we add our progress and update items we have completed, we check mark things that are completed, and then proceed with things that are not completed.

Proceed with the next top five things which you feel we should take on first in @errorHandling.md 

Once done, go back to @errorHandling.md and update it to reflect the progress. Use the checklist to track the progress, and update the progress tracker as well. and rather than removing anything, you should be using the tracking system to mark items as needed.

.
├── README.md
├── app
│   ├── admin
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   ├── portfolio
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── settings
│   │   └── users
│   ├── api
│   │   ├── admin
│   │   │   ├── activity
│   │   │   │   └── route.ts
│   │   │   ├── create-first-admin
│   │   │   │   └── route.ts
│   │   │   └── stats
│   │   │       └── route.ts
│   │   ├── auth
│   │   │   └── [...nextauth]
│   │   │       └── route.ts
│   │   ├── portfolio
│   │   │   ├── [id]
│   │   │   │   └── route.ts
│   │   │   ├── route.ts
│   │   │   ├── search
│   │   │   │   └── route.ts
│   │   │   └── upload
│   │   │       └── route.ts
│   │   └── test-db
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── portfolio
│       ├── content
│       ├── page.tsx
│       ├── product
│       └── software
│           └── page.tsx
├── auth.ts
├── components
│   ├── admin
│   │   ├── dashboard
│   │   ├── layout
│   │   │   └── AdminLayout.tsx
│   │   ├── portfolio
│   │   ├── shared
│   │   └── users
│   ├── layout
│   │   └── Container.tsx
│   ├── navigation
│   │   ├── MainNav.tsx
│   │   └── MobileMenu.tsx
│   ├── portfolio
│   │   ├── categories
│   │   │   └── CategoryCard.tsx
│   │   ├── featured
│   │   │   └── FeaturedCarousel.tsx
│   │   └── shared
│   │       ├── PortfolioGrid.tsx
│   │       ├── PortfolioList.tsx
│   │       └── ViewToggle.tsx
│   ├── sections
│   │   └── home
│   │       ├── AboutSection.tsx
│   │       ├── ContactPreview.tsx
│   │       ├── HeroSection.tsx
│   │       └── PortfolioPreview.tsx
│   └── ui
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Carousel.tsx
│       ├── ErrorBoundary.tsx
│       └── Typography.tsx
├── designGuide.md
├── errorHandling.md
├── eslint.config.mjs
├── lib
│   ├── auth.ts
│   ├── db.ts
│   ├── imageUpload.ts
│   ├── mongodb.ts
│   └── utils.ts
├── models
│   ├── PortfolioItem.ts
│   └── User.ts
├── netlify.toml
├── next-env.d.ts
├── next.config.js
├── next.config.ts
├── nextItems.md
├── overview.md
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── icons
│   ├── images
│   │   └── profile.png
│   ├── next.svg
│   ├── portfolio
│   ├── vercel.svg
│   └── window.svg
├── struct.md
├── tailwind.config.ts
├── techstack.md
├── tsconfig.json
└── types
    ├── mongodb.d.ts
    ├── next-auth.d.ts
    └── portfolio.ts

48 directories, 71 files