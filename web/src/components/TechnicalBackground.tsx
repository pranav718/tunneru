'use client';

import React from 'react';

export const TechnicalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[var(--bg-main)]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(231,208,200,0.035),transparent_70%)]" />

      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #382e34 1px, transparent 1px),
            linear-gradient(to bottom, #382e34 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="absolute top-0 bottom-0 left-0 w-16 hidden xl:flex flex-col justify-between py-6 px-3 border-r border-[#261f23] text-[9px] font-mono text-[var(--text-dim)] select-none opacity-60">
        <div className="space-y-6">
          <span className="block font-bold text-[var(--text-secondary)]">00 // L</span>
          <div className="space-y-2">
            <div className="w-4 h-[1px] bg-[#3a2f35]" />
            <div className="w-2 h-[1px] bg-[#2a2226]" />
            <div className="w-2 h-[1px] bg-[#2a2226]" />
            <div className="w-3 h-[1px] bg-[#2a2226]" />
            <div className="w-6 h-[1px] bg-[#3a2f35]" />
          </div>
          <span className="block text-[8px] tracking-widest text-[#50444c]">TUNNERU.NET</span>
        </div>

        <div className="space-y-4">
          <div className="text-[8px] space-y-1 text-[#483d44]">
            <p>LAT: 4040</p>
            <p>MUX: TCP</p>
            <p>CH: 01</p>
          </div>
          <div className="w-full h-[1px] bg-[#2d252a]" />
          <span className="block">END // 99</span>
        </div>
      </div>

      <div className="absolute top-0 bottom-0 right-0 w-16 hidden xl:flex flex-col justify-between py-6 px-3 border-l border-[#261f23] text-[9px] font-mono text-[var(--text-dim)] select-none opacity-60 text-right">
        <div className="space-y-6">
          <span className="block font-bold text-[var(--text-secondary)]">R // 00</span>
          <div className="flex flex-col items-end space-y-2">
            <div className="w-4 h-[1px] bg-[#3a2f35]" />
            <div className="w-2 h-[1px] bg-[#2a2226]" />
            <div className="w-2 h-[1px] bg-[#2a2226]" />
            <div className="w-3 h-[1px] bg-[#2a2226]" />
            <div className="w-6 h-[1px] bg-[#3a2f35]" />
          </div>
          <span className="block text-[8px] tracking-widest text-[#50444c]">WS:LIVE</span>
        </div>

        <div className="space-y-4">
          <div className="text-[8px] space-y-1 text-[#483d44]">
            <p>RX: OK</p>
            <p>TX: OK</p>
            <p>SEC: OFF</p>
          </div>
          <div className="w-full h-[1px] bg-[#2d252a]" />
          <span className="block">99 // END</span>
        </div>
      </div>

      <div className="absolute top-12 left-20 hidden lg:block text-[#43373e] font-mono text-xs select-none">
        +
      </div>
      <div className="absolute top-12 right-20 hidden lg:block text-[#43373e] font-mono text-xs select-none">
        +
      </div>
      <div className="absolute bottom-12 left-20 hidden lg:block text-[#43373e] font-mono text-xs select-none">
        +
      </div>
      <div className="absolute bottom-12 right-20 hidden lg:block text-[#43373e] font-mono text-xs select-none">
        +
      </div>
    </div>
  );
};
