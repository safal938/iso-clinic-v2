// Placeholder for Gemini service - can be implemented later with actual API
export const generatePatientResponse = async (
  history: { role: string; text: string }[], 
  userMessage: string
): Promise<string> => {
  // Mock response for now - can be replaced with actual Gemini API call
  console.log('Generating response for:', userMessage);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple mock responses based on keywords
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('breath') || lowerMessage.includes('breathing')) {
    return "It's been getting worse over the past few days. Even light activity makes me feel winded.";
  }
  
  if (lowerMessage.includes('pain') || lowerMessage.includes('chest')) {
    return "There's a tightness in my chest, especially when I try to take deep breaths. It's uncomfortable.";
  }
  
  if (lowerMessage.includes('medication') || lowerMessage.includes('meds')) {
    return "I've been taking the Entecavir as prescribed. The symptoms started about a week after I began the treatment.";
  }
  
  if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
    return "No fever that I've noticed. Just the breathing issues and fatigue.";
  }
  
  // Default response
  return "I'm not sure about that. The main thing bothering me is the shortness of breath and feeling tired all the time.";
};
