
(function(){
  const months=[];
  for(let d=new Date(new Date().getFullYear(),new Date().getMonth(),1),end=new Date(new Date().getFullYear()+1,11,1);d<=end;d.setMonth(d.getMonth()+1)) months.push(mk(d));
  const addMonth=(m,n)=>{let[y,x]=m.split('-').map(Number),d=new Date(y,x-1+n,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
  const ml=m=>{if(!m)return'—';const[y,x]=m.split('-');return new Date(+y,+x-1,1).toLocaleDateString('pt-BR',{month:'short',year:'numeric'})};

  window.FinanouseLegacy={
    months,addMonth,ml,
    cardRows(){let a=[];S.cards.forEach(c=>{for(let i=0;i<c.installments;i++)a.push({...c,month:addMonth(c.first_month,i),installment:i+1,value:Number(c.total)/Number(c.installments||1)})});return a},
    fixedAt(m){return sum(S.fixed.filter(x=>x.start_month<=m&&(!x.end_month||x.end_month>=m)))},
    variableAt(m){return sum(S.variable.filter(x=>x.month===m))},
    incomeAt(m){return sum(S.income.filter(x=>{if(x.recurring){if(!(x.month<=m&&(!x.end_month||x.end_month>=m)))return false;if(x.already_in_cash&&m===x.month)return false;return true}return x.month===m&&!x.already_in_cash}))},
    debtAt(m){return sum(S.debts.filter(x=>x.due_month===m&&!x.paid))},
    cardsAt(m){return this.cardRows().filter(x=>x.month===m).reduce((s,x)=>s+x.value,0)},
    monthly(m){const inc=this.incomeAt(m),fix=this.fixedAt(m),car=this.cardsAt(m),vari=this.variableAt(m),debt=this.debtAt(m);return{inc,fix,car,vari,debt,out:fix+car+vari+debt,net:inc-fix-car-vari-debt}},
    projection(){let cash=Number(S.settings.cash||0);return months.map(m=>{const opening=cash,x=this.monthly(m);cash+=x.net;return{month:m,opening,...x,cash}})}
  };

  window.renderNav=function(){
    const items=[['dashboard','Dashboard','⌂'],['cards','Cartão','▣'],['fixed','Gastos fixos','▤'],['variable','Gastos variáveis','↘'],['income','Caixa & receitas','↗'],['debts','Dívidas','◫'],['projection','Projeção mensal','▥'],['planning','Planejamento','◎'],['goals','Metas','◇'],['accounts','Contas e cartões','□'],['reports','Relatórios','◌'],['members','Membros','♧'],['settingsPage','Configurações','⚙']];
    if(S.isAdmin) items.splice(items.length-1,0,['admin','Admin','◆']);
    $('nav').innerHTML=items.map((x,i)=>'<button data-target="'+x[0]+'" class="'+(i===0?'active':'')+'" onclick="go(\''+x[0]+'\',this)">'+x[2]+'<span>'+x[1]+'</span></button>').join('');
    $('mobileNav').innerHTML=[['dashboard','Início','⌂'],['cards','Cartão','▣'],['income','Receitas','↗'],['debts','Dívidas','◫'],['settingsPage','Mais','•••']].map((x,i)=>'<button class="'+(i===0?'active':'')+'" onclick="go(\''+x[0]+'\',this)">'+x[2]+'<span>'+x[1]+'</span></button>').join('');
  };

  window.actionBtns=(t,id)=>'<button class="chip" onclick="editLegacy(\''+t+'\',\''+id+'\')">Editar</button> <button class="chip" onclick="deleteLegacy(\''+t+'\',\''+id+'\')">Excluir</button>';

  window.renderDashboard=function(){
    const L=FinanouseLegacy,m=mk(),x=L.monthly(m),p=L.projection(),final=p[p.length-1]?.cash??Number(S.settings.cash||0),open=S.debts.filter(d=>!d.paid);
    $('dashboard').innerHTML=pageHead('Visão geral','Tudo que você cadastra nos módulos operacionais reflete aqui.')+
    '<div class="metric-grid">'+metric('Caixa atual',money(S.settings.cash),'Valor disponível agora','◉')+metric('Receitas do mês',money(x.inc),'Caixa & receitas','↗')+metric('Despesas do mês',money(x.out),'Fixos + cartão + variáveis + dívidas','↘')+metric('Caixa projetado',money(final),'Final da projeção atual','◎')+'</div>'+
    '<div class="grid-2"><div class="panel"><div class="panel-head"><div><div class="panel-title">Composição das saídas</div><div class="panel-sub">'+L.ml(m)+'</div></div></div>'+
    [['Gastos fixos',x.fix,'▤'],['Cartão',x.car,'▣'],['Variáveis',x.vari,'↘'],['Dívidas',x.debt,'◫']].map(v=>'<div class="entity-row"><div class="entity-icon">'+v[2]+'</div><div class="entity-meta"><strong>'+v[0]+'</strong></div><b>'+money(v[1])+'</b></div>').join('')+
    '</div><div class="panel"><div class="panel-head"><div><div class="panel-title">Atalhos de cadastro</div><div class="panel-sub">Alimente o painel pelos módulos abaixo</div></div></div>'+
    '<div class="entity-list"><button class="btn btn-soft w-full" onclick="go(\'cards\')">Cartão</button><button class="btn btn-soft w-full" onclick="go(\'fixed\')">Gastos fixos</button><button class="btn btn-soft w-full" onclick="go(\'variable\')">Gastos variáveis</button><button class="btn btn-soft w-full" onclick="go(\'income\')">Caixa & receitas</button><button class="btn btn-soft w-full" onclick="go(\'debts\')">Dívidas</button></div></div></div>'+
    '<div class="grid-3"><div class="panel"><div class="panel-title">Cartão no mês</div><div class="metric-value">'+money(x.car)+'</div><div class="muted">'+L.cardRows().filter(r=>r.month===m).length+' parcela(s)</div></div>'+
    '<div class="panel"><div class="panel-title">Dívidas abertas</div><div class="metric-value">'+money(sum(open))+'</div><div class="muted">'+open.length+' compromisso(s)</div></div>'+
    '<div class="panel smart"><span class="smart-badge">✦ Resultado do mês</span><h3 class="'+(x.net>=0?'positive':'negative')+'">'+money(x.net)+'</h3><p>Receitas menos todas as saídas previstas no mês.</p></div></div>';
  };
})();