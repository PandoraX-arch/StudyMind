// =============================================
//  StudyMind — app.js
//  👇 Coloque sua chave OpenRouter aqui:
// =============================================

const OPENROUTER_API_KEY = "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";
const MODEL              = "z-ai/glm-4.5-air:free";
const API_URL            = "https://openrouter.ai/api/v1/chat/completions";
const SITE_URL           = "https://pandorax-arch.github.io/StudyMind/";
const SITE_NAME          = "StudyMind";

// =============================================
//  MODOS
// =============================================
const MODES = [
  {
    id: "geral", icon: "✨", label: "Tutor Geral", badge: null,
    prompt: "Você é o StudyMind, um tutor educacional amigável que ajuda estudantes brasileiros. Explique de forma clara e didática. Responda sempre em português brasileiro.",
  },
  {
    id: "matematica", icon: "🔢", label: "Matemática", badge: null,
    prompt: "Você é um professor de Matemática especialista. Explique passo a passo, mostre cálculos claramente. Use exemplos concretos. Responda em português brasileiro.",
  },
  {
    id: "ciencias", icon: "🔬", label: "Ciências", badge: null,
    prompt: "Você é um professor de Ciências (Física, Química, Biologia). Explique fenômenos com clareza e analogias simples. Responda em português brasileiro.",
  },
  {
    id: "historia", icon: "🌍", label: "História e Geo", badge: null,
    prompt: "Você é um professor de História e Geografia. Conte eventos históricos de forma envolvente e crítica. Responda em português brasileiro.",
  },
  {
    id: "literatura", icon: "📖", label: "Português e Literatura", badge: null,
    prompt: "Você é um professor de Língua Portuguesa e Literatura. Ajude com gramática, redação e análise literária. Responda em português brasileiro.",
  },
  {
    id: "ingles", icon: "🇬🇧", label: "Inglês", badge: null,
    prompt: "You are an English teacher helping Brazilian students. Communicate in both Portuguese and English. Explain grammar, vocabulary and cultural context.",
  },
  {
    id: "enem", icon: "📝", label: "ENEM e Vestibular", badge: "HOT",
    prompt: "Você é um especialista em ENEM e vestibulares brasileiros. Ajude com todas as matérias, dicas de redação nota 1000 e estratégias de prova. Responda em português brasileiro.",
  },
  {
    id: "codigo", icon: "💻", label: "Programação", badge: null,
    prompt: "Você é um mentor de programação para estudantes. Explique lógica, algoritmos e linguagens com exemplos claros. Responda em português brasileiro.",
  },
];

const SUGGESTIONS = [
  { icon: "📐", text: "Como resolver equações de 2º grau?" },
  { icon: "🧬", text: "Explique a divisão celular para mim" },
  { icon: "📜", text: "Resumo da Revolução Francesa" },
  { icon: "✍️", text: "Dicas para redação nota 1000 no ENEM" },
];

// =============================================
//  UTILS
// =============================================
const { useState, useRef, useEffect } = React;

const getTime = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const fileToBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const toHtml = (text) => {
  if (typeof marked !== "undefined") return { __html: marked.parse(text || "") };
  return { __html: (text || "").replace(/\n/g, "<br>") };
};

// =============================================
//  COMPONENTES
// =============================================

