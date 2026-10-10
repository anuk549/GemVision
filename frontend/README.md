# Sapphire Defect Detection — Front End

React Native (Expo SDK 57) mobile app for the gemstone defect-detection project.
It ships a **shared design system + reusable components** so every team member
builds consistent UI without re-inventing inputs, tables, forms, feedback and
layout.

> The app is built around four core features:
> **1. Gem Identification · 2. Defect Detection · 3. Gem Cutting · 4. Jewelry
> Design.** Each feature is one route folder and reuses the same components.

---

## 1. Quick start

```bash
cd front-end
npm install
npx expo start          # press a = Android, i = iOS, w = web
```

Run the checks before you push:

```bash
npx expo lint           # ESLint (eslint-config-expo)
npx expo-doctor         # dependency + config health
```

If a package was added manually, always install it with the SDK-aware command:

```bash
npx expo install <package>
```

---

## 2. Project structure

```
front-end/
├── App entry:  package.json -> "main": "expo-router/entry"
├── app.json                       # Expo config (dark theme, scheme, typed routes)
└── src/
    ├── app/                       # Expo Router routes
    │   ├── _layout.jsx            # root Stack (headerless mobile shell)
    │   ├── +not-found.jsx         # 404 route (uses <NotFound />)
    │   └── (tabs)/                # bottom tab navigator
    │       ├── _layout.jsx        # styled tab bar (icons + accent)
    │       ├── index.jsx          # dashboard home (hero, stats, tools)
    │       ├── identify/index.jsx # 1. Gem Identification
    │       ├── detect/index.jsx   # 2. Defect Detection
    │       ├── cutting/index.jsx  # 3. Gem Cutting
    │       └── design/index.jsx   # 4. Jewelry Design
    ├── components/                # ⭐ reusable component library
    │   ├── index.js               # import everything from here
    │   ├── AppText.js  Icon.js  Button.js  Input.js  Card.js
    │   ├── SearchBar.js  Pagination.js  Table.js  TableInput.js
    │   ├── Chip.js  UploadCard.js  KeyValue.js  Screen.js
    │   ├── LoadingBar.js  Popup.js  ErrorMessage.js
    │   ├── NotFound.js
    ├── hooks/
    │   ├── index.js               # useForm, useAsync
    ├── theme/                     # design tokens (colors, type, spacing)
    │   ├── colors.js  typography.js  spacing.js  index.js
    └── utils/
        ├── index.js
        ├── validation.js          # rules + validateForm
        ├── responsive.js          # useResponsive, scaleSize, wp/hp
        ├── format.js  api.js      # helpers + fetch client
```

**Rule:** put screens in `src/app/**`, everything shared in `src/components`,
`src/hooks`, `src/theme`, `src/utils`. Never duplicate a component in a member
folder — import it from `src/components`.

### Mobile app shell

The app uses a native **bottom tab bar** (`src/app/(tabs)/_layout.jsx`) with five
tabs — Home, Detect, Inventory, Account, Bulk — styled with the theme tokens
(active tint `accent`, dark bar). Screens set `headerShown: false` at the shell
level and render their own large-title header through `<Screen>`, which is the
standard mobile pattern. The Home tab is a dashboard: gradient hero card, stat
tiles, workspace cards and a recent-activity list, built from `Card`,
`LinearGradient` and `Icon`.

---

## 3. One import for everything

```jsx
import {
  Screen, Card, AppText, Icon, Button, Input,
  SearchBar, Table, TableInput, Pagination,
  Chip, ChipGroup, UploadCard, KeyValue,
  Popup, LoadingBar, Spinner, LoadingOverlay,
  ErrorMessage, NotFound,
} from '../../components';
```

Theme tokens come back out of the same barrel:

```jsx
import { colors, spacing, radius } from '../../components';
```

---

## 4. Design system (theme tokens)

Dark, clean, mobile-first. Use tokens, never hard-coded hex values. The palette
is **Ceylon-gem inspired**: sapphire blue primary, Ceylon gold accent, with ruby,
emerald, cat's-eye, topaz and amethyst gem hues.

