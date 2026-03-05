// Netlify Function to Update Events
// This runs on Netlify's servers (backend), not in the browser

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, eventData, eventId, flyerData } = JSON.parse(event.body);
    
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = 'Tafvy';
    const GITHUB_REPO = 'IHYA-NYC';
    const GITHUB_BRANCH = 'main';

    // Helper function to make GitHub API requests
    async function githubRequest(endpoint, method = 'GET', data = null) {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${endpoint}`;
      
      const options = {
        method,
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      };
      
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'GitHub API request failed');
      }
      
      return response.json();
    }

    // Get current events.json file
    async function getEventsFile() {
      try {
        const data = await githubRequest(`contents/data/events.json?ref=${GITHUB_BRANCH}`);
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return { content: JSON.parse(content), sha: data.sha };
      } catch (error) {
        // File doesn't exist yet, create empty structure
        return { content: { events: [], lastUpdated: null }, sha: null };
      }
    }

    // Update events.json file
    async function updateEventsFile(eventsData, sha) {
      const content = JSON.stringify(eventsData, null, 2);
      const base64Content = Buffer.from(content).toString('base64');
      
      const data = {
        message: 'Update events via admin panel',
        content: base64Content,
        branch: GITHUB_BRANCH
      };
      
      if (sha) {
        data.sha = sha;
      }
      
      return await githubRequest('contents/data/events.json', 'PUT', data);
    }

    // Upload flyer if provided
    async function uploadFlyer(flyerPath, base64Data) {
      const data = {
        message: `Upload flyer: ${flyerPath}`,
        content: base64Data.split(',')[1], // Remove data:image/...;base64, prefix
        branch: GITHUB_BRANCH
      };
      
      return await githubRequest(`contents/${flyerPath}`, 'PUT', data);
    }

    // Get current events
    const { content: eventsData, sha } = await getEventsFile();

    // Handle different actions
    if (action === 'add') {
      // Upload flyer first if provided
      if (flyerData && eventData.flyer) {
        await uploadFlyer(eventData.flyer, flyerData);
      }

      // Add new event
      eventsData.events.push(eventData);
      eventsData.events.sort((a, b) => new Date(a.date) - new Date(b.date));
      eventsData.lastUpdated = new Date().toISOString();

      await updateEventsFile(eventsData, sha);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Event added successfully',
          event: eventData
        })
      };

    } else if (action === 'update') {
      // Upload flyer if new one provided
      if (flyerData && eventData.flyer) {
        await uploadFlyer(eventData.flyer, flyerData);
      }

      // Update event
      const index = eventsData.events.findIndex(e => e.id === eventId);
      if (index === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Event not found' })
        };
      }

      eventsData.events[index] = eventData;
      eventsData.events.sort((a, b) => new Date(a.date) - new Date(b.date));
      eventsData.lastUpdated = new Date().toISOString();

      await updateEventsFile(eventsData, sha);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Event updated successfully',
          event: eventData
        })
      };

    } else if (action === 'delete') {
      // Delete event
      const index = eventsData.events.findIndex(e => e.id === eventId);
      if (index === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Event not found' })
        };
      }

      eventsData.events.splice(index, 1);
      eventsData.lastUpdated = new Date().toISOString();

      await updateEventsFile(eventsData, sha);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Event deleted successfully'
        })
      };

    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action type' })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
