'use strict';
const K='minha-rotina-v1',$=s=>document.querySelector(s),PL={alta:'Alta',media:'Média',baixa:'Baixa'};
const DC=['Pessoal','Casa','Trabalho','Estudos','Saúde','Finanças','Outros'];
const GS={nao:'Não iniciada',and:'Em andamento',conc:'Concluída'},RT={none:'Não repete',daily:'Todos os dias',weekdays:'Dias da semana',weekly:'Semanalmente',monthly:'Mensalmente'};
const blank=()=>({tasks:[],goals:[],notes:[],cats:[...DC],rev:{},cfg:{name:'',hd:false}});
function norm(s){const b=blank();for(const k in b)if(!s[k]||Array.isArray(s[k])!==Array.isArray(b[k]))s[k]=b[k];return s}
let S=(()=>{try{const s=JSON.parse(localStorage.getItem(K));if(s&&Array.isArray(s.tasks))return norm(s)}catch(e){}return blank()})();
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){toast('Não foi possível salvar: armazenamento bloqueado ou cheio.')}};
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const add=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ymd(d)},today=()=>ymd(new Date());
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmt=(s,o)=>pd(s).toLocaleDateString('pt-BR',o||{weekday:'short',day:'2-digit',month:'short'});
const V={tab:'dia',date:today(),pm:'dia',f:{},nq:''};let NOTE=null,W=null,IP=null;
const NT=JSON.parse(sessionStorage.getItem('nt')||'[]');

/* ---- ocorrências ---- */
function hits(t,d){if(t.canceled||(t.skip&&t.skip[d]))return false;const r=t.rec||{type:'none'};
 if(r.type==='none'||!r.type)return t.date===d;if(d<t.date)return false;if(r.end&&d>r.end)return false;
 const dt=pd(d),st=pd(t.date);
 if(r.type==='daily')return true;if(r.type==='weekdays')return(r.days||[]).includes(dt.getDay());
 if(r.type==='weekly')return dt.getDay()===st.getDay();
 if(r.type==='monthly')return dt.getDate()===Math.min(st.getDate(),new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate());return false}
const isDone=(t,d)=>!!(t.comp&&t.comp[d]);
const byTime=(a,b)=>(a.t.time||'99:99').localeCompare(b.t.time||'99:99');
const occ=d=>S.tasks.filter(t=>hits(t,d)).map(t=>({t,d,done:isDone(t,d)})).sort(byTime);
const isL=x=>!isDone(x.t,x.d)&&(x.d<today()||(x.t.due&&x.t.due<today()));
const stOf=x=>isDone(x.t,x.d)?'concluida':isL(x)?'atrasada':'pendente';
function late(){const T=today(),o=[];S.tasks.forEach(t=>{if(t.canceled)return;const r=(t.rec||{}).type||'none';
 if(r==='none'){if((t.date<T||(t.due&&t.due<T))&&!isDone(t,t.date))o.push({t,d:t.date})}
 else for(let i=1;i<=7;i++){const d=add(T,-i);if(hits(t,d)&&!isDone(t,d))o.push({t,d})}});return o.sort((a,b)=>a.d.localeCompare(b.d))}
const mins=t=>{const[h,m]=t.time.split(':').map(Number),n=new Date();return h*60+m-(n.getHours()*60+n.getMinutes())};
const soon=(t,d)=>d===today()&&t.time&&!isDone(t,d)&&mins(t)>=0&&mins(t)<=60;
const gp=g=>g.steps&&g.steps.length?Math.round(g.steps.filter(s=>s.done).length/g.steps.length*100):(g.status==='conc'?100:0);

/* ---- UI helpers ---- */
const stat=(n,l)=>`<div class="stat"><b>${n}</b>${l}</div>`;
const empty=(t,s)=>`<div class="card" style="text-align:center"><p><b>${t}</b></p><p><small>${s}</small></p></div>`;
function toast(m){const t=$('#ts');t.textContent=m;t.hidden=false;clearTimeout(toast.i);toast.i=setTimeout(()=>t.hidden=true,2600)}
const openD=h=>{const d=$('#dlg');d.innerHTML=h;if(!d.open)d.showModal()};
const err=m=>{const e=$('#er');if(e)e.textContent=m};
function item(o){const{t,d}=o,done=isDone(t,d),lt=isL(o),g=S.goals.find(x=>x.id===t.goal);
 return`<div class="card tk p-${t.pri} ${done?'d':''}"><div style="flex:1;min-width:0"><div class="tt"><b>${esc(t.title)}</b></div><div>${t.time?`<span class="tag">⏰ ${t.time}</span>`:''}${d!==today()?`<span class="tag">📅 ${fmt(d)}</span>`:''}<span class="tag">${esc(t.cat)}</span><span class="tag ${t.pri}">${PL[t.pri]}</span>${t.rec&&t.rec.type!=='none'?'<span class="tag">🔁 '+RT[t.rec.type]+'</span>':''}${g?`<span class="tag">🎯 ${esc(g.title)}</span>`:''}${lt?'<span class="tag late">Atrasada</span>':''}${soon(t,d)?'<span class="tag" style="color:var(--y)">Em breve</span>':''}</div>${t.desc?`<small>${esc(t.desc)}</small>`:''}</div><div style="display:grid;gap:6px"><button class="${done?'':'pri'}" data-a="tog" data-id="${t.id}" data-d="${d}">${done?'↩ Desfazer':'✔ Meta batida'}</button><button data-a="edit" data-id="${t.id}" data-d="${d}">Editar</button></div></div>`}

