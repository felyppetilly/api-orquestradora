// Importações necessárias
import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
//import { processarPdfs } from "./processarPdfs.ts";

serve(async (req) => {
  try {
    // Verifica se o método é POST
    if (req.method !== "POST") {
      return new Response("Método não permitido", { status: 405 });
    }

    // Obtém o corpo da requisição
    const { userId } = await req.json();

    // Verifica se o userId foi fornecido
    if (!userId) {
      return new Response("Parâmetro 'userId' é obrigatório", { status: 400 });
    }

    // Cria o cliente do Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL"), // URL do Supabase
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") // Chave de serviço
    );

    // Consulta a view vendedores_pendentes filtrando pelo userId
    const { data, error } = await supabase
      .from("vendedores_pendentes") // Nome da view
      .select("*")
      .eq("user", userId); // Filtro pelo userId

    // Verifica se houve erro na consulta
    if (error) {
      console.error("Erro na consulta à view:", error);
      return new Response("Erro ao consultar a view vendedores_pendentes", {
        status: 500,
      });
    }

    //executa leitura dos pdfs
    //return await processarPdfs(data);

    // Retorna os dados da view
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro interno no servidor:", error);
    return new Response("Erro interno no servidor", { status: 500 });
  }
});