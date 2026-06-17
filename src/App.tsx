import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Generate from "@/pages/Generate";
import QRCodes from "@/pages/QRCodes";
import Projects from "@/pages/Projects";
import Analytics from "@/pages/Analytics";
import Templates from "@/pages/Templates";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/qrcodes" element={<QRCodes />} />
          <Route path="/qrcodes/:id" element={<QRCodes />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<Projects />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:id" element={<Templates />} />
        </Route>
      </Routes>
    </Router>
  );
}
