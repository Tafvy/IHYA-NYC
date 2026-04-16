# IHYA NYC Links Page - Quick Reference Card

## 🔗 URLs

**Public Page:** `https://ihyanyc.org/links`  
**Admin Panel:** `https://ihyanyc.org/admin` → Click "🔗 Links" tab  
**Admin Password:** `ihya26`

---

## 📁 File Upload Checklist

Upload these to `github.com/Tafvy/IHYA-NYC`:

```
✅ links.html                              → Root folder
✅ data/links.json                         → In data/ folder
✅ admin.html                              → Root (replace existing)
✅ js/admin-links.js                       → In js/ folder
✅ css/admin-links-styles.css              → In css/ folder
✅ netlify/functions/track-click.js        → In netlify/functions/
✅ netlify/functions/manage-links.js       → In netlify/functions/
```

**Don't forget:** Add CSS link in admin.html `<head>`:
```html
<link rel="stylesheet" href="css/admin-links-styles.css">
```

---

## ⚡ Quick Admin Actions

### Add a Link:
1. Login → Links tab → ➕ Add New Link
2. Fill: Title, URL, Icon, Order
3. Save Link

### Edit a Link:
1. Find link in list → Click ✏️ Edit
2. Make changes → Save Link

### Reorder Links:
1. Edit the link → Change "Display Order" number
2. Lower = higher on page (1 = top, 2 = second, etc.)

### Disable a Link:
1. Edit → Uncheck "Enable this link" → Save

### Feature a Link (Green Highlight):
1. Edit → Check "Feature this link" → Save

---

## 🎯 Pre-Populated Links

Your `/links` page starts with these 4 links:

1. **RSVP: Stories of the Prophets** (Featured)
2. **Support Ihya** (LaunchGood donation)
3. **WhatsApp Announcements** (Community group)
4. **Ihya Podcast** (Spotify)

**Note:** Update the RSVP URL in admin after upload!

---

## 📊 Stats You'll See

**In Admin → Links Tab:**
- Active Links (how many are enabled)
- Total Clicks (all-time clicks across all links)
- Featured Links (how many highlighted)
- Per-Link Clicks (shows on each link card)

---

## 🔄 Auto-RSVP Feature

When you add an event with RSVP link:
1. Go to Events tab → Add New Event
2. Fill in "Registration/RSVP Link" field
3. Publish Event

**Result:** RSVP link auto-appears at TOP of `/links` page!

---

## 🎨 Your Branding

**Colors:** IHYA green, gold, cream  
**Logo:** Already there  
**Username:** @ihyanyc  
**Social Icons:** IG, YouTube, TikTok, Spotify, WhatsApp

---

## ✅ Testing Steps

After upload:
1. Visit `ihyanyc.org/links` → See page?
2. Click each link → Works?
3. Test on mobile → Looks good?
4. Login to admin → Links tab shows?
5. Add test link → Appears on /links?
6. Click link on /links → Click count increases?
7. Edit link → Changes save?
8. Delete link → Disappears?

---

## 🚨 If Something Breaks

1. Check Netlify deploy succeeded (green checkmark)
2. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. Check browser Console (F12) for errors
4. Verify files uploaded to correct folders
5. Try Incognito window

---

## 📱 Update Instagram Bio

**Old:** `linkin.bio/ihyanyc`  
**New:** `ihyanyc.org/links`

Then cancel linkin.bio subscription → Save $5-10/month!

---

## 💡 Pro Tips

- **Emoji Icons:** Use any emoji! 🎉📅🤲📱🎙️
- **Order Numbers:** Don't need to be consecutive (1, 2, 5, 10 works fine)
- **Disable vs Delete:** Disable = temporary hide, Delete = permanent remove
- **Featured Links:** Use for important CTAs (RSVP, Donate)
- **Click Tracking:** Check weekly to see what's popular

---

## 🎉 You're Done!

Everything's ready to go. Upload, test, update Instagram bio, enjoy! 🚀
