import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./react-source/react"),
      "react-dom": path.resolve(__dirname, "./react-source/react-dom"),
      shared: path.resolve(__dirname, "./react-source/shared"),
      "react-reconciler": path.resolve(
        __dirname,
        "./react-source/react-reconciler"
      ),
    },
  },
  define: {
    __DEV__: true,
    __PROFILE__: true,
    __UMD__: true,
    __EXPERIMENTAL__: true,
  },
});
