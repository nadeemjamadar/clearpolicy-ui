import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = "", title }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {title && (
        <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
          {title}
        </h3>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
