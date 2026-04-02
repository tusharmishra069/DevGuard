import React, { useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { runReview } from "../agents/runner.ts";
import { loadConfig } from "../config/loader.ts";
import type { DevGuardConfig } from "../config/schema.ts";
import { Header } from "./components/Header.js";
import { StatusBar } from "./components/StatusBar.js";
import { AgentsScreen } from "./screens/AgentsScreen.js";
import { ConfigScreen } from "./screens/ConfigScreen.js";
import { ChatScreen } from "./screens/ChatScreen.js";
import { HelpOverlay } from "./screens/HelpOverlay.js";
import { HomeScreen } from "./screens/HomeScreen.js";
import { ResultsScreen } from "./screens/ResultsScreen.js";
import { ReviewScreen } from "./screens/ReviewScreen.js";
import { SplashScreen } from "./screens/SplashScreen.js";
import type { MenuAction, Screen } from "./types.js";

const APP_VERSION = "1.0.0";
type ReviewFindings = Awaited<ReturnType<typeof runReview>>;

export function App(): React.JSX.Element {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("splash");
  const [showHelp, setShowHelp] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [findings, setFindings] = useState<ReviewFindings>([]);
  const [config, setConfig] = useState<DevGuardConfig>(() => loadConfig(process.cwd()));

  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    if (key.escape) {
      if (screen === "home" || screen === "splash") {
        return;
      }
      setScreen("home");
      return;
    }

    if (key.ctrl && input === "h") {
      setShowHelp((value) => !value);
      return;
    }

    if (key.return && screen === "splash") {
      setScreen("home");
      return;
    }

    if (key.return && screen === "review" && !isRunning) {
      setIsRunning(true);
      void runReview({ cwd: process.cwd(), staged: false, configOverride: config })
        .then((result: ReviewFindings) => {
          setFindings(result);
          setScreen("results");
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Unknown review error";
          setFindings([
            {
              file: "review",
              line: 1,
              severity: "high",
              agent: "system",
              message: "AI review failed.",
              suggestion: message
            }
          ]);
          setScreen("results");
        })
        .finally(() => {
          setIsRunning(false);
        });
    }

    if (key.return && screen === "results") {
      setScreen("chat");
      return;
    }
  });

  const model = useMemo(() => `${config.provider}/${config.model}`, [config.model, config.provider]);

  const onNavigate = (action: MenuAction): void => {
    if (action === "quit") {
      exit();
      return;
    }

    if (action === "review") {
      setScreen("review");
      return;
    }

    if (action === "agents") {
      setScreen("agents");
      return;
    }

    if (action === "config") {
      setConfig(loadConfig(process.cwd()));
      setScreen("config");
      return;
    }

    if (action === "results") {
      setScreen("results");
    }
  };

  return (
    <Box flexDirection="column" height={process.stdout.rows ?? 40}>
      <Header version={APP_VERSION} />
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {screen === "splash" ? <SplashScreen /> : null}
        {screen === "home" ? <HomeScreen onNavigate={onNavigate} /> : null}
        {screen === "review" ? <ReviewScreen config={config} isRunning={isRunning} /> : null}
        {screen === "agents" ? (
          <AgentsScreen
            enabledAgents={config.agents}
            onChange={(agents: string[]) => setConfig((prev: DevGuardConfig) => ({ ...prev, agents }))}
          />
        ) : null}
        {screen === "config" ? <ConfigScreen config={config} /> : null}
        {screen === "results" ? <ResultsScreen findings={findings} onChat={() => setScreen("chat")} /> : null}
        {screen === "chat" ? <ChatScreen findings={findings} onClose={() => setScreen("results")} /> : null}
        {showHelp ? <HelpOverlay /> : null}
      </Box>
      <StatusBar cwd={process.cwd()} model={model} mode={isRunning ? "reviewing" : "interactive"} />
      <Box paddingX={1}>
        <Text color="gray">Esc: back • q: quit • Ctrl+h: help</Text>
      </Box>
    </Box>
  );
}
