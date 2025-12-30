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
    description: "Join us for our first halaqa of the new year! Our esteemed speaker Mufti Tofael Nuruddin will be joining us as we reflect on the lives and qualities of the Sahaba and righteous men who shaped this Ummah رَضِيَ اللَّهُ عَنْهُمْ",
    
    // Date display on flyer placeholder (if no flyer image)
    dateDisplay: "Every",
    monthDisplay: "Thursday",
    
    // Event details (these appear below the flyer - users can copy/paste)
    datetime: "Every Thursday, 7:30 PM - 9:00 PM",
    location: "Masjid Baitul Mukarram 22-21 33rd St, Astoria, NY 11105",
    
    // Flyer image - set to null to use placeholder, or add filename
    // Example: "weekly-halaqah.jpg" (file must be in /flyers folder)
    flyer: "Men of Character Following the Path of Pious Predecessors.JPG"
  },

  // ──────────────────────────────────────────
  // UPCOMING MONTHLY EVENT #1
  // ──────────────────────────────────────────
  {
    id: "dec-reflection",
    type: "monthly",
    title: "End of Year Reflection Night",
    description: "A special gathering to reflect on the year, share gratitudes, and set intentions for the months ahead. Light refreshments provided.",
    
    dateDisplay: "28",
    monthDisplay: "December",
    
    datetime: "Saturday, December 28, 2024 | 6:00 PM - 9:00 PM",
    location: "456 Main Hall, Brooklyn, NY 11201",
    
    // To add a flyer:
    // 1. Upload image to /flyers folder (e.g., "dec-28-reflection.jpg")
    // 2. Change null to the filename: "dec-28-reflection.jpg"
    flyer: null
  },

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
