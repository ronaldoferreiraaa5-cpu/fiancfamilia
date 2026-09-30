const sb=supabase.createClient('https://fafrrozjzjucbbbitfrr.supabase.co','sb_publishable_2rmoOvGT-Uw0YHHGp9eazQ_WVGQcQeG');

const S={user:null,household:null,member:null,isAdmin:false,entities:[],members:[],settings:{cash:0},preferences:{},cards:[],fixed:[],variable:[],income:[],debts:[],accounts:[],categories:[],transactions:[],budgets:[],goals:[]};
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const sum=(a,k='amount')=>a.reduce((s,x)=>s+Number(x[k]||0),0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mk=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
const mlabel=m=>{const[y,x]=m.split('-');return new Date(+y,+x-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})};
const navItems=[['dashboard','Dashboard','⌂'],['transactions','Transações','↕'],['planning','Planejamento','▥'],['goals','Metas','◎'],['debts','Dívidas','◫'],['accounts','Contas e cartões','▣'],['reports','Relatórios','◌'],['members','Membros','♧'],['settingsPage','Configurações','⚙']];

function toast(t){const e=$('toast');e.textContent=t;e.classList.remove('hidden');setTimeout(()=>e.classList.add('hidden'),2500)}
function metric(l,v,f,i){return '<div class="metric"><div class="metric-top"><div class="metric-icon">'+i+'</div></div><div class="metric-label">'+l+'</div><div class="metric-value">'+v+'</div><div class="metric-foot">'+f+'</div></div>'}
function empty(t){return '<div class="empty-state"><div class="empty-icon">◇</div><h3>Nada por aqui ainda</h3><p>'+esc(t)+'</p></div>'}
function rowEmpty(t){return '<div class="muted" style="padding:14px 0;font-size:12px">'+esc(t)+'</div>'}
function entityName(id,f='Casa'){return S.entities.find(e=>e.id===id)?.name||f}
function categoryName(id){return S.categories.find(c=>c.id===id)?.name||'Outros'}
function accountName(id){return S.accounts.find(a=>a.id===id)?.name||'Sem conta'}

function renderNav(){
  const all=[...navItems]; if(S.isAdmin)all.splice(8,0,['admin','Admin','◆']);
  $('nav').innerHTML=all.map(x=>'<button data-target="'+x[0]+'" class="'+(x[0]==='dashboard'?'active':'')+'" onclick="go(\''+x[0]+'\',this)">'+x[2]+'<span>'+x[1]+'</span></button>').join('');
  $('mobileNav').innerHTML=[['dashboard','Início','⌂'],['transactions','Transações','↕'],['goals','Metas','◎'],['debts','Dívidas','◫'],['settingsPage','Mais','•••']].map(x=>'<button class="'+(x[0]==='dashboard'?'active':'')+'" onclick="go(\''+x[0]+'\',this)">'+x[2]+'<span>'+x[1]+'</span></button>').join('');
}

function go(id,b){
 document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));
 const s=$(id);if(s)s.classList.add('active');
 document.querySelectorAll('.nav button,.mobile-nav button').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('[data-target="'+id+'"]').forEach(x=>x.classList.add('active'));
 if(b)b.classList.add('active'); renderSection(id); scrollTo({top:0,behavior:'smooth'});
}

async function sel(t,eq={},order=null){
 let q=sb.from(t).select('*'); Object.entries(eq).forEach(([k,v])=>q=q.eq(k,v)); if(order)q=q.order(order,{ascending:false});
 const{data,error}=await q;if(error){console.warn(t,error.message);return[]}return data||[];
}

async function signIn(){
 const e=$('email').value.trim(),p=$('password').value;$('authMsg').textContent='Entrando...';
 if(!e||!p){$('authMsg').textContent='Informe e-mail e senha.';return}
 const{data,error}=await sb.auth.signInWithPassword({email:e,password:p});
 if(error){$('authMsg').textContent='Não foi possível entrar: '+error.message;return}S.user=data.user;await boot()
}
async function resetPassword(){
 const e=$('email').value.trim();if(!e){$('authMsg').textContent='Digite seu e-mail primeiro.';return}
 const{error}=await sb.auth.resetPasswordForEmail(e,{redirectTo:location.origin+location.pathname});
 $('authMsg').textContent=error?error.message:'Enviamos as instruções para seu e-mail.'
}
async function signOut(){await sb.auth.signOut();location.reload()}