| Token group | Examples |
|---|---|
| `colors` | `background #070B14`, `surface #111A2C`, `surfaceAlt #182238`, `primary/sapphire #3E7BFA`, `accent #E9B949` (Ceylon gold), `text #F3F7FF`, `textMuted #9DB0CC`, `textDim #5E7089`, `textOnAccent #0A0E17`, plus gem hues `ruby #E23D5C`, `emerald #25C08A`, `catsEye #C8A63C`, `topaz #E9A23B`, `amethyst #9B6BE0`, `moonstone #BFD4F2`, `aquamarine #4FC6C6`, and semantic `success/warning/danger/info`, `border`, `divider`, `input` |
| `gradients` | `primary`/`sapphire` (blue), `gold`, `ruby`, `emerald`, `surface`, `background` |
| `spacing` | `xxs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32` |
| `radius` | `sm 8 · md 12 · lg 18 · xl 26 · pill 999` |
| `textVariants` | `h1 h2 h3 title subtitle body bodyStrong label caption overline button link` |

---

## 5. Component catalog

### `Screen`
Safe-area page wrapper with title/subtitle and optional scroll.

| Prop | Type | Notes |
|---|---|---|
| `title`, `subtitle` | string | header text |
| `headerRight` | node | e.g. an icon button |
| `scroll` | bool `true` | wrap children in a ScrollView |
| `padded` | bool `true` | apply page padding + gap |

```jsx
<Screen title="Inventory" subtitle="Search and review stock">
  {/* children */}
</Screen>
```

### `AppText`
All text. `variant` picks a token style.

```jsx
<AppText variant="h3">Title</AppText>
<AppText variant="caption" color={colors.textMuted}>Subtitle</AppText>
```
Props: `variant`, `color`, `align`, `weight`, `size`, plus all RN Text props.

### `Icon`
Wrapper over `@expo/vector-icons`. Default family is Ionicons.

```jsx
<Icon name="diamond-outline" size={24} color={colors.accent} />
<Icon family="material" name="table-chart" />
```
Families: `ionicons`, `material`, `materialCommunity`, `feather`, `fontAwesome`, `ant`.

### `Button`
Variants: `primary | secondary | outline | ghost | danger | success`.
Sizes: `sm | md | lg`. Built-in loading + icon support.

```jsx
<Button title="Save" icon="save-outline" loading={saving} onPress={save} />
<Button title="Cancel" variant="ghost" fullWidth={false} onPress={close} />
```

### `Input`
Labeled text field with validation display, icons and password toggle.

```jsx
<Input
  label="Email" required
  value={v.email} onChangeText={h('email')} onBlur={blur('email')}
  error={err.email}
  leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none"
/>
```
Props: `label, required, error, helper, leftIcon, rightIcon, secureTextEntry, multiline, editable`.

### `SearchBar`

```jsx
<SearchBar value={q} onChangeText={setQ} placeholder="Search…" onClear={...} onSubmit={...} />
```

### `Chip` / `ChipGroup`
Selectable pills for options (cut shape, metal, gemstone…).

```jsx
<Chip label="Round" active={shape === 'Round'} onPress={() => setShape('Round')} />

<ChipGroup
  options={[{ label: 'Gold', value: 'Gold' }, { label: 'Silver', value: 'Silver' }]}
  value={metal}
  onChange={setMetal}
  color={colors.warning}
/>
```
Props: `label, active, onPress, icon, color` (Chip); `options, value, onChange, color` (ChipGroup).

### `UploadCard`
Image picker dropzone — take a photo or choose from the gallery, with preview and
clear. Uses `expo-image-picker` (permissions handled inside).

```jsx
<UploadCard value={image} onChange={setImage} title="Add a gemstone photo" />
```
Props: `value` (asset | uri | null), `onChange(asset)`, `title`, `subtitle`, `height`.

### `KeyValue`
Label → value rows for result/summary cards.

```jsx
<KeyValue items={[
  { label: 'Gemstone', value: 'Blue Sapphire', icon: 'diamond-outline', color: colors.accent },
  { label: 'Confidence', value: '96%', icon: 'shield-checkmark-outline', color: colors.success },
]} />
```

### `Pagination`

```jsx
<Pagination page={page} totalPages={n} onPageChange={setPage} />
```
Hides itself when `totalPages <= 1`.

