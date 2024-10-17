import { Routes, Route } from 'react-router-dom'
import Watch from './components/Watch'
import Navbar from "./components/Navbar"

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex-grow p-4">
        <Routes>
          <Route path="/watch" element={<Watch />} />
        </Routes>
      </main>
    </div>
  )
}

export default App