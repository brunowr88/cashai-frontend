import { useState, useRef, useEffect, useCallback } from "react";

/* ════════════════════════════════════════════════════════════════════════════
 * CashAI - Frontend completo
 *
 * IMPORTANTE: Antes de usar, configure as URLs abaixo:
 * - API_URL: URL do seu backend no Railway
 * - SUPABASE_URL e SUPABASE_ANON_KEY: do dashboard do Supabase
 * ════════════════════════════════════════════════════════════════════════════ */

const API_URL = "https://cashai-backend-production-22b1.up.railway.app"; // ← Railway URL
const SUPABASE_URL = "https://xxxxx.supabase.co";     // ← Supabase URL
const SUPABASE_ANON_KEY = "eyJ...";                   // ← Supabase anon key

/* ─── Supabase REST Auth ───────────────────────────────────────────────────── */
async function supabaseAuth(action, email, password, fullName) {
  const endpoints = {
    signup:  `${SUPABASE_URL}/auth/v1/signup`,
    signin:  `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
  };
  const body = action === "signup"
    ? { email, password, data: { full_name: fullName } }
    : { email, password };

  const res = await fetch(endpoints[action], {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || data.error || "Erro de autenticação");
  return data;
}

async function api(path, options = {}) {
  const token = localStorage.getItem("cashai_token");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

const FontLoader = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>
);

const CATS = {
  mercado:     { icon: "🛒", color: "#a78bfa", label: "Mercado" },
  combustivel: { icon: "⛽", color: "#fbbf24", label: "Combustível" },
  delivery:    { icon: "🛵", color: "#fb923c", label: "Delivery" },
  farmacia:    { icon: "💊", color: "#34d399", label: "Farmácia" },
  transporte:  { icon: "🚗", color: "#60a5fa", label: "Transporte" },
  lazer:       { icon: "🎮", color: "#f472b6", label: "Lazer" },
  salario:     { icon: "💼", color: "#4ade80", label: "Salário" },
  pix:         { icon: "⚡", color: "#c084fc", label: "Pix" },
  academia:    { icon: "💪", color: "#f87171", label: "Academia" },
  assinatura:  { icon: "📱", color: "#818cf8", label: "Assinatura" },
  alimentacao: { icon: "🍽️", color: "#fbbf24", label: "Alimentação" },
  outros:      { icon: "📦", color: "#94a3b8", label: "Outros" },
};

const brl = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);

const GS = () => (
  <style>{`
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    body{background:#0a0a0f;}
    ::-webkit-scrollbar{display:none;}
    input::placeholder{color:rgba(255,255,255,0.25);}
    input:focus{outline:none;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    @keyframes pop{0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
    .anim-fadeup{animation:fadeUp 0.35s ease both;}
    .anim-pop{animation:pop 0.4s ease both;}
  `}</style>
);

export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("cashai_token");
    const user = localStorage.getItem("cashai_user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  const onLogin = (sessionData) => {
    localStorage.setItem("cashai_token", sessionData.access_token);
    localStorage.setItem("cashai_user", JSON.stringify(sessionData.user));
    setSession({ token: sessionData.access_token, user: sessionData.user });
  };

  const onLogout = () => {
    localStorage.removeItem("cashai_token");
    localStorage.removeItem("cashai_user");
    setSession(null);
  };

  return (
    <>
      <FontLoader/><GS/>
      {!session ? <AuthScreen onLogin={onLogin}/> : <CashAI user={session.user} onLogout={onLogout}/>}
    </>
  );
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email || !password) { setError("Preencha email e senha"); return; }
    if (mode === "signup" && password.length < 6) { setError("Senha deve ter ao menos 6 caracteres"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await supabaseAuth(mode === "signin" ? "signin" : "signup", email, password, fullName);
      if (data.access_token) onLogin(data);
      else { setError("Verifique seu email para confirmar"); setMode("signin"); }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inputStyle = {
    padding:"15px 18px", borderRadius:14, border:"1.5px solid rgba(255,255,255,0.06)",
    background:"rgba(255,255,255,0.04)", color:"white", fontSize:14,
    fontFamily:"'DM Sans',sans-serif",
  };

  return (
    <div style={{
      maxWidth:430, margin:"0 auto", minHeight:"100dvh",
      background:"#0a0a0f", display:"flex", flexDirection:"column",
      fontFamily:"'DM Sans',sans-serif", padding:"40px 24px",
      backgroundImage:"radial-gradient(circle at 20% 0%, rgba(124,58,237,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 100%, rgba(79,70,229,0.1) 0%, transparent 50%)",
    }}>
      <div style={{flex:1, display:"flex", flexDirection:"column", justifyContent:"center"}}>
        <div style={{textAlign:"center", marginBottom:48}}>
          <div style={{
            width:72, height:72, borderRadius:24, margin:"0 auto 20px",
            background:"linear-gradient(135deg,#a855f7,#6366f1)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:36, boxShadow:"0 20px 60px -10px rgba(168,85,247,0.5)",
          }}>✦</div>
          <div style={{fontFamily:"Syne,sans-serif", fontSize:34, fontWeight:800, color:"white", letterSpacing:-1}}>CashAI</div>
          <div style={{fontSize:13, color:"rgba(255,255,255,0.4)", marginTop:6}}>Seu assistente financeiro inteligente</div>
        </div>

        <div style={{display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:14, padding:4, marginBottom:24}}>
          {[["signin","Entrar"],["signup","Criar conta"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setMode(v);setError("");}} style={{
              flex:1, padding:"11px 0", borderRadius:11, border:"none", cursor:"pointer",
              fontSize:13, fontWeight:600, fontFamily:"DM Sans",
              background: mode===v ? "linear-gradient(135deg,#a855f7,#6366f1)" : "transparent",
              color: mode===v ? "white" : "rgba(255,255,255,0.4)",
            }}>{l}</button>
          ))}
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:12}}>
          {mode==="signup" && (
            <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Seu nome" style={inputStyle}/>
          )}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplo.com" style={inputStyle}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="senha" onKeyDown={e=>e.key==="Enter"&&submit()} style={inputStyle}/>

          {error && <div style={{color:"#f87171", fontSize:12, padding:"8px 4px"}}>{error}</div>}

          <button onClick={submit} disabled={loading} style={{
            padding:"15px", borderRadius:16, border:"none", marginTop:8,
            background:"linear-gradient(135deg,#a855f7,#6366f1)",
            color:"white", fontSize:15, fontWeight:600, cursor:"pointer",
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "Aguarde..." : (mode==="signin" ? "Entrar" : "Criar conta")}
          </button>
        </div>

        <div style={{textAlign:"center", marginTop:32, color:"rgba(255,255,255,0.25)", fontSize:11}}>
          🔒 Dados protegidos · Open Finance regulamentado pelo BCB
        </div>
      </div>
    </div>
  );
}

function CashAI({ user, onLogout }) {
  const [tab, setTab]           = useState("chat");
  const [txs, setTxs]           = useState([]);
  const [connections, setConn]  = useState([]);
  const [msgs, setMsgs]         = useState([{
    id: Date.now(), from:"ai",
    text:`Olá ${user.user_metadata?.full_name?.split(" ")[0] || ""}! 👋 Sou o **CashAI**.\n\nVocê pode:\n• Digitar "mercado 150" para registrar\n• Conectar seu banco em **Configurações**\n• Tirar foto de nota no **Scanner**`,
  }]);
  const [input, setInput]       = useState("");
  const [mode, setMode]         = useState("expense");
  const [loading, setLoading]   = useState(false);
  const [insights, setInsights] = useState([]);
  const [insLoading, setInsLoad]= useState(false);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [scanImg, setScanImg]   = useState(null);
  const [scanLoad, setScanLoad] = useState(false);
  const [scanRes, setScanRes]   = useState(null);
  const [pluggyLoading, setPluggyLoading] = useState(false);
  const chatEnd = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { loadTransactions(); loadConnections(); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, loading]);

  const loadTransactions = async () => {
    try { setTxs(await api("/transactions")); } catch (err) { console.error(err); }
  };
  const loadConnections = async () => {
    try { setConn(await api("/pluggy/connections")); } catch (err) { console.error(err); }
  };

  const income   = txs.filter(t=>t.type==="income").reduce((s,t)=>s+parseFloat(t.value||0),0);
  const expenses = txs.filter(t=>t.type==="expense").reduce((s,t)=>s+parseFloat(t.value||0),0);
  const balance  = income - expenses;
  const catTotals = Object.entries(
    txs.filter(t=>t.type==="expense").reduce((a,t)=>{ a[t.category]=(a[t.category]||0)+parseFloat(t.value||0); return a; },{})
  ).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const send = useCallback(async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    setInput("");
    setMsgs(p => [...p, { id:Date.now(), from:"user", text:txt, mode }]);
    setLoading(true);
    try {
      const parsed = await api("/ai/parse", { method:"POST", body: JSON.stringify({ text: txt, mode }) });
      if (parsed.transaction) setTxs(p => [parsed.transaction, ...p]);
      setMsgs(p => [...p, { id:Date.now()+1, from:"ai", text:parsed.reply, tx: parsed.transaction }]);
    } catch (err) {
      setMsgs(p => [...p, { id:Date.now()+1, from:"ai", text:"Erro ao processar. Tente novamente." }]);
    }
    setLoading(false);
  }, [input, loading, mode]);

  const loadInsights = useCallback(async () => {
    setInsLoad(true);
    try { setInsights((await api("/ai/insights")).insights || []); } catch (err) { console.error(err); }
    setInsLoad(false);
  }, []);

  useEffect(() => { if (tab==="insights" && insights.length===0) loadInsights(); }, [tab]);

  const handleScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const b64 = ev.target.result.split(",")[1];
      setScanImg(ev.target.result);
      setScanLoad(true); setScanRes(null);
      try {
        const parsed = await api("/ai/scan", { method:"POST", body: JSON.stringify({ imageBase64: b64, mediaType: file.type })});
        setScanRes(parsed);
      } catch { setScanRes({ error: true }); }
      setScanLoad(false);
    };
    reader.readAsDataURL(file);
  };

  const confirmScan = async () => {
    if (!scanRes || scanRes.error) return;
    try {
      const tx = await api("/transactions", { method:"POST", body: JSON.stringify({
        type:"expense", description: scanRes.description || "Compra",
        category: scanRes.category || "outros", value: scanRes.value || 0,
        payment_method: scanRes.payment_method,
      })});
      setTxs(p => [tx, ...p]);
      setScanImg(null); setScanRes(null);
      if (fileRef.current) fileRef.current.value="";
      setTab("chat");
      setMsgs(p => [...p, { id:Date.now(), from:"ai", text:`📷 Scanner registrou: **${tx.description}** — ${brl(tx.value)}`, tx }]);
    } catch { alert("Erro ao salvar"); }
  };

  const connectBank = async () => {
    setPluggyLoading(true);
    try {
      const { connectToken } = await api("/pluggy/connect-token", { method:"POST", body:"{}" });
      if (!window.PluggyConnect) {
        const script = document.createElement("script");
        script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.10.0/pluggy-connect.js";
        document.head.appendChild(script);
        await new Promise(r => script.onload = r);
      }
      const pluggyConnect = new window.PluggyConnect({
        connectToken,
        includeSandbox: true,
        onSuccess: async (itemData) => {
          try {
            await api("/pluggy/save-item", { method:"POST", body: JSON.stringify({ itemId: itemData.item.id })});
            await loadConnections();
            setTimeout(() => loadTransactions(), 3000);
            alert("✅ Banco conectado! Sincronizando...");
          } catch (err) { alert("Erro: " + err.message); }
        },
        onError: (err) => console.error("Pluggy error:", err),
      });
      pluggyConnect.init();
    } catch (err) { alert("Erro ao conectar: " + err.message); }
    setPluggyLoading(false);
  };

  const syncBank = async (itemId) => {
    setPluggyLoading(true);
    try {
      await api(`/pluggy/sync/${itemId}`, { method:"POST", body:"{}" });
      await loadTransactions(); await loadConnections();
      alert("✅ Sincronizado!");
    } catch (err) { alert("Erro: " + err.message); }
    setPluggyLoading(false);
  };

  const disconnectBank = async (itemId) => {
    if (!window.confirm("Desconectar este banco?")) return;
    try {
      await api(`/pluggy/connection/${itemId}`, { method:"DELETE" });
      await loadConnections();
    } catch (err) { alert("Erro: " + err.message); }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm("Remover esta transação?")) return;
    try {
      await api(`/transactions/${id}`, { method:"DELETE" });
      setTxs(p => p.filter(t => t.id !== id));
    } catch (err) { alert("Erro: " + err.message); }
  };

  const filteredTx = txs.filter(t => {
    if (filter!=="all" && t.type!==filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.description.toLowerCase().includes(q) || (CATS[t.category]?.label||"").toLowerCase().includes(q);
    }
    return true;
  });

  const S = makeStyles(mode);

  return (
    <div style={S.root}>
      <div style={S.statusBar}>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>9:41</span>
        <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>●●●</span>
      </div>
      <div style={S.content}>
        {tab==="chat"         && <ChatTab {...{msgs,input,setInput,mode,setMode,loading,send,chatEnd,S,balance,user}}/>}
        {tab==="dashboard"    && <DashTab {...{income,expenses,balance,catTotals,txs,S}}/>}
        {tab==="transactions" && <TxTab {...{filteredTx,filter,setFilter,search,setSearch,S,deleteTransaction}}/>}
        {tab==="scanner"      && <ScanTab {...{scanImg,setScanImg,scanLoad,scanRes,handleScan,confirmScan,fileRef,S}}/>}
        {tab==="insights"     && <InsightsTab {...{insights,insLoading,loadInsights,S}}/>}
        {tab==="settings"     && <SettingsTab {...{connections,connectBank,syncBank,disconnectBank,pluggyLoading,user,onLogout,S}}/>}
      </div>
      <nav style={S.nav}>
        {[
          {id:"chat",icon:"💬",label:"Chat"},
          {id:"dashboard",icon:"📊",label:"Dash"},
          {id:"transactions",icon:"📋",label:"Extrato"},
          {id:"scanner",icon:"📷",label:"Scan"},
          {id:"insights",icon:"✨",label:"Insights"},
          {id:"settings",icon:"⚙️",label:"Config"},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={S.navBtn(t.id===tab)}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:9,marginTop:2,fontWeight:t.id===tab?700:400}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function ChatTab({ msgs, input, setInput, mode, setMode, loading, send, chatEnd, S, balance, user }) {
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>CashAI</div>
          <div style={S.headerSub}>Olá, {user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0]}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"Syne",color:balance>=0?"#4ade80":"#f87171"}}>{brl(balance)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>saldo</div>
        </div>
      </div>
      <div style={S.chatArea}>
        {msgs.map((m) => (
          <div key={m.id} className="anim-fadeup" style={S.msgWrap(m.from==="user")}>
            {m.from==="ai" && <div style={S.aiAvatar}>✦</div>}
            <div style={S.bubble(m.from==="user", m.mode)}>
              <div dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,"<br/>").replace(/\*\*(.*?)\*\*/g,"<strong style='color:white'>$1</strong>")}}/>
              {m.tx && (
                <div style={S.txPill}>
                  <span style={{fontSize:16}}>{CATS[m.tx.category]?.icon||"📦"}</span>
                  <span style={{fontWeight:700}}>{brl(m.tx.value)}</span>
                  <span style={{opacity:0.5,fontSize:11}}>{CATS[m.tx.category]?.label}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={S.msgWrap(false)}>
            <div style={S.aiAvatar}>✦</div>
            <div style={S.bubble(false,null)}>
              <div style={{display:"flex",gap:5,padding:"2px 0"}}>
                {[0,1,2].map(i=>(<div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(192,132,252,0.7)",animation:"pulse 1.2s infinite",animationDelay:`${i*0.2}s`}}/>))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEnd}/>
      </div>
      <div style={{flexShrink:0,background:"rgba(10,10,15,0.98)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",gap:8,padding:"10px 16px 8px"}}>
          {[["expense","📤 Gasto"],["income","📥 Receita"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} style={S.modeBtn(mode===v,v)}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:10,padding:"0 16px 16px"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder={mode==="expense"?"mercado 150 crédito nubank...":"salário 3500..."} style={S.input}/>
          <button onClick={send} disabled={!input.trim()||loading} style={S.sendBtn}>➤</button>
        </div>
      </div>
    </div>
  );
}

function DashTab({ income, expenses, balance, catTotals, txs, S }) {
  return (
    <div style={S.scroll}>
      <div style={S.header}><div style={S.headerTitle}>Dashboard</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Visão geral</div></div>
      <div style={{padding:"0 16px 20px",display:"flex",flexDirection:"column",gap:12}}>
        <div style={S.balCard}>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Saldo disponível</div>
          <div style={{fontFamily:"Syne",fontSize:38,fontWeight:800,letterSpacing:-1.5,color:balance>=0?"#4ade80":"#f87171"}}>{brl(balance)}</div>
          <div style={{display:"flex",marginTop:18,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:14}}>
            {[["Receitas","#4ade80",income],["Gastos","#f87171",expenses],["Transações","#c084fc",txs.length]].map(([l,c,v],i)=>(
              <div key={l} style={{flex:1,borderLeft:i>0?"1px solid rgba(255,255,255,0.06)":"none",paddingLeft:i>0?12:0}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{l}</div>
                <div style={{fontSize:15,fontWeight:700,color:c}}>{typeof v==="number"&&v>99?brl(v):v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginBottom:14,letterSpacing:0.5}}>TOP CATEGORIAS</div>
          {catTotals.length===0 && <div style={{color:"rgba(255,255,255,0.3)",fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma transação ainda</div>}
          {catTotals.map(([cat,val])=>{
            const c = CATS[cat]||CATS.outros;
            const pct = expenses>0?(val/expenses*100).toFixed(0):0;
            return (
              <div key={cat} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <span style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>{c.label}</span>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:600,color:"white"}}>{brl(val)}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",minWidth:28,textAlign:"right"}}>{pct}%</span>
                  </div>
                </div>
                <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:c.color,transition:"width 1s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TxTab({ filteredTx, filter, setFilter, search, setSearch, S, deleteTransaction }) {
  return (
    <div style={S.scroll}>
      <div style={S.header}><div style={S.headerTitle}>Extrato</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>{filteredTx.length} itens</div></div>
      <div style={{padding:"0 16px 20px"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Buscar..." style={{...S.input,width:"100%",marginBottom:10}}/>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["all","Todos"],["expense","Gastos"],["income","Receitas"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{
              flex:1,padding:"9px 0",borderRadius:12,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:filter===v?(v==="income"?"rgba(74,222,128,0.12)":v==="expense"?"rgba(248,113,113,0.12)":"rgba(192,132,252,0.12)"):"rgba(255,255,255,0.04)",
              color:filter===v?(v==="income"?"#4ade80":v==="expense"?"#f87171":"#c084fc"):"rgba(255,255,255,0.35)",
            }}>{l}</button>
          ))}
        </div>
        {filteredTx.length===0 ? (
          <div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",padding:"48px 0",fontSize:14}}>Nenhuma transação</div>
        ) : (
          <div style={S.card}>
            {filteredTx.map((t,i)=>{
              const c = CATS[t.category]||CATS.outros;
              const isLast = i===filteredTx.length-1;
              const dateStr = new Date(t.transaction_date).toLocaleDateString("pt-BR");
              return (
                <div key={t.id} onClick={()=>deleteTransaction(t.id)} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:isLast?0:12,marginBottom:isLast?0:12,borderBottom:isLast?"none":"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
                  <div style={{width:38,height:38,borderRadius:11,background:`${c.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.85)",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.description}</div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>
                      {dateStr} · {c.label}
                      {t.bank_name && <span> · {t.bank_name}</span>}
                      {t.source==="pluggy" && <span style={{color:"#c084fc"}}> · 🔗</span>}
                    </div>
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:t.type==="income"?"#4ade80":"#f87171",flexShrink:0}}>
                    {t.type==="income"?"+":"-"}{brl(t.value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ScanTab({ scanImg, setScanImg, scanLoad, scanRes, handleScan, confirmScan, fileRef, S }) {
  return (
    <div style={S.scroll}>
      <div style={S.header}><div style={S.headerTitle}>Scanner IA</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Nota · Comprovante · Pix</div></div>
      <div style={{padding:"0 16px 20px"}}>
        {!scanImg ? (
          <>
            <div onClick={()=>fileRef.current?.click()} style={{border:"1.5px dashed rgba(192,132,252,0.25)",borderRadius:24,padding:"52px 20px",textAlign:"center",cursor:"pointer",background:"rgba(192,132,252,0.03)",marginBottom:14}}>
              <div style={{fontSize:52,marginBottom:12}}>📷</div>
              <div style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.65)",marginBottom:6}}>Enviar imagem</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>A IA detecta valor, local e categoria</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleScan} style={{display:"none"}}/>
          </>
        ) : (
          <>
            <img src={scanImg} alt="" style={{width:"100%",borderRadius:20,marginBottom:14,maxHeight:260,objectFit:"cover"}}/>
            {scanLoad && <div style={{textAlign:"center",padding:"28px",color:"rgba(192,132,252,0.7)"}}><div style={{fontSize:36,animation:"pulse 1.2s infinite"}}>✦</div><div style={{fontSize:13,marginTop:8}}>Analisando...</div></div>}
            {scanRes && !scanRes.error && (
              <div className="anim-pop" style={S.card}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:14,letterSpacing:0.5}}>DETECTADO</div>
                {[["Estabelecimento", scanRes.description, "white"],["Valor", brl(scanRes.value), "#f87171"],["Categoria", `${CATS[scanRes.category]?.icon||"📦"} ${CATS[scanRes.category]?.label||scanRes.category}`, "#c084fc"]].map(([l,v,c])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{l}</span>
                    <span style={{fontSize:14,fontWeight:600,color:c}}>{v}</span>
                  </div>
                ))}
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <button onClick={()=>{setScanImg(null);if(fileRef.current)fileRef.current.value="";}} style={{flex:1,padding:"12px",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13}}>Cancelar</button>
                  <button onClick={confirmScan} style={{flex:2,padding:"12px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#a855f7,#6366f1)",color:"white",cursor:"pointer",fontSize:13,fontWeight:600}}>✓ Confirmar</button>
                </div>
              </div>
            )}
            {scanRes?.error && <div style={{textAlign:"center",padding:"20px",color:"#f87171"}}>Não consegui identificar.<button onClick={()=>{setScanImg(null);if(fileRef.current)fileRef.current.value="";}} style={{display:"block",margin:"12px auto 0",padding:"10px 24px",borderRadius:12,border:"none",background:"rgba(248,113,113,0.1)",color:"#f87171",cursor:"pointer"}}>Tentar novamente</button></div>}
          </>
        )}
      </div>
    </div>
  );
}

function InsightsTab({ insights, insLoading, loadInsights, S }) {
  const tc = { warning:"#fbbf24", tip:"#c084fc", positive:"#4ade80", neutral:"#94a3b8" };
  const tb = { warning:"rgba(251,191,36,0.07)", tip:"rgba(192,132,252,0.07)", positive:"rgba(74,222,128,0.07)", neutral:"rgba(148,163,184,0.07)" };
  return (
    <div style={S.scroll}>
      <div style={S.header}><div style={S.headerTitle}>Insights IA</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>Análise inteligente</div></div>
      <div style={{padding:"0 16px 20px"}}>
        {insLoading && <div style={{textAlign:"center",padding:"60px 0"}}><div style={{fontSize:40,animation:"pulse 1.2s infinite"}}>✦</div><div style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:14}}>Analisando suas finanças...</div></div>}
        {!insLoading && insights.map((ins,i)=>(
          <div key={i} className="anim-fadeup" style={{...S.card,marginBottom:10,background:tb[ins.type]||tb.neutral,border:`1px solid ${tc[ins.type]||tc.neutral}22`,animationDelay:`${i*0.08}s`}}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:28}}>{ins.icon}</span>
              <div><div style={{fontSize:13,fontWeight:700,color:tc[ins.type],marginBottom:5}}>{ins.title}</div><div style={{fontSize:13,color:"rgba(255,255,255,0.5)",lineHeight:1.55}}>{ins.body}</div></div>
            </div>
          </div>
        ))}
        {!insLoading && <button onClick={loadInsights} style={{width:"100%",padding:"13px",borderRadius:16,border:"1px solid rgba(192,132,252,0.15)",background:"transparent",color:"rgba(192,132,252,0.6)",cursor:"pointer",fontSize:13,marginTop:4}}>↻ Atualizar</button>}
      </div>
    </div>
  );
}

