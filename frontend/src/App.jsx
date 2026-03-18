import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import TeaRecognition from "./pages/TeaRecognition";
import TongueDiagnosis from "./pages/TongueDiagnosis";

function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const base = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";
  const active = "bg-green-700 text-white shadow";
  const inactive = "text-green-100 hover:bg-green-600";

  return (
    <nav className="bg-green-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-white font-bold text-lg flex items-center gap-2">
          🍵 澳門茶飲 AI
        </Link>
        <div className="flex gap-2">
          <Link to="/" className={`${base} ${isActive("/") ? active : inactive}`}>首頁</Link>
          <Link to="/tea" className={`${base} ${isActive("/tea") ? active : inactive}`}>茶飲辨識</Link>
          <Link to="/tongue" className={`${base} ${isActive("/tongue") ? active : inactive}`}>舌苔識別</Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tea" element={<TeaRecognition />} />
          <Route path="/tongue" element={<TongueDiagnosis />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;