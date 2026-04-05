import Dexie from 'dexie';

export const db = new Dexie('DevDashDB');

db.version(1).stores({
  contents: '++id, type, url, title, tags, isFavorite, createdAt',
  jobs: '++id, company, role, status, appliedAt, updatedAt',
  problems: '++id, number, title, difficulty, *topics, status, solvedAt',
  contests: '++id, name, date',
  pomodoros: '++id, taskId, duration, type, completedAt',
  tasks: '++id, title, category, priority, completed, dueDate, createdAt',
  gateTopics: '++id, subject, name, status',
  gateScores: '++id, testName, score, maxScore, date',
  settings: 'key'
});

db.version(2).stores({
  formulas: '++id, title, category, createdAt',
  snippets: '++id, title, category, createdAt',
  habits: '++id, name, category, order',
  habitLogs: '++id, habitId, date, completed',
  quickLinks: '++id, name, url, order',
});

// v3: revision counts, problems solved, attachments
db.version(3).stores({}).upgrade(tx => {
  // Add revisionCount to existing problems
  tx.table('problems').toCollection().modify(p => {
    if (p.revisionCount === undefined) p.revisionCount = 0;
    if (p.lastRevised === undefined) p.lastRevised = null;
  });
  // Add revisionCount and problemsSolved to GATE topics
  tx.table('gateTopics').toCollection().modify(t => {
    if (t.revisionCount === undefined) t.revisionCount = 0;
    if (t.problemsSolved === undefined) t.problemsSolved = 0;
  });
});

export async function seedGateTopics() {
  const count = await db.gateTopics.count();
  if (count === 136) return;

  const existingTopics = await db.gateTopics.toArray();
  const existingMap = new Map();
  existingTopics.forEach(t => existingMap.set(t.name, t));

  const subjects = {
    'Engineering Mathematics': [
      'Propositional logic', 'First order logic', 'Sets', 'Relations', 'Functions',
      'Partial orders and lattices', 'Monoids', 'Groups', 'Graphs: Connectivity',
      'Graphs: Matching', 'Graphs: Colouring', 'Combinatorics: Counting',
      'Combinatorics: Recurrence relations', 'Combinatorics: Generating functions',
      'Linear Algebra: Matrices', 'Linear Algebra: Determinants', 'Linear Algebra: System of linear equations',
      'Linear Algebra: Eigenvalues and eigenvectors', 'Linear Algebra: LU decomposition',
      'Calculus: Limits', 'Calculus: Continuity and differentiability', 'Calculus: Maxima and minima',
      'Calculus: Mean value theorem', 'Calculus: Integration', 'Probability: Random variables',
      'Probability: Uniform distribution', 'Probability: Normal distribution', 'Probability: Exponential distribution',
      'Probability: Poisson distribution', 'Probability: Binomial distributions', 'Probability: Mean, median, mode',
      'Probability: Standard deviation', 'Probability: Conditional probability', 'Probability: Bayes theorem'
    ],
    'Digital Logic': [
      'Boolean algebra', 'Combinational circuits', 'Sequential circuits',
      'Minimization', 'Number representations', 'Computer arithmetic (fixed point)',
      'Computer arithmetic (floating point)'
    ],
    'Computer Organization and Architecture': [
      'Machine instructions and addressing modes', 'ALU, data-path and control unit',
      'Instruction pipelining', 'Pipeline hazards', 'Memory hierarchy: cache',
      'Memory hierarchy: main memory', 'Memory hierarchy: secondary storage',
      'I/O interface (interrupt mode)', 'I/O interface (DMA mode)'
    ],
    'Programming and Data Structures': [
      'Programming in C', 'Recursion', 'Arrays', 'Stacks', 'Queues',
      'Linked lists', 'Trees', 'Binary search trees', 'Binary heaps', 'Graphs'
    ],
    'Algorithms': [
      'Searching', 'Sorting', 'Hashing', 'Asymptotic worst case time and space complexity',
      'Algorithm design: Greedy', 'Algorithm design: Dynamic programming',
      'Algorithm design: Divide-and-conquer', 'Graph traversals', 'Minimum spanning trees',
      'Shortest paths'
    ],
    'Theory of Computation': [
      'Regular expressions', 'Finite automata', 'Context-free grammars', 'Push-down automata',
      'Regular languages', 'Context-free languages', 'Pumping lemma', 'Turing machines', 'Undecidability'
    ],
    'Compiler Design': [
      'Lexical analysis', 'Parsing', 'Syntax-directed translation', 'Runtime environments',
      'Intermediate code generation', 'Local optimization',
      'Data flow analyses: constant propagation', 'Data flow analyses: liveness analysis',
      'Data flow analyses: common sub expression elimination'
    ],
    'Operating System': [
      'System calls', 'Processes', 'Threads', 'Inter-process communication',
      'Concurrency and synchronization', 'Deadlock', 'CPU scheduling', 'I/O scheduling',
      'Memory management', 'Virtual memory', 'File systems'
    ],
    'Databases': [
      'ER-model', 'Relational model: relational algebra', 'Relational model: tuple calculus',
      'Relational model: SQL', 'Integrity constraints', 'Normal forms', 'File organization',
      'Indexing (B and B+ trees)', 'Transactions', 'Concurrency control'
    ],
    'Computer Networks': [
      'Concept of layering: OSI Protocol Stack', 'Concept of layering: TCP/IP Protocol Stack',
      'Basics of packet switching', 'Basics of circuit switching', 'Basics of virtual circuit-switching',
      'Data link layer: framing', 'Data link layer: error detection', 'Data link layer: Medium Access Control',
      'Data link layer: Ethernet bridging', 'Routing protocols: shortest path', 'Routing protocols: flooding',
      'Routing protocols: distance vector', 'Routing protocols: link state routing',
      'Fragmentation and IP addressing', 'IPv4', 'CIDR notation',
      'Basics of IP support protocols (ARP, DHCP, ICMP)', 'Network Address Translation (NAT)',
      'Transport layer: flow control and congestion control', 'UDP', 'TCP', 'Sockets',
      'Application layer protocols: DNS', 'Application layer protocols: SMTP',
      'Application layer protocols: HTTP', 'Application layer protocols: FTP', 'Application layer protocols: Email'
    ]
  };

  const topics = [];
  for (const [subject, topicNames] of Object.entries(subjects)) {
    for (const name of topicNames) {
      const existing = existingMap.get(name);
      topics.push({ 
        subject, 
        name, 
        status: existing?.status || 'not_started',
        completed: existing?.completed || false,
        revisionCount: existing?.revisionCount || 0,
        problemsSolved: existing?.problemsSolved || 0
      });
    }
  }
  
  await db.gateTopics.clear();
  await db.gateTopics.bulkAdd(topics);
}

export default db;
