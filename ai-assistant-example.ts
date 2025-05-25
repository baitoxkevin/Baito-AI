// Example: Simple AI Assistant Handler for BaitoAI
import { supabase } from '@/lib/supabase';

interface AICommand {
  intent: 'ADD_CANDIDATE' | 'GET_PROJECTS' | 'ASSIGN_STAFF' | 'CHECK_STATUS';
  entities: Record<string, any>;
}

export class BaitoAIAssistant {
  // Parse natural language to commands
  async parseMessage(message: string): Promise<AICommand> {
    const lowerMessage = message.toLowerCase();
    
    // Simple intent detection (in production, use AI service)
    if (lowerMessage.includes('add') && lowerMessage.includes('candidate')) {
      // Extract name and phone using regex or AI
      const nameMatch = message.match(/name (?:is )?([A-Za-z\s]+)/i);
      const phoneMatch = message.match(/\b(\d{3}-?\d{7,8})\b/);
      
      return {
        intent: 'ADD_CANDIDATE',
        entities: {
          name: nameMatch?.[1]?.trim(),
          phone: phoneMatch?.[1]
        }
      };
    }
    
    if (lowerMessage.includes('show') && lowerMessage.includes('project')) {
      return {
        intent: 'GET_PROJECTS',
        entities: {
          date: lowerMessage.includes('today') ? new Date() : null,
          status: lowerMessage.includes('active') ? 'in-progress' : null
        }
      };
    }
    
    // More intent patterns...
    throw new Error('Sorry, I didn\'t understand that command');
  }
  
  // Execute the parsed command
  async executeCommand(command: AICommand): Promise<string> {
    switch (command.intent) {
      case 'ADD_CANDIDATE': {
        const { name, phone } = command.entities;
        
        if (!name || !phone) {
          return 'Please provide both name and phone number. For example: "Add John Doe with phone 012-3456789"';
        }
        
        const { data, error } = await supabase
          .from('candidates')
          .insert({
            full_name: name,
            phone_number: phone,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) {
          return `Sorry, I couldn't add the candidate: ${error.message}`;
        }
        
        return `✅ Successfully added ${name} as a candidate!\nPhone: ${phone}\nID: ${data.id}`;
      }
      
      case 'GET_PROJECTS': {
        const query = supabase.from('projects').select('*');
        
        if (command.entities.date) {
          const today = new Date();
          query.gte('start_date', today.toISOString().split('T')[0]);
          query.lte('start_date', today.toISOString().split('T')[0]);
        }
        
        if (command.entities.status) {
          query.eq('status', command.entities.status);
        }
        
        const { data, error } = await query.limit(5);
        
        if (error) {
          return 'Sorry, I couldn\'t fetch the projects';
        }
        
        if (!data || data.length === 0) {
          return 'No projects found matching your criteria';
        }
        
        const projectList = data.map(p => 
          `📋 ${p.title}\n   📅 ${p.start_date}\n   👥 ${p.filled_positions}/${p.crew_count} staff`
        ).join('\n\n');
        
        return `Found ${data.length} projects:\n\n${projectList}`;
      }
      
      default:
        return 'Sorry, I don\'t know how to handle that request yet';
    }
  }
  
  // Main handler
  async handleMessage(message: string): Promise<string> {
    try {
      const command = await this.parseMessage(message);
      return await this.executeCommand(command);
    } catch (error) {
      return error.message || 'Sorry, something went wrong';
    }
  }
}

// Usage example
export async function handleWhatsAppMessage(
  phoneNumber: string, 
  message: string
): Promise<string> {
  // Verify user
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();
  
  if (!user) {
    return 'Sorry, I don\'t recognize your phone number. Please contact admin.';
  }
  
  const assistant = new BaitoAIAssistant();
  return await assistant.handleMessage(message);
}

// Example React Hook for in-app chat
export function useAIAssistant() {
  const [isProcessing, setIsProcessing] = useState(false);
  const assistant = new BaitoAIAssistant();
  
  const sendMessage = async (message: string) => {
    setIsProcessing(true);
    try {
      const response = await assistant.handleMessage(message);
      return { success: true, message: response };
    } catch (error) {
      return { success: false, message: 'Failed to process message' };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return { sendMessage, isProcessing };
}