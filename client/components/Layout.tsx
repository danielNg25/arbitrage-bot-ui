import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600" />
            <h1 className="text-xl font-bold tracking-tight">
              Arbitrage Bot Dashboard
            </h1>
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
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="container mx-auto space-y-6 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          Dashboard for ADaniel's Arbitrage Bot.
        </div>
      </footer>
    </div>
  );
}
