import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Conversation {
  _id: string;
  participants: { _id: string; firstName: string; lastName: string; role: string }[];
  lastMessage?: string;
  lastMessageAt?: string;
  subject?: string;
}

interface Message {
  _id: string;
  sender: { _id: string; firstName: string; lastName: string; role: string };
  content: string;
  createdAt: string;
  readAt?: string;
}

export default function RecruiterMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv._id);
  }, [selectedConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoadingConvs(true);
    try {
      const res = await api.get('/messaging/conversations');
      setConversations(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load conversations.');
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messaging/conversations/${convId}/messages`);
      setMessages(res.data?.data || []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const otherParticipant = selectedConv.participants.find(p => p._id !== user?.id);
    if (!otherParticipant) return;

    setSending(true);
    try {
      const res = await api.post('/messaging/messages', {
        recipientId: otherParticipant._id,
        content: newMessage.trim()
      });
      setMessages(prev => [...prev, res.data.data]);
      setNewMessage('');
      // Update conversation preview
      setConversations(prev => prev.map(c =>
        c._id === selectedConv._id ? { ...c, lastMessage: newMessage.slice(0, 60), lastMessageAt: new Date().toISOString() } : c
      ));
    } catch {
      // Show inline error in future
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find(p => p._id !== user?.id);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out h-[calc(100vh-4rem)] flex">

      {/* SIDEBAR — Conversations */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200">
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-600" /> Messages
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin mb-2" />
              <p className="text-slate-500 text-xs">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="p-5 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-900 font-bold text-sm mb-1">No conversations yet</p>
              <p className="text-slate-500 text-xs">Contact a candidate from the Talent Discovery page to start a conversation.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isSelected = selectedConv?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left px-4 py-4 border-b border-slate-200 hover:bg-slate-100 transition-colors ${isSelected ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                        {other?.firstName?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{other?.firstName} {other?.lastName}</p>
                        {conv.lastMessage && <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN — Messages */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-900 font-bold mb-1">Select a conversation</p>
            <p className="text-slate-500 text-sm">Choose a conversation from the left to view messages.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex items-center px-6 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                  {getOtherParticipant(selectedConv)?.firstName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {getOtherParticipant(selectedConv)?.firstName} {getOtherParticipant(selectedConv)?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">{getOtherParticipant(selectedConv)?.role}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-slate-500 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.sender._id === user?.id;
                  return (
                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? 'bg-brand-600 text-white rounded-br-sm shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                      }`}>
                        {!isOwn && (
                          <p className="text-[10px] font-bold text-brand-600 mb-1">
                            {msg.sender.firstName} {msg.sender.lastName}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isOwn ? 'text-brand-200/70' : 'text-slate-600'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="border-t border-slate-200 p-4 bg-white flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-slate-900 rounded-lg transition-colors"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
