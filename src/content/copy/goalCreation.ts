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

  // Skill level slider (1-100). One example line per band.
  skillLabel: "How good are you at it now?",
  skillExamples: {
    starting: "Never tried it",
    beginner: "Tried it a few times",
    intermediate: "I do it now and then",
    advanced: "I do it a lot",
    expert: "I could teach it",
  },
  skillLow: "New",
  skillHigh: "Pro",

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
    "We build your first week now. The next three come as you finish each one.",

  // Validation modal
  validationTitle: "Hold up!",
  validationBody: "Just fill in your goal above and we'll build your plan",
  validationConfirm: "Got It",
} as const;
