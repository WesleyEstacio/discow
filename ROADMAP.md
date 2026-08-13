# Roadmap de features — Discows

Baseado no código atual (perfil, reviews, follows, discover, picks) e nas 6 ideias que você trouxe. Objetivo: uma ordem que minimiza retrabalho, porque algumas features quebram/ficam melhores dependendo da ordem em que são feitas.

## O que já existe hoje (contexto rápido)

- Perfil mostra reviews (nota + texto) por álbum, em grid ou lista, com contagem "Albums" e "Avg rating".
- Seguir usuários já existe (`follow`), com limite de 10 following por pessoa e sem limite de followers.
- Tags/badges (`user_tag`) já existem como tabela, mas hoje só "joined-`<ano>`" é automática (atribuída no login) — o resto (ex.: "first-users") é inserido na mão pelo Drizzle Studio. O comentário no schema já cita "until there's an admin UI or achievement system", ou seja, o esqueleto pra conquistas já está lá.
- Discover (rolar álbum por gênero/década) e Picks (coleções curadas em JSON) já existem.
- Álbum x música: hoje tudo é tratado como "álbum" — a página do álbum já busca `totalTracks` da Spotify, mas nada usa esse número pra diferenciar single de álbum.
- Página de artista não existe. Os reviews guardam o **nome** do artista (string), não o ID do artista no Spotify — dois artistas com nome igual (tem vários) vão colidir se a discografia for calculada pelo nome.

## Decisões que valem a pena tomar antes de codar

1. **Álbum vs música** (regra que você propôs: >1 track = álbum, 1 track = música). Falta decidir só um detalhe: uma "música" solta conta separado das estatísticas de álbuns no perfil (ex.: "42 Albums · 8 Músicas") ou fica de fora da contagem principal?
2. **LOVER / discografia do artista** precisa do **ID do artista no Spotify**, não do nome — hoje isso não é guardado em nenhum lugar. Sem isso a % de "quanto você já ouviu do artista" fica errada sempre que houver dois artistas com o mesmo nome.
3. **O que entra na conta do "70% ouvido"?** O catálogo da Spotify costuma ter várias versões do mesmo álbum (deluxe, remaster, live). Vale filtrar por tipo de lançamento pra não penalizar quem realmente já ouviu tudo só porque a API lista 5 versões do mesmo disco.

## Ordem sugerida

### Fase 1 — Fundação rápida (baixo esforço, desbloqueia o resto)

**1. Separar álbum de música.** Regra simples a partir do `totalTracks` que já é buscado na Spotify. Ajusta o badge da página do álbum ("Album" / "Single") e a contagem no perfil. Esforço baixo. Entra primeiro porque quase toda métrica futura (perfil, conquistas, % do artista) depende de saber o que conta como álbum.

**2. Nome dos seguidores.** Troca só o rótulo "Followers" por um nome de marca — não tem dependência técnica com nada, pode ser feito em paralelo com qualquer outra fase. Sugestões (1 palavra, remetendo a vaca/Discows/música):

- **Cows** — o mais direto: já que o app é "Discows", seus seguidores são literalmente as "Cows" dele. Auto-depreciativo e engraçado, e reforça a marca de graça.
- **Herd** ("rebanho") — mantém o clima de comunidade e ainda faz um trocadilho leve com "heard" ("have you heard this album").
- **Moovers** — moo + mover, mais brincalhão.
- **Rebanho** / **Curral** — versão em português, se preferir manter esse rótulo específico fora do inglês que o resto da UI usa.

Minha recomendação é **Cows**, pelo tie-in direto com o nome do produto — mas isso é gosto, e é rápido trocar depois se não colar.

### Fase 2 — Features standalone (sem dependência forte entre si)

**3. Álbum favorito no perfil.** Coração no canto superior direito da página do álbum; favoritar joga pra uma seção "Álbum favorito" no perfil. Esforço médio: precisa de uma coluna nova (algo como `favoriteAlbumSpotifyId` + os mesmos campos denormalizados que `review`/`discover_pick` já usam, pra não depender de existir um review) e a migration correspondente, mais o botão e a seção no `profile-view.tsx`.

**4. Sistema de conquistas.** Hoje só existe a tabela e duas tags manuais. Esforço médio-alto, mas o alicerce já existe:

- Define um conjunto de regras calculadas a partir do que já tem (nº de reviews, nº de seguidores, gêneros diferentes avaliados, etc.).
- Roda a checagem depois da ação relevante (avaliar, seguir) e insere em `user_tag` automaticamente — a tabela já foi desenhada pra isso.
- `joined-<ano>` e `first-users` continuam existindo, só passam a ser um caso particular desse motor em vez de lógica solta.

### Fase 3 — Página do artista (a peça maior, depende da Fase 1)

**5. Página do artista + tag LOVER (>70% ouvido).**

- Nova rota `/artist/[id]`.
- Migration pra guardar o Spotify artist id nos reviews (hoje só tem o nome).
- Buscar a discografia completa via API da Spotify e cruzar com os álbuns avaliados pelo usuário pra calcular o %.
- Usar o motor de conquistas da Fase 2 pra conceder a tag "lover-`<artistId>`" automaticamente, em vez de criar um sistema de badge paralelo só pra essa tag.
- Por que depois da Fase 1: sem separar álbum de música, o "% da discografia" fica inflado por singles soltos.
- Lembrete do AGENTS.md: toda rota de API nova precisa de rate limiting — e essa vai bater bastante na API da Spotify (discografia completa de um artista), então vale cachear a resposta.

### Fase 4 — Gráficos no perfil

**6. Gráficos.** Distribuição de notas, gêneros mais avaliados, timeline de reviews por mês/ano. Esforço médio-alto, mas o retorno visual é bem melhor depois que já existem mais dados estruturados pra mostrar (álbum/música separado, favorito, conquistas). O projeto ainda não tem lib de gráfico — o registry oficial de charts do shadcn (que usa Recharts por baixo) resolve isso sem quebrar a regra do AGENTS.md de "só componentes shadcn".

## Resumo da ordem

1. Separar álbum de música
2. Nome dos seguidores
3. Álbum favorito no perfil
4. Sistema de conquistas
5. Página do artista + LOVER
6. Gráficos no perfil

Itens 3 e 4 não têm dependência forte entre si nem com o resto — se preferir, dá pra inverter a ordem deles ou tocar em paralelo. O que eu não recomendo é começar pela página do artista (item 5) antes da separação álbum/música e antes de guardar o ID do artista, porque aí a % do LOVER nasce errada e vai precisar de retrabalho.
