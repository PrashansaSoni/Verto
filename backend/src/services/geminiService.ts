import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedContent, ContentSection } from '../utils/fileUtils';

export interface GeneratedQuestion {
  questionText: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  correctExplanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  sourceSection?: string; // Which section the question was generated from
}

export interface QuestionGenerationParams {
  numberOfQuestions: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: ('mcq' | 'multiple_select' | 'true_false')[];
  focusAreas?: string[]; // Specific topics to focus on
  customPrompt?: string;
  distributionStrategy?: 'even' | 'weighted'; // How to distribute questions across sections
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  }

  async generateQuestions(
    content: string,
    prompt: string,
    numberOfQuestions: number
  ): Promise<GeneratedQuestion[]> {
    try {
      const geminiPrompt = this.buildPrompt(content, prompt, numberOfQuestions);
      
      const result = await this.model.generateContent(geminiPrompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text);
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw new Error('Failed to generate questions using AI');
    }
  }

  private buildPrompt(content: string, customPrompt: string, numberOfQuestions: number): string {
    return `
You are an expert quiz creator. Based on the following content, generate exactly ${numberOfQuestions} high-quality multiple choice questions that test comprehension and understanding of the material.

CONTENT TO ANALYZE:
${content}

CRITICAL INSTRUCTIONS:
1. Questions MUST be based on the actual content provided above
2. DO NOT ask questions about the document itself (like "How many pages?", "What type of file?", etc.)
3. Focus on the concepts, facts, processes, and information contained within the content
4. Test understanding, application, and analysis of the material
5. Create questions that require the reader to have actually read and understood the content
6. Write questions DIRECTLY without prefixes like "Based on the content", "According to the document", etc.
7. Make questions clear and concise - they should stand alone without referencing the source

QUESTION REQUIREMENTS:
- Generate exactly ${numberOfQuestions} questions
- Each question should have 4 options (A, B, C, D)
- Only one option should be correct for each question
- Questions should cover different parts of the content when possible
- Vary difficulty levels (easy, medium, hard)
- Write questions as direct statements or questions without source references
- Include questions that test:
  * Key concepts and definitions
  * Important facts and details
  * Relationships between ideas
  * Applications of the material
  * Analysis and interpretation

ADDITIONAL INSTRUCTIONS:
${customPrompt}

FORMAT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionText": "What is the primary purpose of...?",
    "options": [
      {"text": "Option A", "isCorrect": false},
      {"text": "Option B", "isCorrect": true},
      {"text": "Option C", "isCorrect": false},
      {"text": "Option D", "isCorrect": false}
    ],
    "correctExplanation": "Detailed explanation of why this answer is correct...",
    "difficulty": "medium"
  }
]

IMPORTANT REMINDERS:
- All questions and answers must be derived from the provided content
- Do not create generic questions that could apply to any document
- Ensure questions test actual comprehension of the material
- Return only valid JSON without any additional text
`;
  }

  private parseGeminiResponse(response: string): GeneratedQuestion[] {
    try {
      // Clean the response to extract JSON
      let cleanedResponse = response.trim();
      
      // Remove any markdown code block markers
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to find JSON array in the response
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      const questions = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      // Validate each question
      return questions.map((q, index) => {
        if (!q.questionText || !q.options || !Array.isArray(q.options)) {
          throw new Error(`Invalid question format at index ${index}`);
        }
        
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }
        
        const correctOptions = q.options.filter((opt: any) => opt.isCorrect);
        if (correctOptions.length !== 1) {
          throw new Error(`Question ${index + 1} must have exactly one correct option`);
        }
        
        return {
          questionText: q.questionText,
          options: q.options.map((opt: any) => ({
            text: opt.text,
            isCorrect: Boolean(opt.isCorrect)
          })),
          correctExplanation: q.correctExplanation || 'No explanation provided',
          difficulty: q.difficulty || 'medium'
        };
      });
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }

  async generateQuestionsFromText(
    text: string,
    customPrompt: string = '',
    numberOfQuestions: number = 5
  ): Promise<GeneratedQuestion[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Content is required for question generation');
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      throw new Error('Number of questions must be between 1 and 20');
    }

    return this.generateQuestions(text, customPrompt, numberOfQuestions);
  }

  // Enhanced method to generate questions from parsed content
  async generateQuestionsFromParsedContent(
    parsedContent: ParsedContent,
    params: QuestionGenerationParams
  ): Promise<GeneratedQuestion[]> {
    try {
      console.log('Generating questions from parsed content:', {
        sections: parsedContent.sections.length,
        wordCount: parsedContent.wordCount,
        topics: parsedContent.metadata.topics,
        complexity: parsedContent.metadata.complexity,
        params
      });

      // Filter content sections that are suitable for question generation
      const suitableSections = this.filterSuitableSections(parsedContent.sections);
      
      if (suitableSections.length === 0) {
        throw new Error('No suitable content sections found for question generation');
      }

      // Distribute questions across sections
      const questionDistribution = this.distributeQuestions(
        suitableSections, 
        params.numberOfQuestions,
        params.distributionStrategy || 'even'
      );

      const allQuestions: GeneratedQuestion[] = [];

      // Generate questions for each section
      for (const { section, questionCount } of questionDistribution) {
        if (questionCount > 0) {
          const sectionQuestions = await this.generateQuestionsForSection(
            section,
            questionCount,
            params,
            parsedContent.metadata
          );
          allQuestions.push(...sectionQuestions);
        }
      }

      // Shuffle questions to mix sections
      return this.shuffleArray(allQuestions).slice(0, params.numberOfQuestions);
    } catch (error) {
      console.error('Error generating questions from parsed content:', error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        console.error('Specific error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // If it's a parsing error, provide more context
        if (error.message.includes('parse') || error.message.includes('JSON')) {
          throw new Error(`Failed to parse AI response for question generation: ${error.message}`);
        }
        
        // If it's an API error, provide more context
        if (error.message.includes('API') || error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new Error(`AI service error: ${error.message}`);
        }
        
        // Re-throw with original message for other errors
        throw new Error(`Question generation failed: ${error.message}`);
      }
      
      throw new Error('Failed to generate questions from parsed content');
    }
  }

  // Filter sections suitable for question generation
  private filterSuitableSections(sections: ContentSection[]): ContentSection[] {
    return sections.filter(section => {
      // Skip very short sections or headings without content
      if (section.type === 'heading' && !section.content.trim()) {
        return false;
      }
      
      // Require minimum content length
      const wordCount = section.content.trim().split(/\s+/).length;
      return wordCount >= 10; // At least 10 words
    });
  }

  // Distribute questions across sections
  private distributeQuestions(
    sections: ContentSection[],
    totalQuestions: number,
    strategy: 'even' | 'weighted'
  ): Array<{ section: ContentSection; questionCount: number }> {
    const distribution: Array<{ section: ContentSection; questionCount: number }> = [];
    
    if (strategy === 'even') {
      // Distribute evenly across sections
      const questionsPerSection = Math.floor(totalQuestions / sections.length);
      const remainder = totalQuestions % sections.length;
      
      sections.forEach((section, index) => {
        const questionCount = questionsPerSection + (index < remainder ? 1 : 0);
        distribution.push({ section, questionCount });
      });
    } else {
      // Weighted distribution based on content length
      const sectionWeights = sections.map(section => {
        const wordCount = section.content.trim().split(/\s+/).length;
        return Math.max(1, wordCount); // Minimum weight of 1
      });
      
      const totalWeight = sectionWeights.reduce((sum, weight) => sum + weight, 0);
      
      let remainingQuestions = totalQuestions;
      
      sections.forEach((section, index) => {
        const weight = sectionWeights[index];
        const proportion = weight / totalWeight;
        let questionCount = Math.round(proportion * totalQuestions);
        
        // Ensure we don't exceed remaining questions
        questionCount = Math.min(questionCount, remainingQuestions);
        
        distribution.push({ section, questionCount });
        remainingQuestions -= questionCount;
      });
      
      // Distribute any remaining questions
      let index = 0;
      while (remainingQuestions > 0 && index < distribution.length) {
        distribution[index].questionCount++;
        remainingQuestions--;
        index = (index + 1) % distribution.length;
      }
    }
    
    return distribution;
  }

  // Generate questions for a specific section
  private async generateQuestionsForSection(
    section: ContentSection,
    questionCount: number,
    params: QuestionGenerationParams,
    metadata: any
  ): Promise<GeneratedQuestion[]> {
    try {
      console.log('Generating questions for section:', {
        sectionTitle: section.title,
        sectionType: section.type,
        contentLength: section.content.length,
        questionCount
      });

      const sectionPrompt = this.buildSectionPrompt(section, questionCount, params, metadata);
      
      console.log('Section prompt created, calling Gemini API...');
      const result = await this.model.generateContent(sectionPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini API response received, parsing questions...');
      const questions = this.parseGeminiResponse(text);
      
      console.log(`Successfully parsed ${questions.length} questions from section`);
      
      // Add source section information
      return questions.map(question => ({
        ...question,
        sourceSection: section.title || `${section.type} section`
      }));
    } catch (error) {
      console.error('Error in generateQuestionsForSection:', error);
      console.error('Section details:', {
        title: section.title,
        type: section.type,
        contentLength: section.content.length,
        contentPreview: section.content.substring(0, 200)
      });
      
      if (error instanceof Error) {
        console.error('Section generation error:', error.message);
        // Add section context to the error
        throw new Error(`Failed to generate questions for section "${section.title || section.type}": ${error.message}`);
      }
      
      throw error; // Re-throw to be caught by the parent method
    }
  }

  // Build enhanced prompt for section-based generation
  private buildSectionPrompt(
    section: ContentSection,
    questionCount: number,
    params: QuestionGenerationParams,
    metadata: any
  ): string {
    const sectionTitle = section.title || `${section.type} content`;
    const difficulty = params.difficulty || 'medium';
    const questionTypes = params.questionTypes || ['mcq'];
    
    let prompt = `You are an expert quiz creator. Generate ${questionCount} high-quality quiz questions based on the following content section that test deep understanding of the material.

SECTION: ${sectionTitle}
CONTENT TYPE: ${section.type}
DIFFICULTY LEVEL: ${difficulty}
QUESTION TYPES: ${questionTypes.join(', ')}

CONTENT TO ANALYZE:
${section.content}

CRITICAL INSTRUCTIONS:
1. Questions MUST be based on the actual content provided above
2. DO NOT ask questions about the document format, structure, or metadata
3. Focus on the concepts, facts, processes, and information contained within this section
4. Test understanding, application, and analysis of the material
5. Create questions that require the reader to have actually read and understood this specific content
6. Questions should be specific to this section's content, not generic
7. Write questions DIRECTLY without prefixes like "Based on this section", "According to the content", etc.
8. Make questions clear and concise - they should stand alone without referencing the source

REQUIREMENTS:
- Generate exactly ${questionCount} question(s)
- Difficulty level should be ${difficulty}
- Focus on key concepts and important information from this section
- Questions should test understanding, not just memorization
- Write questions as direct statements or questions without source references
- Create questions that cover:
  * Main ideas and concepts in this section
  * Specific facts and details mentioned
  * Relationships between ideas presented
  * Applications or implications of the content
  * Analysis and interpretation of the material
- Provide clear, unambiguous correct answers
- Include helpful explanations that reference the content
`;

    if (params.focusAreas && params.focusAreas.length > 0) {
      prompt += `- Focus particularly on these areas: ${params.focusAreas.join(', ')}\n`;
    }

    if (params.customPrompt) {
      prompt += `- Additional instructions: ${params.customPrompt}\n`;
    }

    prompt += `
FORMAT: Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionText": "What is the main concept regarding...?",
    "options": [
      {"text": "Option A", "isCorrect": false},
      {"text": "Option B", "isCorrect": true},
      {"text": "Option C", "isCorrect": false},
      {"text": "Option D", "isCorrect": false}
    ],
    "correctExplanation": "Detailed explanation of why this answer is correct...",
    "difficulty": "${difficulty}"
  }
]

IMPORTANT REMINDERS:
- All questions and answers must be derived from the provided section content
- Do not create generic questions that could apply to any document
- Ensure questions test actual comprehension of this specific material
- Return only valid JSON without any additional text`;

    return prompt;
  }

  // Utility method to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

let geminiServiceInstance: GeminiService | null = null;

export const getGeminiService = (): GeminiService => {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
};

export default getGeminiService;
