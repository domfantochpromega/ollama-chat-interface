# 🚀 Setup Automático para Windows

## Instalação em Um Clique

1. **Extraia o arquivo ZIP** em uma pasta de sua escolha
2. **Execute o script:** `start-ollama-chat.bat`
3. **Siga as instruções** na tela

O script irá automaticamente:
- ✅ Verificar se Python está instalado
- ✅ Verificar se Node.js está instalado  
- ✅ Verificar se Poetry está instalado
- ✅ Instalar todas as dependências
- ✅ Configurar a porta do seu Ollama
- ✅ Iniciar backend e frontend automaticamente

## 📋 Pré-requisitos

### 1. Ollama
Certifique-se que o Ollama está instalado e rodando:
```bash
# Baixe de: https://ollama.ai
# Execute no terminal:
ollama serve

# Instale um modelo:
ollama pull llama3.2
```

### 2. Dependências (Instaladas Automaticamente)
- **Python 3.12+** - https://www.python.org/downloads/
- **Node.js 18+** - https://nodejs.org/
- **Poetry** - Instalado automaticamente pelo script

## 🎯 Uso Rápido

```bash
# 1. Execute o script
start-ollama-chat.bat

# 2. Quando solicitado, informe a porta do seu Ollama
# (padrão: 11434)

# 3. Aguarde a instalação automática

# 4. Acesse no navegador:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

## 🔧 Configuração Manual (Opcional)

Se preferir configurar manualmente:

### Backend:
```bash
cd backend
echo OLLAMA_BASE_URL=http://localhost:SUA_PORTA > .env
poetry install
poetry run fastapi dev app/main.py
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

## ❗ Solução de Problemas

### Python não encontrado:
1. Baixe Python de: https://www.python.org/downloads/
2. **IMPORTANTE:** Marque "Add Python to PATH" durante a instalação
3. Execute o script novamente

### Node.js não encontrado:
1. Baixe Node.js de: https://nodejs.org/
2. Execute o script novamente

### Poetry não encontrado:
1. O script tentará instalar automaticamente
2. Se falhar, instale manualmente: https://python-poetry.org/docs/#installation

### Erro "No module named 'aiofiles'":
1. Execute o script novamente (ele tentará limpar o cache)
2. Ou execute manualmente no diretório backend:
   ```bash
   poetry cache clear --all pypi
   poetry lock --no-update
   poetry install --no-cache
   ```

### Ollama não conecta:
1. Verifique se o Ollama está rodando: `ollama serve`
2. Confirme a porta correta no script
3. Teste: `curl http://localhost:11434/api/tags`

## 🎉 Pronto!

Após a execução bem-sucedida:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- Documentação da API: http://localhost:8000/docs

Agora você pode conversar com a IA e fazer upload de arquivos!
