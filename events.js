/*
 * ============================================
 *  IHYA NYC - EVENTS CONFIGURATION
 * ============================================
 *  
 *  ADMINS: This is the ONLY file you need to edit to update events!
 *  
 *  HOW TO UPDATE EVENTS:
 *  --------------------------------------------
 *  1. Upload your flyer image to the /flyers folder
 *     - Name it something clear like: dec-28-reflection.jpg
 *     - Supported formats: .jpg, .png, .webp
 *  
 *  2. Edit the events array below
 *     - Copy an existing event block as a template
 *     - Update the details
 *     - Delete old events that have passed
 *  
 *  3. Commit and push your changes
 *     - The website will automatically update!
 *  
 *  TIPS:
 *  - Keep 2-4 upcoming events visible at a time
 *  - Weekly recurring events should stay at the top
 *  - Delete events after they've passed
 *  
 * ============================================
 */

const IHYA_EVENTS = [
  
  // ──────────────────────────────────────────
  // WEEKLY RECURRING EVENT
  // ──────────────────────────────────────────
  {
    id: "weekly-halaqah",
    type: "weekly",                           // "weekly" or "monthly"
    title: "Brothers' Weekly Halaqah",
    description: " ",
    
    // Date display on flyer placeholder (if no flyer image)
    dateDisplay: "Every",
    monthDisplay: "Thursday",
    
    // Event details (these appear below the flyer - users can copy/paste)
    datetime: "Every Thursday, 7:30 PM - 9:00 PM",
    location: "Masjid Baitul Mukarram 22-21 33rd St, Astoria, NY 11105",
    
    // Flyer image - set to null to use placeholder, or add filename
    // Example: "weekly-halaqah.jpg" (file must be in /flyers folder)
    flyer: "null to use placeholder"
  },
  // ──────────────────────────────────────────
  // UPCOMING MONTHLY EVENT #1
  // ──────────────────────────────────────────
  {
    id: "Ihya Quran Night",
    type: "monthly",
    title: "Dua The Essence of Worship",
    description: "Anas ibn Malik reported that the Prophet ﷺ said, “Dua (supplication) is the essence of worship.” (Sunan al-Tirmidhi) As we head into Ramadan, we strive to maximize all of our acts of worship—salah, sawm, zakat—but one act that is often overlooked is dua, one of the greatest ways to draw nearer to Allah and strengthen our connection with our Creator. Join us with our beloved speaker, Shaykh Ismail Bowers, as we learn how to perfect the etiquette of dua and strengthen our connection with The One we ask from. 🤲✨",
    
    dateDisplay: "16",
    monthDisplay: "February",
    
    datetime: "Sunday, February 16, 2026 | 5:30 PM",
    location: "Masjid Al-Hikmah 48-01 31st Ave, Astoria, NY 11103",
    
    // To add a flyer:
    // 1. Upload image to /flyers folder (e.g., "dec-28-reflection.jpg")
    // 2. Change null to the filename: "dec-28-reflection.jpg"
    flyer: "Dua The Essence of Worship.jpeg"
  },
/*
  // ──────────────────────────────────────────
  // UPCOMING MONTHLY EVENT #2
  // ──────────────────────────────────────────
  {
    id: "jan-kickoff",
    type: "monthly",
    title: "New Year Kickoff Gathering",
    description: "Start 2025 with purpose. Join us for an evening of goal-setting, spiritual renewal, and meaningful conversations with the brothers.",
    
    dateDisplay: "11",
    monthDisplay: "January",
    
    datetime: "Saturday, January 11, 2025 | 5:00 PM - 8:00 PM",
    location: "789 Event Space, Manhattan, NY 10016",
    
    flyer: "dec-28-reflection.jpg"
  },
*/
  // ──────────────────────────────────────────
  // ADD NEW EVENTS BELOW (copy this template)
  // ──────────────────────────────────────────
  /*
  {
    id: "unique-event-id",
    type: "monthly",
    title: "Event Title Here",
    description: "Event description goes here. Keep it to 1-2 sentences.",
    
    dateDisplay: "15",
    monthDisplay: "February",
    
    datetime: "Saturday, February 15, 2025 | 6:00 PM - 9:00 PM",
    location: "Full Address Here, City, State ZIP",
    
    flyer: "feb-15-event.jpg"  // or null for placeholder
  },
  */

];

// ============================================
//  DO NOT EDIT BELOW THIS LINE
// ============================================
if (typeof module !== 'undefined') {
  module.exports = IHYA_EVENTS;
}