function SettingsTab({ connections, connectBank, syncBank, disconnectBank, pluggyLoading, user, onLogout, S }) {
  return (
    <div style={S.scroll}>
      <div style={S.header}><div style={S.headerTitle}>Configurações</div></div>
      <div style={{padding:"0 16px 20px"}}>
        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#a855f7,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:"white",fontWeight:700}}>
              {(user.user_metadata?.full_name || user.email)[0]?.toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"white"}}>{user.user_metadata?.full_name || "Usuário"}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{user.email}</div>
            </div>
          </div>
        </div>

        <div style={S.sectionLabel}>BANCOS CONECTADOS</div>
        <div style={S.card}>
          {connections.length===0 && (
            <div style={{textAlign:"center",padding:"20px 0",color:"rgba(255,255,255,0.4)",fontSize:13}}>
              Nenhum banco conectado ainda
            </div>
          )}
          {connections.map(c => (
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{width:38,height:38,borderRadius:11,background:"rgba(192,132,252,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏦</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"white"}}>{c.bank_name}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>
                  {c.last_sync ? `Sync: ${new Date(c.last_sync).toLocaleString("pt-BR")}` : "Não sincronizado"}
                </div>
              </div>
              <button onClick={()=>syncBank(c.pluggy_item_id)} disabled={pluggyLoading} style={{padding:"6px 12px",borderRadius:10,border:"none",background:"rgba(192,132,252,0.15)",color:"#c084fc",fontSize:11,cursor:"pointer"}}>↻</button>
              <button onClick={()=>disconnectBank(c.pluggy_item_id)} style={{padding:"6px 10px",borderRadius:10,border:"none",background:"rgba(248,113,113,0.1)",color:"#f87171",fontSize:11,cursor:"pointer"}}>✕</button>
            </div>
          ))}

          <button onClick={connectBank} disabled={pluggyLoading} style={{
            width:"100%",padding:"14px",borderRadius:14,border:"none",marginTop:12,
            background:"linear-gradient(135deg,#a855f7,#6366f1)",color:"white",
            fontSize:14,fontWeight:600,cursor:"pointer",opacity:pluggyLoading?0.6:1,
          }}>
            {pluggyLoading ? "Conectando..." : "+ Conectar banco"}
          </button>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",textAlign:"center",marginTop:8}}>
            🔒 Open Finance regulamentado pelo Banco Central
          </div>
        </div>

        <button onClick={onLogout} style={{
          width:"100%",padding:"14px",borderRadius:14,border:"1px solid rgba(248,113,113,0.2)",
          background:"rgba(248,113,113,0.05)",color:"#f87171",
          fontSize:14,fontWeight:600,cursor:"pointer",marginTop:24,
        }}>
          Sair
        </button>
      </div>
    </div>
  );
}

