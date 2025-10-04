// Utility functions for reading file content in the browser

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    // For PDF files, we'll need to handle them differently
    if (file.type === 'application/pdf') {
      // For now, we'll still send PDF files as binary and let backend handle parsing
      // This is because PDF parsing in the browser requires additional libraries
      reject(new Error('PDF files should be processed on the server'));
    } else {
      // For text files, DOCX, etc.
      reader.readAsText(file);
    }
  });
};

export const getFileExtension = (file: File): string => {
  return file.name.split('.').pop()?.toLowerCase() || '';
};

export const isTextFile = (file: File): boolean => {
  const textTypes = ['text/plain', 'text/csv', 'text/html', 'text/markdown'];
  const textExtensions = ['txt', 'csv', 'md', 'html', 'htm'];
  
  return textTypes.includes(file.type) || 
         textExtensions.includes(getFileExtension(file));
};

export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || getFileExtension(file) === 'pdf';
};

export const isDocxFile = (file: File): boolean => {
  const docxTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  const docxExtensions = ['docx', 'doc'];
  
  return docxTypes.includes(file.type) || 
         docxExtensions.includes(getFileExtension(file));
};
