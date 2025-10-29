# 🧠 I2A2-SynergIA-ia-agents

**SynergIA – Processador NF-e** é uma solução inteligente, acessível e expansível para automação do processamento de Notas Fiscais Eletrônicas (NF-e) em formato XML ou ZIP. Desenvolvida com foco em produtividade e rastreabilidade fiscal, a aplicação utiliza tecnologias acessíveis (Google Apps Script, Google Sheets, HTML5 e n8n) e inteligência artificial (IA) para extrair, organizar, deduplicar e enriquecer os dados fiscais extraídos diretamente dos arquivos de nota.

Este repositório reúne o código-fonte da aplicação front-end e back-end, bem como os fluxos de automação para enriquecimento de dados com CFOP e NCM por meio de agentes de IA externos. A ferramenta foi pensada para profissionais da área contábil, fiscal, administrativa ou educacional que desejam automatizar rotinas repetitivas e extrair valor de seus dados fiscais de forma estruturada e confiável.

---

## ✨ Funcionalidades principais

- **Upload de arquivos XML ou ZIP com múltiplas NF-e**
- Resposta recebidass no e-mail solicitado;
- **Extração automática** de campos fiscais relevantes (CNPJ, nome, UF, endereço, CFOP, NCM, produto, valor, emissão etc.)
- **Deduplicação inteligente** com base na chave de acesso da nota
- **Gravação estruturada** em planilha Google Sheets
- **Interface web intuitiva**, responsiva e com alertas de erro ou duplicidade
- **Enriquecimento de dados via IA** para obter descrições oficiais de CFOP e NCM
- **Automação com n8n**: leitura da planilha, envio para agentes, gravação de resultados
- Pronta para **integração com dashboards e BI**

---

## 🚀 Como usar

1. **Clone o repositório**:

2. **Configure o Google Apps Script**:

- Acesse [https://script.google.com](https://script.google.com) ou dentro do seu Google Drive, criar um arquivo de Script
- Crie um novo projeto e cole o conteúdo do arquivo `Code.gs`. Rrenomeie o arquivo para Code.gs
- Crie um arquivo HTML chamado `Index` e cole o conteúdo do `index.html`
- Publique o script como um aplicativo da web com permissões adequadas
- Crie uma planilha Google com o nome da aba `NFe Data, edite no código inserindo o ID da planilha;

3. **Instale o fluxo n8n**:

- Importe o arquivo `.json` fornecido no n8n
- Configure os nós de Google Sheets e OpenAI (ou outro LLM provider)
- Ajuste os agendamentos conforme sua demanda (ex: a cada 15 minutos)

4. **Utilize a ferramenta**:

- Acesse a interface publicada
- Faça upload dos arquivos `.xml` ou `.zip`
- Acompanhe o processamento e veja os dados em tempo real
- Receba no email informado a an´laise da Nota Fiscal
- Os dados são enriquecidos automaticamente com descrições fiscais
- Visualize no seu e-mail ou exporte diretamente do Google Sheets

---

## 🧪 Tecnologias utilizadas

- **Google Apps Script** — extração e orquestração de dados
- **Google Sheets** — armazenamento e interface para dados estruturados
- **HTML5 + CSS** — front-end com UX responsiva e moderna
- **n8n** — automação de fluxos e integração com agentes de IA
- **Agentes de IA (LLMs)** — enriquecimento semântico de CFOP e NCM

---

## 🔒 Licença

Este projeto está licenciado sob os termos da **Licença MIT** – consulte o arquivo `LICENSE` para mais informações.

---

## 🤝 Contribuições

Contribuições são muito bem-vindas! Você pode abrir um _pull request_, reportar _issues_, sugerir novos agentes ou melhorar a interface. Este projeto é aberto para evolução coletiva.

---

## 📩 Contato

Para dúvidas, sugestões ou parcerias, entre em contato:

**synergiai2a2@gmail.com**

---

🚧 Projeto em constante evolução — rumo a uma contabilidade mais inteligente, automatizada e acessível.
