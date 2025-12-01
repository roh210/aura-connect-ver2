"use client";

import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import StudentSeniorSplit from "@/components/landing/StudentSeniorSplit";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <HowItWorks />
      <Features />
      <StudentSeniorSplit />
      <FinalCTA />
      <Footer />
    </main>
  );
}
