"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Holographic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 via-purple-800/50 to-pink-900/50 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
      </div>

      {/* Orbiting Planets - Connecting Two Worlds */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none lg:left-auto lg:right-20 lg:translate-x-0 opacity-30 lg:opacity-60">
        {/* Orbit system */}
        <div className="relative w-[300px] h-[300px] lg:w-[400px] lg:h-[400px]">
          {/* Center Sun (Aura Connect core) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 shadow-[0_0_60px_rgba(168,85,247,0.4)] animate-pulse" />
          </div>

          {/* Orbit rings - subtle */}
          <div className="absolute inset-0 rounded-full border border-purple-400/10" />
          <div className="absolute inset-12 rounded-full border border-pink-400/10" />

          {/* Student Planet (Blue - outer orbit) */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: 0, height: 0 }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute"
              style={{
                left: "120px",
                top: "-10px",
              }}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 shadow-[0_0_20px_rgba(96,165,250,0.4)]" />
            </div>
          </motion.div>

          {/* Senior Planet (Purple - inner orbit) */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: 0, height: 0 }}
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute"
              style={{
                left: "85px",
                top: "-8px",
              }}
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]" />
            </div>
          </motion.div>

          {/* Additional small orbiting dots for depth */}
          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: 0, height: 0 }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute"
              style={{
                left: "145px",
                top: "-3px",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-blue-300/40" />
            </div>
          </motion.div>

          <motion.div
            className="absolute top-1/2 left-1/2"
            style={{ width: 0, height: 0 }}
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute"
              style={{
                left: "60px",
                top: "-2px",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-purple-300/40" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Brand Logo/Name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            ✨ Aura Connect
          </h2>
        </motion.div>

        {/* Animated Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
            You're not alone.
          </span>
          <br />
          <span className="text-white mt-2 block">
            Connect with someone who gets it.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
        >
          24/7 anonymous peer support from trained seniors. Real conversations,
          real understanding, whenever you need it.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400/10 px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Login
            </Button>
          </Link>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12"
        >
          <p className="text-sm text-gray-400">
            🔒 Anonymous · 🎓 Student-Run · 💜 Free Forever
          </p>
        </motion.div>
      </div>
    </section>
  );
}
