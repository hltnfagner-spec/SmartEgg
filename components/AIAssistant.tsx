
import { useState, useRef, useEffect, FC } from 'react';
import { useFarm } from '../context/FarmContext';
import { getAIInsight } from '../services/geminiService';
import { ChatMessage } from '../types';
import { AIIcon } from './icons';

// A simple markdown renderer component
const MarkdownRenderer: FC<{ content: string }> = ({ content }) => {
    // Process bold and italic first
    let processedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Process lists
    const lines = processedContent.split(/\r\n|\n/);
    let html = '';
    let inList = false;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('- ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            html += `<li class="ml-4 list-disc">${trimmedLine.substring(2)}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += line ? `<p>${line}</p>` : '<br />';
        }
    });

    if (inList) {
        html += '</ul>';
    }

    return <div className="prose prose-sm max-w-none text-stone-700" dangerouslySetInnerHTML={{ __html: html.replace(/<p><br \/><\/p>/g, '<br />').replace(/<\/p><p>/g, '</p><br /><p>') }} />;
};


const AIAssistant: FC = () => {
  const { flocks, records, expenses, sales } = useFarm();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Olá! Sou seu assistente de avicultura. Como posso ajudar a analisar os dados da sua granja hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIInsight(input, flocks, records, expenses, sales);
      const modelMessage: ChatMessage = { role: 'model', content: aiResponse };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: 'Ocorreu um erro ao buscar a resposta. Tente novamente.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetQuestion = (question: string) => {
    setInput(question);
  }

  const presetQuestions = [
    "Qual a tendência de produção da última semana?",
    "A mortalidade está dentro do esperado?",
    "Qual lote tem o maior lucro (receita - despesa)?",
    "Sugira formas de otimizar o consumo de ração."
  ];

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] md:max-h-[calc(100vh-48px)]">
      <h1 className="text-3xl font-bold text-stone-800 mb-4">Assistente AI</h1>
      <div className="flex-1 bg-white rounded-xl shadow-md p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                  <AIIcon />
                </div>
              )}
              <div className={`max-w-md lg:max-w-2xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-amber-100 text-stone-800' : 'bg-stone-100'}`}>
                <MarkdownRenderer content={msg.content} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white">
                <AIIcon />
              </div>
              <div className="p-3 rounded-lg bg-stone-100 text-stone-700">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-4 pt-4 border-t border-stone-200">
            <div className="flex flex-wrap gap-2 mb-4">
                {presetQuestions.map(q => (
                    <button key={q} onClick={() => handlePresetQuestion(q)} className="px-3 py-1 text-xs bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 transition-colors">
                        {q}
                    </button>
                ))}
            </div>
            <div className="flex items-center space-x-2">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pergunte algo sobre sua granja..."
                className="flex-1 px-4 py-2 bg-white border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isLoading}
                />
                <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="p-2 w-10 h-10 flex items-center justify-center bg-amber-600 text-white rounded-full disabled:bg-stone-400 hover:bg-amber-700 transition-colors"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
