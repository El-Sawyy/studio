'use server';
/**
 * @fileOverview A flow for auto-filling form fields based on user input.
 *
 * - autoFillFormFields - A function that handles the auto-fill process.
 * - AutoFillFormFieldsInput - The input type for the autoFillFormFields function.
 * - AutoFillFormFieldsOutput - The return type for the autoFillFormFields function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlanSchema = z.object({
  managerName: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  introduction: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
  empowermentStatement: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
  areasOfFocus: z
    .array(
      z.object({
        title: z
          .string()
          .describe('Format with HTML using <strong> tags.')
          .optional(),
        expectation: z
          .string()
          .describe('Format with HTML using <strong> and <ul><li> tags.')
          .optional(),
        actionPlan: z
          .array(
            z.object({
              text: z.string().optional(),
              completed: z.boolean().optional(),
            })
          )
          .optional()
          .describe('A checklist of actions. This MUST be an array of objects, each with a `text` and `completed` property. Do not use a single HTML string.'),
        goal: z
          .string()
          .describe('Format with HTML using <strong> and <ul><li> tags.')
          .optional(),
      })
    )
    .optional(),
  supportPlan: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
  consequences: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
  qaTargets: z
    .array(
      z.object({
        week: z.string().optional(),
        required: z.string().optional(),
        achieved: z.string().optional(),
      })
    )
    .optional(),
});

const WarningSchema = z.object({
  manager: z.string().optional(),
  date: z.string().optional(),
  summaryOfConcerns: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
  improvementActionPlan: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
  nextAction: z
    .string()
    .describe('Format with HTML using <strong> and <ul><li> tags.')
    .optional(),
});

const CoachingSchema = z.object({
  lastWeekPerformance: z
    .string()
    .describe(
      "Summary of agent's performance from the previous week. Format with HTML using <strong> and <ul><li> tags."
    )
    .optional(),
  strengths: z
    .string()
    .describe(
      'Positive points and things the agent is doing well. Format with HTML using <strong> and <ul><li> tags.'
    )
    .optional(),
  opportunities: z
    .string()
    .describe(
      'Areas for improvement and key discussion points. Format with HTML using <strong> and <ul><li> tags.'
    )
    .optional(),
  actionPlan: z
    .string()
    .describe(
      'A clear, itemized list of next steps for the agent. Format with HTML using <strong> and <ul><li> tags.'
    )
    .optional(),
  notes: z
    .string()
    .describe(
      'General summary, encouragement, or other notes. Format with HTML using <strong> tags for emphasis.'
    )
    .optional(),
  context: z
    .string()
    .describe('The context or situation for the feedback. Format with HTML.')
    .optional(),
  observedBehavior: z
    .string()
    .describe(
      'Specific, observable actions or behaviors. Format with HTML.'
    )
    .optional(),
  impact: z
    .string()
    .describe('The impact of the observed behavior. Format with HTML.')
    .optional(),
  nextSteps: z
    .string()
    .describe(
      'Next steps or consequences if behavior repeats. Format with HTML.'
    )
    .optional(),
});

const AutoFillFormFieldsInputSchema = z.object({
  formType: z.enum(['plan', 'warning', 'coaching']),
  mode: z.enum(['fill', 'generate']),
  text: z.string(),
});

export type AutoFillFormFieldsInput = z.infer<
  typeof AutoFillFormFieldsInputSchema
>;

const AutoFillFormFieldsOutputSchema = z.union([
  PlanSchema,
  WarningSchema,
  CoachingSchema,
]);

export type AutoFillFormFieldsOutput = z.infer<
  typeof AutoFillFormFieldsOutputSchema
>;

function getPromptAndSchema(input: AutoFillFormFieldsInput) {
  let schema;
  let promptText;

  // Sanitize the input text to remove problematic characters like emojis.
  const sanitizedText = input.text.replace(/[^\x00-\x7F]/g, '');
  const wordCount = sanitizedText.split(/\s+/).filter(Boolean).length;

  switch (input.formType) {
    case 'plan':
      schema = PlanSchema;
      break;
    case 'warning':
      schema = WarningSchema;
      break;
    case 'coaching':
      schema = CoachingSchema;
      break;
  }

  if (input.mode === 'generate' && wordCount > 0 && wordCount <= 3) {
    promptText = `You are a professional team leader. The user has provided a keyword: "${sanitizedText}". Your task is to expand this keyword into a meaningful sentence or a short paragraph. The generated text should be relevant to a coaching session, performance improvement plan, or a formal warning.\n\n- If the keyword is positive (e.g., "Good job", "Excellent"), treat it as a strength.\n- If the keyword is negative or an area for improvement (e.g., "Communication", "Tardiness"), treat it as an opportunity or a concern.\n\nBased on your judgment, place the generated content into the most appropriate field within the JSON object (e.g., 'strengths', 'opportunities', 'summaryOfConcerns'). The output must be a valid JSON object following the provided schema. Format the content with professional and encouraging language.`;
  } else if (input.mode === 'fill') {
    promptText = `You are an expert administrative assistant. Analyze the following text and extract the information into a valid JSON object based on the provided schema. For 'plan' forms, ensure the 'actionPlan' field is an array of objects, with each object having a 'text' and 'completed' property. The 'completed' property should be 'false' by default. It is crucial that you identify and convert bullet points, numbered items, and distinct paragraphs into clean, structured HTML for fields that support it, using tags like <ul>, <ol>, <li>, <p>, and <strong> for bolding. Retain any hyperlinks found in the original text.\n\nText:\n${sanitizedText}`;
  } else { // This covers 'generate' mode for longer inputs
    promptText = `You are a professional team leader. Generate a well-structured document based on these notes: "${sanitizedText}". The output must be a valid JSON object following the schema. For 'plan' forms, ensure the 'actionPlan' field is an array of objects, each with a 'text' and a 'completed' property set to 'false'. Determine if the notes describe a standard coaching session or a structured feedback session and populate only the relevant fields. Format the content with professional and encouraging language. Use HTML to structure the text where supported: use <strong> for emphasis, and use <ul> or <ol> for lists.`;
  }

  return { schema, promptText };
}

const autoFillFormFieldsFlow = ai.defineFlow(
  {
    name: 'autoFillFormFieldsFlow',
    inputSchema: AutoFillFormFieldsInputSchema,
    outputSchema: AutoFillFormFieldsOutputSchema,
  },
  async (input) => {
    const { schema, promptText } = getPromptAndSchema(input);

    const llmResponse = await ai.generate({
      prompt: promptText,
      output: { schema },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error('Failed to generate a valid response from the AI model.');
    }
    return output;
  }
);


export async function autoFillFormFields(
  input: AutoFillFormFieldsInput
): Promise<AutoFillFormFieldsOutput> {
  return await autoFillFormFieldsFlow(input);
}
