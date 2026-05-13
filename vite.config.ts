import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
        "/health": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      exclude: ["tests/e2e/**", "node_modules/**", "dist/**", ".git/**"],
      globals: true,
      setupFiles: "./src/test/setup.ts",
    },
  };
});
