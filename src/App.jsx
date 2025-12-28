import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import RecipeDetail from './pages/RecipeDetail.jsx'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
      </Routes>
    </div>
  )
}

export default App