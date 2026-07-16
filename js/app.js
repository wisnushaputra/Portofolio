// Main Application Logic - Wisnu Portfolio

const GITHUB_USERNAME = 'wisnushaputra';
const FALLBACK_DATA_PATH = 'data/github-data.json';

// Global state variables
let userData = null;
let repositories = [];
let activeFilter = 'all';
let searchQuery = '';

// DOM Elements
const elements = {
  userName: document.getElementById('user-name'),
  userBio: document.getElementById('user-bio'),
  userLogin: document.getElementById('user-login'),
  userLocation: document.getElementById('user-location'),
  userAvatar: document.getElementById('user-avatar'),
  userGithubLink: document.getElementById('user-github-link'),
  userBlogLink: document.getElementById('user-blog-link'),
  
  statsContainer: document.getElementById('github-stats-container'),
  languagesChart: document.getElementById('languages-chart'),
  filterTags: document.getElementById('filter-tags'),
  reposGrid: document.getElementById('repos-grid'),
  
  searchInput: document.getElementById('search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  
  themeToggleBtn: document.getElementById('theme-toggle'),
  mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
  navMenu: document.getElementById('nav-menu'),
  header: document.getElementById('main-header'),
  
  contactForm: document.getElementById('contact-form')
};

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && !systemPrefersDark)) {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  if (isLight) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}

// Mobile navigation menu toggle
function toggleMobileMenu() {
  elements.navMenu.classList.toggle('mobile-active');
  const icon = elements.mobileMenuToggle.querySelector('i');
  if (elements.navMenu.classList.contains('mobile-active')) {
    icon.setAttribute('data-lucide', 'x');
  } else {
    icon.setAttribute('data-lucide', 'menu');
  }
  lucide.createIcons();
}

// Close mobile menu when clicking nav link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    elements.navMenu.classList.remove('mobile-active');
    const icon = elements.mobileMenuToggle.querySelector('i');
    icon.setAttribute('data-lucide', 'menu');
    lucide.createIcons();
    
    // Set active link visually immediately
    document.querySelectorAll('.nav-link').forEach(nl => nl.classList.remove('active'));
    link.classList.add('active');
  });
});