async function boot(){
 $('authView').classList.add('hidden');$('appView').classList.remove('hidden');await loadAll();renderNav();renderAll()
}

async function loadAll(){
 if(!S.user)return;
 S.isAdmin=(await sel('app_admins',{user_id:S.user.id})).length>0;
 const ms=await sel('household_members',{user_id:S.user.id});S.member=ms[0]||null;
 if(S.member)S.household=(await sel('households',{id:S.member.household_id}))[0]||null;
 else if(S.isAdmin)S.household=(await sel('households'))[0]||null;
 if(!S.household){$('familyName').textContent='Nenhuma família';$('profileName').textContent=S.user.email||'Usuário';renderAll();return}
 const h=S.household.id;
 const r=await Promise.all([
  sel('family_entities',{household_id:h}),sel('household_members',{household_id:h}),sel('household_settings',{household_id:h}),
  sel('household_preferences',{household_id:h}),sel('cards',{household_id:h},'created_at'),sel('fixed',{household_id:h},'created_at'),
  sel('variable',{household_id:h},'created_at'),sel('income',{household_id:h},'created_at'),sel('debts',{household_id:h},'created_at'),
  sel('financial_accounts',{household_id:h},'created_at'),sel('categories',{household_id:h},'created_at'),sel('transactions',{household_id:h},'transaction_date'),
  sel('budgets',{household_id:h},'month'),sel('goals',{household_id:h},'created_at')
 ]);
 [S.entities,S.members]=r;S.settings=r[2][0]||{cash:0};S.preferences=r[3][0]||{};
 [S.cards,S.fixed,S.variable,S.income,S.debts,S.accounts,S.categories,S.transactions,S.budgets,S.goals]=r.slice(4);
 $('familyName').textContent=S.household.name;
 const n=S.member?.display_name||S.user.user_metadata?.name||S.user.email?.split('@')[0]||'Usuário';
 $('profileName').textContent=n;$('avatar').textContent=n[0].toUpperCase();$('profileRole').textContent=S.isAdmin?'Super Admin':S.member?.role==='owner'?'Administrador':'Membro';
 renderAll()
}

function stats(){
 const m=mk(),tx=S.transactions.filter(t=>String(t.transaction_date).slice(0,7)===m&&t.status!=='cancelled');
 const inc=sum(tx.filter(t=>t.transaction_type==='income'))+sum(S.income.filter(x=>x.month===m&&!x.already_in_cash));
 const fix=sum(S.fixed.filter(x=>x.start_month<=m&&(!x.end_month||x.end_month>=m)));
 const vari=sum(S.variable.filter(x=>x.month===m))+sum(tx.filter(t=>t.transaction_type==='expense'));
 return{m,tx,inc,fix,vari,expense:fix+vari}
}

