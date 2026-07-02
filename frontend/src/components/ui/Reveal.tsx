"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  /** Délai d'apparition en secondes (effet cascade). */
  delay?: number;
  /** Amplitude verticale du glissement. */
  y?: number;
  className?: string;
}

/**
 * Révélation douce au scroll (fade + rise), GPU-friendly.
 * Respecte `prefers-reduced-motion` : rendu statique sans animation.
 */
export function Reveal({ children, delay = 0, y = 24, className, ...rest }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
