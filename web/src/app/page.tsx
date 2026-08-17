'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { RequestList } from '@/components/RequestList';
import { RequestDetail } from '@/components/RequestDetail';
import { RequestRecord, MethodFilter } from '@/types';

export default function DashboardPage() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('ALL');
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:4040/api/requests');
      if (res.ok) {
        const data: RequestRecord[] = await res.json();
        setRequests(data || []);
        if (data && data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch {
      //backend may not be active yet
    }
  };

  useEffect(() => {
    fetchRequests();

    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      const socket = new WebSocket('ws://localhost:4040/ws');
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const record: RequestRecord = JSON.parse(event.data);
          setRequests((prev) => {
            const updated = [record, ...prev.filter((r) => r.id !== record.id)];
            return updated;
          });

          setSelectedId((curr) => curr || record.id);
        } catch {
          //ignore parsing error
        }
      };

      socket.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connectWebSocket();

    return () => {
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
      console.error('Failed to clear requests:', err);
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
      console.error('Replay failed:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  const selectedRequest = requests.find((r) => r.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-main)]">
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
  );
}