function renderDashboard(){
 const s=stats(),open=S.debts.filter(d=>!d.paid),bal=Number(S.settings.cash||0)+s.inc-s.expense;
 $('dashboard').innerHTML='<div class="page-header"><div><h1>Olá, '+esc($('profileName').textContent)+'!</h1><p>Aqui está um resumo da vida financeira da sua família.</p></div><div class="toolbar"><span class="chip active">'+esc(mlabel(s.m))+'</span><button class="btn btn-accent" onclick="openQuickTransaction()">＋ Nova transação</button></div></div>'+
 '<div class="metric-grid">'+metric('Saldo familiar',money(bal),'Caixa atual + movimento do mês','◉')+metric('Receitas do mês',money(s.inc),'Entradas previstas e realizadas','↗')+metric('Despesas do mês',money(s.expense),'Fixas, variáveis e transações','↘')+metric('Dívidas abertas',money(sum(open)),open.length+' compromisso(s)','◫')+'</div>'+
 '<div class="grid-2"><div class="panel"><div class="panel-head"><div><div class="panel-title">Visão geral do mês</div><div class="panel-sub">Receitas x despesas</div></div></div><div class="donut-wrap"><div class="donut"><div class="donut-center"><strong>'+money(s.expense)+'</strong><span>despesas</span></div></div><div class="legend">'+
 '<div class="legend-row"><i class="dot" style="background:#00539C"></i><span>Fixas</span><b>'+money(s.fix)+'</b></div><div class="legend-row"><i class="dot" style="background:#FFD662"></i><span>Variáveis</span><b>'+money(s.vari)+'</b></div><div class="legend-row"><i class="dot" style="background:#422057"></i><span>Receitas</span><b>'+money(s.inc)+'</b></div></div></div></div>'+
 '<div class="panel"><div class="panel-head"><div><div class="panel-title">Por responsável</div><div class="panel-sub">Entidades desta família</div></div></div><div class="entity-list">'+(S.entities.map(e=>'<div class="entity-row"><div class="entity-icon">'+esc(e.name[0])+'</div><div class="entity-meta"><strong>'+esc(e.name)+'</strong><small>'+(e.kind==='shared'?'Compartilhado':'Pessoa')+'</small></div><span class="badge">'+(e.active?'Ativo':'Inativo')+'</span></div>').join('')||rowEmpty('Nenhum responsável cadastrado.'))+'</div></div></div>'+
 '<div class="grid-3"><div class="panel"><div class="panel-head"><div><div class="panel-title">Metas da família</div><div class="panel-sub">Progresso das conquistas</div></div><button class="chip" onclick="go(\'goals\')">Ver todas</button></div>'+(S.goals.length?S.goals.slice(0,3).map(goalRow).join(''):rowEmpty('Crie a primeira meta da família.'))+'</div>'+
 '<div class="panel"><div class="panel-head"><div><div class="panel-title">Dívidas</div><div class="panel-sub">Compromissos em aberto</div></div><button class="chip" onclick="go(\'debts\')">Ver todas</button></div>'+(open.length?open.slice(0,4).map(d=>'<div class="list-row"><div class="entity-icon">◫</div><div class="entity-meta"><strong>'+esc(d.description)+'</strong><small>'+esc(d.owner||entityName(d.owner_entity_id))+'</small></div><div class="amount">'+money(d.amount)+'</div></div>').join(''):rowEmpty('Nenhuma dívida aberta.'))+'</div>'+
 '<div class="panel smart"><span class="smart-badge">✦ Planejamento inteligente</span><h3>Mais clareza para decidir.</h3><p>O FINANOUSE usa seus próprios dados para mostrar orçamento, compromissos e evolução sem depender de IA paga.</p><button class="btn btn-accent" onclick="go(\'planning\')">Ver planejamento</button></div></div>'
}

function goalRow(g){const p=Math.min(100,(Number(g.current_amount||0)/Number(g.target_amount||1))*100);return '<div class="list-row" style="display:block"><div style="display:flex;justify-content:space-between;gap:10px"><strong>'+esc(g.name)+'</strong><b>'+Math.round(p)+'%</b></div><div class="progress" style="margin-top:8px"><span style="width:'+p+'%"></span></div><small class="muted">'+money(g.current_amount)+' de '+money(g.target_amount)+'</small></div>'}

function renderTransactions(){
 const rows=S.transactions.map(t=>'<tr><td>'+new Date(t.transaction_date+'T12:00').toLocaleDateString('pt-BR')+'</td><td><strong>'+esc(t.description)+'</strong></td><td>'+esc(categoryName(t.category_id))+'</td><td>'+esc(entityName(t.owner_entity_id,'—'))+'</td><td>'+esc(accountName(t.account_id))+'</td><td class="'+(t.transaction_type==='income'?'positive':'negative')+'">'+(t.transaction_type==='income'?'+ ':'- ')+money(t.amount)+'</td><td><span class="badge">'+esc(t.status)+'</span></td></tr>').join('');
 $('transactions').innerHTML=pageHead('Transações','Acompanhe as movimentações da sua família.','＋ Nova transação','openQuickTransaction()')+
 '<div class="panel"><div class="split-filter"><span class="chip active">Todas</span><span class="chip">Receitas</span><span class="chip">Despesas</span></div></div>'+
 (rows?'<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Responsável</th><th>Conta</th><th>Valor</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>':empty('Registre sua primeira transação.'))
}