/* ---- views ---- */
const TABS=[['dia','🏠','Meu Dia'],['tarefas','✅','Tarefas'],['plano','📅','Plano'],['metas','🎯','Metas'],['hist','📊','Histórico'],['notas','📝','Notas'],['config','⚙️','Ajustes']];
function mkNav(){$('#nav').innerHTML='<div class="brand"><i>✔</i>Minha Rotina</div>'+TABS.map(([k,i,n],x)=>(x===4?'<div class="mm">':'')+`<button data-a="go" data-v="${k}" class="${V.tab===k?'on':''}" ${V.tab===k?'aria-current="page"':''}><span aria-hidden="true">${i}</span>${n}</button>`+(x===6?'</div>':'')).join('')+'<button id="bm" data-a="more"><span aria-hidden="true">⋯</span>Mais</button>'}
function render(){$('#app').innerHTML=({dia:vDia,tarefas:vTar,plano:vPlano,metas:vMetas,hist:vHist,notas:vNotas,config:vConfig})[V.tab]()}
function vDia(){const T=today(),o=occ(T),dn=o.filter(x=>x.done).length,L=late(),p=o.length?Math.round(dn/o.length*100):0,h=new Date().getHours();
 const gs=S.goals.filter(g=>g.status!=='conc').sort((a,b)=>'alta media baixa'.indexOf(a.pri)-'alta media baixa'.indexOf(b.pri)).slice(0,3);
 const nx=[];for(let i=1;i<=7&&nx.length<5;i++)occ(add(T,i)).forEach(x=>nx.length<5&&nx.push(x));
 const vis=o.filter(x=>!(S.cfg.hd&&x.done));
 return`<div class="hero"><svg class="ring" viewBox="0 0 120 120" role="img" aria-label="Progresso do dia: ${p}%"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#86efac"/><stop offset="1" stop-color="#16a34a"/></linearGradient></defs><circle class="rt" cx="60" cy="60" r="52"/><circle class="rf" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="${(326.7*(1-p/100)).toFixed(1)}"/><text x="60" y="69" text-anchor="middle">${p}%</text></svg><div><small class="date">${fmt(T,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</small><h1>${h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'}${S.cfg.name?', '+esc(S.cfg.name):''}!</h1><p>${o.length?dn+' de '+o.length+' metas batidas hoje':'Planeje seu dia e comece com calma.'}</p></div></div>
<div class="card"><div class="grid">${stat(o.length,'Total')}${stat(dn,'Concluídas')}${stat(o.length-dn,'Pendentes')}${stat(L.length,'Atrasadas')}</div></div>
<div class="row"><button class="pri" data-a="new">+ Nova tarefa</button><button data-a="go" data-v="plano">Planejamento</button><button data-a="go" data-v="notas">Anotações</button><button data-a="rev">Revisar meu dia</button></div>
${gs.length?'<h2>Metas prioritárias</h2>'+gs.map(g=>`<div class="card"><b>${esc(g.title)}</b> <span class="tag">${GS[g.status]}</span><div class="bar"><i style="width:${gp(g)}%"></i></div><small>${gp(g)}%</small></div>`).join(''):''}
<h2>Hoje</h2>${vis.length?vis.map(item).join(''):empty(o.length?'Tudo concluído por aqui 🎉':'Nenhuma tarefa para hoje','Toque em “+ Nova tarefa” para planejar seu dia.')}
${L.length?'<h2 class="late">Atrasadas</h2>'+L.map(item).join(''):''}
${nx.length?'<h2>Próximas tarefas</h2>'+nx.map(item).join(''):''}`}
function listT(){const f=V.f;let L=f.date?occ(f.date):S.tasks.filter(t=>!t.canceled).map(t=>{if(!t.rec||t.rec.type==='none')return{t,d:t.date};for(let i=0;i<60;i++){const d=add(today(),i);if(hits(t,d))return{t,d}}return{t,d:t.date}});
 const q=(f.q||'').toLowerCase();L=L.filter(x=>(!q||(x.t.title+' '+(x.t.desc||'')+' '+(x.t.obs||'')).toLowerCase().includes(q))&&(!f.cat||x.t.cat===f.cat)&&(!f.pri||x.t.pri===f.pri)&&(!f.st||stOf(x)===f.st)).sort((a,b)=>a.d.localeCompare(b.d)||byTime(a,b));
 return L.length?L.map(item).join(''):empty('Nenhuma tarefa encontrada','Ajuste os filtros ou crie uma nova tarefa.')}
