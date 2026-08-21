"use client";

import { usePrototype } from "@/lib/prototype";
import { SplashScreen } from "@/screens/SplashScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { CaptureScreen } from "@/screens/CaptureScreen";
import { ConfirmationScreen } from "@/screens/ConfirmationScreen";
import { HistoryScreen } from "@/screens/HistoryScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";

export function ScreenRouter() {
  const { state } = usePrototype();

  // `key` força remontagem ao trocar de tela: reinicia scans/animações e
  // aplica a transição de entrada suave.
  return (
    <div key={state.screen} className="min-h-full animate-fade-up">
      {renderScreen(state.screen)}
    </div>
  );
}

function renderScreen(screen: ReturnType<typeof usePrototype>["state"]["screen"]) {
  switch (screen) {
    case "splash":
      return <SplashScreen />;
    case "login":
      return <LoginScreen />;
    case "home":
      return <HomeScreen />;
    case "capture":
      return <CaptureScreen />;
    case "confirmation":
      return <ConfirmationScreen />;
    case "history":
      return <HistoryScreen />;
    case "profile":
      return <ProfileScreen />;
  }
}
