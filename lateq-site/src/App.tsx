import { Navigate, Route, Routes } from 'react-router-dom'
import { Site } from './site/Site'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Site arte="atomo" />} />
      <Route path="/qubit" element={<Site arte="qubit" />} />
      <Route path="/atomo" element={<Navigate to="/" replace />} />
      <Route path="/fundo" element={<Site arte={null} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
