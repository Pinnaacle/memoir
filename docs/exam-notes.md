# Exam Notes: Moments, Spaces and Image Upload

## Exam Context

The exam is a **24-hour home assignment** from **Monday 12:00 to Tuesday 12:00**.

The exact requirements are released in Wiseflow when the exam starts, so this document is a preparation guide, not a final submission checklist. When the assignment is released, compare its wording against this plan and adjust the screencast focus if needed.

Expected delivery:

- A screencast, maximum **5 minutes**
- Uploaded in Wiseflow as `.mp4` or similar

The screencast should normally cover:

- Demo of the app running on a device or simulator
- Code walkthrough of selected features
- How the app uses Supabase data
- Reflection on technical choices and challenges

Important exam framing:

- The goal is to show understanding, not to make a polished production.
- Choose a small, focused feature rather than trying to show the entire app.
- Show only the files and flows that support the explanation.
- It is okay to mention related features briefly, but the main walkthrough should stay narrow.

## Main Feature

Use **Moments with image upload inside a selected Space** as the feature for the 5-minute screencast.

This is the strongest exam angle because it shows:

- React Native and Expo UI patterns
- Expo native APIs for image picking and image processing
- Supabase Auth, Database and Storage
- Space-based data scoping with `group_id`
- React Query mutations, cache updates and invalidation

## Why This Feature Fits The Exam

Moments is a good exam feature because it is small enough to explain in 5 minutes, but broad enough to show the important technical parts of the app.

It covers the likely assessment areas:

- **App demo:** create a moment, select a photo and view it afterward.
- **Code understanding:** form state, upload hook, service layer and query/mutation flow.
- **Supabase:** database tables, Storage uploads and signed image URLs.
- **Expo/React Native:** native image picker, image compression, haptics, safe areas and mobile UI patterns.
- **Reflection:** tradeoffs around separating files from metadata, and scoping data by Space.

Avoid focusing on Chapters for the main walkthrough, because that was not your own feature. It can be mentioned only if the exam specifically asks for broader app functionality.

Events can be used as a backup because it has a similar architecture, but Moments is better for a compact technical explanation because it has a clear image-upload story and optimistic/cache logic.

## Architecture Angle

Use the walkthrough to show a simple React Native/Expo architecture:

```text
service -> hook -> component -> page
```

Explain it bottom-up:

- **Service:** talks to Supabase, Storage and Expo image processing.
- **Hook:** connects services to React Query, upload state and cache updates.
- **Component:** renders mobile UI and calls the hook from user actions.
- **Page:** Expo Router screen that chooses what feature state to show.

Say:

> I keep routes and components focused on mobile UI, hooks focused on state and mutations, and services focused on Supabase and native image work. That makes the feature easier to explain and easier to test.

This fits the course because Expo Router pages are not the whole app. They are the screen layer on top of reusable components, hooks and service functions.

Do not explain it like enterprise architecture. Keep it practical: "this separation keeps my screen files shorter and keeps Supabase code out of the UI."

## Slide And Code Rhythm

Use 2-3 simple slides between code sections:

1. **Feature slide:** Moments in a selected Space with image upload.
2. **Architecture slide:** `service -> hook -> component -> page`.
3. **Data slide:** Storage file + `photos` metadata + `moment_photos` relation.

The slides should be visual pauses, not lectures. Use them to reset the viewer before jumping into code.

Code tabs to keep open:

- `services/moments.ts`
- `services/imageUpload.ts`
- `hooks/useImageUpload.ts`
- `components/ui/AddImageField.tsx`
- `components/MomentForm.tsx`
- `app/moments/new.tsx`

Avoid opening more files unless the exam prompt specifically asks for them.

## 5-Minute Structure

### 0:00-0:30 - Demo

Show the app running in Expo on simulator/device.

Demo flow:

1. Open Moments.
2. Show the active Space.
3. Tap create moment.
4. Fill in type, title, date and description.
5. Add a photo.
6. Save and show the moment in the list/detail screen.