function renderPlanning(){
 const m=mk(),bs=S.budgets.filter(b=>b.month===m);
 const rows=bs.map(b=>{const spent=sum(S.transactions.filter(t=>t.category_id===b.category_id&&t.transaction_type==='expense'&&String(t.transaction_date).slice(0,7)===m));const p=Math.min(150,spent/Math.max(Number(b.planned_amount),1)*100);return '<div class="list-row" style="display:block"><div style="display:flex;justify-content:space-between"><strong>'+esc(categoryName(b.category_id))+'</strong><span>'+money(spent)+' / '+money(b.planned_amount)+'</span></div><div class="progress" style="margin-top:8px"><span style="width:'+Math.min(100,p)+'%"></span></div></div>'}).join('');
 $('planning').innerHTML=pageHead('Planejamento','Defina limites e acompanhe o orçamento mensal.','＋ Novo orçamento','createBudget()')+
 '<div class="metric-grid">'+metric('Total orçado',money(sum(bs,'planned_amount')),'Para '+mlabel(m),'▥')+metric('Categorias',String(bs.length),'Com orçamento definido','◎')+metric('Gasto em transações',money(sum(S.transactions.filter(t=>t.transaction_type==='expense'&&String(t.transaction_date).slice(0,7)===m))),'No mês atual','↘')+metric('Disponível',money(Math.max(0,sum(bs,'planned_amount')-sum(S.transactions.filter(t=>t.transaction_type==='expense'&&String(t.transaction_date).slice(0,7)===m)))),'Dentro do orçamento','◉')+'</div><div class="panel" style="margin-top:14px">'+(rows||rowEmpty('Nenhum orçamento definido para este mês.'))+'</div>'
}

function renderGoals(){
 $('goals').innerHTML=pageHead('Metas da família','Juntos por um futuro mais organizado.','＋ Nova meta','createGoal()')+
 (S.goals.length?'<div class="grid-3">'+S.goals.map(g=>'<div class="panel"><div class="panel-head"><div><div class="panel-title">'+esc(g.name)+'</div><div class="panel-sub">'+esc(entityName(g.owner_entity_id,'Família'))+'</div></div><span class="badge purple">'+esc(g.status)+'</span></div>'+goalRow(g)+'</div>').join('')+'</div>':empty('Crie objetivos como reserva, viagem, carro ou educação.'))
}

function renderDebts(){
 const rows=S.debts.map(d=>'<tr><td><strong>'+esc(d.description)+'</strong></td><td>'+esc(d.owner||entityName(d.owner_entity_id))+'</td><td>'+money(d.amount)+'</td><td>'+esc(d.due_month||'—')+'</td><td><span class="badge '+(d.paid?'':'warn')+'">'+(d.paid?'Pago':'Em aberto')+'</span></td></tr>').join('');
 $('debts').innerHTML=pageHead('Dívidas','Acompanhe compromissos e responsáveis.','＋ Nova dívida','createDebt()')+
 '<div class="metric-grid">'+metric('Total cadastrado',money(sum(S.debts)),'Todas as dívidas','◫')+metric('Em aberto',money(sum(S.debts.filter(x=>!x.paid))),'Ainda não pagas','!')+metric('Quitadas',money(sum(S.debts.filter(x=>x.paid))),'Histórico concluído','✓')+metric('Responsáveis',String(S.entities.length),'Pessoas + Casa','♧')+'</div>'+
 (rows?'<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Descrição</th><th>Responsável</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>':empty('Cadastre a primeira dívida para acompanhar aqui.'))
}

function renderAccounts(){
 $('accounts').innerHTML=pageHead('Contas e cartões','Centralize onde o dinheiro da família está.','＋ Nova conta','createAccount()')+
 (S.accounts.length?'<div class="grid-3">'+S.accounts.map(a=>'<div class="panel"><div class="panel-head"><div><div class="panel-title">'+esc(a.name)+'</div><div class="panel-sub">'+esc(a.institution||a.account_type)+'</div></div><span class="badge">'+(a.active?'Ativa':'Inativa')+'</span></div><div class="metric-value">'+money(a.current_balance)+'</div><div class="muted" style="font-size:11px;margin-top:8px">Responsável: '+esc(entityName(a.owner_entity_id,'Família'))+'</div>'+(a.account_type==='credit_card'?'<div class="muted" style="font-size:11px">Limite: '+money(a.credit_limit)+'</div>':'')+'</div>').join('')+'</div>':empty('Adicione contas, carteiras e cartões da família.'))
}