function vTar(){const f=V.f,o=(v,x)=>v===x?'selected':'';
 return`<h1>Tarefas</h1><button class="pri" data-a="new">+ Nova tarefa</button><div class="card"><input type="search" data-f="q" placeholder="Buscar por texto" aria-label="Buscar" value="${esc(f.q)}"><div class="row"><select data-f="cat" aria-label="Categoria"><option value="">Todas as categorias</option>${S.cats.map(c=>`<option ${o(f.cat,c)}>${esc(c)}</option>`).join('')}</select><select data-f="pri" aria-label="Prioridade"><option value="">Qualquer prioridade</option>${Object.entries(PL).map(([k,v])=>`<option value="${k}" ${o(f.pri,k)}>${v}</option>`).join('')}</select><select data-f="st" aria-label="Status"><option value="">Qualquer status</option><option value="pendente" ${o(f.st,'pendente')}>Pendente</option><option value="concluida" ${o(f.st,'concluida')}>Concluída</option><option value="atrasada" ${o(f.st,'atrasada')}>Atrasada</option></select><input type="date" data-f="date" value="${f.date||''}" aria-label="Data"></div></div><div id="lst">${listT()}</div>`}
const weekStart=d=>add(d,-((pd(d).getDay()+6)%7));
function daySec(d){const o=occ(d);return`<h2>${fmt(d,{weekday:'long',day:'numeric',month:'long'})}${d===today()?' (hoje)':''}</h2>${o.length?o.map(item).join(''):'<p><small>Sem tarefas neste dia.</small></p>'}<button data-a="new" data-d="${d}">+ Tarefa neste dia</button>`}
function vPlano(){const d=V.date,pm=V.pm,mb=(k,n)=>`<button data-a="pm" data-v="${k}" class="${pm===k?'pri':''}">${n}</button>`;let body,lb;
 if(pm==='dia'){body=daySec(d);lb=fmt(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
 else if(pm==='semana'){const s=weekStart(d);body=[0,1,2,3,4,5,6].map(i=>daySec(add(s,i))).join('');lb=fmt(s)+' – '+fmt(add(s,6))}
 else{const dt=pd(d),y=dt.getFullYear(),m=dt.getMonth(),f=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();let c='';for(let i=0;i<f;i++)c+='<span></span>';
  for(let i=1;i<=n;i++){const k=ymd(new Date(y,m,i)),cnt=occ(k).length;c+=`<button data-a="sel" data-d="${k}" class="${k===d?'sel':''} ${cnt?'dot':''}" aria-label="Dia ${i}, ${cnt} tarefas">${i}${cnt?'<br><small>'+cnt+'</small>':''}</button>`}
  body=`<div class="card"><div class="cal">${['D','S','T','Q','Q','S','S'].map(x=>`<b style="text-align:center">${x}</b>`).join('')}${c}</div></div>`+daySec(d);lb=dt.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}
 return`<h1>Planejamento</h1><div class="row">${mb('dia','Dia')}${mb('semana','Semana')}${mb('mes','Mês')}</div><div class="row"><button data-a="step" data-v="-1" aria-label="Anterior">◀</button><button data-a="tdy">Hoje</button><button data-a="step" data-v="1" aria-label="Próximo">▶</button><input type="date" id="pdi" value="${d}" aria-label="Ir para data"></div><p style="text-align:center"><b>${lb}</b></p>${body}`}
function gcard(g){const p=gp(g),dn=g.status==='conc',n=S.tasks.filter(t=>t.goal===g.id).length,st=g.steps||[],k=st.filter(x=>x.done).length;
 return`<div class="card goal p-${g.pri} ${dn?'ok':''}" data-a="gt" data-id="${g.id}"><button class="chk" data-a="gt" data-id="${g.id}" aria-pressed="${dn}" aria-label="${dn?'Desfazer meta batida':'Marcar como meta batida'}">${dn?'✔':''}</button><div style="flex:1;min-width:0"><b class="gtt">${esc(g.title)}</b><div>${dn?'<span class="tag ok">Meta batida 🎉</span>':`<span class="tag ${g.pri}">${PL[g.pri]}</span>`}${g.status==='and'?'<span class="tag">Em andamento</span>':''}<span class="tag">${esc(g.cat)}</span>${g.due&&!dn?`<span class="tag">Prazo ${fmt(g.due,{day:'2-digit',month:'short'})}</span>`:''}${n?`<span class="tag">${n} tarefa(s)</span>`:''}</div>${g.desc?`<small>${esc(g.desc)}</small>`:''}${st.length?`<div class="bar"><i style="width:${p}%"></i></div><small>${k}/${st.length} etapas • ${p}%</small>`+st.map((x,i)=>`<label data-a="nop" class="step"><input type="checkbox" data-a="gs" data-id="${g.id}" data-i="${i}" ${x.done?'checked':''}>${esc(x.t)}</label>`).join(''):''}</div><button class="ghost" data-a="eg" data-id="${g.id}" aria-label="Editar meta">✎</button></div>`}
function vMetas(){const dn=S.goals.filter(g=>g.status==='conc'),pe=S.goals.filter(g=>g.status!=='conc').sort((a,b)=>'alta media baixa'.indexOf(a.pri)-'alta media baixa'.indexOf(b.pri)),n=S.goals.length,p=n?Math.round(dn.length/n*100):0;
 return`<h1>Metas</h1><form id="qf" class="card"><div class="row" style="margin:0"><input name="title" placeholder="Digite sua meta (ex.: Organizar a casa)" maxlength="120" aria-label="Nova meta" required autocomplete="off"><button class="pri" style="flex:0 0 auto">+ Adicionar</button></div><div class="seg" role="radiogroup" aria-label="Prioridade">${Object.entries(PL).map(([k,v])=>`<label><input type="radio" name="pri" value="${k}" ${k==='media'?'checked':''}><span class="${k}">${v}</span></label>`).join('')}</div></form>
${n?`<div class="card"><div class="row" style="margin:0;align-items:center"><b>${dn.length} de ${n} metas batidas</b><b style="flex:0 0 auto;color:var(--g2)">${p}%</b></div><div class="bar"><i style="width:${p}%"></i></div></div>`:''}
${pe.length?`<h2>A conquistar (${pe.length})</h2>`+pe.map(gcard).join(''):''}${dn.length?`<h2>Conquistadas ✔ (${dn.length})</h2>`+dn.map(gcard).join(''):''}
${n?'<p style="text-align:center"><small>Toque na meta para marcá-la como feita. ✎ abre os detalhes.</small></p>':empty('Nenhuma meta ainda','Digite acima, escolha a prioridade e toque em Adicionar.')}`}
function vHist(){const T=today(),D=[];for(let i=29;i>=0;i--){const d=add(T,-i),o=occ(d);D.push({d,o,n:o.length,k:o.filter(x=>x.done).length})}
 const sum=a=>[a.reduce((s,x)=>s+x.k,0),a.reduce((s,x)=>s+x.n,0)],pc=(k,n)=>n?Math.round(k/n*100)+'%':'—',w=D.slice(-7),M=[];
 for(let i=1;i<=+T.slice(8);i++){const o=occ(T.slice(0,8)+pad(i));M.push({n:o.length,k:o.filter(x=>x.done).length})}
 const[wk,wn]=sum(w),[mk,mn]=sum(M),[tk,tn]=sum(D),hoje=S.tasks.reduce((s,t)=>s+Object.values(t.comp||{}).filter(x=>ymd(new Date(x))===T).length,0);
 let sk=0;for(let i=0;i<400;i++){if(occ(add(T,-i)).some(x=>x.done))sk++;else if(i)break}
 const cc={};D.forEach(x=>x.o.forEach(y=>cc[y.t.cat]=(cc[y.t.cat]||0)+1));const top=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,5),mx=top.length?top[0][1]:1;
 const hist=D.slice(-14).reverse().filter(x=>x.n||S.rev[x.d]);
 return`<h1>Histórico e desempenho</h1><div class="card"><div class="grid">${stat(hoje,'Concluídas hoje')}${stat(sk,'Sequência (dias)')}${stat(D.filter(x=>x.k).length,'Dias produtivos (30d)')}${stat(pc(tk,tn),'Taxa (30 dias)')}</div></div>
<div class="card"><b>Últimos 7 dias</b> — ${wk}/${wn} (${pc(wk,wn)})${w.map(x=>`<div class="row" style="margin:4px 0;align-items:center"><small style="flex:0 0 90px">${fmt(x.d,{weekday:'short',day:'2-digit'})}</small><div class="bar" style="flex:3"><i style="width:${x.n?x.k/x.n*100:0}%"></i></div><small style="flex:0 0 40px">${x.k}/${x.n}</small></div>`).join('')}</div>
<div class="card"><b>Este mês</b> — ${mk} concluídas de ${mn} (${pc(mk,mn)})</div>
<div class="card"><b>Categorias com mais tarefas (30 dias)</b>${top.length?top.map(([c,n])=>`<div>${esc(c)} <small>${n}</small><div class="bar"><i style="width:${n/mx*100}%"></i></div></div>`).join(''):'<p><small>Sem dados ainda.</small></p>'}</div>
<h2>Histórico diário</h2>${hist.length?hist.map(x=>`<div class="card"><b>${fmt(x.d,{weekday:'long',day:'2-digit',month:'long'})}</b> <small>${x.k}/${x.n} concluídas</small>${x.o.map(y=>`<div>${y.done?'✅':'⏳'} ${esc(y.t.title)}</div>`).join('')}${S.rev[x.d]?`<p><small>📝 ${esc(S.rev[x.d])}</small></p>`:''}</div>`).join(''):empty('Sem histórico','Suas tarefas dos dias anteriores aparecerão aqui.')}`}
function notesList(){const q=V.nq.toLowerCase(),L=S.notes.filter(n=>(n.title+' '+n.text).toLowerCase().includes(q)).sort((a,b)=>b.created.localeCompare(a.created));
 return L.length?L.map(n=>`<div class="card"><b>${esc(n.title)||'(sem título)'}</b> <small>${new Date(n.created).toLocaleDateString('pt-BR')}</small><p>${esc(n.text.slice(0,140))}</p><button data-a="en" data-id="${n.id}">Abrir / editar</button></div>`).join(''):empty('Nenhuma nota','Crie uma anotação rápida.')}
const vNotas=()=>`<h1>Anotações</h1><div class="row"><input type="search" id="nq" placeholder="Buscar nas notas" aria-label="Buscar nas notas" value="${esc(V.nq)}"><button class="pri" data-a="nn">+ Nova nota</button></div><div id="nl">${notesList()}</div>`;
function vConfig(){const n='Notification'in window,ps=n?Notification.permission:'indisponível';
 return`<h1>Configurações</h1><form id="cf" class="card"><label for="cn">Seu nome (opcional)</label><input id="cn" name="name" maxlength="40" value="${esc(S.cfg.name)}"><label style="display:flex;gap:8px;align-items:center;color:var(--t)"><input type="checkbox" data-a="hd" ${S.cfg.hd?'checked':''}>Ocultar tarefas concluídas em “Meu Dia”</label><button class="pri" style="margin-top:10px">Salvar</button></form>
<div class="card"><b>Categorias</b>${S.cats.map((c,i)=>`<div class="row" style="margin:4px 0;align-items:center"><span style="flex:3">${esc(c)}</span><button data-a="cren" data-i="${i}">Renomear</button><button class="dan" data-a="cdel" data-i="${i}">Remover</button></div>`).join('')}<button data-a="cadd" style="margin-top:8px">+ Nova categoria</button></div>
<div class="card"><b>Backup</b><p><small>Seus dados ficam apenas neste aparelho (localStorage) e não são enviados a servidores. Eles não sincronizam entre celulares: use o backup para levar os dados.</small></p><div class="row"><button class="pri" data-a="exp">Exportar JSON</button><button data-a="imp">Importar JSON</button></div><input type="file" id="fi" accept="application/json,.json" hidden></div>
<div class="card"><b>Lembretes</b><p><small>Permissão: ${ps}. Os avisos funcionam enquanto o navegador/app permitir execução; sem servidor de push, não há garantia com o app fechado ou em economia de bateria. No iPhone, instale o app na Tela de Início primeiro. Se negar a permissão, ative-a nas configurações do navegador. Tarefas próximas do horário ganham a marca “Em breve”.</small></p>${n&&ps==='default'?'<button data-a="notif">Ativar notificações</button>':''}</div>
<div class="card"><b>Instalar o app</b><p><small>Android/Chrome: menu ⋮ → Instalar aplicativo. iPhone/Safari: Compartilhar → Adicionar à Tela de Início. Computador: ícone de instalar na barra de endereço.</small></p>${IP?'<button data-a="inst">Instalar agora</button>':''}</div>
<div class="card"><b class="dan">Zona de perigo</b><p><button class="dan" data-a="wipe">Apagar todos os dados</button></p></div>`}

/* ---- formulários ---- */
function tform(t,d){const e=!!t;t=t||{date:d,pri:'media',cat:S.cats[0],rec:{type:'none',days:[]}};const r=t.rec||{type:'none',days:[]},sl=(a,b)=>a===b?'selected':'';
 openD(`<form id="tf" data-id="${t.id||''}" data-d="${d||''}"><h2>${e?'Editar':'Nova'} tarefa</h2><p id="er" class="late" role="alert"></p>
<label for="f1">Título *</label><input id="f1" name="title" maxlength="120" value="${esc(t.title)}" required>
<label>Descrição</label><textarea name="desc" rows="2">${esc(t.desc)}</textarea>
<div class="row"><div><label>Data *</label><input type="date" name="date" value="${t.date}" required></div><div><label>Horário</label><input type="time" name="time" value="${t.time||''}"></div></div>
<div class="row"><div><label>Categoria</label><select name="cat">${[...new Set([...S.cats,t.cat])].map(c=>`<option ${sl(c,t.cat)}>${esc(c)}</option>`).join('')}</select></div><div><label>Prioridade</label><select name="pri">${Object.entries(PL).map(([k,v])=>`<option value="${k}" ${sl(k,t.pri)}>${v}</option>`).join('')}</select></div></div>
<div class="row"><div><label>Prazo final</label><input type="date" name="due" value="${t.due||''}"></div><div><label>Lembrete</label><select name="rem">${[['','Sem lembrete'],['0','No horário'],['5','5 min antes'],['15','15 min antes'],['30','30 min antes'],['60','1 h antes']].map(([v,l])=>`<option value="${v}" ${sl(v,t.rem||'')}>${l}</option>`).join('')}</select></div></div>
<label>Meta relacionada</label><select name="goal"><option value="">Nenhuma</option>${S.goals.map(g=>`<option value="${g.id}" ${sl(g.id,t.goal)}>${esc(g.title)}</option>`).join('')}</select>
<label>Recorrência</label><select name="rec">${Object.entries(RT).map(([k,v])=>`<option value="${k}" ${sl(k,r.type)}>${v}</option>`).join('')}</select>
<fieldset id="wd" ${r.type==='weekdays'?'':'hidden'}><legend>Dias</legend>${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((n,i)=>`<label><input type="checkbox" name="wd" value="${i}" ${(r.days||[]).includes(i)?'checked':''}>${n}</label>`).join('')}</fieldset>
<label>Observações</label><textarea name="obs" rows="2">${esc(t.obs)}</textarea>
<div class="row" style="margin-top:14px"><button class="pri">Salvar</button><button type="button" data-a="close">Cancelar</button></div>
${e?`<div class="row"><button type="button" data-a="del" data-id="${t.id}" class="dan">Excluir</button>${r.type!=='none'?`<button type="button" data-a="skip" data-id="${t.id}" data-d="${d}">Pular esta ocorrência</button>`:''}</div>${r.type!=='none'?'<small>Alterar a data muda o início da série.</small>':''}`:''}</form>`)}
function saveTask(f,x){const title=x.title.trim();if(!title)return err('Informe o título da tarefa.');if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date))return err('Informe uma data válida.');
 if(x.due&&x.due<x.date)return err('O prazo não pode ser anterior à data.');const days=[...f.querySelectorAll('[name=wd]:checked')].map(i=>+i.value);
 if(x.rec==='weekdays'&&!days.length)return err('Escolha ao menos um dia da semana.');if(x.rem!==''&&!x.time)return err('Defina um horário para usar o lembrete.');
 let t=f.dataset.id?S.tasks.find(q=>q.id===f.dataset.id):null;if(!t){t={id:uid(),created:new Date().toISOString(),comp:{}};S.tasks.push(t)}
 const old=t.date;if(old&&old!==x.date&&x.rec==='none'&&t.comp&&t.comp[old]){t.comp[x.date]=t.comp[old];delete t.comp[old]}
 Object.assign(t,{title,desc:x.desc.trim(),date:x.date,time:x.time,cat:x.cat,pri:x.pri,due:x.due,goal:x.goal,rem:x.rem,obs:x.obs.trim(),rec:{type:x.rec,days}});
 save();$('#dlg').close();toast('Tarefa salva')}
