import React from "react";
import { motion } from "motion/react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className = "",
  delay = 0,
}: ChartContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className={`relative flex flex-col rounded-2xl bg-white shadow-md border border-gray-200 p-6 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-[200px] w-full">{children}</div>
    </motion.div>
  );
}
