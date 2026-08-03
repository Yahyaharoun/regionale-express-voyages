"use client";

import { useState } from "react";
import { Bot, X, Send, Maximize2, Minimize2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AIResponse } from "@/components/ai/AIResponse";

import { useSearchParams } from "next/navigation";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function CopilotWidget() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const newMessage: Message = { id: Date.now().toString(), role: 'user', content: inputValue };
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);
    setErrorMsg(null);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, newMessage],
          context: { from: fromParam, to: toParam }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Erreur de communication avec l'IA");
      }

      const data = await res.json();
      
      const assistantMessageId = (Date.now() + 1).toString();
      let content = data.text;
      
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content }]);

    } catch (err: any) {
      setErrorMsg(err.message);
      toast.error("Erreur IA: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        aria-label="Ouvrir l'assistant AI"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-2xl shadow-primary/30 z-50 hover:scale-105 transition-transform"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col shadow-2xl transition-all duration-300 ${isExpanded ? 'w-[calc(100vw-2rem)] h-[80vh] md:w-[600px] md:h-[800px]' : 'w-[calc(100vw-2rem)] sm:w-[350px] h-[70vh] sm:h-[500px]'}`}>
      <CardHeader className="p-4 border-b border-border/50 bg-muted/30 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary p-2 rounded-full">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">REGIONALE EXPRESS VOYAGES SARL AI</CardTitle>
            <p className="text-xs text-muted-foreground">Assistant Financier</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={isExpanded ? "Réduire l'assistant" : "Agrandir l'assistant"} onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Fermer l'assistant" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-10">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Bonjour ! Je suis l'IA de REGIONALE EXPRESS VOYAGES SARL.</p>
            <p className="mt-1">Posez-moi une question sur vos finances.</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative group max-w-[90%] rounded-2xl px-5 py-3.5 text-sm ${
              m.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-br-sm' 
                : 'bg-background border border-border/50 shadow-md shadow-black/5 rounded-bl-sm pr-10'
            }`}>
              {m.role === 'user' ? (
                <div className="whitespace-pre-wrap">{m.content}</div>
              ) : (
                <AIResponse content={m.content} />
              )}
              {m.role === 'assistant' && (
                <button 
                  onClick={() => handleCopy(m.id, m.content)}
                  className="absolute top-3 right-3 p-1.5 bg-muted/50 hover:bg-muted rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="Copier"
                >
                  {copiedId === m.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        
        {errorMsg && (
          <div className="flex justify-start mt-2">
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-start gap-2 max-w-[85%]">
              <Bot className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{errorMsg}</div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t border-border/50 bg-muted/10">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }} 
          className="flex w-full items-center gap-2"
        >
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Interroger l'IA..."
            className="flex-1 bg-background"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" aria-label="Envoyer le message" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
