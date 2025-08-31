import { config } from "server/config";

export const ROUTES = {
  PING: "/api/ping",
  DEMO: "/api/demo",
  NETWORKS: "/api/v1/networks",
  OPPORTUNITIES: "/api/v1/opportunities",
};

export function getRoute(route: keyof typeof ROUTES) {
  return config.externalApi.baseUrl + ROUTES[route];
}
