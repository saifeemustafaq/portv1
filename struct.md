
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

---

Now let's fix all the build errors, run npm run build, and keep on fixing the build errors until you fix them all. Remember, please don't turn of the build errors, rather I want you to fix them permanently. Please note, the error handling code is important to me, so please don't remove it, instead improve it if needed.

Use @approachesUsed.md file to understand what has been done already, and update it with what you will be doing so that we can swiftly fix this build errors

Here is the structure for any reference:

mustafasaifee@Mustafas-MacBook-Air-299 port3 % tree -I 'node_modules|dist|.git'
.
├── README.md
├── __tests__
│   ├── api
│   │   └── admin
│   │       └── settings
│   │           └── categories.test.ts
│   └── integration
│       ├── categoryManagement.test.ts
│       └── categoryManagement.test.tsx
├── actionPlan.md
├── app
│   ├── admin
│   │   ├── [category]
│   │   │   ├── CategoryPageClient.tsx
│   │   │   └── page.tsx
│   │   ├── basic-info
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── innovation
│   │   ├── layout.tsx
│   │   ├── login
│   │   │   ├── LoginForm.tsx
│   │   │   └── page.tsx
│   │   ├── logs
│   │   │   └── page.tsx
│   │   ├── project
│   │   │   └── add
│   │   │       └── page.tsx
│   │   └── settings
│   │       ├── CategorySettings.tsx
│   │       ├── change-password
│   │       │   └── page.tsx
│   │       └── page.tsx
│   ├── api
│   │   ├── admin
│   │   │   ├── basic-info
│   │   │   │   └── route.ts
│   │   │   ├── change-password
│   │   │   │   └── route.ts
│   │   │   ├── debug
│   │   │   ├── get-image-url
│   │   │   │   └── route.ts
│   │   │   ├── project
│   │   │   │   ├── [id]
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── settings
│   │   │   │   └── categories
│   │   │   │       ├── README.md
│   │   │   │       ├── init
│   │   │   │       │   └── route.ts
│   │   │   │       └── route.ts
│   │   │   ├── test-session
│   │   │   │   └── route.ts
│   │   │   ├── upload
│   │   │   │   └── route.ts
│   │   │   └── work-experience
│   │   │       └── route.ts
│   │   ├── auth
│   │   │   ├── [...nextauth]
│   │   │   │   └── route.ts
│   │   │   └── auth.config.ts
│   │   ├── log
│   │   │   └── route.ts
│   │   └── logs
│   │       └── route.ts
│   ├── components
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ImageCropper.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   └── ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── toast.tsx
│   ├── config
│   │   ├── categories.ts
│   │   └── colorPalettes.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── hooks
│   │   └── useCategories.ts
│   ├── layout.tsx
│   ├── lib
│   │   ├── bootstrap.ts
│   │   └── mongodb.ts
│   ├── page.tsx
│   ├── providers.tsx
│   └── utils
│       ├── azureStorage.ts
│       ├── clientLogger.ts
│       ├── dateFormatter.ts
│       ├── errors
│       │   └── ProjectErrors.ts
│       └── logger.ts
├── approachesUsed.md
├── designGuide.md
├── docs
│   └── admin
│       └── category-management.md
├── errorHandler.md
├── eslint.config.mjs
├── lib
│   ├── db.ts
│   └── errors
│       ├── AuthErrors.ts
│       ├── CustomErrors.ts
│       ├── errorFormatter.ts
│       └── errorMiddleware.ts
├── middleware.ts
├── models
│   ├── Admin.ts
│   ├── Category.ts
│   ├── Log.ts
│   ├── Project.ts
│   └── WorkExperience.ts
├── next-env.d.ts
├── next.config.js
├── overview.md
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── scripts
│   ├── check-categories.js
│   ├── check-projects.js
│   ├── check-schema.js
│   ├── delete-all-projects.js
│   ├── fix-project-categories.js
│   ├── fix-project-references.js
│   ├── init-admin.ts
│   ├── init-categories-direct.js
│   ├── init-categories.ts
│   ├── migrate-categories.ts
│   ├── migrate-test-to-portfolio.js
│   ├── migrate-work-experiences.js
│   ├── test-db.ts
│   ├── test-mongodb.js
│   ├── test-project-api.js
│   ├── test-project-data.js
│   └── update-category-palettes.js
├── struct.md
├── tailwind.config.ts
├── techstack.md
├── thingsToDo.md
├── tsconfig.json
└── types
    ├── next-auth.d.ts
    ├── next.d.ts
    └── projects.ts

51 directories, 108 files


The build succeeds when we disable TypeScript errors. This confirms that the issue is purely with TypeScript types and not with the actual functionality.

typescript: {
    ignoreBuildErrors: true, // Temporarily disable TypeScript error checking during build
  },