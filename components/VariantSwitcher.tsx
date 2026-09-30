"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const VARIANTS = [
  { href: "/canvas", label: "Canvas" },
  { href: "/orb", label: "Orb" },
  { href: "/wall", label: "Wall" },
];

export default function VariantSwitcher() {
  const path = usePathname();
  return (
    <nav className="switcher" aria-label="Design variation">
      {VARIANTS.map((v) => {
        const active = path === v.href;
        return (
          <Link key={v.href} href={v.href} aria-current={active ? "page" : undefined}>
            {active && (
              <motion.span
                layoutId="switcher-pill"
                className="switcher-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="switcher-label">{v.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DemoTag({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="demo-tag" title="Connect the API later to get real answers">
      Sample answers
    </span>
  );
}
