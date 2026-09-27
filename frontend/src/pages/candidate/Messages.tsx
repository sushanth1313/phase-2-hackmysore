import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, Loader2, AlertCircle, User2, Clock, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Conversation {
  _id: string;
  participants: { _id: string; firstName: string; lastName: string; role: string }[];
  lastMessage?: { content: string; createdAt: string };
  unreadCount?: number;
  updatedAt: string;
}

interface Message {
  _id: string;
  content: string;
  sender: { _id: string; firstName: string; lastName: string };
  createdAt: string;
}

export default function CandidateMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messaging');
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
      const res = await api.get(`/messaging/${convId}/messages`);
      setMessages(res.data?.data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      console.error('Failed to fetch messages:', err.message);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv._id);
      // Poll for new messages every 5s
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(selectedConv._id), 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedConv?._id]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedConv || sending) return;
    const content = newMsg.trim();
    setNewMsg('');
    setSending(true);
    try {
      await api.post(`/messaging/${selectedConv._id}/messages`, { content });
      await fetchMessages(selectedConv._id);
      await fetchConversations();
    } catch (err: any) {
      setNewMsg(content); // restore on error
      console.error('Send failed:', err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.participants.some(p =>
      p._id !== user?._id &&
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
    )
  );

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find(p => p._id !== user?._id);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex overflow-hidden">

      {/* Sidebar */}
      <div className="w-80 shrink-0 bg-[#080D1A] border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-600" /> Messages
            </h2>
            <button onClick={fetchConversations} className="p-1 text-slate-500 hover:text-brand-600 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-500">
                {search ? 'No conversations match your search.' : 'No messages yet. Recruiters will reach out here.'}
              </p>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const other = getOtherParticipant(conv);
              const isActive = selectedConv?._id === conv._id;
              return (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-4 border-b border-slate-200 transition-all hover:bg-slate-100 ${isActive ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {other?.firstName?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-brand-600' : 'text-slate-700'}`}>
                          {other ? `${other.firstName} ${other.lastName}` : 'Unknown'}
                        </span>
                        {conv.updatedAt && (
                          <span className="text-[10px] text-slate-600 ml-2 shrink-0">{formatTime(conv.updatedAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] text-slate-500 truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </span>
                        {(conv.unreadCount || 0) > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-brand-600 text-[9px] font-bold text-slate-900 shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-[#080D1A] flex items-center gap-3">
            {(() => {
              const other = getOtherParticipant(selectedConv);
              return (
                <>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-600">{other?.firstName?.[0]?.toUpperCase() || '?'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{other ? `${other.firstName} ${other.lastName}` : 'Conversation'}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{other?.role?.toLowerCase() || ''}</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender._id === user?._id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && (
                        <span className="text-[10px] text-slate-500 mb-1 ml-1">
                          {msg.sender.firstName} {msg.sender.lastName}
                        </span>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-brand-600 text-slate-900 rounded-tr-sm shadow-lg shadow-brand-500/20'
                          : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-600 mt-1 mx-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 bg-[#080D1A]">
            <div className="flex gap-3 items-end">
              <textarea
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                rows={2}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-brand-500 placeholder:text-slate-600 resize-none"
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
                className="p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#080D1A]">
          <MessageSquare className="w-16 h-16 text-slate-800 mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">Select a conversation</h3>
          <p className="text-slate-600 text-sm">Choose a conversation from the sidebar to start messaging.</p>
        </div>
      )}
    </div>
  );
}