function gform(g){const e=!!g;g=g||{pri:'media',cat:S.cats[0],status:'nao',start:today(),steps:[]};const sl=(a,b)=>a===b?'selected':'';
 openD(`<form id="gf" data-id="${g.id||''}"><h2>${e?'Editar':'Nova'} meta</h2><p id="er" class="late" role="alert"></p><label>Título *</label><input name="title" maxlength="120" value="${esc(g.title)}" required><label>Prioridade</label><select name="pri">${Object.entries(PL).map(([k,v])=>`<option value="${k}" ${sl(k,g.pri)}>${v}</option>`).join('')}</select><details style="margin-top:10px" ${e?'open':''}><summary>Mais opções</summary><label>Descrição</label><textarea name="desc" rows="2">${esc(g.desc)}</textarea>
<div class="row"><div><label>Início</label><input type="date" name="start" value="${g.start||''}"></div><div><label>Prazo</label><input type="date" name="due" value="${g.due||''}"></div></div>
<label>Categoria</label><select name="cat">${[...new Set([...S.cats,g.cat])].map(c=>`<option ${sl(c,g.cat)}>${esc(c)}</option>`).join('')}</select>
<label>Status (automático quando há etapas)</label><select name="status">${Object.entries(GS).map(([k,v])=>`<option value="${k}" ${sl(k,g.status)}>${v}</option>`).join('')}</select>
<label>Etapas (uma por linha)</label><textarea name="steps" rows="4">${esc((g.steps||[]).map(s=>s.t).join('\n'))}</textarea></details>
<div class="row" style="margin-top:14px"><button class="pri">Salvar</button><button type="button" data-a="close">Cancelar</button></div>${e?`<button type="button" class="dan" data-a="dg" data-id="${g.id}">Excluir meta</button>`:''}</form>`)}
function autoSt(g){if(g.steps.length){const k=g.steps.filter(s=>s.done).length;g.status=k===g.steps.length?'conc':k?'and':'nao'}}
function saveGoal(f,x){const title=x.title.trim();if(!title)return err('Informe o título da meta.');if(x.start&&x.due&&x.due<x.start)return err('O prazo não pode ser anterior ao início.');
 let g=f.dataset.id?S.goals.find(q=>q.id===f.dataset.id):null;if(!g){g={id:uid(),steps:[]};S.goals.push(g)}
 const prev=g.steps||[],steps=x.steps.split('\n').map(s=>s.trim()).filter(Boolean).map(s=>({t:s,done:!!(prev.find(p=>p.t===s)||{}).done}));
 Object.assign(g,{title,desc:x.desc.trim(),start:x.start,due:x.due,cat:x.cat,pri:x.pri,status:x.status,steps});autoSt(g);save();$('#dlg').close();toast('Meta salva')}
