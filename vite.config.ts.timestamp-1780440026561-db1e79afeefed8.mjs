// vite.config.ts
import { defineConfig } from "file:///C:/Users/Maaz%20Afzal/Desktop/ai-context-bridge/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Maaz%20Afzal/Desktop/ai-context-bridge/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///C:/Users/Maaz%20Afzal/Desktop/ai-context-bridge/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// public/manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "AI Context Bridge",
  version: "1.0.0",
  description: "Transfer conversation context between AI platforms seamlessly.",
  permissions: ["activeTab", "clipboardWrite", "storage", "scripting", "tabs"],
  host_permissions: [
    "https://chatgpt.com/*",
    "https://*.chatgpt.com/*",
    "https://claude.ai/*",
    "https://*.claude.ai/*",
    "https://gemini.google.com/*",
    "https://grok.com/*",
    "https://www.perplexity.ai/*",
    "https://chat.deepseek.com/*",
    "https://*.deepseek.com/*"
  ],
  background: {
    service_worker: "src/background/index.js",
    type: "module"
  },
  action: {
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  content_scripts: [
    {
      matches: [
        "https://chatgpt.com/*",
        "https://*.chatgpt.com/*",
        "https://claude.ai/*",
        "https://*.claude.ai/*",
        "https://gemini.google.com/*",
        "https://grok.com/*",
        "https://www.perplexity.ai/*",
        "https://chat.deepseek.com/*",
        "https://*.deepseek.com/*"
      ],
      js: ["src/content/index.js"],
      run_at: "document_idle"
    }
  ],
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
};

