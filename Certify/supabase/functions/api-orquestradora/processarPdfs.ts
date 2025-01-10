import { PDFExtract } from "https://deno.land/x/pdf_extract@1.0.0/mod.ts";

export async function processarPdfs(req: Request) {
  try {
    // Obtém a lista de vendedores da requisição
    const vendedores = await req.json();

    if (!Array.isArray(vendedores)) {
      return new Response("A entrada deve ser uma lista de vendedores", { status: 400 });
    }

    // Lista para armazenar os dados extraídos
    const resultados: { cpf: string; nome_mae: string }[] = [];

    for (const vendedor of vendedores) {
      if (!vendedor.ficha_serasa) {
        continue; // Pula se não houver um PDF
      }

      // Faz o download do PDF a partir da URL
      const response = await fetch(vendedor.ficha_serasa);

      if (!response.ok) {
        console.error(`Erro ao baixar PDF: ${vendedor.ficha_serasa}`);
        continue;
      }

      const pdfBytes = await response.arrayBuffer();

      // Usa o PDFExtract para ler o conteúdo do PDF
      const pdfExtract = new PDFExtract();
      const extractedText = await pdfExtract.extract(pdfBytes);

      // Combina os textos das páginas
      const fullText = extractedText.pages.map((page) => page.text).join(" ");

      // Procura pelo CPF e Nome da Mãe no texto
      const cpfMatch = fullText.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/); // Formato de CPF
      const nomeMaeMatch = fullText.match(/Nome da Mãe:\s+(.+?)\s/); // Padrão do Nome da Mãe

      const cpf = cpfMatch ? cpfMatch[0] : "";
      const nomeMae = nomeMaeMatch ? nomeMaeMatch[1] : "";

      // Adiciona os resultados
      resultados.push({ cpf, nome_mae: nomeMae });
    }

    // Retorna a lista de vendedores com CPF e Nome da Mãe
    return new Response(JSON.stringify(resultados), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao processar PDFs:", error);
    return new Response("Erro interno no servidor", { status: 500 });
  }
}