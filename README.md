
Examen parcial GuaguaTime RD — Simulador de rutas y costos del transporte público 
Construir una aplicación web responsive que permita a un usuario: 
1. elegir origen y destino entre barrios/sectores dominicanos, 
2. obtener posibles rutas (concho, guagua, carro público, motoconcho) con tiempos y costos estimados,
3. comparar rutas y guardar favoritas en el dispositivo,
4. visualizar alertas (lluvia, hora pico, paro) que afecten las estimaciones.
5. La app debe funcionar 100% en el navegador, sin frameworks ni backends externos. Todos los datos provienen de archivos locales .json que ustedes integrarán.
  
Extras (para puntos bonus):
Modo oscuro con prefers-color-scheme. 
Mini-mapa esquemático (SVG simple, no librerías) de nodos (paradas) y líneas. 
PWA ligera: manifest y service worker para cachear index.html, CSS, JS y JSON.
Perfil de datos: “modo ahorro” que reduce imágenes/animaciones. 
i18n básico (ES/EN) usando un diccionario JSON.

Requisitos técnicos:
HTML5 semántico (header/nav/main/section/article/footer), formularios accesibles. 
CSS: Grid/Flex, variables CSS,BEM u otra convención clara. Sin frameworks. 
JavaScript: módulos ES6, fetch para cargar JSON, clases o funciones puras para cálculos, validación de formularios, debounce en búsquedas, localStorage.
Rendimiento: Lighthouse y en Accessibility (modo Desktop).

Reglas de cálculo (deterministas, documentarlas en la app): 
Tiempo base de ruta = suma tiempo_min de tramos. 
Por cada condición activa: tiempo = tiempo * (1 + tiempo_pct/100). Redondear al minuto. 
Costo total = suma de costo + suma de costo_extra de condiciones. 
Ranking: por defecto ordena por tiempo total; el usuario puede alternar a costo o transbordos. 

Restricciones de la competición:
Sin frameworks JS/CSS (no React/Vue/Angular/Bootstrap/Tailwind). 
Librerías permitidas: ninguna para JS; solo SVG/CSS/JS propios. 
