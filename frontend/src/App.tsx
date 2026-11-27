import { Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing';
import LearnScreen from './pages/learner/LearnScreen';
import Progress from './pages/learner/Progress';
import Practice from './pages/learner/Practice';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/learn" element={<LearnScreen />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/practice" element={<Practice />} />

    </Routes>
  );
}

