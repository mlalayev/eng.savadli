export type IeltsQuestionFamily = {
  id: string;
  label: string;
  description: string;
  allowedFor: ("listening" | "reading" | "writing" | "speaking")[];
  questionType: "mcq_single" | "short_text" | "numeric" | "rich_text" | "writing";
};

export const IELTS_QUESTION_FAMILIES: IeltsQuestionFamily[] = [
  // READING FAMILIES
  {
    id: "multiple_choice",
    label: "Multiple Choice",
    description: "Choose the correct answer from the options A, B, C or D.",
    allowedFor: ["reading", "listening"],
    questionType: "mcq_single",
  },
  {
    id: "true_false_not_given",
    label: "True / False / Not Given",
    description: "Do the following statements agree with the information given in Reading Passage?",
    allowedFor: ["reading"],
    questionType: "mcq_single",
  },
  {
    id: "yes_no_not_given",
    label: "Yes / No / Not Given",
    description: "Do the following statements agree with the views of the writer in Reading Passage?",
    allowedFor: ["reading"],
    questionType: "mcq_single",
  },
  {
    id: "matching_headings",
    label: "Matching Headings",
    description: "Choose the correct heading for each paragraph from the list of headings below.",
    allowedFor: ["reading"],
    questionType: "short_text",
  },
  {
    id: "matching_information",
    label: "Matching Information",
    description: "Which paragraph contains the following information?",
    allowedFor: ["reading"],
    questionType: "short_text",
  },
  {
    id: "matching_features",
    label: "Matching Features",
    description: "Match each statement with the correct person/theory/period.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "matching_sentence_endings",
    label: "Matching Sentence Endings",
    description: "Complete each sentence with the correct ending, A-G, below.",
    allowedFor: ["reading"],
    questionType: "short_text",
  },
  {
    id: "sentence_completion",
    label: "Sentence Completion",
    description: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "summary_completion",
    label: "Summary Completion",
    description: "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "note_completion",
    label: "Note Completion",
    description: "Complete the notes below. Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "table_completion",
    label: "Table Completion",
    description: "Complete the table below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "flow_chart_completion",
    label: "Flow-chart Completion",
    description: "Complete the flow-chart below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "diagram_label_completion",
    label: "Diagram Label Completion",
    description: "Label the diagram below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },
  {
    id: "short_answer_questions",
    label: "Short-answer Questions",
    description: "Answer the questions below. Choose NO MORE THAN THREE WORDS from the passage for each answer.",
    allowedFor: ["reading", "listening"],
    questionType: "short_text",
  },

  // LISTENING SPECIFIC FAMILIES
  {
    id: "form_completion",
    label: "Form Completion",
    description: "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
    allowedFor: ["listening"],
    questionType: "short_text",
  },
  {
    id: "map_labelling",
    label: "Map / Plan Labelling",
    description: "Label the map below. Write the correct letter, A-J, next to Questions.",
    allowedFor: ["listening"],
    questionType: "short_text",
  },

  // WRITING & SPEAKING
  {
    id: "writing_task",
    label: "Writing Task",
    description: "Write your response below.",
    allowedFor: ["writing"],
    questionType: "writing",
  },
  {
    id: "speaking_task",
    label: "Speaking Task",
    description: "Speak about the topic below.",
    allowedFor: ["speaking"],
    questionType: "writing",
  },

  // RICH TEXT (for custom formatted questions)
  {
    id: "rich_text_question",
    label: "Custom Formatted Question",
    description: "Question with custom formatting.",
    allowedFor: ["reading", "listening"],
    questionType: "rich_text",
  },
];

export function getIeltsQuestionFamilies(group: "listening" | "reading" | "writing" | "speaking"): IeltsQuestionFamily[] {
  return IELTS_QUESTION_FAMILIES.filter((f) => f.allowedFor.includes(group));
}
