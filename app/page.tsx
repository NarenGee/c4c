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
import { useState, useEffect } from "react";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowStickyCTA(scrollY > 400); // Show after scrolling past hero section
      
      // Scroll animations
      const elements = document.querySelectorAll('.animate-fade-in-up, .animate-fade-in-left, .animate-fade-in-right, .animate-scale-in');
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Run once on mount to check initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      {/* Structured Data for AI/SEO Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Coaching for College - AI-Powered College Search Platform",
            "applicationCategory": "EducationalApplication",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "200",
              "bestRating": "5"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free with usage limits; unlimited access included with premium coaching programs"
            },
            "provider": {
              "@type": "EducationalOrganization",
              "name": "Coaching for College",
              "url": "https://coachingforcollege.org/",
              "logo": "https://coachingforcollegeapp.xyz/logo.png",
              "sameAs": [
                "https://coachingforcollege.org/"
              ],
              "description": "AI-powered college admissions platform by ICA certified coaches with 100% admission rate for coached students",
              "knowsAbout": [
                "AI College Matching",
                "University Selection",
                "Application Strategy",
                "Self-Discovery Coaching",
                "International Education",
                "Machine Learning Education Technology"
              ],
              "memberOf": [
                {
                  "@type": "Organization",
                  "name": "International Coaching Association (ICA)"
                }
              ]
            },
            "featureList": [
              "AI-guided self-discovery journey to understand college preferences",
              "Support for diverse global high school education systems including IB, A-levels, US GPA, AP, and more",
              "Curriculum-aware matching that understands IB Diploma, A-levels, and international qualifications",
              "Database of 10,000+ verified colleges across 50+ countries",
              "AI-powered college matching based on 12 holistic factors",
              "Visual Kanban board application tracking system",
              "Machine learning recommendation engine that evolves with student profile",
              "Global coverage unlike US-centric platforms",
              "Real-time application deadline tracking"
            ],
            "about": [
              {
                "@type": "Thing",
                "name": "AI College Admissions",
                "description": "Artificial intelligence powered guidance for university applications worldwide"
              },
              {
                "@type": "Thing",
                "name": "Global Education",
                "description": "International university search and matching services across 50+ countries"
              },
              {
                "@type": "Thing",
                "name": "Self-Discovery",
                "description": "AI-guided journey to help students understand their college preferences"
              }
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How many colleges are in your database?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our AI-powered platform includes over 10,000 colleges from more than 50 countries worldwide, covering institutions in North America, Europe, Asia, Australia, and beyond. All data is verified from official sources including IPEDS, Common Data Set, and government education databases."
                }
              },
              {
                "@type": "Question",
                "name": "How does your AI-powered matching work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our AI analyzes your profile across 12 holistic factors and matches it against verified data from thousands of colleges worldwide. The system uses machine learning to continuously improve recommendations based on student outcomes and institutional data from sources like Common Data Set, IPEDS, and global education databases."
                }
              },
              {
                "@type": "Question",
                "name": "Is the college search platform free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The platform is free to use up to a certain usage limit for all students. For students enrolled in Coaching for College's premium coaching programs (Build for Success and Ace Your Apps), unlimited access is included as part of their package, along with personalized guidance from our ICA certified coaches."
                }
              },
              {
                "@type": "Question",
                "name": "What makes this platform different from other college search tools?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Unlike other platforms that are typically US-centric, ours is truly global with 10,000+ colleges across 50+ countries. We understand diverse educational systems—whether you're studying IB, A-levels, American GPA, or other curricula—and how to position your achievements for international admissions. More importantly, while other platforms assume students already know their preferences, our AI-powered tool guides you through a journey of self-discovery to help you understand what you're truly looking for in a college. We combine holistic matching across 12 factors with intelligent recommendations that evolve as you learn more about yourself."
                }
              },
              {
                "@type": "Question",
                "name": "What education systems does your platform support?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our platform recognizes and evaluates achievements from diverse global high school education systems including IB Diploma, A-levels, US GPA (4.0 and 5.0 scales), AP courses, CBSE/ICSE, and other international curricula. Our AI understands how to translate your academic performance into the context needed for university applications worldwide, ensuring your achievements are properly represented regardless of your educational background."
                }
              }
            ]
          })
        }}
      />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8]">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5">
          <div className="flex justify-between items-center min-h-[44px]">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Link href="/" className="flex items-center gap-1">
                <Image 
                  src="/logo.png" 
                  alt="Coaching for College Logo" 
                  width={240} 
                  height={55}
                  className="w-20 sm:w-28 md:w-36 lg:w-48 xl:w-60"
                  style={{ height: 'auto' }}
                />
              </Link>
              <div className="bg-blue-600 text-white px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                Alpha v1.0
              </div>
            </div>
            
            {/* Desktop Navigation - Simplified like Niche */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    About Us
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-gray-100 min-w-[44px] min-h-[44px]"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-3 border-t border-gray-200">
              <div className="flex flex-col gap-2 pt-3">
                <Link href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-sm py-2">
                    About Us
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-sm py-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section with Background Image */}
        <ParallaxWrapper parallaxType="hero" className="relative h-[600px] sm:h-[650px] md:h-[700px] lg:h-[750px] text-white overflow-hidden">
          <Image
            src="/hero image background.jpg"
            alt="A beautiful college campus"
            fill
            className="z-0 object-cover animate-hero-bg hero-bg"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-blue-900/60 z-10" />
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 hero-content">
            <div className="hero-text-container rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-6 mb-4 sm:mb-6 md:mb-8 max-w-5xl w-full">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 sm:mb-6 md:mb-8 text-white animate-hero-title hero-title-enhanced">
                Find Your <span className="text-blue-400">Perfect College Match</span>
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 animate-hero-subtitle">
                <div className="process-step bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-white/30 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 transition-all duration-300 animate-fade-in-up animate-stagger-1">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg animate-scale-in mb-1 sm:mb-2 shadow-lg">
                      1
                    </div>
                    <p className="text-white text-xs sm:text-sm md:text-base font-medium leading-relaxed hero-subtitle-enhanced">
                      Discover your preferences with AI-guided self-discovery.
                    </p>
                  </div>
                </div>
                
                <div className="process-step bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-white/30 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 transition-all duration-300 animate-fade-in-up animate-stagger-2">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg animate-scale-in mb-1 sm:mb-2 shadow-lg">
                      2
                    </div>
                    <p className="text-white text-xs sm:text-sm md:text-base font-medium leading-relaxed hero-subtitle-enhanced">
                      Get personalized matches from 10,000+ colleges worldwide.
                    </p>
                  </div>
                </div>
                
                <div className="process-step bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-white/30 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 transition-all duration-300 animate-fade-in-up animate-stagger-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg animate-scale-in mb-1 sm:mb-2 shadow-lg">
                      3
                    </div>
                    <p className="text-white text-xs sm:text-sm md:text-base font-medium leading-relaxed hero-subtitle-enhanced">
                      Connect with expert coaches for personalized guidance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center animate-hero-button mt-4 sm:mt-6 md:mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-7 text-base sm:text-lg md:text-xl font-bold shadow-2xl rounded-full transition-all duration-300 hover:scale-105 hover:shadow-3xl w-full sm:w-auto"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-7 text-base sm:text-lg md:text-xl font-bold shadow-2xl rounded-full transition-all duration-300 hover:scale-105 hover:shadow-3xl w-full sm:w-auto"
                >
                  Continue Your Journey
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </ParallaxWrapper>

        {/* Quick Stats Section */}
        <section className="py-8 sm:py-12 bg-gradient-to-r from-blue-600 to-slate-700 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 animate-hero-title">Trusted by Students Worldwide</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center stats-item-1">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">10,000+</div>
                <div className="text-blue-100 text-sm sm:text-base">Colleges</div>
              </div>
              <div className="text-center stats-item-2">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">50+</div>
                <div className="text-blue-100 text-sm sm:text-base">Countries</div>
              </div>
              <div className="text-center stats-item-3">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">100%</div>
                <div className="text-blue-100 text-sm sm:text-base">Success Rate</div>
              </div>
              <div className="text-center stats-item-4">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">$2M+</div>
                <div className="text-blue-100 text-sm sm:text-base">Scholarships</div>
              </div>
            </div>
          </div>
        </section>



        {/* How It Works Section - Niche.com Style */}
        <section className="py-16 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 animate-fade-in-up">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Get started in minutes with our simple, AI-powered process
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              {[
                {
                  icon: BookOpen,
                  title: "Share Your Story",
                  description: "Tell us about your academic journey and interests"
                },
                {
                  icon: Target,
                  title: "Get AI-Matched",
                  description: "Our AI discovers personalized college recommendations"
                },
                {
                  icon: Star,
                  title: "Explore Options",
                  description: "Compare colleges with detailed insights"
                },
                {
                  icon: Trophy,
                  title: "Apply Smart",
                  description: "Manage applications with our tracking system"
                },
                {
                  icon: CheckCircle,
                  title: "Get Accepted",
                  description: "Track progress and celebrate success"
                }
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className={`text-center animate-scale-in animate-stagger-${index + 1}`}>
                    <div className="relative mb-6 flex justify-center">
                      <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-blue-100">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Use Our Tool Section */}
        <ParallaxWrapper parallaxType="cards" className="pt-8 pb-16 sm:pb-20 md:pb-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-4 sm:mb-6">
                Designed for Everyone
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-4">
                Whether you're a student, parent, or counselor, our AI-powered platform adapts to your unique needs and goals.
              </p>
            </div>

            {/* Education Systems Section - Simplified */}
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 text-slate-800">
                Global Education Systems Supported
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { system: "IB Diploma", detail: "International" },
                  { system: "A-Levels", detail: "UK & Commonwealth" },
                  { system: "US GPA", detail: "American System" },
                  { system: "AP Courses", detail: "Advanced Placement" }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 transition-colors">
                    <div className="font-semibold text-slate-800 mb-1 text-sm sm:text-base">{item.system}</div>
                    <div className="text-xs text-slate-600">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* For Students */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 animate-fade-in-left">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">For Students</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    Discover your perfect college match with AI-powered guidance tailored to your unique profile and goals.
                  </p>
                  
                  <div className="space-y-4">
                    {[
                      {
                        icon: Sparkles,
                        title: "AI Self-Discovery",
                        description: "Understand what you truly want in a college"
                      },
                      {
                        icon: Globe,
                        title: "Global Matches",
                        description: "10,000+ colleges across 50+ countries"
                      },
                      {
                        icon: Target,
                        title: "Smart Tracking",
                        description: "Manage applications with visual tools"
                      }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{feature.title}</h4>
                          <p className="text-slate-600 text-xs">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* For Parents/Guardians */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 animate-fade-in-up">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">For Parents</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    Stay informed and support your child's college journey with clear insights and guidance.
                  </p>
                  
                  <div className="space-y-4">
                    {[
                      {
                        icon: Globe,
                        title: "Clear Overview",
                        description: "Track progress across international options"
                      },
                      {
                        icon: GraduationCap,
                        title: "System Clarity",
                        description: "Understand how IB, A-levels translate globally"
                      },
                      {
                        icon: Target,
                        title: "Financial Planning",
                        description: "Compare costs and scholarships worldwide"
                      }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{feature.title}</h4>
                          <p className="text-slate-600 text-xs">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* For Counsellors */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 animate-fade-in-right">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">For Counselors</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    Professional tools to guide students effectively through their global college application journey.
                  </p>
                  
                  <div className="space-y-4">
                    {[
                      {
                        icon: Globe,
                        title: "Global Support",
                        description: "Review international college lists efficiently"
                      },
                      {
                        icon: Users,
                        title: "Collaborative Planning",
                        description: "Facilitate conversations with students & parents"
                      },
                      {
                        icon: BookOpen,
                        title: "Comprehensive Reports",
                        description: "Track progress across multiple countries"
                      }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">{feature.title}</h4>
                          <p className="text-slate-600 text-xs">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ParallaxWrapper>


        {/* Powered by Coaching for College Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-6 animate-fade-in-up">
              Powered by Coaching for College
            </h2>
            <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto animate-fade-in-up animate-stagger-1">
              This platform is developed by{" "}
              <a
                href="https://coachingforcollege.org"
                className="text-blue-600 hover:underline font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Coaching for College
              </a>
              , a trusted college admissions coaching organization helping students achieve their higher education dreams worldwide.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-blue-600" />
                    Proven Track Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>100% admission rate for students coached by us</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>$2M+ in scholarships secured for students (2024-2025)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>AI-powered personalized matching and guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Students accepted to Ivy League, Russell Group, and top global institutions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                    Expert Coaching Programs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-slate-600">
                    <li>
                      <strong className="text-slate-900">Build for Success:</strong>
                      <p className="text-sm mt-1">Academic coaching and profile development</p>
                    </li>
                    <li>
                      <strong className="text-slate-900">Ace Your Apps:</strong>
                      <p className="text-sm mt-1">Application strategy and essay guidance</p>
                    </li>
                    <li>
                      <strong className="text-slate-900">Global Guidance:</strong>
                      <p className="text-sm mt-1">International university admissions support</p>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Certified Professionals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>ICA (International Coaching Association) certified coaches</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>AI-enhanced coaching methodologies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>10+ years average counseling experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Former admissions officers on team</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 sm:mb-12 text-white">
              Ready to Find Your <span className="text-blue-300">Perfect College Match</span>?
            </h2>
            <div className="flex justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-600 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold shadow-xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Data-Driven Approach Section */}
        <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-100 to-blue-200">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Our Data-Driven Approach
            </h2>
            
            <div className="space-y-6">
              <Card className="border-2 border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50">
                  <CardTitle className="text-2xl flex items-center gap-2 animate-fade-in-up">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                    Verified Data Sources
                  </CardTitle>
                  <p className="text-slate-600 mt-2 animate-fade-in-up animate-stagger-1">Our AI-powered recommendations are built on reliable, up-to-date information from trusted global sources:</p>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up animate-stagger-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <strong className="text-slate-900">IPEDS</strong>
                      </div>
                      <p className="text-sm text-slate-600">Integrated Postsecondary Education Data System - Official U.S. higher education data</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up animate-stagger-2">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <strong className="text-slate-900">Common Data Set</strong>
                      </div>
                      <p className="text-sm text-slate-600">Standardized institutional information from colleges worldwide</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up animate-stagger-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <strong className="text-slate-900">Global Education Databases</strong>
                      </div>
                      <p className="text-sm text-slate-600">Official registries from 50+ countries worldwide</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up animate-stagger-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <strong className="text-slate-900">Student Success Tracking</strong>
                      </div>
                      <p className="text-sm text-slate-600">Real-time monitoring of application outcomes and success metrics</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up animate-stagger-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-blue-600" />
                        <strong className="text-slate-900">QS World Rankings</strong>
                      </div>
                      <p className="text-sm text-slate-600">Global institutional assessments and performance metrics</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in-up animate-stagger-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-blue-600" />
                        <strong className="text-slate-900">Times Higher Education</strong>
                      </div>
                      <p className="text-sm text-slate-600">Academic reputation and research excellence data</p>
                    </div>
                  </div>
                  <div className="mt-6 p-3 bg-[#E5E7E8] rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong>AI-Enhanced Analysis:</strong> Our machine learning algorithms continuously process and analyze data from these sources to provide you with the most relevant, personalized college recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader>
                  <CardTitle>12-Factor Matching Algorithm</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-slate-600">Our proprietary algorithm analyzes multiple dimensions to find your best-fit colleges:</p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Academic Factors
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Academic performance across all systems (GPA, IB, A-levels, etc.)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Course rigor and curriculum-specific preparation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Standardized test scores and equivalencies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Program availability and quality match</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-blue-600" />
                        Personal Factors
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Extracurricular profile and achievements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Values, interests, and aspirations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Campus culture and environment fit</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Geographic and location preferences</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 text-slate-900 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Practical Factors
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Financial considerations and budget</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Scholarship and aid availability</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Admission probability assessment</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>Career outcomes and ROI</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900">AI-Powered Intelligence:</strong> Our advanced machine learning model continuously learns and adapts, analyzing thousands of data points to provide increasingly personalized and relevant college matches tailored to your unique profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 animate-fade-in-up">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader>
                  <CardTitle className="text-xl">How many colleges are in your database?</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600">
                  <p className="mb-4">
                    Our platform includes over 10,000 colleges from more than 50 countries worldwide, covering institutions in North America, Europe, Asia, Australia, and beyond.
                  </p>
                  <p>
                    All data is verified from official sources including IPEDS, Common Data Set, and government education databases.
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-2">
                <CardHeader>
                  <CardTitle className="text-xl">How does your AI-powered matching work?</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600">
                  <p className="mb-4">
                    Our AI analyzes your profile across 12 holistic factors and matches it against verified data from thousands of colleges worldwide.
                  </p>
                  <p>
                    The system uses machine learning to continuously improve recommendations based on student outcomes and institutional data from sources like Common Data Set, IPEDS, and global education databases.
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-3">
                <CardHeader>
                  <CardTitle className="text-xl">Is the college search platform free to use?</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600">
                  <p className="mb-4">
                    The platform is free to use up to a certain usage limit for all students.
                  </p>
                  <p>
                    For students enrolled in Coaching for College's premium coaching programs (Build for Success and Ace Your Apps), unlimited access is included as part of their package, along with personalized guidance from our ICA certified coaches.
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-4">
                <CardHeader>
                  <CardTitle className="text-xl">What makes this platform different from other college search tools?</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600">
                  <p className="mb-4">
                    Unlike other platforms that are typically US-centric, ours is truly global with 10,000+ colleges across 50+ countries. We understand diverse educational systems—whether you're studying IB, A-levels, American GPA, or other curricula—and how to position your achievements for international admissions.
                  </p>
                  <p>
                    More importantly, while other platforms assume students already know their preferences, our AI-powered tool guides you through a journey of self-discovery to help you understand what you're truly looking for in a college. We combine holistic matching across 12 factors with intelligent recommendations that evolve as you learn more about yourself.
                  </p>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-5">
                <CardHeader>
                  <CardTitle className="text-xl">What education systems does your platform support?</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600">
                  <p className="mb-4">
                    Our platform recognizes and evaluates achievements from diverse global high school education systems including IB Diploma, A-levels, US GPA (4.0 and 5.0 scales), AP courses, CBSE/ICSE, and other international curricula.
                  </p>
                  <p>
                    Our AI understands how to translate your academic performance into the context needed for college applications worldwide, ensuring your achievements are properly represented regardless of your educational background.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Connection to Parent Organization Services */}
        <section className="py-16 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-6">
              Need More Support? Access Our Full Coaching Programs
            </h2>
            <p className="text-xl text-center text-slate-600 mb-12 max-w-3xl mx-auto">
              While our free platform helps you discover and track college options, Coaching for College offers comprehensive programs for personalized, expert guidance throughout your journey.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                  <CardTitle className="text-2xl">Build for Success Program</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="mb-4 text-slate-600">Academic coaching and profile development to strengthen your candidacy</p>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Course selection strategy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Extracurricular planning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Summer program guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Academic skill development</span>
                    </li>
                  </ul>
                  <a href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-slate-700 hover:bg-slate-800">
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="animate-fade-in-up animate-stagger-1">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                  <CardTitle className="text-2xl">Ace Your Apps Program</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="mb-4 text-slate-600">Application strategy and personalized essay guidance from experts</p>
                  <ul className="space-y-2 text-slate-600 mb-6">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>College list optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Essay brainstorming & editing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Interview preparation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Application review</span>
                    </li>
                  </ul>
                  <a href="https://coachingforcollege.org/" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white text-slate-700 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in-up">
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
            <p className="text-slate-600 text-sm sm:text-base text-center sm:text-left">
              &copy; {new Date().getFullYear()} Coaching for College. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky CTA - appears after scrolling */}
      {showStickyCTA && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Ready to find your perfect college?</p>
              </div>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 text-white px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
