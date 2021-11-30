import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, '../react-source/react'),
      'react-dom': path.resolve(__dirname, '../react-source/react-dom'),
      'shared': path.resolve(__dirname, '../react-source/shared'),
      'react-reconciler': path.resolve(__dirname, '../react-source/react-reconciler'),
    }
  }
});