function ThinkingBubble() {
  return (
    <div className="message-group">
      <div className="avatar ai">🎓</div>
      <div className="message-content">
        <div className="thinking-bubble">
          <span className="thinking-label">Pensando</span>
          <div className="dots">
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isAI = msg.role === "assistant";
  return (
    <div className={`message-group ${isAI ? "" : "user"}`}>
      {isAI && <div className="avatar ai">🎓</div>}
      <div className="message-content">
        {msg.imgPreview && (
          <img src={msg.imgPreview} alt="enviado" className="bubble-img" />
        )}
        <div className={`bubble ${isAI ? "ai" : "user"}`}>
          {isAI
            ? <span><span dangerouslySetInnerHTML={toHtml(msg.content)} />{msg.streaming && <span className="typing-cursor" />}</span>
            : <span>{msg.content}</span>
          }
        </div>
        <div className="message-time">{msg.time}</div>
      </div>
      {!isAI && <div className="avatar user">👤</div>}
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div className={`toast ${toast.visible ? "show" : ""} ${toast.type || ""}`}>
      {toast.message}
    </div>
  );
}

// =============================================
//  APP
// =============================================
function App() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [mode,      setMode]      = useState(MODES[0]);
  const [loading,   setLoading]   = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [apiKey,    setApiKey]    = useState(OPENROUTER_API_KEY);
  const [imgPreview,setImgPreview]= useState(null);
  const [imgBase64, setImgBase64] = useState(null);
  const [toast,     setToast]     = useState({ visible: false, message: "", type: "" });

  const bottomRef   = useRef(null);
  const textRef     = useRef(null);
  const fileRef     = useRef(null);
  const abortRef    = useRef(null);
  const msgsRef     = useRef([]);
  msgsRef.current   = messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  function showToast(message, type = "") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Só imagens são suportadas.", "error"); return; }
    if (file.size > 5 * 1024 * 1024)    { showToast("Imagem muito grande (máx 5MB).", "error"); return; }
    setImgPreview(URL.createObjectURL(file));
    setImgBase64(await fileToBase64(file));
    showToast("Imagem anexada ✓", "success");
  }

  function clearImage() {
    setImgPreview(null);
    setImgBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ---- SEND ----
  async function send(textOverride) {
    const userText = (textOverride !== undefined ? textOverride : input).trim();
    if (!userText && !imgBase64) return;
    if (loading || streaming) return;

    const key = apiKey.trim();
    if (!key || key === "COLOQUE_SUA_CHAVE_AQUI") {
      showToast("Configure sua chave OpenRouter na barra lateral.", "error");
      return;
    }

    // Captura imagem antes de limpar
    const snapPreview = imgPreview;
    const snapBase64  = imgBase64;

    // Mensagem do usuário para exibição
    const userMsg = {
      id: Date.now(),
      role: "user",
      content: userText || "(imagem enviada)",
      imgPreview: snapPreview,
      time: getTime(),
    };

    // Histórico ANTES da nova mensagem (ref síncrona)
    const prevMsgs = msgsRef.current;

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    clearImage();
    setLoading(true);

    // Monta histórico para API — apenas mensagens válidas e completas
    const history = prevMsgs
      .filter(m =>
        m.content &&
        m.content.trim() !== "" &&
        !m.content.startsWith("❌") &&
        !m.streaming
      )
      .map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).trim(),
      }));

    // Conteúdo da nova mensagem do usuário
    const newContent = userText || "O que há nesta imagem?";

    // Payload final — formato correto para o OpenRouter
    // IMPORTANTE: começa com user, alterna user/assistant, termina com user
    const apiMessages = [
      { role: "user",      content: mode.prompt + " Confirme com OK." },
      { role: "assistant", content: "OK." },
      ...history,
      { role: "user",      content: newContent },
    ];

    console.log("Enviando mensagens:", JSON.stringify(apiMessages, null, 2));

    // Placeholder da resposta da IA
    const aiId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: aiId, role: "assistant", content: "", time: getTime(), streaming: true,
    }]);
    setLoading(false);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type":       "application/json",
          "Authorization":      "Bearer " + key,
          "HTTP-Referer":       SITE_URL,
          "X-OpenRouter-Title": SITE_NAME,
        },
        body: JSON.stringify({
          model:    MODEL,
          stream:   true,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        let errMsg = "Erro HTTP " + res.status;
        try {
          const j = await res.json();
          console.error("Resposta de erro:", JSON.stringify(j, null, 2));
          errMsg = j?.error?.message || j?.message || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulated += delta;
              const snap = accumulated;
              setMessages(prev =>
                prev.map(m => m.id === aiId ? { ...m, content: snap } : m)
              );
            }
          } catch (_) {}
        }
      }

      setMessages(prev =>
        prev.map(m => m.id === aiId ? { ...m, streaming: false } : m)
      );

    } catch (err) {
      if (err.name === "AbortError") {
        setMessages(prev =>
          prev.map(m => m.id === aiId
            ? { ...m, content: (m.content || "") + "\n\n*(interrompido)*", streaming: false }
            : m)
        );
      } else {
        console.error("Erro:", err);
        setMessages(prev =>
          prev.map(m => m.id === aiId
            ? { ...m, content: "Erro: " + err.message, streaming: false }
            : m)
        );
        showToast("Erro: " + err.message, "error");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function changeMode(m) {
    setMode(m);
    setMessages([]);
    showToast("Modo: " + m.label, "success");
  }

  const keyOk = apiKey.trim().length > 10 && apiKey !== "COLOQUE_SUA_CHAVE_AQUI";

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <span className="logo-text">StudyMind</span>
          </div>
          <div className="logo-tagline">Seu tutor inteligente</div>
        </div>

        <button className="new-chat-btn" onClick={() => setMessages([])}>
          <span>✦</span> Novo Chat
        </button>

        <div className="sidebar-section-label">Modos de Estudo</div>
        <nav className="mode-list">
          {MODES.map(m => (
            <button
              key={m.id}
              className={"mode-btn" + (mode.id === m.id ? " active" : "")}
              onClick={() => changeMode(m)}
            >
              <span className="mode-icon">{m.icon}</span>
              <span className="mode-label">{m.label}</span>
              {m.badge && <span className="mode-badge">{m.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="api-section">
          <div className="api-label">🔑 Chave OpenRouter</div>
          <div className="api-key-wrapper">
            <input
              type="password"
              className="api-key-input"
              placeholder="sk-or-v1-..."
              value={apiKey === "COLOQUE_SUA_CHAVE_AQUI" ? "" : apiKey}
              onChange={e => setApiKey(e.target.value.trim() || "COLOQUE_SUA_CHAVE_AQUI")}
            />
            <div className={"api-status" + (keyOk ? " ok" : " bad")} />
          </div>
          <div className="api-hint">
            Obtenha grátis em{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer"
               style={{ color: "var(--amber)", textDecoration: "none" }}>
              openrouter.ai/keys
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-mode">
            <span className="topbar-mode-icon">{mode.icon}</span>
            <span className="topbar-mode-name">{mode.label}</span>
          </div>
          <div className="topbar-divider" />
          <div className="topbar-status">
            <div className="status-dot" />
            {streaming ? "Respondendo..." : "Pronto"}
          </div>
          <div className="topbar-right">
            {imgPreview && (
              <div className="img-preview-badge">
                <img src={imgPreview} alt="" className="img-preview-thumb" />
                <span>Imagem</span>
                <button className="remove-img-btn" onClick={clearImage}>✕</button>
              </div>
            )}
            {streaming && (
              <button onClick={() => abortRef.current?.abort()} style={{
                background: "var(--bg-hover)", border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-sm)", color: "var(--text-secondary)",
                padding: "5px 12px", fontSize: "12px", cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}>⏹ Parar</button>
            )}
          </div>
        </header>

        <div className="chat-area">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-orb">🎓</div>
              <h1 className="welcome-title">Olá! Sou o StudyMind</h1>
              <p className="welcome-sub">
                Estou aqui para te ajudar com qualquer matéria escolar.
                Escolha um modo na barra lateral ou clique numa sugestão!
              </p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((s, i) => (
                  <div key={i} className="suggestion-card" onClick={() => send(s.text)}>
                    <div className="suggestion-card-icon">{s.icon}</div>
                    <div className="suggestion-card-text">{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(m => <Message key={m.id} msg={m} />)}
              {loading && <ThinkingBubble />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          {imgPreview && (
            <div className="image-preview-row">
              <div className="img-preview-item">
                <img src={imgPreview} alt="preview" />
                <button className="img-preview-remove" onClick={clearImage}>✕</button>
              </div>
            </div>
          )}

          <div className="input-box">
            <textarea
              ref={textRef}
              className="input-textarea"
              placeholder={"Pergunte ao " + mode.label + "... (Shift+Enter para nova linha)"}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              disabled={loading || streaming}
            />
            <div className="input-actions">
              <input ref={fileRef} type="file" accept="image/*"
                     style={{ display: "none" }} onChange={handleImage} />
              <button
                className={"icon-btn" + (imgBase64 ? " has-image" : "")}
                title="Anexar imagem"
                onClick={() => fileRef.current?.click()}
                disabled={loading || streaming}
              >📎</button>
              <button
                className="send-btn"
                onClick={() => send()}
                disabled={loading || streaming || (!input.trim() && !imgBase64)}
                title="Enviar (Enter)"
              >➤</button>
            </div>
          </div>

          <div className="input-footer">
            <span className="input-hint">
              {mode.icon} Modo: <strong style={{ color: "var(--text-secondary)" }}>{mode.label}</strong>
            </span>
            <span className="char-counter">{input.length}</span>
          </div>
        </div>
      </main>

      <Toast toast={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
