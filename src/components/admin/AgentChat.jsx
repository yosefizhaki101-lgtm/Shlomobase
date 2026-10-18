import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { Send, Bot } from 'lucide-react';

const AGENT_NAME = 'adminAssistant';

export default function AgentChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeId) {
      const unsub = base44.agents.subscribeToConversation(activeId, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsub();
    }
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const list = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(list || []);
    } catch {
      setConversations([]);
    }
  };

  const startNewConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: 'שיחה חדשה', description: 'שיחת ניהול' },
      });
      setActiveId(conv.id);
      setMessages([]);
      await loadConversations();
    } catch (e) {
      alert('שגיאה ביצירת שיחה: ' + (e.message || e));
    }
  };

  const selectConversation = async (id) => {
    setActiveId(id);
    try {
      const conv = await base44.agents.getConversation(id);
      setMessages(conv.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeId) return;
    const content = input.trim();
    setInput('');
    setLoading(true);
    try {
      const conv = conversations.find((c) => c.id === activeId) || { id: activeId };
      await base44.agents.addMessage(conv, { role: 'user', content });
    } catch (e) {
      alert('שגיאה בשליחה: ' + (e.message || e));
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Conversation list */}
      <div className="w-48 border-l pl-3 space-y-2 overflow-y-auto">
        <Button size="sm" onClick={startNewConversation} className="w-full mb-2">
          + שיחה חדשה
        </Button>
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => selectConversation(c.id)}
            className={`w-full text-right text-sm px-3 py-2 rounded-lg transition-colors ${
              activeId === c.id ? 'bg-stone-800 text-white' : 'hover:bg-stone-100'
            }`}
          >
            {c.metadata?.name || 'שיחה'}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-stone-400 flex-col gap-3">
            <Bot className="w-12 h-12" />
            <p>לחץ "שיחה חדשה" כדי להתחיל לדבר עם הבוט</p>
            <p className="text-xs">הבוט יכול להוסיף, לערוך ולמחוק רכיבי מצבה וסוגי אבן</p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === 'user' ? 'bg-stone-800 text-white' : 'bg-stone-100'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                      </div>
                    )}
                    {msg.tool_calls?.map((tc, j) => (
                      <div key={j} className="mt-2 text-xs opacity-70 border-t pt-1">
                        ⚙ {tc.name} — {tc.status}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-stone-100 rounded-2xl px-4 py-2 text-sm text-stone-400">
                    בודק...
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="כתוב משימה לבוט... (לדוגמה: הוסף מסגרת טובזה חדשה בשם 'טובזה פראית מיוחדת')"
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}