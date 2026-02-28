"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Sparkles, Calendar, TrendingUp, Zap, Heart, CheckCircle, X, BookOpen, Mail, Menu } from "lucide-react";
import Aurora from "./Aurora";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DayOneLogo } from "./DayOneLogo";
import { Button } from "@/components/ui/button";

// Scrolling goal examples for the marquee - 5 rows
const scrollingGoalsRow1 = [
  "Run a 5K", // Green
  "Learn Spanish", // Blue
  "Build Your First Website", // Purple
  "Daily Meditation Practice", // Coral
  "Code a Mobile App", // Purple
  "Learn Japanese" // Blue
];

const scrollingGoalsRow2 = [
  "Practice Yoga Daily", // Coral
  "Start a Podcast", // Purple
  "Get Fit in 30 Days", // Green
  "Write a Novel", // Blue
  "Cook Healthy Meals Daily", // Coral
  "Learn Video Editing" // Purple
];

const scrollingGoalsRow3 = [
  "Learn Piano", // Blue
  "Start a YouTube Channel", // Purple
  "Build Better Habits", // Coral
  "Walk 10K Steps Daily", // Green
  "Start a Side Business", // Purple
  "Garden From Scratch" // Coral
];

const scrollingGoalsRow4 = [
  "Strength Training Journey", // Green
  "Master Time Management", // Coral
  "Learn Graphic Design", // Purple
  "Read 10 Books", // Blue
  "Organize Your Life", // Coral
  "Master Public Speaking" // Blue
];

const scrollingGoalsRow5 = [
  "Write Poetry Daily", // Blue
  "Learn Calligraphy", // Blue
  "Build Muscle Mass", // Green
  "Master Cooking Skills", // Coral
  "Morning Yoga Practice", // Green
  "Learn Photography" // Blue
];

// Mapping of goal names to demo types
const goalMapping: Record<string, 'running' | 'language' | 'coding' | 'meditation'> = {
  // Green - Fitness goals
  "Run a 5K": "running",
  "Get Fit in 30 Days": "running",
  "Walk 10K Steps Daily": "running",
  "Strength Training Journey": "running",
  "Build Muscle Mass": "running",
  "Morning Yoga Practice": "running",

  // Coral - Mindfulness, meditation, food, diet, earthfulness, grounding
  "Practice Yoga Daily": "meditation",
  "Daily Meditation Practice": "meditation",
  "Cook Healthy Meals Daily": "meditation",
  "Build Better Habits": "meditation",
  "Master Time Management": "meditation",
  "Organize Your Life": "meditation",
  "Garden From Scratch": "meditation",
  "Master Cooking Skills": "meditation",

  // Blue - Language and hobbies
  "Learn Spanish": "language",
  "Learn Japanese": "language",
  "Write a Novel": "language",
  "Write Poetry Daily": "language",
  "Learn Piano": "language",
  "Learn Calligraphy": "language",
  "Read 10 Books": "language",
  "Learn Photography": "language",

  // Purple - Hard skills and professional development
  "Build Your First Website": "coding",
  "Code a Mobile App": "coding",
  "Learn Video Editing": "coding",
  "Learn Graphic Design": "coding",
  "Start a YouTube Channel": "coding",
  "Start a Podcast": "coding",
  "Start a Side Business": "coding",
  "Master Public Speaking": "coding",
};

