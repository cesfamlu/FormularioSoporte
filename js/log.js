/* ============================================
   FORMULARIO TI — Production Script
   Form + Firebase + Google Sheets + Chatbot IA
   ============================================ */

// ---- Firebase Configuration (uses CDN compat loaded in HTML) ----
const firebaseConfig = {
    apiKey: "AIzaSyBPxvqvNfHKE1YJe4h6UwHznY4jsZMiJ0A",
    authDomain: "reportes-cesfam.firebaseapp.com",
    databaseURL: "https://reportes-cesfam-default-rtdb.firebaseio.com",
    projectId: "reportes-cesfam",
    storageBucket: "reportes-cesfam.firebasestorage.app",
    messagingSenderId: "101243881563",
    appId: "1:101243881563:web:793a5a48ffce80f2a4977e"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const googleSheetsURL = "https://script.google.com/macros/s/AKfycbyMeb2xZf0wy6rtTkLezBVsRJh7ElyIxBAZgjJBkRzsy8uLXHCwV_5SRZ8NqsBwYyU7/exec";

// ---- DOM Elements ----
const nombreInput = document.getElementById('nombre');
const areaInput = document.getElementById('area');
const problemaInput = document.getElementById('problema');
const urgenciaInput = document.getElementById('urgencia');
const themeToggleButton = document.getElementById('theme-toggle-button');
const htmlElement = document.documentElement;
const navbar = document.getElementById('navbar');

// ============================================
//  THEME TOGGLE
// ============================================

const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');

function setTema(tema) {
    if (tema === 'light') {
        htmlElement.setAttribute('data-theme', 'light');
        if (iconSun) iconSun.style.display = 'none';
        if (iconMoon) iconMoon.style.display = 'block';
        localStorage.setItem('themePreference', 'light');
    } else {
        htmlElement.setAttribute('data-theme', 'dark');
        if (iconSun) iconSun.style.display = 'block';
        if (iconMoon) iconMoon.style.display = 'none';
        localStorage.setItem('themePreference', 'dark');
    }
}

themeToggleButton.addEventListener('click', () => {
    const current = htmlElement.getAttribute('data-theme');
    setTema(current === 'light' ? 'dark' : 'light');
});

const preferenciaGuardada = localStorage.getItem('themePreference');
if (preferenciaGuardada) {
    setTema(preferenciaGuardada);
} else {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTema('light');
    } else {
        setTema('dark');
    }
}

// ============================================
//  NAVBAR SCROLL SHADOW
// ============================================

let lastScroll = 0;
window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) {
        if (y > 10) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }
    lastScroll = y;
}, { passive: true });

// ============================================
//  TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
//  URGENCY COLOR-CODING
// ============================================

if (urgenciaInput) {
    urgenciaInput.addEventListener('change', function () {
        this.classList.remove('urgencia--bajo', 'urgencia--medio', 'urgencia--critico');
        if (this.value === 'Bajo') this.classList.add('urgencia--bajo');
        else if (this.value === 'Medio') this.classList.add('urgencia--medio');
        else if (this.value === 'Cr\u00edtico') this.classList.add('urgencia--critico');
    });
}

// ============================================
//  CHARACTER COUNTER
// ============================================

const charCounter = document.getElementById('char-counter');
if (problemaInput && charCounter) {
    const maxLen = parseInt(problemaInput.getAttribute('maxlength')) || 2000;
    problemaInput.addEventListener('input', () => {
        const len = problemaInput.value.length;
        charCounter.textContent = `${len} / ${maxLen}`;
        charCounter.classList.remove('near-limit', 'at-limit');
        if (len >= maxLen * 0.9) charCounter.classList.add('at-limit');
        else if (len >= maxLen * 0.75) charCounter.classList.add('near-limit');
    });
}

// ============================================
//  FIELD VALIDATION HELPERS
// ============================================

function setFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) { field.classList.add('is-invalid'); }
    if (error) { error.textContent = message; error.classList.add('visible'); }
}

function clearFieldError(fieldId, errorId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (field) field.classList.remove('is-invalid');
    if (error) { error.textContent = ''; error.classList.remove('visible'); }
}

function clearAllErrors() {
    document.querySelectorAll('.form-control.is-invalid').forEach(f => f.classList.remove('is-invalid'));
    document.querySelectorAll('.field-error.visible').forEach(e => { e.textContent = ''; e.classList.remove('visible'); });
    document.querySelectorAll('.confirmacion-container.is-invalid').forEach(c => c.classList.remove('is-invalid'));
}

