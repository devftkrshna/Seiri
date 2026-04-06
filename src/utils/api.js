// GitHub & LeetCode public API integrations

const GITHUB_API = 'https://api.github.com';
const GITHUB_CONTRIB_API = 'https://github-contributions-api.jogruber.de/v4';
const LEETCODE_API = 'https://alfa-leetcode-api.onrender.com';

export async function fetchGitHubProfile(username) {
  const res = await fetch(`${GITHUB_API}/users/${username}`);
  if (!res.ok) throw new Error(`GitHub user "${username}" not found`);
  const data = await res.json();
  return {
    login: data.login,
    name: data.name,
    avatar: data.avatar_url,
    bio: data.bio,
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
    profileUrl: data.html_url,
    createdAt: data.created_at,
  };
}

export async function fetchAuthenticatedGitHubUser(token) {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      'Authorization': `token ${token}`
    }
  });
  if (!res.ok) throw new Error('Invalid token or failed to fetch user');
  const data = await res.json();
  return {
    login: data.login,
    name: data.name,
    avatar: data.avatar_url,
    bio: data.bio,
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
    profileUrl: data.html_url,
    createdAt: data.created_at,
  };
}



export async function fetchGitHubContributions(username, token = null) {
  if (token) {
    const query = `
      query($userName:String!) {
        user(login: $userName){
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `;
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables: { userName: username } })
    });
    
    if (res.ok) {
      const result = await res.json();
      if (!result.errors && result.data?.user) {
        const calendar = result.data.user.contributionsCollection.contributionCalendar;
        const contributions = [];
        calendar.weeks.forEach(week => {
          week.contributionDays.forEach(day => {
            contributions.push({
              date: day.date,
              count: day.contributionCount
            });
          });
        });
        return {
          total: calendar.totalContributions,
          contributions
        };
      }
    }
    // If GraphQL fails, fallback to public API
  }

  const res = await fetch(`${GITHUB_CONTRIB_API}/${username}?y=last`);
  if (!res.ok) throw new Error('Failed to fetch GitHub contributions');
  const data = await res.json();
  return {
    total: data.total?.lastYear || 0,
    contributions: (data.contributions || []).map(c => ({
      date: c.date,
      count: c.count,
      level: c.level, // 0-4
    })),
  };
}
export async function fetchLeetCodeProfile(username) {
  const res = await fetch(`${LEETCODE_API}/userProfile/${username}`);
  if (!res.ok) throw new Error(`LeetCode user "${username}" not found`);
  const data = await res.json();
  return {
    totalSolved: data.totalSolved || 0,
    totalQuestions: data.totalQuestions || 0,
    easySolved: data.easySolved || 0,
    totalEasy: data.totalEasy || 0,
    mediumSolved: data.mediumSolved || 0,
    totalMedium: data.totalMedium || 0,
    hardSolved: data.hardSolved || 0,
    totalHard: data.totalHard || 0,
    ranking: data.ranking || 0,
    reputation: data.reputation || 0,
    contributionPoints: data.contributionPoint || 0,
    submissionCalendar: (() => {
      if (!data.submissionCalendar) return {};
      if (typeof data.submissionCalendar === 'object') return data.submissionCalendar;
      try { return JSON.parse(data.submissionCalendar); } catch { return {}; }
    })(),
  };
}

export async function fetchLeetCodeContest(username) {
  try {
    const res = await fetch(`${LEETCODE_API}/${username}/contest`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      contestRating: Math.round(data.contestRating || 0),
      contestGlobalRanking: data.contestGlobalRanking || 0,
      contestAttend: data.contestAttend || 0,
      contestTopPercentage: data.contestTopPercentage || 0,
    };
  } catch {
    return null;
  }
}
