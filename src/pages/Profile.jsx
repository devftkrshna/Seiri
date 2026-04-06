import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Github, Code2, RefreshCw, ExternalLink, Trophy, Check, AlertCircle, Loader2, Key } from 'lucide-react';
import db from '../db';
import { fetchGitHubProfile, fetchGitHubContributions, fetchLeetCodeProfile, fetchLeetCodeContest, fetchAuthenticatedGitHubUser } from '../utils/api';

export default function Profile() {
  const [githubUser, setGithubUser] = useState('');
  const [leetcodeUser, setLeetcodeUser] = useState('');
  const [githubData, setGithubData] = useState(null);
  const [githubContribs, setGithubContribs] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [leetcodeContest, setLeetcodeContest] = useState(null);
  const [loading, setLoading] = useState({ github: false, leetcode: false });
  const [errors, setErrors] = useState({ github: null, leetcode: null });
  const [saved, setSaved] = useState({ github: false, leetcode: false });

  // GitHub Auth States
  const [githubAuthMethod, setGithubAuthMethod] = useState('username'); // 'username', 'token'
  const [githubToken, setGithubToken] = useState('');

  // Load saved settings on mount
  useEffect(() => {
    (async () => {
      const ghUser = await db.settings.get('github_username');
      const lcUser = await db.settings.get('leetcode_username');
      const ghData = await db.settings.get('github_data');
      const ghContrib = await db.settings.get('github_contributions');
      const lcData = await db.settings.get('leetcode_data');
      const lcContest = await db.settings.get('leetcode_contest');
      
      const ghAuthMethod = await db.settings.get('github_auth_method');
      const ghToken = await db.settings.get('github_token');
      
      if (ghUser?.value) setGithubUser(ghUser.value);
      if (lcUser?.value) setLeetcodeUser(lcUser.value);
      if (ghData?.value) setGithubData(ghData.value);
      if (ghContrib?.value) setGithubContribs(ghContrib.value);
      if (lcData?.value) setLeetcodeData(lcData.value);
      if (lcContest?.value) setLeetcodeContest(lcContest.value);
      
      if (ghAuthMethod?.value) setGithubAuthMethod(ghAuthMethod.value);
      if (ghToken?.value) {
        setGithubToken(ghToken.value);
      }
    })();
  }, []);

  const runGithubFetch = async (method, username, token) => {
    let profile;
    let usernameToUse = username;
    
    if (method === 'username') {
       if (!username.trim()) throw new Error('Username required');
       profile = await fetchGitHubProfile(username.trim());
    } else {
       if (!token || !token.trim()) throw new Error('Token required for this method');
       profile = await fetchAuthenticatedGitHubUser(token.trim());
       usernameToUse = profile.login;
       setGithubUser(usernameToUse);
    }
    
    const contribs = await fetchGitHubContributions(usernameToUse, token);
    
    setGithubData(profile);
    setGithubContribs(contribs);
    await db.settings.put({ key: 'github_auth_method', value: method });
    await db.settings.put({ key: 'github_username', value: usernameToUse });
    if (token) await db.settings.put({ key: 'github_token', value: token });
    await db.settings.put({ key: 'github_data', value: profile });
    await db.settings.put({ key: 'github_contributions', value: contribs });
    await db.settings.put({ key: 'github_last_fetched', value: new Date().toISOString() });
    setSaved(s => ({ ...s, github: true }));
    setTimeout(() => setSaved(s => ({ ...s, github: false })), 2000);
  };

  const handleGithubConnect = useCallback(async () => {
    setLoading(l => ({ ...l, github: true }));
    setErrors(e => ({ ...e, github: null }));
    try {
      await runGithubFetch(githubAuthMethod, githubUser, githubToken);
    } catch (err) {
      setErrors(e => ({ ...e, github: err.message }));
    }
    setLoading(l => ({ ...l, github: false }));
  }, [githubUser, githubToken, githubAuthMethod]);

  const handleLeetcodeConnect = useCallback(async () => {
    if (!leetcodeUser.trim()) return;
    setLoading(l => ({ ...l, leetcode: true }));
    setErrors(e => ({ ...e, leetcode: null }));
    try {
      const [profile, contest] = await Promise.all([
        fetchLeetCodeProfile(leetcodeUser.trim()),
        fetchLeetCodeContest(leetcodeUser.trim()),
      ]);
      setLeetcodeData(profile);
      setLeetcodeContest(contest);
      await db.settings.put({ key: 'leetcode_username', value: leetcodeUser.trim() });
      await db.settings.put({ key: 'leetcode_data', value: profile });
      await db.settings.put({ key: 'leetcode_contest', value: contest });
      await db.settings.put({ key: 'leetcode_last_fetched', value: new Date().toISOString() });
      setSaved(s => ({ ...s, leetcode: true }));
      setTimeout(() => setSaved(s => ({ ...s, leetcode: false })), 2000);
    } catch (err) {
      setErrors(e => ({ ...e, leetcode: err.message }));
    }
    setLoading(l => ({ ...l, leetcode: false }));
  }, [leetcodeUser]);

  // GitHub heatmap rendering (last 90 days)
  const renderGitHubHeatmap = () => {
    if (!githubContribs?.contributions?.length) return null;
    const last90 = githubContribs.contributions.slice(-90);
    const maxCount = Math.max(1, ...last90.map(c => c.count));
    return (
      <div>
        <div className="flex items-center justify-between mb-md">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contribution Heatmap — Last 90 Days</span>
          <span className="text-mono" style={{ fontSize: '0.8rem', color: 'var(--emerald)' }}>{githubContribs.total} total (last year)</span>
        </div>
        <div className="heatmap-grid">
          {last90.map((day, i) => (
            <div key={i} className="heatmap-cell" title={`${day.date}: ${day.count} contributions`}
              style={{
                background: day.count > 0 ? `rgba(16,185,129,${Math.max(0.15, day.count / maxCount)})` : 'var(--surface-2)',
                boxShadow: day.count / maxCount > 0.6 ? `0 0 6px rgba(16,185,129,${day.count / maxCount * 0.4})` : 'none'
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-sm" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <span>90 days ago</span>
          <div className="flex items-center gap-xs">
            <span>Less</span>
            {[0, 0.15, 0.35, 0.6, 0.85].map((o, i) => (
              <div key={i} className="heatmap-cell" style={{ width: 10, height: 10, background: o === 0 ? 'var(--surface-2)' : `rgba(16,185,129,${o})` }} />
            ))}
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </div>
    );
  };

  // LeetCode progress ring
  const renderProgressRing = (solved, total, color, label) => {
    const pct = total > 0 ? (solved / total) * 100 : 0;
    const r = 28;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return (
      <div className="lc-ring-item">
        <svg width="70" height="70" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
          <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 35 35)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="lc-ring-center">
          <span className="text-mono" style={{ fontSize: '1rem', fontWeight: 700 }}>{solved}</span>
        </div>
        <div className="lc-ring-label" style={{ color }}>{label}</div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><User size={28} /> Profile & Integrations</h1>
          <p className="page-subtitle">Connect your coding profiles to auto-track progress.</p>
        </div>
      </div>

      <div className="two-col">
        {/* ---- GitHub Section ---- */}
        <div className="flex flex-col gap-lg">
          <div className="glass-card no-hover">
            <div className="profile-section-header">
              <div className="flex items-center gap-sm">
                <Github size={22} />
                <h3 style={{ fontWeight: 700 }}>GitHub</h3>
              </div>
              {githubData && (
                <a href={githubData.profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} /> View Profile
                </a>
              )}
            </div>

            <div className="auth-method-tabs flex items-center gap-xs mb-md" style={{ background: 'var(--surface-2)', padding: '4px', borderRadius: '8px' }}>
              <button 
                className={`btn btn-sm ${githubAuthMethod === 'username' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1, border: 'none' }}
                onClick={() => setGithubAuthMethod('username')}>
                <User size={14} /> Username
              </button>
              <button 
                className={`btn btn-sm ${githubAuthMethod === 'token' ? 'btn-primary' : 'btn-ghost'}`} 
                style={{ flex: 1, border: 'none' }}
                onClick={() => setGithubAuthMethod('token')}>
                <Key size={14} /> Token
              </button>
            </div>

            {githubAuthMethod === 'username' && (
              <div className="flex items-center gap-sm mb-lg">
                <input className="input" placeholder="GitHub username (e.g. torvalds)" value={githubUser}
                  onChange={e => setGithubUser(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGithubConnect()} />
                <button className="btn btn-primary" onClick={handleGithubConnect} disabled={loading.github} style={{ minWidth: 100 }}>
                  {loading.github ? <Loader2 size={16} className="spin" /> : saved.github ? <><Check size={16} /> Saved</> : <><RefreshCw size={16} /> Sync</>}
                </button>
              </div>
            )}

            {githubAuthMethod === 'token' && (
              <div className="flex flex-col gap-sm mb-lg">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Use a Personal Access Token (PAT) for authenticated access.</p>
                <div className="flex items-center gap-sm">
                  <input className="input" type="password" placeholder="ghp_xxxxxxxxxxxx" value={githubToken}
                    onChange={e => setGithubToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGithubConnect()} />
                  <button className="btn btn-primary" onClick={handleGithubConnect} disabled={loading.github} style={{ minWidth: 100 }}>
                    {loading.github ? <Loader2 size={16} className="spin" /> : saved.github ? <><Check size={16} /> Saved</> : <><RefreshCw size={16} /> Sync</>}
                  </button>
                </div>
              </div>
            )}

            {errors.github && (
              <div className="profile-error"><AlertCircle size={14} /> {errors.github}</div>
            )}

            {githubData && (
              <div className="github-profile-card">
                <img src={githubData.avatar} alt={githubData.login} className="github-avatar" />
                <div className="github-profile-info">
                  <div className="github-profile-name">{githubData.name || githubData.login}</div>
                  {githubData.bio && <div className="github-profile-bio">{githubData.bio}</div>}
                  <div className="github-profile-stats">
                    <span><strong>{githubData.publicRepos}</strong> repos</span>
                    <span><strong>{githubData.followers}</strong> followers</span>
                    <span><strong>{githubData.following}</strong> following</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GitHub Heatmap */}
          {githubContribs && (
            <div className="glass-card no-hover">
              {renderGitHubHeatmap()}
            </div>
          )}
        </div>

        {/* ---- LeetCode Section ---- */}
        <div className="flex flex-col gap-lg">
          <div className="glass-card no-hover">
            <div className="profile-section-header">
              <div className="flex items-center gap-sm">
                <Code2 size={22} />
                <h3 style={{ fontWeight: 700 }}>LeetCode</h3>
              </div>
              {leetcodeUser && (
                <a href={`https://leetcode.com/u/${leetcodeUser}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} /> View Profile
                </a>
              )}
            </div>

            <div className="flex items-center gap-sm mb-lg">
              <input className="input" placeholder="LeetCode username" value={leetcodeUser}
                onChange={e => setLeetcodeUser(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLeetcodeConnect()} />
              <button className="btn btn-primary" onClick={handleLeetcodeConnect} disabled={loading.leetcode} style={{ minWidth: 100 }}>
                {loading.leetcode ? <Loader2 size={16} className="spin" /> : saved.leetcode ? <><Check size={16} /> Saved</> : <><RefreshCw size={16} /> Sync</>}
              </button>
            </div>

            {errors.leetcode && (
              <div className="profile-error"><AlertCircle size={14} /> {errors.leetcode}</div>
            )}

            {leetcodeData && (
              <>
                {/* Solved Rings */}
                <div className="lc-rings-row">
                  {renderProgressRing(leetcodeData.totalSolved, leetcodeData.totalQuestions, 'var(--accent)', 'All')}
                  {renderProgressRing(leetcodeData.easySolved, leetcodeData.totalEasy, '#10b981', 'Easy')}
                  {renderProgressRing(leetcodeData.mediumSolved, leetcodeData.totalMedium, '#f59e0b', 'Medium')}
                  {renderProgressRing(leetcodeData.hardSolved, leetcodeData.totalHard, '#f43f5e', 'Hard')}
                </div>

                {/* Stats strip */}
                <div className="lc-stats-strip">
                  <div className="lc-stat">
                    <div className="lc-stat-value">{leetcodeData.totalSolved}</div>
                    <div className="lc-stat-label">Solved</div>
                  </div>
                  <div className="lc-stat">
                    <div className="lc-stat-value">{leetcodeData.ranking?.toLocaleString()}</div>
                    <div className="lc-stat-label">Ranking</div>
                  </div>
                  <div className="lc-stat">
                    <div className="lc-stat-value">{leetcodeData.contributionPoints}</div>
                    <div className="lc-stat-label">Contribution</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contest Rating */}
          {leetcodeContest && (
            <div className="glass-card no-hover">
              <div className="flex items-center gap-sm mb-md">
                <Trophy size={18} style={{ color: 'var(--amber)' }} />
                <h4 style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Contest Rating</h4>
              </div>
              <div className="lc-stats-strip">
                <div className="lc-stat">
                  <div className="lc-stat-value" style={{ color: 'var(--amber)' }}>{leetcodeContest.contestRating}</div>
                  <div className="lc-stat-label">Rating</div>
                </div>
                <div className="lc-stat">
                  <div className="lc-stat-value">{leetcodeContest.contestGlobalRanking?.toLocaleString()}</div>
                  <div className="lc-stat-label">Global Rank</div>
                </div>
                <div className="lc-stat">
                  <div className="lc-stat-value">{leetcodeContest.contestAttend}</div>
                  <div className="lc-stat-label">Attended</div>
                </div>
                <div className="lc-stat">
                  <div className="lc-stat-value">{leetcodeContest.contestTopPercentage?.toFixed(1)}%</div>
                  <div className="lc-stat-label">Top %</div>
                </div>
              </div>
            </div>
          )}

          {/* LeetCode Submission Heatmap */}
          {leetcodeData?.submissionCalendar && Object.keys(leetcodeData.submissionCalendar).length > 0 && (
            <div className="glass-card no-hover">
              <div className="flex items-center justify-between mb-md">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Submission Heatmap — Last 90 Days</span>
              </div>
              <div className="heatmap-grid">
                {Array.from({ length: 90 }).map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (89 - i)); d.setHours(0, 0, 0, 0);
                  const ts = Math.floor(d.getTime() / 1000);
                  const count = leetcodeData.submissionCalendar[ts] || 0;
                  const max = Math.max(1, ...Object.values(leetcodeData.submissionCalendar).slice(-90));
                  const intensity = count > 0 ? Math.max(0.15, count / max) : 0;
                  return (
                    <div key={i} className="heatmap-cell"
                      title={`${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count} submissions`}
                      style={{
                        background: count > 0 ? `rgba(245,158,11,${intensity})` : 'var(--surface-2)',
                        boxShadow: intensity > 0.6 ? `0 0 6px rgba(245,158,11,${intensity * 0.4})` : 'none'
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-sm" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                <span>90 days ago</span>
                <div className="flex items-center gap-xs">
                  <span>Less</span>
                  {[0, 0.15, 0.35, 0.6, 0.85].map((o, i) => (
                    <div key={i} className="heatmap-cell" style={{ width: 10, height: 10, background: o === 0 ? 'var(--surface-2)' : `rgba(245,158,11,${o})` }} />
                  ))}
                  <span>More</span>
                </div>
                <span>Today</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
