 <Sscript type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
    import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

    
    const firebaseConfig = {
      apiKey: "AIzaSyBPxvqvNfHKE1YJe4h6UwHznY4jsZMiJ0A", 
      authDomain: "reportes-cesfam.firebaseapp.com",
      databaseURL: "https://reportes-cesfam-default-rtdb.firebaseio.com",
      projectId: "reportes-cesfam",
      storageBucket: "reportes-cesfam.firebasestorage.app", // Corregido: firebasestorage.app en lugar de firebaseapp.com
      messagingSenderId: "101243881563",
      appId: "1:101243881563:web:793a5a48ffce80f2a4977e"
    };

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    const googleSheetsURL = "https://script.google.com/macros/s/AKfycbyMeb2xZf0wy6rtTkLezBVsRJh7ElyIxBAZgjJBkRzsy8uLXHCwV_5SRZ8NqsBwYyU7/exec";
    
    const nombreInput = document.getElementById('nombre');
    const areaInput = document.getElementById('area');
    const problemaInput = document.getElementById('problema');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const bodyElement = document.body;
    const formLogoImg = document.getElementById('form-logo-main'); 
    const fechaInput = document.getElementById('fecha'); 
    
    // Usar placeholders para los logos
    const lightModeLogo = "img/CESFAM.png"; 
    const darkModeLogo = "img/CESFAM_BLANCO.png";


    function setTema(tema) {
        const themeIcon = themeToggleButton.querySelector('i');
        if (tema === 'light') {
            bodyElement.classList.add('light-mode');
            if (themeIcon) themeIcon.className = 'ph ph-moon';
            if (formLogoImg) formLogoImg.src = lightModeLogo; 
            localStorage.setItem('themePreference', 'light');
        } else {
            bodyElement.classList.remove('light-mode');
            if (themeIcon) themeIcon.className = 'ph ph-sun';
            if (formLogoImg) formLogoImg.src = darkModeLogo; 
            localStorage.setItem('themePreference', 'dark');
        }
    }

    themeToggleButton.addEventListener('click', () => {
        if (bodyElement.classList.contains('light-mode')) {
            setTema('dark');
        } else {
            setTema('light');
        }
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
    
    // Establecer la fecha mínima para el input de fecha al día actual
    const todayForMin = new Date();
    const yyyy = todayForMin.getFullYear();
    const mm = String(todayForMin.getMonth() + 1).padStart(2, '0'); 
    const dd = String(todayForMin.getDate()).padStart(2, '0');
    if(fechaInput) fechaInput.min = `${yyyy}-${mm}-${dd}`;

    const formulario = document.getElementById('formulario');
    if (formulario) {
        formulario.addEventListener('submit', async function(e) {
        e.preventDefault(); 

        const nombre = nombreInput.value.trim();
        const contacto = document.getElementById('contacto').value.trim();
        const area = areaInput.value;
        const fecha = fechaInput.value; 
        const problema = problemaInput.value.trim();
        const confirmacion = document.getElementById('confirmacion').checked;
        const respuesta = document.getElementById('respuesta'); 
        
        let errores = []; 

        if (nombre.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
          errores.push("⚠️ El nombre debe contener al menos 3 caracteres y solo letras.");
        }
        if (contacto && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(contacto) && !/^\+?\d{8,15}$/.test(contacto)) {
            errores.push("⚠️ Si ingresa un contacto, debe ser un correo válido o un número de teléfono válido (ej: +56912345678 o 912345678).");
        }
        if (!area) {
          errores.push("⚠️ Debes seleccionar un departamento o área.");
        }
        
        const fechaIngresadaValue = fecha; 
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); 

        if (!fechaIngresadaValue) {
          errores.push("⚠️ Por favor, ingresa una fecha válida para el incidente.");
        } else {
          const partesFecha = fechaIngresadaValue.split("-"); 
          const anio = parseInt(partesFecha[0], 10);
          const mes = parseInt(partesFecha[1], 10) - 1; 
          const dia = parseInt(partesFecha[2], 10);
          const fechaIngresadaObj = new Date(anio, mes, dia);
          
          if (fechaIngresadaObj < hoy) { 
            errores.push("⚠️ La fecha del incidente no puede ser anterior a hoy.");
          }
        }

        if (problema.length < 10) { 
          errores.push("⚠️ La descripción del problema debe tener al menos 10 caracteres.");
        }
        if (!confirmacion) {
          errores.push("⚠️ Debes confirmar la veracidad de los datos.");
        }

        if (errores.length > 0) {
          respuesta.innerHTML = errores.join("<br>");
          respuesta.className = 'text-center mt-4 text-danger'; 
        } else {
          respuesta.innerHTML = "✅ Reporte enviado con éxito. Procesando...";
          respuesta.className = 'text-center mt-4 text-success'; 
          document.getElementById('btnEnviarReporte').disabled = true;
          document.getElementById('btnEnviarReporte').classList.add('btn-spinner');
          
          const datosReporte = { 
              nombre: nombre, 
              contacto: contacto, 
              area: area, 
              fecha: fecha, 
              problema: problema, 
              confirmacion: confirmacion,
              timestamp: new Date().toISOString()
          };
          
          try {
              await push(ref(database, 'reportes/'), datosReporte);
              console.log("Datos enviados a Firebase exitosamente.");
          } catch (error) {
              console.error("Error al enviar datos a Firebase:", error);
              respuesta.innerHTML = "❌ Error crítico al guardar en Firebase. Contacte a soporte.";
              respuesta.className = 'text-center mt-4 text-danger';
              document.getElementById('btnEnviarReporte').disabled = false;
              document.getElementById('btnEnviarReporte').classList.remove('btn-spinner');
              return; 
          }
          
          try {
              const datosParaSheets = new FormData();
              datosParaSheets.append('nombre', nombre);
              datosParaSheets.append('contacto', contacto);
              datosParaSheets.append('area', area);
              datosParaSheets.append('fecha', fecha);
              datosParaSheets.append('problema', problema);
              datosParaSheets.append('timestamp', new Date().toISOString());

              const response = await fetch(googleSheetsURL, {
                  method: "POST",
                  body: datosParaSheets 
              });
              
              const responseText = await response.text(); 
              console.log("Respuesta de Google Sheets (texto):", responseText);

              if (!response.ok) {
                  console.error(`Error en Google Sheets: ${response.status} ${response.statusText}. Respuesta: ${responseText}`);
              }
          } catch (error) {
              let gsErrorMessage = "Error desconocido al enviar a Google Sheets.";
              if (error instanceof Error) {
                  gsErrorMessage = error.message;
              } else if (typeof error === 'string') {
                  gsErrorMessage = error;
              }
              console.error("Error de red/fetch al enviar a Google Sheets:", gsErrorMessage, error.stack || error);
          }

          respuesta.innerHTML = "✅ Reporte enviado y procesado con éxito. Gracias por su colaboración.";
          formulario.reset(); 
          setTimeout(() => {
              respuesta.innerHTML = "";
              respuesta.className = 'text-center mt-4'; 
              document.getElementById('btnEnviarReporte').disabled = false;
              document.getElementById('btnEnviarReporte').classList.remove('btn-spinner');
          }, 8000); 
        }
      });
    }
  
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
  </script>
