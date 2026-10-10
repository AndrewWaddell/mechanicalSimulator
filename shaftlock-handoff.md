# Shaftlock — handoff for new Cursor chat

Use this when opening **your Mac folder / GitHub repo**  
`https://github.com/AndrewWaddell/mechanicalSimulator`  
in a **new** Cursor agent chat. Paste this whole doc (or attach it) plus make sure `shaftlock.html` is in the repo.

---

## What this project is

A **mechanical block simulator** (gears + one-way / ratchet).  
Primary deliverable: a **single local HTML file** opened in Chrome on Andy’s Mac — **no VM, no tunnel, no `npm run dev` required** to try the UI.

Andy (software engineer) prefers:
- Edit the HTML he opens locally / in his GitHub repo
- He commits himself — after each change batch, give him a **commit title** and **commit message** to paste
- Ask before any background UI automation / screen recording
- Massless / quasi-static physics only (negligible inertia)

---

## File to edit

**`shaftlock.html`** — self-contained (vanilla canvas UI + bundled solver).

If the repo already has this file uploaded, treat **that** as source of truth.  
Do **not** send Andy back to a cloud VM or Cloudflare tunnel to test.

Optional related context (if present in Project docs):  
`docs/1wm-solver-approach.md` — complementarity solver plan + XL idle-DOF note.

---

## Physics / blocks (already in the solver)

| Block | Meaning |
|-------|---------|
| **PGS** | Planetary: sun 30T, planet 30T, ring 90T (Willis) |
| **IPGS** | Same external Willis as PGS: 1·ω_sun + 3·ω_ring = 4·ω_carrier. Sun 1:1, ring 1:3, carrier 1:4. Equal sun and ring speeds → carrier at that same speed. Ring fixed → carrier = sun/4. |
| **1WM** | Ratchet: CW relative engages; ACW slips (complementarity, not 2ⁿ in production) |
| **XL** | Holistic = IPGS + 1WM (carrier = pawl, 1WM port = wheel) |
| **Input** | Prescribed rpm source (replace old Drive/Ground) |

**XL demo:** ring input = 0 rpm, sun input = 1 rpm → carrier = 0.25 rpm (1:4).  
**Modeling:** far/free shafts τ=0; after slip, min-norm pins idle ω→0.

**UI today (intended):**
- Click palette block → click canvas to place (click same palette item again to cancel place mode)
- Wire: click orange port, then left port
- Drag block body to move
- Select an Input on canvas → set rpm in sidebar
- **Run** solves; **Load XL demo** loads a preset

---

## DONE already vs MUST DO next

### Already done in an earlier cloud session (may or may not be in Andy’s GitHub copy)

An updated HTML was built that includes:
- XL in the palette
- IPGS port order **Ring → Sun → Carrier**
- Drive/Ground replaced by **Input** (no “out” label; rpm editable)
- Re-click palette item to deselect place mode

Andy’s editor sometimes still showed an **older** ~959-line file without those changes.  
**First job in the new chat:** open his repo’s `shaftlock.html` and check whether it already has XL + Input. If not, apply the prompt below.

### Prompt — apply these changes (if not already present)

Please edit **`shaftlock.html`** only (unless a tiny rebuild script exists in-repo). After changes, give Andy a commit title + message. Do not use a VM/tunnel.

1. **Add XL as a palette block** (holistic IPGS+1WM). Ports in order: Ring, Sun, Carrier, Far.  
   Load XL demo should use: Input(1)→sun, Input(0)→ring, one XL block.

2. **IPGS port order:** Ring, then Sun, then Carrier (not sun/carrier/ring).

3. **Replace Drive and Ground** with a single **Input** block:
   - One connection port (no label “out”)
   - After placing, Andy can set its speed to 0, 1, or any rpm (sidebar field)
   - Block title can show the rpm (e.g. `1 rpm`)

4. **Toggle place mode:** when a left-palette component is selected (orange place mode), clicking that **same** component again should deselect / exit place mode.

5. Keep wiring + Run behavior; keep massless solver behavior.

---

## How Andy tests

Open `shaftlock.html` in **Chrome** on his Mac (double-click / drag into Chrome).  
No server needed.

---

## Commit style for Andy

After each change set, reply with:

**Title:** `…`  
**Message:**  
```
…
```

He pastes that into his own git commit on GitHub.

---

## Suggested first message to the new agent

> Continue the Shaftlock project. Repo is `AndrewWaddell/mechanicalSimulator`.  
> Edit `shaftlock.html` in this repo (local Chrome file).  
> Read `shaftlock-handoff.md` if present.  
> First verify whether XL + Input + IPGS ring→sun→carrier + palette toggle-deselect are already in the HTML; if not, apply that change list.  
> After edits, give me a commit title and message. Do not use VM/tunnel workflows.
