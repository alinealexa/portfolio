# _aa.creativestudio

Site estático. Você mexe em duas coisas: **`content/site.yml`** (textos do site)
e **`content/projects/`** (um projeto = uma pasta). O resto se monta sozinho.

---

## O fluxo de um projeto novo

**1. Crie a pasta.** O nome da pasta vira o endereço da página.

```
content/projects/nome-do-projeto/
├── projeto.md          ← a ficha e o texto do case
└── images/
    ├── 01.jpg
    ├── 02.jpg
    └── ...
```

Use nomes numerados (`01`, `02`, `03`…). Jogue as fotos **no tamanho original**,
direto da câmera ou do export do Figma. Não precisa redimensionar nada.

**2. Escreva o `projeto.md`.** Copie de qualquer projeto existente. A parte
entre `---` é a ficha que aparece no painel fixo da direita; abaixo vem o texto.

```markdown
---
titulo: "Nome do Projeto"
cliente: "Nome do Cliente"
ano: 2025
resumo: "Uma frase. Aparece no topo e no compartilhamento em redes."

servicos:
  - "Identidade visual"
  - "Direção de arte"

creditos:
  Design: "Aline Alexa"
  Fotografia: "Nome do fotógrafo"

capa: "01.jpg"      # opcional — sem isso, usa a primeira imagem
destaque: true      # aparece na home
ordem: 1            # menor número aparece antes
link: "https://..." # opcional — vira "Ver projeto" no painel
---

## Contexto
Texto.

![Legenda opcional](02.jpg)

## Desafio
Texto.

![](03.jpg) ![](04.jpg)   ← duas na mesma linha viram um par lado a lado
```

**3. Rode o build.**

```bash
npm run build
```

Isso gera `dist/` com o site pronto. Cada foto vira quatro versões WebP
(640 / 1024 / 1600 / 2400px) e o navegador baixa só a que precisa. Você não
exporta tamanho nenhum na mão.

**4. Veja no navegador antes de publicar.**

```bash
npm run dev      # abre em http://localhost:4173
```

---

## O que dá pra mudar sem tocar em código

Tudo em **`content/site.yml`**:

| Bloco | O que controla |
|---|---|
| `marca` | Nome na tela e no rodapé |
| `hero` | As linhas do título gigante, o vídeo por dentro das letras, a frase de posicionamento |
| `manifesto` | O texto grande da seção Estúdio |
| `areas` | A lista de áreas de atuação |
| `metodologia` | As etapas da seção interativa |
| `clientes` | A grade de clientes |
| `contato` | E-mail, cidade, redes |

### O vídeo do hero

Coloque um `.mp4` em `content/media/` e escreva o nome em `hero.video`.
O que funciona: **6 a 12 segundos, em loop, sem áudio, muito contraste**
(o vídeo aparece só por dentro das letras — imagem lavada não lê).
Deixe `hero.video: ""` para título sólido, sem vídeo.

---

## Estrutura

```
content/          ← o que VOCÊ edita
  site.yml
  media/          ← vídeo do hero
  projects/
src/              ← design system e comportamento
  css/01-tokens.css      ← cor, tipografia, grid, motion (fonte única de verdade)
  css/02-base.css
  css/03-components.css
  js/main.js
scripts/          ← o build
dist/             ← gerado — não edite, não versione
```

**Regra da casa:** nenhum valor de cor, tamanho ou espaçamento solto no CSS.
Tudo vem de `01-tokens.css`. É isso que mantém o site coerente conforme cresce.

---

## Publicar

Conectado ao Netlify: `git push` publica. Manualmente:

```bash
npm run build
npx netlify deploy --prod --dir dist
```

---

## Decisões de design (para não desfazer sem querer)

- **Peso 400 em tudo.** O impacto vem do tamanho, nunca do negrito.
- **Tracking negativo** cresce junto com o corpo do texto — é o que faz a
  tipografia parecer Neue Haas e não Arial esticada.
- **A interface é monocromática.** A cor entra pelas imagens dos projetos.
- **Uma curva de animação só** (`--ease`) no site inteiro.
- **Nada anima sem motivo.** Se tudo se move, nada chama atenção.
- **Sem JS, o site continua legível.** As animações de entrada só existem
  quando o JS carrega.
