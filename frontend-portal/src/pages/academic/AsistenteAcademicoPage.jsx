import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { aiAssistantService } from '../../services/api';

// Helper para formatear fechas relativas ("Hoy, 13:10", "Ayer, 18:24", "14 nov, 10:02")
function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) return `Hoy, ${timeStr}`;
  if (isYesterday) return `Ayer, ${timeStr}`;

  const day = date.getDate();
  const month = date.toLocaleDateString('es-BO', { month: 'short' }).replace('.', '');
  return `${day} ${month}, ${timeStr}`;
}

// Preguntas sugeridas para conversaciones nuevas
const SUGGESTED_QUERIES = [
  '¿Qué es la criminología crítica y cuáles son sus principales postulados?',
  '¿Cuáles son las principales tendencias de prevención del delito en Bolivia?',
  '¿Qué investigaciones abordan la ciberdelincuencia y la evidencia digital?',
  '¿Cuáles son los enfoques actuales en política criminal y victimología penitenciaria?',
];

export default function AsistenteAcademicoPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Estados de navegación y conversaciones
  const [conversaciones, setConversaciones] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [filterFavoritas, setFilterFavoritas] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingQuery, setSendingQuery] = useState(false);

  // Estados de entrada y visualización
  const [inputText, setInputText] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({}); // { messageId: boolean }
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfDocTitle, setPdfDocTitle] = useState('');
  const [pdfLoadingError, setPdfLoadingError] = useState(null);
  const [highlightedSource, setHighlightedSource] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Iniciales del usuario actual
  const userInitials = user?.nombres && user?.apellidos
    ? `${user.nombres.charAt(0)}${user.apellidos.charAt(0)}`.toUpperCase()
    : user?.nombres
    ? user.nombres.slice(0, 2).toUpperCase()
    : 'LM';

  // 1. Cargar lista de conversaciones
  const loadConversaciones = async (selectId = null) => {
    if (!isAuthenticated) return;
    try {
      setLoadingList(true);
      const params = filterFavoritas ? { favoritas: 'true' } : {};
      const res = await aiAssistantService.listConversations(params);
      const list = Array.isArray(res) ? res : res.results || [];
      setConversaciones(list);

      // Si hay un ID para seleccionar o si no hay ninguno activo pero hay elementos
      if (selectId) {
        selectConversation(selectId);
      } else if (!activeConversationId && list.length > 0) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadConversaciones();
  }, [filterFavoritas, isAuthenticated]);

  // 2. Cargar detalle de la conversación activa
  const selectConversation = async (convId) => {
    setActiveConversationId(convId);
    setMobileDrawerOpen(false);
    try {
      setLoadingChat(true);
      const data = await aiAssistantService.getConversation(convId);
      setActiveConversation(data);

      // Abrir fuentes del último mensaje por defecto
      if (data.mensajes && data.mensajes.length > 0) {
        const lastMsg = data.mensajes[data.mensajes.length - 1];
        if (lastMsg.fuentes && lastMsg.fuentes.length > 0) {
          setExpandedSources((prev) => ({ ...prev, [lastMsg.id]: true }));
        }
      }
    } catch (err) {
      console.error('Error al cargar conversación:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  // 3. Crear nueva conversación
  const handleNuevaConversacion = () => {
    setActiveConversationId(null);
    setActiveConversation(null);
    setInputText('');
    setMobileDrawerOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 4. Enviar consulta
  const handleEnviarConsulta = async (overrideText = null) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || sendingQuery) return;

    if (!isAuthenticated) {
      navigate('/acceso-miembros?redirect=/asistente-academico');
      return;
    }

    setInputText('');
    setSendingQuery(true);

    // Mensaje optimista temporal del usuario
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      rol: 'user',
      contenido: textToSend,
      fecha_envio: new Date().toISOString(),
    };

    setActiveConversation((prev) => {
      const existingMsgs = prev?.mensajes || [];
      return {
        ...(prev || { id: activeConversationId, titulo: textToSend.slice(0, 45) }),
        mensajes: [...existingMsgs, tempUserMsg],
      };
    });

    scrollToBottom();

    try {
      const response = await aiAssistantService.sendQuery({
        query_text: textToSend,
        conversacion_id: activeConversationId || null,
      });

      // Si fue una nueva conversación, actualizar el ID y recargar lista
      const newConvId = response.conversacion_id;
      if (!activeConversationId || activeConversationId !== newConvId) {
        setActiveConversationId(newConvId);
      }

      // Mensaje de respuesta del asistente
      const assistantMsg = {
        id: response.mensaje_id,
        rol: 'assistant',
        contenido: response.contenido,
        fecha_envio: new Date().toISOString(),
        fuentes: response.fuentes_consultadas || [],
        valoracion: null,
        es_favorito: false,
      };

      // Expandir fuentes del mensaje recibido
      if (assistantMsg.fuentes.length > 0) {
        setExpandedSources((prev) => ({ ...prev, [assistantMsg.id]: true }));
      }

      setActiveConversation((prev) => {
        const msgsWithoutTemp = (prev?.mensajes || []).filter((m) => m.id !== tempUserMsg.id);
        return {
          id: newConvId,
          titulo: response.conversacion_titulo || prev?.titulo || textToSend.slice(0, 45),
          mensajes: [
            ...msgsWithoutTemp,
            { ...tempUserMsg, id: 'user-' + Date.now() },
            assistantMsg,
          ],
        };
      });

      // Refrescar lista de conversaciones para actualizar títulos y fechas
      loadConversaciones();
    } catch (err) {
      console.error('Error al enviar consulta:', err);
      // Agregar mensaje de error
      const errorMsg = {
        id: 'err-' + Date.now(),
        rol: 'assistant',
        contenido:
          '⚠️ Ocurrió un error al procesar tu consulta con el motor RAG de ABOCCRIM. Por favor, intenta formular la pregunta nuevamente o verifica tu conexión.',
        fecha_envio: new Date().toISOString(),
        fuentes: [],
      };
      setActiveConversation((prev) => ({
        ...prev,
        mensajes: [...(prev?.mensajes || []), errorMsg],
      }));
    } finally {
      setSendingQuery(false);
      scrollToBottom();
    }
  };

  // 5. Manejar tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarConsulta();
    }
  };

  // 6. Calificar mensaje (like / dislike)
  const handleFeedback = async (msgId, tipo) => {
    try {
      const msg = activeConversation?.mensajes?.find((m) => m.id === msgId);
      const nuevaValoracion = msg?.valoracion === tipo ? null : tipo;

      await aiAssistantService.feedbackMessage(msgId, {
        valoracion: nuevaValoracion,
      });

      setActiveConversation((prev) => ({
        ...prev,
        mensajes: prev.mensajes.map((m) =>
          m.id === msgId ? { ...m, valoracion: nuevaValoracion } : m
        ),
      }));
    } catch (err) {
      console.error('Error al registrar feedback:', err);
    }
  };

  // 7. Marcar mensaje favorito
  const handleBookmarkMessage = async (msgId) => {
    try {
      const msg = activeConversation?.mensajes?.find((m) => m.id === msgId);
      const nuevoFavorito = !msg?.es_favorito;

      await aiAssistantService.feedbackMessage(msgId, {
        es_favorito: nuevoFavorito,
      });

      setActiveConversation((prev) => ({
        ...prev,
        mensajes: prev.mensajes.map((m) =>
          m.id === msgId ? { ...m, es_favorito: nuevoFavorito } : m
        ),
      }));
    } catch (err) {
      console.error('Error al guardar favorito:', err);
    }
  };

  // 8. Copiar texto al portapapeles
  const handleCopyText = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2500);
  };

  // 9. Alternar acordeón de fuentes
  const toggleSourcesAccordion = (msgId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // 10. Alternar favorita en conversación
  const handleToggleFavoritaConv = async (e, convId, currentState) => {
    e.stopPropagation();
    try {
      await aiAssistantService.updateConversation(convId, {
        es_favorita: !currentState,
      });
      loadConversaciones();
    } catch (err) {
      console.error('Error al actualizar favorita:', err);
    }
  };

  // 11. Eliminar conversación
  const handleEliminarConv = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar esta conversación académica?')) return;
    try {
      await aiAssistantService.deleteConversation(convId);
      if (activeConversationId === convId) {
        handleNuevaConversacion();
      }
      loadConversaciones();
    } catch (err) {
      console.error('Error al eliminar conversación:', err);
    }
  };

  // Scroll automático hacia abajo
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.mensajes, sendingQuery]);

  // Click en cita dentro del texto [1], [2] -> expandir fuentes, hacer scroll suave y resaltar
  const handleCitationClick = (msgId, citationNum) => {
    // 1. Abrir acordeón de fuentes si está cerrado
    setExpandedSources((prev) => ({ ...prev, [msgId]: true }));
    
    // 2. Marcar fuente resaltada
    const highlightKey = `${msgId}-${citationNum}`;
    setHighlightedSource(highlightKey);

    // 3. Scroll suave hacia la tarjeta de la fuente referenciada
    setTimeout(() => {
      const el = document.getElementById(`source-card-${msgId}-${citationNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    // 4. Limpiar resaltado después de unos segundos
    setTimeout(() => {
      setHighlightedSource((curr) => (curr === highlightKey ? null : curr));
    }, 4000);
  };

  // Abrir visor de PDF auténtico (descargando blob autenticado con JWT)
  const handleOpenPdfModal = async (fuente) => {
    const docId = fuente.documento_id;
    if (!docId) {
      alert('Esta cita no tiene un archivo PDF digital asociado.');
      return;
    }

    try {
      setLoadingPdf(true);
      setPdfLoadingError(null);
      setPdfDocTitle(fuente.cita_bibliografica || fuente.publicacion_titulo || 'Documento Digital');

      const token = localStorage.getItem('aboccrim_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const baseApi = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const cleanBase = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi.replace(/\/+$/, '')}/api/v1`;
      const url = `${cleanBase}/publications/documents/${docId}/download/?inline=1`;

      const response = await fetch(url, { headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Error ${response.status}: No se pudo descargar el documento.`);
      }

      const blob = await response.blob();
      const rawUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const pageAnchor = fuente.numero_pagina ? `#page=${fuente.numero_pagina}` : '';
      setPdfBlobUrl(rawUrl + pageAnchor);
    } catch (err) {
      console.error('Error al abrir visor de PDF:', err);
      setPdfLoadingError(err.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleClosePdfModal = () => {
    if (pdfBlobUrl) {
      const raw = pdfBlobUrl.split('#')[0];
      try {
        window.URL.revokeObjectURL(raw);
      } catch (e) {}
    }
    setPdfBlobUrl(null);
    setPdfLoadingError(null);
    setPdfDocTitle('');
  };

  // Renderizador de Markdown enriquecido con badges de cita [1], [2]
  const renderFormattedContent = (content, msgId) => {
    if (!content) return null;

    // Expresión para encontrar citas [1], [2], etc.
    const citationRegex = /\[(\d+)\]/g;

    // Separar por párrafos
    const paragraphs = content.split('\n\n');

    return (
      <div className="space-y-3 text-slate-800 text-[13.5px] sm:text-[14px] leading-relaxed">
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Detectar si es una lista con viñetas
          const lines = trimmed.split('\n');
          const isBulletList = lines.every((line) => line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('* '));

          if (isBulletList) {
            return (
              <ul key={pIdx} className="space-y-1.5 pl-2 my-2">
                {lines.map((line, lIdx) => {
                  const itemText = line.replace(/^[•\-\*]\s*/, '').trim();
                  return (
                    <li key={lIdx} className="flex items-start gap-2">
                      <span className="text-primary font-bold text-sm shrink-0">•</span>
                      <div className="flex-1">
                        {renderInlineFormatting(itemText, msgId, citationRegex)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Si empieza con título en negrita (ej: **Principales postulados:**)
          if (trimmed.startsWith('**') && trimmed.endsWith('**') && lines.length === 1) {
            return (
              <h4 key={pIdx} className="font-bold text-slate-900 text-sm sm:text-[15px] pt-1">
                {trimmed.replace(/\*\*/g, '')}
              </h4>
            );
          }

          return (
            <p key={pIdx}>
              {renderInlineFormatting(trimmed, msgId, citationRegex)}
            </p>
          );
        })}
      </div>
    );
  };

  // Formato inline para negritas y badges de citas
  const renderInlineFormatting = (text, msgId, citationRegex) => {
    // Primero procesamos las citas [1]
    const parts = [];
    let lastIndex = 0;
    let match;

    const regexCopy = new RegExp(citationRegex);
    while ((match = regexCopy.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: text.substring(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'citation',
        num: match[1],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        value: text.substring(lastIndex),
      });
    }

    return parts.map((part, idx) => {
      if (part.type === 'citation') {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleCitationClick(msgId, part.num)}
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 mx-0.5 rounded-md bg-blue-100 hover:bg-[#00055d] hover:text-white text-primary font-bold text-[11px] align-middle transition-all cursor-pointer border border-blue-300/70 shadow-2xs active:scale-95"
            title={`Ver referencia [${part.num}] en las fuentes consultadas`}
          >
            {part.num}
          </button>
        );
      }

      // Procesar negritas con **
      const boldParts = part.value.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        return (
          <span key={idx}>
            {boldParts.map((sub, sIdx) =>
              sIdx % 2 === 1 ? (
                <strong key={sIdx} className="font-bold text-slate-900">
                  {sub}
                </strong>
              ) : (
                sub
              )
            )}
          </span>
        );
      }

      return <span key={idx}>{part.value}</span>;
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-[#f8fafd]">
      {/* Contenedor principal de 2 columnas */}
      <div className="w-full flex-1 flex flex-col md:flex-row max-w-[1440px] mx-auto overflow-hidden">
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA: SIDEBAR DE CONVERSACIONES */}
        {/* ========================================================= */}
        <aside
          className={`
            fixed md:relative inset-y-0 left-0 z-40 md:z-auto
            w-80 sm:w-84 shrink-0 bg-white md:bg-[#fbfcfd]
            border-r border-slate-200/80 flex flex-col
            transition-transform duration-300 ease-in-out
            ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ height: 'calc(100vh - 80px)' }}
        >
          {/* Header del sidebar */}
          <div className="p-4 sm:p-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                <h2 className="font-bold text-slate-900 text-base">Asistente Académico</h2>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              Consulta información del repositorio institucional con IA.
            </p>

            {/* Botón Nueva Conversación */}
            <button
              onClick={handleNuevaConversacion}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00055d] hover:bg-[#000445] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Nueva conversación</span>
            </button>
          </div>

          {/* Selector de pestañas: Mis conversaciones / Favoritas */}
          <div className="px-4 py-1">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setFilterFavoritas(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !filterFavoritas
                    ? 'bg-blue-100/80 text-primary shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                <span>Mis conversaciones</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterFavoritas(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterFavoritas
                    ? 'bg-blue-100/80 text-primary shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">star</span>
                <span>Favoritas</span>
              </button>
            </div>
          </div>

          {/* Subtítulo Conversaciones Recientes */}
          <div className="px-5 pt-3 pb-1">
            <span className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
              {filterFavoritas ? 'Conversaciones Favoritas' : 'Conversaciones Recientes'}
            </span>
          </div>

          {/* Lista scrollable de conversaciones */}
          <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
            {loadingList ? (
              <div className="p-4 text-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-xl animate-spin text-primary">sync</span>
                <p className="mt-1">Cargando historial...</p>
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-2xl text-slate-300">forum</span>
                <p className="mt-1.5">No hay conversaciones registradas.</p>
              </div>
            ) : (
              conversaciones.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`group relative flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-blue-50/80 border border-blue-200/80 text-primary'
                        : 'hover:bg-slate-100/80 text-slate-700'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-base mt-0.5 shrink-0 ${
                        isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      chat_bubble_outline
                    </span>

                    <div className="flex-1 min-w-0 pr-12">
                      <p
                        className={`text-xs truncate font-medium ${
                          isActive ? 'text-primary font-bold' : 'text-slate-800'
                        }`}
                      >
                        {conv.titulo || 'Consulta académica'}
                      </p>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">
                        {formatRelativeDate(conv.fecha_actualizacion || conv.fecha_creacion)}
                      </span>
                    </div>

                    {/* Acciones flotantes al pasar el mouse */}
                    <div className="absolute right-2 top-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavoritaConv(e, conv.id, conv.es_favorita)}
                        className={`p-1 rounded-md hover:bg-white text-xs ${
                          conv.es_favorita ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                        }`}
                        title={conv.es_favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {conv.es_favorita ? 'star' : 'star_border'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleEliminarConv(e, conv.id)}
                        className="p-1 rounded-md hover:bg-white text-slate-400 hover:text-red-600 text-xs"
                        title="Eliminar conversación"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tarjeta inferior informativa */}
          <div className="p-3.5 m-3 rounded-2xl bg-blue-50/60 border border-blue-100/80">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-base mt-0.5 shrink-0">info</span>
              <div>
                <h4 className="text-xs font-bold text-primary">Uso del asistente</h4>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                  Las respuestas se generan a partir de documentos autorizados del repositorio de ABOCCRIM.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay para móvil cuando el sidebar está abierto */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs"
          />
        )}

        {/* ========================================================= */}
        {/* COLUMNA DERECHA: ÁREA PRINCIPAL DE CHAT */}
        {/* ========================================================= */}
        <main
          className="flex-1 flex flex-col bg-white md:bg-transparent overflow-hidden"
          style={{ height: 'calc(100vh - 80px)' }}
        >
          {/* Header del chat */}
          <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* Botón hamburguesa móvil para abrir sidebar */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                aria-label="Abrir historial de conversaciones"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>

              {/* Icono robot en caja redondeada */}
              <div className="w-10 h-10 rounded-2xl bg-blue-100/70 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">smart_toy</span>
              </div>

              <div>
                <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                  Asistente Académico Inteligente
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-tight hidden sm:block">
                  Realiza consultas académicas en lenguaje natural y obtén respuestas con sus fuentes documentales.
                </p>
              </div>
            </div>

            {/* Acceso directo a biblioteca */}
            <button
              onClick={() => navigate('/repositorio')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              title="Explorar publicaciones en Repositorio"
            >
              <span className="material-symbols-outlined text-sm">menu_book</span>
              <span>Repositorio</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* ÁREA DE MENSAJES CON SCROLL */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Si no hay conversación seleccionada o está vacía: Pantalla de Bienvenida */}
            {(!activeConversation || !activeConversation.mensajes || activeConversation.mensajes.length === 0) && (
              <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-blue-100/80 text-primary mx-auto flex items-center justify-center shadow-xs mb-4">
                  <span className="material-symbols-outlined text-3xl">smart_toy</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  ¿En qué investigación criminológica podemos ayudarte hoy?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                  Realiza preguntas sobre teorías criminológicas, derecho penal, seguridad o publicaciones autorizadas de ABOCCRIM.
                </p>

                {/* Preguntas sugeridas */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                  {SUGGESTED_QUERIES.map((query, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => handleEnviarConsulta(query)}
                      className="p-3.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 text-left transition-all shadow-2xs group cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-base text-primary/70 group-hover:text-primary mt-0.5 shrink-0">
                          chat_paste_go
                        </span>
                        <span className="text-xs font-medium text-slate-800 group-hover:text-primary leading-snug">
                          {query}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de mensajes */}
            {activeConversation?.mensajes?.map((msg) => {
              const isUser = msg.rol === 'user';

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end items-start gap-2.5 sm:gap-3">
                    {/* Burbuja de mensaje del usuario */}
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-blue-50/90 border border-blue-100 px-4 py-3 shadow-2xs">
                      <p className="text-slate-800 text-[13.5px] sm:text-[14px] leading-relaxed whitespace-pre-wrap">
                        {msg.contenido}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10.5px] text-slate-400">
                        <span>{formatRelativeDate(msg.fecha_envio).split(', ')[1] || '13:10'}</span>
                        <span className="text-primary font-bold">✓✓</span>
                      </div>
                    </div>

                    {/* Avatar usuario */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00055d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {userInitials}
                    </div>
                  </div>
                );
              }

              // Mensaje del Asistente IA
              const fuentes = msg.fuentes || [];
              const isAccordionOpen = expandedSources[msg.id] ?? false;

              return (
                <div key={msg.id} className="flex justify-start items-start gap-2.5 sm:gap-3">
                  {/* Avatar robot */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-blue-100 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-xl">smart_toy</span>
                  </div>

                  {/* Contenedor del contenido */}
                  <div className="flex-1 max-w-[92%] sm:max-w-[85%]">
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs relative">
                      {/* Barra de acciones superior derecha */}
                      <div className="flex items-center justify-end gap-1 mb-2">
                        {/* Like */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'like')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            msg.valoracion === 'like'
                              ? 'text-primary bg-blue-50'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title="Buena respuesta"
                        >
                          <span className="material-symbols-outlined text-base">thumb_up</span>
                        </button>

                        {/* Dislike */}
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'dislike')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            msg.valoracion === 'dislike'
                              ? 'text-red-600 bg-red-50'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title="Respuesta deficiente o inexacta"
                        >
                          <span className="material-symbols-outlined text-base">thumb_down</span>
                        </button>

                        {/* Bookmark / Guardar */}
                        <button
                          type="button"
                          onClick={() => handleBookmarkMessage(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            msg.es_favorito
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                          title={msg.es_favorito ? 'Guardado en favoritos' : 'Guardar respuesta'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {msg.es_favorito ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>

                        {/* Copiar texto */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.contenido)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={copiedMessageId === msg.id ? '¡Copiado!' : 'Copiar respuesta'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {copiedMessageId === msg.id ? 'check' : 'content_copy'}
                          </span>
                        </button>
                      </div>

                      {/* Texto de la respuesta con Markdown y citas [1] */}
                      {renderFormattedContent(msg.contenido, msg.id)}

                      {/* ========================================================= */}
                      {/* ACORDEÓN: FUENTES CONSULTADAS */}
                      {/* ========================================================= */}
                      {fuentes.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {/* Botón para expandir/colapsar */}
                          <button
                            type="button"
                            onClick={() => toggleSourcesAccordion(msg.id)}
                            className="w-full flex items-center justify-between text-left py-1 text-xs font-bold text-slate-800 hover:text-primary transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
                              <span>Fuentes consultadas ({fuentes.length})</span>
                            </div>
                            <span className="material-symbols-outlined text-base text-slate-400">
                              {isAccordionOpen ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>

                          {/* Lista desplegada de fuentes */}
                          {isAccordionOpen && (
                            <div className="mt-2.5 space-y-2">
                              {fuentes.map((fuente) => {
                                const isHighlighted = highlightedSource === `${msg.id}-${fuente.orden_cita}`;
                                return (
                                  <div
                                    key={fuente.id || fuente.orden_cita}
                                    id={`source-card-${msg.id}-${fuente.orden_cita}`}
                                    className={`p-2.5 rounded-xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs ${
                                      isHighlighted
                                        ? 'bg-blue-50/95 border-primary ring-2 ring-primary/40 shadow-md scale-[1.01]'
                                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/60'
                                    }`}
                                  >
                                    {/* Indicador de cita y referencia bibliográfica */}
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                      <span className="w-5 h-5 rounded-md bg-blue-100 text-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                        {fuente.orden_cita}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-slate-800 font-medium leading-snug">
                                          {fuente.cita_bibliografica || fuente.publicacion_titulo}
                                        </p>
                                        {fuente.numero_pagina && (
                                          <span className="text-[10.5px] text-slate-500 block mt-0.5">
                                            Página {fuente.numero_pagina}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Botones de acción: PDF y Ver Publicación */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                      {fuente.documento_id || fuente.pdf_url ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPdfModal(fuente)}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-primary/50 text-slate-700 hover:text-primary text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                                          title="Visualizar documento PDF"
                                        >
                                          <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                                          <span>PDF</span>
                                        </button>
                                      ) : null}

                                      {fuente.publicacion_id ? (
                                        <button
                                          type="button"
                                          onClick={() => navigate(`/repositorio/${fuente.publicacion_id}`)}
                                          className="p-1 rounded-lg bg-white border border-slate-200 hover:border-primary/50 text-slate-600 hover:text-primary shadow-2xs transition-colors cursor-pointer"
                                          title="Ver ficha completa en el Repositorio"
                                        >
                                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Indicador de carga cuando la IA está pensando */}
            {sendingQuery && (
              <div className="flex justify-start items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-primary flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
                  <span className="material-symbols-outlined text-xl">smart_toy</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-xs flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl animate-spin">sync</span>
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Consultando repositorio institucional ABOCCRIM...</p>
                    <p className="text-[11px] text-slate-400">Recuperando fragmentos autorizados y verificando citas.</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================= */}
          {/* BARRA INFERIOR DE ENTRADA DE CONSULTA */}
          {/* ========================================================= */}
          <div className="p-3 sm:p-4 bg-white/80 backdrop-blur-xs border-t border-slate-200/80 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                {/* Botón de adjunto */}
                <button
                  type="button"
                  onClick={() => alert('Función de adjuntar documentos contextuales disponible próximamente.')}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
                  title="Adjuntar contexto adicional"
                >
                  <span className="material-symbols-outlined text-lg">attach_file</span>
                </button>

                {/* Input de texto */}
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Haz una pregunta de seguimiento..."
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 text-xs sm:text-sm px-2 py-1 resize-none placeholder:text-slate-400 max-h-32"
                />

                {/* Botón Enviar */}
                <button
                  type="button"
                  onClick={() => handleEnviarConsulta()}
                  disabled={!inputText.trim() || sendingQuery}
                  className="w-9 h-9 rounded-full bg-[#00055d] hover:bg-[#000445] disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                  title="Enviar consulta"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </div>

              <div className="text-center mt-2">
                <span className="text-[10.5px] text-slate-400">
                  Las respuestas son generadas por IA y fundamentadas en las publicaciones institucionales de ABOCCRIM.
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE VISUALIZACIÓN DE PDF */}
      {/* ========================================================= */}
      {(pdfBlobUrl || loadingPdf || pdfLoadingError) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header del modal */}
            <div className="h-14 px-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">picture_as_pdf</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={pdfDocTitle}>
                  {pdfDocTitle || 'Visor de Documento Digital ABOCCRIM'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>Abrir en pestaña</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClosePdfModal}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Cerrar visor"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Contenido del visor */}
            <div className="flex-1 bg-slate-100 relative">
              {loadingPdf && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10 gap-3">
                  <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">Cargando documento PDF del repositorio...</p>
                </div>
              )}

              {pdfLoadingError && (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <span className="material-symbols-outlined text-red-500 text-5xl mb-2">error</span>
                  <p className="text-sm font-bold text-slate-800">No se pudo cargar el documento</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">{pdfLoadingError}</p>
                  <button
                    type="button"
                    onClick={handleClosePdfModal}
                    className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Cerrar visor
                  </button>
                </div>
              )}

              {pdfBlobUrl && !loadingPdf && (
                <iframe
                  src={pdfBlobUrl}
                  title={pdfDocTitle || "Documento PDF"}
                  className="w-full h-full border-none"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
