<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Regras do projeto

- Tudo sempre tipado. Nada de `any` disfarçado; prefira tipos explícitos e inferência do TypeScript em vez de casts.
- O design segue sempre o mesmo padrão: componentes shadcn existentes, tokens do `globals.css` e o estilo já usado nas telas (cards, botões, badges). Não introduza bibliotecas de UI ou paletas paralelas.
- Nomes de variáveis e funções sempre bem explicados (auto-descritivos), mesmo que fiquem mais longos.
- Comentários só quando muito necessário — o código deve se explicar sozinho.
- Priorize boas práticas e simplicidade: código que qualquer humano do time consiga ler e entender rápido.
- Use ao máximo os recursos mais atuais do Next.js e do React.
- Evite `useEffect`/`useState` sempre que der. Prefira Server Components, `useSyncExternalStore`, estado derivado durante o render, ou a técnica do `key` para resetar estado — só use estado local para o que realmente é interativo/client-side.
- Chamadas de API (rotas, fetch, banco) sempre da forma mais otimizada possível: cache quando fizer sentido, evite waterfalls, busque só os dados necessários.
- Performance e segurança em primeiro lugar em qualquer decisão técnica.
- Toda API Route precisa ter rate limiting.
- Sempre que der, use Server Components; só vire Client Component quando não tiver jeito (interatividade, hooks de navegador, etc.).
- Qualquer mudança no schema do banco precisa vir com uma migration (`npm run db:generate`), nunca alterar o banco na mão.
- Commits pequenos, com mensagens claras e no imperativo (ex.: "Adiciona autenticação com Google").
- O sistema precisa ser fácil de usar e acessível (labels, contraste, navegação por teclado, estados de foco visíveis).
- Componentes de UI sempre via shadcn (`npx shadcn add ...`), nunca escritos do zero quando já existe um componente equivalente no registry.
