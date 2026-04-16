// Netlify Function to Track Link Clicks
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
    const { linkId } = JSON.parse(event.body);
    
    if (!linkId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing linkId' })
      };
    }

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
        throw new Error('Links file not found');
      }
    }

    // Update links.json file
    async function updateLinksFile(linksData, sha) {
      const content = JSON.stringify(linksData, null, 2);
      const base64Content = Buffer.from(content).toString('base64');
      
      const data = {
        message: 'Update link click count',
        content: base64Content,
        branch: GITHUB_BRANCH,
        sha: sha
      };
      
      return await githubRequest('contents/data/links.json', 'PUT', data);
    }

    // Get current links data
    const { content: linksData, sha } = await getLinksFile();

    // Find and update the link
    const linkIndex = linksData.links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) {
      // Link not found, but don't fail the request
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Link not found, tracking skipped' })
      };
    }

    // Increment click count
    linksData.links[linkIndex].clicks = (linksData.links[linkIndex].clicks || 0) + 1;
    linksData.lastUpdated = new Date().toISOString();

    // Update file in GitHub
    await updateLinksFile(linksData, sha);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        clicks: linksData.links[linkIndex].clicks
      })
    };

  } catch (error) {
    console.error('Error tracking click:', error);
    // Don't fail - just log the error and return success
    // This prevents click tracking from blocking navigation
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'Click tracked locally (GitHub update failed)'
      })
    };
  }
};