// Live validation — clear error on input
['nombre', 'contacto', 'area', 'urgencia', 'problema'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        const event = el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(event, () => clearFieldError(id, `error-${id}`));
    }
});

const confirmacionCheckbox = document.getElementById('confirmacion');
if (confirmacionCheckbox) {
    confirmacionCheckbox.addEventListener('change', () => {
        const container = document.getElementById('group-confirmacion');
        if (container) container.classList.remove('is-invalid');
    });
}

// ============================================
//  FORM SUBMISSION
// ============================================

const formulario = document.getElementById('formulario');
if (formulario) {
    formulario.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearAllErrors();

        const nombre = nombreInput.value.trim();
        const contacto = document.getElementById('contacto').value.trim();
        const area = areaInput.value;
        const urgencia = urgenciaInput ? urgenciaInput.value : '';
        const problema = problemaInput.value.trim();
        const confirmacion = document.getElementById('confirmacion').checked;
        const respuesta = document.getElementById('respuesta');
        const successOverlay = document.getElementById('success-overlay');
        const submitBtn = document.getElementById('btnEnviarReporte');

        let hasErrors = false;

        if (nombre.length < 3 || !/^[a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\s]+$/.test(nombre)) {
            setFieldError('nombre', 'error-nombre', 'Ingrese al menos 3 caracteres (solo letras)');
            hasErrors = true;
        }
        if (contacto && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(contacto) && !/^\+?\d{8,15}$/.test(contacto)) {
            setFieldError('contacto', 'error-contacto', 'Formato inv\u00e1lido (email o tel\u00e9fono)');
            hasErrors = true;
        }
        if (!area) {
            setFieldError('area', 'error-area', 'Seleccione un \u00e1rea');
            hasErrors = true;
        }
        if (!urgencia) {
            setFieldError('urgencia', 'error-urgencia', 'Seleccione la urgencia');
            hasErrors = true;
        }
        if (problema.length < 10) {
            setFieldError('problema', 'error-problema', 'Describa con al menos 10 caracteres');
            hasErrors = true;
        }
        if (!confirmacion) {
            const container = document.getElementById('group-confirmacion');
            if (container) container.classList.add('is-invalid');
            hasErrors = true;
        }

        if (hasErrors) {
            showToast('Revise los campos marcados en rojo', 'error');
            // Scroll to first error
            const firstError = document.querySelector('.is-invalid');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // All valid — send
        submitBtn.disabled = true;
        submitBtn.classList.add('btn--loading');

        const now = new Date();
        const ahora = now.toISOString();
        const fechaFormateada = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

        const datosReporte = {
            nombre, contacto, area, urgencia, problema,
            confirmacion: true,
            fecha: fechaFormateada,
            timestamp: ahora
        };

        // 1. Firebase
        try {
            await database.ref('reportes/').push(datosReporte);
            console.log('\u2705 Firebase OK');
        } catch (error) {
            console.error('Firebase error:', error);
            showToast('Error al guardar. Reintente.', 'error');
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn--loading');
            return;
        }

        // 2. Google Sheets (backup)
        try {
            const datosParaSheets = new FormData();
            datosParaSheets.append('nombre', nombre);
            datosParaSheets.append('contacto', contacto);
            datosParaSheets.append('area', area);
            datosParaSheets.append('urgencia', urgencia);
            datosParaSheets.append('fecha', fechaFormateada);
            datosParaSheets.append('problema', problema);
            datosParaSheets.append('timestamp', ahora);

            const response = await fetch(googleSheetsURL, { method: 'POST', body: datosParaSheets });
            const responseText = await response.text();
            console.log('\u2705 Sheets:', responseText);
        } catch (error) {
            console.error('Sheets error:', error instanceof Error ? error.message : error);
        }

        // 3. Success animation
        showToast('\u00a1Reporte enviado con \u00e9xito!', 'success', 5000);
        formulario.style.display = 'none';
        if (successOverlay) successOverlay.classList.add('visible');

        // Reset after delay
        setTimeout(() => {
            formulario.style.display = '';
            if (successOverlay) successOverlay.classList.remove('visible');
            formulario.reset();
            if (urgenciaInput) urgenciaInput.classList.remove('urgencia--bajo', 'urgencia--medio', 'urgencia--critico');
            if (charCounter) { charCounter.textContent = '0 / 2000'; charCounter.classList.remove('near-limit', 'at-limit'); }
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn--loading');
        }, 6000);
    });
}

