import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContentCurator from './pages/ContentCurator';
import JobTracker from './pages/JobTracker';
import LeetCode from './pages/LeetCode';
import Pomodoro from './pages/Pomodoro';
import TodoList from './pages/TodoList';
import GatePrep from './pages/GatePrep';
import FormulaVault from './pages/FormulaVault';
import SnippetBoard from './pages/SnippetBoard';
import HabitTracker from './pages/HabitTracker';
import Profile from './pages/Profile';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/content" element={<ContentCurator />} />
          <Route path="/jobs" element={<JobTracker />} />
          <Route path="/leetcode" element={<LeetCode />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/todos" element={<TodoList />} />
          <Route path="/gate" element={<GatePrep />} />
          <Route path="/formulas" element={<FormulaVault />} />
          <Route path="/snippets" element={<SnippetBoard />} />
          <Route path="/habits" element={<HabitTracker />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
