# Ollama Chat Interface

Uma aplicação web completa similar ao ChatGPT que utiliza a API do Ollama localmente, com suporte a upload de arquivos e memória de conversas.

## 🚀 URLs da Aplicação Deployada

- **Frontend:** https://ollama-chat-app-0zfvvz5x.devinapps.com/
- **Backend API:** https://app-uwtrbisq.fly.dev/

## 📋 Funcionalidades

### Backend (FastAPI + Python)
- ✅ Comunicação com API Ollama local (http://localhost:11434)
- ✅ Upload de múltiplos arquivos (imagens, áudio, vídeo, ZIP, texto, etc.)
- ✅ Extração automática de conteúdo dos arquivos
- ✅ Sistema de memória de conversas persistente
- ✅ Endpoints REST: `/api/chat`, `/api/upload`, `/api/chat-with-files`
- ✅ Tratamento de erros e timeouts

### Frontend (React + TypeScript)
- ✅ Interface moderna similar ao ChatGPT
- ✅ Upload por drag & drop ou clique
- ✅ Visualização de arquivos enviados com opção de remoção
- ✅ Histórico de conversas com timestamps
- ✅ Design responsivo com Tailwind CSS
- ✅ Indicadores de carregamento e estados de erro
- ✅ Suporte a Enter para enviar mensagens

## 🛠️ Configuração Local

### Pré-requisitos
- Python 3.12+
- Node.js 18+
- Ollama instalado e rodando

### Backend (FastAPI)

1. **Navegue para o diretório do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   poetry install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   poetry run fastapi dev app/main.py
   ```

4. **O backend estará disponível em:** http://localhost:8000
   - Documentação da API: http://localhost:8000/docs

### Frontend (React)

1. **Navegue para o diretório do frontend:**
   ```bash
   cd frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure a URL da API (opcional):**
   ```bash
   # Edite o arquivo .env
   VITE_API_URL=http://localhost:8000
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

5. **O frontend estará disponível em:** http://localhost:5173

## 🔧 Configuração do Ollama

### Windows
```bash
# Baixe e instale o Ollama de: https://ollama.ai
# Execute no terminal:
ollama serve

# Instale um modelo (exemplo):
ollama pull llama3.2
```

### Linux/macOS
```bash
# Instale o Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Inicie o serviço
ollama serve

# Instale um modelo
ollama pull llama3.2
```

## 📁 Estrutura do Projeto

```
ollama-chat-project/
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   └── main.py         # API principal
│   ├── pyproject.toml      # Dependências Python
│   └── uploads/            # Arquivos enviados
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── App.tsx         # Componente principal
│   │   └── components/     # Componentes UI
│   ├── package.json        # Dependências Node.js
│   └── .env               # Configurações
└── README.md              # Este arquivo
```

## 🚀 Deploy

### Backend (Fly.io)
```bash
cd backend
# Configure o Fly.io e faça deploy
```

### Frontend (Build e Deploy)
```bash
cd frontend
npm run build
# Deploy da pasta dist/
```

## 🎯 Como Usar

1. **Certifique-se que o Ollama está rodando:**
   ```bash
   ollama serve
   ```

2. **Acesse a aplicação web**

3. **Teste as funcionalidades:**
   - Digite mensagens normais
   - Faça upload de arquivos (imagens, documentos, etc.)
   - Pergunte sobre o conteúdo dos arquivos
   - Teste a memória de conversas

## 📝 API Endpoints

### POST `/api/chat`
Envia uma mensagem para o Ollama
```json
{
  "message": "Sua mensagem",
  "conversation_id": "uuid-opcional",
  "model": "llama3.2",
  "temperature": 0.7
}
```

### POST `/api/upload`
Faz upload de um arquivo
```bash
curl -X POST -F "file=@arquivo.txt" http://localhost:8000/api/upload
```

### POST `/api/chat-with-files`
Envia mensagem com contexto de arquivos
```bash
curl -X POST \
  -F "message=Analise este arquivo" \
  -F "file_ids=uuid1,uuid2" \
  http://localhost:8000/api/chat-with-files
```

## 🔍 Tipos de Arquivos Suportados

- **Texto:** .txt, .md, .py, .js, .html, .css, .json, .xml
- **Imagens:** .png, .jpg, .jpeg, .gif, .bmp, .webp
- **Arquivos:** .zip (lista conteúdo)
- **Áudio:** .mp3, .wav, .ogg, .m4a, .flac
- **Vídeo:** .mp4, .avi, .mov, .mkv, .webm

## 🛡️ Segurança

- Arquivos são armazenados temporariamente no servidor
- Conversas são mantidas em memória (perdidas ao reiniciar)
- Para produção, considere usar banco de dados persistente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se o Ollama está rodando: `curl http://localhost:11434/api/tags`
2. Verifique os logs do backend e frontend
3. Certifique-se que as portas 8000 e 5173 estão livres

## 🔗 Links Úteis

- [Ollama](https://ollama.ai/) - IA local
- [FastAPI](https://fastapi.tiangolo.com/) - Framework backend
- [React](https://react.dev/) - Framework frontend
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