Say:

> I am showing Moments because it covers the most important technical layers in the app: mobile UI, native image picking, Supabase Storage, database writes and Space scoping.

Exam tip:

Do not spend too long typing during the recording. Prepare sample text beforehand or use short values.

### 0:30-1:00 - Architecture Slide

Show the architecture slide:

```text
service -> hook -> component -> page
```

Say:

> The feature is split into four small layers. Services handle Supabase and image processing, hooks handle state and mutations, components handle native UI, and Expo Router pages wire the screen together.

Key point:

This is the main technical decision. It keeps React Native UI separate from Supabase calls and makes the code easier to walk through quickly.

### 1:00-1:35 - Space Context

Show:

- `hooks/useActiveGroup.ts`
- `components/GroupScopePicker.tsx`

Key point:

> Spaces define the current `group_id`. That `group_id` is used when fetching moments, saving moments and uploading images, so the app can separate content between personal and shared spaces.

Exam tip:

This is where you show that the app is not just local UI. The selected Space changes which data the user works with.

### 1:35-2:15 - Page And Form

Show:

- `app/moments/new.tsx`
- `components/MomentForm.tsx`

Key points:

- The Expo Router page loads edit/create state and passes `activeGroupId` into the form.
- The form validates the values, waits for uploads and sends clean input to the mutation.
- `KeyboardAvoidingView`, `ScrollView` and safe-area handling are mobile-specific UI choices.

Say:

> This screen is not doing the Supabase work directly. The page and form collect user input, then pass clean data into the hook layer.

Exam tip:

Do not explain every input. Show the `onSubmit` block and the `AddImageField` usage only.

### 2:15-3:20 - Native Image And Upload Hook

Show:

- `components/ui/AddImageField.tsx`
- `hooks/useImageUpload.ts`
- `services/imageUpload.ts`
- `app.json`

Key points:

- `expo-image-picker` opens the native photo picker.
- `expo-image-manipulator` compresses images before upload.
- `useImageUpload` marks images as `uploading`, `uploaded` or `failed`.
- Uploads use the active Space so Storage paths match `group_id`.
- App config includes the `expo-image-picker` plugin with a photo-library permission message.
- Camera and microphone permissions are disabled because this feature only selects existing photos.

Say:

> This is a cross-platform app, but image picking is still a native feature. Expo gives me one API while still using the system photo picker on each platform.

Exam tip:

This is the most important React Native/Expo section. Show only `handleAddImages`, `startUpload` and `uploadEntityImage`.

### 3:20-4:25 - Supabase Data Slide And Service

Show:

- `services/moments.ts`
- `lib/images.ts`

Data flow:

1. The file is uploaded to Supabase Storage.
2. The moment is inserted into `moments`.
3. Photo metadata is inserted into `photos`.
4. The relation and order are inserted into `moment_photos`.
5. Private images are read through signed URLs.

Key point:

> Files and metadata are separated. Storage handles the image file, while the database handles the moment and its relationship to photos.

Exam tip:

Show the service function, not every React Query cache update. Mention React Query briefly as the hook layer that calls the service and refreshes the UI.

### 4:25-5:00 - Reflection

Say:

> A technical challenge was coordinating native image selection, compression, upload state and database writes. I solved that by separating the upload hook, form hook and Supabase service layer.

> Another important choice was Space scoping. The active Space is used consistently for both database rows and Storage paths, which makes the data model easier to reason about.

> Since the app is cross-platform, I also added native-specific polish: safe-area positioning, touch-friendly 44x44 buttons, haptics and explicit ImagePicker permission configuration.

Exam tip:

End with a reflection, not another code file. This makes the screencast feel complete.

## 24-Hour Work Plan

When the exam opens:

