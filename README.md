# Commander by OneArete — MVP v0.1

Primeiro protótipo funcional do Commander: uma PWA mobile-first que observa contexto, recomenda uma missão, conduz a execução, recolhe reflexão e regista Δ localmente.

## Executar

A app precisa de ser servida por HTTP para o Service Worker funcionar.

```bash
python3 -m http.server 8080
```

Depois abrir `http://localhost:8080`.

Também pode ser publicada diretamente no GitHub Pages.

## Incluído

- onboarding por identidade;
- check-in diário de contexto;
- motor de decisão local baseado em regras;
- quatro missões: força, recuperação, foco e caminhada;
- temporizador por fases;
- reflexão final;
- Δ acumulado e histórico;
- persistência em `localStorage`;
- manifesto PWA e funcionamento offline;
- símbolo Delta OneArete em SVG.

## Limites deliberados

Esta versão não tem autenticação, backend, IA generativa, dados clínicos nem integração com wearables. O objetivo é validar a experiência central: **Observe → Orient → Commit → Execute → Reflect**.