### `Table`
Declarative columns + rows, with loading and empty states.

```jsx
<Table
  columns={[
    { key: 'name', title: 'Name', flex: 1.4 },
    { key: 'carat', title: 'Carat', width: 80, align: 'center' },
    { key: 'grade', title: 'Grade', width: 90, render: (row) => <Badge value={row.grade} /> },
  ]}
  data={rows}
  keyExtractor={(r) => r.id}
  onRowPress={(r) => open(r)}
  emptyTitle="No records" emptyMessage="Add your first record."
  footer={<Pagination page={page} totalPages={n} onPageChange={setPage} />}
  horizontal          // optional: allow column scrolling on small screens
/>
```
Column shape: `{ key, title, width?, flex?, align?, render?(row, index) }`.

### `TableInput`
Spreadsheet-style editable table with **per-cell validation** and add/remove rows.

```jsx
<TableInput
  columns={[
    { key: 'sample', title: 'Sample', width: 180, placeholder: 'ID',
      validate: rules.required('Sample ID is required') },
    { key: 'grade', title: 'Grade', width: 120,
      validate: [rules.required(), rules.oneOf(['EC','SI','MI','HI'])] },
  ]}
  value={rows}
  onChange={setRows}
  minRows={1} maxRows={20} showRowNumbers
  getDefaultRow={() => ({ sample: '', grade: '' })}
/>
```
Column shape: `{ key, title, width?, placeholder?, keyboardType?, validate? }`.

### `LoadingBar`, `Spinner`, `LoadingOverlay`, `InlineStatus`
The loading bar supports determinate (`progress={0..1}`) and indeterminate modes.

```jsx
<LoadingBar indeterminate label="Loading records…" />
<LoadingBar progress={0.42} showPercentage />
<Spinner label="Please wait" />
<LoadingOverlay visible={busy} message="Uploading…" />
```

### `Popup`
Modal message box for success / error / warning / info, with confirm + cancel.

```jsx
<Popup
  visible={open} type="success" title="Record added"
  message="Blue Sapphire #A9 saved." confirmText="OK" onClose={close}
/>
```

### `ErrorMessage`
Inline red error strip (already used by `Input`, but you can render it directly).

```jsx
<ErrorMessage message="Network unavailable" />
```

### `NotFound`
Branded 404 / empty illustration block.

```jsx
<NotFound code="404" actionText="Go home" onAction={() => router.replace('/')} />
```

---

## 6. Validation & forms

Composable rules in `src/utils/validation.js`:

```js
import { rules, validateValue, validateForm } from '../../utils';

rules.required(message?)
rules.email() · rules.url() · rules.phone() · rules.digits() · rules.number()
rules.min(n) · rules.max(n) · rules.minValue(n) · rules.maxValue(n)
rules.pattern(regex, message) · rules.oneOf([...]) · rules.match(other) 
rules.custom((value, values) => true | false | 'message')
```

`useForm` wires values, errors, touched and submit:

```jsx
import useForm from '../../hooks/useForm';
import { rules } from '../../utils/validation';

const form = useForm({
  initialValues: { stone: '', grade: '' },
  validationSchema: {
    stone: [rules.required(), rules.min(3)],
    grade: [rules.required(), rules.oneOf(['EC', 'SI', 'MI', 'HI'])],
  },
  onSubmit: async (values) => api.post('/records', values),
});

// form.values, form.errors, form.submitting, form.isValid
// form.handleChange('stone'), form.handleBlur('stone'), form.handleSubmit()
```

---

## 7. Mobile-first helpers

```jsx
import { useResponsive, scaleSize, wp, hp } from '../../utils';

const { isTablet, isLandscape, breakpoint, width } = useResponsive();
```

- Tables scroll horizontally; use `flex` columns for the important ones.
- Every component uses `spacing`/`radius` tokens so layouts stay consistent on
  phones, tablets and web.

---

## 8. AI agent prompts (copy & paste)

Use these with any AI coding assistant so generated code **always reuses the
shared components** and stays consistent. Start every prompt with the context
block.

### 8.1 Context block (paste first)