// Demo data for different goal types
const goalExamples = {
  running: {
    title: "Run a 5K",
    subtitle: "Building Foundation",
    icon: "\u{1F3C3}\u200D\u2640\uFE0F",
    activities: {
      1: {
        title: "Day 1: Foundation Assessment",
        date: "Wednesday, January 8",
        completed: true,
        activities: [
          "Walk for 15 minutes at a comfortable pace",
          "Do 5 minutes of dynamic stretching (leg swings, arm circles)",
          "Record your current fitness level in a journal",
          "Set your weekly running schedule"
        ],
        tip: "Start slow and focus on building consistency. It\u2019s okay if you can\u2019t run the whole distance yet!",
        reflection: "Today was a great start! I walked around my neighborhood and felt good. The stretching was a bit challenging but I managed. I\u2019m excited to see where this journey takes me. My current fitness level is beginner, but I\u2019m motivated to improve."
      },
      2: {
        title: "Day 2: First Run/Walk Interval",
        date: "Thursday, January 9",
        completed: true,
        activities: [
          "Warm-up: 5-minute brisk walk",
          "Run 1 minute, walk 2 minutes (repeat 6 times)",
          "Cool down: 5-minute slow walk",
          "Stretch major muscle groups for 5 minutes"
        ],
        tip: "Listen to your body. The walk intervals are just as important as the running!",
        reflection: "First time trying run/walk intervals! It was harder than I expected but I completed all 6 rounds. My legs felt tired but not sore. The walk breaks were definitely needed. I\u2019m learning to pace myself better."
      },
      3: {
        title: "Day 3: Active Recovery",
        date: "Friday, January 10",
        completed: true,
        activities: [
          "20-minute gentle walk or yoga session",
          "Focus on hip flexor and calf stretches",
          "Hydrate well throughout the day",
          "Review your running form tips online"
        ],
        tip: "Recovery days help prevent injury and build strength. Don\u2019t skip them!",
        reflection: "Did a yoga session from YouTube - it felt amazing! My calves were a bit tight so the stretching really helped. Watched some videos on proper running form and realized I need to work on my posture. Drinking more water throughout the day."
      },
      4: {
        title: "Day 4: Interval Training",
        date: "Saturday, January 11",
        completed: true,
        activities: [
          "Warm-up: 5-minute walk",
          "Run 1.5 minutes, walk 2 minutes (repeat 5 times)",
          "Cool down: 5-minute walk",
          "Foam roll or massage sore muscles"
        ],
        tip: "You\u2019re increasing your run intervals! Notice how your body is adapting.",
        reflection: "The extra 30 seconds of running was noticeable but manageable! I focused on the form tips I learned yesterday and it made a difference. Used a foam roller for the first time - game changer for my tight muscles. Feeling stronger already!"
      },
      5: {
        title: "Day 5: Cross-Training",
        date: "Sunday, January 12",
        completed: true,
        activities: [
          "30-minute bike ride or swim",
          "Core strengthening: planks, bridges (3 sets each)",
          "Light stretching routine",
          "Plan your meals for the coming week"
        ],
        tip: "Cross-training builds overall fitness and prevents running-specific injuries.",
        reflection: "Went for a bike ride around the park - so refreshing! The core work was tough but I can see how it\u2019ll help with running stability. Planned out my meals focusing on more protein and veggies. This holistic approach is really clicking for me."
      },
      6: {
        title: "Day 6: Endurance Building",
        date: "Monday, January 13",
        completed: false,
        activities: [
          "Warm-up: 5-minute brisk walk",
          "Run 2 minutes, walk 1 minute (repeat 6 times)",
          "Cool down: 5-minute walk",
          "Post-run stretch focusing on hamstrings and quads"
        ],
        tip: "Notice you\u2019re running longer than walking now! This is real progress."
      },
      7: {
        title: "Day 7: Rest & Reflection",
        date: "Tuesday, January 14",
        completed: false,
        activities: [
          "Complete rest day (no exercise)",
          "Gentle stretching if needed (5-10 minutes)",
          "Journal about your first week\u2019s progress",
          "Ensure you\u2019re getting 7-8 hours of sleep"
        ],
        tip: "Rest is when your body gets stronger. Celebrate completing Week 1!"
      }
    }
  },
  language: {
    title: "Learn Spanish",
    subtitle: "Language Foundations",
    icon: "\u{1F30D}",
    activities: {
      1: {
        title: "Day 1: Starting with Basics",
        date: "Wednesday, January 8",
        completed: true,
        activities: [
          "Learn basic greetings (Hola, Buenos d\u00edas, Buenas tardes)",
          "Practice pronunciation with online resources (15 min)",
          "Download a language learning app (Duolingo or similar)",
          "Set your learning schedule and goals"
        ],
        tip: "Don\u2019t worry about perfection - focus on pronunciation and building confidence!",
        reflection: "Started with the basics today! The pronunciation was tricky at first but I\u2019m getting the hang of it. Downloaded Duolingo and completed my first lesson. Feeling excited about this journey!"
      },
      2: {
        title: "Day 2: Numbers & Colors",
        date: "Thursday, January 9",
        completed: true,
        activities: [
          "Learn numbers 1-20 in Spanish",
          "Practice basic colors (rojo, azul, verde, amarillo)",
          "Complete 2 lessons in your language app",
          "Label 5 items in your home with Spanish names"
        ],
        tip: "Repetition is key! Say each word out loud 5 times.",
        reflection: "Numbers were easier than I thought! The colors are fun to practice. I labeled my door, chair, table, window, and phone in Spanish. Seeing the words helps me remember them better."
      },
      3: {
        title: "Day 3: Common Phrases",
        date: "Friday, January 10",
        completed: true,
        activities: [
          "Learn \u2018please\u2019, \u2018thank you\u2019, and \u2018you\u2019re welcome\u2019",
          "Practice asking \u2018How are you?\u2019 and responding",
          "Watch a 5-minute Spanish learning video on YouTube",
          "Review yesterday\u2019s vocabulary"
        ],
        tip: "Try using these phrases in your daily life, even if just to yourself!",
        reflection: "Learning phrases makes it feel more real! I practiced saying \u2018C\u00f3mo est\u00e1s?\u2019 to myself in the mirror. Watched a great YouTube video about pronunciation. Reviewing helps so much!"
      },
      4: {
        title: "Day 4: Food Vocabulary",
        date: "Saturday, January 11",
        completed: true,
        activities: [
          "Learn names of 10 common foods in Spanish",
          "Practice ordering food phrases (\u2018I would like...\u2019, \u2018The bill, please\u2019)",
          "Complete 3 app lessons",
          "Try to think about your meals in Spanish today"
        ],
        tip: "Food vocabulary is super practical - you\u2019ll use this when traveling!",
        reflection: "This was so fun! I learned agua, pan, pollo, arroz, and more. Tried describing my lunch in Spanish - got about half the words right. Can\u2019t wait to use this at a restaurant someday!"
      },
      5: {
        title: "Day 5: Verb Conjugation Basics",
        date: "Sunday, January 12",
        completed: true,
        activities: [
          "Learn present tense of \u2018to be\u2019 (ser/estar)",
          "Practice \u2018I am\u2019, \u2018you are\u2019, \u2018he/she is\u2019",
          "Complete conjugation exercises in your app",
          "Create flashcards for new verbs"
        ],
        tip: "Verbs are challenging but essential. Take it slow and practice daily!",
        reflection: "Okay, this was harder! The difference between ser and estar is confusing but I\u2019m starting to see the pattern. Made flashcards which helped. Practiced while cooking dinner."
      },
      6: {
        title: "Day 6: Listening Practice",
        date: "Monday, January 13",
        completed: false,
        activities: [
          "Listen to a Spanish podcast for beginners (10 min)",
          "Watch a children\u2019s show in Spanish with subtitles",
          "Practice repeating what you hear",
          "Note down 3 new words you learned"
        ],
        tip: "Listening helps train your ear - don\u2019t worry if you don\u2019t understand everything!"
      },
      7: {
        title: "Day 7: Review & Conversation",
        date: "Tuesday, January 14",
        completed: false,
        activities: [
          "Review all vocabulary from the week",
          "Try having a simple conversation with yourself in Spanish",
          "Complete weekly review in your app",
          "Write down your progress and what you want to focus on next week"
        ],
        tip: "Celebrate your first week! You\u2019ve learned so much already."
      }
    }
  },
  coding: {
    title: "Build Your First Website",
    subtitle: "Web Development Basics",
    icon: "\u{1F4BB}",
    activities: {
      1: {
        title: "Day 1: HTML Fundamentals",
        date: "Wednesday, January 8",
        completed: true,
        activities: [
          "Set up your code editor (VS Code or similar)",
          "Learn basic HTML structure (html, head, body tags)",
          "Create your first HTML page with a heading and paragraph",
          "Understand what tags and elements are"
        ],
        tip: "Everyone starts with \u2018Hello World\u2019 - embrace being a beginner!",
        reflection: "Created my first HTML page! It\u2019s just text but seeing it in a browser was exciting. The syntax makes sense - tags open and close. Ready to learn more!"
      },
      2: {
        title: "Day 2: Adding Structure",
        date: "Thursday, January 9",
        completed: true,
        activities: [
          "Learn about headings (h1-h6) and paragraphs",
          "Add lists (ordered and unordered) to your page",
          "Create links to other websites",
          "Add images to your webpage"
        ],
        tip: "Save your work frequently and preview in the browser often!",
        reflection: "My page is starting to look like a real website! Added a list of my hobbies and linked to my favorite sites. Images took a bit to figure out but got it working."
      },
      3: {
        title: "Day 3: Introduction to CSS",
        date: "Friday, January 10",
        completed: true,
        activities: [
          "Learn what CSS is and how it works with HTML",
          "Change text colors and fonts",
          "Add background colors to your page",
          "Experiment with different font sizes"
        ],
        tip: "CSS is where the magic happens - play around and have fun!",
        reflection: "CSS is amazing! Changed my boring black text to colors, added a nice background. It\u2019s like decorating a room. Spent way too long picking the perfect color scheme!"
      },
      4: {
        title: "Day 4: Layout Basics",
        date: "Saturday, January 11",
        completed: true,
        activities: [
          "Learn about div elements and containers",
          "Add margins and padding to your elements",
          "Center content on your page",
          "Create a simple header and footer"
        ],
        tip: "Layout is tricky at first - don\u2019t be afraid to experiment and break things!",
        reflection: "The box model concept clicked today! Understanding margin vs padding was a breakthrough. My page now has a proper header and footer. Looking more professional!"
      },
      5: {
        title: "Day 5: Styling with Classes",
        date: "Sunday, January 12",
        completed: true,
        activities: [
          "Learn about CSS classes and IDs",
          "Style different sections with different classes",
          "Add hover effects to links",
          "Create a navigation menu"
        ],
        tip: "Classes let you reuse styles - this will save you so much time!",
        reflection: "Classes are super powerful! Made a navigation menu that changes color when you hover. Feels like I\u2019m becoming a real web developer. My friends will be impressed!"
      },
      6: {
        title: "Day 6: Responsive Design Intro",
        date: "Monday, January 13",
        completed: false,
        activities: [
          "Learn about mobile-first design",
          "Make your page responsive with media queries",
          "Test your site on different screen sizes",
          "Adjust layouts for mobile and desktop"
        ],
        tip: "Most web traffic is mobile - responsive design is essential!"
      },
      7: {
        title: "Day 7: Publishing Your Site",
        date: "Tuesday, January 14",
        completed: false,
        activities: [
          "Learn about web hosting and GitHub Pages",
          "Deploy your website to the internet",
          "Share your site with friends and family",
          "Plan what features you want to add next week"
        ],
        tip: "Publishing your first site is a huge milestone - celebrate this achievement!"
      }
    }
  },
  meditation: {
    title: "Daily Meditation Practice",
    subtitle: "Mindfulness Journey",
    icon: "\u{1F9D8}\u200D\u2640\uFE0F",
    activities: {
      1: {
        title: "Day 1: Introduction to Meditation",
        date: "Wednesday, January 8",
        completed: true,
        activities: [
          "Find a quiet, comfortable space in your home",
          "Sit for 5 minutes focusing on your breath",
          "Download a meditation app (Headspace, Calm, or Insight Timer)",
          "Set a consistent time for daily practice"
        ],
        tip: "There\u2019s no \u2018wrong\u2019 way to meditate - your mind will wander, and that\u2019s okay!",
        reflection: "First meditation session! My mind wandered a lot but I kept coming back to my breath. Five minutes felt long but also peaceful. Set my alarm for 7am daily practice."
      },
      2: {
        title: "Day 2: Body Scan Practice",
        date: "Thursday, January 9",
        completed: true,
        activities: [
          "7-minute guided body scan meditation",
          "Notice tension in different parts of your body",
          "Practice releasing tension with each exhale",
          "Journal about physical sensations you noticed"
        ],
        tip: "Body scans help you connect with physical sensations and release stored stress.",
        reflection: "Noticed so much tension in my shoulders! The guided meditation helped me relax areas I didn\u2019t even know were tight. Feeling more aware of my body already."
      },
      3: {
        title: "Day 3: Breath Awareness",
        date: "Friday, January 10",
        completed: true,
        activities: [
          "10-minute breath-focused meditation",
          "Count breaths from 1-10, then start over",
          "Notice the natural rhythm of your breathing",
          "Practice box breathing (4-4-4-4)"
        ],
        tip: "The breath is always with you - it\u2019s a portable anchor for your attention.",
        reflection: "Counting breaths helped keep my mind from wandering too much. Box breathing was calming! Used it when I felt stressed at work and it actually helped."
      },
      4: {
        title: "Day 4: Loving-Kindness Practice",
        date: "Saturday, January 11",
        completed: true,
        activities: [
          "10-minute loving-kindness meditation",
          "Send kind wishes to yourself, loved ones, and others",
          "Notice how this practice feels in your body",
          "Reflect on any resistance or emotions that arise"
        ],
        tip: "Self-compassion is just as important as compassion for others.",
        reflection: "This felt weird at first, sending good wishes to myself. But by the end I felt warmer, more open. Even sent kind thoughts to my annoying coworker - felt surprisingly good!"
      },
      5: {
        title: "Day 5: Mindful Walking",
        date: "Sunday, January 12",
        completed: true,
        activities: [
          "15-minute mindful walking practice outdoors",
          "Focus on the sensation of each step",
          "Notice sounds, sights, and smells around you",
          "Return to body awareness when mind wanders"
        ],
        tip: "Meditation doesn\u2019t have to be sitting still - movement can be meditative too!",
        reflection: "Walking meditation was amazing! Never noticed how my feet actually feel when walking. Heard birds I normally tune out. This is meditation I can do anywhere!"
      },
      6: {
        title: "Day 6: Dealing with Thoughts",
        date: "Monday, January 13",
        completed: false,
        activities: [
          "12-minute meditation on observing thoughts",
          "Practice letting thoughts pass like clouds",
          "Label thoughts as \u2018thinking\u2019 without judgment",
          "Return to breath each time you notice thinking"
        ],
        tip: "You are not your thoughts - you are the awareness observing them."
      },
      7: {
        title: "Day 7: Reflection & Integration",
        date: "Tuesday, January 14",
        completed: false,
        activities: [
          "15-minute open awareness meditation",
          "Journal about your first week\u2019s experience",
          "Notice any changes in stress, sleep, or mood",
          "Set intentions for your practice going forward"
        ],
        tip: "Consistency matters more than duration - celebrate showing up each day!"
      }
    }
  }
};

