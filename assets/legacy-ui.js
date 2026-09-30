
(function(){
  const L=FinanouseLegacy;
  window.renderCards=function(){
    const rows=L.cardRows();
    $('cards').innerHTML=pageHead('Cartão','Compras parceladas entram automaticamente na projeção.','＋ Nova compra','openLegacyForm(\'cards\')')+
    (rows.length?'<div class="table-wrap"><table><thead><tr><th>Compra</th><th>Total</th><th>Parcela</th><th>Mês</th><th>Valor</th><th></th></tr></thead><tbody>'+
    rows.map(r=>'<tr><td><strong>'+esc(r.description)+'</strong></td><td>'+money(r.total)+'</td><td>'+r.installment+'/'+r.installments+'</td><td>'+L.ml(r.month)+'</td><td>'+money(r.value)+'</td><td>'+(r.installment===1?actionBtns('cards',r.id):'')+'</td></tr>').join('')+
    '</tbody></table></div>':empty('Cadastre uma compra do cartão.'));
  };

  window.renderFixed=function(){
    $('fixed').innerHTML=pageHead('Gastos fixos','Despesas recorrentes que entram mês a mês.','＋ Novo gasto fixo','openLegacyForm(\'fixed\')')+
    (S.fixed.length?'<div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Valor</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>'+
    S.fixed.map(x=>'<tr><td><strong>'+esc(x.description)+'</strong></td><td>'+money(x.amount)+'</td><td>'+L.ml(x.start_month)+'</td><td>'+(x.end_month?L.ml(x.end_month):'Contínuo')+'</td><td>'+actionBtns('fixed',x.id)+'</td></tr>').join('')+
    '</tbody></table></div>':empty('Cadastre seus gastos fixos.'));
  };

  window.renderVariable=function(){
    $('variable').innerHTML=pageHead('Gastos variáveis','Despesas pontuais que entram em um mês específico.','＋ Novo gasto variável','openLegacyForm(\'variable\')')+
    (S.variable.length?'<div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Valor</th><th>Mês</th><th></th></tr></thead><tbody>'+
    S.variable.map(x=>'<tr><td><strong>'+esc(x.description)+'</strong></td><td>'+money(x.amount)+'</td><td>'+L.ml(x.month)+'</td><td>'+actionBtns('variable',x.id)+'</td></tr>').join('')+
    '</tbody></table></div>':empty('Cadastre gastos pontuais por mês.'));
  };

  window.renderIncome=function(){
    $('income').innerHTML=pageHead('Caixa & receitas','Dinheiro disponível agora e entradas futuras.','＋ Nova receita','openLegacyForm(\'income\')')+
    '<div class="metric-grid">'+metric('Caixa atual',money(S.settings.cash),'Dinheiro disponível agora','◉')+metric('Receitas cadastradas',String(S.income.length),'Pontuais e recorrentes','↗')+metric('Receita deste mês',money(L.incomeAt(mk())),'A receber neste mês','◎')+metric('Próximo mês',money(L.incomeAt(L.addMonth(mk(),1))),'Entradas previstas','◇')+'</div>'+
    '<div class="panel" style="margin-top:14px"><button class="btn btn-primary" onclick="editCash()">Editar caixa atual</button></div>'+
    (S.income.length?'<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Recorrência</th><th>Situação</th><th>Início</th><th>Fim</th><th></th></tr></thead><tbody>'+
    S.income.map(x=>'<tr><td><strong>'+esc(x.description)+'</strong></td><td>'+esc(({salary:'Salário',extra:'Extra',other:'Outro'}[x.kind]||x.kind))+'</td><td>'+money(x.amount)+'</td><td>'+(x.recurring?'Contínua':'Pontual')+'</td><td>'+(x.already_in_cash?'Já está no caixa':'A receber')+'</td><td>'+L.ml(x.month)+'</td><td>'+(x.end_month?L.ml(x.end_month):'—')+'</td><td>'+actionBtns('income',x.id)+'</td></tr>').join('')+
    '</tbody></table></div>':empty('Cadastre suas receitas.'));
  };

  window.renderDebts=function(){
    $('debts').innerHTML=pageHead('Dívidas','Compromissos que impactam sua projeção.','＋ Nova dívida','openLegacyForm(\'debts\')')+
    '<div class="metric-grid">'+metric('Total cadastrado',money(sum(S.debts)),'Todas as dívidas','◫')+metric('Em aberto',money(sum(S.debts.filter(x=>!x.paid))),'Ainda não pagas','!')+metric('Quitadas',money(sum(S.debts.filter(x=>x.paid))),'Histórico concluído','✓')+metric('Responsáveis',String(S.entities.length),'Pessoas + Casa','♧')+'</div>'+
    (S.debts.length?'<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Descrição</th><th>Responsável</th><th>Valor</th><th>Mês</th><th>Status</th><th></th></tr></thead><tbody>'+
    S.debts.map(x=>'<tr><td><strong>'+esc(x.description)+'</strong></td><td>'+esc(x.owner||entityName(x.owner_entity_id))+'</td><td>'+money(x.amount)+'</td><td>'+L.ml(x.due_month)+'</td><td><span class="badge '+(x.paid?'':'warn')+'">'+(x.paid?'Pago':'Em aberto')+'</span></td><td>'+actionBtns('debts',x.id)+'</td></tr>').join('')+
    '</tbody></table></div>':empty('Cadastre suas dívidas.'));
  };

  window.renderProjection=function(){
    const p=L.projection();
    $('projection').innerHTML=pageHead('Projeção mensal','A lógica antiga preservada dentro da V2.')+
    '<div class="table-wrap"><table><thead><tr><th>Mês</th><th>Caixa inicial</th><th>Receitas</th><th>Fixos</th><th>Cartão</th><th>Variáveis</th><th>Dívidas</th><th>Saldo</th><th>Caixa final</th></tr></thead><tbody>'+
    p.map(x=>'<tr><td>'+L.ml(x.month)+'</td><td>'+money(x.opening)+'</td><td>'+money(x.inc)+'</td><td>'+money(x.fix)+'</td><td>'+money(x.car)+'</td><td>'+money(x.vari)+'</td><td>'+money(x.debt)+'</td><td class="'+(x.net>=0?'positive':'negative')+'">'+money(x.net)+'</td><td><strong>'+money(x.cash)+'</strong></td></tr>').join('')+
    '</tbody></table></div>';
  };

  const oldRenderSection=window.renderSection;
  window.renderSection=function(id){
    const map={cards:renderCards,fixed:renderFixed,variable:renderVariable,income:renderIncome,debts:renderDebts,projection:renderProjection,dashboard:renderDashboard};
    if(map[id])return map[id]();
    return oldRenderSection(id);
  };

  const oldRenderAll=window.renderAll;
  window.renderAll=function(){
    oldRenderAll();
    ['dashboard','cards','fixed','variable','income','debts','projection'].forEach(id=>renderSection(id));
  };

  window.openQuickTransaction=function(){go('variable')};
})();