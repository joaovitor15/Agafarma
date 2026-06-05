import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X, Check, FileText, File, DollarSign, UserPlus, Save, Scale, Edit, ChevronDown, AlertTriangle, Printer } from 'lucide-react';
import { supabase } from '../supabase';
import { generateOrcamentoPdf } from '../utils/pdfGenerator';

interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  created_at?: string;
}

interface Orcamento {
  id: string;
  paciente_id: string;
  user_id?: string;
  created_at?: string;
}

interface Medicamento {
  id: string;
  orcamento_id?: string;
  nome: string;
  principio: string;
  quantidade: string;
  preco: string;
}

export function OrcamentosJudiciais() {
  const [activeTab, setActiveTab] = useState<'novo' | 'historico'>('novo');
  
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermHistorico, setSearchTermHistorico] = useState('');
  const [editingOrcamentoId, setEditingOrcamentoId] = useState<string | null>(null);
  const [orcamentoToDelete, setOrcamentoToDelete] = useState<string | null>(null);
  
  const [isPacienteModalOpen, setIsPacienteModalOpen] = useState(false);
  const [novoPacienteNome, setNovoPacienteNome] = useState('');
  const [novoPacienteCpf, setNovoPacienteCpf] = useState('');
  
  const [settings, setSettings] = useState({
    razaoSocial: 'FARMÁCIA AGAFARMA TUPARENDI LTDA',
    cnpj: '00.000.000/0000-00',
    ie: 'ISENTO',
    endereco: 'Av. Tucunduva, Centro, Tuparendi - RS',
    nomeFantasia: 'AGAFARMA TUPARENDI',
    telefone: '(55) 3543-0000'
  });

  useEffect(() => {
    fetchPacientes();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('empresa_nome, empresa_cnpj, inscricao_estadual, rua, numero, cidade, uf, telefone, nome_fantasia')
        .single();
      
      if (data) {
        setSettings({
          razaoSocial: data.empresa_nome || 'FARMÁCIA AGAFARMA TUPARENDI LTDA',
          cnpj: data.empresa_cnpj || '00.000.000/0000-00',
          ie: data.inscricao_estadual || 'ISENTO',
          endereco: data.rua ? `${data.rua}, ${data.numero}, ${data.cidade} - ${data.uf}` : 'Av. Tucunduva, Centro, Tuparendi - RS',
          nomeFantasia: data.nome_fantasia || 'AGAFARMA TUPARENDI',
          telefone: data.telefone || '(55) 3543-0000'
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'historico') {
      fetchHistorico();
    }
  }, [activeTab]);

  const fetchHistorico = async () => {
    setIsLoadingHistorico(true);
    try {
      const { data, error } = await supabase
        .from('orcamentos_judiciais')
        .select(`
          id,
          paciente_id,
          created_at,
          paciente_orcamento:paciente_id ( nome, cpf ),
          medicamento_orcamento ( nome, principio, quantidade, preco )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching historico:', error);
      } else if (data) {
        setHistorico(data);
      }
    } catch (e) {
      console.error('Exception fetching historico:', e);
    }
    setIsLoadingHistorico(false);
  };

  const resetForm = () => {
    setSelectedPacienteId('');
    setSearchTerm('');
    setEditingOrcamentoId(null);
    setMedicamentos([{ id: Date.now().toString(), nome: '', principio: '', quantidade: '', preco: '' }]);
  };

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from('paciente_orcamento')
      .select('*')
      .order('nome', { ascending: true });
      
    if (error) {
      console.error('Error fetching patients:', error);
    } else if (data) {
      setPacientes(data);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    setNovoPacienteCpf(value);
  };

  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    { id: Date.now().toString(), nome: '', principio: '', quantidade: '', preco: '' }
  ]);

  const filteredPacientes = pacientes.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredHistorico = historico.filter(orc => {
    const term = searchTermHistorico.toLowerCase();
    const nome = (orc.paciente_orcamento?.nome || '').toLowerCase();
    const cpf = (orc.paciente_orcamento?.cpf || '').toLowerCase();
    return nome.includes(term) || cpf.includes(term);
  });

  const handleAddMedicamento = () => {
    setMedicamentos([...medicamentos, { id: Date.now().toString(), nome: '', principio: '', quantidade: '', preco: '' }]);
  };

  const handleRemoveMedicamento = (id: string) => {
    if (medicamentos.length > 1) {
      setMedicamentos(medicamentos.filter(m => m.id !== id));
    }
  };

  const updateMedicamento = (id: string, field: keyof Medicamento, value: string) => {
    setMedicamentos(medicamentos.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handlePrecoChange = (id: string, value: string) => {
    let onlyNumbers = value.replace(/\D/g, '');
    if (onlyNumbers.length === 0) {
      updateMedicamento(id, 'preco', '');
      return;
    }
    
    const amount = (parseInt(onlyNumbers, 10) / 100).toFixed(2);
    const masked = amount.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    updateMedicamento(id, 'preco', masked);
  };

  const handleSavePaciente = async () => {
    if (!novoPacienteNome.trim()) return;
    
    const { data, error } = await supabase
      .from('paciente_orcamento')
      .insert([
        { nome: novoPacienteNome, cpf: novoPacienteCpf }
      ])
      .select();

    if (error) {
      console.error("Error saving patient:", error);
      alert("Erro ao salvar paciente.");
      return;
    }

    if (data && data.length > 0) {
      const novo = data[0] as Paciente;
      setPacientes([...pacientes, novo]);
      setSelectedPacienteId(novo.id);
      setSearchTerm(novo.nome);
      setIsPacienteModalOpen(false);
      setNovoPacienteNome('');
      setNovoPacienteCpf('');
    }
  };

  const handleSaveOrcamento = async () => {
    if (!selectedPacienteId) {
      setValidationMessage("Por favor, selecione um paciente para salvar o orçamento.");
      setShowValidationModal(true);
      return;
    }
    const emptyMeds = medicamentos.some(m => !m.nome.trim() || !m.quantidade || !m.preco);
    if (emptyMeds) {
      setValidationMessage("Por favor, preencha todos os campos obrigatórios dos medicamentos (Nome, Quantidade e Preço).");
      setShowValidationModal(true);
      return;
    }
    
    try {
      let orcamentoId = editingOrcamentoId;

      if (orcamentoId) {
        // Atualizar orçamento existente
        const { error: orcError } = await supabase
          .from('orcamentos_judiciais')
          .update({ paciente_id: selectedPacienteId })
          .eq('id', orcamentoId);
          
        if (orcError) {
          console.error("Erro ao atualizar orçamento:", orcError);
          alert("Erro ao atualizar o orçamento.");
          return;
        }

        // Deletar os medicamentos antigos
        const { error: delError } = await supabase
          .from('medicamento_orcamento')
          .delete()
          .eq('orcamento_id', orcamentoId);

        if (delError) {
          console.error("Erro ao deletar medicamentos antigos:", delError);
        }
      } else {
        // Criar novo orçamento
        const { data: orcData, error: orcError } = await supabase
          .from('orcamentos_judiciais')
          .insert([{ paciente_id: selectedPacienteId }])
          .select();

        if (orcError || !orcData || orcData.length === 0) {
          console.error("Erro ao criar orçamento:", orcError);
          alert("Erro ao criar o orçamento.");
          return;
        }

        orcamentoId = orcData[0].id;
      }

      // 2. Preparar os medicamentos para inserir
      const medicamentosToInsert = medicamentos.map(med => {
        const qtdApenasNum = med.quantidade.toString().replace(/\D/g, '');
        const qtdParse = qtdApenasNum ? parseInt(qtdApenasNum, 10) : 1;

        let precoParse = 0;
        if (med.preco) {
          const stringPreco = med.preco.toString();
          const apenasNumVirgula = stringPreco.replace(/[^\d,]/g, '');
          const comPonto = apenasNumVirgula.replace(',', '.');
          precoParse = parseFloat(comPonto);
        }

        return {
          orcamento_id: orcamentoId,
          nome: med.nome,
          principio: med.principio || null,
          quantidade: qtdParse,
          preco: isNaN(precoParse) ? 0 : precoParse
        };
      });

      // 3. Salvar (inserir) novos medicamentos
      const { error: medError } = await supabase
        .from('medicamento_orcamento')
        .insert(medicamentosToInsert);

      if (medError) {
        console.error("Erro ao salvar medicamentos do orçamento:", medError);
        alert("Erro ao salvar medicamentos do orçamento.");
        return;
      }

      alert("Orçamento salvo com sucesso!");
      
      resetForm();
      setActiveTab('historico');

    } catch (e) {
      console.error("Exceção ao salvar orçamento:", e);
      alert("Ocorreu um erro ao salvar o orçamento.");
    }
  };

  const handleGerarPdf = () => {
    if (!selectedPacienteId) {
      setValidationMessage("Por favor, selecione um paciente para gerar o PDF.");
      setShowValidationModal(true);
      return;
    }

    const hasEmptyMeds = medicamentos.some(m => !m.nome.trim() || !m.quantidade || !m.preco);
    if (hasEmptyMeds) {
      setValidationMessage("O PDF só pode ser gerado se os dados do medicamento estiverem preenchidos.");
      setShowValidationModal(true);
      return;
    }

    const paciente = {
      nome: searchTerm,
      cpf: pacientes.find(p => p.id === selectedPacienteId)?.cpf || ''
    };

    const medsToPrint = medicamentos.map(med => ({
      nome: med.nome || '',
      principio: med.principio || '',
      quantidade: med.quantidade || '1',
      preco: med.preco || '0'
    }));

    try {
      generateOrcamentoPdf(paciente, medsToPrint, settings);
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      alert("Ocorreu um erro ao gerar o PDF.");
    }
  };

  const handleEditOrcamento = (orc: any) => {
    setEditingOrcamentoId(orc.id);
    setSelectedPacienteId(orc.paciente_id || '');
    setSearchTerm(orc.paciente_orcamento?.nome || '');
    
    if (orc.medicamento_orcamento && orc.medicamento_orcamento.length > 0) {
      const medsForEdit = orc.medicamento_orcamento.map((med: any) => ({
        id: Date.now().toString() + Math.random().toString().substring(2, 6),
        nome: med.nome || '',
        principio: med.principio || '',
        quantidade: med.quantidade ? med.quantidade.toString() : '',
        preco: typeof med.preco === 'number' ? med.preco.toFixed(2).replace('.', ',') : (med.preco || '')
      }));
      setMedicamentos(medsForEdit);
    } else {
      setMedicamentos([{ id: Date.now().toString(), nome: '', principio: '', quantidade: '', preco: '' }]);
    }
    
    setActiveTab('novo');
  };

  const handleDeleteOrcamento = (orcId: string) => {
    setOrcamentoToDelete(orcId);
  };

  const confirmDelete = async () => {
    if (!orcamentoToDelete) return;
    
    try {
      // Deletar os medicamentos filhos primeiro
      const { error: delError } = await supabase
        .from('medicamento_orcamento')
        .delete()
        .eq('orcamento_id', orcamentoToDelete);

      if (delError) {
        console.error("Erro ao deletar medicamentos:", delError);
      }

      // Deletar o orçamento (pai)
      const { error } = await supabase
        .from('orcamentos_judiciais')
        .delete()
        .eq('id', orcamentoToDelete);

      if (error) {
        console.error("Erro ao excluir orçamento:", error);
      } else {
        fetchHistorico();
      }
    } catch (e) {
      console.error("Exceção ao excluir orçamento:", e);
    } finally {
      setOrcamentoToDelete(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <Scale className="w-8 h-8 lg:w-10 lg:h-10 text-[#0066b3] dark:text-blue-400 shrink-0" />
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">Orçamentos Judiciais</h2>
            <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400">
              Gere novos orçamentos ou reutilize o histórico.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button 
            onClick={handleGerarPdf}
            className="shrink-0 flex items-center justify-center p-3 lg:px-4 lg:py-2 bg-red-600 text-white rounded-full lg:rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            title="Gerar PDF"
          >
            <Printer className="w-5 h-5 lg:w-4 lg:h-4" />
            <span className="hidden lg:inline lg:ml-2 font-medium">Gerar PDF</span>
          </button>
          {!isPacienteModalOpen && (
            <button 
              onClick={() => {
                setNovoPacienteNome(searchTerm);
                setIsPacienteModalOpen(true);
              }}
              className="shrink-0 flex items-center justify-center p-3 lg:px-4 lg:py-2 bg-[#0066b3] text-white rounded-full lg:rounded-lg hover:bg-[#005291] transition-colors shadow-sm"
              title="Novo Paciente"
            >
              <UserPlus className="w-5 h-5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline lg:ml-2 font-medium">Novo Paciente</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-2 sm:space-x-6 border-b border-gray-200 dark:border-gray-700 mb-6 px-1">
        <button
          onClick={() => setActiveTab('novo')}
          className={`pb-3 px-1 sm:px-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'novo'
              ? 'border-[#0066b3] dark:border-blue-400 text-[#0066b3] dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          Orçamentos Judiciais
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`pb-3 px-1 sm:px-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'historico'
              ? 'border-[#0066b3] dark:border-blue-400 text-[#0066b3] dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          Histórico
        </button>
      </div>

      {activeTab === 'novo' ? (
        <>
          {isPacienteModalOpen && (
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Cadastrar Novo Paciente</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={novoPacienteNome}
                    onChange={(e) => setNovoPacienteNome(e.target.value)}
                    placeholder="Digite o nome completo"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white transition-shadow"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    value={novoPacienteCpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white transition-shadow"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setIsPacienteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePaciente}
                  disabled={!novoPacienteNome.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#0066b3] text-white rounded-lg hover:bg-[#005291] font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            {/* Coluna da Esquerda: Sessão do Paciente */}
            <div className="md:col-span-6 flex flex-col md:sticky md:top-6 self-start">
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">1. Selecione o Paciente</h3>
                
                {selectedPacienteId ? (
                  <div className="flex-1 flex flex-col justify-start">
                    <div className="p-5 border border-[#0066b3]/30 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Paciente Selecionado</p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                            {pacientes.find(p => p.id === selectedPacienteId)?.nome}
                          </p>
                          {pacientes.find(p => p.id === selectedPacienteId)?.cpf && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              CPF: {pacientes.find(p => p.id === selectedPacienteId)?.cpf}
                            </p>
                          )}
                        </div>
                        <div className="bg-[#0066b3] dark:bg-blue-500 text-white p-1.5 rounded-full animate-in zoom-in">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setSelectedPacienteId('')}
                        className="mt-6 px-4 py-2 text-sm text-[#0066b3] dark:text-blue-400 border border-[#0066b3]/30 dark:border-blue-400/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 font-medium transition-colors w-full"
                      >
                        Alterar Paciente
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar pelo nome"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      <div className="relative">
                        <select
                          value={selectedPacienteId || ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            if (id) {
                              const paciente = pacientes.find(p => p.id === id);
                              if (paciente) {
                                setSearchTerm(paciente.nome);
                                setSelectedPacienteId(id);
                                setTimeout(() => {
                                  const firstMed = document.getElementById('medicamento_nome_0');
                                  if (firstMed) firstMed.focus();
                                }, 100);
                              }
                            } else {
                              setSearchTerm('');
                            }
                          }}
                          className="w-full pl-4 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 font-medium text-gray-700 dark:text-white appearance-none cursor-pointer shadow-sm"
                        >
                          <option value="">Selecione o paciente</option>
                          {pacientes.map(paciente => (
                            <option key={paciente.id} value={paciente.id}>
                              {paciente.nome} {paciente.cpf ? `(${paciente.cpf})` : ''}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                    
                    {searchTerm.trim().length > 0 ? (
                      <div className="overflow-y-auto space-y-2 pr-2 flex-1 max-h-[400px]">
                        {filteredPacientes.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            Nenhum paciente encontrado com "{searchTerm}".
                            <button 
                              onClick={() => {
                                setNovoPacienteNome(searchTerm);
                                setIsPacienteModalOpen(true);
                              }}
                              className="mx-auto mt-4 flex items-center justify-center text-[#0066b3] dark:text-blue-400 font-medium hover:underline w-full p-2"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              <span>Cadastrar novo paciente</span>
                            </button>
                          </div>
                        ) : (
                          filteredPacientes.map(_paciente => (
                            <div
                              key={_paciente.id}
                              onClick={() => setSelectedPacienteId(_paciente.id)}
                              className={`p-4 rounded-lg cursor-pointer transition-all border ${
                                selectedPacienteId === _paciente.id
                                  ? 'border-[#0066b3] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 shadow-sm'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-[#0066b3]/30 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-800 dark:text-gray-100">{_paciente.nome}</p>
                                  {_paciente.cpf && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">CPF: {_paciente.cpf}</p>}
                                </div>
                                {selectedPacienteId === _paciente.id && (
                                  <div className="bg-[#0066b3] dark:bg-blue-500 text-white p-1 rounded-full animate-in zoom-in">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                        <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-sm max-w-xs">Digite o nome do paciente para buscar no sistema.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Coluna da Direita: Sessão dos Medicamentos */}
            <div className="md:col-span-6 flex flex-col h-full">
              <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">2. Medicamentos do Orçamento</h3>
                
                <div className="space-y-6">
                  {medicamentos.map((med, index) => (
                    <div key={med.id} className="relative p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6 group">
                      <div className="absolute -left-3 -top-3 w-8 h-8 bg-[#0066b3] dark:bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10">
                        {index + 1}
                      </div>
                      
                      <div className="space-y-4">
                        {/* Linha 1: Medicamento e Principio Ativo */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                          <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Medicamento *</label>
                            <input
                              id={`medicamento_nome_${index}`}
                              type="text"
                              value={med.nome}
                              onChange={(e) => updateMedicamento(med.id, 'nome', e.target.value)}
                              placeholder="Medicamento"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm font-semibold"
                            />
                          </div>
                          
                          <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Princípio Ativo</label>
                            <input
                              type="text"
                              value={med.principio}
                              onChange={(e) => updateMedicamento(med.id, 'principio', e.target.value)}
                              placeholder="Opcional"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm font-medium"
                            />
                          </div>
                        </div>
                        
                        {/* Linha 2: Quantidade e Valor Unitario */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm max-w-xl">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade *</label>
                            <input
                              type="text"
                              value={med.quantidade}
                              onChange={(e) => updateMedicamento(med.id, 'quantidade', e.target.value)}
                              placeholder="Ex: 2"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm font-medium"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Unitário *</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs">R$</span>
                              <input
                                type="text"
                                value={med.preco}
                                onChange={(e) => handlePrecoChange(med.id, e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 dark:text-white text-sm font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => handleRemoveMedicamento(med.id)}
                          disabled={medicamentos.length === 1}
                          className="p-1 px-3 text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:disabled:hover:text-gray-500 flex items-center"
                          title="Remover medicamento"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-stretch lg:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleAddMedicamento}
                    className="flex justify-center items-center space-x-2 text-[#0066b3] dark:text-blue-400 font-medium hover:text-[#005291] dark:hover:text-blue-300 transition-colors p-2 sm:px-4 md:p-2 lg:px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 w-full sm:w-auto md:w-full lg:w-auto"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Adicionar Medicamento</span>
                  </button>

                  <button
                    onClick={handleSaveOrcamento}
                    className="flex justify-center items-center space-x-2 px-6 py-3 sm:py-2 md:py-3 lg:py-2 bg-[#0066b3] text-white rounded-lg hover:bg-[#005291] font-medium transition-colors shadow-sm w-full sm:w-auto md:w-full lg:w-auto"
                  >
                    <Save className="w-5 h-5" />
                    <span>Salvar Orçamento</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no histórico por nome ou CPF..."
                value={searchTermHistorico}
                onChange={(e) => setSearchTermHistorico(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0066b3] dark:focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50/50 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {isLoadingHistorico ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066b3] dark:border-blue-500 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Carregando histórico...</p>
            </div>
          ) : filteredHistorico.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center py-16">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">Histórico Vazio</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">Nenhum orçamento encontrado no histórico com estes filtros.</p>
            </div>
          ) : (
            filteredHistorico.map((orc: any) => (
              <div key={orc.id} className="relative bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3 w-full md:w-1/3 shrink-0 pr-12 md:pr-0">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg mt-1 shrink-0">
                    <FileText className="w-5 h-5 text-[#0066b3] dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{orc.paciente_orcamento?.nome || 'Paciente Desconhecido'}</h4>
                    <div className="flex flex-col xl:flex-row xl:items-center text-sm text-gray-500 dark:text-gray-400 gap-1 xl:gap-3 mt-1">
                      {orc.paciente_orcamento?.cpf && (
                        <span className="flex items-center">
                          <span className="font-medium mr-1 text-xs uppercase tracking-wider">CPF:</span> {orc.paciente_orcamento.cpf}
                        </span>
                      )}
                      <span className="hidden xl:inline text-gray-300 dark:text-gray-600">•</span>
                      <span>
                        {new Date(orc.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 md:border-l md:border-gray-100 md:dark:border-gray-700 md:pl-4">
                  <div className="flex flex-wrap gap-2">
                    {(orc.medicamento_orcamento || []).map((med: any, idx: number) => (
                      <div key={idx} className="flex items-center text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5 shadow-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">{med.nome}</span>
                        <span className="text-gray-500 dark:text-gray-400 mr-2">Qtd: {med.quantidade}</span>
                        <span className="font-semibold text-[#0066b3] dark:text-blue-400">R$ {typeof med.preco === 'number' ? med.preco.toFixed(2).replace('.', ',') : med.preco}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute top-4 right-4 lg:relative lg:top-auto lg:right-auto shrink-0 flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteOrcamento(orc.id)}
                    className="flex justify-center items-center p-3 lg:px-4 lg:py-2 border border-gray-200 dark:border-gray-600 text-red-600 dark:text-red-400 rounded-full lg:rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-colors shadow-sm bg-white dark:bg-gray-800"
                    title="Excluir Orçamento"
                  >
                    <Trash2 className="w-5 h-5 lg:w-4 lg:h-4 text-red-500 lg:text-red-600 dark:text-red-400 lg:dark:text-red-400" />
                    <span className="hidden lg:inline lg:ml-2 text-sm font-medium">Excluir</span>
                  </button>
                  <button
                    onClick={() => handleEditOrcamento(orc)}
                    className="flex justify-center items-center p-3 lg:px-4 lg:py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-full lg:rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm bg-white dark:bg-gray-800"
                    title="Reutilizar Orçamento"
                  >
                    <Edit className="w-5 h-5 lg:w-4 lg:h-4 text-[#0066b3] dark:text-blue-400" />
                    <span className="hidden lg:inline lg:ml-2 text-sm font-medium">Reutilizar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orcamentoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Excluir Orçamento</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">Tem certeza que deseja excluir permanentemente este orçamento? Esta ação não pode ser desfeita.</p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setOrcamentoToDelete(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validação */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Aviso</h3>
            </div>
            
            <div className="mb-6 ml-13">
              <p className="text-gray-600 dark:text-gray-300">
                {validationMessage}
              </p>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-6 py-2 bg-[#0066b3] dark:bg-blue-600 text-white hover:bg-[#005291] dark:hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
