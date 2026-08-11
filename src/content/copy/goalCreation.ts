export const goalCreation = {
  // Header
  title: "Let's Create Your Goal",
  subtitle: "Tell us what you want to achieve",

  // Goal field
  goalLabel: "What's your goal?",
  goalPlaceholder: "Type your goal here...",

  // Template grid
  templateDivider: "Or start from a template",

  // Why field
  whyLabel: "Why do you want to achieve this?",
  whyPlaceholder: "Tell us what motivates you...",

  // Experience level
  experienceLabel: "What's your experience level?",
  experienceOptions: [
    { value: "beginner", label: "Beginner", desc: "Just starting" },
    { value: "intermediate", label: "Intermediate", desc: "Some experience" },
    { value: "advanced", label: "Advanced", desc: "Experienced" },
  ],

  // Optional fields
  optionalToggle: "Tell us more (optional)",
  priorExperienceLabel: "What have you tried before?",
  priorExperiencePlaceholder: "e.g., Took an online course, read a book...",
  preferredTacticsLabel: "How do you like to learn?",
  preferredTacticsPlaceholder: "e.g., Videos, hands-on practice, reading...",

  // CTA
  generatingButton: "Generating your plan...",
  generateButton: "Generate My Plan",
  cancelButton: "Cancel",
  footerMicrocopy:
    "AI builds your first 7-day sprint right now — three more sprints generate as you finish each one.",

  // Validation modal
  validationTitle: "Hold up!",
  validationBody: "Just fill in your goal above and we'll build your plan",
  validationConfirm: "Got It",
} as const;
