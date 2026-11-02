import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { StickersPage } from "@/features/stickers/pages/StickersPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { EditorPage } from "@/features/editor/pages/EditorPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/stickers" replace />} />
      <Route path="/stickers" element={<AppShell><StickersPage /></AppShell>} />
      <Route path="/stickers/new" element={<AppShell hideNav><EditorPage /></AppShell>} />
      <Route path="/profile" element={<AppShell><ProfilePage /></AppShell>} />
      <Route path="/settings" element={<AppShell><SettingsPage /></AppShell>} />
      <Route path="*" element={<Navigate to="/stickers" replace />} />
    </Routes>
  );
}