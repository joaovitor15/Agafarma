import { useState, useEffect, useRef } from 'react';
import { Menu, X, Home, Trophy, ChevronRight, ChevronLeft, ChevronDown, UserPlus, Save, Users, Trash2, FileText, Settings, Edit2, Store, UserCheck, LogOut, Receipt, BookOpen, Printer, Plus, Upload, Download, Archive, RefreshCw, Scale, DollarSign, File, FileCheck, Recycle, Sun, Moon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from './supabase';
import extenso from 'extenso';
import html2pdf from 'html2pdf.js';
import { Auth } from './components/Auth';
import { UserManagement } from './components/UserManagement';
import { RichTextEditor } from './components/RichTextEditor';
import { OrcamentosJudiciais } from './components/OrcamentosJudiciais';
import { NotasFiscais } from './components/NotasFiscais';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agafarma_dark_mode');
      if (saved) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  useEffect(() => {
    localStorage.setItem('agafarma_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  const [activeManualsTab, setActiveManualsTab] = useState<'pops' | 'manuais'>('pops');
  
  // States for Manuals/POPs
  const [manualsList, setManualsList] = useState<any[]>([]);
  const [manualToDelete, setManualToDelete] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingManualId, setEditingManualId] = useState<string | null>(null);
  const [currentDocTitle, setCurrentDocTitle] = useState('');
  const [currentDocDescription, setCurrentDocDescription] = useState('');
  const [currentDocValidade, setCurrentDocValidade] = useState('');
  const [currentDocUsarCapa, setCurrentDocUsarCapa] = useState(true);

  const getDocMetadata = (descricao: string | null) => {
    if (!descricao) return { text: '', validade: '', usarCapa: true };
    try {
      const parsed = JSON.parse(descricao);
      if (parsed && typeof parsed === 'object' && ('text' in parsed || 'validade' in parsed || 'usarCapa' in parsed)) {
        return { 
          text: parsed.text || '', 
          validade: parsed.validade || '', 
          usarCapa: parsed.usarCapa !== undefined ? !!parsed.usarCapa : true
        };
      }
    } catch (e) {
      // Fallback para descrição antiga (apenas texto)
    }
    return { text: descricao, validade: '', usarCapa: true };
  };

  const [currentDocContent, setCurrentDocContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateFileInputRef = useRef<HTMLInputElement>(null);
  const [updatingDocumentId, setUpdatingDocumentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [popNumero, setPopNumero] = useState('');
  const [popObjetivo, setPopObjetivo] = useState('');
  const [popResponsabilidade, setPopResponsabilidade] = useState('');
  const [popAlcance, setPopAlcance] = useState('');
  const [popProcedimento, setPopProcedimento] = useState('');
  
  const [showNewEmployeeForm, setShowNewEmployeeForm] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return months[d.getMonth()];
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.getFullYear();
  });

  const periodo = `${selectedMonth}/${selectedYear}`;

  const [employees, setEmployees] = useState<{id: string, nome_completo: string, cpf: string, valor: string, gerar?: boolean}[]>([]);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

  const [empresaNome, setEmpresaNome] = useState('LUIZ MOACIR MACHRY');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [empresaCnpj, setEmpresaCnpj] = useState('89.055.768/0001-76');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [cep, setCep] = useState('');
  const [farmaceuticoResp, setFarmaceuticoResp] = useState('');
  const [crfRS, setCrfRS] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [valorSicredi, setValorSicredi] = useState('');
  const [showSettingsSuccess, setShowSettingsSuccess] = useState(false);
  const [showSicrediSettings, setShowSicrediSettings] = useState(false);
  const [editingSection, setEditingSection] = useState<'none' | 'estabelecimento' | 'responsabilidade' | 'bancario' | 'coleta'>('none');
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isRespTecnicaExpanded, setIsRespTecnicaExpanded] = useState(false);
  const [isBancarioExpanded, setIsBancarioExpanded] = useState(false);
  
  // States for Coleta
  const [coletaRazaoSocial, setColetaRazaoSocial] = useState('');
  const [coletaCnpj, setColetaCnpj] = useState('');
  const [coletaEndereco, setColetaEndereco] = useState('');
  const [coletaCidadeUf, setColetaCidadeUf] = useState('');
  const [coletaCep, setColetaCep] = useState('');
  const [isColetaExpanded, setIsColetaExpanded] = useState(false);

  const fetchManuals = async () => {
    try {
      const { data, error } = await supabase
        .from('manuais_pops')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setManualsList(data);
    } catch (err) {
      console.error('Exception fetching manuals:', err);
    }
  };

  const handleSaveManual = async () => {
    let contentToSave = '';
    if (activeManualsTab === 'pops') {
      if (!currentDocTitle.trim() || !popProcedimento.trim()) {
        alert('Por favor, preencha o título e o procedimento.');
        return;
      }
      contentToSave = JSON.stringify({
        numero: popNumero,
        objetivo: popObjetivo,
        responsabilidade: popResponsabilidade,
        alcance: popAlcance,
        procedimento: popProcedimento
      });
    } else {
      if (!currentDocTitle.trim() || !currentDocContent.trim()) {
        alert('Por favor, preencha o título e o conteúdo.');
        return;
      }
      contentToSave = currentDocContent;
    }

    const metaPayload = JSON.stringify({
      text: activeManualsTab === 'pops' ? '' : currentDocDescription,
      validade: currentDocValidade || null,
      usarCapa: currentDocUsarCapa
    });

    try {
      if (editingManualId) {
        const { error } = await supabase
          .from('manuais_pops')
          .update({
            titulo: currentDocTitle,
            descricao: metaPayload,
            conteudo: contentToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingManualId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('manuais_pops')
          .insert({
            tipo: activeManualsTab === 'pops' ? 'pop' : 'manual',
            titulo: currentDocTitle,
            descricao: metaPayload,
            conteudo: contentToSave
          });
        
        if (error) throw error;
      }

      setIsManualModalOpen(false);
      setEditingManualId(null);
      setCurrentDocTitle('');
      setCurrentDocDescription('');
      setCurrentDocValidade('');
      setCurrentDocUsarCapa(true);
      setCurrentDocValidade('');
      setCurrentDocContent('');
      setPopNumero('');
      setPopObjetivo('');
      setPopResponsabilidade('');
      setPopAlcance('');
      setPopProcedimento('');
      fetchManuals();
    } catch (err) {
      console.error('Error saving document:', err);
      alert('Erro ao salvar o documento.');
    }
  };

  const confirmDeleteManual = async () => {
    if (!manualToDelete) return;
    try {
      const { error } = await supabase
        .from('manuais_pops')
        .delete()
        .eq('id', manualToDelete);
      
      if (error) throw error;
      fetchManuals();
    } catch (err) {
      console.error('Error deleting document:', err);
    } finally {
      setManualToDelete(null);
    }
  };

  const openManualModal = (manual?: any) => {
    if (manual) {
      setEditingManualId(manual.id);
      setCurrentDocTitle(manual.titulo);
      
      const meta = getDocMetadata(manual.descricao);
      setCurrentDocDescription(meta.text);
      setCurrentDocValidade(meta.validade);
      setCurrentDocUsarCapa(meta.usarCapa);
      
      if (manual.tipo === 'pop') {
         try {
           const parsed = JSON.parse(manual.conteudo);
           setPopNumero(parsed.numero || '');
           setPopObjetivo(parsed.objetivo || '');
           setPopResponsabilidade(parsed.responsabilidade || '');
           setPopAlcance(parsed.alcance || '');
           setPopProcedimento(parsed.procedimento || '');
           setCurrentDocContent('');
         } catch (e) {
           setPopNumero('');
           setPopObjetivo('');
           setPopResponsabilidade('');
           setPopAlcance('');
           setPopProcedimento(manual.conteudo || '');
           setCurrentDocContent('');
         }
      } else {
        setCurrentDocContent(manual.conteudo);
      }
    } else {
      setEditingManualId(null);
      setCurrentDocTitle('');
      setCurrentDocDescription('');
      setCurrentDocValidade('');
      setCurrentDocUsarCapa(true);
      setCurrentDocContent('');
      setPopNumero('');
      setPopObjetivo('');
      setPopResponsabilidade('');
      setPopAlcance('');
      setPopProcedimento('');
    }
    setIsManualModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('O arquivo selecionado é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string; // Will start with data:application/pdf;base64,...
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      
      try {
        const { error } = await supabase
          .from('manuais_pops')
          .insert({
            tipo: 'manual',
            titulo: title,
            descricao: 'Documento PDF importado',
            conteudo: JSON.stringify({ type: 'pdf', fileName: file.name, data: base64String })
          });
          
        if (error) throw error;
        fetchManuals();
        alert('Documento enviado com sucesso!');
      } catch (error) {
        console.error('Erro ao enviar documento:', error);
        alert('Erro ao enviar documento. Tente novamente.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      }
    };
    reader.onerror = () => {
      alert('Erro ao processar o arquivo.');
      setIsUploading(false);
    };
  };

  const handleUpdateFileClick = (id: string) => {
    setUpdatingDocumentId(id);
    if (updateFileInputRef.current) {
      updateFileInputRef.current.click();
    }
  };

  const handleFileUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updatingDocumentId) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('O arquivo selecionado é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string; 
      
      try {
        const { error } = await supabase
          .from('manuais_pops')
          .update({
            conteudo: JSON.stringify({ type: 'pdf', fileName: file.name, data: base64String }),
            updated_at: new Date().toISOString()
          })
          .eq('id', updatingDocumentId);
          
        if (error) throw error;
        fetchManuals();
        alert('Documento atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar documento:', error);
        alert('Erro ao atualizar documento. Tente novamente.');
      } finally {
        setIsUploading(false);
        setUpdatingDocumentId(null);
        if (updateFileInputRef.current) updateFileInputRef.current.value = ''; // Reset input
      }
    };
    reader.onerror = () => {
      alert('Erro ao processar o arquivo.');
      setIsUploading(false);
      setUpdatingDocumentId(null);
    };
  };

  const handleDownloadAllDocuments = async () => {
    // Filtrar apenas manuais e depois pegar apenas os que são PDFs
    const documents = manualsList.filter(m => m.tipo === 'manual');
    const pdfDocuments = documents.filter(doc => {
      try {
        const parsed = JSON.parse(doc.conteudo);
        return parsed.type === 'pdf';
      } catch (e) {
        return false;
      }
    });

    if (pdfDocuments.length === 0) {
      alert('Nenhum PDF encontrado para baixar.');
      return;
    }
    
    setIsUploading(true); // Reusing upload state to show loading indicator if needed
    try {
      const zip = new JSZip();
      
      for (const doc of pdfDocuments) {
        try {
          const parsed = JSON.parse(doc.conteudo);
          if (parsed.type === 'pdf' && parsed.data) {
            // The data is a base64 string starting with data:application/pdf;base64,
            const base64Data = parsed.data.split(',')[1];
            zip.file(`${doc.titulo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`, base64Data, {base64: true});
          }
        } catch(e) {}
      }
      
      const content = await zip.generateAsync({type: 'blob'});
      // O saveAs (FileSaver) irá desencadear o download. Se o seu navegador estiver configurado para "perguntar onde salvar", ele abrirá a janela para escolher a pasta e o nome.
      saveAs(content, 'documentos_pdf.zip');
    } catch (error) {
      console.error('Erro ao gerar backup:', error);
      alert('Ocorreu um erro ao gerar o arquivo ZIP com os PDFs.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeneratePDFAllPops = () => {
    const pops = manualsList.filter(m => m.tipo === 'pop');
    
    // Convert date to Brazilian format
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const currentYear = today.getFullYear();

    let popsHtml = '';
    
    // Sort pops by number if possible
    const sortedPops = [...pops].sort((a, b) => {
      let numA = 0; let numB = 0;
      try { numA = Number(JSON.parse(a.conteudo).numero) || 0; } catch(e) {}
      try { numB = Number(JSON.parse(b.conteudo).numero) || 0; } catch(e) {}
      return numA - numB;
    });

    for (let i = 0; i < sortedPops.length; i++) {
      const pop = sortedPops[i];
      let parsed = { numero: '', objetivo: '', responsabilidade: '', alcance: '', procedimento: pop.conteudo };
      try {
        parsed = JSON.parse(pop.conteudo);
      } catch (e) {}

      popsHtml += `
    <div class="bloco-pop">
      <div class="header">
        <table class="header-table">
          <tr>
            <td width="55%"><b>${nomeFantasia || empresaNome || 'AGAFARMA'}</b><br>CNPJ: ${empresaCnpj || ''}</td>
            <td width="45%" style="text-align: right;"><b>POP Nº ${parsed.numero}</b></td>
          </tr>
        </table>
      </div>

      <div class="title-box"><h2>${pop.titulo}</h2></div>

      <div class="section-title">1. OBJETIVO</div>
      <div class="content-box">
        ${(parsed.objetivo || '').split('\\n').map(l => l.trim() ? '<div class="paragrafo-recuo">' + l + '</div>' : '').join('')}
      </div>

      <div class="section-title">2. RESPONSABILIDADE</div>
      <div class="content-box">
        ${(parsed.responsabilidade || '').split('\\n').map(l => l.trim() ? '<div class="paragrafo-recuo">' + l + '</div>' : '').join('')}
      </div>

      <div class="section-title">3. ALCANCE</div>
      <div class="content-box">
        ${(parsed.alcance || '').split('\\n').map(l => l.trim() ? '<div class="paragrafo-recuo">' + l + '</div>' : '').join('')}
      </div>

      <div class="section-title">4. PROCEDIMENTO / DESCRIÇÃO</div>
      <div class="content-box">
        ${(parsed.procedimento || '').split('\\n').map(l => l.trim() ? '<div class="paragrafo-recuo">' + l + '</div>' : '').join('')}
      </div>
    </div>
      `;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>Manuais POP</title>
  <style>
    @page { margin: 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.6; margin: 0; padding: 0; }
    
    /* === CAPA PADRÃO === */
    .capa { text-align: center; padding-top: 50px; margin-bottom: 50px; }
    .logo-texto { font-size: 40px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase; }
    .titulo-capa { font-size: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 25px 0; margin: 60px 0; }
    .dados-capa { font-size: 15px; margin-top: 80px; text-align: left; padding-left: 25%; line-height: 1.6; }
    
    /* === CADA POP === */
    .bloco-pop { page-break-before: always; clear: both; padding-top: 10px; }

    .header { border: 1px solid #000; padding: 10px; margin-bottom: 20px; background: #fff; }
    .header-table { width: 100%; border-collapse: collapse; }
    
    .title-box { background: transparent; color: #000; text-align: center; padding: 10px; margin: 20px 0; border: 1px solid #000; border-radius: 4px; }
    .title-box h2 { margin: 0; font-size: 14px; text-transform: uppercase; }
    
    .section-title { font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; display: block; margin-top: 20px; margin-bottom: 10px; font-size: 12px; }
    
    /* === A MÁGICA DO RECUO DESLOCADO ESTÁ AQUI === */
    .content-box { text-align: justify; }
    .paragrafo-recuo { padding-left: 28px; text-indent: -28px; margin-bottom: 8px; }

    /* === FOLHA DE APROVAÇÃO === */
    .aprovacao-final { page-break-before: always; text-align: center; padding-top: 50px; }
    .tabela-assinatura { width: 100%; margin-top: 60px; border-collapse: collapse; }
    .tabela-assinatura td { border: 1px solid #000; padding: 30px 10px; vertical-align: top; }
    .linha-assinatura { border-top: 1px solid #000; width: 85%; margin: 45px auto 5px auto; font-weight: bold; }
  </style>
</head>
<body>

  <div class="capa">
    <div class="logo-texto">${nomeFantasia ? nomeFantasia.split(' ')[0] : 'AGAFARMA'}</div>
    
    <div class="titulo-capa">
      <b>MANUAL DE PROCEDIMENTOS OPERACIONAIS PADRÃO (POP)</b>
    </div>
    
    <div class="dados-capa">
      <p><b>Farmácia:</b> ${nomeFantasia || 'Não Configurado'}</p>
      <p><b>Razão Social:</b> ${empresaNome || 'Não Configurado'}</p>
      <p><b>CNPJ:</b> ${empresaCnpj || 'Não Configurado'}</p>
      <br>
      <p><b>Responsável Técnico:</b> ${farmaceuticoResp || 'Não Configurado'}</p>
      <p><b>CRF/RS:</b> ${crfRS || 'Não Configurado'}</p>
      <p><b>ANO:</b> ${currentYear}</p>
    </div>
  </div>

  ${popsHtml}

  <div class="aprovacao-final">
    <h1 style="text-decoration: underline; margin-bottom: 40px;">FOLHA DE APROVAÇÃO</h1>
    
    <p style="text-align: justify; margin: 30px 0; line-height: 1.8;">
      Confirmo que os <b>${sortedPops.length}</b> procedimentos operacionais descritos neste manual foram revisados e aprovados para execução na data de hoje.
    </p>

    <table class="tabela-assinatura">
      <tr>
        <td>
          ELABORADO POR:
          <div class="linha-assinatura"></div>
          ${farmaceuticoResp || ''}<br>
          CRF/RS: ${crfRS || ''}
        </td>
        <td>
          REVISADO POR:
          <div class="linha-assinatura"></div>
          ${farmaceuticoResp || ''}<br>
          CRF/RS: ${crfRS || ''}
        </td>
        <td>
          APROVADO POR:
          <div class="linha-assinatura"></div>
          ${farmaceuticoResp || ''}<br>
          CRF/RS: ${crfRS || ''}
        </td>
      </tr>
    </table>

    <p style="margin-top: 60px; font-size: 14px; font-weight: bold;">
      ${cidade || 'Tuparendi'} - RS, ${formattedDate}
    </p>
  </div>

</body>
</html>`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlContent;

    const opt = {
      margin:       15,
      filename:     'todos_os_pops.pdf',
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

  const handleGeneratePDFManual = (manual: any) => {
    // Check if it's an imported PDF
    if (manual.tipo === 'manual') {
      try {
        const parsed = JSON.parse(manual.conteudo);
        if (parsed.type === 'pdf' && parsed.data) {
          // It's a PDF, download or view it
          const win = window.open();
          if (win) {
            win.document.write(`<iframe src="${parsed.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
            win.document.title = manual.titulo || 'Documento PDF';
            win.document.close();
          }
          return;
        }
      } catch (e) {}
    }

    let htmlContent = '';

    const razaoSocial = empresaNome || 'Não Informado';
    const fantasia = nomeFantasia || 'Não Informado';
    const cnpj = empresaCnpj || 'Não Informado';
    const farmaceutico = farmaceuticoResp || 'Não Informado';
    const crf = crfRS || 'Não Informado';
    const enderecoStr = rua ? `${rua}, ${numero}, ${cidade} - ${uf}` : 'Tuparendi';

    const ano = new Date().getFullYear();
    const hoje = new Date().toLocaleDateString('pt-BR');
    const nomeCurto = fantasia.split(' ')[0] || 'AGAFARMA';
    const meta = getDocMetadata(manual.descricao);
    const useCapa = meta.usarCapa;

    let tituloCapa = manual.titulo ? manual.titulo.toUpperCase() : "DOCUMENTO";
    
    // Default capa CSS is injected when needed
    const capaCss = `
  .capa { text-align: center; padding-top: 50px; }
  .logo-texto { font-size: 40px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase; }
  .titulo-capa { font-size: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 25px 0; margin: 60px 0; }
  .dados-capa { font-size: 15px; margin-top: 80px; text-align: left; padding-left: 25%; line-height: 1.6; }
  .quebra-pagina { page-break-after: always; clear: both; display: block; border: none; height: 0; margin: 0; }
    `;

    const htmlCapa = `
      <div class="capa">
        <div class="logo-texto">${nomeCurto}</div>
        <div class="titulo-capa"><b>${tituloCapa}</b></div>
        <div class="dados-capa">
          <p><b>Farmácia:</b> ${fantasia}</p>
          <p><b>Razão Social:</b> ${razaoSocial}</p>
          <p><b>CNPJ:</b> ${cnpj}</p><br>
          <p><b>Responsável Técnico:</b> ${farmaceutico}</p>
          <p><b>CRF/RS:</b> ${crf}</p>
          <p><b>ANO:</b> ${ano}</p>
        </div>
      </div>
      <div class="quebra-pagina"></div>
    `;
    
    if (manual.tipo === 'pop') {
      let parsed = { numero: '', objetivo: '', responsabilidade: '', alcance: '', procedimento: manual.conteudo };
      try {
        parsed = JSON.parse(manual.conteudo);
      } catch (e) {}
      
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>${manual.titulo}</title>
  <style>
    @page { margin: 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.6; }
    
    ${capaCss}

    .header { border: 1px solid #000; padding: 10px; margin-bottom: 20px; }
    .header-table { width: 100%; border-collapse: collapse; }
    
    .title-box { background: #2c3e50; color: white; text-align: center; padding: 10px; margin: 20px 0; border-radius: 4px; }
    .title-box h2 { margin: 0; font-size: 14px; text-transform: uppercase; }
    
    .section-title { font-weight: bold; text-transform: uppercase; color: #2980b9; border-bottom: 1px solid #2980b9; display: block; margin-top: 20px; margin-bottom: 10px; font-size: 12px; }
    
    .content-box { text-align: justify; margin-bottom: 15px; }
    
    /* ReactQuill classes */
    .ql-align-center { text-align: center; }
    .ql-align-right { text-align: right; }
    .ql-align-justify { text-align: justify; }
    blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 16px; font-style: italic; }
    .item-lista { margin-bottom: 10px; padding-left: 45px; text-indent: -45px; page-break-inside: avoid; }

    .footer-assinatura { margin-top: 50px; text-align: center; }
    .linha { border-top: 1px solid #000; width: 300px; margin: 10px auto; }
  </style>
</head>
<body>
  ${useCapa ? htmlCapa : ''}

  <div class="header">
    <table class="header-table">
      <tr>
        <td width="50%"><b>${nomeFantasia || empresaNome || 'Farmácia'}</b><br>CNPJ: ${empresaCnpj}</td>
        <td width="50%" style="text-align: right;"><b>POP Nº ${parsed.numero}</b></td>
      </tr>
    </table>
  </div>

  <div class="title-box">
    <h2>${manual.titulo}</h2>
  </div>

  <div class="section-title">1. OBJETIVO</div>
  <div class="content-box">${parsed.objetivo ? parsed.objetivo.replace(/\n/g, '<br/>') : ''}</div>

  <div class="section-title">2. RESPONSABILIDADE</div>
  <div class="content-box">${parsed.responsabilidade ? parsed.responsabilidade.replace(/\n/g, '<br/>') : ''}</div>

  <div class="section-title">3. ALCANCE</div>
  <div class="content-box">${parsed.alcance ? parsed.alcance.replace(/\n/g, '<br/>') : ''}</div>

  <div class="section-title">4. PROCEDIMENTO / DESCRIÇÃO</div>
  <div class="content-box">${parsed.procedimento}</div>

  <div class="footer-assinatura">
    <div class="linha"></div>
    <b>${farmaceuticoResp || 'Farmacêutico Responsável'}</b><br>
    Farmacêutico Responsável - CRF/RS: ${crfRS}
  </div>
</body>
</html>`;
    } else {
      const razaoSocial = empresaNome || 'Não Informado';
      const fantasia = nomeFantasia || 'Não Informado';
      const cnpj = empresaCnpj || 'Não Informado';
      const farmaceutico = farmaceuticoResp || 'Não Informado';
      const crf = crfRS || 'Não Informado';
      const enderecoStr = rua ? `${rua}, ${numero}, ${cidade} - ${uf}` : 'Tuparendi';

      const ano = new Date().getFullYear();
      const hoje = new Date().toLocaleDateString('pt-BR');
      const nomeCurto = fantasia.split(' ')[0] || 'AGAFARMA';

      let tituloCapa = manual.titulo ? manual.titulo.toUpperCase() : "MANUAL";

      const htmlCapa = `
        <div class="capa">
          <div class="logo-texto">${nomeCurto}</div>
          <div class="titulo-capa"><b>${tituloCapa}</b></div>
          <div class="dados-capa">
            <p><b>Farmácia:</b> ${fantasia}</p>
            <p><b>Razão Social:</b> ${razaoSocial}</p>
            <p><b>CNPJ:</b> ${cnpj}</p><br>
            <p><b>Responsável Técnico:</b> ${farmaceutico}</p>
            <p><b>CRF/RS:</b> ${crf}</p>
            <p><b>ANO:</b> ${ano}</p>
          </div>
        </div>
        <div class="quebra-pagina"></div>
      `;

      const meta = getDocMetadata(manual.descricao);
      const useCapa = meta.usarCapa;

      let htmlBase = manual.conteudo || '<p>Manual vazio. Escreva o conteúdo no sistema primeiro!</p>';

      htmlBase = htmlBase.replace(/\[RAZAO_SOCIAL\]/g, razaoSocial);
      htmlBase = htmlBase.replace(/\[NOME_FANTASIA\]/g, fantasia);
      htmlBase = htmlBase.replace(/\[CNPJ\]/g, cnpj);
      htmlBase = htmlBase.replace(/\[ENDERECO\]/g, enderecoStr);
      htmlBase = htmlBase.replace(/\[FARMACEUTICO\]/g, farmaceutico);
      htmlBase = htmlBase.replace(/\[CRF\]/g, crf);
      htmlBase = htmlBase.replace(/\[CIDADE\]/g, cidade || 'Tuparendi');
      htmlBase = htmlBase.replace(/\[DATA\]/g, hoje);
      htmlBase = htmlBase.replace(/\[ANO\]/g, ano.toString());

      htmlContent = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page { margin: 1.5cm; }
  body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #000; }
  .capa { text-align: center; padding-top: 50px; }
  .logo-texto { font-size: 40px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase; }
  .titulo-capa { font-size: 20px; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 25px 0; margin: 60px 0; }
  .dados-capa { font-size: 15px; margin-top: 80px; text-align: left; padding-left: 25%; line-height: 1.6; }
  .quebra-pagina { page-break-after: always; clear: both; display: block; border: none; height: 0; margin: 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th, td { border: 1px solid #000; padding: 8px; }
  p { text-align: justify; margin-bottom: 10px; }
  .ql-align-center { text-align: center; } 
  .ql-align-right { text-align: right; } 
  .ql-align-justify { text-align: justify; }
</style>
</head><body>
  ${useCapa ? htmlCapa : ''}
  ${htmlBase}
</body></html>
`;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlContent;

    const opt = {
      margin:       15,
      filename:     `${manual.titulo || 'documento'}.pdf`.replace(/[/\\?%*:|"<>]/g, '-'),
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

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configuracoes:', error);
      }
      
      if (data) {
        if (data.empresa_nome) setEmpresaNome(data.empresa_nome);
        if (data.nome_fantasia) setNomeFantasia(data.nome_fantasia);
        if (data.empresa_cnpj) setEmpresaCnpj(data.empresa_cnpj);
        if (data.inscricao_estadual) setInscricaoEstadual(data.inscricao_estadual);
        if (data.telefone) setTelefone(data.telefone);
        if (data.email) setEmail(data.email);
        if (data.rua) setRua(data.rua);
        if (data.numero) setNumero(data.numero);
        if (data.cidade) setCidade(data.cidade);
        if (data.uf) setUf(data.uf);
        if (data.cep) setCep(data.cep);
        if (data.farmaceutico_resp) setFarmaceuticoResp(data.farmaceutico_resp);
        if (data.crf_rs) setCrfRS(data.crf_rs);
        if (data.banco) setBanco(data.banco);
        if (data.agencia) setAgencia(data.agencia);
        if (data.conta) setConta(data.conta);
        if (data.coleta_razao_social) setColetaRazaoSocial(data.coleta_razao_social);
        if (data.coleta_cnpj) setColetaCnpj(data.coleta_cnpj);
        if (data.coleta_endereco) setColetaEndereco(data.coleta_endereco);
        if (data.coleta_cidade_uf) setColetaCidadeUf(data.coleta_cidade_uf);
        if (data.coleta_cep) setColetaCep(data.coleta_cep);
      }
    } catch (err) {
      console.error('Exception fetching settings:', err);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session) return;
    try {
      const payload = {
        user_id: session.user.id,
        empresa_nome: empresaNome,
        nome_fantasia: nomeFantasia,
        empresa_cnpj: empresaCnpj,
        inscricao_estadual: inscricaoEstadual,
        telefone: telefone,
        email: email,
        rua: rua,
        numero: numero,
        cidade: cidade,
        uf: uf,
        cep: cep,
        farmaceutico_resp: farmaceuticoResp,
        crf_rs: crfRS,
        banco: banco,
        agencia: agencia,
        conta: conta,
        coleta_razao_social: coletaRazaoSocial,
        coleta_cnpj: coletaCnpj,
        coleta_endereco: coletaEndereco,
        coleta_cidade_uf: coletaCidadeUf,
        coleta_cep: coletaCep,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('configuracoes')
        .upsert(payload, { onConflict: 'user_id' });
        
      if (error) {
        throw error;
      }

      setShowSettingsSuccess(true);
      setEditingSection('none');
      setTimeout(() => setShowSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configuracoes:', err);
      alert('Erro ao salvar configurações, verifique a conexão com banco de dados.');
    }
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(err => {
        console.warn('Erro ao carregar sessão inicial do Supabase:', err);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (session) {
      fetchPermissions();
      fetchEmployees();
      fetchSettings();
      fetchManuals();
    }
  }, [session]);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissoes_usuarios')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar permissoes:', error);
      }
      
      if (data) {
        setUserPermissions(data);
      } else {
        // Se não existir, criar com permissões padrão
        const { data: newPerm, error: insertError } = await supabase
          .from('permissoes_usuarios')
          .insert([{ email: session.user.email }])
          .select()
          .single();
          
        if (!insertError && newPerm) {
          setUserPermissions(newPerm);
        }
      }
    } catch (err) {
      console.error('Exception fetching permissions:', err);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        const formattedData = data.map(emp => ({
          ...emp,
          valor: emp.valor != null 
            ? Number(emp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
            : '0,00',
          gerar: false
        }));
        setEmployees(formattedData);
      }
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
    }
    setEmployeeCpf(value);
  };

  const handleValorChange = async (id: string, value: string) => {
    // Remove tudo que não for dígito
    const onlyDigits = value.replace(/\D/g, '');
    
    // Converte para número dividindo por 100 para ter os centavos
    let formattedValue = '0,00';
    if (onlyDigits.length > 0) {
      const numericValue = parseInt(onlyDigits, 10) / 100;
      formattedValue = numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, valor: formattedValue } : emp));
  };

  const handleValorSicrediChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, '');
    
    let formattedValue = '0,00';
    if (onlyDigits.length > 0) {
      const numericValue = parseInt(onlyDigits, 10) / 100;
      formattedValue = numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    setValorSicredi(formattedValue);
  };
  
  const handleValorBlur = async (id: string, value: string) => {
    // Salva no banco quando o usuário sai do campo (blur)
    try {
      const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
      const { error } = await supabase
        .from('funcionarios')
        .update({ valor: numericValue })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar valor:", error);
    }
  };
  
  const handleGerarChange = (id: string, checked: boolean) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, gerar: checked } : emp));
  };
  
  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', employeeToDelete);
        
      if (error) throw error;
      setEmployees(employees.filter(emp => emp.id !== employeeToDelete));
    } catch (error) {
      console.error("Erro ao deletar funcionário:", error);
    } finally {
      setEmployeeToDelete(null);
    }
  };

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([
          { 
            user_id: session.user.id,
            nome_completo: employeeName, 
            cpf: employeeCpf || null,
            valor: 0
          }
        ])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const newEmp = {
          ...data[0],
          valor: '0,00',
          gerar: false
        };
        setEmployees([...employees, newEmp]);
      }
      
      setEmployeeName('');
      setEmployeeCpf('');
      setShowNewEmployeeForm(false);
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error);
    }
  };

  const handleGeneratePDF = () => {
    const selectedEmployees = employees.filter(emp => emp.gerar);
    if (selectedEmployees.length === 0) {
      return;
    }

    const dataEmissao = new Date().toLocaleDateString('pt-BR');

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Recibo de Prêmio Meta</title>
  <style>
    @page { margin: 1cm; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 15px; 
      color: #000; 
      line-height: 1.6; 
      margin: 0 auto;
      max-width: 21cm;
      padding: 20px;
      box-sizing: border-box;
    }
    @media print {
      body { padding: 0; max-width: none; }
    }
    
    .recibo-container { padding: 20px 40px; height: 12.5cm; box-sizing: border-box; position: relative; overflow: hidden; }
    .linha-corte { border-bottom: 1px dashed #999; width: 100%; margin: 0; }
    
    .titulo { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin-bottom: 30px; }
    .empresa-info, .func-info { margin-bottom: 25px; }
    .texto-recibo { text-align: justify; margin-bottom: 30px; }
    
    .assinatura-box { text-align: center; position: absolute; bottom: 30px; left: 0; right: 0; }
    .linha-assinatura { border-top: 1px solid #000; width: 350px; margin: 0 auto 5px auto; }
  </style>
</head>
<body>
`;

    selectedEmployees.forEach((emp, i) => {
      // Valor needs to be parsed strictly or fall back
      const numValor = parseFloat(emp.valor.replace(/\./g, '').replace(',', '.')) || 0;
      const valorExtensoText = extenso(numValor, { mode: 'currency' });

      htmlContent += `
    <div class="recibo-container">
      <div class="titulo">RECIBO DE PAGAMENTO DE PRÊMIO META</div>
      
      <div class="empresa-info" style="font-size: 13px; line-height: 1.4; color: #333;">
        <span style="font-size: 15px; font-weight: bold; color: #000;">${empresaNome.toUpperCase()}</span>
        <br><span>CNPJ: ${empresaCnpj}</span>
      </div>
      
      <div class="func-info">
        <b>FUNCIONÁRIO:</b> ${emp.nome_completo.toUpperCase()}<br>
        <b>CPF:</b> ${emp.cpf || ''}
      </div>
      
      <div class="texto-recibo">
        Recebi nesta data a importância líquida de <b>R$ ${emp.valor} (${valorExtensoText})</b>, 
        referente ao pagamento de prêmio meta relativo ao período de Referência.<br><br>
        <b>Período de Referência:</b> ${periodo}
      </div>
      
      <div>
        Tuparendi – RS, ${dataEmissao}.
      </div>
      
      <div class="assinatura-box">
        <div class="linha-assinatura"></div>
        ${emp.nome_completo}
      </div>
    </div>
      `;

      if (i < selectedEmployees.length - 1) {
        if ((i + 1) % 2 === 0) {
          htmlContent += `<div style="page-break-after: always;"></div>`;
        } else {
          htmlContent += `<div class="linha-corte"></div>`;
        }
      }
    });

    htmlContent += `
</body>
</html>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlContent;

    const opt = {
      margin:       15,
      filename:     'recibo_premio_meta.pdf',
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

  const handleGeneratePDFSicredi = () => {
    const numValor = parseFloat(valorSicredi.replace(/\./g, '').replace(',', '.')) || 0;
    if (numValor <= 0) {
      alert("Por favor, informe um valor maior que zero.");
      return;
    }

    const data = new Date();
    const mesExtenso = data.toLocaleString('pt-BR', { month: 'long' });
    const dataExtenso = `${cidade}${uf ? ` - ${uf}` : ''}, ${data.getDate()} de ${mesExtenso} de ${data.getFullYear()}.`;

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
   <meta charset="UTF-8">
   <title>Recibo Sicredi</title>
  <style>
    @page { margin: 2.5cm; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 15px; 
      line-height: 1.6; 
      color: #000; 
      margin: 0 auto; 
      padding: 40px; 
      max-width: 21cm; 
      box-sizing: border-box;
    }
    @media print {
      body { padding: 0; max-width: none; }
    }
    
    .titulo-principal { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 40px; }
    
    .texto-recibo { text-align: justify; margin-bottom: 30px; }
    
    .subtitulo { font-weight: bold; margin-bottom: 10px; }
    .dados-bancarios { margin-bottom: 30px; line-height: 1.6; }
    
    /* ESTILO DO CARIMBO REPLICADO DO ORÇAMENTO */
    .assinatura-box { margin-top: 60px; text-align: center; page-break-inside: avoid; }
    
    .caixa-arredondada {
      border: 1px solid #000; border-radius: 12px; padding: 15px; width: 420px; margin: 0 auto; line-height: 1.4;
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
`;

    const valorExtensoText = extenso(numValor, { mode: 'currency' });
    const enderecoCompleto = `${rua || ''}${numero ? ', ' + numero : ''}`;

    htmlContent += `
  <div class="titulo-principal">Recibo de Ressarcimento - Programa Juntos</div>

  <div class="texto-recibo">
    <b>${empresaNome}</b>, inscrito(a) no CNPJ sob o nº <b>${empresaCnpj}</b>, venho por meio deste solicitar para a Cooperativa de Crédito, Poupança e Investimento União Sicredi União RS/ES, inscrita no CNPJ sob o nº 88.894.548/0001-73, o valor de <b>R$ ${valorSicredi}</b>, (<b>${valorExtensoText}</b>), referente ao ressarcimento da utilização do Programa Juntos.
  </div>

  <div class="subtitulo">Dados bancários para ressarcimento</div>
  <div class="dados-bancarios">
  Banco/Número: <b>${banco}</b><br>
  Agência: <b>${agencia}</b><br>
  Conta Corrente: <b>${conta}</b>
  </div>

  <div class="texto-recibo">
    Declaro ainda que a utilidade desses dados se refere ao CNPJ já mencionado anteriormente.
  </div>

  <div class="texto-recibo">
    <b>${dataExtenso}</b>
  </div>

  <div class="assinatura-box">
    <div class="caixa-arredondada">
      <div class="carimbo-razao">${empresaNome}</div>
      <div class="carimbo-cnpj">CNPJ ${empresaCnpj}</div>
      
      <div class="carimbo-nome-dinamico">${nomeFantasia}</div>
      <div class="carimbo-sublogo">FARMÁCIAS</div>
      
      <div class="carimbo-end">
        ${enderecoCompleto}<br>
        ${telefone && telefone.trim() !== '' ? `Fone: ${telefone}` : ''}
      </div>
    </div>
    
    <div class="area-assinatura">
        <div class="linha-assinatura"></div>
        <div class="texto-assinatura">Assinatura / Carimbo</div>
    </div>
  </div>
      `;

    htmlContent += `
</body>
</html>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlContent;

    const opt = {
      margin:       15,
      filename:     'recibo_sicredi.pdf',
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth onSession={setSession} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      {/* Modal de confirmação de exclusão */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja remover este funcionário?</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setEmployeeToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteEmployee}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão de documento */}
      {manualToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja remover este documento permanentemente?</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setManualToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteManual}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#0066b3] dark:bg-gray-800 text-white shadow-md z-30 relative border-b border-transparent dark:border-gray-700">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 mr-4 rounded-full hover:bg-[#005291] dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-gray-600 transition-colors"
              aria-label="Alternar Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                {/* Arco Branco com Seta */}
                <path 
                  d="M 18.8 68 A 36 36 0 0 1 68 18.8" 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
                <polygon 
                  points="78.4,24.8 59.6,25.5 69.6,8.1" 
                  fill="#ffffff" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  strokeLinejoin="round" 
                />
                
                {/* Arco Laranja com Seta */}
                <path 
                  d="M 81.2 32 A 36 36 0 0 1 32 81.2" 
                  fill="none" 
                  stroke="#ff8c00" 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                />
                <polygon 
                  points="21.6,75.2 40.4,74.5 30.4,91.9" 
                  fill="#ff8c00" 
                  stroke="#ff8c00" 
                  strokeWidth="2" 
                  strokeLinejoin="round" 
                />
                
                {/* Coração Central Amarelo (Menor) */}
                <g transform="translate(50, 48.5) scale(0.75) translate(-50, -48.5)">
                  <path
                    d="M50 72.5 L46.5 69 C32 54.5 26 48.5 26 39.5 C26 31 32.5 24.5 41 24.5 C45 24.5 48.5 26.5 50 30 C51.5 26.5 55 24.5 59 24.5 C67.5 24.5 74 31 74 39.5 C74 48.5 68 54.5 53.5 69 L50 72.5 Z"
                    fill="#fecb00"
                  />
                </g>
              </svg>
              <span className="text-xl font-bold ml-2 hidden sm:inline">Agafarma Tuparendi</span>
              <span className="text-lg font-bold ml-2 inline sm:hidden">Agafarma</span>
            </div>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 ml-2 rounded-full hover:bg-[#005291] dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-gray-600 transition-colors text-white"
            aria-label="Alternar Modo Escuro"
          >
            {isDarkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Overlay do Sidebar (Mobile) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 transition-opacity"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 w-64 bg-white dark:bg-gray-800 shadow-xl z-30 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200 dark:border-gray-700 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Botão Fechar no Mobile (opcional, já que tem o overlay, mas útil) */}
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center sm:hidden">
            <span className="font-semibold text-gray-700 dark:text-gray-100">Menu</span>
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => { setCurrentPage('home'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                currentPage === 'home' 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Página Inicial</span>
            </button>

            {userPermissions?.pode_acessar_premio && (
              <button
                onClick={() => { setCurrentPage('premio_meta'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'premio_meta' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Trophy className="w-5 h-5" />
                <span>Prêmio Meta</span>
              </button>
            )}

            {(userPermissions?.pode_acessar_orcamentos || userPermissions?.is_admin) && (
              <button
                onClick={() => { setCurrentPage('orcamentos_judiciais'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'orcamentos_judiciais' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Scale className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Orçamentos Judiciais</span>
              </button>
            )}

            {(userPermissions?.pode_acessar_notas_fiscais || userPermissions?.is_admin) && (
              <button
                onClick={() => { setCurrentPage('notas_fiscais'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'notas_fiscais' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileCheck className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Notas Fiscais</span>
              </button>
            )}

            {(userPermissions?.pode_acessar_sicredi || userPermissions?.is_admin) && (
              <button
                onClick={() => { setCurrentPage('recibos_sicredi'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'recibos_sicredi' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Receipt className="w-5 h-5" />
                <span>Recibos Sicredi</span>
              </button>
            )}

            {(userPermissions?.pode_acessar_manuais || userPermissions?.is_admin) && (
              <button
                onClick={() => { setCurrentPage('manuais'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentPage === 'manuais' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>Central de Manuais</span>
              </button>
            )}

            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col space-y-2">
              {userPermissions?.pode_acessar_config && (
                <button
                  onClick={() => { setCurrentPage('settings'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentPage === 'settings' 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Configurações</span>
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </nav>

        </aside>

        {/* Conteúdo Principal */}
        <main className={`flex-1 p-6 w-full transition-all duration-300 ${isSidebarOpen ? 'overflow-hidden' : 'overflow-auto'} dark:bg-gray-900`}>
          <div className="max-w-4xl mx-auto">
            {currentPage === 'home' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Bem Vindo! Selecione o que deseja:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card do Prêmio Meta */}
                  {userPermissions?.pode_acessar_premio && (
                    <div 
                      onClick={() => setCurrentPage('premio_meta')}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center text-center p-8 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a2f4c] dark:bg-blue-400"></div>
                      <Trophy className="w-12 h-12 text-[#0066b3] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 mb-3">Prêmio Meta</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Emissão rápida de recibos.
                      </p>
                    </div>
                  )}

                  {/* Card de Orçamentos Judiciais */}
                  {(userPermissions?.pode_acessar_orcamentos || userPermissions?.is_admin) && (
                    <div 
                      onClick={() => setCurrentPage('orcamentos_judiciais')}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center text-center p-8 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a2f4c] dark:bg-blue-400"></div>
                      <Scale className="w-12 h-12 text-[#0066b3] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 mb-3">Orçamentos Judiciais</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Gere novos orçamentos ou reutilize o histórico.
                      </p>
                    </div>
                  )}

                  {/* Card Notas Fiscais */}
                  {(userPermissions?.pode_acessar_notas_fiscais || userPermissions?.is_admin) && (
                    <div 
                      onClick={() => setCurrentPage('notas_fiscais')}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center text-center p-8 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a2f4c] dark:bg-blue-400"></div>
                      <FileCheck className="w-12 h-12 text-[#0066b3] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 mb-3">Espelho de NF</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Gere rascunhos rápidos para Notas Fiscais.
                      </p>
                    </div>
                  )}

                  {/* Card do Sicredi */}
                  {(userPermissions?.pode_acessar_sicredi || userPermissions?.is_admin) && (
                    <div 
                      onClick={() => setCurrentPage('recibos_sicredi')}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center text-center p-8 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a2f4c] dark:bg-blue-400"></div>
                      <Receipt className="w-12 h-12 text-[#0066b3] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 mb-3">Recibos Sicredi</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Emita recibos do Programa Juntos na hora.
                      </p>
                    </div>
                  )}

                  {/* Card de Manuais */}
                  {(userPermissions?.pode_acessar_manuais || userPermissions?.is_admin) && (
                    <div 
                      onClick={() => setCurrentPage('manuais')}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center text-center p-8 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a2f4c] dark:bg-blue-400"></div>
                      <BookOpen className="w-12 h-12 text-[#0066b3] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 mb-3">Central de Manuais</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Acesse Manuais da farmácia.
                      </p>
                    </div>
                  )}

                  {/* Card de Configurações */}
                  {userPermissions?.pode_acessar_config && (
                    <div 
                      onClick={() => setCurrentPage('settings')}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex flex-col items-center text-center p-8 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1a2f4c] dark:bg-blue-400"></div>
                      <Settings className="w-12 h-12 text-[#0066b3] dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 mb-3">Configurações</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Atualize os dados e a responsabilidade técnica.
                      </p>
                    </div>
                  )}

                  {(!userPermissions?.pode_acessar_config && !userPermissions?.pode_acessar_premio && !userPermissions?.pode_acessar_sicredi && !userPermissions?.is_admin) && (
                    <div className="col-span-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800">
                      Você não tem permissão para acessar nenhum módulo no momento. Solicite acesso ao administrador.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INICIO DO BLOCO QUE RENDERIZA PREMIO META OU RECIBOS SICREDI */}
            {(currentPage === 'premio_meta' || currentPage === 'recibos_sicredi') && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <button onClick={() => setCurrentPage('home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Página Inicial
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {currentPage === 'premio_meta' ? 'Prêmio Meta' : 'Recibos Sicredi'}
                  </span>
                </div>
                
                {/* Header (Fora do display de card) */}
                <div className="flex flex-row items-center justify-between gap-4 mb-8">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    {currentPage === 'premio_meta' ? (
                      <Trophy className="w-8 h-8 lg:w-10 lg:h-10 text-[#0066b3] dark:text-blue-400 shrink-0" />
                    ) : (
                      <Receipt className="w-8 h-8 lg:w-10 lg:h-10 text-[#0066b3] dark:text-blue-400 shrink-0" />
                    )}
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {currentPage === 'premio_meta' ? 'Prêmio Meta' : 'Recibos Sicredi'}
                      </h2>
                      <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
                        {currentPage === 'premio_meta' ? 'Emissão rápida de recibos.' : 'Emita recibos do Programa Juntos na hora.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                    {currentPage === 'premio_meta' && (
                      <>
                        <button 
                          onClick={handleGeneratePDF}
                          className="shrink-0 flex items-center justify-center p-3 lg:px-4 lg:py-2 bg-red-600 text-white rounded-full lg:rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                          title="Gerar PDF"
                        >
                          <Printer className="w-5 h-5 lg:w-4 lg:h-4" />
                          <span className="hidden lg:inline lg:ml-2 font-medium">Gerar PDF</span>
                        </button>
                        {!showNewEmployeeForm && (
                          <button 
                            onClick={() => setShowNewEmployeeForm(true)}
                            className="shrink-0 flex items-center justify-center p-3 lg:px-4 lg:py-2 bg-[#0066b3] text-white rounded-full lg:rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
                            title="Novo Funcionário"
                          >
                            <UserPlus className="w-5 h-5 lg:w-4 lg:h-4" />
                            <span className="hidden lg:inline lg:ml-2 font-medium">Novo Funcionário</span>
                          </button>
                        )}
                      </>
                    )}
                    {currentPage === 'recibos_sicredi' && (
                      <>
                        <button 
                          onClick={handleGeneratePDFSicredi}
                          className="shrink-0 flex items-center justify-center p-3 lg:px-4 lg:py-2 bg-green-600 text-white rounded-full lg:rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                          title="Gerar PDF"
                        >
                          <Printer className="w-5 h-5 lg:w-4 lg:h-4" />
                          <span className="hidden lg:inline lg:ml-2 font-medium">Gerar PDF</span>
                        </button>
                        <button 
                          onClick={() => setShowSicrediSettings(!showSicrediSettings)}
                          className="shrink-0 flex items-center justify-center p-3 lg:px-4 lg:py-2 bg-[#0066b3] text-white rounded-full lg:rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
                          title="Editar Dados Bancários"
                        >
                          <Settings className="w-5 h-5 lg:w-4 lg:h-4" />
                          <span className="hidden lg:inline lg:ml-2 font-medium">Dados Bancários</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {currentPage === 'recibos_sicredi' ? (
                  showSicrediSettings ? (
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3] dark:bg-blue-500"></div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[#0066b3] dark:text-blue-400" />
                        Editar Dados Bancários do Recibo
                      </h3>
                      
                      {showSettingsSuccess && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2 text-sm">
                          <Save className="w-5 h-5 mr-3 shrink-0" />
                          Dados bancários salvos com sucesso!
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">BANCO / NÚMERO</label>
                          <input 
                            type="text" 
                            value={banco}
                            onChange={(e) => setBanco(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Ex: 748"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AGÊNCIA</label>
                          <input 
                            type="text" 
                            value={agencia}
                            onChange={(e) => setAgencia(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Ex: 0123"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CONTA CORRENTE</label>
                          <input 
                            type="text" 
                            value={conta}
                            onChange={(e) => setConta(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Ex: 12345-6"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                        <button 
                          type="button"
                          onClick={() => setShowSicrediSettings(false)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveSettings}
                          className="flex items-center space-x-2 px-6 py-2 bg-[#0066b3] text-white rounded-lg hover:bg-[#005291] transition-colors font-medium"
                        >
                          <Save className="w-4 h-4" />
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-top-2">
                       {/* Valor do Recibo Card */}
                       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative flex flex-col h-full mb-6">
                         <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-600"></div>
                         <div className="p-6 md:p-10 flex flex-col items-center justify-center h-full text-center">
                           <div className="flex items-center gap-2 mb-6">
                             <FileText className="w-8 h-8 text-green-600" />
                             <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Valor do Recibo</h3>
                           </div>
                           
                           <div className="w-full max-w-sm">
                               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase">Valor a Receber (R$)</label>
                               <input 
                                 type="text" 
                                 value={valorSicredi}
                                 onChange={(e) => handleValorSicrediChange(e.target.value)}
                                 className="w-full text-center text-4xl px-4 py-8 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 focus:border-green-600 outline-none bg-white dark:bg-gray-700 font-bold text-gray-800 dark:text-white transition-all shadow-inner dark:shadow-black/20"
                                 placeholder="0,00"
                               />
                           </div>
                         </div>
                       </div>
                    </div>
                  )
                ) : showNewEmployeeForm ? (
                  <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-in fade-in slide-in-from-top-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Cadastrar Novo Funcionário</h3>
                      <form onSubmit={handleSubmitEmployee} className="space-y-4">
                        <div>
                          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                          <input 
                            type="text" 
                            id="nome"
                            required
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white"
                            placeholder="Digite o nome completo"
                          />
                        </div>
                        <div>
                          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF (Opcional)</label>
                          <input 
                            type="text" 
                            id="cpf"
                            value={employeeCpf}
                            onChange={handleCpfChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <button 
                            type="button"
                            onClick={() => setShowNewEmployeeForm(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="flex items-center space-x-2 px-4 py-2 bg-[#0066b3] text-white rounded-lg hover:bg-[#005291] transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>Salvar</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : isLoading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 py-16 px-4 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 border-4 border-[#0066b3] dark:border-blue-500 border-t-transparent dark:border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Carregando funcionários...</h3>
                    </div>
                  ) : employees.length > 0 ? (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3] dark:bg-blue-500"></div>
                        
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <p className="text-gray-600 dark:text-gray-300 flex-1">
                            {currentPage === 'premio_meta' 
                              ? <>Marque quem atingiu a meta. Os valores digitados ficam <strong>salvos e formatados automaticamente</strong> para os próximos meses!</>
                              : <>Marque quem vai receber os recibos do <strong>Programa Juntos</strong>. Os valores digitados ficam salvos automaticamente!</>
                            }
                          </p>
                          <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0 overflow-visible pb-2 sm:pb-0 z-10">
                              {/* Mês - Custom Dropdown */}
                              <div className="relative shrink-0">
                                <button
                                  onClick={() => setIsMonthOpen(!isMonthOpen)}
                                  onBlur={() => setTimeout(() => setIsMonthOpen(false), 200)}
                                  className="flex items-center justify-between bg-white dark:bg-gray-700 text-[#0066b3] dark:text-blue-400 text-sm font-semibold rounded-full pl-5 pr-4 py-2 border border-[#0066b3] dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors shadow-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-gray-500 outline-none w-36"
                                >
                                  {selectedMonth}
                                  <ChevronDown className="w-4 h-4 ml-2" />
                                </button>
                                
                                {isMonthOpen && (
                                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="py-1">
                                      {months.map(m => (
                                        <button
                                          key={m}
                                          onClick={() => {
                                            setSelectedMonth(m);
                                            setIsMonthOpen(false);
                                          }}
                                          className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${selectedMonth === m ? 'bg-blue-50 dark:bg-gray-700 text-[#0066b3] dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}
                                        >
                                          {m}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Ano - Pill */}
                              <div className="flex items-center bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-[#0066b3] dark:border-blue-400 shadow-sm h-[38px] px-1 shrink-0">
                                <button 
                                  onClick={() => setSelectedYear(y => y - 1)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400 hover:text-[#0066b3] dark:hover:text-blue-400"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-[#0066b3] dark:text-blue-400 text-sm w-12 text-center">{selectedYear}</span>
                                <button 
                                  onClick={() => setSelectedYear(y => y + 1)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors text-gray-500 dark:text-gray-400 hover:text-[#0066b3] dark:hover:text-blue-400"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto hidden md:block">
                          <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                              <tr className="bg-blue-50/50 dark:bg-gray-700 text-[#0066b3] dark:text-blue-400 text-sm font-semibold uppercase tracking-wider">
                                <th className="py-4 px-6 text-center w-24">GERAR?</th>
                                <th className="py-4 px-6">NOME DO FUNCIONÁRIO</th>
                                <th className="py-4 px-6">CPF</th>
                                <th className="py-4 px-6 text-center w-40">VALOR (R$)</th>
                                <th className="py-4 px-6 text-center w-24">AÇÕES</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                  <td className="py-4 px-6 text-center">
                                    <input 
                                      type="checkbox" 
                                      className="w-5 h-5 rounded border-gray-300 text-[#0066b3] focus:ring-[#0066b3] dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                                      checked={emp.gerar}
                                      onChange={(e) => handleGerarChange(emp.id, e.target.checked)}
                                    />
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-100">{emp.nome_completo}</td>
                                  <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-sm">{emp.cpf}</td>
                                  <td className="py-4 px-6 text-center">
                                    <input 
                                      type="text" 
                                      value={emp.valor}
                                      onChange={(e) => handleValorChange(emp.id, e.target.value)}
                                      onBlur={(e) => handleValorBlur(emp.id, e.target.value)}
                                      className="w-full text-right px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-300"
                                      placeholder="0,00"
                                    />
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <button 
                                      onClick={() => setEmployeeToDelete(emp.id)}
                                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 inline-flex items-center justify-center"
                                      title="Remover"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Layout Mobile */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                          {employees.map(emp => (
                            <div key={emp.id} className="p-4 flex flex-col space-y-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-3">
                                  <div className="pt-1">
                                    <input 
                                      type="checkbox" 
                                      className="w-5 h-5 rounded border-gray-300 text-[#0066b3] focus:ring-[#0066b3] dark:border-gray-600 dark:bg-gray-700 cursor-pointer"
                                      checked={emp.gerar}
                                      onChange={(e) => handleGerarChange(emp.id, e.target.checked)}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{emp.nome_completo}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{emp.cpf || 'Sem CPF'}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => setEmployeeToDelete(emp.id)}
                                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$):</label>
                                <input 
                                  type="text" 
                                  value={emp.valor}
                                  onChange={(e) => handleValorChange(emp.id, e.target.value)}
                                  onBlur={(e) => handleValorBlur(emp.id, e.target.value)}
                                  className="w-32 text-right px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 font-medium text-gray-700 dark:text-gray-300"
                                  placeholder="0,00"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 py-16 px-4 flex flex-col items-center justify-center text-center">
                        <Users className="w-16 h-16 text-gray-200 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-2">Nenhum funcionário cadastrado</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                          Cadastre os funcionários para utilizar o módulo de emissão rápida de recibos.
                        </p>
                      </div>
                    )}
              </div>
            )}

            {currentPage === 'manuais' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400 mb-6">
                  <button onClick={() => setCurrentPage('home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Página Inicial
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-800 dark:text-gray-200 dark:text-gray-200 font-medium">Central de Manuais</span>
                </div>
                
                <div className="flex flex-row items-center justify-between gap-4 mb-8">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <BookOpen className="w-8 h-8 lg:w-10 lg:h-10 text-[#0066b3] dark:text-blue-400 shrink-0" />
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 dark:text-gray-100">Central de Manuais</h2>
                      <p className="text-sm lg:text-base text-gray-500 dark:text-gray-500 dark:text-gray-400">
                        Acesse Manuais da farmácia.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                  <button
                    onClick={() => setActiveManualsTab('pops')}
                    className={`pb-3 px-1 sm:px-4 text-sm font-medium transition-colors border-b-2 mr-4 ${
                      activeManualsTab === 'pops'
                        ? 'border-[#0066b3] text-[#0066b3]'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    POPs
                  </button>
                  <button
                    onClick={() => setActiveManualsTab('manuais')}
                    className={`pb-3 px-1 sm:px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeManualsTab === 'manuais'
                        ? 'border-[#0066b3] text-[#0066b3]'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    Documentos
                  </button>
                </div>

                <div className="flex justify-end mb-6 space-x-2 sm:space-x-4">
                  {activeManualsTab === 'pops' && (
                    <button
                      onClick={handleGeneratePDFAllPops}
                      className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-white dark:bg-gray-800 border border-[#0066b3] dark:border-blue-400 text-[#0066b3] dark:text-blue-400 rounded-full md:rounded-lg hover:bg-[#0066b3] dark:bg-blue-600lue-50 transition-colors shadow-sm font-bold uppercase tracking-wide text-sm"
                      title="IMPRIMIR TODOS"
                    >
                      <Printer className="w-5 h-5 md:hidden" />
                      <Printer className="hidden md:block w-4 h-4 mr-2" />
                      <span className="hidden md:inline">IMPRIMIR TODOS</span>
                    </button>
                  )}
                  {activeManualsTab === 'manuais' && (
                    <>
                      <button
                        onClick={handleDownloadAllDocuments}
                        disabled={isUploading}
                        className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-white dark:bg-gray-800 border border-[#2980b9] dark:border-[#3498db] text-[#2980b9] dark:text-[#3498db] rounded-full md:rounded-lg hover:bg-[#0066b3] dark:bg-blue-600lue-50 transition-colors shadow-sm font-bold uppercase tracking-wide text-sm disabled:opacity-70"
                        title="Baixar Backup ZIP"
                      >
                        <Archive className="w-5 h-5 md:hidden" strokeWidth={2} />
                        <Archive className="hidden md:block w-4 h-4 mr-2" strokeWidth={2} />
                        <span className="hidden md:inline">BAIXAR PDFs</span>
                      </button>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                      <input 
                        type="file" 
                        accept=".pdf" 
                        ref={updateFileInputRef} 
                        onChange={handleFileUpdate} 
                        className="hidden" 
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-[#f39c12] text-white rounded-full md:rounded-lg hover:bg-[#d68910] transition-colors shadow-sm font-bold uppercase tracking-wide text-sm disabled:opacity-70"
                        title="Upload PDF"
                      >
                        <Upload className="w-5 h-5 md:hidden" strokeWidth={2} />
                        <Upload className="hidden md:block w-4 h-4 mr-2" strokeWidth={2} />
                        <span className="hidden md:inline">{isUploading ? 'ENVIANDO...' : 'UPLOAD PDF'}</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openManualModal()}
                    className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-[#1b5e20] text-white rounded-full md:rounded-lg hover:bg-[#124016] transition-colors shadow-sm font-bold uppercase tracking-wide text-sm"
                    title={`NOVO ${activeManualsTab === 'pops' ? 'POP' : 'DOCUMENTO'}`}
                  >
                    <Plus className="w-5 h-5 md:hidden" strokeWidth={3} />
                    <span className="hidden md:inline text-lg leading-none mr-1">+</span>
                    <span className="hidden md:inline">NOVO {activeManualsTab === 'pops' ? 'POP' : 'DOCUMENTO'}</span>
                  </button>
                </div>

                {activeManualsTab === 'pops' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
                    {manualsList
                      .filter(m => m.tipo === 'pop')
                      .map((manual) => {
                        let numStr = '';
                        try {
                          const parsed = JSON.parse(manual.conteudo);
                          if (parsed.numero) {
                            numStr = String(parsed.numero).padStart(2, '0');
                          }
                        } catch (e) {}

                        return (
                        <div key={manual.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden hover:shadow-md transition-shadow relative">
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3]"></div>
                          <div className="p-6 flex-grow">
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                              POP{numStr ? `: ${numStr}` : ''}
                            </p>
                            <h3 className="text-lg font-bold text-[#1a2f4c] dark:text-gray-100 leading-tight mb-2 uppercase">
                              {manual.titulo}
                            </h3>
                            {getDocMetadata(manual.descricao).validade && (() => {
                              const valDate = new Date(getDocMetadata(manual.descricao).validade);
                              const today = new Date();
                              const diffDays = Math.ceil((valDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                              const isExpired = diffDays < 0;
                              const isWarning = diffDays >= 0 && diffDays <= 30;
                              const statusClass = isExpired ? "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400" : isWarning ? "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400" : "text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400";
                              const statusText = isExpired ? "VENCIDO" : isWarning ? `Vence em ${diffDays} dias` : "";

                              return (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <p className={`text-xs font-semibold px-2 py-1 rounded inline-block ${statusClass}`}>
                                    Validade: {valDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                  </p>
                                  {statusText && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass} border border-current`}>
                                      {statusText}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="border-t border-gray-100 dark:border-gray-700 flex divide-x divide-gray-100 dark:divide-gray-700">
                            <button
                              onClick={() => openManualModal(manual)}
                              className="flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-medium text-[#1a2f4c] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              <span>EDITAR</span>
                            </button>
                            <button
                              onClick={() => handleGeneratePDFManual(manual)}
                              className="flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-medium text-[#1a2f4c] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              title={manual.documento_pdf_url ? "Acessar PDF" : "Gerar PDF"}
                            >
                              {manual.documento_pdf_url ? (
                                <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <Printer className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              )}
                              <span>PDF</span>
                            </button>
                            <button
                                onClick={() => setManualToDelete(manual.id)}
                                className="flex-1 flex items-center justify-center space-x-2 py-4 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">EXCLUIR</span>
                              </button>
                          </div>
                        </div>
                      );
                    })}
                      
                    {manualsList.filter(m => m.tipo === 'pop').length === 0 && (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum POP encontrado.</p>
                        <p className="text-gray-400 text-sm mt-1">Clique em "Novo POP" para começar.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4 animate-in fade-in">
                    {manualsList
                      .filter(m => m.tipo === 'manual')
                      .map((manual, index) => {
                        const colors = ['bg-[#27ae60]', 'bg-[#f39c12]', 'bg-[#2980b9]', 'bg-[#8e44ad]', 'bg-[#c0392b]'];
                        const borderColor = colors[index % colors.length];
                        
                        let isPdf = false;
                        try {
                          const parsed = JSON.parse(manual.conteudo);
                          if (parsed.type === 'pdf') isPdf = true;
                        } catch(e) {}
                        
                        return (
                          <div key={manual.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center overflow-hidden hover:shadow-md transition-shadow relative">
                            <div className={`absolute top-0 left-0 bottom-0 w-2 ${borderColor}`}></div>
                            <div className="p-6 flex-grow w-full md:w-auto pl-8">
                              <h3 className="text-xl font-bold text-[#1a2f4c] dark:text-gray-100 leading-tight mb-2">
                                {manual.titulo}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {getDocMetadata(manual.descricao).text || 'Sem descrição'}
                              </p>
                              {getDocMetadata(manual.descricao).validade && (() => {
                                const valDate = new Date(getDocMetadata(manual.descricao).validade);
                                const today = new Date();
                                const diffDays = Math.ceil((valDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                                const isExpired = diffDays < 0;
                                const isWarning = diffDays >= 0 && diffDays <= 30;
                                const statusClass = isExpired ? "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400" : isWarning ? "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400" : "text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400";
                                const statusText = isExpired ? "VENCIDO" : isWarning ? `Vence em ${diffDays} dias` : "";

                                return (
                                  <div className="flex items-center gap-2 mt-1">
                                    <p className={`text-xs font-semibold px-2 py-1 rounded inline-block ${statusClass}`}>
                                      Validade: {valDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                    </p>
                                    {statusText && (
                                      <span className={`text-xs font-bold px-2 py-1 rounded ${statusClass} border border-current`}>
                                        {statusText}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="p-6 flex items-center justify-center md:justify-end gap-3 w-full md:w-auto bg-gray-50 dark:bg-gray-800 md:bg-transparent border-t md:border-t-0 border-gray-100 dark:border-gray-700 shrink-0">
                              <button
                                onClick={() => openManualModal(manual)}
                                className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-[#2980b9] text-white rounded-full md:rounded-lg font-bold uppercase tracking-wide text-sm hover:bg-[#1f6391] transition-colors shadow-sm"
                                title={isPdf ? "Editar" : "Editar Texto"}
                              >
                                <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                                <span className="hidden md:inline md:ml-2">{isPdf ? "EDITAR" : "EDITAR TEXTO"}</span>
                              </button>

                              <div className="flex flex-row md:flex-col gap-3 md:gap-2">
                                <button
                                  onClick={() => handleGeneratePDFManual(manual)}
                                  className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-[#c0392b] text-white rounded-full md:rounded-lg font-bold uppercase tracking-wide text-sm hover:bg-[#962d22] transition-colors shadow-sm"
                                title={isPdf ? "Acessar PDF" : "Gerar PDF"}
                                >
                                  {isPdf ? (
                                    <Download className="w-5 h-5 md:w-4 md:h-4" />
                                  ) : (
                                    <Printer className="w-5 h-5 md:w-4 md:h-4" />
                                  )}
                                  <span className="hidden md:inline md:ml-2">{isPdf ? "Acessar PDF" : "Gerar PDF"}</span>
                                </button>
                                
                                {isPdf && (
                                  <button
                                    onClick={() => handleUpdateFileClick(manual.id)}
                                    disabled={isUploading}
                                    className="shrink-0 flex items-center justify-center p-3 md:px-5 md:py-2.5 bg-[#8e44ad] text-white rounded-full md:rounded-lg font-bold uppercase tracking-wide text-sm hover:bg-[#732d91] transition-colors shadow-sm disabled:opacity-70"
                                    title="Atualizar PDF"
                                  >
                                    <RefreshCw className={`w-5 h-5 md:w-4 md:h-4 ${isUploading && updatingDocumentId === manual.id ? 'animate-spin' : ''}`} />
                                    <span className="hidden md:inline md:ml-2">Atualizar</span>
                                  </button>
                                )}
                              </div>
                              
                              <button
                                onClick={() => setManualToDelete(manual.id)}
                                className="shrink-0 flex items-center justify-center p-3 text-gray-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors rounded-full"
                                title="Excluir"
                                style={{
                                  alignSelf: "flex-start"
                                }}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                    {manualsList.filter(m => m.tipo === 'manual').length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum Documento encontrado.</p>
                        <p className="text-gray-400 text-sm mt-1">Clique em "NOVO DOCUMENTO" para começar (ou envie um PDF).</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentPage === 'orcamentos_judiciais' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <button onClick={() => setCurrentPage('home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Página Inicial
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Orçamentos Judiciais</span>
                </div>
                
                <div className="max-w-none">
                  <OrcamentosJudiciais />
                </div>
              </div>
            )}

            {currentPage === 'notas_fiscais' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <button onClick={() => setCurrentPage('home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Página Inicial
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Notas Fiscais</span>
                </div>
                
                <div className="max-w-none">
                  <NotasFiscais session={session} />
                </div>
              </div>
            )}

            {currentPage === 'settings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <button onClick={() => setCurrentPage('home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Página Inicial
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-gray-800 dark:text-gray-200 font-medium">Configurações</span>
                </div>
                
                <div className="flex flex-row items-center gap-4 mb-8">
                  <Settings className="w-8 h-8 text-[#0066b3]" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Configurações</h2>
                    <p className="text-gray-500 dark:text-gray-400">Atualize os dados e a responsabilidade técnica do sistema.</p>
                  </div>
                </div>

                  {showSettingsSuccess && (
                    <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
                      <Save className="w-5 h-5 mr-2" />
                      Configurações salvas e aplicadas aos próximos recibos!
                    </div>
                  )}

                  <div className="space-y-6 animate-in fade-in">
                      {/* Card 1 - Identificação do Estabelecimento */}
                      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3]"></div>
                        
                        {editingSection === 'estabelecimento' ? (
                          <form onSubmit={handleSaveSettings} className="animate-in fade-in pt-2">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                              <Store className="w-5 h-5 text-[#0066b3]" />
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Editar Identificação do Estabelecimento</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="empresaNome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social</label>
                                <input 
                                  type="text" 
                                  id="empresaNome"
                                  value={empresaNome}
                                  onChange={(e) => setEmpresaNome(e.target.value)}
                                  required
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Razão Social"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="nomeFantasia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Fantasia</label>
                                <input 
                                  type="text" 
                                  id="nomeFantasia"
                                  value={nomeFantasia}
                                  onChange={(e) => setNomeFantasia(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Nome Fantasia"
                                />
                              </div>
      
                              <div>
                                <label htmlFor="empresaCnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                                <input 
                                  type="text" 
                                  id="empresaCnpj"
                                  value={empresaCnpj}
                                  onChange={(e) => setEmpresaCnpj(e.target.value)}
                                  required
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="00.000.000/0000-00"
                                />
                              </div>
      
                              <div>
                                <label htmlFor="inscricaoEstadual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inscrição Estadual (IE)</label>
                                <input 
                                  type="text" 
                                  id="inscricaoEstadual"
                                  value={inscricaoEstadual}
                                  onChange={(e) => setInscricaoEstadual(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Inscrição Estadual"
                                />
                              </div>
      
                              <div>
                                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone / WhatsApp</label>
                                <input 
                                  type="text" 
                                  id="telefone"
                                  value={telefone}
                                  onChange={(e) => setTelefone(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="(00) 00000-0000"
                                />
                              </div>
      
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail Oficial</label>
                                <input 
                                  type="email" 
                                  id="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="contato@empresa.com.br"
                                />
                              </div>
      
                              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-6">
                                <div className="sm:col-span-3">
                                  <label htmlFor="rua" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rua / Logradouro</label>
                                  <input 
                                    type="text" 
                                    id="rua"
                                    value={rua}
                                    onChange={(e) => setRua(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                    placeholder="Ex: Avenida Mauá"
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                                  <input 
                                    type="text" 
                                    id="numero"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                    placeholder="Ex: 1761"
                                  />
                                </div>
                              </div>
      
                              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-6">
                                <div className="sm:col-span-2">
                                  <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                                  <input 
                                    type="text" 
                                    id="cidade"
                                    value={cidade}
                                    onChange={(e) => setCidade(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                    placeholder="Ex: Tuparendi"
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <label htmlFor="uf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                                  <input 
                                    type="text" 
                                    id="uf"
                                    value={uf}
                                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                                    maxLength={2}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                    placeholder="Ex: RS"
                                  />
                                </div>
                                <div className="sm:col-span-1">
                                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                                  <input 
                                    type="text" 
                                    id="cep"
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                    placeholder="00000-000"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingSection('none');
                                  fetchSettings();
                                }}
                                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                type="submit"
                                className="flex items-center space-x-2 px-6 py-2.5 bg-[#0066b3] text-white font-medium rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
                              >
                                <Save className="w-5 h-5" />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div 
                              className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 cursor-pointer group"
                              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                            >
                              <div className="flex items-center gap-2">
                                <Store className={`w-5 h-5 transition-colors ${isSettingsExpanded ? 'text-[#0066b3]' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-400'}`} />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Identificação do Estabelecimento</h3>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection('estabelecimento');
                                    setIsSettingsExpanded(true);
                                  }}
                                  className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-900/40 text-[#0066b3] dark:text-blue-400 font-medium rounded-full sm:rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                                >
                                  <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Editar Dados</span>
                                </button>
                                <div className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSettingsExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                                  <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>
                            
                            {isSettingsExpanded && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 pb-2 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Razão Social</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{empresaNome}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome Fantasia</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{nomeFantasia || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
        
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CNPJ</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{empresaCnpj}</p>
                                </div>
        
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Inscrição Estadual (IE)</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{inscricaoEstadual || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
        
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Telefone / WhatsApp</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{telefone || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
        
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">E-mail Oficial</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{email || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
        
                                <div className="col-span-full md:col-span-1">
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Rua / Logradouro e Número</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{rua || numero ? `${rua}${numero ? `, ${numero}` : ''}` : <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
        
                                <div className="col-span-full md:col-span-1">
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cidade / UF</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{cidade || uf ? `${cidade}${uf ? `/${uf}` : ''}` : <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
        
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CEP</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{cep || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Card 2 - Responsabilidade Técnica */}
                      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3]"></div>
                        
                        {editingSection === 'responsabilidade' ? (
                          <form onSubmit={handleSaveSettings} className="animate-in fade-in pt-2">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                              <UserCheck className="w-5 h-5 text-[#0066b3]" />
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Editar Responsabilidade Técnica</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="farmaceuticoResp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Farmacêutico Responsável</label>
                                <input 
                                  type="text" 
                                  id="farmaceuticoResp"
                                  value={farmaceuticoResp}
                                  onChange={(e) => setFarmaceuticoResp(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Nome completo do Farmacêutico"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="crfRS" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número do CRF/RS</label>
                                <input 
                                  type="text" 
                                  id="crfRS"
                                  value={crfRS}
                                  onChange={(e) => setCrfRS(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="00000"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingSection('none');
                                  fetchSettings();
                                }}
                                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                type="submit"
                                className="flex items-center space-x-2 px-6 py-2.5 bg-[#0066b3] text-white font-medium rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
                              >
                                <Save className="w-5 h-5" />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div 
                              className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 cursor-pointer group"
                              onClick={() => setIsRespTecnicaExpanded(!isRespTecnicaExpanded)}
                            >
                              <div className="flex items-center gap-2">
                                <UserCheck className={`w-5 h-5 transition-colors ${isRespTecnicaExpanded ? 'text-[#0066b3]' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-400'}`} />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Responsabilidade Técnica</h3>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection('responsabilidade');
                                    setIsRespTecnicaExpanded(true);
                                  }}
                                  className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-900/40 text-[#0066b3] dark:text-blue-400 font-medium rounded-full sm:rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                                >
                                  <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Editar Dados</span>
                                </button>
                                <div className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isRespTecnicaExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                                  <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isRespTecnicaExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>
                            
                            {isRespTecnicaExpanded && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 pb-2 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome do Farmacêutico Responsável</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{farmaceuticoResp || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Número do CRF/RS</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{crfRS || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Card 3 - Coleta */}
                      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden mt-6">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3]"></div>
                        
                        {editingSection === 'coleta' ? (
                          <form onSubmit={handleSaveSettings} className="animate-in fade-in pt-2">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                              <Recycle className="w-5 h-5 text-[#0066b3]" />
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Editar Coleta</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="coletaRazaoSocial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social</label>
                                <input 
                                  type="text" 
                                  id="coletaRazaoSocial"
                                  value={coletaRazaoSocial}
                                  onChange={(e) => setColetaRazaoSocial(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none transition-shadow"
                                  placeholder="Digite a Razão Social"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="coletaCnpj" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                                <input 
                                  type="text" 
                                  id="coletaCnpj"
                                  value={coletaCnpj}
                                  onChange={(e) => setColetaCnpj(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none transition-shadow"
                                  placeholder="00.000.000/0000-00"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                              <div className="sm:col-span-1">
                                <label htmlFor="coletaEndereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                                <input 
                                  type="text" 
                                  id="coletaEndereco"
                                  value={coletaEndereco}
                                  onChange={(e) => setColetaEndereco(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none transition-shadow"
                                  placeholder="Rua, Número, Bairro"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="coletaCidadeUf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade / UF</label>
                                <input 
                                  type="text" 
                                  id="coletaCidadeUf"
                                  value={coletaCidadeUf}
                                  onChange={(e) => setColetaCidadeUf(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none transition-shadow"
                                  placeholder="Ex: Porto Alegre / RS"
                                />
                              </div>

                              <div>
                                <label htmlFor="coletaCep" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                                <input 
                                  type="text" 
                                  id="coletaCep"
                                  value={coletaCep}
                                  onChange={(e) => setColetaCep(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none transition-shadow"
                                  placeholder="00000-000"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingSection('none');
                                  fetchSettings();
                                }}
                                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                type="submit"
                                className="flex items-center space-x-2 px-6 py-2.5 bg-[#0066b3] text-white font-medium rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
                              >
                                <Save className="w-5 h-5" />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div 
                              className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 cursor-pointer group"
                              onClick={() => setIsColetaExpanded(!isColetaExpanded)}
                            >
                              <div className="flex items-center gap-2">
                                <Recycle className={`w-5 h-5 transition-colors ${isColetaExpanded ? 'text-[#0066b3]' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-400'}`} />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Coleta</h3>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection('coleta');
                                    setIsColetaExpanded(true);
                                  }}
                                  className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-900/40 text-[#0066b3] dark:text-blue-400 font-medium rounded-full sm:rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                                >
                                  <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Editar Dados</span>
                                </button>
                                <div className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isColetaExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                                  <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isColetaExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>
                            
                            {isColetaExpanded && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 pb-2 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Razão Social</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{coletaRazaoSocial || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CNPJ</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{coletaCnpj || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                                
                                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 mt-2">
                                  <div className="sm:col-span-1">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Endereço</p>
                                    <p className="text-gray-800 dark:text-gray-200 font-semibold">{coletaEndereco || <span className="text-gray-400 italic">Não informado</span>}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cidade / UF</p>
                                    <p className="text-gray-800 dark:text-gray-200 font-semibold">{coletaCidadeUf || <span className="text-gray-400 italic">Não informado</span>}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CEP</p>
                                    <p className="text-gray-800 dark:text-gray-200 font-semibold">{coletaCep || <span className="text-gray-400 italic">Não informado</span>}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Card 4 - Dados Bancários (Sicredi) */}
                      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden mt-6">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0066b3]"></div>
                        
                        {editingSection === 'bancario' ? (
                          <form onSubmit={handleSaveSettings} className="animate-in fade-in pt-2">
                            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                              <FileText className="w-5 h-5 text-[#0066b3]" />
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Editar Dados Bancários</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <div>
                                <label htmlFor="banco" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Banco</label>
                                <input 
                                  type="text" 
                                  id="banco"
                                  value={banco}
                                  onChange={(e) => setBanco(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Ex: 748"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="agencia" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agência</label>
                                <input 
                                  type="text" 
                                  id="agencia"
                                  value={agencia}
                                  onChange={(e) => setAgencia(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Ex: 0123"
                                />
                              </div>

                              <div>
                                <label htmlFor="conta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conta Corrente</label>
                                <input 
                                  type="text" 
                                  id="conta"
                                  value={conta}
                                  onChange={(e) => setConta(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-shadow"
                                  placeholder="Ex: 12345-6"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingSection('none');
                                  fetchSettings();
                                }}
                                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                type="submit"
                                className="flex items-center space-x-2 px-6 py-2.5 bg-[#0066b3] text-white font-medium rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
                              >
                                <Save className="w-5 h-5" />
                                <span>Salvar</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div 
                              className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4 cursor-pointer group"
                              onClick={() => setIsBancarioExpanded(!isBancarioExpanded)}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className={`w-5 h-5 transition-colors ${isBancarioExpanded ? 'text-[#0066b3]' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-400'}`} />
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Dados Bancários (Sicredi)</h3>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSection('bancario');
                                    setIsBancarioExpanded(true);
                                  }}
                                  className="flex items-center space-x-2 p-2 sm:px-4 sm:py-2 bg-blue-50 dark:bg-blue-900/40 text-[#0066b3] dark:text-blue-400 font-medium rounded-full sm:rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                                >
                                  <Edit2 className="w-5 h-5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Editar Dados</span>
                                </button>
                                <div className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isBancarioExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                                  <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isBancarioExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>
                            
                            {isBancarioExpanded && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 pb-2 animate-in slide-in-from-top-2 duration-300">
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Banco</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{banco || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Agência</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{agencia || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Conta Corrente</p>
                                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{conta || <span className="text-gray-400 italic">Não informado</span>}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {userPermissions?.is_admin && (
                        <div className="mt-2">
                          <UserManagement />
                        </div>
                      )}
                    </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Manuals & POPs Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0066b3]" />
                {editingManualId ? 'Editar Documento' : `Novo ${activeManualsTab === 'pops' ? 'POP' : 'Manual'}`}
              </h3>
              <div className="flex items-center space-x-2">
                {editingManualId && (
                  <button 
                    onClick={() => {
                      if (editingManualId) {
                        setManualToDelete(editingManualId);
                        setIsManualModalOpen(false);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Documento"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsManualModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {activeManualsTab === 'pops' ? (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="w-full md:w-1/4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nº POP</label>
                      <input 
                        type="text" 
                        value={popNumero}
                        onChange={(e) => setPopNumero(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                      />
                    </div>
                    <div className="w-full md:w-3/4">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">TÍTULO</label>
                      <input 
                        type="text" 
                        value={currentDocTitle}
                        onChange={(e) => setCurrentDocTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">1. OBJETIVO</label>
                    <textarea 
                      value={popObjetivo}
                      onChange={(e) => setPopObjetivo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">2. RESPONSABILIDADE</label>
                    <textarea 
                      value={popResponsabilidade}
                      onChange={(e) => setPopResponsabilidade(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">3. ALCANCE</label>
                    <textarea 
                      value={popAlcance}
                      onChange={(e) => setPopAlcance(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">4. PROCEDIMENTO / DESCRIÇÃO</label>
                    <RichTextEditor value={popProcedimento} onChange={setPopProcedimento} />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título do Documento</label>
                    <input 
                      type="text" 
                      value={currentDocTitle}
                      onChange={(e) => setCurrentDocTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                      placeholder="Ex: Manual de Boas Práticas"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                    <textarea 
                      value={currentDocDescription}
                      onChange={(e) => setCurrentDocDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none"
                      placeholder="Breve descrição do documento..."
                      rows={2}
                    ></textarea>
                  </div>
                  <div className="mb-6 flex gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <label className="flex-1">
                      <span className="block mb-2">Data de Validade (opcional)</span>
                      <input 
                        type="date" 
                        value={currentDocValidade}
                        onChange={(e) => setCurrentDocValidade(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      />
                    </label>
                    <label className="flex items-center mt-6 cursor-pointer space-x-3">
                      <input
                        type="checkbox"
                        checked={currentDocUsarCapa}
                        onChange={(e) => setCurrentDocUsarCapa(e.target.checked)}
                        className="w-5 h-5 text-[#0066b3] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#0066b3] focus:border-transparent outline-none cursor-pointer"
                      />
                      <span>Imprimir Capa Padrão</span>
                    </label>
                  </div>
                  {!currentDocContent?.startsWith('{"type":"pdf"') && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conteúdo</label>
                      <RichTextEditor value={currentDocContent} onChange={setCurrentDocContent} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl shrink-0">
               <button 
                onClick={() => setIsManualModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 transition-colors"
               >
                 Cancelar
               </button>
               <button 
                onClick={handleSaveManual}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[#0066b3] text-white rounded-lg hover:bg-[#005291] transition-colors font-medium shadow-sm"
               >
                 <Save className="w-4 h-4" />
                 <span>Salvar Documento</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
