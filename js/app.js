let SECTORES = [];
let RUTAS = [];
let CONDICIONES = [];
let I18N = {};

async function cargarDatos() {
  try {
    const [sec, rut, cond, i18n] = await Promise.all([
      fetch('./data/sectores.json').then(r => r.json()),
      fetch('./data/rutas.json').then(r => r.json()),
      fetch('./data/condiciones.json').then(r => r.json()),
      fetch('./data/i18n.json').then(r => r.json())
    ]);

    SECTORES = sec;
    RUTAS = rut;
    CONDICIONES = cond;
    I18N = i18n;

  } catch (e) {
    console.error("Error cargando datos:", e);
  }
}

const ICONOS = {guagua:"🚌",concho:"🚕",carro_publico:"🚗",motoconcho:"🏍️"};
let idioma    = localStorage.getItem("gt_idioma") || "es";
let tema      = localStorage.getItem("gt_tema")   || "auto";
let ahorro    = localStorage.getItem("gt_ahorro") === "true";
let favoritos = JSON.parse(localStorage.getItem("gt_favoritos") || "[]");

function t(k){ return (I18N[idioma]||I18N.es)[k]||k; }

function debounce(fn,ms){ let timer; return (...a)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...a),ms);}; }

function aplicarTema(nuevo){
  tema = nuevo;
  localStorage.setItem("gt_tema", tema);
  const ef = tema==="auto"?(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"):tema;
  document.documentElement.dataset.tema = ef;
  const btn = document.getElementById("btn-tema");
  if(ef==="dark"){btn.textContent="☀️ Claro"; btn.classList.add("btn-sm--on");}
  else           {btn.textContent="🌙 Oscuro"; btn.classList.remove("btn-sm--on");}
}

function aplicarAhorro(val){
  ahorro = val;
  localStorage.setItem("gt_ahorro", ahorro);
  document.documentElement.dataset.ahorro = ahorro;
  document.getElementById("btn-ahorro").classList.toggle("btn-sm--on", ahorro);
}

function llenarSelectores(){
  ["origen","destino"].forEach(id=>{
    const sel=document.getElementById(id), val=sel.value;
    const ph=id==="origen"?"Selecciona origen...":"Selecciona destino...";
    sel.innerHTML=`<option value="">${ph}</option>`+SECTORES.map(s=>`<option value="${s}"${s===val?" selected":""}>${s}</option>`).join("");
  });
  const ord=document.getElementById("ordenar");
  ord.options[0].text=idioma==="en"?"Fastest":"Menor tiempo";
  ord.options[1].text=idioma==="en"?"Cheapest":"Menor costo";
  ord.options[2].text=idioma==="en"?"Fewest transfers":"Menos transbordos";
}

function calcular(tipo, ruta, condActivas){
  let tiempo=tipo.tiempo_min, costoBase=tipo.costo, costoTransbordo=0, detTransbordo="";
  if(ruta.transbordo){ costoTransbordo=(ruta.transbordo.costo_extra||{})[tipo.tipo]||0; detTransbordo=ruta.transbordo.detalle; }
  let costoCondiciones=0;
  condActivas.forEach(c=>{ tiempo=tiempo*(1+c.tiempo_pct/100); costoCondiciones+=(c.costo_extra?.[tipo.tipo]||0); });
  return {tipo:tipo.tipo, tiempo:Math.round(tiempo), costoBase, costoTransbordo, costoCondiciones,
          costoTotal:costoBase+costoTransbordo+costoCondiciones, esDirecta:!ruta.transbordo, detTransbordo};
}

function renderAlertas(condActivas){
  document.getElementById("alertas").innerHTML=condActivas
    .map(c=>`<div class="alerta al-${c.nombre}">${c.etiqueta} — +${c.tiempo_pct}% tiempo</div>`).join("");
}

function renderResultados(lista, origen, destino){
  const el=document.getElementById("resultados");
  if(!lista.length){ el.innerHTML=`<p class="placeholder">${t("sin_rutas")}</p>`; return; }
  el.innerHTML=lista.map(e=>{
    const key=`${e.tipo}|${origen}|${destino}`;
    const guardado=favoritos.some(f=>f.key===key);
    let det="";
    if(e.costoTransbordo>0) det+=`<span>Transbordo: RD$${e.costoTransbordo} — ${e.detTransbordo}</span>`;
    if(e.costoCondiciones>0) det+=`<span>Extra condiciones: +RD$${e.costoCondiciones}</span>`;
    if(!det) det=`<span>Sin cargos extra</span>`;
    return `
    <article class="tarjeta t-${e.tipo}">
      <div class="tarjeta__top">
        <span class="tarjeta__tipo">${ICONOS[e.tipo]||""} ${t(e.tipo)}</span>
        <span class="badge ${e.esDirecta?"b-directo":"b-transbordo"}">${e.esDirecta?t("directo"):t("transbordo")}</span>
      </div>
      <div class="tarjeta__datos">
        <div class="dato"><span class="dato__val">${e.tiempo}</span><span class="dato__lab">${t("min")}</span></div>
        <div class="dato"><span class="dato__val">RD$${e.costoTotal}</span><span class="dato__lab">total</span></div>
        <div class="dato"><span class="dato__val">RD$${e.costoBase}</span><span class="dato__lab">base</span></div>
      </div>
      <div class="tarjeta__det">${det}</div>
      <div class="tarjeta__acc">
        <button class="btn-fav ${guardado?"btn-fav--on":""}" data-key="${key}"
          onclick="guardarFav({key:'${key}',tipo:'${e.tipo}',origen:'${origen}',destino:'${destino}',tiempo:${e.tiempo},costoTotal:${e.costoTotal}})">
          ${guardado?"★ Guardado":"☆ Guardar"}
        </button>
      </div>
    </article>`; }).join("");
}

function renderFavoritos(){
  const el=document.getElementById("fav-lista");
  if(!favoritos.length){ el.innerHTML=`<p class="placeholder">${t("sin_fav")}</p>`; return; }
  el.innerHTML=favoritos.map(f=>`
    <div class="fav-item">
      <div class="fav-item__info">
        <span class="fav-item__ruta">${ICONOS[f.tipo]||""} ${f.origen} → ${f.destino}</span>
        <span class="fav-item__meta">${t(f.tipo)} · ${f.tiempo} min · RD$${f.costoTotal}</span>
      </div>
      <button class="btn-elim" onclick="eliminarFav('${f.key}')">Eliminar</button>
    </div>`).join("");
}

function guardarFav(item){
  if(favoritos.some(f=>f.key===item.key)) return;
  favoritos.push(item);
  localStorage.setItem("gt_favoritos",JSON.stringify(favoritos));
  renderFavoritos();
  const btn=document.querySelector(`[data-key="${item.key}"]`);
  if(btn){btn.textContent="★ Guardado";btn.classList.add("btn-fav--on");}
}

function eliminarFav(key){
  favoritos=favoritos.filter(f=>f.key!==key);
  localStorage.setItem("gt_favoritos",JSON.stringify(favoritos));
  renderFavoritos();
}

const NODOS = {
  "Alma Rosa":[100,200],
  "Los Tres Ojos":[200,250],
  "Los Prados":[350,150],
  "Evaristo Morales":[400,100],
  "Sabana Perdida":[500,50],
  "Haina":[50,300]
};

function renderMapa(origenA, destinoA){
  const W=610,H=390;
  let lineas="",puntos="";
  RUTAS.forEach(r=>{
    const a=NODOS[r.origen],b=NODOS[r.destino];
    if(!a||!b) return;
    const activa=r.origen===origenA&&r.destino===destinoA;
    lineas+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${activa?"#1a56db":"#94a3b8"}" stroke-width="${activa?2.5:1.2}" stroke-dasharray="${activa?"":"4 3"}" opacity="${activa?1:0.5}"/>`;
  });
  Object.entries(NODOS).forEach(([n,[x,y]])=>{
    const esO=n===origenA,esD=n===destinoA,r=esO||esD?8:5;
    const fill=esO?"#16a34a":esD?"#dc2626":"#1a56db";
    puntos+=`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="white" stroke-width="1.5"/><text x="${x}" y="${y-11}" text-anchor="middle" font-size="8.5" fill="var(--txt)" font-weight="${esO||esD?700:400}">${n}</text>`;
  });
  document.getElementById("mapa-svg").innerHTML=`
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-height:310px" role="img" aria-label="Mapa de red de transporte">
      <rect width="${W}" height="${H}" fill="var(--bg)" rx="6"/>
      ${lineas}${puntos}
      <circle cx="14" cy="${H-14}" r="5" fill="#16a34a"/><text x="22" y="${H-10}" font-size="8" fill="var(--txt2)">Origen</text>
      <circle cx="65" cy="${H-14}" r="5" fill="#dc2626"/><text x="73" y="${H-10}" font-size="8" fill="var(--txt2)">Destino</text>
      <line x1="118" y1="${H-14}" x2="138" y2="${H-14}" stroke="#1a56db" stroke-width="2.5"/><text x="142" y="${H-10}" font-size="8" fill="var(--txt2)">Ruta activa</text>
    </svg>`;
}

function onSubmit(e){
  e.preventDefault();
  const origen=document.getElementById("origen").value;
  const destino=document.getElementById("destino").value;
  if(!origen||!destino) return;
  if(origen===destino){ alert(t("alerta_igual")); return; }

  const condActivas=[];
  document.querySelectorAll("input[name=condicion]:checked").forEach(cb=>{
    const c=CONDICIONES.find(x=>x.nombre===cb.value);
    if(c) condActivas.push(c);
  });

  renderAlertas(condActivas);

  const caminosHallados=RUTAS.filter(r=>r.origen===origen&&r.destino===destino);
  let lista=[];
  caminosHallados.forEach(ruta=>ruta.tipos.forEach(tipo=>lista.push(calcular(tipo,ruta,condActivas))));

  const criterio=document.getElementById("ordenar").value;
  lista.sort((a,b)=>{
    if(criterio==="transbordos"){ if(a.esDirecta&&!b.esDirecta)return -1; if(!a.esDirecta&&b.esDirecta)return 1; return 0; }
    return a[criterio]-b[criterio];
  });

  renderResultados(lista,origen,destino);
  renderMapa(origen,destino);
}

window.addEventListener("DOMContentLoaded", async () => {

  await cargarDatos();

  llenarSelectores();
  aplicarTema(tema);
  aplicarAhorro(ahorro);
  renderFavoritos();
  renderMapa("","");

  document.getElementById("formulario-ruta").addEventListener("submit",onSubmit);

  document.getElementById("btn-tema").addEventListener("click",()=>{
    const ef=document.documentElement.dataset.tema;
    aplicarTema(ef==="dark"?"light":"dark");
  });

  document.getElementById("btn-ahorro").addEventListener("click",()=>aplicarAhorro(!ahorro));

  document.getElementById("btn-idioma").addEventListener("click",()=>{
    idioma=idioma==="es"?"en":"es";
    localStorage.setItem("gt_idioma",idioma);
    document.getElementById("btn-idioma").textContent=t("btn_idioma");
    llenarSelectores();
    renderFavoritos();
  });

   window.guardarFav = guardarFav;
   window.eliminarFav = eliminarFav;

});