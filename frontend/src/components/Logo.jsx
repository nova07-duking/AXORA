import React from "react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 176 176" fill="none">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2563eb" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <path
          d="M88 8 L164 168"
          stroke="url(#lg1)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M88 8 L12 168"
          stroke="url(#lg1)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M44 112 L132 112"
          stroke="url(#lg1)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <circle cx="88" cy="8" r="11" fill="#2563eb" />
        <circle cx="12" cy="168" r="11" fill="#06b6d4" />
        <circle cx="164" cy="168" r="11" fill="#06b6d4" />
      </svg>
      <span className="font-bold text-xl tracking-tight text-slate-900">
        AXORA
      </span>
    </div>
  );
}