// Scroll Effects (Header shadow, navbar active state tracking)
function handleScroll() {
  // Header scrolled state
  if (window.scrollY > 50) {
    elements.header.classList.add('scrolled');
  } else {
    elements.header.classList.remove('scrolled');
  }

  // Active section tracking
  const sections = document.querySelectorAll('section, header');
  const scrollPosition = window.scrollY + 100;

  sections.forEach(section => {
    if (section.id) {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${section.id}`) {
            link.classList.add('active');
          }
        });
      }
    }
  });
}

// Fetch GitHub data with failover cache mechanism
async function loadData() {
  try {
    console.log('Attempting to fetch dynamic live data from GitHub API...');
    const userResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`);
    
    if (userResponse.status === 403 || userResponse.status === 429) {
      throw new Error('API Rate Limit exceeded. Triggering local backup cache load.');
    }
    if (!userResponse.ok) {
      throw new Error(`Profile fetch failed: ${userResponse.status}`);
    }
    
    const userProfile = await userResponse.json();
    
    const reposResponse = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
    if (!reposResponse.ok) {
      throw new Error(`Repositories fetch failed: ${reposResponse.status}`);
    }
    
    const repos = await reposResponse.json();
    
    userData = {
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
    };
    
    repositories = repos.map(repo => ({
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
    }));
    
    console.log('Live GitHub API data loaded successfully!');
    renderAll();
    
  } catch (error) {
    console.warn(error.message);
    console.log('Falling back to local cached JSON data...');
    loadFallbackData();
  }
}

async function loadFallbackData() {
  try {
    const response = await fetch(FALLBACK_DATA_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load backup data: ${response.status}`);
    }
    const data = await response.json();
    userData = data.user;
    repositories = data.repos;
    console.log(`Fallback JSON data loaded successfully (cached on ${data.fetchedAt || 'unknown'}).`);
    renderAll();
  } catch (err) {
    console.error('Critical Error: Failed to load backup cache data.', err);
    showErrorPage();
  }
}

// Render dynamic content components
function renderAll() {
  renderProfile();
  renderStats();
  renderTopLanguages();
  renderFilterTags();
  renderRepositories();
  lucide.createIcons();
}

function renderProfile() {
  if (!userData) return;
  
  elements.userName.textContent = userData.name;
  elements.userBio.textContent = userData.bio;
  elements.userLogin.textContent = `@${userData.login}`;
  
  if (userData.location) {
    elements.userLocation.innerHTML = `<i data-lucide="map-pin"></i> ${userData.location}`;
  } else {
    elements.userLocation.innerHTML = '';
  }
  
  elements.userAvatar.src = userData.avatar_url;
  elements.userGithubLink.href = userData.html_url;
  
  if (userData.blog) {
    let blogUrl = userData.blog;
    if (!blogUrl.startsWith('http://') && !blogUrl.startsWith('https://')) {
      blogUrl = 'https://' + blogUrl;
    }
    elements.userBlogLink.href = blogUrl;
    elements.userBlogLink.classList.remove('hidden');
  } else {
    elements.userBlogLink.classList.add('hidden');
  }
}

function renderStats() {
  if (!userData) return;
  
  elements.statsContainer.innerHTML = `
    <div class="stat-card card">
      <div class="stat-value">${userData.public_repos}</div>
      <div class="stat-label">Repositories</div>
    </div>
    <div class="stat-card card">
      <div class="stat-value">${userData.followers}</div>
      <div class="stat-label">Followers</div>
    </div>
    <div class="stat-card card">
      <div class="stat-value">${userData.following}</div>
      <div class="stat-label">Following</div>
    </div>
  `;
}

// Language color mapping for visual aesthetic matches
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  PHP: '#4f5d95',
  C: '#555555',
  'C++': '#f34b7d',
  Dart: '#00b4ab',
  Python: '#3572A5',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Java: '#b07219',
  Shell: '#89e051',
  default: '#8b949e'
};

function getLanguageColor(lang) {
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default;
}

function renderTopLanguages() {
  if (repositories.length === 0) {
    elements.languagesChart.innerHTML = '<p>No repositories available for language evaluation.</p>';
    return;
  }

  // Count instances of languages (skip nulls)
  const counts = {};
  let totalCount = 0;
  
  repositories.forEach(repo => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
      totalCount++;
    }
  });

  if (totalCount === 0) {
    elements.languagesChart.innerHTML = '<p>No programming language details detected.</p>';
    return;
  }

  // Sort languages by repository counts
  const sortedLangs = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // display top 5 languages

  elements.languagesChart.innerHTML = sortedLangs.map(([lang, count]) => {
    const percentage = Math.round((count / totalCount) * 100);
    const color = getLanguageColor(lang);
    return `
      <div class="lang-bar-wrapper">
        <div class="lang-header">
          <div class="lang-name-container">
            <span class="lang-dot" style="background-color: ${color}"></span>
            <span class="lang-name">${lang}</span>
          </div>
          <span class="lang-percentage">${percentage}%</span>
        </div>
        <div class="lang-progress-bg">
          <div class="lang-progress-bar" style="width: ${percentage}%; background-color: ${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFilterTags() {
  const languages = new Set();
  
  repositories.forEach(repo => {
    if (repo.language) {
      languages.add(repo.language);
    }
  });

  // Sort languages alphabetically
  const sortedLanguages = Array.from(languages).sort();
  
  let tagsHTML = `<button class="filter-tag ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>`;
  
  sortedLanguages.forEach(lang => {
    tagsHTML += `<button class="filter-tag ${activeFilter === lang ? 'active' : ''}" data-filter="${lang}">${lang}</button>`;
  });
  
  elements.filterTags.innerHTML = tagsHTML;
  
  // Set up event listeners for dynamically rendered filter buttons
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      activeFilter = tag.getAttribute('data-filter');
      renderRepositories();
    });
  });
}

