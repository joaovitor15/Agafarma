import html2pdf from 'html2pdf.js';

export const generateOrcamentoPdf = (
  paciente: { nome: string; cpf?: string },
  medicamentos: { nome: string; principio?: string; quantidade: string; preco: string | number }[],
  settings: {
    razaoSocial: string;
    cnpj: string;
    ie: string;
    endereco: string;
    nomeFantasia: string;
    telefone: string;
  }
) => {
  // Configurações da Farmácia
  const {
    nomeFantasia,
    razaoSocial,
    cnpj,
    ie,
    endereco,
    telefone
  } = settings;

  // Data atual
  const today = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' } as const;
  const dataExtenso = today.toLocaleDateString('pt-BR', options);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calcula total geral
  const totalValue = medicamentos.reduce((acc, med) => {
    let precoVal = 0;
    if (typeof med.preco === 'number') {
      precoVal = med.preco;
    } else {
      const precoStr = String(med.preco || '').replace(/[^\d,]/g, '').replace(',', '.');
      precoVal = parseFloat(precoStr) || 0;
    }
    const qtdStr = String(med.quantidade || '').replace(/\D/g, '');
    const qtd = parseInt(qtdStr, 10) || 1;
    return acc + (precoVal * qtd);
  }, 0);
  
  const total = formatCurrency(totalValue);

  // Linhas de medicamentos em HTML
  const linhasHtml = medicamentos.map((med, index) => {
    let precoVal = 0;
    if (typeof med.preco === 'number') {
      precoVal = med.preco;
    } else {
      const precoStr = String(med.preco || '').replace(/[^\d,]/g, '').replace(',', '.');
      precoVal = parseFloat(precoStr) || 0;
    }
    const qtdOriginal = med.quantidade || '1';
    const qtdStr = String(med.quantidade || '').replace(/\D/g, '');
    const qtd = parseInt(qtdStr, 10) || 1;
    
    const subtotal = formatCurrency(precoVal * qtd);
    const precoUnitario = formatCurrency(precoVal);

    return `
<p>
  <b>${index + 1}. ${med.nome}</b> ${med.principio ? '(' + med.principio + ')' : ''}<br>
  Quantidade: ${qtdOriginal} cx | Valor Unitário: R$ ${precoUnitario} | Subtotal: R$ ${subtotal}
</p>
    `;
  }).join('');

  // HTML completo do PDF (App Script format translated)
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
  <style>
    @page { margin: 2.5cm; }
    body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; }
    
    .titulo-principal { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 30px; text-transform: uppercase; }
    
    /* APENAS OS TÍTULOS FICAM CENTRALIZADOS */
    .secao-titulo { font-weight: bold; text-decoration: underline; margin-top: 25px; margin-bottom: 10px; font-size: 15px; text-align: center; }
    
    /* O CONTEÚDO VOLTA PARA A ESQUERDA */
    .secao-conteudo { margin-bottom: 20px; text-align: left; }
    
    /* ESTILO DO CARIMBO CORRIGIDO */
    .assinatura-box { margin-top: 60px; text-align: center; page-break-inside: avoid; }
    
    .caixa-arredondada {
      border: 1px solid #000;
      border-radius: 12px; 
      padding: 15px;
      width: 420px;
      margin: 0 auto;
      line-height: 1.4;
    }
    
    .carimbo-razao { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #333; }
    .carimbo-cnpj { font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #333; }
    
    .carimbo-nome-dinamico { font-size: 24px; font-weight: bold; text-transform: lowercase; letter-spacing: -1px; margin: 2px 0; }
    .carimbo-sublogo { font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
    
    .carimbo-end { font-size: 12px; color: #333; }
    
    .area-assinatura { margin-top: 55px; } 
    .linha-assinatura { border-top: 1.5px solid #000; width: 400px; margin: 0 auto; padding-top: 5px; }
    .texto-assinatura { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>

  <div class="titulo-principal">Orçamento de Medicamentos - ${nomeFantasia}</div>

  <div class="secao-titulo">Estabelecimento</div>
  <div class="secao-conteudo">
    <b>Razão Social:</b> ${razaoSocial}. <b>CNPJ:</b> ${cnpj}.<br>
    <b>Inscrição Estadual (IE):</b> ${ie}. <b>Endereço:</b> ${endereco}
  </div>

  <div class="secao-titulo">Dados do Paciente</div>
  <div class="secao-conteudo">
    <b>Nome:</b> ${paciente.nome}
    ${paciente.cpf ? `<br><b>CPF:</b> ${paciente.cpf}` : ''}
  </div>

  <div class="secao-titulo">Medicamentos</div>
  <div class="secao-conteudo">
    ${linhasHtml}
  </div>

  <div class="secao-titulo">Total do Orçamento</div>
  <div class="secao-conteudo">
    <b style="font-size: 16px;">Total Geral: R$ ${total}</b>
  </div>

  <div style="text-align: right; margin-top: 40px;">
    Tuparendi, ${dataExtenso}
  </div>

  <div class="assinatura-box">
    
    <div class="caixa-arredondada">
      <div class="carimbo-razao">${razaoSocial}</div>
      <div class="carimbo-cnpj">CNPJ ${cnpj}</div>
      
      <div class="carimbo-nome-dinamico">${nomeFantasia}</div>
      <div class="carimbo-sublogo">FARMÁCIAS</div>
      
      <div class="carimbo-end">
        ${endereco}<br>
        ${telefone ? `Fone: ${telefone}` : ''}
      </div>
    </div>
    
    <div class="area-assinatura">
        <div class="linha-assinatura"></div>
        <div class="texto-assinatura">Assinatura</div>
    </div>
    
  </div>

</body>
</html>`;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = htmlContent;

  const opt = {
    margin:       15,
    filename:     'orcamento_agafarma.pdf',
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