// vite.config.ts
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Maaz Afzal\\Desktop\\ai-context-bridge";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: "src/popup/index.html"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicHVibGljL21hbmlmZXN0Lmpzb24iXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxNYWF6IEFmemFsXFxcXERlc2t0b3BcXFxcYWktY29udGV4dC1icmlkZ2VcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE1hYXogQWZ6YWxcXFxcRGVza3RvcFxcXFxhaS1jb250ZXh0LWJyaWRnZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTWFheiUyMEFmemFsL0Rlc2t0b3AvYWktY29udGV4dC1icmlkZ2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHsgY3J4IH0gZnJvbSAnQGNyeGpzL3ZpdGUtcGx1Z2luJztcclxuaW1wb3J0IG1hbmlmZXN0IGZyb20gJy4vcHVibGljL21hbmlmZXN0Lmpzb24nO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIGNyeCh7IG1hbmlmZXN0IH0pLFxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBpbnB1dDoge1xyXG4gICAgICAgIHBvcHVwOiAnc3JjL3BvcHVwL2luZGV4Lmh0bWwnLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KTsiLCAie1xyXG4gIFwibWFuaWZlc3RfdmVyc2lvblwiOiAzLFxyXG4gIFwibmFtZVwiOiBcIkFJIENvbnRleHQgQnJpZGdlXCIsXHJcbiAgXCJ2ZXJzaW9uXCI6IFwiMS4wLjBcIixcclxuICBcImRlc2NyaXB0aW9uXCI6IFwiVHJhbnNmZXIgY29udmVyc2F0aW9uIGNvbnRleHQgYmV0d2VlbiBBSSBwbGF0Zm9ybXMgc2VhbWxlc3NseS5cIixcclxuICBcInBlcm1pc3Npb25zXCI6IFtcImFjdGl2ZVRhYlwiLCBcImNsaXBib2FyZFdyaXRlXCIsIFwic3RvcmFnZVwiLCBcInNjcmlwdGluZ1wiLCBcInRhYnNcIl0sXHJcbiAgXCJob3N0X3Blcm1pc3Npb25zXCI6IFtcclxuICAgIFwiaHR0cHM6Ly9jaGF0Z3B0LmNvbS8qXCIsXHJcbiAgICBcImh0dHBzOi8vKi5jaGF0Z3B0LmNvbS8qXCIsXHJcbiAgICBcImh0dHBzOi8vY2xhdWRlLmFpLypcIixcclxuICAgIFwiaHR0cHM6Ly8qLmNsYXVkZS5haS8qXCIsXHJcbiAgICBcImh0dHBzOi8vZ2VtaW5pLmdvb2dsZS5jb20vKlwiLFxyXG4gICAgXCJodHRwczovL2dyb2suY29tLypcIixcclxuICAgIFwiaHR0cHM6Ly93d3cucGVycGxleGl0eS5haS8qXCIsXHJcbiAgICBcImh0dHBzOi8vY2hhdC5kZWVwc2Vlay5jb20vKlwiLFxyXG4gICAgXCJodHRwczovLyouZGVlcHNlZWsuY29tLypcIlxyXG4gIF0sXHJcbiAgXCJiYWNrZ3JvdW5kXCI6IHtcclxuICAgIFwic2VydmljZV93b3JrZXJcIjogXCJzcmMvYmFja2dyb3VuZC9pbmRleC5qc1wiLFxyXG4gICAgXCJ0eXBlXCI6IFwibW9kdWxlXCJcclxuICB9LFxyXG4gIFwiYWN0aW9uXCI6IHtcclxuICAgIFwiZGVmYXVsdF9wb3B1cFwiOiBcInNyYy9wb3B1cC9pbmRleC5odG1sXCIsXHJcbiAgICBcImRlZmF1bHRfaWNvblwiOiB7XHJcbiAgICAgIFwiMTZcIjogXCJpY29ucy9pY29uMTYucG5nXCIsXHJcbiAgICAgIFwiNDhcIjogXCJpY29ucy9pY29uNDgucG5nXCIsXHJcbiAgICAgIFwiMTI4XCI6IFwiaWNvbnMvaWNvbjEyOC5wbmdcIlxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXCJjb250ZW50X3NjcmlwdHNcIjogW1xyXG4gICAge1xyXG4gICAgICBcIm1hdGNoZXNcIjogW1xyXG4gICAgICAgIFwiaHR0cHM6Ly9jaGF0Z3B0LmNvbS8qXCIsXHJcbiAgICAgICAgXCJodHRwczovLyouY2hhdGdwdC5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly9jbGF1ZGUuYWkvKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly8qLmNsYXVkZS5haS8qXCIsXHJcbiAgICAgICAgXCJodHRwczovL2dlbWluaS5nb29nbGUuY29tLypcIixcclxuICAgICAgICBcImh0dHBzOi8vZ3Jvay5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly93d3cucGVycGxleGl0eS5haS8qXCIsXHJcbiAgICAgICAgXCJodHRwczovL2NoYXQuZGVlcHNlZWsuY29tLypcIixcclxuICAgICAgICBcImh0dHBzOi8vKi5kZWVwc2Vlay5jb20vKlwiXHJcbiAgICAgIF0sXHJcbiAgICAgIFwianNcIjogW1wic3JjL2NvbnRlbnQvaW5kZXguanNcIl0sXHJcbiAgICAgIFwicnVuX2F0XCI6IFwiZG9jdW1lbnRfaWRsZVwiXHJcbiAgICB9XHJcbiAgXSxcclxuICBcImljb25zXCI6IHtcclxuICAgIFwiMTZcIjogXCJpY29ucy9pY29uMTYucG5nXCIsXHJcbiAgICBcIjQ4XCI6IFwiaWNvbnMvaWNvbjQ4LnBuZ1wiLFxyXG4gICAgXCIxMjhcIjogXCJpY29ucy9pY29uMTI4LnBuZ1wiXHJcbiAgfVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVUsU0FBUyxvQkFBb0I7QUFDbFcsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsV0FBVzs7O0FDRnBCO0FBQUEsRUFDRSxrQkFBb0I7QUFBQSxFQUNwQixNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixhQUFlLENBQUMsYUFBYSxrQkFBa0IsV0FBVyxhQUFhLE1BQU07QUFBQSxFQUM3RSxrQkFBb0I7QUFBQSxJQUNsQjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ1osZ0JBQWtCO0FBQUEsSUFDbEIsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFFBQVU7QUFBQSxJQUNSLGVBQWlCO0FBQUEsSUFDakIsY0FBZ0I7QUFBQSxNQUNkLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakI7QUFBQSxNQUNFLFNBQVc7QUFBQSxRQUNUO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxJQUFNLENBQUMsc0JBQXNCO0FBQUEsTUFDN0IsUUFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsRUFDVDtBQUNGOzs7QUQvQ0EsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLElBQUksRUFBRSwyQkFBUyxDQUFDO0FBQUEsRUFDbEI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE9BQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
