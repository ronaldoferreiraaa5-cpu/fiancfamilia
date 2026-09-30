
(function(){
  const L=FinanouseLegacy;
  window.editCash=async function(){
    const v=prompt('Valor disponível em caixa:',String(S.settings.cash||0)); if(v===null)return;
    const cash=Number(String(v).replace(',','.')); if(Number.isNaN(cash))return toast('Valor inválido.');
    const{error}=await sb.from('household_settings').upsert({household_id:S.household.id,cash});
    if(error)return toast(error.message); toast('Caixa atualizado.'); await loadAll();
  };

  window.openLegacyForm=async function(t,item={}){
    const base={user_id:S.user.id,household_id:S.household.id};
    let payload={...base};
    if(t==='cards'){
      const description=prompt('Descrição da compra:',item.description||''); if(!description)return;
      const total=Number(String(prompt('Valor total:',item.total||0)||'0').replace(',','.'));
      const installments=Number(prompt('Número de parcelas:',item.installments||1)||1);
      const first_month=prompt('Primeira fatura (AAAA-MM):',item.first_month||mk()); if(!first_month)return;
      payload={...base,description,total,installments,first_month};
    }
    if(t==='fixed'){
      const description=prompt('Descrição do gasto fixo:',item.description||''); if(!description)return;
      const amount=Number(String(prompt('Valor mensal:',item.amount||0)||'0').replace(',','.'));
      const start_month=prompt('Início (AAAA-MM):',item.start_month||mk()); if(!start_month)return;
      const end_month=prompt('Fim (AAAA-MM) ou deixe vazio:',item.end_month||'')||null;
      payload={...base,description,amount,start_month,end_month};
    }
    if(t==='variable'){
      const description=prompt('Descrição do gasto variável:',item.description||''); if(!description)return;
      const amount=Number(String(prompt('Valor:',item.amount||0)||'0').replace(',','.'));
      const month=prompt('Mês (AAAA-MM):',item.month||mk()); if(!month)return;
      payload={...base,description,amount,month};
    }
    if(t==='income'){
      const description=prompt('Descrição da receita:',item.description||''); if(!description)return;
      const amount=Number(String(prompt('Valor:',item.amount||0)||'0').replace(',','.'));
      const month=prompt('Mês inicial (AAAA-MM):',item.month||mk()); if(!month)return;
      const recurring=confirm('Essa receita é recorrente?');
      const already_in_cash=confirm('Esse valor já está no caixa atual?');
      payload={...base,description,amount,month,recurring,already_in_cash,kind:item.kind||'other',end_month:item.end_month||null};
    }
    if(t==='debts'){
      const description=prompt('Descrição da dívida:',item.description||''); if(!description)return;
      const amount=Number(String(prompt('Valor:',item.amount||0)||'0').replace(',','.'));
      const due_month=prompt('Mês de vencimento (AAAA-MM):',item.due_month||mk()); if(!due_month)return;
      const ownerEntity=S.entities.find(e=>e.id===item.owner_entity_id)||S.entities.find(e=>e.kind==='shared')||S.entities[0];
      payload={...base,description,amount,due_month,paid:item.paid||false,owner_entity_id:ownerEntity?.id||null,owner:ownerEntity?.name||'Casa'};
    }
    const{error}=item.id?await sb.from(t).update(payload).eq('id',item.id):await sb.from(t).insert(payload);
    if(error)return toast('Erro: '+error.message);
    toast('Salvo com sucesso.'); await loadAll();
  };

  window.editLegacy=function(t,id){const item=S[t].find(x=>x.id===id);if(item)openLegacyForm(t,item)};
  window.deleteLegacy=async function(t,id){if(!confirm('Excluir este item?'))return;const{error}=await sb.from(t).delete().eq('id',id);if(error)return toast(error.message);toast('Item excluído.');await loadAll()};
})();