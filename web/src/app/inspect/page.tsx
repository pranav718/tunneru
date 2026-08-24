'use client';

import React, { useEffect, useState, useRef } from 'react';
import { TechnicalBackground } from '@/components/TechnicalBackground';
import { Header } from '@/components/Header';
import { RequestList } from '@/components/RequestList';
import { RequestDetail } from '@/components/RequestDetail';
import { RequestRecord, MethodFilter } from '@/types';

export default function InspectorPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ignore = false;
    let reconnectTimer: NodeJS.Timeout;

    const loadInitialRequests = async () => {
      try {
        const res = await fetch('http://localhost:4040/api/requests');
        if (res.ok && !ignore) {
          const data: RequestRecord[] = await res.json();
          const unique = Array.from(new Map((data || []).map((r) => [r.id, r])).values());
          setRequests(unique);
          if (unique.length > 0) {
            setSelectedId((curr) => curr || unique[0].id);
          }
        }
      } catch {
        // ignore
      }
    };

    void loadInitialRequests();

    const connectWebSocket = () => {
      const socket = new WebSocket('ws://localhost:4040/ws');
      wsRef.current = socket;

      socket.onopen = () => {
        if (!ignore) {
          setConnected(true);
        }
      };

      socket.onmessage = (event) => {
        try {
          const record: RequestRecord = JSON.parse(event.data);
          if (!ignore) {
            setRequests((prev) => {
              const filtered = prev.filter((r) => r.id !== record.id);
              return [record, ...filtered];
            });
            setSelectedId((curr) => curr || record.id);
          }
        } catch {
          // ignore
        }
      };

      socket.onclose = () => {
        if (!ignore) {
          setConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 2000);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
      ignore = true;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleClear = async () => {
    try {
      await fetch('http://localhost:4040/api/requests', { method: 'DELETE' });
      setRequests([]);
      setSelectedId(null);
    } catch (err) {
      console.error('clear failed:', err);
    }
  };

  const handleReplay = async (id: string) => {
    if (isReplaying) return;
    setIsReplaying(true);
    try {
      const res = await fetch(`http://localhost:4040/api/requests/${id}/replay`, {
        method: 'POST',
      });
      if (res.ok) {
        const newRecord: RequestRecord = await res.json();
        setRequests((prev) => {
          const filtered = prev.filter((r) => r.id !== newRecord.id);
          return [newRecord, ...filtered];
        });
        setSelectedId(newRecord.id);
      }
    } catch (err) {
      console.error('replay failed:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  const selectedRequest = requests.find((r) => r.id === selectedId) || null;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-main)]">
      <TechnicalBackground />

      <div className="relative z-10 w-full h-full max-w-[1400px] max-h-[900px] p-0 md:p-6 flex flex-col">
        <div className="flex-1 rounded-none md:rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] shadow-2xl overflow-hidden flex flex-col">
          <Header
            connected={connected}
            onClear={handleClear}
            requests={requests}
          />

          <div className="flex-1 flex overflow-hidden">
            <RequestList
              requests={requests}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              search={search}
              onSearchChange={setSearch}
              methodFilter={methodFilter}
              onMethodFilterChange={setMethodFilter}
            />

            <RequestDetail
              request={selectedRequest}
              onReplay={handleReplay}
              isReplaying={isReplaying}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
