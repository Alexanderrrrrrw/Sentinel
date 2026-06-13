"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { QueryStats, LogQueryResponse } from "@/lib/api";

export interface LiveEntry {
  timestamp: string;
  client_id: string;
  client_name?: string | null;
  query_domain: string;
  action: string;
  protocol: string;
  response_time_ms: number;
}

interface LiveStreamContextValue {
  connected: boolean;
  entries: LiveEntry[];
  liveStats: QueryStats | null;
}

const LiveStreamContext = createContext<LiveStreamContextValue | null>(null);

export function useLiveStream() {
  const ctx = useContext(LiveStreamContext);
  if (!ctx) {
    throw new Error("useLiveStream must be used within a LiveStreamProvider");
  }
  return ctx;
}

const MAX_ENTRIES = 200;

export function LiveStreamProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [liveStats, setLiveStats] = useState<QueryStats | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isInitialized.current) return;
    isInitialized.current = true;

    // Fetch initial data
    Promise.all([
      fetch("/api/proxy/stats").then(res => res.json()).catch(() => null),
      fetch("/api/proxy/logs?limit=50").then(res => res.json()).catch(() => null)
    ]).then(([statsData, logsData]) => {
      if (statsData) setLiveStats(statsData);
      if (logsData && logsData.logs) setEntries(logsData.logs);

      // Start SSE
      const es = new EventSource("/api/proxy/logs/live");
      eventSourceRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data) as LiveEntry;
          
          setEntries((prev) => {
            const next = [entry, ...prev];
            if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES;
            return next;
          });

          setLiveStats((prev) => {
            if (!prev) return null;
            
            const isBlocked = entry.action === "blocked" || entry.action.includes("heuristic");
            const newTotal = prev.total_queries + 1;
            const newBlocked = prev.blocked_queries + (isBlocked ? 1 : 0);

            const domainMap = new Map(prev.top_domains);
            domainMap.set(entry.query_domain, (domainMap.get(entry.query_domain) || 0) + 1);
            const sortedDomains = Array.from(domainMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

            let sortedBlocked = prev.top_blocked;
            if (isBlocked) {
              const blockedMap = new Map(prev.top_blocked);
              blockedMap.set(entry.query_domain, (blockedMap.get(entry.query_domain) || 0) + 1);
              sortedBlocked = Array.from(blockedMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
            }

            const clientMap = new Map(prev.top_clients);
            clientMap.set(entry.client_id, (clientMap.get(entry.client_id) || 0) + 1);
            const sortedClients = Array.from(clientMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

            return {
              total_queries: newTotal,
              blocked_queries: newBlocked,
              top_domains: sortedDomains,
              top_blocked: sortedBlocked,
              top_clients: sortedClients,
            };
          });
        } catch {
          // ignore malformed events
        }
      };

      es.onerror = () => setConnected(false);
    });

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  return (
    <LiveStreamContext.Provider value={{ connected, entries, liveStats }}>
      {children}
    </LiveStreamContext.Provider>
  );
}
