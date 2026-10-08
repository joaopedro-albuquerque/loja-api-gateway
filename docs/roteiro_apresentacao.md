# Roteiro do PPT (6–8 slides)

Use no PowerPoint/Google Slides. Fale ~30–40s por slide.

1. **Capa** — Título, disciplina, Grupo 4, nomes  
2. **Problema** — Loja com serviços de produtos e carrinho  
3. **Conceito** — API Gateway & roteamento; entrada única  
4. **Arquitetura AWS** — diagrama Cliente → Gateway → 2 Lambdas  
5. **Rotas** — tabela `/produtos` e `/carrinho`  
6. **Desacoplamento** — times/deploy/escala independentes  
7. **Demo** — “agora no sistema”  
8. **Conclusão** — o que aprendemos + próximos passos (auth, DynamoDB…)

## Frases úteis (não ler o slide)

- “O cliente só conhece uma URL.”
- “O Gateway decide qual Lambda invocar com base no path.”
- “Se o carrinho cair, o catálogo ainda pode responder.”
