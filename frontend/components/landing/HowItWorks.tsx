"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Users, Heart } from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    title: "Click 'Get Started'",
    description:
      "No appointments needed. Get matched with a caring peer in seconds.",
    color: "from-blue-400 to-cyan-500",
  },
  {
    icon: Users,
    title: "Connect Instantly",
    description:
      "Chat or talk with a trained senior who understands what you're going through.",
    color: "from-purple-400 to-pink-500",
  },
  {
    icon: Heart,
    title: "Feel Supported",
    description:
      "Real conversations, real empathy. Available whenever you need it.",
    color: "from-pink-400 to-rose-500",
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-20 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Getting support is as easy as 1-2-3
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {/* Connecting Line (hidden on mobile, shown between cards on desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent -z-10" />
                )}

                {/* Card */}
                <div className="relative group">
                  {/* Icon with gradient background and step number */}
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-full h-full rounded-2xl bg-gradient-to-br ${step.color} p-0.5`}
                    >
                      <div className="w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                    </motion.div>

                    {/* Step Number - positioned next to icon */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-center leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
