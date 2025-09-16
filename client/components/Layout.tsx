import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import NetworkVisibilityToggle from "@/components/NetworkVisibilityToggle";
import {
  NetworkVisibilityProvider,
  useNetworkVisibility,
} from "@/context/NetworkVisibilityContext";
import { Menu, X } from "lucide-react";

export default function Layout() {
  return (
    <NetworkVisibilityProvider>
      <LayoutContent />
    </NetworkVisibilityProvider>
  );
}

function LayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showNetworkInfo, toggleNetworkVisibility } = useNetworkVisibility();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between py-4 px-1 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
            <nav className="ml-6 hidden gap-4 sm:flex">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                Overview
              </NavLink>
              <NavLink
                to="/tracking"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                Tracking
              </NavLink>
              <NavLink
                to="/tokens"
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                }
              >
                Tokens
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sm:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <NetworkVisibilityToggle
              visible={showNetworkInfo}
              onToggle={toggleNetworkVisibility}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-background border-r shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600" />
                <h2 className="text-lg font-bold tracking-tight">Menu</h2>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              <NavLink
                to="/"
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <div className="h-2 w-2 rounded-full bg-current" />
                Overview
              </NavLink>
              <NavLink
                to="/tracking"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <div className="h-2 w-2 rounded-full bg-current" />
                Tracking
              </NavLink>
              <NavLink
                to="/tokens"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <div className="h-2 w-2 rounded-full bg-current" />
                Tokens
              </NavLink>
            </nav>
          </div>
        </div>
      )}

      <main className="container mx-auto space-y-6 py-6 px-1 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-xs text-muted-foreground px-1 sm:px-6 lg:px-8">
          Dashboard for ADaniel's Arbitrage Bot.
        </div>
      </footer>
    </div>
  );
}