function revForm(){const T=today(),o=occ(T),dn=o.filter(x=>x.done),pe=o.filter(x=>!x.done);
 openD(`<form id="rf"><h2>Revisar meu dia</h2><b>✅ Concluídas (${dn.length})</b>${dn.map(x=>`<div>${esc(x.t.title)}</div>`).join('')||'<p><small>Nada concluído ainda.</small></p>'}<h2>⏳ Pendentes (${pe.length})</h2>${pe.map((x,i)=>`<div class="card"><b>${esc(x.t.title)}</b><div class="row"><select name="a${i}" aria-label="Ação"><option value="keep">Manter nesta data</option><option value="res">Reagendar</option><option value="can">Cancelar</option></select><input type="date" name="r${i}" value="${add(T,1)}" aria-label="Nova data"></div></div>`).join('')||'<p><small>Nenhuma pendência. 🎉</small></p>'}<label>Reflexão sobre o dia</label><textarea name="ref" rows="3">${esc(S.rev[T])}</textarea><div class="row" style="margin-top:12px"><button class="pri">Confirmar</button><button type="button" data-a="close">Cancelar</button></div></form>`)}
function saveRev(x){const T=today();occ(T).filter(o=>!o.done).forEach((o,i)=>{const a=x['a'+i],nd=x['r'+i],t=o.t,rec=t.rec&&t.rec.type!=='none';
 if(a==='can'){if(rec){t.skip=t.skip||{};t.skip[T]=1}else t.canceled=true}
 else if(a==='res'&&/^\d{4}-\d{2}-\d{2}$/.test(nd)){if(rec){t.skip=t.skip||{};t.skip[T]=1;S.tasks.push({...t,id:uid(),date:nd,rec:{type:'none',days:[]},comp:{},skip:{},created:new Date().toISOString()})}else t.date=nd}});
 if(x.ref.trim())S.rev[T]=x.ref.trim();else delete S.rev[T];save();$('#dlg').close();toast('Dia revisado')}
