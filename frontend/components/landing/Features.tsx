"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, Shield, Bot, Phone, MessageSquare, Users2 } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Support is always there when you need it, day or night.",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    icon: Shield,
    title: "100% Anonymous",
    description: "Your privacy matters. Chat without revealing your identity.",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Users2,
    title: "Trained Peer Listeners",
    description: "Connect with seniors who've been trained to support you.",
    gradient: "from-pink-400 to-rose-500",
  },
  {
    icon: Bot,
    title: "AI-Assisted Support",
    description: "Smart suggestions help seniors provide better guidance.",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Text or Voice",
    description: "Choose how you want to connect. Both options available.",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: Phone,
    title: "Instant Matching",
    description: "Get connected with a caring listener in under 60 seconds.",
    gradient: "from-fuchsia-400 to-pink-500",
  },
];

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-20 sm:py-32 bg-gray-900 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(236,72,153,0.1),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Why Students Love Aura Connect
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Real support designed for real college life
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Glassmorphism Card */}
                <div className="relative group h-full">
                  {/* Gradient border effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`}
                  />

                  {/* Card content */}
                  <div className="relative h-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-all duration-300">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-4`}
                    >
                      <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
