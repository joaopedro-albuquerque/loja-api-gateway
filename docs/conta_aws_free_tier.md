# Conta AWS + créditos / Free Tier (para esta atividade)

Leia isto **antes** de criar Lambdas. Objetivo: estudar com custo ~R$ 0 e sem susto na fatura.

Links oficiais (confira sempre, a AWS muda o programa):

- Free Tier: [https://aws.amazon.com/free/](https://aws.amazon.com/free/)
- FAQ Free Tier: [https://aws.amazon.com/free/free-tier-faqs/](https://aws.amazon.com/free/free-tier-faqs/)
- Preço Lambda: [https://aws.amazon.com/lambda/pricing/](https://aws.amazon.com/lambda/pricing/)
- Billing / custos: console → busca **Billing** ou **Cost Explorer**

---

## 1) Criar / arrumar a conta (do zero)

### 1.1 Criar conta

1. Abra [https://aws.amazon.com/](https://aws.amazon.com/) e clique em **Create an AWS Account** / Criar conta.
2. Informe e-mail, senha e nome da conta (pode ser “estudo-loja-grupo4”).
3. Escolha tipo de conta: em geral **Personal** (pessoal) serve para estudo.
4. Informe dados de contato.
5. **Cartão de crédito/débito:** a AWS costuma exigir para validar identidade.
  - No plano **Free** novo (ver seção 2), a ideia é não cobrar enquanto você não migrar para Paid — mas a política exata depende do que a tela mostrar no seu cadastro.  
  - Leia com calma a tela de plano (**Free** vs **Paid**) antes de confirmar.
6. Confirme telefone (SMS/voz).
7. Escolha o plano de suporte: **Basic support** (grátis) é o adequado para aluno.



### 1.2 Primeiro login seguro

1. Entre em [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
2. Ative **MFA** na conta root (IAM / Security credentials) — fortemente recomendado.
3. (Boa prática) Crie um usuário IAM **admin de estudo** e evite usar o root no dia a dia. Para a disciplina, muitos usam root; se for o caso, MFA é obrigatório na prática.



### 1.3 Região

Canto superior direito → escolha **uma** região e mantenha (ex.: `us-east-1`).  
Lambdas e API Gateway devem ficar na **mesma** região.

### 1.4 Conta da faculdade / AWS Academy / Classroom

Se o professor passou **AWS Academy**, **Learnexus**, **Educate** ou conta da instituição:

- Use **essa** conta (já vem com créditos/laboratório).
- Ignore criar conta pessoal, a menos que o professor peça.
- Os limites e o painel podem ser diferentes; siga o portal da disciplina.

---



## 2) Créditos e “grátis” — o que existe hoje

A AWS mudou o Free Tier (contas novas a partir de meados de 2025). Na prática você pode cair em um destes cenários:

### A) Conta **nova** — Free plan com créditos (até ~US$ 200)

Resumo do que a AWS anuncia para **novos clientes**:


| Item                          | O que significa                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------- |
| **~US$ 100** ao criar a conta | Crédito imediato                                                                 |
| **até +US$ 100**              | Ganhar explorando serviços (onboarding: Lambda, Budgets, etc.)                   |
| **Total até ~US$ 200**        | Para gastar em serviços elegíveis                                                |
| **Free plan**                 | Até ~6 meses **ou** até acabar o crédito; a conta Free pode **encerrar** sozinha |
| **Paid plan**                 | Acesso amplo; além do crédito/limits pode gerar cobrança                         |


No cadastro, se aparecer escolha **Free** vs **Paid**:

- Para **só estudar esta atividade**: prefira o que a tela descrever como **sem cobrança surpresa / Free plan**, e leia o texto fino.
- Se a faculdade já tem conta Paid com crédito educacional, use a da faculdade.

Detalhes oficiais: [https://aws.amazon.com/blogs/aws/aws-free-tier-update-new-customers-can-get-started-and-explore-aws-with-up-to-200-in-credits/](https://aws.amazon.com/blogs/aws/aws-free-tier-update-new-customers-can-get-started-and-explore-aws-with-up-to-200-in-credits/)

### B) Conta **antiga** (antes da mudança) — Free Tier “clássico”

Ainda pode ter:

- **Always Free** (sempre grátis até um limite mensal), e/ou
- Ofertas de **12 meses** em alguns serviços.



### C) O que importa para **esta** loja (Lambda + API Gateway HTTP)

Para um trabalho de faculdade (poucos testes, 2 funções minúsculas):


| Serviço                       | Por que costuma ficar grátis / barato                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lambda**                    | Há faixa **Always Free** generosa (na ordem de **1 milhão de requests/mês** e centenas de milhares de GB-segundos). Sua demo nem chega perto. |
| **API Gateway**               | HTTP API, no volume de aluno, costuma ser irrisório / coberto por Free Tier ou créditos. Confira a página Free do API Gateway.               |
| **CloudWatch Logs**           | Logs pequenos ok; não deixe milhões de `print` rodando meses.                                                                                 |
| **EC2, RDS, NAT, Elastic IP** | **Não use** nesta atividade — é aí que a fatura explode.                                                                                      |


Conclusão: **esta atividade é segura no Free Tier/créditos**, desde que você **não** suba máquina EC2 “para testar” nem deixe recursos caros ligados.

---



## 3) Proteja-se de cobrança (faça hoje)

Mesmo no Free, configure alerta:

1. Console → busca **Billing and Cost Management**
2. Ative **IAM user and role access to billing** se pedir (conta root).
3. Busca **Budgets** → **Create budget**
  - Tipo: **Cost budget**
  - Valor: por exemplo **USD 1** ou **USD 5**
  - Alerta por e-mail quando atingir 80% e 100%
4. (Opcional) Busca **Free Tier** no Billing para ver uso do mês.

Também útil: e-mail da conta AWS verificado e notificações de fatura ligadas.

---



## 4) O que NÃO fazer nesta disciplina

- Não criar EC2 “só para ver”.
- Não criar Load Balancer, NAT Gateway, RDS.
- Não deixar cartão sem Budget/alerta.
- Não compartilhar Access Key no GitHub / PPT / vídeo.
- Não usar região aleatória diferente para cada recurso.

---



## 5) Depois da entrega — limpar (boa prática)

Quando o vídeo e os prints estiverem prontos:

1. API Gateway → apagar a API `loja-api`
2. Lambda → apagar `loja-produtos` e `loja-carrinho`
3. CloudWatch → opcional apagar log groups `/aws/lambda/loja-...`

Assim você não deixa lixo consumindo cota.

---



## 6) Checklist “conta pronta”

- [x] Consigo entrar na console
- [x] Região escolhida e anotada
- [x] Sei se estou em Free plan / Paid / conta da faculdade
- [x] Vi créditos ou Free Tier no Billing (se disponível)
- [x] Budget/alerta de custo criado
- [x] MFA no root (recomendado)

Quando este checklist estiver ok → vá para  
`exercicios/03_deploy_aws.md` (empacotar o Python em ZIP e importar na Lambda).