function nform(id){let n=S.notes.find(q=>q.id===id);if(!n){n={id:uid(),title:'',text:'',created:new Date().toISOString()};S.notes.push(n);save()}NOTE=n.id;
 openD(`<form id="nf"><h2>Nota</h2><label>Título</label><input name="title" maxlength="120" value="${esc(n.title)}"><label>Texto</label><textarea name="text" rows="10">${esc(n.text)}</textarea><small>Salva automaticamente enquanto você digita.</small><div class="row" style="margin-top:12px"><button type="button" class="pri" data-a="close">Fechar</button><button type="button" class="dan" data-a="dn" data-id="${n.id}">Excluir</button></div></form>`)}

/* ---- ações ---- */
const A={
 go(b){V.tab=b.dataset.v;$('#nav').classList.remove('open');mkNav();render();scrollTo(0,0);$('#app').focus({preventScroll:true})},
 more(){$('#nav').classList.toggle('open')},new(b){tform(null,b.dataset.d||today())},
 edit(b){const t=S.tasks.find(q=>q.id===b.dataset.id);if(t)tform(t,b.dataset.d)},
 tog(b){const t=S.tasks.find(q=>q.id===b.dataset.id),d=b.dataset.d;t.comp=t.comp||{};if(t.comp[d]){delete t.comp[d];toast('Conclusão desfeita')}else{t.comp[d]=new Date().toISOString();toast('Meta batida! 🎉')}save();render()},
 close(){$('#dlg').close()},
 del(b){if(confirm('Excluir esta tarefa definitivamente? Ela também sai do histórico.')){S.tasks=S.tasks.filter(t=>t.id!==b.dataset.id);save();$('#dlg').close();toast('Tarefa excluída')}},
 skip(b){const t=S.tasks.find(q=>q.id===b.dataset.id);t.skip=t.skip||{};t.skip[b.dataset.d]=1;save();$('#dlg').close();toast('Ocorrência pulada')},
 rev:revForm,pm(b){V.pm=b.dataset.v;render()},
 step(b){const n=+b.dataset.v;if(V.pm==='mes'){const d=pd(V.date);V.date=ymd(new Date(d.getFullYear(),d.getMonth()+n,1))}else V.date=add(V.date,(V.pm==='dia'?1:7)*n);render()},
 tdy(){V.date=today();render()},sel(b){V.date=b.dataset.d;render()},
 gt(b){const g=S.goals.find(q=>q.id===b.dataset.id);if(!g)return;const ok=g.status==='conc';(g.steps||[]).forEach(x=>x.done=!ok);g.status=ok?'nao':'conc';g.doneAt=ok?'':new Date().toISOString();save();render();toast(ok?'Meta reaberta':'Meta batida! 🎉')},nop(){},
 eg(b){gform(S.goals.find(g=>g.id===b.dataset.id))},
 dg(b){if(confirm('Excluir esta meta? As tarefas ligadas continuam existindo.')){S.goals=S.goals.filter(g=>g.id!==b.dataset.id);S.tasks.forEach(t=>{if(t.goal===b.dataset.id)t.goal=''});save();$('#dlg').close()}},
 gs(b){const g=S.goals.find(q=>q.id===b.dataset.id);g.steps[+b.dataset.i].done=b.checked;autoSt(g);save();render()},
 nn(){nform()},en(b){nform(b.dataset.id)},dn(b){if(confirm('Excluir esta nota?')){S.notes=S.notes.filter(n=>n.id!==b.dataset.id);NOTE=null;save();$('#dlg').close()}},
 hd(b){S.cfg.hd=b.checked;save()},
 cadd(){const n=(prompt('Nome da nova categoria:')||'').trim();if(!n)return;if(S.cats.some(c=>c.toLowerCase()===n.toLowerCase()))return toast('Essa categoria já existe');S.cats.push(n);save();render()},
 cren(b){const i=+b.dataset.i,o=S.cats[i],n=(prompt('Novo nome:',o)||'').trim();if(!n||n===o)return;if(S.cats.some(c=>c.toLowerCase()===n.toLowerCase()))return toast('Essa categoria já existe');
  S.cats[i]=n;S.tasks.forEach(t=>{if(t.cat===o)t.cat=n});S.goals.forEach(g=>{if(g.cat===o)g.cat=n});save();render()},
 cdel(b){if(S.cats.length<2)return toast('Mantenha ao menos uma categoria');if(confirm('Remover esta categoria? Tarefas existentes mantêm o nome dela.')){S.cats.splice(+b.dataset.i,1);save();render()}},
 exp(){const bl=new Blob([JSON.stringify({app:'minha-rotina',versao:1,exportado:new Date().toISOString(),dados:S},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='minha-rotina-backup-'+today()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);toast('Backup exportado')},
 imp(){$('#fi').click()},
 wipe(){if(confirm('Apagar TODAS as tarefas, metas e notas deste aparelho?')&&confirm('Última confirmação: isso não pode ser desfeito. Apagar tudo?')){localStorage.removeItem(K);S=blank();save();render();toast('Dados apagados')}},
 notif(){Notification.requestPermission().then(()=>render())},
 inst(){IP.prompt();IP.userChoice.then(()=>{IP=null;render()})}
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b)});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,x=Object.fromEntries(new FormData(f));
 if(f.id==='tf')saveTask(f,x);else if(f.id==='gf')saveGoal(f,x);else if(f.id==='rf')saveRev(x);else if(f.id==='qf'){const title=(x.title||'').trim();if(!title)return toast('Digite o nome da meta');S.goals.push({id:uid(),title,desc:'',start:today(),due:'',cat:S.cats[0],pri:x.pri||'media',status:'nao',steps:[]});save();render();toast('Meta adicionada');const q=$('#qf input');if(q)q.focus()}else if(f.id==='cf'){S.cfg.name=x.name.trim();save();render();toast('Salvo')}});
