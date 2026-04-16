# IHYA NYC Links Page - Setup Guide

## 🎉 What You're Getting

A complete **link-in-bio replacement** that replaces linkin.bio with your own branded page at `ihyanyc.org/links`

### Features Built:
✅ Custom links page (`/links`) - Mobile-optimized, IHYA design  
✅ Admin panel to manage links - Add/edit/delete via web interface  
✅ Click tracking - See which links perform best  
✅ Auto-RSVP integration - Event RSVPs auto-appear on links page  
✅ Social media icons - IG, YouTube, TikTok, Spotify, WhatsApp  
✅ Pre-populated with your current 4 links  

---

## 📁 Files to Upload to GitHub

Upload these files to your `Tafvy/IHYA-NYC` repository:

### 1. Public Pages
```
links.html                          → Root folder
```

### 2. Data Files
```
data/links.json                     → Create data/ folder if needed
```

### 3. Admin Panel Updates
```
admin.html                          → Replace existing (or rename current to admin-old.html first)
js/admin-links.js                   → New file in js/ folder
css/admin-links-styles.css          → New file in css/ folder
```

### 4. Netlify Functions
```
netlify/functions/track-click.js    → New file
netlify/functions/manage-links.js   → New file
```

### 5. Update CSS Reference in admin.html
Add this line in the `<head>` section of admin.html, right after the existing CSS:
```html
<link rel="stylesheet" href="css/admin-links-styles.css">
```

---

## 🚀 Step-by-Step Setup

### Step 1: Upload Files to GitHub

1. Go to: `https://github.com/Tafvy/IHYA-NYC`
2. Upload each file to its correct location (see file structure above)
3. Commit all changes

### Step 2: Wait for Netlify Deploy

1. Go to Netlify Dashboard → Your site
2. Wait 1-2 minutes for auto-deploy to complete
3. Should show green "Published" checkmark

### Step 3: Update Your Instagram Bio

**Current:** `linktr.ee/ihyanyc` or `linkin.bio/ihyanyc`  
**New:** `ihyanyc.org/links`

---

## ✅ Testing Checklist

### Test the Public Page:
1. ✅ Go to `https://ihyanyc.org/links`
2. ✅ See IHYA logo, @ihyanyc username, 5 social icons
3. ✅ See 4 link buttons (RSVP, Support, WhatsApp, Podcast)
4. ✅ Click each link - does it work?
5. ✅ Test on mobile - does it look good?

### Test the Admin Panel:
1. ✅ Go to `https://ihyanyc.org/admin`
2. ✅ Login with password: `ihya26`
3. ✅ Click "🔗 Links" tab at top
4. ✅ See stats: Active Links, Total Clicks, Featured Links
5. ✅ Click "➕ Add New Link"
6. ✅ Fill out form, click Save
7. ✅ New link appears in list
8. ✅ Click "👁️ Preview Page" - see your new link on /links
9. ✅ Edit a link - click ✏️ Edit button
10. ✅ Delete a link - click 🗑️ Delete button

---

## 🎯 How to Use the Admin Panel

### Adding a New Link:

1. Login to `ihyanyc.org/admin`
2. Click **"🔗 Links"** tab
3. Click **"➕ Add New Link"**
4. Fill out:
   - **Title**: e.g., "Support Ihya"
   - **Subtitle**: e.g., "Help us continue building community"
   - **URL**: Full link (https://...)
   - **Icon**: Single emoji (🤲, 📅, 📱, etc.)
   - **Display Order**: 1, 2, 3... (lower = shows first)
   - **Featured**: Check to highlight in green
   - **Enable**: Uncheck to hide temporarily
5. Click **"Save Link"**
6. Done! View at `ihyanyc.org/links`

### Editing a Link:

1. Find the link in your list
2. Click **"✏️ Edit"**
3. Make changes
4. Click **"Save Link"**

### Reordering Links:

1. Find the link you want to move
2. Click **"✏️ Edit"**
3. Change **"Display Order"** number
4. Lower numbers appear first (1 = top, 2 = second, etc.)
5. Click **"Save Link"**

### Disabling a Link Temporarily:

1. Click **"✏️ Edit"** on the link
2. Uncheck **"Enable this link"**
3. Click **"Save Link"**
4. Link disappears from `/links` but stays in admin

---

## 🔗 Auto-RSVP Feature

When you add an event with an RSVP link in the Events section:

1. Go to **"📅 Events"** tab
2. Click **"➕ Add New Event"**
3. Fill out event details
4. **Important:** Add URL in **"Registration/RSVP Link"** field
5. Click **"Publish Event"**

**Result:** 
- RSVP link automatically appears at the TOP of your `/links` page
- Shows as featured (green background)
- Title: "RSVP: [Event Name]"
- Subtitle: Auto-generated from event details

---

## 📊 Click Tracking

Every link automatically tracks clicks!

**View Stats:**
1. Login to admin
2. Click **"🔗 Links"** tab
3. See **"Total Clicks"** at top
4. Each link shows its own click count

**How it works:**
- When someone clicks a link on `/links`, we track it
- Updates `data/links.json` in GitHub
- No user data collected, just click counts

---

## 🎨 Customization Options

### Changing Social Media Links:

Edit `links.html` line 71-105 (the social icons section).  
Current links are hardcoded to your accounts.

### Changing Colors:

Edit CSS variables in `links.html` line 18-25:
```css
--ihya-green: #1B5E41;
--ihya-gold: #B8A04A;
--ihya-cream: #F8F5F0;
```

### Adding More Link Types:

Just use the admin panel! You can add unlimited links.

---

## 🐛 Troubleshooting

### Problem: Links page shows "Loading links..." forever

**Fix:**
1. Check if `data/links.json` exists in GitHub
2. Check Netlify deploy logs for errors
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Problem: Admin panel "🔗 Links" tab doesn't show

**Fix:**
1. Make sure you uploaded `admin-updated.html` as `admin.html`
2. Make sure `js/admin-links.js` is in the js/ folder
3. Make sure CSS file is loaded in admin.html `<head>`

### Problem: Clicking "Save Link" shows error

**Fix:**
1. Check Netlify Function logs
2. Verify `GITHUB_TOKEN` environment variable is set in Netlify
3. Check that `netlify/functions/manage-links.js` uploaded correctly

### Problem: Clicks aren't tracking

**Fix:**
- This is non-critical - if tracking fails, links still work
- Check Netlify Function logs for `track-click` function
- Verify `netlify/functions/track-click.js` uploaded correctly

---

## 📱 Mobile Optimization

The `/links` page is built **mobile-first**:
- ✅ Large tap targets (easy to click)
- ✅ Readable text sizes
- ✅ Fast loading
- ✅ Works offline (service worker ready)

Test on your phone:
1. Open `ihyanyc.org/links` on mobile
2. Should look perfect (like linkin.bio)
3. Social icons should be easy to tap
4. Link buttons should be finger-friendly

---

## 💰 Cost Savings

**Before:** linkin.bio ~$5-10/month  
**After:** $0/month (free on Netlify)

**Annual savings:** $60-120/year

---

## 🎯 What's Next?

### Immediate Next Steps:
1. Upload all files to GitHub
2. Test admin panel
3. Update Instagram bio
4. Cancel linkin.bio subscription

### Optional Enhancements Later:
- Custom QR code for `/links`
- Link scheduling (show/hide by date)
- Advanced analytics dashboard
- Link categories/grouping

---

## 📞 Need Help?

If you get stuck:
1. Check Netlify deploy logs
2. Check browser Console (F12) for errors
3. Verify all files uploaded to correct locations
4. Try in Incognito window (clears cache)

---

## ✨ You're All Set!

Once uploaded:
- ✅ Custom link page: `ihyanyc.org/links`
- ✅ Admin management: `ihyanyc.org/admin` → Links tab
- ✅ Click tracking: Built-in
- ✅ Auto-RSVP: Works with events
- ✅ Mobile optimized: Ready to use

**Update your Instagram bio and enjoy!** 🚀
