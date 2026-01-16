import { Routes, Route } from 'react-router-dom'
import { SignUp } from './pages/SignUp'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { DealIntake } from './pages/DealIntake'
import { PackReview } from './pages/PackReview'
import { Alignment } from './pages/Alignment'
import { MeetingNotes } from './pages/MeetingNotes'
import { Suppliers } from './pages/Suppliers'
import { Deals } from './pages/Deals'
import { Landing } from './pages/Landing'
import { Meetings } from './pages/Meetings'
import { Settings } from './pages/Settings'
import { Terms } from './pages/Terms'
import { Layout } from './components/Layout'

function App() {
    return (
        <div className="min-h-screen">
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/terms" element={<Terms />} />

                <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/meetings" element={<Meetings />} />
                    <Route path="/new-deal" element={<DealIntake />} />
                    <Route path="/pack/:id" element={<PackReview />} />
                    <Route path="/alignment/:id" element={<Alignment />} />
                    <Route path="/meeting/:id" element={<MeetingNotes />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Routes>
        </div>
    )
}

export default App
