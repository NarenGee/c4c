export interface CollegeApplicationTip {
  id: string
  category: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  targetAudience?: string[] // e.g., ['first-gen', 'international', 'athlete']
}

export const collegeApplicationTips: CollegeApplicationTip[] = [
  // Academic Tips
  {
    id: 'academic-1',
    category: 'Academic',
    title: 'Maintain Strong Grades',
    description: 'Focus on maintaining or improving your GPA in your junior and senior years. Colleges look for upward trends in academic performance.',
    priority: 'high'
  },
  {
    id: 'academic-2',
    category: 'Academic',
    title: 'Challenge Yourself Academically',
    description: 'Take honors, AP, IB, or dual enrollment courses when available. Colleges value students who challenge themselves academically.',
    priority: 'high'
  },
  {
    id: 'academic-3',
    category: 'Academic',
    title: 'Build Strong Relationships with Teachers',
    description: 'Develop meaningful relationships with teachers who can write compelling recommendation letters that highlight your character and academic abilities.',
    priority: 'high'
  },

  // Standardized Testing Tips
  {
    id: 'testing-1',
    category: 'Testing',
    title: 'Test Early and Often',
    description: 'Take the SAT or ACT early in your junior year to identify areas for improvement and plan retakes if needed.',
    priority: 'high'
  },
  {
    id: 'testing-2',
    category: 'Testing',
    title: 'Focus on Your Strengths',
    description: 'If you excel in one section, focus on maximizing that score. Many colleges superscore, taking your best section scores across multiple test dates.',
    priority: 'medium'
  },
  {
    id: 'testing-3',
    category: 'Testing',
    title: 'Consider Test-Optional Schools',
    description: 'Many colleges are now test-optional. If standardized tests don\'t reflect your abilities, focus on schools that don\'t require them.',
    priority: 'medium'
  },

  // Extracurricular Tips
  {
    id: 'extracurricular-1',
    category: 'Extracurriculars',
    title: 'Quality Over Quantity',
    description: 'Focus on 2-3 meaningful extracurricular activities rather than joining many clubs. Depth and leadership matter more than breadth.',
    priority: 'high'
  },
  {
    id: 'extracurricular-2',
    category: 'Extracurriculars',
    title: 'Show Leadership and Impact',
    description: 'Take on leadership roles and demonstrate how your involvement has made a positive impact on your school or community.',
    priority: 'high'
  },
  {
    id: 'extracurricular-3',
    category: 'Extracurriculars',
    title: 'Pursue Your Passions',
    description: 'Choose activities that genuinely interest you rather than what you think colleges want to see. Authentic passion shows through in applications.',
    priority: 'medium'
  },

  // Essay Tips
  {
    id: 'essay-1',
    category: 'Essays',
    title: 'Start Early and Revise Often',
    description: 'Begin writing your essays during the summer before senior year. Allow time for multiple drafts and revisions.',
    priority: 'high'
  },
  {
    id: 'essay-2',
    category: 'Essays',
    title: 'Tell Your Unique Story',
    description: 'Use essays to share experiences, perspectives, or insights that aren\'t evident in other parts of your application.',
    priority: 'high'
  },
  {
    id: 'essay-3',
    category: 'Essays',
    title: 'Show, Don\'t Tell',
    description: 'Use specific examples and anecdotes to illustrate your points rather than making general statements about your character.',
    priority: 'medium'
  },
  {
    id: 'essay-4',
    category: 'Essays',
    title: 'Be Authentic and Personal',
    description: 'Write in your own voice and share personal experiences that have shaped who you are. Avoid generic or overly formal language.',
    priority: 'high'
  },

  // Financial Aid Tips
  {
    id: 'financial-1',
    category: 'Financial Aid',
    title: 'Complete the FAFSA Early',
    description: 'Submit your FAFSA as soon as possible after October 1st of your senior year. Some aid is awarded on a first-come, first-served basis.',
    priority: 'high',
    targetAudience: ['first-gen', 'financial-aid-needed']
  },
  {
    id: 'financial-2',
    category: 'Financial Aid',
    title: 'Research Institutional Aid',
    description: 'Look into merit scholarships and need-based aid offered directly by colleges. Each school has different aid programs and deadlines.',
    priority: 'high'
  },
  {
    id: 'financial-3',
    category: 'Financial Aid',
    title: 'Apply for External Scholarships',
    description: 'Research and apply for scholarships from local organizations, corporations, and foundations. Start early and apply to many opportunities.',
    priority: 'medium'
  },

  // Application Strategy Tips
  {
    id: 'strategy-1',
    category: 'Strategy',
    title: 'Create a Balanced College List',
    description: 'Apply to a mix of reach, target, and safety schools. Aim for 2-3 in each category to maximize your options.',
    priority: 'high'
  },
  {
    id: 'strategy-2',
    category: 'Strategy',
    title: 'Research College Fit',
    description: 'Consider academic programs, campus culture, location, size, and other factors that matter to you beyond just rankings.',
    priority: 'high'
  },
  {
    id: 'strategy-3',
    category: 'Strategy',
    title: 'Meet All Deadlines',
    description: 'Create a detailed calendar with all application deadlines, test dates, and other important dates. Missing deadlines can disqualify you.',
    priority: 'high'
  },
  {
    id: 'strategy-4',
    category: 'Strategy',
    title: 'Demonstrate Interest',
    description: 'Visit campuses, attend virtual events, contact admissions officers, and engage with colleges that track demonstrated interest.',
    priority: 'medium'
  },

  // First-Generation Student Tips
  {
    id: 'firstgen-1',
    category: 'First-Generation',
    title: 'Seek Support and Resources',
    description: 'Connect with school counselors, college access programs, and first-gen student organizations for guidance and support.',
    priority: 'high',
    targetAudience: ['first-gen']
  },
  {
    id: 'firstgen-2',
    category: 'First-Generation',
    title: 'Ask Questions',
    description: 'Don\'t hesitate to ask questions about the college application process. Many resources are available to help first-gen students.',
    priority: 'high',
    targetAudience: ['first-gen']
  },
  {
    id: 'firstgen-3',
    category: 'First-Generation',
    title: 'Highlight Your Journey',
    description: 'Use your essays to share how being first-gen has shaped your perspective and motivated your educational goals.',
    priority: 'medium',
    targetAudience: ['first-gen']
  },

  // International Student Tips
  {
    id: 'international-1',
    category: 'International',
    title: 'Understand Visa Requirements',
    description: 'Research F-1 visa requirements early and ensure you understand the process for studying in the US.',
    priority: 'high',
    targetAudience: ['international']
  },
  {
    id: 'international-2',
    category: 'International',
    title: 'Prepare for English Proficiency Tests',
    description: 'Take TOEFL, IELTS, or other required English proficiency tests well in advance of application deadlines.',
    priority: 'high',
    targetAudience: ['international']
  },
  {
    id: 'international-3',
    category: 'International',
    title: 'Research Financial Aid for International Students',
    description: 'Many colleges offer limited financial aid to international students. Research options and consider cost when building your college list.',
    priority: 'high',
    targetAudience: ['international']
  },

  // Timeline Tips
  {
    id: 'timeline-1',
    category: 'Timeline',
    title: 'Start Planning in Junior Year',
    description: 'Begin researching colleges, preparing for standardized tests, and building relationships with teachers during your junior year.',
    priority: 'high'
  },
  {
    id: 'timeline-2',
    category: 'Timeline',
    title: 'Summer Before Senior Year',
    description: 'Use the summer to visit colleges, start essays, prepare for fall standardized tests, and finalize your college list.',
    priority: 'high'
  },
  {
    id: 'timeline-3',
    category: 'Timeline',
    title: 'Early Application Options',
    description: 'Consider Early Action or Early Decision if you have a clear first choice. These can increase admission chances and provide earlier decisions.',
    priority: 'medium'
  },

  // Interview Tips
  {
    id: 'interview-1',
    category: 'Interviews',
    title: 'Prepare for College Interviews',
    description: 'Practice common interview questions, prepare thoughtful questions to ask, and be ready to discuss your interests and goals.',
    priority: 'medium'
  },
  {
    id: 'interview-2',
    category: 'Interviews',
    title: 'Be Yourself',
    description: 'Use interviews as an opportunity to show your personality and genuine interest in the college. Authenticity is key.',
    priority: 'medium'
  },

  // Decision Making Tips
  {
    id: 'decision-1',
    category: 'Decision Making',
    title: 'Compare Financial Aid Packages',
    description: 'Carefully compare financial aid offers from different schools. Consider total cost, not just tuition, when making your decision.',
    priority: 'high'
  },
  {
    id: 'decision-2',
    category: 'Decision Making',
    title: 'Visit Your Top Choices',
    description: 'If possible, visit your top college choices to get a feel for campus life, academic programs, and overall fit.',
    priority: 'medium'
  },
  {
    id: 'decision-3',
    category: 'Decision Making',
    title: 'Trust Your Instincts',
    description: 'After considering all factors, trust your instincts about where you\'ll be happiest and most successful. Fit matters more than prestige.',
    priority: 'medium'
  }
]

// Helper functions for tip management
export function getTipsByCategory(category: string): CollegeApplicationTip[] {
  return collegeApplicationTips.filter(tip => tip.category === category)
}

export function getTipsByPriority(priority: 'high' | 'medium' | 'low'): CollegeApplicationTip[] {
  return collegeApplicationTips.filter(tip => tip.priority === priority)
}

export function getTipsForAudience(audiences: string[]): CollegeApplicationTip[] {
  return collegeApplicationTips.filter(tip => 
    !tip.targetAudience || 
    audiences.some(audience => tip.targetAudience!.includes(audience))
  )
}

export function getRandomTip(audiences?: string[]): CollegeApplicationTip {
  const filteredTips = audiences ? getTipsForAudience(audiences) : collegeApplicationTips
  const randomIndex = Math.floor(Math.random() * filteredTips.length)
  return filteredTips[randomIndex]
}

export function getRandomTips(count: number, audiences?: string[]): CollegeApplicationTip[] {
  const filteredTips = audiences ? getTipsForAudience(audiences) : collegeApplicationTips
  const shuffled = [...filteredTips].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

