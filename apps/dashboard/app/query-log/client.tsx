"use client";

import { useState } from "react";
import type { LogQueryResponse } from "@/lib/api";
import { useLiveStream } from "../live-stream-context";

export function QueryLogClient({ initial }: { initial: LogQueryResponse | null }) {
  const { entries, connected } = useLiveStream();
  const currentLogs = entries.length > 0 ? entries : (initial?.logs || []);

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <StatusDot connected={connected} />
      </div>
      {currentLogs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Domain</th>
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Action</th>
                <th className="pb-2 pr-4">Protocol</th>
                <th className="pb-2 pr-4">Latency</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log, i) => (
                <tr key={`${log.timestamp}-${i}`} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-slate-400 tabular-nums">
                    {formatTs(log.timestamp)}
                  </td>
                  <td className="py-2 pr-4 font-mono text-slate-200">{log.query_domain}</td>
                  <td className="py-2 pr-4 text-slate-400">{log.client_id}</td>
                  <td className="py-2 pr-4">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="py-2 pr-4 text-slate-400 uppercase text-xs">{log.protocol}</td>
                  <td className="py-2 pr-4 tabular-nums text-slate-400">{log.response_time_ms}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Showing latest {currentLogs.length} queries
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Waiting for queries...</p>
      )}
    </div>
  );
}

function StatusDot({ connected }: { connected: boolean }) {
  if (!connected) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-600" />
        Connecting...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      Live Streaming
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const isHeuristic = action.toLowerCase().includes("heuristic");
  const isBlocked = action.toLowerCase().includes("block");
  const isCached = action.toLowerCase().includes("cache");

  let color = "bg-emerald-500/10 text-emerald-400";
  if (isHeuristic) {
    color = "bg-amber-500/15 text-amber-400 border border-amber-500/30";
  } else if (isBlocked) {
    color = "bg-red-500/10 text-red-400";
  } else if (isCached) {
    color = "bg-blue-500/10 text-blue-400";
  }

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${color}`}>
      {action}
    </span>
  );
}

function formatTs(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}