document.addEventListener('input',e=>{const el=e.target;
 if(el.dataset.f!==undefined&&el.dataset.f){V.f[el.dataset.f]=el.value;$('#lst').innerHTML=listT()}
 else if(el.id==='nq'){V.nq=el.value;$('#nl').innerHTML=notesList()}
 else if(el.id==='pdi'&&el.value){V.date=el.value;render()}
 else if(el.closest('#nf')){const n=S.notes.find(x=>x.id===NOTE);if(n){n[el.name]=el.value;save()}}
 else if(el.name==='rec'){$('#wd').hidden=el.value!=='weekdays'}});
$('#dlg').addEventListener('close',()=>{const n=S.notes.find(x=>x.id===NOTE);if(n&&!n.title.trim()&&!n.text.trim()){S.notes=S.notes.filter(x=>x!==n);save()}NOTE=null;render()});
document.addEventListener('change',e=>{if(e.target.id!=='fi'||!e.target.files[0])return;const r=new FileReader();r.onload=()=>{
 try{const o=JSON.parse(r.result),d=o&&o.dados;if(!o||o.app!=='minha-rotina'||!d||!Array.isArray(d.tasks)||!Array.isArray(d.goals)||!Array.isArray(d.notes)||!Array.isArray(d.cats))throw 0;
  if(!d.tasks.every(t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)))throw 0;
  if(confirm('Importar este backup? Isso SUBSTITUI todos os dados atuais ('+d.tasks.length+' tarefas, '+d.goals.length+' metas, '+d.notes.length+' notas).')){S=norm(d);save();render();toast('Backup importado')}}
 catch(x){toast('Arquivo inválido: não é um backup do Minha Rotina.')}};r.readAsText(e.target.files[0]);e.target.value=''});