// Legacy reference - now using goalExamples.running.activities
const demoActivities = goalExamples.running.activities;

interface LandingPageProps {
  onGetStarted: () => void;
  onPrivacyPolicy: () => void;
  onTermsOfService: () => void;
  onStyleGuide: () => void;
  onBack?: () => void;
  onLogoClick?: () => void;
}

export function LandingPage({ onGetStarted, onPrivacyPolicy, onTermsOfService, onStyleGuide, onBack, onLogoClick }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<'running' | 'language' | 'coding' | 'meditation'>('running');
  const [isPausedRow1, setIsPausedRow1] = useState(false);
  const [isPausedRow2, setIsPausedRow2] = useState(false);
  const [isPausedRow3, setIsPausedRow3] = useState(false);
  const [isPausedRow4, setIsPausedRow4] = useState(false);
  const [isPausedRow5, setIsPausedRow5] = useState(false);

  const currentGoal = goalExamples[selectedGoal];
  const demoActivities = currentGoal.activities as Record<number, any>;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleGetStarted = () => {
    setMobileMenuOpen(false);
    onGetStarted();
  };

  const handleDayClick = (dayNumber: number) => {
    setSelectedDay(dayNumber);
  };

  const closeDayDetail = () => {
    setSelectedDay(null);
  };

  return (
    <div className="min-h-screen relative bg-black">

      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora
          colorStops={["#7cff67","#00c7fc","#5227FF"]}
          amplitude={1}
          blend={0.3}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 pt-[44px]">
        {/* Header - Hidden on Home */}
        <header className="opacity-0 pointer-events-none border-b border-gray-200 bg-white sticky top-0 z-50 transition-smooth shadow-sm">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 flex items-center justify-between relative">
          {/* Left: Mobile Menu / Desktop Navigation */}
          <div className="flex items-center flex-1 justify-start">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="text-coral-600 font-semibold border-b-2 border-coral-600 pb-1 transition-colors">Home</a>
              <a href="/privacy" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); onPrivacyPolicy(); }} className="text-gray-700 hover:text-coral-600 transition-colors">Privacy</a>
              <a href="/terms" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); onTermsOfService(); }} className="text-gray-700 hover:text-coral-600 transition-colors">Terms</a>
            </nav>
          </div>

          {/* Right: Get Started Button */}
          <div className="flex items-center justify-end flex-1">
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-smooth px-3 md:px-4 py-2 text-xs md:text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Interactive Demo */}
      <section className="min-h-[200px] flex flex-col justify-center px-0 py-8">
        <div className="w-full flex flex-col h-full justify-between">
          {/* Menu and Get Started buttons - Positioned near top */}
          <div className="absolute top-11 left-0 right-0 flex items-center justify-between px-4 z-50">
            {/* Log In Button */}
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-smooth px-4 py-2 rounded-full"
            >
              Log In
            </Button>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-2 border-coral-600 text-coral-600 hover:bg-coral-50 shadow-md px-4 py-2 rounded-full"
                  aria-label="Menu"
                >
                  <Menu className="w-4 h-4 mr-2" />
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[168px] bg-white/95 backdrop-blur-xl border-l-2 border-blue-200">
                <SheetTitle className="text-lg font-bold text-blue-900 mb-4 pt-8 text-center">Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigation options
                </SheetDescription>
                <nav className="flex flex-col gap-2 px-3">
                  <Button
                    onClick={(e) => {
                      handleNavClick(e as any, 'features');
                    }}
                    variant="outline"
                    size="sm"
                    className="justify-start bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 text-sm py-2"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      onPrivacyPolicy();
                    }}
                    variant="outline"
                    size="sm"
                    className="justify-start hover:bg-gray-50 text-sm py-2"
                  >
                    Privacy Policy
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      onTermsOfService();
                    }}
                    variant="outline"
                    size="sm"
                    className="justify-start hover:bg-gray-50 text-sm py-2"
                  >
                    Terms of Service
                  </Button>
                  <div className="border-t border-gray-200 my-2" />
                  <Button
                    onClick={handleGetStarted}
                    size="sm"
                    className="justify-start bg-teal-600 hover:bg-teal-700 text-white text-sm py-2"
                  >
                    Get Started
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo at the top (camera notch area) */}
          <div className="text-center pt-2 pb-1 animate-fadeIn flex items-center justify-center">
            <a
              href="/logo"
              className="inline-block cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={(e) => {
                e.preventDefault();
                if (onLogoClick) {
                  onLogoClick();
                } else {
                  window.history.pushState({}, '', '/logo');
                  window.location.reload();
                }
              }}
            >
              <DayOneLogo
                width={280}
                height={112}
                showTagline={true}
                className="text-teal-600"
              />
            </a>
          </div>

          {/* Interactive Demo Calendar */}
          <div className="bg-white/40 backdrop-blur-xl rounded-none md:rounded-2xl border-y md:border border-white/50 shadow-2xl overflow-hidden animate-slideInUp w-full md:max-w-7xl md:mx-auto flex-1 flex flex-col">
            {/* Scrolling Goal Examples - Five Rows */}
            <div className="py-3 overflow-hidden space-y-1.5">
              <p className="text-gray-700 text-sm font-medium mb-3 text-center px-4">Popular goals our users are achieving:</p>

              {/* Row 1 - Scroll Left */}
              <div
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                onMouseDown={() => setIsPausedRow1(true)}
                onMouseUp={() => setIsPausedRow1(false)}
                onMouseLeave={() => setIsPausedRow1(false)}
                onTouchStart={() => setIsPausedRow1(true)}
                onTouchEnd={() => setIsPausedRow1(false)}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  const scrollLeft = target.scrollLeft;

                  if (scrollLeft >= scrollWidth / 2 - clientWidth) {
                    target.scrollLeft = scrollLeft - scrollWidth / 4;
                  } else if (scrollLeft <= 0) {
                    target.scrollLeft = scrollWidth / 4;
                  }
                }}
              >
                <div className={`flex whitespace-nowrap ${isPausedRow1 ? '' : 'animate-scroll-left'}`}>
                  {[...scrollingGoalsRow1, ...scrollingGoalsRow1, ...scrollingGoalsRow1, ...scrollingGoalsRow1, ...scrollingGoalsRow1, ...scrollingGoalsRow1, ...scrollingGoalsRow1, ...scrollingGoalsRow1].map((goal, index) => {
                    const goalType = goalMapping[goal] || 'meditation';
                    const colorClasses = {
                      running: 'border-[#8eff3d] bg-[#8eff3d]/10', // Lime green for fitness
                      language: 'border-[#0284c7] bg-[#0284c7]/10', // Teal for learning
                      coding: 'border-[#9333ea] bg-[#9333ea]/10', // Purple for professional
                      meditation: 'border-[#ff6b6b] bg-[#ff6b6b]/10' // Coral for wellness
                    };
                    return (
                      <div
                        key={index}
                        className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${colorClasses[goalType]} text-sm font-medium mx-1.5 select-none`}
                      >
                        {goal}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 2 - Scroll Right */}
              <div
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                onMouseDown={() => setIsPausedRow2(true)}
                onMouseUp={() => setIsPausedRow2(false)}
                onMouseLeave={() => setIsPausedRow2(false)}
                onTouchStart={() => setIsPausedRow2(true)}
                onTouchEnd={() => setIsPausedRow2(false)}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  const scrollLeft = target.scrollLeft;

                  if (scrollLeft >= scrollWidth / 2 - clientWidth) {
                    target.scrollLeft = scrollLeft - scrollWidth / 4;
                  } else if (scrollLeft <= 0) {
                    target.scrollLeft = scrollWidth / 4;
                  }
                }}
              >
                <div className={`flex whitespace-nowrap ${isPausedRow2 ? '' : 'animate-scroll-right'}`}>
                  {[...scrollingGoalsRow2, ...scrollingGoalsRow2, ...scrollingGoalsRow2, ...scrollingGoalsRow2, ...scrollingGoalsRow2, ...scrollingGoalsRow2, ...scrollingGoalsRow2, ...scrollingGoalsRow2].map((goal, index) => {
                    const goalType = goalMapping[goal] || 'meditation';
                    const colorClasses = {
                      running: 'border-[#8eff3d] bg-[#8eff3d]/10', // Lime green for fitness
                      language: 'border-[#0284c7] bg-[#0284c7]/10', // Teal for learning
                      coding: 'border-[#9333ea] bg-[#9333ea]/10', // Purple for professional
                      meditation: 'border-[#ff6b6b] bg-[#ff6b6b]/10' // Coral for wellness
                    };
                    return (
                      <div
                        key={index}
                        className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${colorClasses[goalType]} text-sm font-medium mx-1.5 select-none`}
                      >
                        {goal}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 3 - Scroll Left */}
              <div
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                onMouseDown={() => setIsPausedRow3(true)}
                onMouseUp={() => setIsPausedRow3(false)}
                onMouseLeave={() => setIsPausedRow3(false)}
                onTouchStart={() => setIsPausedRow3(true)}
                onTouchEnd={() => setIsPausedRow3(false)}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  const scrollLeft = target.scrollLeft;

                  if (scrollLeft >= scrollWidth / 2 - clientWidth) {
                    target.scrollLeft = scrollLeft - scrollWidth / 4;
                  } else if (scrollLeft <= 0) {
                    target.scrollLeft = scrollWidth / 4;
                  }
                }}
              >
                <div className={`flex whitespace-nowrap ${isPausedRow3 ? '' : 'animate-scroll-left'}`}>
                  {[...scrollingGoalsRow3, ...scrollingGoalsRow3, ...scrollingGoalsRow3, ...scrollingGoalsRow3, ...scrollingGoalsRow3, ...scrollingGoalsRow3, ...scrollingGoalsRow3, ...scrollingGoalsRow3].map((goal, index) => {
                    const goalType = goalMapping[goal] || 'meditation';
                    const colorClasses = {
                      running: 'border-[#8eff3d] bg-[#8eff3d]/10', // Lime green for fitness
                      language: 'border-[#0284c7] bg-[#0284c7]/10', // Teal for learning
                      coding: 'border-[#9333ea] bg-[#9333ea]/10', // Purple for professional
                      meditation: 'border-[#ff6b6b] bg-[#ff6b6b]/10' // Coral for wellness
                    };
                    return (
                      <div
                        key={index}
                        className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${colorClasses[goalType]} text-sm font-medium mx-1.5 select-none`}
                      >
                        {goal}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 4 - Scroll Right */}
              <div
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                onMouseDown={() => setIsPausedRow4(true)}
                onMouseUp={() => setIsPausedRow4(false)}
                onMouseLeave={() => setIsPausedRow4(false)}
                onTouchStart={() => setIsPausedRow4(true)}
                onTouchEnd={() => setIsPausedRow4(false)}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  const scrollLeft = target.scrollLeft;

                  if (scrollLeft >= scrollWidth / 2 - clientWidth) {
                    target.scrollLeft = scrollLeft - scrollWidth / 4;
                  } else if (scrollLeft <= 0) {
                    target.scrollLeft = scrollWidth / 4;
                  }
                }}
              >
                <div className={`flex whitespace-nowrap ${isPausedRow4 ? '' : 'animate-scroll-right'}`}>
                  {[...scrollingGoalsRow4, ...scrollingGoalsRow4, ...scrollingGoalsRow4, ...scrollingGoalsRow4, ...scrollingGoalsRow4, ...scrollingGoalsRow4, ...scrollingGoalsRow4, ...scrollingGoalsRow4].map((goal, index) => {
                    const goalType = goalMapping[goal] || 'meditation';
                    const colorClasses = {
                      running: 'border-[#8eff3d] bg-[#8eff3d]/10', // Lime green for fitness
                      language: 'border-[#0284c7] bg-[#0284c7]/10', // Teal for learning
                      coding: 'border-[#9333ea] bg-[#9333ea]/10', // Purple for professional
                      meditation: 'border-[#ff6b6b] bg-[#ff6b6b]/10' // Coral for wellness
                    };
                    return (
                      <div
                        key={index}
                        className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${colorClasses[goalType]} text-sm font-medium mx-1.5 select-none`}
                      >
                        {goal}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 5 - Scroll Left */}
              <div
                className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                onMouseDown={() => setIsPausedRow5(true)}
                onMouseUp={() => setIsPausedRow5(false)}
                onMouseLeave={() => setIsPausedRow5(false)}
                onTouchStart={() => setIsPausedRow5(true)}
                onTouchEnd={() => setIsPausedRow5(false)}
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const scrollWidth = target.scrollWidth;
                  const clientWidth = target.clientWidth;
                  const scrollLeft = target.scrollLeft;

                  if (scrollLeft >= scrollWidth / 2 - clientWidth) {
                    target.scrollLeft = scrollLeft - scrollWidth / 4;
                  } else if (scrollLeft <= 0) {
                    target.scrollLeft = scrollWidth / 4;
                  }
                }}
              >
                <div className={`flex whitespace-nowrap ${isPausedRow5 ? '' : 'animate-scroll-left'}`}>
                  {[...scrollingGoalsRow5, ...scrollingGoalsRow5, ...scrollingGoalsRow5, ...scrollingGoalsRow5, ...scrollingGoalsRow5, ...scrollingGoalsRow5, ...scrollingGoalsRow5, ...scrollingGoalsRow5].map((goal, index) => {
                    const goalType = goalMapping[goal] || 'meditation';
                    const colorClasses = {
                      running: 'border-[#8eff3d] bg-[#8eff3d]/10', // Lime green for fitness
                      language: 'border-[#0284c7] bg-[#0284c7]/10', // Teal for learning
                      coding: 'border-[#9333ea] bg-[#9333ea]/10', // Purple for professional
                      meditation: 'border-[#ff6b6b] bg-[#ff6b6b]/10' // Coral for wellness
                    };
                    return (
                      <div
                        key={index}
                        className={`inline-block px-4 py-2 rounded-full text-gray-700 border-2 ${colorClasses[goalType]} text-sm font-medium mx-1.5 select-none`}
                      >
                        {goal}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-6">
                <Button
                  onClick={handleGetStarted}
                  className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-smooth hover:scale-105 px-8 py-6 text-lg"
                >
                  Start Your Own Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Day Detail Modal */}
      {selectedDay !== null && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn"
          onClick={closeDayDetail}
        >
          <Card
            className="bg-white/90 backdrop-blur-xl border-white/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/70 backdrop-blur-lg p-6 border-b border-gray-200 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {demoActivities[selectedDay].completed && (
                      <div className="bg-teal-600 rounded-full p-1">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-900">
                      {demoActivities[selectedDay].title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{demoActivities[selectedDay].date}</p>
                </div>
                <button
                  onClick={closeDayDetail}
                  className="ml-4 text-gray-500 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Activities List */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  Today&apos;s Activities
                </h4>
                <ul className="space-y-3">
                  {demoActivities[selectedDay].activities.map((activity: string, index: number) => (
                    <li key={index} className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        demoActivities[selectedDay].completed
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {demoActivities[selectedDay].completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-gray-700 flex-1">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tip */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Pro Tip
                </h4>
                <p className="text-gray-700 leading-relaxed">{demoActivities[selectedDay].tip}</p>
              </div>

              {/* Reflection */}
              {demoActivities[selectedDay].reflection && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Daily Reflection
                  </h4>
                  <div className="bg-white/60 rounded-lg p-3 mb-3">
                    <p className="text-gray-700 italic leading-relaxed">{demoActivities[selectedDay].reflection}</p>
                  </div>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    This is where you&apos;ll record your learnings, critical thoughts, and journey each day. At the end of your 30-day journey, we&apos;ll use these reflections to create a personalized summary that helps you understand your progress and set up your next goal more effectively.
                  </p>
                </div>
              )}

              {/* Incomplete Day Explanation */}
              {!demoActivities[selectedDay].reflection && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Daily Reflection
                  </h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    After completing your daily activities, you&apos;ll share your thoughts, challenges, and wins. These reflections chronicle your entire learning journey so that when we summarize it after the month ends, you&apos;ll be better positioned to set up your next goal based on the insights from your journey.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {!demoActivities[selectedDay].completed && (
                  <Button
                    onClick={onGetStarted}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-smooth"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Start Your Own Plan
                  </Button>
                )}
                <Button
                  onClick={closeDayDetail}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* How It Works - Detailed */}
      <section id="how-it-works" className="w-full py-16">
        <div className="space-y-20">
          {/* Step 1: Answer */}
          <div className="flex flex-col md:flex-row gap-6 items-start bg-white/40 backdrop-blur-xl rounded-none md:rounded-lg p-6 border-y md:border border-white/50 shadow-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-coral-600 text-white flex items-center justify-center shadow-lg text-2xl font-bold">
                1
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-3xl text-gray-900 font-bold">Answer</h3>
              <p className="text-gray-700 text-lg mb-4">
                Tell us what you want to achieve and answer a few quick questions about your experience level and available time. Our onboarding takes less than 2 minutes.
              </p>
              <div className="p-4 bg-coral-600 text-white rounded-none md:rounded-lg border-y md:border border-coral-700 shadow-lg -mx-8 md:mx-0 px-8 md:px-4">
                <p className="text-white">
                  <strong>Example goals:</strong> Learn Spanish basics, Build a meditation habit, Write a short story, Run a 5K
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Get Plan */}
          <div className="flex flex-col md:flex-row gap-6 items-start bg-white/40 backdrop-blur-xl rounded-none md:rounded-lg p-6 border-y md:border border-white/50 shadow-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg text-2xl font-bold">
                2
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-3xl text-gray-900 font-bold">Get Plan</h3>
              <div className="bg-purple-600 text-white rounded-none md:rounded-lg p-6 border-y md:border border-purple-700 shadow-lg -mx-8 md:mx-0 px-8 md:px-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                  <strong className="text-white text-lg">AI-Powered Personalization</strong>
                </div>
                <p className="text-purple-100 mb-3">
                  Your plan is unique to you. The AI considers:
                </p>
                <ul className="space-y-2 text-white grid sm:grid-cols-2 gap-x-4">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-200">&bull;</span>
                    <span>Your specific goal and why you want to achieve it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-200">&bull;</span>
                    <span>Your current experience and knowledge level</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3: Stay Consistent */}
          <div className="flex flex-col md:flex-row gap-6 items-start bg-white/40 backdrop-blur-xl rounded-none md:rounded-lg p-6 border-y md:border border-white/50 shadow-2xl">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg text-2xl font-bold">
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-3xl text-gray-900 font-bold">Stay Consistent</h3>
              <div className="bg-green-600 text-white rounded-none md:rounded-lg p-6 border-y md:border border-green-700 shadow-lg -mx-8 md:mx-0 px-8 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-white" />
                      <strong className="text-white text-lg">Daily Email Reminders</strong>
                    </div>
                    <p className="text-green-100">
                      Choose when you want to be reminded (morning, afternoon, or evening)
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-white" />
                      <strong className="text-white text-lg">Visual Calendar</strong>
                    </div>
                    <p className="text-green-100">
                      See your entire 30-day journey at a glance. Completed days are marked with checkmarks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-gray-700 py-6 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4">
          {/* Desktop Footer */}
          <div className="hidden md:block mb-8">
            <div className="max-w-md">
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => { e.preventDefault(); onPrivacyPolicy(); }}
                    className="text-gray-600 hover:text-teal-600 transition-colors text-sm"
                  >
                    Privacy &amp; Data
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => { e.preventDefault(); onTermsOfService(); }}
                    className="text-gray-600 hover:text-teal-600 transition-colors text-sm"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="https://straydesign.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-teal-600 transition-colors text-sm"
                  >
                    Portfolio
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Mobile Footer - Accordion Style */}
          <div className="md:hidden space-y-3 mb-6">
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => { e.preventDefault(); onPrivacyPolicy(); }}
                  className="text-gray-600 hover:text-teal-600 transition-colors text-sm block py-1"
                >
                  Privacy &amp; Data
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => { e.preventDefault(); onTermsOfService(); }}
                  className="text-gray-600 hover:text-teal-600 transition-colors text-sm block py-1"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://straydesign.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-teal-600 transition-colors text-sm block py-1"
                >
                  Portfolio
                </a>
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-300 pt-6 text-center text-gray-500 text-xs">
            <p>&copy; {new Date().getFullYear()} Day One. All rights reserved. // <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">https://straydesign.co</a></p>
            <p className="mt-0.5">
              Contact: <a href="mailto:support@firstday.life" className="text-teal-600 hover:underline">support@firstday.life</a>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
