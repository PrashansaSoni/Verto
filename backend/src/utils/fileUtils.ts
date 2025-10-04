import fs from 'fs';
import path from 'path';
import multer from 'multer';

const { pdf: pdfParse } = require('pdf-parse');

// Enhanced content parsing interface
export interface ParsedContent {
  rawText: string;
  sections: ContentSection[];
  metadata: ContentMetadata;
  wordCount: number;
  estimatedReadingTime: number;
}

export interface ContentSection {
  title?: string;
  content: string;
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'table';
  level?: number; // For headings
}

export interface ContentMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  language?: string;
  topics?: string[];
  complexity?: 'basic' | 'intermediate' | 'advanced';
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

export const createUploadsDir = async (): Promise<void> => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only allow PDF files for question generation
  const allowedTypes = ['.pdf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension) || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF files are allowed for question generation.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

export const readFileContent = async (filePath: string): Promise<string> => {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (fileExtension === '.pdf') {
      // Handle PDF files
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else {
      // Only PDF files are supported for question generation
      throw new Error('Only PDF files are supported for question generation');
    }
  } catch (error) {
    console.error('Error reading file content:', error);
    throw new Error(`Failed to read file content: ${error}`);
  }
};

// Enhanced file content parsing with structure analysis
export const parseFileContent = async (filePath: string): Promise<ParsedContent> => {
  try {
    const rawText = await readFileContent(filePath);
    const fileName = path.basename(filePath);
    const fileType = path.extname(filePath).toLowerCase();
    const stats = fs.statSync(filePath);
    
    // Validate content quality
    validateContentQuality(rawText, fileName);
    
    // Parse content into sections
    const sections = parseTextIntoSections(rawText);
    
    // Calculate metadata
    const wordCount = countWords(rawText);
    const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    // Analyze content for topics and complexity
    const topics = extractTopics(rawText);
    const complexity = analyzeComplexity(rawText);
    
    return {
      rawText,
      sections,
      metadata: {
        fileName,
        fileType,
        fileSize: stats.size,
        topics,
        complexity,
      },
      wordCount,
      estimatedReadingTime,
    };
  } catch (error) {
    console.error('Error parsing file content:', error);
    throw new Error('Failed to parse file content');
  }
};

// Validate content quality for question generation
const validateContentQuality = (content: string, fileName: string): void => {
  const trimmedContent = content.trim();
  
  // Check if content is empty or too short
  if (!trimmedContent || trimmedContent.length < 50) {
    throw new Error(`File "${fileName}" contains insufficient content for question generation. Please ensure the file has meaningful text content.`);
  }
  
  // Check word count
  const wordCount = countWords(trimmedContent);
  if (wordCount < 20) {
    throw new Error(`File "${fileName}" contains too few words (${wordCount}). At least 20 words are required for meaningful question generation.`);
  }
  
  // Check for mostly non-text content (like corrupted files or binary data)
  const nonTextChars = (trimmedContent.match(/[^\w\s\.,;:!?\-'"()\[\]{}]/g) || []).length;
  const nonTextRatio = nonTextChars / trimmedContent.length;
  
  if (nonTextRatio > 0.3) {
    throw new Error(`File "${fileName}" appears to contain mostly non-text content. Please ensure the file is a readable text document.`);
  }
  
  // Check for meaningful sentences
  const sentences = trimmedContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 3) {
    throw new Error(`File "${fileName}" does not contain enough meaningful sentences for question generation.`);
  }
};

// Parse text into structured sections
const parseTextIntoSections = (text: string): ContentSection[] => {
  const sections: ContentSection[] = [];
  const lines = text.split('\n');
  let currentSection: ContentSection | null = null;
  
  // Clean and normalize the text first
  const cleanedLines = lines.map(line => line.trim()).filter(line => line.length > 0);
  
  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    
    // Check for headings (lines that are all caps or start with #)
    if (isHeading(line)) {
      // Save previous section
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }
      
      // Start new heading section and collect content until next heading
      const headingTitle = line.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, ''); // Remove markdown # symbols and numbers
      const headingContent = [];
      
      // Look ahead to collect content for this heading
      let j = i + 1;
      while (j < cleanedLines.length && !isHeading(cleanedLines[j])) {
        headingContent.push(cleanedLines[j]);
        j++;
      }
      
      currentSection = {
        title: headingTitle,
        content: headingContent.join(' ').trim(),
        type: 'heading',
        level: getHeadingLevel(line),
      };
      
      // Skip the lines we've already processed
      i = j - 1;
    }
    // Check for list items
    else if (isListItem(line)) {
      if (currentSection?.type !== 'list') {
        // Save previous section
        if (currentSection && currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Start new list section
        currentSection = {
          content: line + '\n',
          type: 'list',
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    // Check for code blocks
    else if (isCodeBlock(line)) {
      if (currentSection?.type !== 'code') {
        // Save previous section
        if (currentSection && currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Start new code section
        currentSection = {
          content: line + '\n',
          type: 'code',
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    // Regular paragraph content
    else {
      if (!currentSection || currentSection.type === 'heading') {
        // Don't create a new section if we just processed a heading
        if (currentSection?.type === 'heading') {
          continue;
        }
        
        // Start new paragraph section
        currentSection = {
          content: line + ' ',
          type: 'paragraph',
        };
      } else if (currentSection.type === 'paragraph') {
        currentSection.content += line + ' ';
      } else {
        // Different section type, save and start new paragraph
        sections.push(currentSection);
        currentSection = {
          content: line + ' ',
          type: 'paragraph',
        };
      }
    }
  }
  
  // Add final section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  // Post-process sections to merge small adjacent paragraphs and clean content
  return postProcessSections(sections);
};

// Post-process sections to improve content structure
const postProcessSections = (sections: ContentSection[]): ContentSection[] => {
  const processedSections: ContentSection[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Clean up content
    section.content = section.content.trim().replace(/\s+/g, ' ');
    
    // Skip very short sections unless they're headings
    if (section.content.length < 20 && section.type !== 'heading') {
      // Try to merge with next paragraph section
      if (i + 1 < sections.length && sections[i + 1].type === 'paragraph') {
        sections[i + 1].content = section.content + ' ' + sections[i + 1].content;
        continue;
      }
    }
    
    // Merge consecutive paragraph sections if they're short
    if (section.type === 'paragraph' && 
        i + 1 < sections.length && 
        sections[i + 1].type === 'paragraph' &&
        section.content.length < 100 &&
        sections[i + 1].content.length < 100) {
      
      section.content += ' ' + sections[i + 1].content;
      i++; // Skip the next section as we've merged it
    }
    
    processedSections.push(section);
  }
  
  return processedSections;
};

// Helper functions for content analysis
const isHeading = (line: string): boolean => {
  // Markdown heading
  if (line.startsWith('#')) {
    return true;
  }
  
  // Numbered heading (1. Introduction, 2.1 Overview, etc.)
  if (/^\d+(\.\d+)*\.\s+[A-Z]/.test(line)) {
    return true;
  }
  
  // All caps heading (but not too long and contains letters)
  if (line.length > 3 && line.length < 80 && 
      line === line.toUpperCase() && 
      /[A-Z]/.test(line) && 
      !line.includes('.') && 
      line.split(' ').length <= 8) {
    return true;
  }
  
  // Title case heading (Most Words Capitalized)
  const words = line.split(' ');
  if (words.length >= 2 && words.length <= 8 && 
      words.every(word => word.length > 0 && word[0] === word[0].toUpperCase()) &&
      !line.endsWith('.') && !line.endsWith(',') && !line.endsWith(';')) {
    return true;
  }
  
  return false;
};

const getHeadingLevel = (line: string): number => {
  const hashMatch = line.match(/^#+/);
  if (hashMatch) {
    return hashMatch[0].length;
  }
  return 1; // Default level
};

const isListItem = (line: string): boolean => {
  return (
    line.startsWith('- ') ||
    line.startsWith('* ') ||
    line.startsWith('+ ') ||
    /^\d+\.\s/.test(line) ||
    line.startsWith('• ')
  );
};

const isCodeBlock = (line: string): boolean => {
  return (
    line.startsWith('```') ||
    line.startsWith('    ') || // Indented code
    line.includes('function ') ||
    line.includes('class ') ||
    line.includes('def ') ||
    line.includes('import ')
  );
};

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const extractTopics = (text: string): string[] => {
  const topics: string[] = [];
  const words = text.toLowerCase().split(/\s+/);
  
  // Simple keyword extraction - look for repeated important terms
  const wordFreq: { [key: string]: number } = {};
  
  words.forEach(word => {
    // Clean word and filter out common words
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3 && !isCommonWord(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });
  
  // Get top frequent words as topics
  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  return sortedWords;
};

const analyzeComplexity = (text: string): 'basic' | 'intermediate' | 'advanced' => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = countWords(text) / sentences.length;
  
  // Simple complexity analysis based on sentence length and vocabulary
  if (avgWordsPerSentence < 10) {
    return 'basic';
  } else if (avgWordsPerSentence < 20) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
};

const isCommonWord = (word: string): boolean => {
  const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must',
    'this', 'that', 'these', 'those', 'a', 'an', 'some', 'any', 'all', 'each', 'every',
    'from', 'into', 'onto', 'upon', 'over', 'under', 'above', 'below', 'through',
    'what', 'when', 'where', 'why', 'how', 'who', 'which', 'whose', 'whom'
  ];
  
  return commonWords.includes(word.toLowerCase());
};