// ---- Dynamic Year ----
const currentYearSpan = document.getElementById('current-year');
if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

// ============================================
//  CHATBOT ASSISTANT
// ============================================

const chatFab = document.getElementById('chatbot-fab');
const chatWindow = document.getElementById('chatbot-window');
const chatMsgs = document.getElementById('chatbot-messages');
const chatInput = document.getElementById('chatbot-input');
const chatSend = document.getElementById('chatbot-send');
const chatQR = document.getElementById('chatbot-quickreplies');
const fabIconChat = document.getElementById('fab-icon-chat');
const fabIconClose = document.getElementById('fab-icon-close');
const fabBadge = document.getElementById('fab-badge');

let chatOpen = false;
let firstOpen = true;

// ---- AI Configuration (via PHP proxy — key is server-side) ----
const AI_PROXY_URL = 'https://cesfamtic.com/api/chat.php';
const AI_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `Eres el Asistente de TI del CESFAM Dr. Alfredo Gantz Mann, La Unión, Chile.
Ayuda a funcionarios a resolver problemas técnicos. Responde en español, breve y amigable.

SISTEMAS (URLs reales):
- RAS: rasvaldivia.cl | contingencia.rasvaldivia.cl | IPs: 10.8.102.72, 10.8.102.74, 10.8.102.104
- CORE: hbvaldivia.cl/core/ | IP: 10.6.206.62/core
- Visor Exámenes: 10.66.50.47 | 10.4.59.246:90
- SIGGES: nuevo.sigges.cl | sigges.cl
- BOT SOME: bot.desamlu.cl
- BloqueApp: cesfamtic.com/BloqueAPP/login.html
- Intranet: intranetlaunion.smc.cl
- Isatec: clientes.isatec.cl
- Isis View: 10.6.67.166
- Imed: licencia.cl
- FONASA: fonasa.cl | frontintegrado.fonasa.cl
- DART: teleoftalmologia.minsal.cl
- Hospital Digital: interconsulta.minsal.cl
- Prescripción: prescripcion-receta.minsal.cl
- Derivación: cesfamlu.github.io/DerivacionDatos
- Portal de Enlaces: cesfamlu.github.io/links
- SURVIH: survih.minsal.cl
- Chile Crece: srdm.crececontigo.gob.cl
- Epivigilia: epivigila.minsal.cl
- Correo: informacionescesfamlaunion@gmail.cl | SOME: some@munilaunion.cl

REGLAS: Sé breve (máx 5 líneas). Da pasos numerados. Sugiere el formulario si necesita más ayuda. Usa emojis con moderación. NUNCA inventes URLs. Entiende el contexto antes de responder.`;

// Conversation history for AI context
const conversationHistory = [];

// Call AI via PHP proxy (no API key exposed in frontend)
async function askAI(userMessage) {
    conversationHistory.push({ role: 'user', content: userMessage });

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.slice(-10)
    ];

    const payload = {
        model: AI_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 300
    };

    try {
        const res = await fetch(AI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.status === 429) {
            console.warn('⏳ Rate limited, waiting 5s...');
            await new Promise(r => setTimeout(r, 5000));
            const retry = await fetch(AI_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!retry.ok) throw new Error(`Retry failed: ${retry.status}`);
            const retryData = await retry.json();
            const retryText = retryData.choices?.[0]?.message?.content;
            if (retryText) {
                conversationHistory.push({ role: 'assistant', content: retryText });
                return retryText;
            }
            throw new Error('Empty retry response');
        }

        if (!res.ok) {
            const errText = await res.text();
            console.error(`AI API HTTP ${res.status}:`, errText);
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const aiText = data.choices?.[0]?.message?.content;
        if (!aiText) throw new Error('Empty response');

        conversationHistory.push({ role: 'assistant', content: aiText });
        console.log('✅ AI responded OK');
        return aiText;
    } catch (err) {
        console.error('AI error:', err.message);

        const fallback = findBestMatch(userMessage);
        if (fallback) {
            conversationHistory.push({ role: 'assistant', content: fallback.response });
            return fallback.response;
        }

        return '⚠️ La IA no está disponible. Puedes:\n\n• Usar los **botones rápidos** de abajo\n• Visitar el **Portal de Enlaces** (cesfamlu.github.io/links)\n• O completar el **formulario de reporte**';
    }
}