function renderRepositories() {
  // Filter repositories based on active filter and search text query
  const filteredRepos = repositories.filter(repo => {
    // 1. Language Filter
    const matchesLang = activeFilter === 'all' || repo.language === activeFilter;
    
    // 2. Search Box Query
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      repo.name.toLowerCase().includes(searchLower) || 
      (repo.description && repo.description.toLowerCase().includes(searchLower)) ||
      (repo.language && repo.language.toLowerCase().includes(searchLower));
      
    return matchesLang && matchesSearch;
  });

  if (filteredRepos.length === 0) {
    elements.reposGrid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <i data-lucide="folder-open" style="width: 3rem; height: 3rem; margin: 0 auto 1rem auto; color: var(--text-muted)"></i>
        <h3>No Repositories Found</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Try adjusting your search criteria or filter options.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  elements.reposGrid.innerHTML = filteredRepos.map(repo => {
    const lang = repo.language || 'Plain Text';
    const langColor = getLanguageColor(repo.language);
    const dateFormatted = new Date(repo.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Process topics
    const topicsHTML = repo.topics && repo.topics.length > 0
      ? `<div class="repo-topics">${repo.topics.slice(0, 3).map(topic => `<span class="topic-tag">${topic}</span>`).join('')}</div>`
      : '';

    return `
      <article class="repo-card card">
        <div class="repo-header">
          <i data-lucide="folder" class="repo-folder-icon"></i>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" aria-label="Github link for ${repo.name}">
            <i data-lucide="github" class="repo-github-icon"></i>
          </a>
        </div>
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-title-link">
          <h3>${repo.name}</h3>
        </a>
        <p class="repo-desc">${repo.description || 'No description provided for this repository.'}</p>
        ${topicsHTML}
        <div class="repo-footer">
          <div class="repo-meta-left">
            <span class="lang-dot" style="background-color: ${langColor}"></span>
            <span>${lang}</span>
          </div>
          <div class="repo-meta-right">
            <span class="repo-stat-item" title="Stars">
              <i data-lucide="star"></i>
              <span>${repo.stargazers_count}</span>
            </span>
            <span class="repo-stat-item" title="Forks">
              <i data-lucide="git-fork"></i>
              <span>${repo.forks_count}</span>
            </span>
          </div>
        </div>
      </article>
    `;
  }).join('');
  
  lucide.createIcons();
}

function showErrorPage() {
  elements.reposGrid.innerHTML = `
    <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
      <i data-lucide="alert-triangle" style="width: 3.5rem; height: 3.5rem; margin: 0 auto 1.5rem auto; color: var(--accent-3);"></i>
      <h2>Unable to Load Projects</h2>
      <p style="color: var(--text-secondary); max-width: 500px; margin: 0.5rem auto 1.5rem auto;">
        We had trouble connecting to the GitHub API, and the local backup cache could not be reached. Please check your connection.
      </p>
      <button onclick="window.location.reload();" class="btn btn-primary">Try Reloading Page</button>
    </div>
  `;
  
  // Clean up loaders
  elements.statsContainer.innerHTML = '';
  elements.languagesChart.innerHTML = '<p>Could not fetch language profiles.</p>';
  lucide.createIcons();
}

// Set up Search Box Event Listeners
function setupSearch() {
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    
    // Toggle clear button visibility
    if (searchQuery.length > 0) {
      elements.searchClearBtn.classList.add('visible');
    } else {
      elements.searchClearBtn.classList.remove('visible');
    }
    
    renderRepositories();
  });
  
  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    searchQuery = '';
    elements.searchClearBtn.classList.remove('visible');
    renderRepositories();
  });
}

// Setup Contact Form Validation and Submission Simulation
function setupContactForm() {
  elements.contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const submitBtn = elements.contactForm.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    
    // Show sending state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span>Sending Message...</span>
      <div class="loading-spinner-small" style="width: 1rem; height: 1rem; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s infinite linear; display: inline-block;"></div>
    `;
    
    // Simulate delay
    setTimeout(() => {
      // Create inline Toast/Success Alert
      const alertContainer = document.createElement('div');
      alertContainer.className = 'card alert-success';
      alertContainer.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #10b981;
        color: white;
        padding: 1.25rem 2rem;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: none;
      `;
      alertContainer.innerHTML = `
        <i data-lucide="check-circle" style="width: 1.5rem; height: 1.5rem;"></i>
        <div>
          <h4 style="font-weight: 700; font-size: 1rem;">Message Sent Successfully!</h4>
          <p style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.15rem;">Thank you, Wisnu will get back to you shortly.</p>
        </div>
      `;
      document.body.appendChild(alertContainer);
      lucide.createIcons();
      
      // Inject animations in document style dynamically for custom toast and contact send spinner
      const style = document.createElement('style');
      style.innerHTML = `
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(100px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      `;
      document.head.appendChild(style);
      
      // Clear form
      elements.contactForm.reset();
      
      // Restore button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;
      
      // Fade out toast after 4 seconds
      setTimeout(() => {
        alertContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        alertContainer.style.opacity = '0';
        alertContainer.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => alertContainer.remove(), 500);
      }, 4000);
      
    }, 1500);
  });
}

// Initial initialization on load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupSearch();
  setupContactForm();
  
  // Theme Toggle listener
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Mobile Menu listener
  elements.mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  
  // Window scroll listener
  window.addEventListener('scroll', handleScroll);
  
  // Load GitHub data
  loadData();
});
