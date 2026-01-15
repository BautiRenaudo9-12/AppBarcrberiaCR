import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedLayoutProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10, // Slide up slightly
    scale: 0.99
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -10, // Slide up on exit
    scale: 0.99
  }
};

const pageTransition = {
  type: "tween",
  ease: "circOut",
  duration: 0.3
};

export default function AnimatedLayout({ children, className = "" }: AnimatedLayoutProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`min-h-screen w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
