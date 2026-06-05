import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { FileCheck, Printer, UserPlus, Trash2, Search, X, Plus, Tag, Calendar, Package, Hash, Receipt, Percent, FileText, Edit2, Recycle, AlertTriangle, ChevronDown } from 'lucide-react';
import { supabase } from '../supabase';

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
}

interface ItemNF {
  id: string;
  data: string;
  codigo: string;
  medicamento: string;
  lote: string;
  ncm: string;
  cest: string;
  cfop: string;
  quantidade: string;
  desconto: string;
  preco_unitario: string;
  preco_final: string;
}

export const NotasFiscais = ({ session }: { session: any }) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'vencidos'>('empresa');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Coleta configuration states for "NF Vencidos" tab
  const [coletaRazaoSocial, setColetaRazaoSocial] = useState('');
  const [coletaCnpj, setColetaCnpj] = useState('');
  const [coletaEndereco, setColetaEndereco] = useState('');
  const [coletaCidadeUf, setColetaCidadeUf] = useState('');
  const [coletaCep, setColetaCep] = useState('');
  const [showNewClienteForm, setShowNewClienteForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [clienteName, setClienteName] = useState('');
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [clienteCidade, setClienteCidade] = useState('');
  const [clienteUf, setClienteUf] = useState('');
  const [clienteCep, setClienteCep] = useState('');

  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [currentItemNF, setCurrentItemNF] = useState<ItemNF>({
    id: crypto.randomUUID(),
    data: new Date().toISOString().split('T')[0],
    codigo: '',
    medicamento: '',
    lote: '',
    ncm: '',
    cest: '',
    cfop: '',
    quantidade: '1',
    desconto: '0',
    preco_unitario: '',
    preco_final: '0,00'
  });

  const [itensNF, setItensNF] = useState<ItemNF[]>([]);
  
  const handleCurrentItemChange = (field: keyof ItemNF, value: string) => {
    setCurrentItemNF(prev => {
      const updatedItem = { ...prev, [field]: value };
      
      const qtdStr = updatedItem.quantidade ? updatedItem.quantidade.toString().replace(/\D/g, '') : '0';
      const qtd = parseFloat(qtdStr) || 0;
      const precoNumStr = updatedItem.preco_unitario ? updatedItem.preco_unitario.replace(/\./g, '').replace(',', '.') : '0';
      const preco = parseFloat(precoNumStr) || 0;
      const subtotal = qtd * preco;

      if (field === 'quantidade' || field === 'desconto' || field === 'preco_unitario') {
        const descStr = updatedItem.desconto ? updatedItem.desconto.replace(/\./g, '').replace(',', '.') : '0';
        const desc = parseFloat(descStr) || 0;
        
        const descontoValor = subtotal * (desc / 100);
        const total = subtotal - descontoValor;
        
        updatedItem.preco_final = total.toFixed(2).replace('.', ',');
      } else if (field === 'preco_final') {
        const finalPriceStr = updatedItem.preco_final ? updatedItem.preco_final.replace(/\./g, '').replace(',', '.') : '0';
        const finalPrice = parseFloat(finalPriceStr) || 0;

        if (subtotal > 0 && finalPrice <= subtotal) {
          const discountVal = subtotal - finalPrice;
          const discountPercent = (discountVal / subtotal) * 100;
          updatedItem.desconto = discountPercent.toFixed(2).replace('.', ',');
        } else {
          updatedItem.desconto = '0';
        }
      }
      
      return updatedItem;
    });
  };

  const addItemNF = () => {
    if (!currentItemNF.medicamento.trim() || !currentItemNF.preco_unitario.trim()) {
      alert('Por favor, preencha o medicamento e o valor unitário.');
      return;
    }
    
    // Check if modifying existing item
    const existingIndex = itensNF.findIndex(i => i.id === currentItemNF.id);
    if (existingIndex >= 0) {
      const updatedItens = [...itensNF];
      updatedItens[existingIndex] = currentItemNF;
      setItensNF(updatedItens);
    } else {
      setItensNF([...itensNF, { ...currentItemNF, id: crypto.randomUUID() }]);
    }
    
    setCurrentItemNF({
      id: crypto.randomUUID(),
      data: new Date().toISOString().split('T')[0],
      codigo: '',
      medicamento: '',
      lote: '',
      ncm: '',
      cest: '',
      cfop: '',
      quantidade: '1',
      desconto: '0',
      preco_unitario: '',
      preco_final: '0,00'
    });
  };

  const handleEditItemNF = (item: ItemNF) => {
    setCurrentItemNF(item);
  };

  const removeItemNF = (id: string) => {
    setItensNF(itensNF.filter(item => item.id !== id));
  };

  // Vencidos states and handlers
  const [itensVencidos, setItensVencidos] = useState<ItemNF[]>([]);
  const [currentVencidosId, setCurrentVencidosId] = useState<string | null>(null);
  const [isLoadingVencidos, setIsLoadingVencidos] = useState(false);
  const [isSavingVencidos, setIsSavingVencidos] = useState(false);
  const [isDeletingVencidos, setIsDeletingVencidos] = useState(false);

  const [currentItemVencidos, setCurrentItemVencidos] = useState<ItemNF>({
    id: crypto.randomUUID(),
    data: new Date().toISOString().split('T')[0],
    codigo: '',
    medicamento: '',
    lote: '',
    ncm: '',
    cest: '',
    cfop: '',
    quantidade: '1',
    desconto: '0',
    preco_unitario: '',
    preco_final: '0,00'
  });

  const handleCurrentItemVencidosChange = (field: keyof ItemNF, value: string) => {
    setCurrentItemVencidos(prev => {
      const updatedItem = { ...prev, [field]: value };
      
      const qtdStr = updatedItem.quantidade ? updatedItem.quantidade.toString().replace(/\D/g, '') : '0';
      const qtd = parseFloat(qtdStr) || 0;
      const precoNumStr = updatedItem.preco_unitario ? updatedItem.preco_unitario.replace(/\./g, '').replace(',', '.') : '0';
      const preco = parseFloat(precoNumStr) || 0;
      const subtotal = qtd * preco;

      updatedItem.preco_final = subtotal.toFixed(2).replace('.', ',');
      
      return updatedItem;
    });
  };

  const addItemVencidos = () => {
    if (!currentItemVencidos.medicamento.trim() || !currentItemVencidos.preco_unitario.trim()) {
      alert('Por favor, preencha o medicamento e o valor unitário.');
      return;
    }
    
    const existingIndex = itensVencidos.findIndex(i => i.id === currentItemVencidos.id);
    if (existingIndex >= 0) {
      const updatedItens = [...itensVencidos];
      updatedItens[existingIndex] = currentItemVencidos;
      setItensVencidos(updatedItens);
    } else {
      setItensVencidos([...itensVencidos, { ...currentItemVencidos, id: crypto.randomUUID() }]);
    }
    
    setCurrentItemVencidos({
      id: crypto.randomUUID(),
      data: new Date().toISOString().split('T')[0],
      codigo: '',
      medicamento: '',
      lote: '',
      ncm: '',
      cest: '',
      cfop: '',
      quantidade: '1',
      desconto: '0',
      preco_unitario: '',
      preco_final: '0,00'
    });
  };

  const removeItemVencidos = (id: string) => {
    setItensVencidos(itensVencidos.filter(item => item.id !== id));
  };

  const handleEditItemVencidos = (item: ItemNF) => {
    setCurrentItemVencidos(item);
  };

  const loadVencidosFromLocalStorage = () => {
    try {
      const localItems = localStorage.getItem('itens_vencidos_local');
      if (localItems) {
        setItensVencidos(JSON.parse(localItems));
      } else {
        setItensVencidos([]);
      }
    } catch (e) {
      console.error('Erro ao ler localStorage de vencidos:', e);
    }
  };

  const saveVencidosToLocalStorageFallback = (items: ItemNF[]) => {
    try {
      localStorage.setItem('itens_vencidos_local', JSON.stringify(items));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  };

  const fetchVencidosNotaFiscal = async () => {
    setIsLoadingVencidos(true);
    try {
      // Tenta buscar no Supabase
      const { data: itemsData, error: itemsError } = await supabase
        .from('itens_vencidos')
        .select('*')
        .eq('user_id', session?.user?.id);
          
      if (itemsError) throw itemsError;
      
      if (itemsData && itemsData.length > 0) {
        const parsedItems: ItemNF[] = itemsData.map(item => ({
          id: item.id,
          data: item.data_item,
          codigo: item.codigo || '',
          medicamento: item.medicamento,
          lote: item.lote || '',
          ncm: item.ncm || '',
          cest: item.cest || '',
          cfop: item.cfop || '',
          quantidade: item.quantidade.toString(),
          desconto: '0',
          preco_unitario: item.preco_unitario.toFixed(2).replace('.', ','),
          preco_final: item.preco_final.toFixed(2).replace('.', ',')
        }));
        setItensVencidos(parsedItems);
      } else {
        setItensVencidos([]);
      }
    } catch (error) {
      console.error('Erro ao buscar NFs de Vencidos:', error);
      loadVencidosFromLocalStorage();
    } finally {
      setIsLoadingVencidos(false);
    }
  };

  const handleSaveVencidosNF = async () => {
    if (itensVencidos.length === 0) return;
    setIsSavingVencidos(true);
    
    try {
      if (session?.user?.id) {
        // Primeiro limpa os anteriores deste usuario
        await supabase.from('itens_vencidos').delete().eq('user_id', session.user.id);

        const itemsToInsert = itensVencidos.map(item => ({
          id: item.id.includes('-') && item.id.length > 20 ? item.id : crypto.randomUUID(),
          user_id: session.user.id,
          data_item: item.data,
          codigo: item.codigo || null,
          medicamento: item.medicamento,
          lote: item.lote || null,
          ncm: item.ncm || null,
          cest: item.cest || null,
          cfop: item.cfop || null,
          quantidade: parseFloat(item.quantidade),
          preco_unitario: parseFloat((item.preco_unitario || '0').toString().replace(/\./g, '').replace(',', '.')) || 0,
          preco_final: parseFloat((item.preco_final || '0').toString().replace(/\./g, '').replace(',', '.')) || 0
        }));

        const { error: itemsError } = await supabase
          .from('itens_vencidos')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      saveVencidosToLocalStorageFallback(itensVencidos);
      alert('Itens de Vencidos salvos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar no Supabase (vamos salvar localmente):', error);
      saveVencidosToLocalStorageFallback(itensVencidos);
      alert('Itens de Vencidos salvos localmente por segurança!');
    } finally {
      setIsSavingVencidos(false);
    }
  };

  const handleLimparVencidosNF = () => {
    setShowLimparConfirmVencidos(true);
  };

  const confirmLimparVencidosNF = async () => {
    setShowLimparConfirmVencidos(false);
    setIsDeletingVencidos(true);
    try {
      if (session?.user?.id) {
        await supabase.from('itens_vencidos').delete().eq('user_id', session.user.id);
      }
    } catch (e) {
      console.warn('Erro ao deletar do Supabase, limpando localmente:', e);
    } finally {
      setItensVencidos([]);
      localStorage.removeItem('itens_vencidos_local');
      setCurrentItemVencidos({
        id: crypto.randomUUID(),
        data: new Date().toISOString().split('T')[0],
        codigo: '',
        medicamento: '',
        lote: '',
        ncm: '',
        cest: '',
        cfop: '',
        quantidade: '1',
        desconto: '0',
        preco_unitario: '',
        preco_final: '0,00'
      });
      setIsDeletingVencidos(false);
      alert('Nota Fiscal de Vencidos limpa com sucesso!');
    }
  };

  const handlePrintEspelhoVencidos = () => {
    if (itensVencidos.length === 0) return;

    const totalNum = itensVencidos.reduce((acc, item) => {
      return acc + (parseFloat(item.preco_final.replace(',', '.')) || 0);
    }, 0);
    const totalFormatado = totalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dataFormatada = new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 1.5cm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.5; margin: 0; }
          
          .titulo-doc { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
          
          /* CAIXA ÚNICA DO DESTINATÁRIO */
          .caixa-info { border: 1px solid #000; padding: 15px; margin-bottom: 20px; }
          
          /* TABELA DE ITENS */
          .tabela-itens { width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: center; font-size: 11px; }
          .tabela-itens th { border: 1px solid #000; padding: 8px; background: #f2f2f2; font-size: 10px; }
          .tabela-itens td { border: 1px solid #000; padding: 8px; }
          .tabela-itens td.text-left { text-align: left; }
          
          /* REGRA MÁGICA: Impede que o R$ separe do número */
          .nao-quebrar { white-space: nowrap; }
          
          /* TOTAL SIMPLES */
          .total-simples { text-align: right; font-size: 14px; font-weight: bold; margin-top: 10px; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>

        <div class="titulo-doc">ESPELHO DE DADOS PARA EMISSÃO DE NOTA FISCAL (VENCIDOS)</div>

        <div class="caixa-info">
          <b>Razão Social / Nome do Destinatário:</b> ${coletaRazaoSocial || '-'} <br>
          <b>CNPJ / CPF:</b> ${coletaCnpj || '-'} <br>
          <b>Endereço:</b> ${coletaEndereco || '-'} &nbsp;|&nbsp; 
          <b>Cidade / UF:</b> ${coletaCidadeUf || '-'} &nbsp;|&nbsp; 
          <b>CEP:</b> ${coletaCep || '-'} <br>
          <b>Data de Fechamento:</b> ${dataFormatada}
        </div>

        <table class="tabela-itens">
          <thead>
            <tr>
              <th width="7%">CÓD</th>
              <th width="32%">MEDICAMENTO / PRODUTO</th>
              <th width="8%">LOTE</th>
              <th width="9%">NCM</th>
              <th width="8%">CEST</th>
              <th width="5%">CFOP</th>
              <th width="5%">QTD</th>
              <th width="12%">V. UNIT</th>
              <th width="14%">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itensVencidos.map(item => `
              <tr>
                <td>${item.codigo || '-'}</td>
                <td class="text-left"><b>${item.medicamento}</b></td>
                <td>${item.lote || '-'}</td>
                <td>${item.ncm || '-'}</td>
                <td>${item.cest || '-'}</td>
                <td>${item.cfop || '-'}</td>
                <td>${item.quantidade}</td>
                <td class="nao-quebrar">R$ ${item.preco_unitario}</td>
                <td class="nao-quebrar"><b>R$ ${item.preco_final}</b></td>
              </tr>
            `).join('')}
            ${itensVencidos.length === 0 ? `<tr><td colspan="9">Nenhum item adicionado.</td></tr>` : ''}
          </tbody>
        </table>

        <div class="total-simples">
          TOTAL GERAL DA NOTA: R$ ${totalFormatado}
        </div>

      </body>
      </html>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const filenameBase = (coletaRazaoSocial || 'vencidos').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const opt = {
      margin:       15,
      filename:     `espelho_nf_vencidos_${filenameBase}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const win = window.open('', '_blank');
    if (win) {
      win.document.write('<html><body style="font-family: sans-serif; padding: 20px;">Gerando PDF, por favor aguarde...</body></html>');
    }

    html2pdf().set(opt).from(wrapper).outputPdf('blob').then((pdfBlob: Blob) => {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      if (win) {
        win.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, '_blank');
      }
    });
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const calcularTotalNota = () => {
    const total = itensNF.reduce((acc, item) => {
      return acc + (parseFloat(item.preco_final.replace(',', '.')) || 0);
    }, 0);
    return total;
  };

  const [currentNFId, setCurrentNFId] = useState<string | null>(null);
  const [isLoadingNF, setIsLoadingNF] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [comprovanteDate, setComprovanteDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLimparConfirmNF, setShowLimparConfirmNF] = useState(false);
  const [showLimparConfirmVencidos, setShowLimparConfirmVencidos] = useState(false);

  useEffect(() => {
    if (selectedClienteId) {
      fetchClienteNotaFiscal(selectedClienteId);
    } else {
      setItensNF([]);
      setCurrentNFId(null);
    }
  }, [selectedClienteId]);

  const fetchClienteNotaFiscal = async (clienteId: string) => {
    setIsLoadingNF(true);
    try {
      const { data: nfData, error: nfError } = await supabase
        .from('notas_fiscais_nf')
        .select('*')
        .eq('cliente_nf_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (nfError && nfError.code !== 'PGRST116') {
        throw nfError;
      }
      
      if (nfData) {
        setCurrentNFId(nfData.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('itens_nf')
          .select('*')
          .eq('nota_fiscal_id', nfData.id);
          
        if (itemsError) throw itemsError;
        
        if (itemsData && itemsData.length > 0) {
          const parsedItems: ItemNF[] = itemsData.map(item => ({
            id: item.id,
            data: item.data_item,
            codigo: item.codigo || '',
            medicamento: item.medicamento,
            lote: item.lote || '',
            ncm: item.ncm || '',
            cest: item.cest || '',
            cfop: item.cfop || '',
            quantidade: item.quantidade.toString(),
            desconto: item.desconto.toString().replace('.', ','),
            preco_unitario: item.preco_unitario.toFixed(2).replace('.', ','),
            preco_final: item.preco_final.toFixed(2).replace('.', ',')
          }));
          setItensNF(parsedItems);
        } else {
          setItensNF([]);
        }
      } else {
        setCurrentNFId(null);
        setItensNF([]);
      }
    } catch (error) {
      console.error('Erro ao buscar NF do cliente:', error);
    } finally {
      setIsLoadingNF(false);
    }
  };

  const handleLimparNF = () => {
    setShowLimparConfirmNF(true);
  };

  const confirmLimparNF = async () => {
    setShowLimparConfirmNF(false);
    setIsDeleting(true);
    try {
      if (currentNFId) {
        await supabase.from('itens_nf').delete().eq('nota_fiscal_id', currentNFId);
        await supabase.from('notas_fiscais_nf').delete().eq('id', currentNFId);
      }
      
      setItensNF([]);
      setCurrentNFId(null);
      setCurrentItemNF({
        id: crypto.randomUUID(),
        data: new Date().toISOString().split('T')[0],
        codigo: '',
        medicamento: '',
        lote: '',
        ncm: '',
        cest: '',
        cfop: '',
        quantidade: '1',
        desconto: '0',
        preco_unitario: '',
        preco_final: '0,00'
      });
      alert('Nota Fiscal limpa com sucesso!');
    } catch (error: any) {
      console.error('Erro ao limpar NF:', error);
      alert('Erro ao limpar Nota Fiscal: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintEspelho = () => {
    const cliente = clientes.find(c => c.id === selectedClienteId);
    if (!cliente || itensNF.length === 0) return;

    const totalNum = calcularTotalNota();
    const totalFormatado = totalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dataFormatada = new Date().toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 1.5cm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.5; margin: 0; }
          
          .titulo-doc { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
          
          /* CAIXA ÚNICA DO DESTINATÁRIO */
          .caixa-info { border: 1px solid #000; padding: 15px; margin-bottom: 20px; }
          
          /* TABELA DE ITENS */
          .tabela-itens { width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: center; font-size: 11px; }
          .tabela-itens th { border: 1px solid #000; padding: 8px; background: #f2f2f2; font-size: 10px; }
          .tabela-itens td { border: 1px solid #000; padding: 8px; }
          .tabela-itens td.text-left { text-align: left; }
          
          /* REGRA MÁGICA: Impede que o R$ separe do número */
          .nao-quebrar { white-space: nowrap; }
          
          /* TOTAL SIMPLES */
          .total-simples { text-align: right; font-size: 14px; font-weight: bold; margin-top: 10px; padding-bottom: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>

        <div class="titulo-doc">ESPELHO DE DADOS PARA EMISSÃO DE NOTA FISCAL</div>

        <div class="caixa-info">
          <b>Razão Social / Nome do Destinatário:</b> ${cliente.nome || '-'} <br>
          <b>CNPJ / CPF:</b> ${cliente.cpf_cnpj || '-'} <br>
          <b>Endereço:</b> ${cliente.endereco || '-'} &nbsp;|&nbsp; 
          <b>Cidade / UF:</b> ${(cliente.cidade || '') + (cliente.cidade && cliente.uf ? '/' : '') + (cliente.uf || '') || '-'} &nbsp;|&nbsp; 
          <b>CEP:</b> ${cliente.cep || '-'} <br>
          <b>Data de Fechamento:</b> ${dataFormatada}
        </div>

        <table class="tabela-itens">
          <thead>
            <tr>
              <th width="7%">CÓD</th>
              <th width="32%">MEDICAMENTO / PRODUTO</th>
              <th width="8%">LOTE</th>
              <th width="9%">NCM</th>
              <th width="8%">CEST</th>
              <th width="5%">CFOP</th>
              <th width="5%">QTD</th>
              <th width="12%">V. UNIT</th>
              <th width="14%">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itensNF.map(item => `
              <tr>
                <td>${item.codigo || '-'}</td>
                <td class="text-left"><b>${item.medicamento}</b></td>
                <td>${item.lote || '-'}</td>
                <td>${item.ncm || '-'}</td>
                <td>${item.cest || '-'}</td>
                <td>${item.cfop || '-'}</td>
                <td>${item.quantidade}</td>
                <td class="nao-quebrar">R$ ${item.preco_unitario}</td>
                <td class="nao-quebrar"><b>R$ ${item.preco_final}</b></td>
              </tr>
            `).join('')}
            ${itensNF.length === 0 ? `<tr><td colspan="9">Nenhum item adicionado.</td></tr>` : ''}
          </tbody>
        </table>

        <div class="total-simples">
          TOTAL GERAL DA NOTA: R$ ${totalFormatado}
        </div>

      </body>
      </html>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const opt = {
      margin:       15,
      filename:     `espelho_nf_${cliente.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const win = window.open('', '_blank');
    if (win) {
      win.document.write('<html><body style="font-family: sans-serif; padding: 20px;">Gerando PDF, por favor aguarde...</body></html>');
    }

    html2pdf().set(opt).from(wrapper).outputPdf('blob').then((pdfBlob: Blob) => {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      if (win) {
        win.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, '_blank');
      }
    });
  };

  const handlePrintComprovante = () => {
    if (!selectedClienteId || itensNF.length === 0) return;
    const uniqueDates = Array.from(new Set(itensNF.map(item => item.data))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    setComprovanteDate(uniqueDates[0]);
    setShowComprovanteModal(true);
  };

  const executePrintComprovante = () => {
    const cliente = clientes.find(c => c.id === selectedClienteId);
    if (!cliente || itensNF.length === 0) return;

    const itemsSelecionados = itensNF.filter(item => item.data === comprovanteDate);

    if (itemsSelecionados.length === 0) {
      alert('Não há itens salvos com a data selecionada para gerar o comprovante.');
      return;
    }

    const totalNum = itemsSelecionados.reduce((acc, item) => acc + (parseFloat(item.preco_final.replace(/\./g, '').replace(',', '.')) || 0), 0);
    const totalFormatado = totalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const dataFormatada = new Date(comprovanteDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 1.5cm; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; line-height: 1.4; margin: 0; }
          
          .cabecalho { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          .info-table td { border: 1px solid #000; padding: 12px; vertical-align: top; }
          
          .tabela-itens { width: 100%; border-collapse: collapse; margin-bottom: 15px; text-align: center; font-size: 11px; }
          .tabela-itens th { border: 1px solid #000; padding: 6px; background: #f2f2f2; font-size: 10px; }
          .tabela-itens td { border: 1px solid #000; padding: 6px; }
          .tabela-itens td.text-left { text-align: left; }
          
          .total { text-align: right; font-size: 14px; font-weight: bold; margin-bottom: 50px; }
          
          .assinatura { margin-top: 50px; text-align: center; width: 45%; margin-left: auto; margin-right: auto; font-size: 12px; padding-bottom: 20px; }
          .linha-assinatura { border-top: 1px solid #000; margin-bottom: 5px; }
          .data-assinatura { margin-top: 8px; font-size: 12px; font-weight: normal; color: #000; }
          
          .nao-quebrar { white-space: nowrap; }
        </style>
      </head>
      <body>

        <div class="cabecalho">AGAFARMA TUPARENDI</div>
        
        <table class="info-table">
          <tr>
            <td style="width: 50%;">
              <b style="font-size: 12px;">EMITENTE:</b><br><br>
              <b>Razão Social:</b> LUIZ MOACIR MACHRY<br>
              <b>CNPJ:</b> 89.055.768/0001-76
            </td>
            <td style="width: 50%;">
              <b style="font-size: 12px;">DESTINATÁRIO:</b><br><br>
              <b>Nome / Razão:</b> ${cliente.nome || '-'}<br>
              <b>CNPJ / CPF:</b> ${cliente.cpf_cnpj || '-'}
            </td>
          </tr>
        </table>

        <table class="tabela-itens">
          <thead>
            <tr>
              <th width="10%">CÓDIGO</th>
              <th width="45%">DESCRIÇÃO DO PRODUTO</th>
              <th width="8%">QTD</th>
              <th width="12%">V. UNIT</th>
              <th width="10%">DESC(%)</th>
              <th width="15%">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsSelecionados.map(item => `
              <tr>
                <td>${item.codigo || '-'}</td>
                <td class="text-left"><b>${item.medicamento}</b></td>
                <td>${item.quantidade}</td>
                <td class="nao-quebrar">R$ ${item.preco_unitario}</td>
                <td>${item.desconto && item.desconto !== '0' && item.desconto !== '0,00' ? item.desconto + '%' : '-'}</td>
                <td class="nao-quebrar"><b>R$ ${item.preco_final}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">TOTAL: R$ ${totalFormatado}</div>

        <div class="assinatura">
          <div class="linha-assinatura"></div>
          Assinatura
          <div class="data-assinatura">Data: ${dataFormatada}</div>
        </div>

      </body>
      </html>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const opt = {
      margin:       15,
      filename:     `comprovante_entrega_${cliente.nome.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const win = window.open('', '_blank');
    if (win) {
      win.document.write('<html><body style="font-family: sans-serif; padding: 20px;">Gerando PDF, por favor aguarde...</body></html>');
    }

    html2pdf().set(opt).from(wrapper).outputPdf('blob').then((pdfBlob: Blob) => {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      if (win) {
        win.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, '_blank');
      }
    });

    setShowComprovanteModal(false);
  };

  const handleSaveNF = async () => {
    if (!selectedClienteId) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    if (itensNF.length === 0) {
      alert("Adicione pelo menos um item à nota fiscal.");
      return;
    }

    setIsSaving(true);
    try {
      const totalNota = calcularTotalNota();
      let nfId = currentNFId;
      
      if (nfId) {
        const { error: updateError } = await supabase
          .from('notas_fiscais_nf')
          .update({ valor_total: totalNota })
          .eq('id', nfId);
        if (updateError) throw updateError;
        
        // Em vez de deletar tudo e inserir novamente, 
        // localiza quais itens foram de fato removidos pelo usuário
        const { data: dbItems } = await supabase
          .from('itens_nf')
          .select('id')
          .eq('nota_fiscal_id', nfId);
          
        if (dbItems) {
          const itemsToRemove = dbItems.filter(dbItem => !itensNF.some(localItem => localItem.id === dbItem.id));
          if (itemsToRemove.length > 0) {
            const { error: deleteError } = await supabase
              .from('itens_nf')
              .delete()
              .in('id', itemsToRemove.map(i => i.id));
            if (deleteError) {
              console.warn("Erro ao deletar itens removidos (verifique suas RLS policies de DELETE):", deleteError);
            }
          }
        }
      } else {
        const { data: nfData, error: nfError } = await supabase
          .from('notas_fiscais_nf')
          .insert([{
            user_id: session.user.id,
            cliente_nf_id: selectedClienteId,
            valor_total: totalNota
          }])
          .select()
          .single();
          
        if (nfError) throw nfError;
        nfId = nfData.id;
        setCurrentNFId(nfId);
      }

      const itemsToInsert = itensNF.map(item => ({
        id: item.id,
        nota_fiscal_id: nfId,
        data_item: item.data,
        codigo: item.codigo,
        medicamento: item.medicamento,
        lote: item.lote,
        ncm: item.ncm,
        cest: item.cest,
        cfop: item.cfop,
        quantidade: parseFloat(item.quantidade),
        desconto: parseFloat((item.desconto || '0').toString().replace(/\./g, '').replace(',', '.')) || 0,
        preco_unitario: parseFloat((item.preco_unitario || '0').toString().replace(/\./g, '').replace(',', '.')) || 0,
        preco_final: parseFloat((item.preco_final || '0').toString().replace(/\./g, '').replace(',', '.')) || 0
      }));

      const { error: itemsError } = await supabase
        .from('itens_nf')
        .upsert(itemsToInsert);

      if (itemsError) throw itemsError;

      alert("Nota Fiscal salva com sucesso!");
    } catch (error: any) {
      console.error('Erro ao salvar NF:', error);
      alert('Erro ao salvar Nota Fiscal: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchClientes();
      fetchColetaSettings();
      fetchVencidosNotaFiscal();
    }
  }, [session]);

  const fetchColetaSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('coleta_razao_social, coleta_cnpj, coleta_endereco, coleta_cidade_uf, coleta_cep')
        .single();
        
      if (data) {
        if (data.coleta_razao_social) setColetaRazaoSocial(data.coleta_razao_social);
        if (data.coleta_cnpj) setColetaCnpj(data.coleta_cnpj);
        if (data.coleta_endereco) setColetaEndereco(data.coleta_endereco);
        if (data.coleta_cidade_uf) setColetaCidadeUf(data.coleta_cidade_uf);
        if (data.coleta_cep) setColetaCep(data.coleta_cep);
      }
    } catch (err) {
      console.error('Exception fetching coleta settings:', err);
    }
  };

  const fetchClientes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes_nf')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    setClienteCpfCnpj(value.substring(0, 18));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setClienteCep(value.substring(0, 9));
  };

  const handleSubmitCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('clientes_nf')
        .insert([
          { 
            user_id: session.user.id,
            nome: clienteName, 
            cpf_cnpj: clienteCpfCnpj,
            endereco: clienteEndereco || null,
            cidade: clienteCidade || null,
            uf: clienteUf || null,
            cep: clienteCep || null
          }
        ])
        .select();
        
      if (error) throw error;
      if (data && data.length > 0) {
        setClientes([...clientes, data[0]]);
        setSelectedClienteId(data[0].id);
      }
      
      resetClienteForm();
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
    }
  };

  const resetClienteForm = () => {
    setClienteName('');
    setClienteCpfCnpj('');
    setClienteEndereco('');
    setClienteCidade('');
    setClienteUf('');
    setClienteCep('');
    setShowNewClienteForm(false);
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cpf_cnpj && c.cpf_cnpj.includes(searchTerm))
  );

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <FileCheck className="w-8 h-8 lg:w-10 lg:h-10 text-[#0066b3] shrink-0" />
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">
              Espelho de NF
            </h2>
            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
              Gere rascunhos rápidos para Notas Fiscais.
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6 w-full overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button
          onClick={() => setActiveTab('empresa')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'empresa'
              ? 'border-[#0066b3] text-[#0066b3]'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
          }`}
        >
          NF Empresa
        </button>
        <button
          onClick={() => setActiveTab('vencidos')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'vencidos'
              ? 'border-[#0066b3] text-[#0066b3]'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:border-gray-600'
          }`}
        >
          NF Vencidos
        </button>
      </div>

      {activeTab === 'empresa' ? (
        <>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="flex flex-col w-full">
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">1. Selecione o Cliente</h3>
                {!showNewClienteForm && !selectedClienteId && (
                  <button 
                    onClick={() => setShowNewClienteForm(true)}
                    className="flex items-center justify-center w-10 h-10 bg-[#0066b3] text-white rounded-full hover:bg-[#005291] transition-colors shadow-sm"
                    title="Novo Cliente"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {showNewClienteForm ? (
                <div className="animate-in fade-in flex-1">
                  <div className="flex justify-between items-center pr-1 mb-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-100">Cadastrar Novo Cliente</h4>
                    <button onClick={resetClienteForm} className="text-gray-400 hover:text-gray-600 dark:text-gray-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitCliente} className="space-y-4">
                    <div>
                      <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social *</label>
                      <input 
                        type="text" 
                        id="nome"
                        required
                        value={clienteName}
                        onChange={(e) => setClienteName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        placeholder="Razão social"
                      />
                    </div>
                    <div>
                      <label htmlFor="cpf_cnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ *</label>
                      <input 
                        type="text" 
                        id="cpf_cnpj"
                        required
                        value={clienteCpfCnpj}
                        onChange={handleDocumentChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        placeholder="CNPJ"
                      />
                    </div>
                    <div>
                      <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                      <input 
                        type="text" 
                        id="endereco"
                        value={clienteEndereco}
                        onChange={(e) => setClienteEndereco(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        placeholder="Endereço Completo"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-1">
                        <label htmlFor="cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                        <input 
                          type="text" 
                          id="cep"
                          value={clienteCep}
                          onChange={handleCepChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                          placeholder="CEP"
                        />
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                        <input 
                          type="text" 
                          id="cidade"
                          value={clienteCidade}
                          onChange={(e) => setClienteCidade(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                          placeholder="Cidade"
                        />
                      </div>
                    </div>
                    <div>
                        <label htmlFor="uf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                        <input 
                          type="text" 
                          id="uf"
                          maxLength={2}
                          value={clienteUf}
                          onChange={(e) => setClienteUf(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 uppercase text-sm text-gray-900 dark:text-white"
                          placeholder="RS"
                        />
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full px-4 py-2.5 bg-[#0066b3] text-white rounded-lg hover:bg-[#005291] transition-colors font-medium shadow-sm flex items-center justify-center"
                      >
                        Salvar Cliente
                      </button>
                    </div>
                  </form>
                </div>
              ) : selectedClienteId ? (
                <div className="flex-1 flex flex-col justify-start">
                  <div className="p-5 border border-[#0066b3]/30 bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cliente Selecionado</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">
                          {clientes.find(c => c.id === selectedClienteId)?.nome}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{clientes.find(c => c.id === selectedClienteId)?.cpf_cnpj}</p>
                        {clientes.find(c => c.id === selectedClienteId)?.endereco && (
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 truncate max-w-[200px] sm:max-w-xs">
                            {clientes.find(c => c.id === selectedClienteId)?.endereco}
                            {clientes.find(c => c.id === selectedClienteId)?.cidade && ` - ${clientes.find(c => c.id === selectedClienteId)?.cidade}`}
                            {clientes.find(c => c.id === selectedClienteId)?.cep && ` (CEP: ${clientes.find(c => c.id === selectedClienteId)?.cep})`}
                          </p>
                        )}
                      </div>
                      <div className="bg-green-100 text-green-700 p-1 rounded-full">
                        <FileCheck className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedClienteId('')}
                      className="mt-6 px-4 py-2 text-sm text-[#0066b3] dark:text-blue-400 border border-[#0066b3]/30 dark:border-blue-400/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium transition-colors w-full"
                    >
                      Alterar Cliente
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                      <select
                        value={selectedClienteId || ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          if (id) {
                            const cliente = clientes.find(c => c.id === id);
                            if (cliente) {
                              setSearchTerm(cliente.nome);
                              setSelectedClienteId(id);
                            }
                          } else {
                            setSearchTerm('');
                          }
                        }}
                        className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 font-medium text-gray-800 dark:text-white appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="">Selecione um cliente cadastrado...</option>
                        {clientes.map(cliente => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome} {cliente.cpf_cnpj ? `(${cliente.cpf_cnpj})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente pelo nome ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {searchTerm.trim().length > 0 ? (
                    <div className="overflow-y-auto space-y-2 pr-2 flex-1 max-h-[400px]">
                      {filteredClientes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                          Nenhum cliente encontrado com "{searchTerm}".
                          <button 
                            onClick={() => {
                              setClienteName(searchTerm);
                              setShowNewClienteForm(true);
                            }}
                            className="mx-auto mt-4 flex items-center justify-center text-[#0066b3] font-medium hover:underline w-full p-2"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            <span>Cadastrar novo cliente</span>
                          </button>
                        </div>
                      ) : (
                        filteredClientes.map(_cliente => (
                          <div
                            key={_cliente.id}
                            onClick={() => {
                              setSelectedClienteId(_cliente.id);
                              setSearchTerm('');
                            }}
                            className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-[#0066b3] hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-gray-800 dark:text-gray-100">{_cliente.nome}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                              {_cliente.cpf_cnpj}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 flex-1 flex flex-col justify-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                      <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px] mx-auto mb-4">
                        Digite o nome ou documento do cliente para buscar no sistema.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
        </div>
        
        {/* Coluna da Direita: Itens da NF */}
        <div className="flex flex-col h-full w-full">
          <div className={`bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col transition-opacity duration-300 ${!selectedClienteId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              {itensNF.some(i => i.id === currentItemNF.id) ? '2. Editar Item' : '2. Lançar'}
            </h3>
            
            {!selectedClienteId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <FileCheck className="w-16 h-16 text-gray-200 mb-4" />
                <h4 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Selecione um cliente</h4>
                <p className="text-gray-400 text-sm max-w-[250px]">
                  Primeiro escolha o cliente na lateral para iniciar o preenchimento da NF.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full relative">
                
                {/* Formulário do Item Atual */}
                <div className="relative p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6">
                  <div className="space-y-4">
                    {/* Linha 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data</label>
                        <input
                          type="date"
                          value={currentItemNF.data}
                          onChange={(e) => handleCurrentItemChange('data', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Código</label>
                        <input
                          type="text"
                          value={currentItemNF.codigo}
                          onChange={(e) => handleCurrentItemChange('codigo', e.target.value)}
                          placeholder="Cód."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Medicamento/Produto *</label>
                        <input
                          type="text"
                          value={currentItemNF.medicamento}
                          onChange={(e) => handleCurrentItemChange('medicamento', e.target.value)}
                          placeholder="Nome do produto"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Linha 2 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Lote (opcional)</label>
                        <input
                          type="text"
                          value={currentItemNF.lote}
                          onChange={(e) => handleCurrentItemChange('lote', e.target.value)}
                          placeholder="Lote"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">NCM</label>
                        <input
                          type="text"
                          value={currentItemNF.ncm}
                          onChange={(e) => handleCurrentItemChange('ncm', e.target.value)}
                          placeholder="0000.00.00"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CEST</label>
                        <input
                          type="text"
                          value={currentItemNF.cest}
                          onChange={(e) => handleCurrentItemChange('cest', e.target.value)}
                          placeholder="00.000.00"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CFOP</label>
                        <input
                          type="text"
                          value={currentItemNF.cfop}
                          onChange={(e) => handleCurrentItemChange('cfop', e.target.value)}
                          placeholder="CFOP"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Linha 3 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                       <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade *</label>
                        <input
                          type="number"
                          min="1"
                          value={currentItemNF.quantidade}
                          onChange={(e) => handleCurrentItemChange('quantidade', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Desconto (%)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={currentItemNF.desconto}
                            onChange={(e) => handleCurrentItemChange('desconto', e.target.value)}
                            className="w-full pl-3 pr-7 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                          />
                          <Percent className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário *</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                          <input
                            type="text"
                            value={currentItemNF.preco_unitario}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              const numStr = (Number(val) / 100).toFixed(2);
                              const formatted = numStr.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                              handleCurrentItemChange('preco_unitario', formatted);
                            }}
                            placeholder="0,00"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#0066b3] mb-1">Valor Final</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0066b3]/70 text-xs font-bold">R$</span>
                          <input
                            type="text"
                            value={currentItemNF.preco_final}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              const numStr = (Number(val) / 100).toFixed(2);
                              const formatted = numStr.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                              handleCurrentItemChange('preco_final', formatted);
                            }}
                            className="w-full pl-7 pr-3 py-2 border border-[#0066b3]/30 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#0066b3] dark:text-blue-400 font-bold outline-none text-sm focus:ring-2 focus:ring-[#0066b3] focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex justify-start">
                    <button
                      onClick={addItemNF}
                      className={`px-6 py-2.5 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm ${itensNF.some(i => i.id === currentItemNF.id) ? 'bg-[#ff9800] hover:bg-[#f57c00]' : 'bg-[#4CAF50] hover:bg-[#388E3C]'}`}
                    >
                      <Plus className="w-4 h-4" />
                      {itensNF.some(i => i.id === currentItemNF.id) ? 'Atualizar' : 'Adicionar'}
                    </button>
                  </div>
                </div>

                {/* Tabela de Itens Adicionados */}
                {itensNF.length > 0 && (
                  <div className="mt-4 space-y-4 sm:space-y-0 sm:mt-2">
                    {/* View Mobile (Cards) */}
                    <div className="block sm:hidden space-y-3">
                      {itensNF.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm relative">
                          <div className="flex justify-between items-start mb-3">
                            <div className="pr-12">
                               <span className="font-bold text-gray-800 dark:text-gray-100 block text-base">{item.codigo ? `${item.codigo} - ` : ''}{item.medicamento}</span>
                               <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex gap-1 absolute top-3 right-3">
                               <button onClick={() => handleEditItemNF(item)} className="p-2 text-blue-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={() => removeItemNF(item.id)} className="p-2 text-red-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">Quantidade</span> <span className="font-medium text-gray-800 dark:text-gray-100">{item.quantidade}</span></div>
                            <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">V. Unitário</span> <span className="font-medium text-gray-800 dark:text-gray-100">R$ {item.preco_unitario}</span></div>
                            {item.desconto && item.desconto !== '0' && item.desconto !== '0,00' ? (
                              <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">Desconto</span> <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800">{item.desconto}%</span></div>
                            ) : (
                              <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">Desconto</span> <span className="text-gray-400">-</span></div>
                            )}
                            <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">V. Total</span> <span className="font-bold text-[#0066b3]">R$ {item.preco_final}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View Desktop (Tabela) */}
                    <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Data</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Cód</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Produto</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Qtd</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-right">P. Unit (R$)</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-right">Total Final</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {itensNF.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50">
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {new Date(item.data).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.codigo || '-'}</td>
                              <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{item.medicamento}</td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-center">{item.quantidade}</td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-right">
                                R$ {item.preco_unitario}
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#0066b3] text-right">
                                R$ {item.preco_final}
                              </td>
                              <td className="py-3 px-4 flex justify-center items-center gap-1">
                                <button
                                  onClick={() => handleEditItemNF(item)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Editar Item"
                                >
                                  <Edit2 className="w-4 h-4 mx-auto" />
                                </button>
                                <button
                                  onClick={() => removeItemNF(item.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
                    <div className="w-full sm:w-auto text-center sm:text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Valor Total da Nota</p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-1">
                        {calcularTotalNota().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="flex justify-center sm:justify-end gap-3 w-full sm:w-auto">
                      <button 
                        onClick={handleLimparNF}
                        disabled={isSaving || isDeleting || (!currentNFId && itensNF.length === 0)}
                        className="w-12 h-12 sm:w-auto sm:h-auto sm:px-6 sm:py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                        title="Limpar NF"
                      >
                        <Trash2 className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Limpar NF</span>
                      </button>
                      <button 
                        onClick={handleSaveNF}
                        disabled={isSaving || isDeleting || itensNF.length === 0}
                        className="w-12 h-12 sm:w-auto sm:h-auto sm:px-8 sm:py-3 bg-[#0066b3] text-white rounded-full hover:bg-[#005291] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                        title="Salvar NF"
                      >
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar NF'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePrintComprovante}
                      disabled={itensNF.length === 0}
                      className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-[#0066b3] border border-[#0066b3]/30 rounded-xl hover:bg-blue-50 dark:bg-blue-900/20 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:border-transparent disabled:cursor-not-allowed transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5 text-[#0066b3]" />
                      Comprovante de Entrega
                    </button>
                    <button
                      onClick={handlePrintEspelho}
                      disabled={itensNF.length === 0}
                      className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      Espelho da Nota Fiscal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="flex flex-col w-full">
              {/* 1. Empresa de Reciclagem */}
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">1. Empresa de Reciclagem</h3>
                </div>
                
                <div className="flex-1 flex flex-col justify-start">
                  <div className="p-5 border border-green-500/25 bg-green-50/20 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        {coletaRazaoSocial ? (
                          <>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">
                              {coletaRazaoSocial}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{coletaCnpj}</p>
                            {coletaEndereco && (
                              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1.5 space-y-0.5">
                                <p>{coletaEndereco}</p>
                                {(coletaCidadeUf || coletaCep) && (
                                  <p>
                                    {coletaCidadeUf}
                                    {coletaCep && ` (CEP: ${coletaCep})`}
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <p className="text-amber-600 text-sm font-medium">Nenhuma empresa configurada</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                              Por favor, configure os dados de Coleta nas Configurações para exibir aqui.
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="bg-green-100 text-green-700 p-1.5 rounded-full shrink-0 ml-2">
                        <Recycle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Lançar ou Editar Itens */}
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                  {itensVencidos.some(i => i.id === currentItemVencidos.id) ? '2. Editar Item' : '2. Lançar'}
                </h3>
                
                <div className="space-y-4">
                  {/* Linha 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Data</label>
                      <input
                        type="date"
                        value={currentItemVencidos.data}
                        onChange={(e) => handleCurrentItemVencidosChange('data', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Código</label>
                      <input
                        type="text"
                        value={currentItemVencidos.codigo}
                        onChange={(e) => handleCurrentItemVencidosChange('codigo', e.target.value)}
                        placeholder="Cód."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Medicamento/Produto *</label>
                      <input
                        type="text"
                        value={currentItemVencidos.medicamento}
                        onChange={(e) => handleCurrentItemVencidosChange('medicamento', e.target.value)}
                        placeholder="Nome do produto"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Linha 2 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Lote (opcional)</label>
                      <input
                        type="text"
                        value={currentItemVencidos.lote}
                        onChange={(e) => handleCurrentItemVencidosChange('lote', e.target.value)}
                        placeholder="Lote"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">NCM</label>
                      <input
                        type="text"
                        value={currentItemVencidos.ncm}
                        onChange={(e) => handleCurrentItemVencidosChange('ncm', e.target.value)}
                        placeholder="0000.00.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CEST</label>
                      <input
                        type="text"
                        value={currentItemVencidos.cest}
                        onChange={(e) => handleCurrentItemVencidosChange('cest', e.target.value)}
                        placeholder="00.000.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CFOP</label>
                      <input
                        type="text"
                        value={currentItemVencidos.cfop}
                        onChange={(e) => handleCurrentItemVencidosChange('cfop', e.target.value)}
                        placeholder="CFOP"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Linha 3 (Apenas Qtde e Unitario, sem desconto e total final como inputs em branco) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm max-w-xl">
                     <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade *</label>
                      <input
                        type="number"
                        min="1"
                        value={currentItemVencidos.quantidade}
                        onChange={(e) => handleCurrentItemVencidosChange('quantidade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário *</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                        <input
                          type="text"
                          value={currentItemVencidos.preco_unitario}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            const numStr = (Number(val) / 100).toFixed(2);
                            const formatted = numStr.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                            handleCurrentItemVencidosChange('preco_unitario', formatted);
                          }}
                          placeholder="0,00"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex justify-start">
                    <button
                      onClick={addItemVencidos}
                      className={`px-6 py-2.5 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm ${itensVencidos.some(i => i.id === currentItemVencidos.id) ? 'bg-[#ff9800] hover:bg-[#f57c00]' : 'bg-[#4CAF50] hover:bg-[#388E3C]'}`}
                    >
                      <Plus className="w-4 h-4" />
                      {itensVencidos.some(i => i.id === currentItemVencidos.id) ? 'Atualizar' : 'Adicionar'}
                    </button>
                  </div>
                </div>

                {/* Tabela de Itens Adicionados */}
                {itensVencidos.length > 0 && (
                  <div className="mt-6 space-y-4 sm:space-y-0 sm:mt-4">
                    {/* View Mobile (Cards) */}
                    <div className="block sm:hidden space-y-3">
                      {itensVencidos.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm relative">
                          <div className="flex justify-between items-start mb-3">
                            <div className="pr-12">
                               <span className="font-bold text-gray-800 dark:text-gray-100 block text-base">{item.codigo ? `${item.codigo} - ` : ''}{item.medicamento}</span>
                               <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex gap-1 absolute top-3 right-3">
                               <button onClick={() => handleEditItemVencidos(item)} className="p-2 text-blue-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                               <button onClick={() => removeItemVencidos(item.id)} className="p-2 text-red-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">Quantidade</span> <span className="font-medium text-gray-800 dark:text-gray-100">{item.quantidade}</span></div>
                            <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">V. Unitário</span> <span className="font-medium text-gray-800 dark:text-gray-100">R$ {item.preco_unitario}</span></div>
                            <div><span className="text-xs block text-gray-500 dark:text-gray-400 mb-0.5">V. Total</span> <span className="font-bold text-[#0066b3]">R$ {item.preco_final}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View Desktop (Tabela) */}
                    <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Data</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Cód</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Produto</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Qtd</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-right">P. Unit (R$)</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-right">Total Final</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {itensVencidos.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50">
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {new Date(item.data).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.codigo || '-'}</td>
                              <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{item.medicamento}</td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-center">{item.quantidade}</td>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-right">
                                R$ {item.preco_unitario}
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#0066b3] text-right">
                                R$ {item.preco_final}
                              </td>
                              <td className="py-3 px-4 flex justify-center items-center gap-1">
                                <button
                                  onClick={() => handleEditItemVencidos(item)}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Editar Item"
                                >
                                  <Edit2 className="w-4 h-4 mx-auto" />
                                </button>
                                <button
                                  onClick={() => removeItemVencidos(item.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
                    <div className="w-full sm:w-auto text-center sm:text-left">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Valor Total da Nota</p>
                      <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-1">
                        {itensVencidos.reduce((acc, item) => acc + (parseFloat(item.preco_final.replace(',', '.')) || 0), 0)
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="flex justify-center sm:justify-end gap-3 w-full sm:w-auto">
                      <button 
                        onClick={handleLimparVencidosNF}
                        disabled={isSavingVencidos || isDeletingVencidos || itensVencidos.length === 0}
                        className="w-12 h-12 sm:w-auto sm:h-auto sm:px-6 sm:py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/40 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                        title="Limpar NF"
                      >
                        <Trash2 className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Limpar NF</span>
                      </button>
                      <button 
                        onClick={handleSaveVencidosNF}
                        disabled={isSavingVencidos || isDeletingVencidos || itensVencidos.length === 0}
                        className="w-12 h-12 sm:w-auto sm:h-auto sm:px-8 sm:py-3 bg-[#0066b3] text-white rounded-full hover:bg-[#005291] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                        title="Salvar NF"
                      >
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">{isSavingVencidos ? 'Salvando...' : 'Salvar NF'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handlePrintEspelhoVencidos}
                      disabled={itensVencidos.length === 0}
                      className="flex-1 px-6 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-all font-medium shadow-sm flex items-center justify-center gap-2 text-base"
                    >
                      <Printer className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      Espelho da Nota Fiscal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Confirmação - Limpar Empresa NF */}
      {showLimparConfirmNF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Limpar Nota Fiscal</h3>
            </div>
            
            <div className="mb-6 ml-13">
              <p className="text-gray-600 dark:text-gray-400">
                Deseja realmente limpar a Nota Fiscal deste cliente? Todos os itens serão apagados permanentemente.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLimparConfirmNF(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium border border-gray-300 dark:border-gray-600 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLimparNF}
                className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar NF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Limpar Vencidos NF */}
      {showLimparConfirmVencidos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Limpar NF de Vencidos</h3>
            </div>
            
            <div className="mb-6 ml-13">
              <p className="text-gray-600 dark:text-gray-400">
                Deseja realmente limpar todos os itens da Nota Fiscal de Vencidos? Esta ação não pode ser desfeita.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLimparConfirmVencidos(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium border border-gray-300 dark:border-gray-600 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLimparVencidosNF}
                className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar NF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comprovante de Entrega */}
      {showComprovanteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2">Comprovante de Entrega</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecione a Data dos Itens</label>
              <select
                value={comprovanteDate}
                onChange={(e) => setComprovanteDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent transition-colors outline-none"
              >
                {Array.from(new Set(itensNF.map(item => item.data)))
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                O comprovante será gerado incluindo apenas os itens desta data.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowComprovanteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium border border-gray-300 dark:border-gray-600 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={executePrintComprovante}
                className="px-6 py-2 bg-[#0066b3] text-white hover:bg-[#005291] rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};