/* ---- lembretes, PWA ---- */
function chk(){if(!('Notification'in window)||Notification.permission!=='granted')return;occ(today()).forEach(({t,d,done})=>{if(done||!t.time||t.rem===''||t.rem==null)return;const m=mins(t),k=t.id+d;
 if(m<=+t.rem&&m>-30&&!NT.includes(k)){NT.push(k);sessionStorage.setItem('nt',JSON.stringify(NT));const o={body:(m>0?'Começa em '+m+' min':'É agora')+' • '+t.time,icon:'icon-192.png',tag:k};
  (navigator.serviceWorker?navigator.serviceWorker.ready.then(r=>r.showNotification(t.title,o)):Promise.reject()).catch(()=>{try{new Notification(t.title,o)}catch(x){}})}})}
setInterval(()=>{chk();if(V.tab==='dia'&&!$('#dlg').open&&!document.activeElement.closest('#app input,#app select,#app textarea'))render()},60000);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();IP=e;if(V.tab==='config')render()});
addEventListener('offline',()=>toast('Você está offline — o app continua funcionando.'));addEventListener('online',()=>toast('Conexão restabelecida.'));
if('serviceWorker'in navigator){let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!rl&&W){rl=true;location.reload()}});
 addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').then(r=>{const show=w=>{W=w;$('#bn').hidden=false};
  if(r.waiting&&navigator.serviceWorker.controller)show(r.waiting);r.addEventListener('updatefound',()=>{const w=r.installing;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)show(w)})});r.update()}).catch(()=>{}));
 $('#upd').addEventListener('click',()=>W&&W.postMessage('SKIP'))}
mkNav();render();chk();
