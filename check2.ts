import { supabase } from "./src/supabase";

async function check() {
  const { data: oData, error: oError } = await supabase.from("orcamentos_judiciais").select(`*, paciente_orcamento(*)`);
  console.log("Orçamentos com pacientes:", JSON.stringify(oData, null, 2), oError);
  
  const { data: mData, error: mError } = await supabase.from("medicamento_orcamento").select('*').limit(2);
  console.log("Medicamentos:", mData, mError);
}

check();
