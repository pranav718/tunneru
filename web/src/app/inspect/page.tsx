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
          setRequests(data || []);
          if (data && data.length > 0) {
            setSelectedId((curr) => curr || data[0].id);
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
              const updated = [record, ...prev.filter((r) => r.id !== record.id)];
              return updated;
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
    setIsReplaying(true);
    try {
      const res = await fetch(`http://localhost:4040/api/requests/${id}/replay`, {
        method: 'POST',
      });
      if (res.ok) {
        const newRecord: RequestRecord = await res.json();
        setRequests((prev) => [newRecord, ...prev]);
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

      <div className="relative z-10 w-full h-full xl:w-[1400px] xl:h-[92vh] xl:rounded-lg flex flex-col border border-[var(--border-normal)] bg-[var(--canvas-bg)] overflow-hidden xl:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <Header connected={connected} requests={requests} onClear={handleClear} />

        <div className="flex flex-1 overflow-hidden">
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
  );
}
