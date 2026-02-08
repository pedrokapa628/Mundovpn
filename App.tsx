
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Settings, 
  Activity, 
  MessageSquare, 
  Power,
  ChevronRight,
  Wifi,
  Zap,
  Cpu,
  Terminal,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  User,
  CreditCard,
  Lock,
  BarChart3,
  Clock,
  Eye,
  LogOut,
  ChevronLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Bolt
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ConnectionStatus, Server, TrafficStats, ChatMessage, HistoryItem, UserAccount } from './types';
import { SERVERS, MOCK_HISTORY, MOCK_USER } from './constants';
import { getAIResponse } from './services/geminiService';

const STORAGE_KEYS = {
  LOGS: 'mundo_vpn_logs',
  USER: 'mundo_vpn_user'
};

const App: React.FC = () => {
  // Persistence state
  const [connectionLogs, setConnectionLogs] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : MOCK_HISTORY;
  });
  const [userData, setUserData] = useState<UserAccount>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : MOCK_USER;
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [selectedServer, setSelectedServer] = useState<Server>(SERVERS[3]); // Default SP
  const [stats, setStats] = useState<TrafficStats[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'servers' | 'ai' | 'panel'>('dashboard');
  const [panelView, setPanelView] = useState<'summary' | 'detailed_logs'>('summary');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[System] Mundo VPN Initialized', '[System] Awaiting connection...']);
  const [securitySettings, setSecuritySettings] = useState({
    killSwitch: true,
    doubleVpn: false,
    stealthMode: true,
    adBlocker: true
  });
  
  // Session tracking
  const sessionStartTimeRef = useRef<number | null>(null);
  const currentSessionDataRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(connectionLogs));
  }, [connectionLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }, [userData]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const toggleConnection = useCallback(() => {
    if (connectionStatus === 'connected') {
      const endTime = Date.now();
      const startTime = sessionStartTimeRef.current || endTime;
      const durationMs = endTime - startTime;
      const finalDataMb = currentSessionDataRef.current;
      
      addLog('Disconnecting from ' + selectedServer.name);
      setConnectionStatus('disconnected');

      // Create new persistent log entry
      const newLog: HistoryItem = {
        id: Date.now().toString(),
        serverName: selectedServer.name,
        flag: selectedServer.flag,
        date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
        startTime: new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        duration: formatDuration(durationMs),
        dataUsed: finalDataMb < 1024 ? `${finalDataMb.toFixed(1)} MB` : `${(finalDataMb / 1024).toFixed(2)} GB`,
        status: 'success'
      };

      setConnectionLogs(prev => [newLog, ...prev]);
      
      // Update global stats
      setUserData(prev => {
        const currentTotal = parseFloat(prev.totalDataUsed.split(' ')[0]);
        const isGb = prev.totalDataUsed.includes('GB');
        const newTotalInMb = (isGb ? currentTotal * 1024 : currentTotal) + finalDataMb;
        return {
          ...prev,
          totalDataUsed: newTotalInMb < 1024 ? `${newTotalInMb.toFixed(1)} MB` : `${(newTotalInMb / 1024).toFixed(1)} GB`
        };
      });

      sessionStartTimeRef.current = null;
      currentSessionDataRef.current = 0;
    } else {
      setConnectionStatus('connecting');
      addLog('Handshaking with ' + selectedServer.ip);
      setTimeout(() => {
        sessionStartTimeRef.current = Date.now();
        currentSessionDataRef.current = 0;
        setConnectionStatus('connected');
        addLog('Successfully connected to ' + selectedServer.name);
      }, 2000);
    }
  }, [connectionStatus, selectedServer, addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        const dl = Math.random() * 15 + 5;
        const ul = Math.random() * 5 + 1;
        const newStat: TrafficStats = {
          download: dl,
          upload: ul,
          timestamp: Date.now()
        };
        setStats(prev => [...prev.slice(-20), newStat]);
        
        const sessionDataInMb = (dl + ul) / 8;
        currentSessionDataRef.current += sessionDataInMb;

      } else {
        setStats(prev => [...prev.slice(-20), { download: 0, upload: 0, timestamp: Date.now() }]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isAiThinking) return;
    const userMsg: ChatMessage = { role: 'user', content: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsAiThinking(true);
    
    const response = await getAIResponse(inputValue, messages, { status: connectionStatus, server: selectedServer });
    const aiMsg: ChatMessage = { role: 'assistant', content: String(response), timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setIsAiThinking(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const toggleSetting = (key: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
    addLog(`Setting updated: ${String(key)} is now ${!securitySettings[key] ? 'Enabled' : 'Disabled'}`);
  };

  const calculateDataProgress = () => {
    const usedStr = userData.totalDataUsed.split(' ')[0];
    const used = parseFloat(usedStr);
    const usedIsGb = userData.totalDataUsed.includes('GB');
    const limitStr = userData.monthlyLimit.split(' ')[0];
    const limit = parseFloat(limitStr);
    const limitIsGb = userData.monthlyLimit.includes('GB');
    
    const usedInMb = usedIsGb ? used * 1024 : used;
    const limitInMb = limitIsGb ? limit * 1024 : limit;
    
    return Math.min((usedInMb / limitInMb) * 100, 100);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-gray-950 text-gray-100 shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Mundo VPN</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
              <Cpu className="w-3 h-3" /> AI Assisted Security
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
           <span className="text-xs font-medium text-gray-400 capitalize">{connectionStatus}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Hero Connect */}
            <div className="relative flex flex-col items-center justify-center py-12 bg-gray-900/50 rounded-3xl border border-gray-800 overflow-hidden">
               <div className={`absolute inset-0 transition-opacity duration-1000 opacity-20 ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-blue-600'}`} />
               
               <button 
                onClick={toggleConnection}
                disabled={connectionStatus === 'connecting'}
                className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 
                  ${connectionStatus === 'connected' ? 'bg-green-600 neon-glow-active ring-4 ring-green-500/20' : 'bg-gray-800 hover:bg-gray-700 neon-glow ring-4 ring-blue-500/10'}
                  ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}
                `}
               >
                 <Power className={`w-12 h-12 ${connectionStatus === 'connected' ? 'text-white' : 'text-blue-500'}`} />
               </button>
               
               <div className="mt-8 text-center z-10">
                 <h2 className="text-lg font-bold tracking-wide">
                   {connectionStatus === 'connected' ? 'CONEXÃO ATIVA' : connectionStatus === 'connecting' ? 'INICIANDO TUNEL...' : 'PROTEÇÃO DESATIVADA'}
                 </h2>
                 <p className="text-sm text-gray-400 mt-1">
                   {connectionStatus === 'connected' ? `Tunelado por ${selectedServer.name}` : 'Toque para criptografar seu tráfego'}
                 </p>
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-5 rounded-3xl">
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Download</span>
                   <ArrowDownLeft className="w-4 h-4 text-green-500" />
                 </div>
                 <p className="text-2xl font-mono font-bold">{stats.length > 0 ? stats[stats.length - 1].download.toFixed(1) : '0.0'} <span className="text-xs font-normal text-gray-500">Mb/s</span></p>
              </div>
              <div className="glass p-5 rounded-3xl">
                 <div className="flex items-center justify-between mb-3">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Upload</span>
                   <ArrowUpRight className="w-4 h-4 text-blue-500" />
                 </div>
                 <p className="text-2xl font-mono font-bold">{stats.length > 0 ? stats[stats.length - 1].upload.toFixed(1) : '0.0'} <span className="text-xs font-normal text-gray-500">Mb/s</span></p>
              </div>
            </div>

            {/* Traffic Chart */}
            <div className="glass p-5 rounded-3xl h-44 overflow-hidden">
               <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold flex items-center gap-2 text-gray-400 uppercase tracking-widest"><Activity className="w-4 h-4 text-blue-500" /> Atividade de Rede</h3>
               </div>
               <div className="h-32">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={stats}>
                     <defs>
                       <linearGradient id="colorDl" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="download" stroke="#10b981" fillOpacity={1} fill="url(#colorDl)" isAnimationActive={false} strokeWidth={2} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Selected Server Short Selection */}
            <div onClick={() => setActiveTab('servers')} className="glass p-5 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-all active:scale-[0.98]">
               <div className="flex items-center gap-4">
                 <div className="text-3xl">{selectedServer.flag}</div>
                 <div>
                   <p className="text-sm font-bold">{selectedServer.name}, {selectedServer.country}</p>
                   <p className="text-xs text-gray-500 font-mono">{selectedServer.ip} • {selectedServer.latency}ms</p>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        )}

        {activeTab === 'servers' && (
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Nós Globais</h2>
                <div className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 rounded-full">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">{SERVERS.length} Servidores</span>
                </div>
             </div>
             <div className="space-y-3">
               {SERVERS.map(server => (
                 <div 
                  key={server.id} 
                  onClick={() => { setSelectedServer(server); setActiveTab('dashboard'); addLog('Changed server to ' + server.name); }}
                  className={`glass p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border-l-4 group hover:bg-gray-800/40 ${selectedServer.id === server.id ? 'border-l-blue-500 bg-blue-500/10' : 'border-l-transparent'}`}
                 >
                   <div className="flex items-center gap-4">
                     <span className="text-3xl group-hover:scale-110 transition-transform">{server.flag}</span>
                     <div>
                       <p className="font-bold text-sm">{server.name}</p>
                       <p className="text-xs text-gray-500">{server.country}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="flex items-center gap-1 justify-end">
                       <Wifi className={`w-3 h-3 ${server.latency < 100 ? 'text-green-500' : 'text-yellow-500'}`} />
                       <span className="text-xs font-mono font-semibold">{server.latency}ms</span>
                     </div>
                     <div className="w-16 h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                       <div className="bg-blue-500 h-full" style={{ width: `${server.load}%` }} />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'panel' && (
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
             {panelView === 'summary' ? (
               <>
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-600/20 rounded-lg">
                     <BarChart3 className="w-5 h-5 text-purple-400" />
                   </div>
                   <h2 className="text-xl font-bold">Painel de Controle</h2>
                 </div>

                 {/* User Info & Usage */}
                 <div className="glass p-6 rounded-3xl space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                        {userData.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{userData.name}</h3>
                        <p className="text-xs text-gray-500">{userData.email}</p>
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400">
                          {userData.plan} PLAN
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                        <span>Uso de Dados</span>
                        <span>{userData.totalDataUsed} / {userData.monthlyLimit}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${calculateDataProgress()}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-500 text-right">Renova em {userData.expiryDate}</p>
                    </div>
                 </div>

                 {/* Connection History Summary */}
                 <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4" /> Histórico Recente
                      </h3>
                      <button onClick={() => setPanelView('detailed_logs')} className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1 hover:text-blue-300 transition-colors">
                        Ver Tudo <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {connectionLogs.length === 0 ? (
                        <div className="text-center py-6 glass rounded-2xl text-gray-500 text-xs italic">Nenhuma conexão registrada</div>
                      ) : (
                        connectionLogs.slice(0, 3).map(item => (
                          <div key={item.id} className="glass p-4 rounded-2xl flex items-center justify-between hover:bg-gray-800/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{item.flag}</span>
                              <div>
                                <p className="text-sm font-bold">{item.serverName}</p>
                                <p className="text-[10px] text-gray-500">{item.date} • {item.startTime}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold text-blue-400">{item.duration}</p>
                              <p className="text-[10px] text-gray-500">{item.dataUsed}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                 </div>

                 {/* Security Settings */}
                 <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Segurança Avançada
                    </h3>
                    <div className="glass rounded-3xl divide-y divide-gray-800 overflow-hidden">
                       {[
                         { id: 'killSwitch', label: 'Kill Switch', icon: <Power className="w-4 h-4" />, desc: 'Interrupt connection if VPN drops' },
                         { id: 'doubleVpn', label: 'Double VPN', icon: <Eye className="w-4 h-4" />, desc: 'Chain through two servers' },
                         { id: 'stealthMode', label: 'Modo Stealth', icon: <Zap className="w-4 h-4" />, desc: 'Bypass deep packet inspection' },
                         { id: 'adBlocker', label: 'Mundo Shield', icon: <ShieldCheck className="w-4 h-4" />, desc: 'Block ads and tracking' },
                       ].map(item => (
                         <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors">
                           <div className="flex items-center gap-4">
                             <div className={`p-2 rounded-xl ${securitySettings[item.id as keyof typeof securitySettings] ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                               {item.icon}
                             </div>
                             <div>
                               <p className="text-sm font-bold">{item.label}</p>
                               <p className="text-[10px] text-gray-500">{item.desc}</p>
                             </div>
                           </div>
                           <button 
                            onClick={() => toggleSetting(item.id as keyof typeof securitySettings)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${securitySettings[item.id as keyof typeof securitySettings] ? 'bg-blue-600' : 'bg-gray-700'}`}
                           >
                             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${securitySettings[item.id as keyof typeof securitySettings] ? 'right-1' : 'left-1'}`} />
                           </button>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <button className="flex-1 glass p-4 rounded-2xl flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
                       <CreditCard className="w-5 h-5" />
                       <span className="text-[10px] font-bold uppercase">Assinatura</span>
                    </button>
                    <button 
                      onClick={() => { localStorage.clear(); window.location.reload(); }}
                      className="flex-1 glass p-4 rounded-2xl flex flex-col items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                       <LogOut className="w-5 h-5" />
                       <span className="text-[10px] font-bold uppercase">Limpar Dados</span>
                    </button>
                 </div>
               </>
             ) : (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPanelView('summary')} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h2 className="text-xl font-bold">Logs de Conexão</h2>
                  </div>

                  <div className="space-y-4">
                    {connectionLogs.length === 0 ? (
                      <div className="text-center py-20 opacity-50 flex flex-col items-center">
                        <History className="w-12 h-12 mb-4 text-gray-600" />
                        <p>Nenhum log histórico disponível.</p>
                      </div>
                    ) : (
                      connectionLogs.map(log => (
                        <div key={log.id} className="glass rounded-3xl p-5 space-y-4 border-l-4 border-l-blue-500/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{log.flag}</span>
                              <div>
                                <h4 className="font-bold text-sm">{log.serverName}</h4>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                                  <Calendar className="w-3 h-3" /> {log.date}
                                </div>
                              </div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                              {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {log.status === 'success' ? 'Finalizado' : 'Interrompido'}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-800/40 p-3 rounded-2xl flex flex-col items-center">
                              <Clock className="w-4 h-4 text-blue-400 mb-1" />
                              <span className="text-[10px] text-gray-500 uppercase font-bold">Duração</span>
                              <span className="text-xs font-mono font-bold">{log.duration}</span>
                            </div>
                            <div className="bg-gray-800/40 p-3 rounded-2xl flex flex-col items-center">
                              <Activity className="w-4 h-4 text-purple-400 mb-1" />
                              <span className="text-[10px] text-gray-500 uppercase font-bold">Dados</span>
                              <span className="text-xs font-mono font-bold">{log.dataUsed}</span>
                            </div>
                            <div className="bg-gray-800/40 p-3 rounded-2xl flex flex-col items-center">
                              <Terminal className="w-4 h-4 text-green-400 mb-1" />
                              <span className="text-[10px] text-gray-500 uppercase font-bold">Início</span>
                              <span className="text-xs font-mono font-bold">{log.startTime}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between px-1 pt-2 border-t border-gray-800">
                             <p className="text-[10px] text-gray-500 flex items-center gap-1 italic">
                               <Clock className="w-3 h-3" /> Desconectado às {log.endTime}
                             </p>
                             <button className="text-[10px] font-bold text-blue-400 uppercase hover:underline">Detalhes Técnicos</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="py-6 flex justify-center">
                    <button onClick={() => setPanelView('summary')} className="px-6 py-2.5 bg-gray-900 border border-gray-800 rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors">
                      Voltar ao Painel
                    </button>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-[calc(100vh-220px)] animate-in slide-in-from-bottom duration-300">
             <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-blue-100 font-medium">IA Mundo está online.</p>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                  <Bolt className="w-3 h-3 text-yellow-500" />
                  <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-wider">Fast Response Active</span>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
               {messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600 opacity-50">
                    <div className="relative mb-4">
                      <MessageSquare className="w-12 h-12" />
                      <Bolt className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
                    </div>
                    <p className="text-sm font-medium">Inicie uma conversa ultra-rápida com sua Assistência IA</p>
                    <p className="text-[10px] mt-2 max-w-[200px]">Alimentado por Gemini 2.5 Flash Lite para respostas em tempo real.</p>
                 </div>
               )}
               {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-lg' : 'glass rounded-bl-none'}`}>
                      {m.content}
                    </div>
                 </div>
               )}
               {isAiThinking && (
                 <div className="flex justify-start">
                   <div className="glass p-3.5 rounded-2xl rounded-bl-none flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                   </div>
                 </div>
               )}
               <div ref={chatEndRef} />
             </div>

             <div className="mt-4 flex gap-2">
               <input 
                value={inputValue}
                disabled={isAiThinking}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pergunte ao Mundo AI (Ultra Fast)..."
                className="flex-1 glass bg-gray-900 border-gray-700 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
               />
               <button 
                onClick={handleSendMessage}
                disabled={isAiThinking || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-gray-800 disabled:opacity-50"
               >
                 <Bolt className={`w-5 h-5 text-white ${isAiThinking ? 'animate-pulse' : ''}`} />
               </button>
             </div>
          </div>
        )}

      </main>

      {/* Navigation */}
      <nav className="glass border-t border-gray-800 px-6 py-5 flex justify-between items-center sticky bottom-0 z-50 rounded-t-[40px]">
        <button onClick={() => { setActiveTab('dashboard'); setPanelView('summary'); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-400'}`}>
          <ShieldCheck className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-tighter uppercase">Conectar</span>
        </button>
        <button onClick={() => { setActiveTab('servers'); setPanelView('summary'); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'servers' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-400'}`}>
          <Globe className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-tighter uppercase">Nós</span>
        </button>
        <button onClick={() => { setActiveTab('ai'); setPanelView('summary'); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'ai' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-400'}`}>
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-tighter uppercase">IA Assist</span>
        </button>
        <button onClick={() => { setActiveTab('panel'); setPanelView('summary'); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'panel' ? 'text-blue-500 scale-110' : 'text-gray-500 hover:text-gray-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold tracking-tighter uppercase">Painel</span>
        </button>
      </nav>
      
    </div>
  );
};

export default App;