function renderReports(){
 const s=stats(); const cat={};S.transactions.filter(t=>t.transaction_type==='expense').forEach(t=>cat[categoryName(t.category_id)]=(cat[categoryName(t.category_id)]||0)+Number(t.amount));
 const list=Object.entries(cat).sort((a,b)=>b[1]-a[1]).slice(0,6);
 $('reports').innerHTML=pageHead('Relatórios','Insights objetivos usando os dados do FINANOUSE.')+
 '<div class="grid-2"><div class="panel"><div class="panel-head"><div><div class="panel-title">Resumo atual</div><div class="panel-sub">'+esc(mlabel(s.m))+'</div></div></div><div class="entity-list"><div class="entity-row"><div class="entity-meta"><strong>Receitas</strong></div><b class="positive">'+money(s.inc)+'</b></div><div class="entity-row"><div class="entity-meta"><strong>Despesas</strong></div><b class="negative">'+money(s.expense)+'</b></div><div class="entity-row"><div class="entity-meta"><strong>Resultado</strong></div><b>'+money(s.inc-s.expense)+'</b></div></div></div>'+
 '<div class="panel"><div class="panel-head"><div><div class="panel-title">Top categorias</div><div class="panel-sub">Por transações registradas</div></div></div>'+(list.length?list.map(x=>'<div class="entity-row"><div class="entity-meta"><strong>'+esc(x[0])+'</strong></div><b>'+money(x[1])+'</b></div>').join(''):rowEmpty('Ainda não há transações suficientes.'))+'</div></div>'
}

function renderMembers(){
 $('members').innerHTML=pageHead('Membros','Pessoas com acesso à família.')+
 (S.members.length?'<div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th></tr></thead><tbody>'+S.members.map(m=>'<tr><td><strong>'+esc(m.display_name)+'</strong></td><td>'+esc(m.email)+'</td><td><span class="badge">'+(m.role==='owner'?'Administrador':'Membro')+'</span></td></tr>').join('')+'</tbody></table></div>':empty('Nenhum membro vinculado.'))
}

function renderAdmin(){
 if(!S.isAdmin){$('admin').innerHTML=empty('Área restrita.');return}
 $('admin').innerHTML='<div class="page-header"><div><h1>Painel administrativo</h1><p>Gestão central do FINANOUSE.</p></div><div class="toolbar"><button class="btn btn-accent" onclick="adminCreateFamily()">＋ Nova família</button><button class="btn btn-primary" onclick="adminCreateUser()">＋ Novo usuário</button></div></div>'+
 '<div class="admin-banner"><div class="metric-icon">◆</div><div><strong>Super Admin</strong><p>Famílias e usuários ficam isolados por household_id e RLS.</p></div></div>'+
 '<div class="grid-3">'+metric('Família ativa',S.household?esc(S.household.name):'—','Contexto atual','⌂')+metric('Membros',String(S.members.length),'Na família ativa','♧')+metric('Entidades',String(S.entities.length),'Responsáveis financeiros','◇')+'</div>'+
 '<div class="panel" style="margin-top:14px"><div class="panel-title">Gestão administrativa</div><p class="muted" style="font-size:12px">A interface está pronta. A criação segura de usuários exige a função server-side administrativa; o conector bloqueou o deploy dessa função nesta sessão para proteger credenciais.</p></div>'
}

function renderSettings(){
 $('settingsPage').innerHTML=pageHead('Configurações','Preferências da família e do acesso.')+
 '<div class="grid-2"><div class="panel"><div class="panel-title">Família</div><div class="list"><div class="list-row"><div class="entity-meta"><strong>Nome</strong><small>'+esc(S.household?.name||'—')+'</small></div></div><div class="list-row"><div class="entity-meta"><strong>Moeda</strong><small>'+esc(S.preferences.currency||'BRL')+'</small></div></div><div class="list-row"><div class="entity-meta"><strong>Fuso</strong><small>'+esc(S.preferences.timezone||'America/Sao_Paulo')+'</small></div></div></div></div><div class="panel"><div class="panel-title">Conta</div><p class="muted">'+esc(S.user?.email||'')+'</p><button class="btn btn-danger" onclick="signOut()">Sair da conta</button></div></div>'
}

