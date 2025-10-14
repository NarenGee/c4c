"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationModal } from "@/components/ui/conversation-modal";
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Plus,
  StickyNote,
  Target,
  Heart,
  User as UserIcon,
  BookOpen,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  FileText,
  GraduationCap,
  Globe,
  MapPin,
  Languages,
  Award,
  ChevronDown,
  CheckSquare,
  Lightbulb,
  ArrowRight,
  Home,
  Trash2,
  Edit3,
  Star,
  AlertTriangle,
} from "lucide-react";
import type { User } from "@/lib/auth";
import Link from "next/link";

interface StudentDashboardProps {
  user: User;
}

interface Note {
  id: string;
  content: string;
  author: string;
  author_id?: string;
  type: 'note' | 'action';
  created_at: string;
  college_name?: string;
  country?: string;
  action_status?: 'not_started' | 'in_progress' | 'complete';
  priority?: 'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'not_urgent_not_important';
  due_date?: string;
  visible_to_student?: boolean;
  parent_note_id?: string;
  is_reply?: boolean;
}

interface AppTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: any;
  status: 'not_started' | 'in_progress' | 'completed';
  autoDerived: boolean;
}

interface TimelineTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  estimatedTime: string;
  dependencies: string[];
  resources: { name: string; url: string }[];
}

interface TimelinePhase {
  id: string;
  name: string;
  months: string;
  description: string;
  regions: string[];
  type: 'preparation' | 'application' | 'decision' | 'enrollment';
  isActive: boolean;
  progress: number; // 0-100
  tasks: TimelineTask[];
  milestones: string[];
  tips: string[];
  estimatedDuration: string;
}

