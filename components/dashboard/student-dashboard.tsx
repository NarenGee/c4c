import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Brain,
  ArrowRight,
  User as UserIcon,
  Target,
  Heart,
} from "lucide-react";
import type { User } from "@/lib/auth";
import Link from "next/link";

interface StudentDashboardProps {
  user: User;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const actionCards = [
    {
      title: "My Profile",
      description: "Complete your academic profile and preferences.",
      href: "/dashboard/profile",
      icon: UserIcon,
      bgColor: "bg-[#E5E7E8]",
      iconColor: "text-[#6698cc]",
      hoverColor: "hover:bg-[#d1d5d7]",
    },
    {
      title: "My College Recommendations",
      description: "Recommended college matches based on your profile.",
      href: "/college-recommendations",
      icon: Target,
      bgColor: "bg-[#82A8CB]/20",
      iconColor: "text-[#364C56]",
      hoverColor: "hover:bg-[#82A8CB]/30",
    },
    {
      title: "My Applications",
      description: "Manage your shortlisted colleges and applications.",
      href: "/college-list",
      icon: Heart,
      bgColor: "bg-[#6698cc]/20",
      iconColor: "text-[#364C56]",
      hoverColor: "hover:bg-[#6698cc]/30",
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-[#364C56]">
          Your College Journey Starts Here
        </h2>
        <p className="text-lg text-[#364C56]/70 max-w-2xl mx-auto">
          Take the next step towards your future. Your personalized dashboard has everything you need to find, apply to, and get into your dream college.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {actionCards.map((card) => (
          <Link href={card.href} key={card.title}>
            <Card className={`${card.bgColor} border-0 shadow-lg ${card.hoverColor} transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer h-full`}>
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${card.iconColor} mx-auto mb-4 flex items-center justify-center rounded-full bg-white shadow-md`}>
                  <card.icon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-semibold text-[#364C56]">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-sm text-[#364C56]/80 mb-4">
                  {card.description}
                </CardDescription>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#364C56]">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
