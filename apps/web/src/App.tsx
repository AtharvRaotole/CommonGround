import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./routes/LandingPage";
import { HostCreatePage } from "./routes/HostCreatePage";
import { JoinPage } from "./routes/JoinPage";
import { WaitingPage } from "./routes/WaitingPage";
import { SyntheticDemoPage } from "./routes/SyntheticDemoPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/host/new" element={<HostCreatePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/waiting" element={<WaitingPage />} />
      <Route path="/example" element={<SyntheticDemoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