export function EnhancedStudentDashboard({ user }: StudentDashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState<'note' | 'action'>('note');
  const [newNotePriority, setNewNotePriority] = useState<'urgent_important' | 'important_not_urgent' | 'urgent_not_important' | 'not_urgent_not_important'>('important_not_urgent');
  const [newNoteDueDate, setNewNoteDueDate] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [timelinePhases, setTimelinePhases] = useState<TimelinePhase[]>([]);
  const [appTasks, setAppTasks] = useState<AppTask[]>([]);
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'priority' | 'status'>('date_asc');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showConversation, setShowConversation] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<{ note: Note; replies: Note[] } | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const savedTaskStatesRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      // Load saved task states FIRST and store in ref
      await loadSavedTaskStates();
      // Initialize tasks with saved states already loaded
      await loadStudentData();
      // Load notes
      await loadSavedNotes();
      // Mark as initialized so auto-save can work
      isInitializedRef.current = true;
    };
    initializeData();
  }, []);

  // Auto-save task states to backend (but not on initial load)
  useEffect(() => {
    if (appTasks.length > 0 && isInitializedRef.current) {
      saveTaskStates();
    }
  }, [appTasks]);

  // Auto-save notes to backend (but not on initial load)
  useEffect(() => {
    if (notes.length > 0 && isInitializedRef.current) {
      saveNotes();
    }
  }, [notes]);

  const loadSavedTaskStates = async () => {
    try {
      const response = await fetch('/api/student/dashboard/tasks');
      if (response.ok) {
        const data = await response.json();
        const taskStates = data.taskStates;
        
        // Store saved states in ref so they can be applied during task initialization
        if (taskStates && taskStates.length > 0) {
          savedTaskStatesRef.current = taskStates;
          console.log('Loaded saved task states:', taskStates);
        }
      }
    } catch (error) {
      console.error('Error loading saved task states:', error);
    }
  };

  const loadSavedNotes = async () => {
    try {
      console.log('Loading saved notes...');
      const response = await fetch('/api/student/dashboard/notes');
      console.log('Notes API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notes API response data:', data);
        setNotes(data.notes || []);
      } else {
        const errorText = await response.text();
        console.error('Notes API error response:', errorText);
      }
    } catch (error) {
      console.error('Error loading saved notes:', error);
    }
  };

  const saveTaskStates = async () => {
    try {
      const taskStates = appTasks.map(task => ({
        id: task.id,
        completed: task.completed,
        status: task.status
      }));

      await fetch('/api/student/dashboard/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskStates }),
      });
    } catch (error) {
      console.error('Error saving task states:', error);
    }
  };

  const saveNotes = async () => {
    try {
      console.log('Saving notes to backend:', notes);
      const response = await fetch('/api/student/dashboard/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (response.ok) {
        console.log('Notes saved successfully');
      } else {
        const errorText = await response.text();
        console.error('Error saving notes:', errorText);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const loadStudentData = async () => {
    // Load notes from backend - no mock data needed
    // Notes will be loaded by loadSavedNotes() which is called in useEffect

    setTimelinePhases([
      {
        id: "1",
        name: "Pre-Application Phase",
        months: "August 1 - October 31",
        description: "Research universities, prepare documents, take standardized tests",
        regions: ["Global"],
        type: 'preparation',
        isActive: true,
        progress: 25,
        estimatedDuration: "3 months",
        milestones: ["Complete standardized tests", "Finalize college list", "Request transcripts"],
        tips: ["Start early with test preparation", "Visit campuses virtually or in person", "Connect with current students"],
        tasks: [
          {
            id: "1-1",
            title: "Take/Retake Standardized Tests",
            description: "Complete SAT, ACT, or other required tests",
            deadline: "October 15",
            priority: 'high',
            status: 'pending',
            estimatedTime: "2-3 months preparation",
            dependencies: [],
            resources: [
              { name: "SAT Prep", url: "https://collegereadiness.collegeboard.org/sat" },
              { name: "ACT Prep", url: "https://www.act.org/" }
            ]
          },
          {
            id: "1-2",
            title: "Research Target Colleges",
            description: "Create comprehensive list of reach, match, and safety schools",
            deadline: "September 30",
            priority: 'high',
            status: 'pending',
            estimatedTime: "4-6 weeks",
            dependencies: [],
            resources: [
              { name: "College Board", url: "https://bigfuture.collegeboard.org/" },
              { name: "Common Data Set", url: "https://www.commondataset.org/" }
            ]
          },
          {
            id: "1-3",
            title: "Request Official Transcripts",
            description: "Order official transcripts from all high schools attended",
            deadline: "October 20",
            priority: 'medium',
            status: 'pending',
            estimatedTime: "1-2 weeks",
            dependencies: [],
            resources: []
          },
          {
            id: "1-4",
            title: "Draft Personal Statement",
            description: "Begin working on Common App personal statement",
            deadline: "October 31",
            priority: 'high',
            status: 'pending',
            estimatedTime: "6-8 weeks",
            dependencies: [],
            resources: [
              { name: "Common App", url: "https://www.commonapp.org/" }
            ]
          }
        ]
      },
      {
        id: "2",
        name: "Early Application Period",
        months: "November 1 - December 15",
        description: "Early decision/action applications, early scholarship deadlines",
        regions: ["North America", "Europe", "Asia"],
        type: 'application',
        isActive: false,
        progress: 0,
        estimatedDuration: "1.5 months",
        milestones: ["Submit early applications", "Complete financial aid forms", "Request letters of recommendation"],
        tips: ["Apply to your top choice early decision", "Meet with your counselor regularly", "Keep track of all deadlines"],
        tasks: [
          {
            id: "2-1",
            title: "Submit Early Decision/Action Applications",
            description: "Complete and submit applications with November 1 deadlines",
            deadline: "November 1",
            priority: 'high',
            status: 'pending',
            estimatedTime: "2-3 weeks",
            dependencies: ["1-4"],
            resources: []
          },
          {
            id: "2-2",
            title: "Complete CSS Profile",
            description: "Submit CSS Profile for financial aid consideration",
            deadline: "November 15",
            priority: 'high',
            status: 'pending',
            estimatedTime: "1 week",
            dependencies: [],
            resources: [
              { name: "CSS Profile", url: "https://cssprofile.collegeboard.org/" }
            ]
          },
          {
            id: "2-3",
            title: "Request Letters of Recommendation",
            description: "Ask teachers and counselors for recommendation letters",
            deadline: "November 10",
            priority: 'high',
            status: 'pending',
            estimatedTime: "2-3 weeks",
            dependencies: [],
            resources: []
          },
          {
            id: "2-4",
            title: "Submit Mid-Year Reports",
            description: "Send updated transcripts with senior year grades",
            deadline: "December 1",
            priority: 'medium',
            status: 'pending',
            estimatedTime: "1 week",
            dependencies: ["1-3"],
            resources: []
          }
        ]
      },
      {
        id: "3",
        name: "Regular Decision Period",
        months: "January 1 - February 15",
        description: "Regular decision applications, most university deadlines",
        regions: ["Global"],
        type: 'application',
        isActive: false,
        progress: 0,
        estimatedDuration: "1.5 months",
        milestones: ["Submit regular applications", "Complete FAFSA", "Apply for scholarships"],
        tips: ["Don't wait until the last minute", "Review all applications carefully", "Apply to multiple schools"],
        tasks: [
          {
            id: "3-1",
            title: "Submit Regular Decision Applications",
            description: "Complete applications for January 1-15 deadlines",
            deadline: "January 15",
            priority: 'high',
            status: 'pending',
            estimatedTime: "2-3 weeks",
            dependencies: ["1-4", "2-3"],
            resources: []
          },
          {
            id: "3-2",
            title: "Complete FAFSA",
            description: "Submit Free Application for Federal Student Aid",
            deadline: "January 1",
            priority: 'high',
            status: 'pending',
            estimatedTime: "1-2 hours",
            dependencies: [],
            resources: [
              { name: "FAFSA", url: "https://studentaid.gov/h/apply-for-aid/fafsa" }
            ]
          },
          {
            id: "3-3",
            title: "Apply for Merit Scholarships",
            description: "Submit applications for university and external scholarships",
            deadline: "February 1",
            priority: 'medium',
            status: 'pending',
            estimatedTime: "2-4 weeks",
            dependencies: [],
            resources: []
          },
          {
            id: "3-4",
            title: "Submit Final Applications",
            description: "Complete any remaining applications with February deadlines",
            deadline: "February 15",
            priority: 'medium',
            status: 'pending',
            estimatedTime: "1-2 weeks",
            dependencies: ["3-1"],
            resources: []
          }
        ]
      },
      {
        id: "4",
        name: "Decision & Waitlist Period",
        months: "March 1 - May 1",
        description: "Receive admission decisions, compare offers, handle waitlists",
        regions: ["Global"],
        type: 'decision',
        isActive: false,
        progress: 0,
        estimatedDuration: "2 months",
        milestones: ["Receive all decisions", "Compare financial aid packages", "Make final choice"],
        tips: ["Visit admitted schools if possible", "Compare costs carefully", "Respond to waitlists promptly"],
        tasks: [
          {
            id: "4-1",
            title: "Receive Early Decision Results",
            description: "Check for early decision notifications",
            deadline: "March 15",
            priority: 'high',
            status: 'pending',
            estimatedTime: "Ongoing",
            dependencies: ["2-1"],
            resources: []
          },
          {
            id: "4-2",
            title: "Receive Regular Decision Results",
            description: "Check for regular decision notifications",
            deadline: "April 1",
            priority: 'high',
            status: 'pending',
            estimatedTime: "Ongoing",
            dependencies: ["3-1"],
            resources: []
          },
          {
            id: "4-3",
            title: "Compare Financial Aid Packages",
            description: "Analyze and compare aid offers from all schools",
            deadline: "April 15",
            priority: 'high',
            status: 'pending',
            estimatedTime: "1-2 weeks",
            dependencies: ["4-1", "4-2"],
            resources: []
          },
          {
            id: "4-4",
            title: "Make Final College Choice",
            description: "Accept admission offer and submit enrollment deposit",
            deadline: "May 1",
            priority: 'high',
            status: 'pending',
            estimatedTime: "1 week",
            dependencies: ["4-3"],
            resources: []
          }
        ]
      },
      {
        id: "5",
        name: "Enrollment & Preparation",
        months: "May 1 - August 31",
        description: "Complete enrollment, apply for visas, prepare for college",
        regions: ["Global"],
        type: 'enrollment',
        isActive: false,
        progress: 0,
        estimatedDuration: "4 months",
        milestones: ["Complete enrollment", "Apply for student visa", "Prepare for move-in"],
        tips: ["Complete all enrollment requirements", "Apply for housing early", "Connect with future classmates"],
        tasks: [
          {
            id: "5-1",
            title: "Complete Enrollment Requirements",
            description: "Submit final transcripts, health forms, and other requirements",
            deadline: "June 1",
            priority: 'high',
            status: 'pending',
            estimatedTime: "2-3 weeks",
            dependencies: ["4-4"],
            resources: []
          },
          {
            id: "5-2",
            title: "Apply for Student Visa",
            description: "Complete visa application for international students",
            deadline: "July 1",
            priority: 'high',
            status: 'pending',
            estimatedTime: "4-6 weeks",
            dependencies: ["4-4"],
            resources: [
              { name: "US Visa Info", url: "https://travel.state.gov/" }
            ]
          },
          {
            id: "5-3",
            title: "Apply for Housing",
            description: "Submit housing application and preferences",
            deadline: "May 15",
            priority: 'medium',
            status: 'pending',
            estimatedTime: "1-2 weeks",
            dependencies: ["4-4"],
            resources: []
          },
          {
            id: "5-4",
            title: "Prepare for College Life",
            description: "Complete orientation, buy supplies, and prepare for move-in",
            deadline: "August 31",
            priority: 'medium',
            status: 'pending',
            estimatedTime: "4-6 weeks",
            dependencies: ["5-1"],
            resources: []
          }
        ]
      }
    ]);

    // Initialize tasks with saved states from ref
    const initialTasks = [
      {
        id: "1",
        title: "Complete Student Profile",
        description: "Add your academic information, test scores, and preferences",
        completed: false,
        href: "/dashboard/profile",
        icon: UserIcon,
        status: 'not_started' as const,
        autoDerived: true,
      },
      {
        id: "2",
        title: "Add Dream Colleges",
        description: "Add your target universities to your college list",
        completed: false,
        href: "/dashboard/profile#dream-colleges",
        icon: Heart,
        status: 'not_started' as const,
        autoDerived: true,
      },
      {
        id: "3",
        title: "Generate Recommendations",
        description: "Get AI-powered college recommendations based on your profile",
        completed: false,
        href: "/dashboard/profile#recommendations",
        icon: Target,
        status: 'not_started' as const,
        autoDerived: true,
      },
      {
        id: "4",
        title: "Add Recommendations to List",
        description: "Add recommended colleges to your application list",
        completed: false,
        href: "/college-recommendations",
        icon: BookOpen,
        status: 'not_started' as const,
        autoDerived: true,
      },
      {
        id: "5",
        title: "Speak to Coach",
        description: "Connect with your assigned coach for guidance",
        completed: false,
        href: "https://cal.com/coachingforcollege/preliminary-meeting?overlayCalendar=true",
        icon: MessageSquare,
        status: 'not_started' as const,
        autoDerived: false,
      },
    ];
    
    // Apply saved states from ref if they exist
    const tasksWithSavedStates = initialTasks.map(task => {
      const savedState = savedTaskStatesRef.current.find((state: any) => state.task_id === task.id);
      if (savedState) {
        console.log(`Applying saved state for task ${task.id}:`, savedState);
        return {
          ...task,
          completed: savedState.completed,
          status: savedState.status
        };
      }
      return task;
    });
    
    setAppTasks(tasksWithSavedStates);
  };

  const checkTaskCompletion = async () => {
    try {
      // In a real implementation, these would be API calls to check user's actual data
      // For now, we'll use mock data to simulate checking user profile completion
      
      // Mock: Check if student profile is complete
      const isProfileComplete = user.grade_level && user.gpa && user.interests && user.interests.length > 0;
      
      // Mock: Check if student has dream colleges (this would check the dream colleges table)
      const hasDreamColleges = Math.random() > 0.5; // Mock: 50% chance of having dream colleges
      
      // Mock: Check if student has generated recommendations (this would check recommendations table)
      const hasRecommendations = Math.random() > 0.3; // Mock: 70% chance of having recommendations
      
      // Mock: Check if student has added recommendations to their list (this would check college list table)
      const hasAddedRecommendations = Math.random() > 0.4; // Mock: 60% chance of having added recommendations
      
      // Update task completion status based on actual data
      setAppTasks(prev => prev.map(task => {
        if (!task.autoDerived) return task; // Don't auto-update non-auto-derived tasks
        
        let isCompleted = false;
        let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
        
        switch (task.id) {
          case "1": // Complete Student Profile
            isCompleted = isProfileComplete;
            status = isProfileComplete ? 'completed' : (user.grade_level ? 'in_progress' : 'not_started');
            break;
          case "2": // Add Dream Colleges
            isCompleted = hasDreamColleges;
            status = hasDreamColleges ? 'completed' : 'not_started';
            break;
          case "3": // Generate Recommendations
            isCompleted = hasRecommendations;
            status = hasRecommendations ? 'completed' : (isProfileComplete ? 'in_progress' : 'not_started');
            break;
          case "4": // Add Recommendations to List
            isCompleted = hasAddedRecommendations;
            status = hasAddedRecommendations ? 'completed' : (hasRecommendations ? 'in_progress' : 'not_started');
            break;
          default:
            return task;
        }
        
        return {
          ...task,
          completed: isCompleted,
          status: status
        };
      }));
    } catch (error) {
      console.error('Error checking task completion:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    // Generate a proper UUID for the note
    const noteId = crypto.randomUUID();
    
    const note: Note = {
      id: noteId,
      content: newNote.trim(),
      author: user.full_name || "You",
      author_id: user.id,
      type: newNoteType,
      created_at: new Date().toISOString(),
      action_status: newNoteType === 'action' ? 'not_started' : undefined,
      priority: newNoteType === 'action' ? newNotePriority : undefined,
      due_date: newNoteType === 'action' && newNoteDueDate ? newNoteDueDate : undefined,
      visible_to_student: true, // Student's own notes are always visible to them
      is_reply: false,
    };
    
    // Add to local state immediately for responsive UI
    setNotes(prev => [note, ...prev]);
    setNewNote("");
    setNewNoteDueDate("");
    
    // Save to backend
    await saveNotes();
  };

  const replyToNote = (parentNoteId: string) => {
    setReplyingTo(parentNoteId);
    setReplyContent("");
  };

  const submitReply = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    
    // Generate a proper UUID for the reply
    const replyId = crypto.randomUUID();
    
    const reply: Note = {
      id: replyId,
      content: replyContent.trim(),
      author: user.full_name || "You",
      author_id: user.id,
      type: 'note',
      created_at: new Date().toISOString(),
      parent_note_id: replyingTo,
      is_reply: true,
      visible_to_student: true,
    };
    
    // Add to local state immediately for responsive UI
    setNotes(prev => [reply, ...prev]);
    setReplyingTo(null);
    setReplyContent("");
    
    // Save to backend
    await saveNotes();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const openConversation = (conversation: { note: Note; replies: Note[] }) => {
    setSelectedConversation(conversation);
    setShowConversation(true);
  };

  const closeConversation = () => {
    setShowConversation(false);
    setSelectedConversation(null);
  };

  const handleReply = async (parentNoteId: string, content: string) => {
    // Generate a proper UUID for the reply
    const replyId = crypto.randomUUID();
    
    const reply: Note = {
      id: replyId,
      content: content.trim(),
      author: user.full_name || "You",
      author_id: user.id,
      type: 'note',
      created_at: new Date().toISOString(),
      parent_note_id: parentNoteId,
      is_reply: true,
      visible_to_student: true,
    };
    
    // Add to local state immediately for responsive UI
    setNotes(prev => [reply, ...prev]);
    
    // Save to backend
    await saveNotes();
  };

  const handleMessageAdded = () => {
    // Reload notes from backend to get the latest data
    loadSavedNotes();
  };

  const toggleTask = (taskId: string) => {
    setAppTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;
          const newStatus = newCompleted ? 'completed' : 'not_started';
          return { 
            ...task, 
            completed: newCompleted,
            status: newStatus
          };
        }
        return task;
      })
    );
  };

  const overrideTaskStatus = (taskId: string, status: 'not_started' | 'in_progress' | 'completed') => {
    setAppTasks(prev =>
      prev.map(task => {
        if (task.id === taskId) {
          return { 
            ...task, 
            completed: status === 'completed',
            status: status
          };
        }
        return task;
      })
    );
  };

  const updateActionStatus = async (noteId: string, status: 'not_started' | 'in_progress' | 'complete') => {
    // Update local state immediately for responsive UI
    setNotes(prev =>
      prev.map(note =>
        note.id === noteId
          ? { ...note, action_status: status }
          : note
      )
    );
    
    // Save to backend
    await saveNotes();
  };

  const editNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setEditingNote(noteId);
      setEditingContent(note.content);
    }
  };

  const saveEdit = async () => {
    if (editingNote && editingContent.trim()) {
      // Update local state immediately for responsive UI
      setNotes(prev =>
        prev.map(note =>
          note.id === editingNote
            ? { ...note, content: editingContent.trim() }
            : note
        )
      );
      setEditingNote(null);
      setEditingContent("");
      
      // Save to backend
      await saveNotes();
    }
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditingContent("");
  };

  const deleteNote = async (noteId: string) => {
    // Update local state immediately for responsive UI
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    // Save to backend
    await saveNotes();
  };

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent_important': return 'bg-red-100 text-red-800 border-red-200';
      case 'important_not_urgent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'urgent_not_important': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_urgent_not_important': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent_important': return <AlertTriangle className="h-4 w-4" />;
      case 'important_not_urgent': return <Star className="h-4 w-4" />;
      case 'urgent_not_important': return <Clock className="h-4 w-4" />;
      case 'not_urgent_not_important': return <Circle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'preparation': return <BookOpen className="h-4 w-4" />;
      case 'application': return <FileText className="h-4 w-4" />;
      case 'decision': return <Target className="h-4 w-4" />;
      case 'enrollment': return <GraduationCap className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'preparation': return 'bg-blue-100 text-blue-600';
      case 'application': return 'bg-green-100 text-green-600';
      case 'decision': return 'bg-purple-100 text-purple-600';
      case 'enrollment': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };


  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const completedTasks = appTasks.filter(task => task.completed).length;
  const totalTasks = appTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getSortedNotes = (notes: Note[]) => {
    return [...notes].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime();
        case 'date_desc':
          return new Date(b.due_date || b.created_at).getTime() - new Date(a.due_date || a.created_at).getTime();
        case 'priority':
          const priorityOrder = {
            'urgent_important': 1,
            'important_not_urgent': 2,
            'urgent_not_important': 3,
            'not_urgent_not_important': 4
          };
          return (priorityOrder[a.priority as keyof typeof priorityOrder] || 5) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 5);
        case 'status':
          const statusOrder = {
            'not_started': 1,
            'in_progress': 2,
            'complete': 3
          };
          return (statusOrder[a.action_status as keyof typeof statusOrder] || 4) - (statusOrder[b.action_status as keyof typeof statusOrder] || 4);
        default:
          return 0;
      }
    });
  };

  // Group notes and replies into conversations
  const groupNotesIntoConversations = (notesList: Note[]) => {
    const conversations: { [key: string]: { note: Note; replies: Note[] } } = {};
    
    // First, deduplicate notes by ID to prevent duplicate keys
    const uniqueNotes = notesList.reduce((acc, note) => {
      if (!acc.find(n => n.id === note.id)) {
        acc.push(note);
      }
      return acc;
    }, [] as Note[]);
    
    uniqueNotes.forEach(note => {
      if (note.is_reply && note.parent_note_id) {
        // This is a reply
        if (!conversations[note.parent_note_id]) {
          // Find the parent note in the same notesList
          const parentNote = uniqueNotes.find(n => n.id === note.parent_note_id);
          if (parentNote) {
            conversations[note.parent_note_id] = { note: parentNote, replies: [] };
          }
        }
        if (conversations[note.parent_note_id]) {
          // Check if this reply is already added to prevent duplicates
          const existingReply = conversations[note.parent_note_id].replies.find(r => r.id === note.id);
          if (!existingReply) {
            conversations[note.parent_note_id].replies.push(note);
          }
        }
      } else {
        // This is a main note
        if (!conversations[note.id]) {
          conversations[note.id] = { note, replies: [] };
        }
      }
    });
    
    return Object.values(conversations);
  };

  const myNotesList = getSortedNotes(notes.filter(note => note.type === 'note' && !note.is_reply && note.author_id === user.id));
  const myActionsList = getSortedNotes(notes.filter(note => note.type === 'action' && !note.is_reply && note.author_id === user.id));
  const coachNotesList = getSortedNotes(notes.filter(note => note.type === 'note' && !note.is_reply && note.author_id !== user.id && note.visible_to_student));
  const coachActionsList = getSortedNotes(notes.filter(note => note.type === 'action' && !note.is_reply && note.author_id !== user.id && note.visible_to_student));

  // Group conversations - separate student's own notes from coach conversations
  const myNotesConversations = groupNotesIntoConversations(notes.filter(note => 
    note.type === 'note' && 
    note.author_id === user.id && 
    !note.is_reply // Only main notes, not replies to coach messages
  ));
  
  const coachNotesConversations = groupNotesIntoConversations(notes.filter(note => 
    note.type === 'note' && 
    note.author_id !== user.id && 
    note.visible_to_student
  ).concat(notes.filter(note => 
    note.type === 'note' && 
    note.is_reply && 
    note.parent_note_id && 
    notes.find(n => n.id === note.parent_note_id && n.author_id !== user.id) // Reply to coach message
  )));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5E7E8] via-[#f5f6f7] to-[#E5E7E8]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Tabs */}
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-xl rounded-xl border border-slate-200">
              <TabsTrigger value="home" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg px-2 sm:px-3">
                <Home className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Home</span>
                <span className="sm:hidden text-xs">Home</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg px-2 sm:px-3">
                <StickyNote className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Notes & Actions</span>
                <span className="sm:hidden text-xs">Notes</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white rounded-lg px-2 sm:px-3">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Application Timeline</span>
                <span className="sm:hidden text-xs">Timeline</span>
              </TabsTrigger>
            </TabsList>

            {/* Home Tab */}
            <TabsContent value="home" className="space-y-6">
              <Card className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 overflow-visible">
                <CardHeader className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold tracking-wide leading-tight">
                    Complete these steps to get the most out of the platform
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8 pt-4 sm:pt-6 lg:pt-8">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600 mb-2">
                      <span>Your progress: {completedTasks}/{totalTasks} tasks completed</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  
                  <div className="space-y-4">
                    {appTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border ${
                          task.completed ? 'bg-green-50 border-green-200' : 'bg-white/80 border-slate-200'
                        }`}
                      >
                        {/* Header row: left icon/title, right primary action */}
                        <div className="flex items-start gap-3 mb-3">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {task.completed ? (
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <task.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-base sm:text-lg font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                  {task.title}
                                </h4>
                              </div>
                            </div>
                          </div>
                          {/* Primary action button aligned to the top-right */}
                          <div className="ml-auto hidden sm:block">
                            {(() => {
                              let href = task.href;
                              if (task.completed && (task.id === "3" || task.id === "4")) {
                                href = "/college-list";
                              }
                              if (href.startsWith('http')) {
                                return (
                                  <a href={href} target="_blank" rel="noopener noreferrer">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                      {task.completed ? 'View' : 'Get Started'}
                                      <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </a>
                                );
                              }
                              return (
                                <Link href={href}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    {task.completed ? 'View' : 'Get Started'}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </Link>
                              );
                            })()}
                          </div>
                        </div>
                        {/* Description under header */}
                        <p className="text-sm text-slate-600 mb-3 sm:mb-4">{task.description}</p>
                        
                        {/* Status buttons row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Mobile-only primary action button */}
                          <div className="sm:hidden">
                            {(() => {
                              let href = task.href;
                              if (task.completed && (task.id === "3" || task.id === "4")) {
                                href = "/college-list";
                              }
                              if (href.startsWith('http')) {
                                return (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                      {task.completed ? 'View' : 'Get Started'}
                                      <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </a>
                                );
                              }
                              return (
                                <Link href={href} className="w-full">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    {task.completed ? 'View' : 'Get Started'}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </Link>
                              );
                            })()}
                          </div>

                          {/* Status Override for All Tasks */}
                          <div className="flex gap-1 sm:gap-2 flex-wrap justify-center sm:justify-start">
                            <Button
                              size="sm"
                              variant={task.status === 'not_started' ? 'default' : 'outline'}
                              onClick={() => overrideTaskStatus(task.id, 'not_started')}
                              className={`text-xs sm:text-sm ${task.status === 'not_started' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}`}
                            >
                              <span className="hidden sm:inline">Not Started</span>
                              <span className="sm:hidden">Not Started</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={task.status === 'in_progress' ? 'default' : 'outline'}
                              onClick={() => overrideTaskStatus(task.id, 'in_progress')}
                              className={`text-xs sm:text-sm ${task.status === 'in_progress' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}`}
                            >
                              <span className="hidden sm:inline">In Progress</span>
                              <span className="sm:hidden">In Progress</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={task.status === 'completed' ? 'default' : 'outline'}
                              onClick={() => overrideTaskStatus(task.id, 'completed')}
                              className={`text-xs sm:text-sm ${task.status === 'completed' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}`}
                            >
                              <span className="hidden sm:inline">Complete</span>
                              <span className="sm:hidden">Complete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes & Actions Tab */}
            <TabsContent value="notes" className="space-y-6">
              <Card className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 overflow-visible">
                <CardHeader className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <StickyNote className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-200 flex-shrink-0" />
                  <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold tracking-wide leading-tight">
                    Notes & Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8 pt-4 sm:pt-6 lg:pt-8">
                      {/* Add Note Form */}
                      <div className="mb-6 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Textarea
                            placeholder="Add a note or action item..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="flex-1 border-2 rounded-lg bg-white/80 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            rows={2}
                          />
                          <Button
                            onClick={addNote}
                            disabled={!newNote.trim()}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 sm:self-start"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {newNoteType === 'action' && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              type="date"
                              placeholder="Due date (optional)"
                              value={newNoteDueDate}
                              onChange={(e) => setNewNoteDueDate(e.target.value)}
                              className="w-full sm:w-48 border-2 rounded-lg bg-white/80 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={newNoteType === 'note' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewNoteType('note')}
                            className={newNoteType === 'note' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                          >
                            Note
                          </Button>
                          <Button
                            variant={newNoteType === 'action' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewNoteType('action')}
                            className={newNoteType === 'action' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                          >
                            Action
                          </Button>
                        </div>
                        {newNoteType === 'action' && (
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <Button
                              variant={newNotePriority === 'urgent_important' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNewNotePriority('urgent_important')}
                              className="text-xs sm:text-sm"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Urgent & Important</span>
                              <span className="sm:hidden">Urgent & Important</span>
                            </Button>
                            <Button
                              variant={newNotePriority === 'important_not_urgent' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNewNotePriority('important_not_urgent')}
                              className="text-xs sm:text-sm"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Important</span>
                              <span className="sm:hidden">Important</span>
                            </Button>
                            <Button
                              variant={newNotePriority === 'urgent_not_important' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNewNotePriority('urgent_not_important')}
                              className="text-xs sm:text-sm"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Urgent</span>
                              <span className="sm:hidden">Urgent</span>
                            </Button>
                            <Button
                              variant={newNotePriority === 'not_urgent_not_important' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNewNotePriority('not_urgent_not_important')}
                              className="text-xs sm:text-sm"
                            >
                              <Circle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Low Priority</span>
                              <span className="sm:hidden">Low Priority</span>
                            </Button>
                          </div>
                        )}
                  </div>

                  {/* My Notes Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">My Notes</h3>
                    {myNotesConversations.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No notes yet</p>
                    ) : (
                      <div className="space-y-4">
                        {myNotesConversations.map((conversation) => (
                          <div key={conversation.note.id} className="space-y-3">
                            {/* Main Note */}
                            <div className="p-4 rounded-lg border bg-white/90 border-slate-200 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs">Note</Badge>
                                  <span className="text-sm text-slate-600">{conversation.note.author}</span>
                                  {conversation.note.college_name && (
                                    <span className="text-sm text-slate-600">• {conversation.note.college_name}</span>
                                  )}
                                  {conversation.note.country && (
                                    <span className="text-sm text-slate-600 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {conversation.note.country}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">
                                    {new Date(conversation.note.created_at).toLocaleDateString()}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editNote(conversation.note.id)}
                                    className="text-slate-600 hover:text-blue-600"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNote(conversation.note.id)}
                                    className="text-slate-600 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {editingNote === conversation.note.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    className="w-full border-2 rounded-lg bg-white/80 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={saveEdit}
                                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={cancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-800">{conversation.note.content}</p>
                              )}
                            </div>

                            {/* Replies */}
                            {conversation.replies.length > 0 && (
                              <div className="ml-6 space-y-2">
                                {conversation.replies
                                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                  .map((reply) => (
                                    <div key={reply.id} className="p-3 rounded-lg border bg-slate-50/90 border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-slate-600">{reply.author}</span>
                                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                            Reply
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-slate-500">
                                            {new Date(reply.created_at).toLocaleDateString()}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => editNote(reply.id)}
                                            className="text-slate-600 hover:text-blue-600"
                                          >
                                            <Edit3 className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteNote(reply.id)}
                                            className="text-slate-600 hover:text-red-600"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>

                                      {editingNote === reply.id ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editingContent}
                                            onChange={(e) => setEditingContent(e.target.value)}
                                            rows={2}
                                            className="w-full border-2 rounded-lg bg-white/80 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                                            <Button size="sm" onClick={() => saveEdit(reply.id)}>Save</Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-slate-800 whitespace-pre-wrap text-sm">{reply.content}</p>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes from Coach Section */}
                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-semibold text-slate-800">Notes from Coach</h3>
                    {coachNotesConversations.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No notes from your coach yet</p>
                    ) : (
                      <div className="space-y-3">
                        {coachNotesConversations.map((conversation) => {
                          const latestMessage = conversation.replies.length > 0 
                            ? conversation.replies[conversation.replies.length - 1]
                            : conversation.note
                          
                          return (
                            <div key={conversation.note.id} className="p-4 rounded-lg border bg-blue-50/90 border-blue-200 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">Coach Note</Badge>
                                  <span className="text-sm text-slate-600">{latestMessage.author}</span>
                                  {conversation.note.college_name && (
                                    <span className="text-sm text-slate-600">• {conversation.note.college_name}</span>
                                  )}
                                  {conversation.note.country && (
                                    <span className="text-sm text-slate-600 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {conversation.note.country}
                                    </span>
                                  )}
                                  {conversation.replies.length > 0 && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      {conversation.replies.length} reply{conversation.replies.length !== 1 ? 'ies' : ''}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500">
                                    {new Date(latestMessage.created_at).toLocaleDateString()}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openConversation(conversation)}
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs sm:text-sm"
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">
                                      {conversation.replies.length > 0 ? 'View Conversation' : 'Reply'}
                                    </span>
                                    <span className="sm:hidden">
                                      {conversation.replies.length > 0 ? 'View' : 'Reply'}
                                    </span>
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-slate-800 text-sm">
                                {latestMessage.content.length > 100 
                                  ? `${latestMessage.content.substring(0, 100)}...` 
                                  : latestMessage.content
                                }
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* My Actions Section */}
                  <div className="space-y-4 mt-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">Actions</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="text-sm border border-slate-300 rounded-lg px-2 py-1 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        >
                          <option value="date_asc">Due Date (Ascending)</option>
                          <option value="date_desc">Due Date (Descending)</option>
                          <option value="priority">Priority</option>
                          <option value="status">Status</option>
                        </select>
                      </div>
                    </div>
                    {myActionsList.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No actions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {myActionsList.map((action) => (
                          <div
                            key={action.id}
                            className="p-4 rounded-lg border bg-blue-50/80 border-blue-200 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Action</Badge>
                                {action.priority && (
                                  <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                                    {getPriorityIcon(action.priority)}
                                    <span className="ml-1">
                                      {action.priority.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  </Badge>
                                )}
                                <span className="text-sm text-slate-600">{action.author}</span>
                                {action.college_name && (
                                  <span className="text-sm text-slate-600">• {action.college_name}</span>
                                )}
                                {action.country && (
                                  <span className="text-sm text-slate-600 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {action.country}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {action.due_date ? `Due: ${new Date(action.due_date).toLocaleDateString()}` : `Created: ${new Date(action.created_at).toLocaleDateString()}`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editNote(action.id)}
                                  className="text-slate-600 hover:text-blue-600"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNote(action.id)}
                                  className="text-slate-600 hover:text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {editingNote === action.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full border-2 rounded-lg bg-white/80 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={saveEdit}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={cancelEdit}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-800 mb-3">{action.content}</p>
                            )}
                            
                            {action.action_status && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={action.action_status === 'not_started' ? 'default' : 'outline'}
                                  onClick={() => updateActionStatus(action.id, 'not_started')}
                                  className={action.action_status === 'not_started' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                                >
                                  Not Started
                                </Button>
                                <Button
                                  size="sm"
                                  variant={action.action_status === 'in_progress' ? 'default' : 'outline'}
                                  onClick={() => updateActionStatus(action.id, 'in_progress')}
                                  className={action.action_status === 'in_progress' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                                >
                                  In Progress
                                </Button>
                                <Button
                                  size="sm"
                                  variant={action.action_status === 'complete' ? 'default' : 'outline'}
                                  onClick={() => updateActionStatus(action.id, 'complete')}
                                  className={action.action_status === 'complete' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                                >
                                  Complete
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions from Coach Section */}
                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-semibold text-slate-800">Actions from Coach</h3>
                    {coachActionsList.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">No actions from your coach yet</p>
                    ) : (
                      <div className="space-y-3">
                        {coachActionsList.map((action) => (
                          <div
                            key={action.id}
                            className="p-4 rounded-lg border bg-blue-50/90 border-blue-200 shadow-sm"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">Coach Action</Badge>
                                {action.priority && (
                                  <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                                    {getPriorityIcon(action.priority)}
                                    <span className="ml-1">
                                      {action.priority.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  </Badge>
                                )}
                                <span className="text-sm text-slate-600">{action.author}</span>
                                {action.college_name && (
                                  <span className="text-sm text-slate-600">• {action.college_name}</span>
                                )}
                                {action.country && (
                                  <span className="text-sm text-slate-600 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {action.country}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {action.due_date ? `Due: ${new Date(action.due_date).toLocaleDateString()}` : `Created: ${new Date(action.created_at).toLocaleDateString()}`}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-slate-800 mb-3">{action.content}</p>
                            
                            {action.action_status && (
                              <div className="flex gap-2 mb-3">
                                <Button
                                  size="sm"
                                  variant={action.action_status === 'not_started' ? 'default' : 'outline'}
                                  onClick={() => updateActionStatus(action.id, 'not_started')}
                                  className={action.action_status === 'not_started' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                                >
                                  Not Started
                                </Button>
                                <Button
                                  size="sm"
                                  variant={action.action_status === 'in_progress' ? 'default' : 'outline'}
                                  onClick={() => updateActionStatus(action.id, 'in_progress')}
                                  className={action.action_status === 'in_progress' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                                >
                                  In Progress
                                </Button>
                                <Button
                                  size="sm"
                                  variant={action.action_status === 'complete' ? 'default' : 'outline'}
                                  onClick={() => updateActionStatus(action.id, 'complete')}
                                  className={action.action_status === 'complete' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200' : ''}
                                >
                                  Complete
                                </Button>
                              </div>
                            )}
                            
                            {/* Reply functionality */}
                            <div className="border-t border-blue-200 pt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => replyToNote(action.id)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversation Modal */}
              {selectedConversation && (
                <ConversationModal
                  isOpen={showConversation}
                  onClose={closeConversation}
                  conversation={(() => {
                    // Get the latest conversation data from the notes state
                    const currentConversation = groupNotesIntoConversations(notes.filter(note =>
                      note.type === 'note' &&
                      note.author_id !== user.id &&
                      note.visible_to_student
                    ).concat(notes.filter(note =>
                      note.type === 'note' &&
                      note.is_reply &&
                      note.parent_note_id &&
                      notes.find(n => n.id === note.parent_note_id && n.author_id !== user.id)
                    ))).find(conv => conv.note.id === selectedConversation.note.id)
                    
                    return currentConversation || selectedConversation
                  })()}
                  studentName="Coach"
                  currentUserId={user.id}
                  onReply={handleReply}
                  onMessageAdded={handleMessageAdded}
                />
              )}
            </TabsContent>

            {/* Application Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <Card className="relative rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-100 overflow-visible">
                <CardHeader className="sticky top-0 z-20 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-xl sm:rounded-t-2xl shadow-md">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-200 flex-shrink-0" />
                  <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold tracking-wide leading-tight">
                    Global Application Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8 pt-4 sm:pt-6 lg:pt-8">
                  <div className="space-y-8">
                    {timelinePhases.map((phase, index) => {
                      const isExpanded = expandedPhases.has(phase.id);
                      
                      return (
                        <div key={phase.id} className="relative">
                          {/* Timeline line */}
                          {index < timelinePhases.length - 1 && (
                            <div className="absolute left-5 sm:left-6 top-10 sm:top-16 w-0.5 h-20 sm:h-24 bg-slate-200"></div>
                          )}
                          
                          <div className="flex items-start gap-4 sm:gap-6">
                            {/* Timeline dot with progress indicator */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getTimelineColor(phase.type)} shadow-lg border-2 ${phase.isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-white'}`}>
                                {getTimelineIcon(phase.type)}
                              </div>
                              {phase.isActive && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                              )}
                            </div>
                            
                            {/* Phase content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  <h4 className="text-base sm:text-lg font-semibold text-slate-800">{phase.name}</h4>
                                  <Badge variant="outline" className="text-xs bg-white/80 border-slate-200">
                                    {phase.months}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {phase.estimatedDuration}
                                  </Badge>
                                </div>
                                <button
                                  onClick={() => togglePhaseExpansion(phase.id)}
                                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors self-start sm:self-auto"
                                >
                                  <span className="text-xs sm:text-sm">{isExpanded ? 'Hide Details' : 'Show Details'}</span>
                                  <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                              
                              <p className="text-sm text-slate-600 mb-4">{phase.description}</p>
                              
                              {/* Region tags */}
                              <div className="flex flex-wrap gap-1 mb-4">
                                {phase.regions.map((region, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                    {region}
                                  </Badge>
                                ))}
                              </div>
                              
                              {/* Expanded content */}
                              {isExpanded && (
                                <div className="mt-6 space-y-4 sm:space-y-6 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                                  {/* Milestones */}
                                  <div>
                                    <h5 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Key Milestones
                                    </h5>
                                    <ul className="space-y-1">
                                      {phase.milestones.map((milestone, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                          {milestone}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  {/* Tasks */}
                                  <div>
                                    <h5 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                      <CheckSquare className="h-4 w-4" />
                                      Tasks
                                    </h5>
                                    <div className="space-y-3">
                                      {phase.tasks.map((task) => (
                                        <div key={task.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                            <h6 className="text-sm font-medium text-slate-800">{task.title}</h6>
                                            <div className="flex gap-2">
                                              <Badge variant="outline" className={`text-xs ${getTaskPriorityColor(task.priority)}`}>
                                                {task.priority}
                                              </Badge>
                                            </div>
                                          </div>
                                          <p className="text-xs text-slate-600 mb-2">{task.description}</p>
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-500">
                                            <span>Due: {task.deadline}</span>
                                            <span>Est: {task.estimatedTime}</span>
                                          </div>
                                          {task.resources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                              <p className="text-xs font-medium text-slate-700 mb-1">Resources:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {task.resources.map((resource, idx) => (
                                                  <a
                                                    key={idx}
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                  >
                                                    {resource.name}
                                                  </a>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Tips */}
                                  <div>
                                    <h5 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4" />
                                      Pro Tips
                                    </h5>
                                    <ul className="space-y-1">
                                      {phase.tips.map((tip, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
