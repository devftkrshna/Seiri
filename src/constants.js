export const JOB_STATUSES = [
  { id: 'saved', label: 'Saved', color: 'ghost' },
  { id: 'applied', label: 'Applied', color: 'blue' },
  { id: 'oa', label: 'OA / Assignment', color: 'amber' },
  { id: 'interview', label: 'Interview', color: 'violet' },
  { id: 'offer', label: 'Offer', color: 'emerald' },
  { id: 'rejected', label: 'Rejected', color: 'rose' },
];

export const LEETCODE_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const LEETCODE_TOPICS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
  'Sorting', 'Greedy', 'Binary Search', 'Tree', 'Graph',
  'Stack', 'Queue', 'Linked List', 'Heap', 'Two Pointers',
  'Sliding Window', 'Backtracking', 'Bit Manipulation', 'Union Find',
  'Trie', 'Divide and Conquer', 'Recursion', 'Simulation',
];

export const CONTENT_TYPES = [
  { id: 'github', label: 'GitHub Repo', icon: 'Github', color: 'ghost' },
  { id: 'tweet', label: 'Tweet / Tip', icon: 'Twitter', color: 'blue' },
  { id: 'image', label: 'Image', icon: 'Image', color: 'pink' },
  { id: 'reel', label: 'Reel / Video', icon: 'Video', color: 'rose' },
  { id: 'note', label: 'Note', icon: 'FileText', color: 'amber' },
  { id: 'article', label: 'Article', icon: 'BookOpen', color: 'emerald' },
];

export const TASK_CATEGORIES = [
  { id: 'work', label: 'Work', color: 'blue' },
  { id: 'dsa', label: 'DSA', color: 'emerald' },
  { id: 'gate', label: 'GATE', color: 'violet' },
  { id: 'personal', label: 'Personal', color: 'amber' },
  { id: 'job_hunt', label: 'Job Hunt', color: 'cyan' },
];

export const TASK_PRIORITIES = [
  { id: 'p0', label: 'P0 Critical', color: 'rose' },
  { id: 'p1', label: 'P1 High', color: 'amber' },
  { id: 'p2', label: 'P2 Medium', color: 'blue' },
  { id: 'p3', label: 'P3 Low', color: 'ghost' },
];

export const POMODORO_MODES = [
  { id: 'work', label: 'Focus', duration: 25 * 60 },
  { id: 'short_break', label: 'Short Break', duration: 5 * 60 },
  { id: 'long_break', label: 'Long Break', duration: 15 * 60 },
];

// GATE 2027 date (typically first Sunday of February)
export const GATE_EXAM_DATE = new Date('2027-02-07T09:30:00+05:30');

export const QUOTES = [
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "It's not a bug — it's an undocumented feature.", author: "Anonymous" },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Consistency and hard work wins the race.", author: "Unknown" },
  { text: "Dream is not what you see in sleep, it's what doesn't let you sleep.", author: "APJ Abdul Kalam" },
  { text: "Truth can only be found in one place: the code.", author: "Robert C. Martin" },
  { text: "Always code as if the guy who ends up maintaining your code will be a violent psychopath who knows where you live.", author: "John Woods" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
  { text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.", author: "Dan Salomon" },
  { text: "We build our computer (systems) the way we build our cities: over time, without a plan, on top of ruins.", author: "Ellen Ullman" },
  { text: "Before software can be reusable it first has to be usable.", author: "Ralph Johnson" },
  { text: "Optimism is an occupational hazard of programming: feedback is the treatment.", author: "Kent Beck" },
  { text: "When to use iterative development? You should use iterative development only on projects that you want to succeed.", author: "Martin Fowler" },
  { text: "The best programs are written so that computing machines can perform them quickly and so that human beings can understand them clearly.", author: "Donald Knuth" },
  { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
  { text: "There is nothing more permanent than a temporary solution.", author: "Milton Friedman" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Code never lies, comments sometimes do.", author: "Ron Jeffries" },
  { text: "The function of good software is to make the complex appear to be simple.", author: "Grady Booch" },
  { text: "There are two ways to write error-free programs; only the third one works.", author: "Alan J. Perlis" },
  { text: "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.", author: "Antoine de Saint-Exupery" },
];

export const FORMULA_CATEGORIES = [
  'Mathematics', 'DSA', 'Operating Systems', 'DBMS', 'Computer Networks',
  'Compiler Design', 'TOC', 'Digital Logic', 'Computer Organization', 'General'
];

export const SNIPPET_CATEGORIES = [
  { id: 'system_design', label: 'System Design', color: 'violet' },
  { id: 'project_ideas', label: 'Project Ideas', color: 'emerald' },
  { id: 'code_snippet', label: 'Code Snippet', color: 'cyan' },
  { id: 'bash', label: 'Bash / CLI', color: 'amber' },
  { id: 'general', label: 'General', color: 'ghost' },
];

export const DEFAULT_HABITS = [
  { name: '1 LeetCode Problem', category: 'dsa', icon: '💻' },
  { name: 'Revise 1 GATE Subject', category: 'gate', icon: '📚' },
  { name: 'Apply to 2 Jobs', category: 'career', icon: '🎯' },
  { name: 'Read Tech Article', category: 'growth', icon: '📖' },
  { name: 'Drink 8 Glasses Water', category: 'health', icon: '💧' },
  { name: '30 min Exercise', category: 'health', icon: '🏋️' },
];

export const DEFAULT_QUICK_LINKS = [
  { name: 'LeetCode Daily', url: 'https://leetcode.com/problemset/', icon: '⚡' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'GFG GATE', url: 'https://www.geeksforgeeks.org/gate-cs-notes-gq/', icon: '📗' },
  { name: 'Striver SDE Sheet', url: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/', icon: '🔥' },
  { name: 'GATE Overflow', url: 'https://gateoverflow.in/', icon: '📘' },
  { name: 'YouTube', url: 'https://youtube.com', icon: '🎬' },
];

export const ZEN_MODE_PAGES = ['/pomodoro', '/todos'];