```text
You are working in the `front-end/` folder of a React Native app
(Expo SDK 57 + Expo Router, JavaScript/JSX, dark theme).

Rules you MUST follow:
- Import UI from `src/components` only: Screen, Card, AppText, Icon, Button,
  Input, SearchBar, Table, TableInput, Pagination, Chip, ChipGroup, UploadCard,
  KeyValue, Popup, LoadingBar, Spinner, LoadingOverlay, ErrorMessage, NotFound.
- Use theme tokens from `src/theme` (colors, spacing, radius, textVariants).
  Never hard-code hex colours or magic spacing numbers.
- Use validation rules from `src/utils/validation` and the `useForm` hook from
  `src/hooks/useForm`. Rules array form: [rules.required(), rules.min(3)].
- Screens live at `src/app/(tabs)/<name>/index.jsx` and default-export a
  component. Register each one as a <Tabs.Screen> in
  `src/app/(tabs)/_layout.jsx` and link it from the dashboard
  `src/app/(tabs)/index.jsx`.
- Wrap every screen in <Screen title="...">.
- Show feedback with <Popup> and loading with <LoadingBar>/<Spinner>.
- Mirror the existing patterns in `src/app/(tabs)/identify/index.jsx`,
  `src/app/(tabs)/detect/index.jsx`, `src/app/(tabs)/cutting/index.jsx` and
  `src/app/(tabs)/design/index.jsx`.
- Mobile-first: horizontal-scroll tables, flex columns, token spacing.
- Do not create new components that duplicate an existing one.
```

### 8.2 Add a feature screen

```text
Using the context block above, create a new feature screen at
`src/app/(tabs)/<feature-name>/index.jsx`.

The screen is for: <describe the feature and data fields>.
It must include: <e.g. a search bar, a paginated Table, an "Add" button that
opens a Popup with validated Inputs, and a success/error Popup>.

Reuse Screen, SearchBar, Table, Pagination, Button, Input, Popup. Register it as
a <Tabs.Screen> in `src/app/(tabs)/_layout.jsx` (pick an Ionicons outline/filled
pair for the icon) and add a workspace card to `src/app/(tabs)/index.jsx`. Then
run `npx expo lint` and fix all errors.
```

### 8.3 Add a data table with search + pagination

```text
Using the context block above, build a screen with a SearchBar that filters a
Table, plus Pagination in the Table `footer`. Columns: <list columns with
widths/flex>. Show an empty state when there are no matches. Keep page size at
5 and reset to page 1 whenever the search text changes (do it in the
onChangeText handler, not in a useEffect).
```

### 8.4 Build a validated form

```text
Using the context block above, build a form screen using the `useForm` hook.
Fields: <field: rules>. On submit show a success Popup; on validation failure
show an error Popup listing the problem. Use Input with `error`, `onBlur` and
`required` for every field, and the Button `loading` prop while submitting.
```

### 8.5 Build a bulk / editable table

```text
Using the context block above, build a bulk-entry screen with `TableInput`.
Define columns with `validate` rules, start with one empty row, allow up to
<max> rows, and validate every cell on submit before showing a result Popup.
```

### 8.6 Add a new reusable component (only if truly needed)

```text
Using the context block above, create a new reusable component in
`src/components/<Name>.js`, export it from `src/components/index.js`, and use
only theme tokens. Props: <list>. Include a loading/empty/error state if it
fetches or displays data. Then update README.md section 5 and run
`npx expo lint`.
```

### 8.7 Connect a screen to the backend

```text
Using the context block above, wire this screen to the backend with
`createApiClient` from `src/utils/api.js`. Use `useAsync` (or `useForm` for
mutations) so `LoadingBar`/`Spinner` shows while loading and errors surface in
an error Popup. Base URL: <url>. Endpoint: <method + path>.
```

---

## 9. Conventions checklist

- [ ] One folder per feature under `src/app/(tabs)/`.
- [ ] Reuse components — no copy-pasted UI.
- [ ] Theme tokens for all colours/spacing/radii.
- [ ] Validation via `rules` + `useForm`.
- [ ] Loading via `LoadingBar`/`Spinner`; feedback via `Popup`.
- [ ] 404 handled by `+not-found.jsx`.
- [ ] `npx expo lint` and `npx expo-doctor` pass.
