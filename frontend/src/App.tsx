import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import CameraTest from './pages/learner/Practice'

function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>GabaySenyas</h1>
      <p>Learn Filipino Sign Language with your webcam.</p>
      <Link to="/lessons">Go to lessons</Link>
    </main>
  )
}

function Lessons() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Lessons</h1>
      <p>Coming soon.</p>
      <Link to="/">Back</Link>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/camera-test" element={<CameraTest />} />
      </Routes>
    </BrowserRouter>
  )
}
