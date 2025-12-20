# IHYA NYC Website

A simple, clean website for IHYA NYC — a space for young professionals to reconnect with their faith, purpose, and each other.

🌐 **Live Site:** [ihyanyc.github.io](https://ihyanyc.github.io) *(update with your actual URL)*

---

## 📁 Repository Structure

```
ihya-nyc/
├── index.html          # Main website (don't edit unless changing design)
├── events.js           # ⭐ EDIT THIS to update events
├── ihya-logo.png       # IHYA logo
├── flyers/             # ⭐ PUT FLYER IMAGES HERE
│   ├── dec-28-reflection.jpg
│   ├── jan-11-kickoff.jpg
│   └── ...
└── README.md           # This file
```

---

## 🗓️ How to Update Events (Admins)

### Step 1: Upload Your Flyer Image

1. Go to the `flyers/` folder
2. Click **"Add file"** → **"Upload files"**
3. Upload your flyer image (JPG, PNG, or WebP)
4. Name it clearly, like: `jan-25-brotherhood-night.jpg`
5. Click **"Commit changes"**

### Step 2: Edit the Events List

1. Open `events.js`
2. Click the **pencil icon** ✏️ to edit
3. Find the events section and either:
   - **Update** an existing event
   - **Add** a new event (copy the template)
   - **Delete** past events
4. Click **"Commit changes"**

### Adding a New Event (Copy This Template)

```javascript
{
  id: "unique-event-id",           // Short ID, no spaces
  type: "monthly",                  // "weekly" or "monthly"
  title: "Event Title Here",
  description: "Brief description of the event. Keep it to 1-2 sentences.",
  
  dateDisplay: "25",                // Shows on placeholder if no flyer
  monthDisplay: "January",
  
  datetime: "Saturday, January 25, 2025 | 6:00 PM - 9:00 PM",
  location: "Full Address Here, City, State ZIP",
  
  flyer: "jan-25-event.jpg"         // Filename from /flyers folder (or null)
},
```

### Removing Past Events

Simply delete the entire event block (from `{` to `},`) for events that have passed.

---

## 📋 Weekly Admin Checklist

Every week before Thursday:

- [ ] Upload new weekly flyer to `/flyers` (if changed)
- [ ] Update the weekly event details in `events.js`
- [ ] Remove any past monthly events
- [ ] Add upcoming monthly events

---

## 🖼️ Flyer Image Guidelines

| Requirement | Recommendation |
|-------------|----------------|
| **Aspect Ratio** | 4:5 (portrait) works best |
| **File Size** | Under 500KB for fast loading |
| **Format** | JPG or WebP (smaller files) |
| **Naming** | `month-day-event-name.jpg` |

**Tip:** Use [TinyPNG](https://tinypng.com) to compress images before uploading.

---

## 🚀 Quick Reference

| Task | File to Edit |
|------|--------------|
| Update events | `events.js` |
| Add flyer images | `flyers/` folder |
| Change site design | `index.html` |
| Update logo | Replace `ihya-logo.png` |

---

## ❓ Need Help?

Contact the web team or open an issue in this repository.

---

*Built with ❤️ for the IHYA NYC community*