function makeStyles(mode) {
  const accent = mode==="expense" ? "#f87171" : "#4ade80";
  const accentGrad = mode==="expense" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "linear-gradient(135deg,#166534,#15803d)";
  return {
    root:{maxWidth:430,margin:"0 auto",height:"100dvh",background:"#0a0a0f",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"'DM Sans',sans-serif"},
    statusBar:{display:"flex",justifyContent:"space-between",padding:"8px 22px 0",flexShrink:0},
    content:{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"},
    scroll:{flex:1,overflowY:"auto",paddingBottom:8},
    header:{padding:"14px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.05)",marginBottom:2,flexShrink:0},
    headerTitle:{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:"white",letterSpacing:-0.5},
    headerSub:{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:1},
    chatArea:{flex:1,overflowY:"auto",padding:"14px 14px 8px",display:"flex",flexDirection:"column",gap:10},
    msgWrap:(isUser)=>({display:"flex",justifyContent:isUser?"flex-end":"flex-start",alignItems:"flex-end",gap:8}),
    aiAvatar:{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#a855f7,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"white",flexShrink:0,fontWeight:700},
    bubble:(isUser,m)=>({
      maxWidth:"74%",padding:"10px 13px",
      borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",
      background:isUser?(m==="income"?"linear-gradient(135deg,#14532d,#166534)":accentGrad):"rgba(255,255,255,0.065)",
      color:"rgba(255,255,255,0.85)",fontSize:13.5,lineHeight:1.55,
      border:isUser?"none":"1px solid rgba(255,255,255,0.07)",
    }),
    txPill:{display:"flex",alignItems:"center",gap:7,marginTop:9,padding:"7px 10px",borderRadius:11,background:"rgba(255,255,255,0.09)",fontSize:13},
    modeBtn:(active,type)=>({
      flex:1,padding:"10px 0",borderRadius:13,border:`1.5px solid ${active?(type==="expense"?"rgba(248,113,113,0.4)":"rgba(74,222,128,0.4)"):"rgba(255,255,255,0.06)"}`,
      background:active?(type==="expense"?"rgba(248,113,113,0.1)":"rgba(74,222,128,0.1)"):"rgba(255,255,255,0.03)",
      color:active?(type==="expense"?"#f87171":"#4ade80"):"rgba(255,255,255,0.3)",
      fontSize:13,fontWeight:active?700:400,cursor:"pointer",fontFamily:"DM Sans",
    }),
    input:{padding:"13px 15px",borderRadius:15,border:`1.5px solid ${accent}2e`,background:"rgba(255,255,255,0.05)",color:"white",fontSize:14,fontFamily:"'DM Sans',sans-serif",flex:1},
    sendBtn:{width:48,height:48,borderRadius:14,border:"none",background:accentGrad,color:"white",fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
    nav:{display:"flex",borderTop:"1px solid rgba(255,255,255,0.06)",background:"rgba(8,8,13,0.97)",backdropFilter:"blur(20px)",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom,6px)"},
    navBtn:(active)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0 8px",background:"transparent",border:"none",cursor:"pointer",color:active?"#c084fc":"rgba(255,255,255,0.28)",fontFamily:"DM Sans"}),
    balCard:{borderRadius:24,padding:"22px",background:"linear-gradient(135deg,rgba(124,58,237,0.18),rgba(79,70,229,0.08))",border:"1px solid rgba(139,92,246,0.15)"},
    card:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"16px"},
    sectionLabel:{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.3)",letterSpacing:1,marginBottom:10,marginTop:4},
  };
}
