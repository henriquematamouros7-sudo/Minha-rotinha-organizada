# Minha Rotina — Metas & Planos

PWA de organização pessoal (HTML, CSS e JS puro). Dados ficam no `localStorage` do aparelho; não há servidor.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub.
2. Envie **todos os arquivos diretamente na raiz** (sem pasta): index.html, style.css, app.js, manifest.webmanifest, service-worker.js, icon-192.png, icon-512.png, README.md.
3. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e salve.
4. Abra `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Instalar
- Android (Chrome): menu ⋮ → Instalar aplicativo. iPhone (Safari): Compartilhar → Adicionar à Tela de Início.

## Atualizar
Ao publicar uma nova versão, altere `V` em `service-worker.js` (ex.: `minha-rotina-v2`). O app avisará e atualizará.

## Observações
- Os dados não sincronizam entre aparelhos: use Configurações → Exportar/Importar backup.
- Lembretes dependem do navegador/sistema e não são garantidos com o app fechado (não há servidor de push).
