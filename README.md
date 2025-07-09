# 🚗 Async Race

An SPA to build a virtual garage, race radio‑controlled cars and track winners.  Created for the **EPAM “Async Race” task**.

| Live demo                                                  | Score             |
| ---------------------------------------------------------- | ----------------- |
| https://github.com/Kalifornia-ai/AsyncRaceApi | **400 / 400 pts** |

All requirements implemented — see the fully ticked checklist below.

---

## 📋 Checklist (all done)

### 🚀 UI Deployment

|  Status  |  Pts  |  Item                                                          |
| -------- | ----- | -------------------------------------------------------------- |
| ✅        |  —    | Deployed to GitHub Pages / Netlify / Vercel / Cloudflare Pages |
| ✅        |  —    | Commits follow the guideline                                   |
| ✅        |  —    | Checklist included in README and kept up‑to‑date               |
| ✅        |  —    | Score & deploy link added to README                            |

### Basic Structure (80 pts)

|  Status  |  Pts  |  Requirement                                                          |
| -------- | ----- | --------------------------------------------------------------------- |
| ✅        | 10    | Two views: **Garage** & **Winners**                                   |
| ✅        | 30    | Garage view shows: header, create/edit panel, race panel, garage list |
| ✅        | 10    | Winners view shows: header, winners table, pagination                 |
| ✅        | 30    | Persistent state when switching views (page #, inputs, etc.)          |

### Garage View (90 pts)

|  Status  |  Pts  |  Requirement                                             |
| -------- | ----- | -------------------------------------------------------- |
| ✅        | 20    | CRUD for cars (name + color). Deletes cascade to Winners |
| ✅        | 10    | RGB color picker reflected on car sprite                 |
| ✅        | 20    | Random 100 cars generator                                |
| ✅        | 10    | Update / Delete buttons near each car                    |
| ✅        | 10    | Pagination – 7 cars / page                               |
| ✅        | 10    | **Extra** Empty‑garage UX & auto‑rewind page             |
| ✅        | 20    | **Extra** Rewind page on last‑car delete                 |

### 🏆 Winners View (50 pts)

|  Status  |  Pts  |  Requirement                                     |
| -------- | ----- | ------------------------------------------------ |
| ✅        | 15    | Display winners after races                      |
| ✅        | 10    | Pagination – 10 winners / page                   |
| ✅        | 15    | Table columns: № / car / name / wins / best time |
| ✅        | 10    | Sorting by wins & best time (asc/desc)           |

### 🚗 Race (170 pts)

|  Status  |  Pts  |  Requirement                                                    |
| -------- | ----- | --------------------------------------------------------------- |
| ✅        | 20    | Start‑engine animation with velocity request; stop on 500 error |
| ✅        | 20    | Stop‑engine animation returns car to start                      |
| ✅        | 30    | Responsive animation works ≥ 500 px                             |
| ✅        | 10    | “Start Race” starts all cars on current page                    |
| ✅        | 15    | “Reset Race” returns all cars to start                          |
| ✅        | 5     | Winner banner with car name                                     |
| ✅        | 20    | Correct button states (disabled while racing etc.)              |
| ✅        | 50    | Robust actions during race (edit/delete/add, switch page/view)  |

### 🎨 Tooling (10 pts)

|  Status  |  Pts  |  Requirement                                  |
| -------- | ----- | --------------------------------------------- |
| ✅        | 5     | Prettier with `format` & `ci:format` scripts  |
| ✅        | 5     | ESLint (Airbnb, strict TS) with `lint` script |

### 🌟 Overall Code Quality (up to 100 pts – reviewer)


---

## 🔧 Getting Started

```bash
# clone & install
$ git clone https://github.com/Kalifornia-ai/AsyncRaceApi
$ cd async‑race && pnpm install

# start backend mock (in another terminal)
$ git clone https://github.com/mikhama/async‑race‑api.git
$ cd async‑race‑api && npm i && npm start

# run Vite dev server
$ npm dev
```

### Scripts

* `dev` – Vite + HMR
* `build` – production build
* `preview` – preview dist
* `format` / `ci:format` – Prettier
* `lint` – ESLint (Airbnb)

---

## 🗂 Structure

```
src/
├─ api/          # RTK Query slices
├─ app/          # Redux store & UI slice
├─ components/   # UI building blocks
├─ pages/        # Garage & Winners views
├─ types/        # global TS types
├─ utils/        # pure helpers
└─ main.tsx      # React root
```

---

## ⚙️ Stack

* React 18 + TypeScript strict
* Vite
* Redux Toolkit (+ RTK Query)
* Tailwind CSS
* ESLint (Airbnb) + Prettier
* Web Animations API for car motion

---

## 📝 Commit convention

Conventional Commits:

```
<type>: <subject>
```

Examples: `feat: add random‑car generator`, `fix: handle 500 engine error`.

---

## 📄 License

MIT © 2025 
