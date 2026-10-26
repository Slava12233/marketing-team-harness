# Third-party skills: sources and licences

Checked 2026-10-26.

Eight Claude Code skills in `.claude/skills/` are copies of third-party skills, taken verbatim with their licence terms. The harness's own rules (`CLAUDE.md`) win on any conflict with their text. Pins are in `skills-lock.json`.

Re-install one skill: `npx skills add <owner/repo> --skill <name> --agent claude-code --copy -y`. Search the registry: `npx skills find <query>`.

## Table

| Skill | Source repo | Licence | Skill path in repo | Computed hash (lock file) | Checked |
|---|---|---|---|---|---|
| `ad-creative` | https://github.com/coreyhaines31/marketingskills | MIT (Copyright (c) 2025 Corey Haines) | `skills/ad-creative/SKILL.md` | `08f4edb3ee24abc3e9a67083bd4676e522855be904d33aa81ff29de63d15e2f0` | 2026-10-26 |
| `image` | https://github.com/coreyhaines31/marketingskills | MIT (Copyright (c) 2025 Corey Haines) | `skills/image/SKILL.md` | `3addd35378f2d3652ace5a6204c1e00eed0db1fe5adcf42ef41eb914de3282cf` | 2026-10-26 |
| `banner-design` | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | MIT (Copyright (c) 2024 Next Level Builder) | `.claude/skills/banner-design/SKILL.md` | `0645bfc33632c7b332e649e35738ea807e1571436289cdaf86bebe6660c693ec` | 2026-10-26 |
| `frontend-design` | https://github.com/anthropics/skills | Apache-2.0 (the skill's own `LICENSE.txt`; no copyright line in the file) | `skills/frontend-design/SKILL.md` | `106acf230014cbb43ca34e6410371321b56ca742f9ee0442e8ec05bf02eb0384` | 2026-10-26 |
| `find-skills` | https://github.com/vercel-labs/skills | MIT (Copyright (c) 2026 Vercel, Inc.) | `skills/find-skills/SKILL.md` | `b146008599c31057cef1c145774cea5d5afb30e8f43fa802e47a4b461419aaaf` | 2026-10-26 |
| `grill-me` | https://github.com/mattpocock/skills | MIT (Copyright (c) 2026 Matt Pocock) | `skills/productivity/grill-me/SKILL.md` | `5e0c683385eafd83f106ac6c9d67dfbbfe5aa4b3fe65aad114eb1055a99c818f` | 2026-10-26 |
| `grilling` | https://github.com/mattpocock/skills | MIT (Copyright (c) 2026 Matt Pocock) | `skills/productivity/grilling/SKILL.md` | `c3b3e67f18495984385413bc6be7e2acbf2139c6cf52ef42abdda7242a791822` | 2026-10-26 |
| `viral-reverse-engineering` | https://github.com/social-media-skills/skills | MIT (Copyright (c) 2026 Frank Heijdenrijk) | `skills/viral-reverse-engineering/SKILL.md` | `a528c5190d25e85d3ad257445a5587c88efb85b3b5cef25af48f697bb1345203` | 2026-10-26 |

How checked: the raw `LICENSE` file at each repo root (HEAD) was fetched, except `anthropics/skills`, where the skill's own `skills/frontend-design/LICENSE.txt` was fetched (that repo licenses per skill; other skills in it carry different terms and are not used here). No `NOTICE` file was looked for or found in any repo; none is shipped.

## Licence obligations

**MIT (seven skills: ad-creative, image, banner-design, find-skills, grill-me, grilling, viral-reverse-engineering).** Copying, modifying and redistributing are allowed, including commercially. Condition: the copyright notice and the permission notice must be included in all copies or substantial portions. The notices are reproduced below per repository. The software is provided "AS IS" with no warranty.

**Apache-2.0 (frontend-design).** Redistribution requires: (a) giving recipients a copy of the licence (it ships as `.claude/skills/frontend-design/LICENSE.txt`; keep it); (b) prominent notices on any file we modify stating that we changed it; (c) keeping all copyright, patent, trademark and attribution notices from the source; (d) if the upstream work has a NOTICE file, including its attribution notices (none was found or shipped). The licence grants no trademark rights.

No licence found in this check forbids or restricts redistribution beyond these conditions.

### coreyhaines31/marketingskills (ad-creative, image)

```
MIT License

Copyright (c) 2025 Corey Haines

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### nextlevelbuilder/ui-ux-pro-max-skill (banner-design)

```
MIT License

Copyright (c) 2024 Next Level Builder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### vercel-labs/skills (find-skills)

```
MIT License

Copyright (c) 2026 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### mattpocock/skills (grill-me, grilling)

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### social-media-skills/skills (viral-reverse-engineering)

```
MIT License

Copyright (c) 2026 Frank Heijdenrijk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### anthropics/skills (frontend-design)

Apache License 2.0. The full text is in `.claude/skills/frontend-design/LICENSE.txt` (kept as shipped); no separate copyright notice line exists in that file.
