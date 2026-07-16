const fs = require('fs');
const path = require('path');
const https = require('https');

const USERNAME = 'wisnushaputra';
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'github-data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'NodeJS-Portfolio-Scraper-Client'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}. Status code: ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function scrape() {
  console.log(`Starting fetch for GitHub user: ${USERNAME}...`);
  try {
    const userProfile = await fetchUrl(`https://api.github.com/users/${USERNAME}`);
    console.log(`Successfully fetched user profile.`);

    console.log(`Fetching repositories...`);
    const repos = await fetchUrl(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
    console.log(`Successfully fetched ${repos.length} repositories.`);

    const outputData = {
      fetchedAt: new Date().toISOString(),
      user: {
        login: userProfile.login,
        name: userProfile.name || userProfile.login,
        avatar_url: userProfile.avatar_url,
        bio: userProfile.bio || 'Software Engineer / Developer',
        public_repos: userProfile.public_repos,
        followers: userProfile.followers,
        following: userProfile.following,
        html_url: userProfile.html_url,
        location: userProfile.location || 'Indonesia',
        blog: userProfile.blog || ''
      },
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updated_at: repo.updated_at,
        fork: repo.fork,
        topics: repo.topics || []
      }))
    };

    fs.writeFileSync(DATA_FILE, JSON.stringify(outputData, null, 2));
    console.log(`Successfully saved GitHub data to: ${DATA_FILE}`);
  } catch (error) {
    console.error('Error during scraping:', error.message);
    process.exit(1);
  }
}

scrape();
