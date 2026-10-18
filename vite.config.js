import { defineConfig } from 'vite';
import fs from 'node:fs';

// Lê dados.json e monta o index.html:
//   {{chave}}                                  troca pelo valor
//   <!-- se:chave -->A<!-- senao:chave -->B<!-- /se:chave -->   mostra A se a chave tiver valor, senão B
//   <!-- depoimentos -->                       vira a lista de depoimentos preenchidos
//   <!-- videos -->                            vira a lista de vídeos de depoimento do YouTube
const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// aceita link de vídeo, de Shorts, youtu.be ou só o código de 11 caracteres
const idYoutube = (url) => (String(url).match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/) || String(url).trim().match(/^([\w-]{11})$/) || [])[1];

function lerDados() {
  // o Bloco de Notas às vezes salva com BOM; remove antes de ler
  const d = JSON.parse(fs.readFileSync('dados.json', 'utf8').replace(/^﻿/, ''));
  d.depoimentos = (d.depoimentos || []).filter((x) => x.texto && x.texto.trim());
  d.videos = (d.videosDepoimentos || [])
    .map((v) => (typeof v === 'string' ? { url: v } : v || {}))
    .map((v) => ({ id: idYoutube(v.url || ''), vertical: /\/shorts\//.test(v.url || ''), titulo: (v.titulo || '').trim() }))
    .filter((v) => v.id);
  d.local = [d.endereco, d.bairro, d.cidade].some((v) => v && String(v).trim()) ? 'sim' : '';
  d.online = d.atendeOnline === true ? 'sim' : '';
  d.enderecoLinha1 = d.endereco || [d.bairro, d.cidade].filter(Boolean).join(', ');
  d.enderecoLinha2 = d.endereco ? [d.bairro, d.cidade].filter(Boolean).join(', ') : '';
  return d;
}

const tem = (v) => Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== '';

function montar(html, d) {
  // repete até resolver os condicionais aninhados
  const re = /<!-- se:(\w+) -->([\s\S]*?)(?:<!-- senao:\1 -->([\s\S]*?))?<!-- \/se:\1 -->/g;
  while (re.test(html)) {
    re.lastIndex = 0;
    html = html.replace(re, (_, k, a, b = '') => (tem(d[k]) ? a : b));
  }
  html = html.replace('<!-- depoimentos -->', d.depoimentos.map((x) => `
          <li class="voice">
            <blockquote>${escape(x.texto)}</blockquote>
            ${x.autora ? `<p class="voice-who"><span class="voice-avatar" aria-hidden="true">${escape(x.autora.trim()[0].toUpperCase())}</span>${escape(x.autora)}</p>` : ''}
          </li>`).join(''));
  // a miniatura abre o YouTube em outra aba; com JavaScript, o vídeo toca ali mesmo (src/main.js)
  html = html.replace('<!-- videos -->', d.videos.map((v, i) => {
    const nome = v.titulo || `Depoimento ${i + 1}`;
    return `
          <li class="video${v.vertical ? ' video-vertical' : ''}">
            <div class="video-media">
              <a class="video-play" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener" data-yt="${v.id}" aria-label="Assistir: ${escape(nome)}">
                <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async" />
                <span class="video-btn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
              </a>
            </div>
            ${v.titulo ? `<p class="video-title">${escape(v.titulo)}</p>` : ''}
          </li>`;
  }).join(''));
  const base = (d.siteUrl || '').replace(/\/$/, '');
  html = html.replace(/\{\{siteUrl\}\}/g, base);
  html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => escape(d[k] ?? ''));
  return html;
}

function pendencias(d) {
  const p = [];
  if (!tem(d.siteUrl)) p.push('siteUrl (endereço do site, para a imagem de compartilhamento)');
  if (!d.local) p.push('endereco / bairro / cidade');
  if (d.atendeOnline === null) p.push('atendeOnline (confirmar)');
  if (!d.videos.length && !d.depoimentos.length) p.push('videosDepoimentos (links dos vídeos do YouTube)');
  return p;
}

export default defineConfig({
  plugins: [{
    name: 'dados-da-viviane',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const d = lerDados();
        const p = pendencias(d);
        if (p.length) console.log('\n  Pendências em dados.json (os trechos ficam ocultos):\n   - ' + p.join('\n   - ') + '\n');
        return montar(html, d);
      },
    },
    configureServer(server) {
      server.watcher.add('dados.json');
      server.watcher.on('change', (f) => f.endsWith('dados.json') && server.ws.send({ type: 'full-reload' }));
    },
  }],
});