function pageHead(t,s,b='',fn=''){return '<div class="page-header"><div><h1>'+esc(t)+'</h1><p>'+esc(s)+'</p></div>'+(b?'<button class="btn btn-accent" onclick="'+fn+'">'+b+'</button>':'')+'</div>'}
function renderSection(id){({dashboard:renderDashboard,transactions:renderTransactions,planning:renderPlanning,goals:renderGoals,debts:renderDebts,accounts:renderAccounts,reports:renderReports,members:renderMembers,admin:renderAdmin,settingsPage:renderSettings}[id]||(()=>{}))()}
function renderAll(){['dashboard','transactions','planning','goals','debts','accounts','reports','members','admin','settingsPage'].forEach(renderSection)}

async function openQuickTransaction(){
 if(!S.household)return toast('Nenhuma família ativa.');
 const type=prompt('Tipo: receita ou despesa?','despesa');if(!type)return;
 const desc=prompt('Descrição da transação:');if(!desc)return;
 const val=Number(String(prompt('Valor em reais:','0')||'0').replace(',','.'));if(!(val>0))return toast('Valor inválido.');
 const owner=S.entities[0]?.id||null,cat=S.categories.find(c=>c.category_type===(type.toLowerCase().startsWith('r')?'income':'expense'))?.id||null;
 const {error}=await sb.from('transactions').insert({household_id:S.household.id,created_by:S.user.id,transaction_type:type.toLowerCase().startsWith('r')?'income':'expense',description:desc,amount:val,transaction_date:new Date().toISOString().slice(0,10),status:'cleared',owner_entity_id:owner,category_id:cat});
 if(error)return toast('Erro: '+error.message);toast('Transação salva.');await loadAll()
}

async function createGoal(){
 const name=prompt('Nome da meta:');if(!name)return;const target=Number(String(prompt('Valor objetivo:','0')||'0').replace(',','.'));if(!(target>0))return;
 const{error}=await sb.from('goals').insert({household_id:S.household.id,name,target_amount:target,current_amount:0,status:'active',created_by:S.user.id,owner_entity_id:S.entities.find(e=>e.kind==='shared')?.id||null});
 if(error)return toast(error.message);toast('Meta criada.');await loadAll()
}
async function createAccount(){
 const name=prompt('Nome da conta ou cartão:');if(!name)return;const type=prompt('Tipo: checking, savings, wallet, investment, credit_card ou other','checking')||'checking';
 const bal=Number(String(prompt('Saldo atual:','0')||'0').replace(',','.'));
 const{error}=await sb.from('financial_accounts').insert({household_id:S.household.id,name,account_type:type,current_balance:bal||0,active:true,created_by:S.user.id,owner_entity_id:S.entities[0]?.id||null});
 if(error)return toast(error.message);toast('Conta criada.');await loadAll()
}
async function createBudget(){
 if(!S.categories.length)return toast('Cadastre categorias primeiro.');
 const names=S.categories.map((c,i)=>(i+1)+' - '+c.name).join('\n');const n=Number(prompt('Escolha a categoria:\n'+names,'1'))-1;const c=S.categories[n];if(!c)return;
 const v=Number(String(prompt('Valor orçado:','0')||'0').replace(',','.'));if(!(v>=0))return;
 const{error}=await sb.from('budgets').upsert({household_id:S.household.id,category_id:c.id,month:mk(),planned_amount:v},{onConflict:'household_id,category_id,month'});
 if(error)return toast(error.message);toast('Orçamento salvo.');await loadAll()
}
async function createDebt(){toast('Cadastro detalhado de dívida permanece no módulo legado por enquanto.')}
function adminCreateFamily(){toast('Fluxo preparado; ativação server-side pendente por bloqueio de segurança do conector.')}
function adminCreateUser(){toast('Fluxo preparado; ativação server-side pendente por bloqueio de segurança do conector.')}
function runSearch(q){q=q.trim().toLowerCase();if(q.length<2)return;const hit=[...S.transactions,...S.debts,...S.goals].find(x=>String(x.description||x.name||'').toLowerCase().includes(q));if(hit)toast('Encontrado: '+(hit.description||hit.name));}

(async()=>{const{data:{session}}=await sb.auth.getSession();if(session){S.user=session.user;await boot()}})();