// Netlify Function to Manage Links
// This runs on Netlify's servers (backend)

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
    const { action, linkData, linkId } = JSON.parse(event.body);
    
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

    // Get current links.json file
    async function getLinksFile() {
      try {
        const data = await githubRequest(`contents/data/links.json?ref=${GITHUB_BRANCH}`);
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return { content: JSON.parse(content), sha: data.sha };
      } catch (error) {
        // File doesn't exist yet, create empty structure
        return { content: { links: [], lastUpdated: null }, sha: null };
      }
    }

    // Update links.json file
    async function updateLinksFile(linksData, sha) {
      const content = JSON.stringify(linksData, null, 2);
      const base64Content = Buffer.from(content).toString('base64');
      
      const data = {
        message: 'Update links via admin panel',
        content: base64Content,
        branch: GITHUB_BRANCH
      };
      
      if (sha) {
        data.sha = sha;
      }
      
      return await githubRequest('contents/data/links.json', 'PUT', data);
    }

    // Get current links
    const { content: linksData, sha } = await getLinksFile();

    // Handle different actions
    if (action === 'add') {
      // Add new link
      linksData.links.push(linkData);
      linksData.links.sort((a, b) => (a.order || 999) - (b.order || 999));
      linksData.lastUpdated = new Date().toISOString();

      await updateLinksFile(linksData, sha);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Link added successfully',
          link: linkData
        })
      };

    } else if (action === 'update') {
      // Update link
      const index = linksData.links.findIndex(l => l.id === linkId);
      if (index === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link not found' })
        };
      }

      linksData.links[index] = linkData;
      linksData.links.sort((a, b) => (a.order || 999) - (b.order || 999));
      linksData.lastUpdated = new Date().toISOString();

      await updateLinksFile(linksData, sha);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Link updated successfully',
          link: linkData
        })
      };

    } else if (action === 'delete') {
      // Delete link
      const index = linksData.links.findIndex(l => l.id === linkId);
      if (index === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Link not found' })
        };
      }

      linksData.links.splice(index, 1);
      linksData.lastUpdated = new Date().toISOString();

      await updateLinksFile(linksData, sha);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Link deleted successfully'
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