1. Read the Wiseflow assignment carefully and mark any exact requirements.
2. Check whether it asks for a specific type of feature or reflection.
3. If the requirements allow free choice, use Moments as planned.
4. If it asks for broader app architecture, keep Moments as the main example and mention Events/Spaces briefly.
5. Run the app and create one clean demo dataset before recording.
6. Run `npm run lint` and `npx tsc --noEmit`.
7. Record a rough take early. Do not wait until the last hour.
8. Re-record only if the first version is unclear or over 5 minutes.
9. Upload the final `.mp4` to Wiseflow with time to spare.

Suggested time allocation:

- 12:00-13:00: Read assignment, decide final angle, make small adjustments if needed.
- 13:00-15:00: Verify app flow and fix only blocking issues.
- 15:00-17:00: Prepare demo data and final code tabs/files.
- 17:00-19:00: Record first screencast attempt.
- Evening: Re-record if needed and check file format/length.
- Next morning: Final review and upload before deadline.

## Recording Checklist

Before recording:

- App runs in simulator/device.
- You are signed in.
- A Space is selected.
- You have at least one image ready to pick.
- Slides are ready: feature, architecture and data model.
- Editor tabs are open for the exact files in the slide/code rhythm section.
- Supabase tab is ready if you want to show backend tables/storage.
- Notifications and noisy apps are closed.
- Screencast timer is visible or you have a timer nearby.

During recording:

- Keep the demo short.
- Use slides to explain structure, then code to prove it.
- Say what you are showing before switching files.
- Do not scroll through huge files without naming the important function.
- Skip any code that does not support the service-hook-component-page story.
- If something small goes wrong, explain it calmly instead of restarting immediately.
- Stop before 5 minutes.

After recording:

- Check length is under 5 minutes.
- Check audio is understandable.
- Check code text is readable enough.
- Export/upload as `.mp4` or an accepted similar format.

## Files To Mention

Primary walkthrough files:

- `services/moments.ts` - database rows and photo relations
- `services/imageUpload.ts` - Expo image compression and Storage upload
- `hooks/useImageUpload.ts` - upload state and active Space context
- `components/ui/AddImageField.tsx` - native image picker UI
- `components/MomentForm.tsx` - form submit and uploaded photo paths
- `app/moments/new.tsx` - Expo Router page wiring

Mention only if needed:

- `app/(tabs)/moments/index.tsx` - Moments list and create button
- `app/moments/[id].tsx` - detail screen and photo editing
- `hooks/useMoments.ts` - React Query cache updates
- `lib/images.ts` - signed URLs for private Storage images
- `app.json` - ImagePicker permission config

## If The Exam Prompt Changes

If the prompt says "show data from Supabase":

- Emphasize `services/moments.ts`, `photos`, `moment_photos` and signed URLs.

If the prompt says "show a feature you built":

- Emphasize Moments, Events and Spaces. Do not center Chapters.

If the prompt says "technical choices":

- Emphasize Expo native APIs, React Query, service layer separation and Storage/database split.

If the prompt says "challenges":

- Use image upload coordination, Space scoping and cross-platform UI as the main challenges.

If the prompt asks for improvements:

- Mention native permission config, safe-area positioning and touch target polish as small best-practice improvements made before the exam.

## Short Version To Memorize

> I chose Moments because it shows the full mobile data flow in a focused way. The user selects a Space, creates a Moment, picks a photo through Expo's native image picker, the image is compressed and uploaded to Supabase Storage, and the metadata is saved in Supabase tables. React Query keeps the UI responsive with mutations and cache updates, and private images are displayed with signed URLs.

## Backup If Time Is Tight

If the video runs long, skip deep explanation of edit/delete and only mention:

- active Space as `group_id`
- Expo ImagePicker and ImageManipulator
- Supabase tables: `moments`, `photos`, `moment_photos`
- Supabase Storage signed URLs
- React Query mutation/cache flow

## Things To Avoid

- Do not try to explain the whole app.
- Do not use Chapters as the main feature unless the assignment forces it.
- Do not spend more than 30-40 seconds on Supabase UI.
- Do not explain every line of code.
- Do not introduce new risky features during the 24-hour exam unless the prompt requires it.
- Do not worry about making the video highly produced. Clarity matters more.
