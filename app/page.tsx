"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Users,
  Star,
  BookOpen,
  Target,
  Sparkles,
  Trophy,
  Globe,
  Heart,
  GraduationCap,
  User,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import { ParallaxWrapper } from "@/components/parallax-wrapper";
import { useState } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-gray-100 shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="Coaching for College Logo" 
                  width={240} 
                  height={55}
                  className="w-32 sm:w-48 md:w-60"
                  style={{ height: 'auto' }}
                />
              </Link>
              <div className="bg-slate-700 text-white px-2 py-1 sm:px-3 rounded-full text-xs font-medium">
                Alpha v1.0
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" className="border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                <Button className="bg-slate-700 hover:bg-slate-800 text-white">
                  About Coaching for College
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col gap-3 pt-4">
                <Link href="/login">
                  <Button variant="outline" className="w-full border-slate-600 text-slate-700 hover:bg-slate-700 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white">
                    About Coaching for College
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <ParallaxWrapper parallaxType="hero" className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] text-white overflow-hidden">
          <Image
            src="/hero image background.jpg"
            alt="A beautiful college campus"
            fill
            className="z-0 object-cover animate-hero-bg hero-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-blue-900/50 z-10" />
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center max-w-5xl mx-auto px-4 hero-content">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 text-white animate-hero-title">
              Discover Your Perfect College Match
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-100 mb-8 sm:mb-12 max-w-3xl leading-relaxed animate-hero-subtitle px-4">
              Transform your college search with our smart matching engine, expert guidance, and personalized support every step of the way.
            </p>
            <div className="flex justify-center animate-hero-button">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-blue-500 to-slate-700 hover:from-blue-700 hover:to-blue-900 text-white px-10 sm:px-14 py-6 sm:py-8 text-xl sm:text-2xl font-bold shadow-lg rounded-full border border-blue-200 hover:border-blue-400 transition-transform duration-200 highlight-pulse"
                >
                  Start Your Journey{" "}
                  <ArrowRight className="ml-3 h-6 w-6 sm:h-7 sm:w-7" />
                </Button>
              </Link>
            </div>
          </div>
        </ParallaxWrapper>

        {/* How It Works Section */}
        <ParallaxWrapper parallaxType="section" className="pt-12 sm:pt-16 pb-16 sm:pb-20 md:pb-24 bg-slate-50 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                How It Works
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                Five carefully crafted steps to discover your perfect college match with personalized guidance every step of the way
              </p>
            </div>
            
            <div className="relative">
              {/* Connecting line - hidden on mobile, visible on larger screens */}
              <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 transform -translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 md:gap-4">
                {[
                  {
                    icon: BookOpen,
                    title: "Share Your Story",
                    description: "Tell us about your academic journey, interests, and aspirations.",
                    color: "from-slate-600 to-slate-700"
                  },
                  {
                    icon: Target,
                    title: "Get Matched",
                    description: "Receive personalized college recommendations tailored to your unique profile.",
                    color: "from-slate-600 to-slate-700"
                  },
                  {
                    icon: Star,
                    title: "Explore Options",
                    description: "Use advanced filters and compare universities with detailed insights.",
                    color: "from-slate-600 to-slate-700"
                  },
                  {
                    icon: Trophy,
                    title: "Apply Smart",
                    description: "Organize your applications with a smart matching engine, timeline, and document management.",
                    color: "from-slate-600 to-slate-700"
                  },
                  {
                    icon: CheckCircle,
                    title: "Get Accepted",
                    description: "Track your progress and celebrate your admission success.",
                    color: "from-slate-600 to-slate-700"
                  }
                ].map((step, index) => {
                  const Icon = step.icon;
                  // Each icon gets a delay so the highlight flows left to right
                  const animationDelay = `${index * 0.7}s`;
                  return (
                    <div key={index} className="text-center group">
                      <div className="relative mb-4 sm:mb-6 flex justify-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border-4 border-slate-100">
                          <Icon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 step-anim" style={{ animation: `step-highlight 3.5s linear infinite`, animationDelay }} />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
                          {index + 1}
                        </div>
                        {index < 4 && (
                          <div className="hidden lg:block absolute left-full top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-slate-300 to-slate-400">
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-slate-400 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3">{step.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed px-2">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ParallaxWrapper>

        {/* Why Use Our Tool Section */}
        <ParallaxWrapper parallaxType="cards" className="pt-8 pb-16 sm:pb-20 md:pb-24 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                Why Use Our Tool?
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
                Designed to empower students, parents, and counsellors with comprehensive tools for global college admissions success.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* For Students */}
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden parallax-card">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 sm:p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">For Students</h3>
                  </div>
                  <p className="text-slate-200 text-sm">
                    Comprehensive tools for your global college journey
                  </p>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {[
                    {
                      icon: Globe,
                      title: "Worldwide College Matches",
                      description: "Access personalized university recommendations from around the globe, helping you discover the best-fit institutions in any country."
                    },
                    {
                      icon: Target,
                      title: "Organized Application Tracking",
                      description: "Manage your entire college journey across different countries and systems using a visual Kanban board, with the ability to track, sort, and annotate each application."
                    },
                    {
                      icon: Heart,
                      title: "Holistic Self-Discovery",
                      description: "Reflect on your unique strengths, interests, and values with guided prompts, supporting confident decisions whether you're applying locally or internationally."
                    },
                    {
                      icon: Trophy,
                      title: "Data-Driven Insights",
                      description: "Receive realistic admission chances for universities worldwide, using up-to-date international data and holistic profile analysis."
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm">{feature.title}</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Parents/Guardians */}
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden parallax-card">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 sm:p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">For Parents/Guardians</h3>
                  </div>
                  <p className="text-slate-200 text-sm">
                    Stay informed and support your child's journey
                  </p>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {[
                    {
                      icon: Globe,
                      title: "Global Transparency & Clarity",
                      description: "Get a clear overview of your child's application process, including international options, preferences, and progress in one place."
                    },
                    {
                      icon: Target,
                      title: "Informed Financial Planning",
                      description: "Easily compare colleges from different countries to match your family's financial needs, scholarships, and aid requirements."
                    },
                    {
                      icon: CheckCircle,
                      title: "Peace of Mind",
                      description: "Know that your child is supported by expert-backed, unbiased advice and has access to structured, globally-aware tools for staying organized and on track."
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm">{feature.title}</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Counsellors */}
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden parallax-card md:col-span-2 lg:col-span-1">
                <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 sm:p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">For Counsellors</h3>
                  </div>
                  <p className="text-slate-200 text-sm">
                    Professional tools for effective student guidance
                  </p>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {[
                    {
                      icon: Globe,
                      title: "Efficient Global Student Support",
                      description: "Quickly review each student's profile, preferences, and international college list to provide targeted, cross-border guidance."
                    },
                    {
                      icon: Users,
                      title: "Collaborative Planning",
                      description: "Facilitate meaningful conversations with students and parents from diverse backgrounds, using shared notes and progress tracking."
                    },
                    {
                      icon: BookOpen,
                      title: "Comprehensive Reporting",
                      description: "Access detailed records of student activities, preferences, and application stages across multiple countries, making it easier to support students seeking global opportunities."
                    }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-1 text-sm">{feature.title}</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ParallaxWrapper>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12">
              Ready to Find Your Perfect College Match?
            </h2>
            <div className="flex justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-slate-700 hover:bg-slate-800 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-xl">
                  Start Your College Search
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="Coaching for College Logo" 
                width={120} 
                height={28}
                className="w-20 sm:w-24 md:w-32"
                style={{ height: 'auto' }}
              />
            </div>
            <p className="text-gray-300 text-sm sm:text-base text-center sm:text-left">
              &copy; {new Date().getFullYear()} Coaching for College. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