// ============================================
//  KNOWLEDGE BASE
// ============================================

const knowledgeBase = [
    {
        keywords: ['internet', 'wifi', 'red', 'conexión', 'conexion', 'conectar', 'sin internet', 'no hay internet', 'no conecta', 'cable de red'],
        response: '🌐 **Problemas de internet:** Intente estos pasos:\n\n1. Desconecte y reconecte el cable de red\n2. Reinicie el computador\n3. Verifique que el cable esté bien enchufado al puerto del PC y al del muro\n4. Si usa WiFi, olvide la red y vuelva a conectarse\n\n💡 Si no tiene internet, no podrá acceder al RAS por dominio, pero puede intentar acceder por IP directa (ej: 10.8.102.72)\n\nSi el problema persiste, complete el formulario indicando su área.',
        quickReplies: ['RAS por IP', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['impresora', 'imprimir', 'imprime', 'no imprime', 'papel', 'tinta', 'atasca', 'atascada', 'impresion', 'impresión', 'tóner', 'toner'],
        response: '🖨️ **Problemas de impresora:** Verifique lo siguiente:\n\n1. ¿La impresora está encendida y con luz verde?\n2. ¿Tiene papel y tinta/tóner suficiente?\n3. Revise si hay papel atascado\n4. En su PC: Panel de Control → Impresoras → Verificar que la impresora correcta esté como predeterminada\n5. Pruebe apagar y encender la impresora\n\nSi sigue sin funcionar, envíe un reporte indicando el modelo de la impresora y su ubicación.',
        quickReplies: ['No funciona aún', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['contraseña', 'clave', 'password', 'olvidé', 'olvide', 'no puedo entrar', 'bloqueado', 'bloqueo', 'usuario', 'login', 'acceso', 'sesión', 'sesion'],
        response: '🔑 **Problemas de contraseña/acceso:**\n\n• **Windows:** Contacte directamente a TI para reinicio de clave\n• **RAS:** Solicite reinicio de clave a través de TI\n• **SIGGES:** Use la opción "Recuperar contraseña" en la web\n• **Correo/Intranet:** Contacte a TI\n\n⚠️ Por seguridad, nunca comparta su contraseña. Complete el formulario para solicitar un reinicio de clave.',
        quickReplies: ['RAS', 'SIGGES', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['correo', 'email', 'mail', 'outlook', 'gmail', 'no envía', 'no envia', 'no recibe', 'bandeja'],
        response: '📧 **Problemas de correo electrónico:**\n\n1. Verifique su conexión a internet\n2. Revise la carpeta de spam/no deseados\n3. Si usa Outlook, cierre y vuelva a abrir\n4. Verifique que el archivo adjunto no supere el límite (25MB)\n5. Pruebe acceder desde el navegador web\n\n📌 Correo institucional: informacionescesfamlaunion@gmail.cl\n📌 SOME: some@munilaunion.cl',
        quickReplies: ['No funciona aún', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['lento', 'lenta', 'demora', 'tarda', 'cuelga', 'congela', 'congelado', 'rendimiento', 'pc lento', 'computador lento', 'trabado'],
        response: '🐌 **Computador lento:**\n\n1. Cierre los programas que no esté usando (RAS consume bastante RAM)\n2. Reinicie el computador (apagar completamente, esperar 30 seg, encender)\n3. Verifique que no haya actualizaciones pendientes\n4. Borre archivos temporales: Win+R → escriba "%temp%" → elimine todo\n5. Si el RAS va lento pero el PC funciona bien, pruebe un servidor alternativo\n\nSi se repite frecuentemente, envíe un reporte para evaluación.',
        quickReplies: ['RAS lento', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['captura de pantalla', 'captura', 'screenshot', 'pantallazo', 'recorte', 'snipping', 'imprimir pantalla'],
        response: '📸 **Captura de pantalla en Windows:**\n\n1. **Win+Shift+S** → Herramienta de recorte (puede seleccionar área)\n2. **Tecla ImprPant** → Captura toda la pantalla al portapapeles\n3. **Alt+ImprPant** → Captura solo la ventana activa\n4. **Win+ImprPant** → Guarda automáticamente en Imágenes/Capturas\n\n💡 La captura queda en el portapapeles, péguelo con Ctrl+V en un correo, documento o en este formulario.',
        quickReplies: ['Otra consulta', 'Llenar formulario']
    },
    {
        keywords: ['monitor', 'no enciende', 'negro', 'negra', 'sin imagen', 'parpadea', 'display', 'resolución', 'resolucion', 'pantalla negra', 'pantalla parpadea'],
        response: '🖥️ **Problemas de pantalla/monitor:**\n\n1. Verifique que el monitor esté encendido (luz indicadora)\n2. Revise los cables de video y alimentación\n3. Pruebe presionar Win+P para cambiar modo de proyección\n4. Si la pantalla parpadea, ajuste la resolución: click derecho en escritorio → Configuración de pantalla\n\nSi no se resuelve, indique el modelo del monitor en su reporte.',
        quickReplies: ['Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['mouse', 'ratón', 'raton', 'teclado', 'keyboard', 'no responde', 'tecla', 'click'],
        response: '🖱️ **Problemas de mouse/teclado:**\n\n1. Si es inalámbrico, verifique las pilas/batería\n2. Desconecte y reconecte el cable USB\n3. Pruebe en otro puerto USB\n4. Reinicie el computador\n5. Si es inalámbrico, re-sincronice con el receptor USB\n\nSi necesita un reemplazo, envíe un reporte.',
        quickReplies: ['Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['programa', 'software', 'instalar', 'instalación', 'instalacion', 'aplicación', 'aplicacion', 'actualizar', 'actualización', 'actualizacion', 'error', 'falla', 'cierra solo', 'crash'],
        response: '💻 **Problemas de software:**\n\n1. Cierre el programa y vuelva a abrirlo\n2. Reinicie el computador\n3. Si pide actualización, acepte e instale\n4. Si sale un error, anote o capture el mensaje exacto (Win+Shift+S para captura)\n\n⚠️ No instale software sin autorización de TI.\n\n📌 Encuentre los sistemas institucionales en el **Portal de Enlaces**.',
        quickReplies: ['RAS', 'Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['ras', 'registro de atenciones', 'rasvaldivia', 'ficha', 'paciente', 'atención', 'atencion', 'ficha clínica', 'ficha clinica'],
        response: '🏥 **Problemas con RAS (Registro de Atenciones de Salud):**\n\n1. Verifique su conexión a internet\n2. Pruebe cerrar sesión y volver a entrar\n3. Borre caché del navegador: Ctrl+Shift+Delete\n4. Pruebe con otro navegador (Chrome recomendado)\n\n**Servidores alternativos del RAS:**\n• Principal → rasvaldivia.cl\n• Contingencia → contingencia.rasvaldivia.cl\n• IP directa 1 → 10.8.102.72\n• IP directa 2 → 10.8.102.74\n• IP directa 3 → 10.8.102.104\n\n💡 Si el principal no carga, pruebe con las IPs directas.\nPuede encontrar todos los links en el **Portal de Enlaces**.',
        quickReplies: ['Portal de Enlaces', 'Sigue sin funcionar', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['core', 'examen', 'exámenes', 'examenes', 'laboratorio', 'resultado', 'visor'],
        response: '🔬 **CORE / Visor de Exámenes:**\n\n**CORE** (gestión de exámenes):\n• Principal → hbvaldivia.cl/core/\n• IP directa → 10.6.206.62/core\n\n**Visor de Exámenes** (resultados de laboratorio):\n• Principal → 10.66.50.47\n• Contingencia → 10.4.59.246:90\n\nSi no puede acceder:\n1. Verifique su conexión de red\n2. Pruebe con la IP directa\n3. Borre caché del navegador\n\nTodos los links están en el **Portal de Enlaces**.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['sigges', 'garantía', 'garantia', 'ges', 'auge'],
        response: '📋 **SIGGES (Gestión de Garantías en Salud):**\n\n• Nuevo SIGGES → nuevo.sigges.cl\n• SIGGES clásico → sigges.cl\n\nSi tiene problemas de acceso:\n1. Verifique su conexión a internet\n2. Pruebe con otro navegador\n3. Si olvidó su clave, use "Recuperar contraseña" en la web\n\nEncuentre los links en el **Portal de Enlaces**.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['licencia', 'imed', 'licencia médica', 'licencia medica'],
        response: '📄 **Imed (Licencias Médicas Electrónicas):**\n\n• Acceso → licencia.cl\n\nSi tiene problemas:\n1. Asegúrese de usar su RUN y clave correcta\n2. Verifique que su certificado digital esté vigente (si aplica)\n3. Pruebe con otro navegador\n\nPara más herramientas, visite el **Portal de Enlaces**.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['fonasa', 'front integrado', 'previsión', 'prevision', 'beneficiario'],
        response: '💚 **FONASA:**\n\n• FONASA → fonasa.cl\n• Front Integrado → frontintegrado.fonasa.cl\n\nSi tiene problemas de acceso, verifique su conexión e intente con otro navegador.\n\nTodos los links están en el **Portal de Enlaces**.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['intranet', 'comunicación', 'comunicacion', 'interno', 'comunicado'],
        response: '📢 **Intranet (Comunicación Institucional):**\n\n• Acceso → intranetlaunion.smc.cl\n\nSi no puede acceder:\n1. Solicite sus credenciales a TI\n2. Verifique su conexión a internet\n3. Pruebe con otro navegador',
        quickReplies: ['Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['isatec', 'soporte isatec', 'portal isatec', 'ticket isatec'],
        response: '🔧 **Isatec (Soporte Técnico Externo):**\n\n• Portal de clientes → clientes.isatec.cl\n\nPara incidentes internos del CESFAM, use este formulario de reporte. Para temas de Isatec, acceda a su portal directamente.',
        quickReplies: ['Llenar formulario', 'Portal de Enlaces', 'Otro problema']
    },
    {
        keywords: ['vpn', 'remoto', 'teletrabajo', 'casa', 'acceso remoto', 'conexión remota', 'conexion remota'],
        response: '🔒 **Acceso remoto / VPN:**\n\n1. Verifique que su internet de casa funcione\n2. Abra la aplicación VPN y conéctese\n3. Use las credenciales institucionales\n4. Si la VPN se desconecta, reinicie la aplicación\n\n💡 Con VPN activa puede acceder al RAS por IP directa.\n\nSi necesita habilitación de VPN, envíe un reporte.',
        quickReplies: ['RAS por IP', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['teléfono', 'telefono', 'fono', 'anexo', 'llamada', 'no suena', 'sin tono'],
        response: '📞 **Problemas de telefonía:**\n\n1. Verifique que el teléfono esté conectado\n2. Levante el auricular y compruebe tono\n3. Si es IP, verifique el cable de red\n4. Revise que el volumen del timbre no esté en silencio\n\nPara solicitar cambio de anexo o reparación, complete el formulario.',
        quickReplies: ['Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['portal', 'enlaces', 'links', 'sitios', 'páginas', 'paginas', 'herramientas', 'sistemas', 'plataformas'],
        response: '🔗 **Portal de Enlaces del CESFAM:**\n\nTodos los sistemas y herramientas del CESFAM están disponibles en:\n👉 **cesfamlu.github.io/links**\n\nAhí encontrará acceso rápido a:\n• RAS (principal, contingencia e IPs)\n• CORE y Visor de Exámenes\n• SIGGES, FONASA, Imed\n• Intranet, BloqueApp, BOT SOME\n• Hospital Digital, DART, Epivigilia\n• Y mucho más\n\nTambién puede acceder desde el botón **"Portal de Enlaces"** en la barra superior.',
        quickReplies: ['RAS', 'CORE', 'SIGGES', 'Otro problema']
    },
    {
        keywords: ['bloque', 'bloqueapp', 'agenda', 'hora', 'bloqueo de agenda'],
        response: '📅 **BloqueApp (Gestión de Bloqueos de Agenda):**\n\n• Acceso → cesfamtic.com/BloqueAPP/login.html\n\nSi tiene problemas de acceso, solicite sus credenciales a TI.\nEncuentre todos los links en el **Portal de Enlaces**.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['some', 'bot some', 'bot de some'],
        response: '🤖 **BOT SOME:**\n\n• Acceso → bot.desamlu.cl/login.php\n\nSi tiene problemas de acceso, solicite sus credenciales.\nPara temas de SOME contacte: some@munilaunion.cl',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['derivación', 'derivacion', 'derivar', 'interconsulta'],
        response: '📋 **Datos de Derivación:**\n\n• Plataforma → cesfamlu.github.io/DerivacionDatos\n• Hospital Digital (interconsultas) → interconsulta.minsal.cl\n\nAhí encontrará datos útiles para completar las derivaciones correctamente.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['isis', 'radiología', 'radiologia', 'imagen', 'rayos', 'rayo'],
        response: '📷 **Isis View (Imágenes Médicas y Radiología):**\n\n• Acceso → 10.6.67.166 (solo red interna)\n\nEste sistema solo funciona dentro de la red del CESFAM. Si no puede acceder, verifique su conexión de red.',
        quickReplies: ['Llenar formulario', 'Portal de Enlaces', 'Otro problema']
    },
    {
        keywords: ['dart', 'oftalmología', 'oftalmologia', 'retino', 'retinopatía', 'retinopatia', 'teleoftalmología', 'teleoftalmologia'],
        response: '👁️ **DART (Teleoftalmología):**\n\n• Acceso → teleoftalmologia.minsal.cl\n\nPlataforma del MINSAL para retinopatía diabética. Si tiene problemas de acceso, verifique su conexión a internet y credenciales.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['receta', 'prescripción', 'prescripcion', 'medicamento', 'remedio'],
        response: '💊 **Prescripción de Receta MINSAL:**\n\n• Acceso → prescripcion-receta.minsal.cl\n\nSi tiene problemas de acceso, verifique su conexión a internet e intente con otro navegador.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['chile crece', 'crece contigo', 'desarrollo infantil'],
        response: '👶 **Chile Crece Contigo:**\n\n• Acceso → srdm.crececontigo.gob.cl\n\nPrograma de desarrollo infantil temprano. Si tiene problemas de acceso, verifique su conexión e intente con otro navegador.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['epivigilia', 'epivigila', 'vigilancia', 'epidemiología', 'epidemiologia', 'brote'],
        response: '🦠 **Epivigilia (Vigilancia Epidemiológica):**\n\n• Acceso → epivigila.minsal.cl\n\nPlataforma del MINSAL para notificación y seguimiento epidemiológico. Si tiene problemas, verifique su conexión a internet y credenciales.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    },
    {
        keywords: ['survih', 'vih', 'sida'],
        response: '🔬 **SURVIH (Sistema de Registro Único de VIH):**\n\n• Acceso → survih.minsal.cl\n\nSistema del MINSAL para registro de VIH. Si tiene problemas de acceso, verifique su conexión y credenciales.',
        quickReplies: ['Portal de Enlaces', 'Llenar formulario', 'Otro problema']
    }
];

// Match user input to knowledge base
function findBestMatch(input) {
    const normalized = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of knowledgeBase) {
        let score = 0;
        for (const kw of entry.keywords) {
            const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalized.includes(kwNorm)) {
                score += kwNorm.length;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entry;
        }
    }

    return bestScore > 0 ? bestMatch : null;
}

// Add message to chat
function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    chatMsgs.appendChild(msg);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

// Show typing indicator
function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing-dots';
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatMsgs.appendChild(typing);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function removeTyping() {
    const t = document.getElementById('typing-dots');
    if (t) t.remove();
}

// Set quick reply buttons
function setQuickReplies(replies) {
    chatQR.innerHTML = '';
    if (!replies || replies.length === 0) return;
    replies.forEach(text => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = text;
        btn.addEventListener('click', () => handleUserInput(text));
        chatQR.appendChild(btn);
    });
}

// Handle user input
function handleUserInput(text) {
    if (!text.trim()) return;

    addMessage(text, 'user');
    chatInput.value = '';
    chatQR.innerHTML = '';

    // Special action: fill form
    if (text.toLowerCase().includes('llenar formulario') || text.toLowerCase().includes('completar formulario')) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('¡Perfecto! Te llevo al formulario. Recuerda completar todos los campos con asterisco (*). Describe el problema con el mayor detalle posible para que podamos ayudarte más rápido. 📝', 'bot');
            setQuickReplies(['Gracias', 'Otra consulta']);

            document.getElementById('nombre').scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => document.getElementById('nombre').focus(), 600);
        }, 800);
        return;
    }

    // Special: RAS por IP
    if (/ras\s*(por\s*)?ip/i.test(text.trim()) || text.trim().toLowerCase() === 'ras lento') {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('🏥 **Servidores RAS por IP directa:**\n\n• IP 1 → **10.8.102.72**\n• IP 2 → **10.8.102.74**\n• IP 3 → **10.8.102.104**\n• Contingencia → contingencia.rasvaldivia.cl\n\n💡 Copie la IP en la barra del navegador. Si ninguna funciona, puede ser un problema de red general.', 'bot');
            setQuickReplies(['Sigue sin funcionar', 'Llenar formulario', 'Otro problema']);
        }, 700);
        return;
    }

    // Special: Portal de Enlaces
    if (/portal\s*de\s*enlaces/i.test(text.trim())) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('🔗 **Portal de Enlaces del CESFAM:**\n\n👉 **cesfamlu.github.io/links**\n\nAhí encontrará todos los sistemas:\n• RAS, CORE, Visor de Exámenes\n• SIGGES, FONASA, Imed\n• BloqueApp, BOT SOME, Intranet\n• Hospital Digital, DART, y más\n\nTambién puede acceder desde el botón "Portal de Enlaces" en la barra de navegación.', 'bot');
            setQuickReplies(['RAS', 'CORE', 'SIGGES', 'Otro problema']);
        }, 600);
        return;
    }

    // Special: Sigue sin funcionar
    if (/sigue sin funcionar|no funciona a[uú]n|ya lo intent[eé]/i.test(text.trim())) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('😓 Lamento que no se haya solucionado. Te recomiendo enviar un **reporte formal** a través del formulario para que nuestro equipo de TI pueda asistirte directamente.\n\nRecuerda incluir:\n• Descripción detallada del problema\n• Qué pasos ya intentaste\n• Tu área y datos de contacto', 'bot');
            setQuickReplies(['Llenar formulario', 'Otra consulta']);
        }, 700);
        return;
    }

    // Special: greetings
    if (/^(hola|buenas|buen[oa]s?\s*(días|tardes|noches|dia)|hey|hi|qué tal|que tal|saludos)/i.test(text.trim())) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('¡Hola! 👋 Soy el asistente de TI del CESFAM. ¿En qué puedo ayudarte hoy?', 'bot');
            setQuickReplies(['Internet', 'Impresora', 'Contraseña', 'PC lento', 'RAS', 'Portal de Enlaces']);
        }, 600);
        return;
    }

    // Special: thanks
    if (/^(gracias|muchas gracias|thanks|genial|perfecto|excelente|ok|dale|buena)/i.test(text.trim())) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('¡De nada! 😊 Si necesitas algo más, no dudes en preguntar. Estoy aquí para ayudar.', 'bot');
            setQuickReplies(['Otra consulta', 'Llenar formulario']);
        }, 500);
        return;
    }

    // Special: another query
    if (/otra\s*consulta|otro\s*problema|volver|menu|menú/i.test(text.trim())) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            addMessage('Claro, ¿en qué más puedo ayudarte? Selecciona una categoría o escribe tu problema:', 'bot');
            setQuickReplies(['Internet', 'Impresora', 'RAS', 'PC lento', 'Correo', 'SIGGES', 'Portal de Enlaces', 'Teléfono']);
        }, 500);
        return;
    }

    // ---- AI-First Strategy ----
    const inputLower = text.trim().toLowerCase();
    const isQuickReply = knowledgeBase.some(entry =>
        entry.keywords.some(kw => kw.toLowerCase() === inputLower)
    );

    if (isQuickReply) {
        const match = findBestMatch(text);
        if (match) {
            showTyping();
            const delay = 400 + Math.random() * 300;
            setTimeout(() => {
                removeTyping();
                addMessage(match.response, 'bot');
                setQuickReplies(match.quickReplies);
            }, delay);
            return;
        }
    }

    // Everything else → Groq AI
    showTyping();
    askAI(text).then(aiResponse => {
        removeTyping();
        addMessage(aiResponse, 'bot');
        setQuickReplies(['Portal de Enlaces', 'Llenar formulario', 'Otra consulta']);
    });
}

// Toggle chat window
chatFab.addEventListener('click', () => {
    chatOpen = !chatOpen;
    if (chatOpen) {
        chatWindow.classList.add('open');
        fabIconChat.style.display = 'none';
        fabIconClose.style.display = 'block';
        fabBadge.classList.add('hidden');
        chatInput.focus();

        if (firstOpen) {
            firstOpen = false;
            setTimeout(() => {
                addMessage('¡Hola! 👋 Soy el **Asistente de TI** del CESFAM. Antes de enviar un reporte, quizás pueda ayudarte a resolver tu problema.\n\n¿Qué tipo de incidente tienes?', 'bot');
                setQuickReplies(['Internet', 'Impresora', 'RAS', 'PC lento', 'Correo', 'Portal de Enlaces', 'Otro problema']);
            }, 400);
        }
    } else {
        chatWindow.classList.remove('open');
        fabIconChat.style.display = 'block';
        fabIconClose.style.display = 'none';
    }
});

// Send on button click
chatSend.addEventListener('click', () => {
    handleUserInput(chatInput.value);
});

// Send on Enter
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleUserInput(chatInput.value);
    }
});
