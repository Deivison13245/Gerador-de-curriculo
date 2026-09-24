/**
 * Módulo de Serviço de Inteligência Artificial para o Currículo Express
 * Integração com a Google Gemini API e motor de fallback inteligente
 */
const AIService = (function() {
    const STORAGE_KEY = 'gemini_api_key';
    const DEFAULT_MODEL = 'gemini-1.5-flash';

    const STANDARD_HARD_SKILLS = [
        'Programação',
        'Análise de dados',
        'Pacote Office',
        'Controle de planilhas e dados',
        'Operação de sistemas de gestão (ERP)',
        'Ferramentas de videoconferência',
        'Google Docs / Drive',
        'Rotinas administrativas',
        'Noções de fluxo de caixa'
    ];

    const STANDARD_SOFT_SKILLS = [
        'Trabalho em equipe',
        'Adaptabilidade',
        'Comunicação clara',
        'Escuta ativa',
        'Criatividade',
        'Inovação',
        'Visão de melhoria contínua',
        'Organização',
        'Comprometimento'
    ];

    /**
     * Obtém a chave da API salva no localStorage
     * @returns {string} Chave da API ou string vazia
     */
    function getApiKey() {
        return localStorage.getItem(STORAGE_KEY) || '';
    }

    /**
     * Salva a chave da API no localStorage
     * @param {string} key 
     */
    function setApiKey(key) {
        if (key && key.trim()) {
            localStorage.setItem(STORAGE_KEY, key.trim());
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    /**
     * Verifica se há chave de API configurada
     * @returns {boolean}
     */
    function hasApiKey() {
        const key = getApiKey();
        return Boolean(key && key.trim().length > 10);
    }

    /**
     * Executa uma requisição para a API do Google Gemini
     * @param {string} promptText 
     * @param {string} systemInstruction 
     * @returns {Promise<string>}
     */
    async function callGemini(promptText, systemInstruction = '') {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('Chave da API Gemini não configurada.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: promptText }]
                }
            ],
            generationConfig: {
                temperature: 0.5,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 3072,
            }
        };

        if (systemInstruction) {
            payload.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `Erro ${response.status}: ${response.statusText}`;
            throw new Error(`Falha na comunicação com a API Gemini: ${errMsg}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
            throw new Error('A API Gemini não retornou nenhum texto válido.');
        }

        return candidate.content.parts[0].text;
    }

    /**
     * Extrai JSON limpo de uma resposta de texto de IA
     * @param {string} text 
     * @returns {object}
     */
    function parseJSONResponse(text) {
        try {
            let clean = text.trim();
            if (clean.startsWith('```json')) {
                clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (clean.startsWith('```')) {
                clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            return JSON.parse(clean);
        } catch (e) {
            console.error('Erro ao analisar JSON retornado pela IA:', text, e);
            throw new Error('Não foi possível interpretar a resposta estruturada da IA.');
        }
    }

    /**
     * 1. Gerador de Síntese de Qualificações:
     * Lê os dados preenchidos e gera 3 opções de texto (Executivo, Técnico, Criativo)
     * @param {object} resumeData 
     * @returns {Promise<{executive: string, technical: string, creative: string}>}
     */
    async function generateSynthesisOptions(resumeData) {
        if (!hasApiKey()) {
            return generateSynthesisFallback(resumeData);
        }

        const systemInstruction = `Você é um consultor especialista em RH e redação profissional de currículos corporativos.
Sua missão é gerar exatamente 3 opções de síntese de qualificações (resumos profissionais de 4 a 6 linhas cada) baseadas nos dados fornecidos do candidato.
Cada opção deve ter um estilo bem definido:
1. "executive": Foco em liderança, alcance de resultados, visão de negócios, comprometimento e impacto.
2. "technical": Foco em competências técnicas, métodos de trabalho, ferramentas (hard skills), precisão e processos.
3. "creative": Foco em dinamismo, inovação, adaptabilidade, comunicação, trabalho em equipe e aprendizado contínuo.

Retorne ESTRITAMENTE um objeto JSON no formato:
{
  "executive": "texto do resumo executivo...",
  "technical": "texto do resumo técnico...",
  "creative": "texto do resumo criativo..."
}`;

        const prompt = `Dados do candidato para a síntese de qualificações:
- Nome: ${resumeData.name || 'Não informado'}
- Objetivo/Cargo pretendido: ${resumeData.objective || 'Profissional'}
- Formação Acadêmica: ${JSON.stringify(resumeData.education || [])}
- Experiências Profissionais: ${JSON.stringify(resumeData.experience || [])}
- Hard Skills: ${(resumeData.hardSkills || []).join(', ')} ${resumeData.otherHardSkills ? `(${resumeData.otherHardSkills})` : ''}
- Soft Skills: ${(resumeData.softSkills || []).join(', ')} ${resumeData.otherSoftSkills ? `(${resumeData.otherSoftSkills})` : ''}
- Cursos Complementares: ${JSON.stringify(resumeData.courses || [])}
- Informações Adicionais: ${resumeData.additionalInfo || ''}

Gere as 3 sínteses profissionais em português (pt-BR). Cada opção deve ser um parágrafo coeso e fluído de aproximadamente 4 a 6 linhas.`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            if (parsed.executive && parsed.technical && parsed.creative) {
                return parsed;
            }
            throw new Error('Formato de resposta inesperado.');
        } catch (error) {
            console.warn('Erro ao chamar Gemini para síntese, usando fallback inteligente:', error);
            const fallback = generateSynthesisFallback(resumeData);
            fallback._warning = error.message;
            return fallback;
        }
    }

    /**
     * Fallback heurístico para síntese de qualificações
     */
    function generateSynthesisFallback(data) {
        const objective = data.objective || 'na sua área de atuação';
        const hardSkills = (data.hardSkills || []).concat(data.otherHardSkills ? data.otherHardSkills.split(',') : []);
        const softSkills = (data.softSkills || []).concat(data.otherSoftSkills ? data.otherSoftSkills.split(',') : []);
        const hardStr = hardSkills.slice(0, 4).join(', ') || 'ferramentas de produtividade e gestão';
        const softStr = softSkills.slice(0, 4).join(', ') || 'proatividade, foco e comunicação';
        
        let eduStr = 'Profissional qualificado';
        if (data.education && data.education.length > 0) {
            const firstEdu = data.education[0];
            if (firstEdu.course && firstEdu.institution) {
                eduStr = `Formação em ${firstEdu.course} pela instituição ${firstEdu.institution}`;
            } else if (firstEdu.level) {
                eduStr = `Com formação em nível de ${firstEdu.level}`;
            }
        }

        let expStr = 'com sólida dedicação ao aprimoramento contínuo';
        if (data.experience && data.experience.length > 0 && data.experience[0].position) {
            expStr = `com histórico de atuação como ${data.experience[0].position}`;
        }

        return {
            executive: `${eduStr}, ${expStr}, com foco direcionado a ${objective}. Demonstra sólida capacidade de planejamento, liderança e resolução de problemas operacionais e estratégicos. Destaca-se por competências em ${hardStr}, atuando com postura orientada a metas de alto padrão, eficiência de processos e geração contínua de valor para a organização.`,
            technical: `${eduStr} e experiência prática aplicada em rotinas corporativas com ênfase em ${objective}. Possui proficiência e aplicação consolidada em ${hardStr}. Caracteriza-se por rigor analítico, organização sistemática e aderência a melhores práticas metodológicas, otimizando entregas com precisão técnica e qualidade comprovada.`,
            creative: `Profissional dinâmico e colaborativo, direcionado ao segmento de ${objective}. Reúne conhecimentos em ${hardStr} aliados a fortes diferenciais comportamentais em ${softStr}. Reconhecido pela facilidade de adaptação a novos cenários, visão inovadora para solução de desafios diários e facilidade em integrar equipes multidisciplinares com entusiasmo.`
        };
    }

    /**
     * 2. Aprimoramento da Descrição de Experiências (Metodologia STAR e verbos de ação):
     * @param {string} position 
     * @param {string} company 
     * @param {string} currentDescription 
     * @returns {Promise<{improvedText: string, methodologyExplanation: string}>}
     */
    async function improveExperienceDescription(position, company, currentDescription) {
        if (!hasApiKey()) {
            return improveExperienceFallback(position, company, currentDescription);
        }

        const systemInstruction = `Você é um redator sênior de currículos executivos especializado na metodologia STAR (Situação, Tarefa, Ação, Resultado) e no uso de verbos de ação corporativos.
Sua missão é reescrever descrições de atividades de trabalho para torná-las muito mais impactantes, profissionais, claras e elegantes.
Utilize verbos de ação no início das frases (ex: "Gerenciou", "Implementou", "Otimizou", "Conduziu", "Articulou", "Executou").
Destaque o impacto e a responsabilidade corporativa.
Retorne ESTRITAMENTE um JSON com:
{
  "improvedText": "Descrição reescrita e otimizada (de 2 a 5 linhas bem estruturadas ou tópicos com marcadores claros)",
  "methodologyExplanation": "Breve explicação de 1 linha sobre as melhorias aplicadas (ex: verbos de ação e foco em resultados STAR)"
}`;

        const prompt = `Cargo: ${position || 'Não especificado'}
Empresa: ${company || 'Não especificada'}
Texto original da descrição das atividades:
"${currentDescription || 'Atividades gerais do cargo'}"

Reescreva a descrição profissional utilizando a metodologia STAR e verbos de ação corporativos em português (pt-BR).`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            if (parsed.improvedText) {
                return parsed;
            }
            throw new Error('Formato inválido retornado pela IA.');
        } catch (error) {
            console.warn('Erro ao chamar Gemini para melhoria de experiência, usando fallback:', error);
            const fallback = improveExperienceFallback(position, company, currentDescription);
            fallback._warning = error.message;
            return fallback;
        }
    }

    /**
     * Fallback heurístico para melhoria de experiências
     */
    function improveExperienceFallback(position, company, currentDescription) {
        const desc = currentDescription ? currentDescription.trim() : '';
        let improved = '';

        if (!desc) {
            improved = `• Responsável pelo planejamento e execução das rotinas operacionais inerentes à função de ${position || 'especialista'}.\n• Atuação direta no cumprimento de prazos, controle de processos e melhoria contínua das atividades diárias.\n• Comunicação colaborativa com equipes multidisciplinares para alcance das metas estabelecidas.`;
        } else {
            const lines = desc.split(/[.\n;]+/).filter(l => l.trim().length > 3);
            const actionVerbs = [
                'Conduziu e organizou',
                'Implementou rotinas operacionais e deu suporte a',
                'Atuou ativamente na execução e acompanhamento de',
                'Otimizou processos garantindo agilidade e qualidade em',
                'Gerenciou demandas prioritárias com foco na excelência de'
            ];

            if (lines.length > 0) {
                improved = lines.map((line, idx) => {
                    const trimmed = line.trim();
                    const verb = actionVerbs[idx % actionVerbs.length];
                    const cleanPhrase = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
                    return `• ${verb} ${cleanPhrase}, assegurando conformidade com os padrões de qualidade e eficiência da empresa.`;
                }).join('\n');
            } else {
                improved = `• Atuação estratégica na execução das atribuições de ${position || 'cargo'}, com ênfase na otimização de fluxos de trabalho e entrega consistente de resultados em ${company || 'ambiente corporativo'}.`;
            }
        }

        return {
            improvedText: improved,
            methodologyExplanation: 'Estruturado com verbos de ação corporativos e foco em responsabilidade e qualidade das entregas.'
        };
    }

    /**
     * 3. Revisão Ortográfica e de Tom Corporativo:
     * @param {object} resumeData 
     * @returns {Promise<Array<{key: string, label: string, original: string, improved: string, reason: string}>>}
     */
    async function reviewGrammarAndTone(resumeData) {
        if (!hasApiKey()) {
            return reviewGrammarAndToneFallback(resumeData);
        }

        const fieldsToReview = [];
        if (resumeData.objective) {
            fieldsToReview.push({ key: 'objective', label: 'Objetivo Profissional', text: resumeData.objective });
        }
        if (resumeData.qualificationSummary) {
            fieldsToReview.push({ key: 'qualificationSummary', label: 'Síntese de Qualificações', text: resumeData.qualificationSummary });
        }
        if (resumeData.experience && Array.isArray(resumeData.experience)) {
            resumeData.experience.forEach((exp, idx) => {
                if (exp.description && exp.description.trim()) {
                    fieldsToReview.push({
                        key: `experience_${idx}`,
                        label: `Experiência: ${exp.position || 'Cargo'} (${exp.company || 'Empresa'})`,
                        text: exp.description,
                        expIndex: idx
                    });
                }
            });
        }
        if (resumeData.additionalInfo) {
            fieldsToReview.push({ key: 'additionalInfo', label: 'Informações Complementares', text: resumeData.additionalInfo });
        }

        if (fieldsToReview.length === 0) {
            return [];
        }

        const systemInstruction = `Você é um revisor de texto e gramática corporativa de alto nível para documentos profissionais e currículos.
Sua função é revisar os trechos de texto enviados, corrigindo pontuação, concordância, ortografia, acentuação e ajustando o vocabulário para um tom estritamente formal, assertivo e corporativo (sem gírias, coloquialismos ou ambiguidades).
Para cada campo enviado, retorne a versão revisada e uma breve justificativa da melhoria.
Retorne ESTRITAMENTE um array JSON no formato:
[
  {
    "key": "identificador_do_campo",
    "label": "Nome do Campo",
    "original": "texto original",
    "improved": "texto corrigido e com tom corporativo",
    "reason": "Explicação das correções ortográficas e de tom realizadas"
  }
]`;

        const prompt = `Por favor, revise os seguintes campos de currículo:
${JSON.stringify(fieldsToReview, null, 2)}`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            throw new Error('Resposta não é um array válido.');
        } catch (error) {
            console.warn('Erro ao chamar Gemini para revisão gramatical, usando fallback:', error);
            const fallback = reviewGrammarAndToneFallback(resumeData);
            return fallback;
        }
    }

    /**
     * Fallback heurístico inteligente para revisão gramatical e de tom corporativo
     */
    function reviewGrammarAndToneFallback(resumeData) {
        const results = [];

        function enhanceText(txt, type) {
            if (!txt) return '';
            let t = txt.trim();
            
            // Correções ortográficas e contrações comuns
            const typoMap = [
                [/\bvc\b/gi, 'você'],
                [/\bvcs\b/gi, 'vocês'],
                [/\bpq\b/gi, 'porque'],
                [/\btbm\b/gi, 'também'],
                [/\btb\b/gi, 'também'],
                [/\bq\b/gi, 'que'],
                [/\bpra\b/gi, 'para a'],
                [/\bpro\b/gi, 'para o'],
                [/\bmto\b/gi, 'muito'],
                [/\btd\b/gi, 'tudo'],
                [/\bfazia\b/gi, 'executava'],
                [/\btrabalhei com\b/gi, 'atuei com foco em'],
                [/\bajudei\b/gi, 'colaborei ativamente'],
                [/\bcuidava de\b/gi, 'gerenciava'],
                [/\bvi\b/gi, 'acompanhei'],
                [/\s+/g, ' ']
            ];

            typoMap.forEach(([pattern, repl]) => {
                t = t.replace(pattern, repl);
            });

            t = t.charAt(0).toUpperCase() + t.slice(1);
            if (!/[.!?]$/.test(t)) t += '.';

            // Se for objetivo curto, deixar mais assertivo
            if (type === 'objective' && !/atua[çc][ãa]o|oportunidade|desenvolvimento|foco/i.test(t)) {
                t = `Atuação estratégica como ${t.replace(/\.$/, '')}, contribuindo para os resultados e o crescimento da empresa.`;
            }

            return t;
        }

        if (resumeData.objective && resumeData.objective.trim()) {
            const improved = enhanceText(resumeData.objective, 'objective');
            results.push({
                key: 'objective',
                label: 'Objetivo Profissional',
                original: resumeData.objective,
                improved: improved,
                reason: 'Ajuste de assertividade, pontuação formal e vocabulário corporativo de impacto.'
            });
        }

        if (resumeData.qualificationSummary && resumeData.qualificationSummary.trim()) {
            const improved = enhanceText(resumeData.qualificationSummary, 'summary');
            results.push({
                key: 'qualificationSummary',
                label: 'Síntese de Qualificações',
                original: resumeData.qualificationSummary,
                improved: improved,
                reason: 'Refinamento sintático, eliminação de ambiguidades e ênfase em competências.'
            });
        }

        if (resumeData.experience && Array.isArray(resumeData.experience)) {
            resumeData.experience.forEach((exp, idx) => {
                if (exp.description && exp.description.trim()) {
                    const improved = enhanceText(exp.description, 'experience');
                    results.push({
                        key: `experience_${idx}`,
                        label: `Experiência: ${exp.position || 'Cargo'} (${exp.company || 'Empresa'})`,
                        original: exp.description,
                        improved: improved,
                        reason: 'Estruturação com verbos de ação e padronização formal de responsabilidades.',
                        expIndex: idx
                    });
                }
            });
        }

        if (resumeData.additionalInfo && resumeData.additionalInfo.trim()) {
            const improved = enhanceText(resumeData.additionalInfo, 'additional');
            results.push({
                key: 'additionalInfo',
                label: 'Informações Complementares',
                original: resumeData.additionalInfo,
                improved: improved,
                reason: 'Padronização de pontuação, clareza e elegância na apresentação dos dados adicionais.'
            });
        }

        return results;
    }

    /**
     * 4. Importação Inteligente (Resume Parsing):
     * Analisa o texto bruto de um currículo antigo ou perfil do LinkedIn e mapeia para a estrutura completa do formulário
     * @param {string} rawText 
     * @returns {Promise<object>}
     */
    async function parseResumeText(rawText) {
        if (!rawText || !rawText.trim()) {
            throw new Error('Nenhum texto fornecido para análise.');
        }

        if (!hasApiKey()) {
            return parseResumeFallback(rawText);
        }

        const systemInstruction = `Você é um motor especialista de ATS (Applicant Tracking System) e Resume Parsing para o mercado corporativo brasileiro.
Sua missão é ler o texto desestruturado de um currículo ou perfil de LinkedIn e extrair absolutamente TODAS as informações relevantes para preencher o formulário estruturado de currículo.

ATENÇÃO: Mantenha as seções ESTRITAMENTE SEPARADAS. NUNCA concatene textos de seções diferentes.

REGRAS DE MAPEAMENTO CRUCIAIS:
1. "name": Nome completo da pessoa (ex: "Deivison Santos"). Se for o termo genérico "Nome Completo", deixe em branco.
2. "phone1" e "phone2": Formate com DDD e hífen, ex: "(75) 98123-8602".
3. "city" e "state": "city" é apenas o nome da cidade (ex: "Serrinha", "São Paulo"). "state" é estritamente a sigla válida de 2 letras de estado brasileiro (ex: "BA", "SP"). NUNCA preencha a cidade com palavras de seções como "SÍNTESE" nem o estado com preposições como "DE".
4. "maritalStatus": Apenas uma destas opções: "Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável" (ou "" se não informado).
5. "objective": Apenas o cargo ou área de interesse (1 linha curta, ex: "Desenvolvedor de Sistemas" ou "Assistente Administrativo"). NUNCA adicione o texto da síntese ou outras seções aqui.
6. "qualificationSummary": Apenas o texto do resumo/síntese profissional (3 a 5 linhas). Remova cabeçalhos como "SÍNTESE DE QUALIFICAÇÕES". NUNCA misture com a seção de Educação ou Experiências.
7. "education": Array com TODAS as formações acadêmicas encontradas.
   - "level": Exatamente um destes: "Ensino Fundamental", "Ensino Médio", "Ensino Técnico", "Graduação", "Pós-graduação", "Mestrado", "Doutorado".
   - "course": Nome do curso/área (ex: "Administração", "Desenvolvimento de Sistemas").
   - "institution": Nome da instituição (ex: "CETEP", "SENAC").
   - "status": Exatamente um destes: "Concluído", "Cursando", "Interrompido".
   - "year": Ano de conclusão ou previsão (ex: 2026).
   - "shift": Exatamente um destes: "Matutino", "Vespertino", "Noturno", "Integral", "EAD".
8. "experience": Array com TODAS as experiências profissionais.
   - "position": Cargo desempenhado (ex: "Desenvolvedor de Sistemas").
   - "company": Nome da empresa (ex: "CETEP").
   - "period": Período (ex: "Ma 2025 - Out 2026").
   - "description": Descrição detalhada das atividades e realizações.
9. "courses": Cursos livres e certificações complementares ("name", "institution", "hours", "year").
10. "hardSkills": Array com as opções que o candidato possui dentre estas EXATAS: ["Programação", "Análise de dados", "Pacote Office", "Controle de planilhas e dados", "Operação de sistemas de gestão (ERP)", "Ferramentas de videoconferência", "Google Docs / Drive", "Rotinas administrativas", "Noções de fluxo de caixa"].
11. "otherHardSkills": Outras competências técnicas citadas, separadas por vírgula.
12. "softSkills": Array com as opções que o candidato possui dentre estas EXATAS: ["Trabalho em equipe", "Adaptabilidade", "Comunicação clara", "Escuta ativa", "Criatividade", "Inovação", "Visão de melhoria contínua", "Organização", "Comprometimento"].
13. "otherSoftSkills": Outras competências comportamentais citadas, separadas por vírgula.
14. "additionalInfo": Idiomas, CNH, disponibilidade, etc.

Retorne ESTRITAMENTE um objeto JSON válido.`;

        const prompt = `Extraia todos os dados do seguinte currículo com a máxima precisão:\n\n${rawText.slice(0, 30000)}`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            if (parsed && typeof parsed === 'object') {
                if (parsed.city && /s[íi]ntese|objetivo|educa|experi|curr[íi]culo|nome|idade|telefone|email/i.test(parsed.city)) {
                    parsed.city = '';
                }
                if (parsed.state) {
                    parsed.state = String(parsed.state).toUpperCase().trim();
                    if (parsed.state.length > 2 || !BRAZILIAN_UF_SET.has(parsed.state)) {
                        parsed.state = '';
                    }
                }
            }
            return parsed;
        } catch (error) {
            console.warn('Erro ao chamar Gemini para Resume Parsing, usando fallback heurístico:', error);
            const fallback = parseResumeFallback(rawText);
            fallback._warning = error.message;
            return fallback;
        }
    }

    const BRAZILIAN_UF_SET = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);

    /**
     * Fallback heurístico inteligente e estruturado para parsing de currículo
     */
    function parseResumeFallback(text) {
        const result = {
            name: '',
            birthplace: '',
            maritalStatus: '',
            age: '',
            neighborhood: '',
            city: '',
            state: '',
            phone1: '',
            phone2: '',
            email: '',
            license: '',
            objective: '',
            qualificationSummary: '',
            education: [],
            experience: [],
            courses: [],
            hardSkills: [],
            softSkills: [],
            otherHardSkills: '',
            otherSoftSkills: '',
            additionalInfo: ''
        };

        // Limpeza de rodapés de impressão e artefatos de navegador
        const cleanText = text
            .replace(/\d{2}\/\d{2}\/\d{4},\s*\d{2}:\d{2}\s*Curr[íi]culo\s+Express[^\n]*/gi, '')
            .replace(/https?:\/\/[^\s]+/gi, '')
            .replace(/127\.0\.0\.1:\d+[^\n]*/g, '')
            .replace(/\b\d+\/\d+\b/g, '')
            .trim();

        // Mapeamento de cabeçalhos de seção com limites estritos
        const sectionPatterns = [
            { key: 'objective', regex: /(?:^|\n|\.\s+)(?:OBJETIVO(?:\s+PROFISSIONAL)?|CARGO\s+PRETENDIDO|ÁREA\s+DE\s+INTERESSE|ÁREA\s+OU\s+FUNÇÃO\s+DE\s+INTERESSE)[\s:]*/i },
            { key: 'synthesis', regex: /(?:^|\n|\.\s+)(?:SÍNTESE(?:\s+DE\s+QUALIFICAÇÕES)?|RESUMO(?:\s+PROFISSIONAL|\s+DE\s+QUALIFICAÇÕES)?|PERFIL\s+PROFISSIONAL|SOBRE\s+MIM)[\s:]*/i },
            { key: 'education', regex: /(?:^|\n|\.\s+)(?:EDUCAÇÃO(?:\s+E\s+FORMAÇÃO)?|FORMAÇÃO(?:\s+ACADÊMICA)?|ESCOLARIDADE)[\s:]*/i },
            { key: 'experience', regex: /(?:^|\n|\.\s+)(?:EXPERIÊNCIAS?(?:\s+PROFISSIONAIS?(?:\/ACADÊMICAS?)?)?|HISTÓRICO\s+PROFISSIONAL)[\s:]*/i },
            { key: 'courses', regex: /(?:^|\n|\.\s+)(?:CURSOS(?:\s+COMPLEMENTARES|\s+E\s+CERTIFICAÇÕES)?|CERTIFICAÇÕES|TREINAMENTOS)[\s:]*/i },
            { key: 'skills', regex: /(?:^|\n|\.\s+)(?:HABILIDADES|COMPETÊNCIAS|HARD\s+SKILLS|SOFT\s+SKILLS)[\s:]*/i },
            { key: 'additional', regex: /(?:^|\n|\.\s+)(?:INFORMAÇÕES(?:\s+COMPLEMENTARES|\s+ADICIONAIS)?|DADOS\s+ADICIONAIS)[\s:]*/i }
        ];

        const foundSections = [];
        sectionPatterns.forEach(sp => {
            const match = sp.regex.exec(cleanText);
            if (match) {
                foundSections.push({
                    key: sp.key,
                    startIndex: match.index,
                    contentIndex: match.index + match[0].length
                });
            }
        });

        foundSections.sort((a, b) => a.startIndex - b.startIndex);

        const sections = {};
        let headerText = '';

        if (foundSections.length > 0) {
            headerText = cleanText.slice(0, foundSections[0].startIndex).trim();
            for (let i = 0; i < foundSections.length; i++) {
                const current = foundSections[i];
                const next = foundSections[i + 1];
                const end = next ? next.startIndex : cleanText.length;
                sections[current.key] = cleanText.slice(current.contentIndex, end).trim();
            }
        } else {
            headerText = cleanText;
        }

        const headerLines = headerText.split('\n').map(l => l.trim()).filter(Boolean);

        // 1. Extração de Email
        const emailMatch = cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) result.email = emailMatch[0];

        // 2. Extração de Telefones
        const phoneMatches = cleanText.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4,5}[-\s.]?\d{4}/g);
        if (phoneMatches && phoneMatches.length > 0) {
            result.phone1 = phoneMatches[0].replace(/\s+/g, ' ').trim();
            if (phoneMatches.length > 1) result.phone2 = phoneMatches[1].replace(/\s+/g, ' ').trim();
        }

        // 3. Detecção de Idade
        const ageMatch = cleanText.match(/(\d{1,2})\s*(?:anos|idade)/i);
        if (ageMatch) result.age = ageMatch[1];

        // 4. Detecção de CNH
        const cnhMatch = cleanText.match(/CNH[:\s]*([A-E]+|AB|A|B)\b/i);
        if (cnhMatch) result.license = cnhMatch[1].toUpperCase();

        // 5. Detecção de Estado Civil
        if (/casad[oa]/i.test(cleanText)) result.maritalStatus = 'Casado(a)';
        else if (/solteir[oa]/i.test(cleanText)) result.maritalStatus = 'Solteiro(a)';
        else if (/divorciad[oa]/i.test(cleanText)) result.maritalStatus = 'Divorciado(a)';
        else if (/uni[ãa]o est[áa]vel/i.test(cleanText)) result.maritalStatus = 'União Estável';

        // 6. Detecção de Cidade e Estado (Validação rigorosa contra lista de UFs)
        for (const line of headerLines) {
            const locMatch = line.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,35})[,\s/-]+([A-Za-z]{2})$/);
            if (locMatch) {
                const potentialCity = locMatch[1].trim();
                const potentialState = locMatch[2].toUpperCase().trim();
                if (BRAZILIAN_UF_SET.has(potentialState) && !/s[íi]ntese|objetivo|educa|experi|nome|idade|telefone|email/i.test(potentialCity)) {
                    result.city = potentialCity;
                    result.state = potentialState;
                    break;
                }
            }
        }

        // 7. Extração de Nome
        for (const line of headerLines) {
            if (!line.includes('@') && 
                !line.match(/\d{4}/) && 
                !/anos|idade|solteir|casad|cnh|telefone|email|celular/i.test(line) &&
                !BRAZILIAN_UF_SET.has(line.toUpperCase().trim()) &&
                line.length >= 2 && line.length <= 60 &&
                !/s[íi]ntese|objetivo|educa|experi/i.test(line)) {
                if (line.toLowerCase() !== 'nome completo') {
                    result.name = line;
                }
                break;
            }
        }

        // 8. Objetivo (Isolado e sem vazamento)
        if (sections.objective) {
            const objLines = sections.objective.split('\n').map(l => l.trim()).filter(Boolean);
            result.objective = (objLines[0] || '').replace(/^[•\-\s]+/, '').slice(0, 150);
        }

        // 9. Síntese de Qualificações
        if (sections.synthesis) {
            result.qualificationSummary = sections.synthesis
                .replace(/^(?:SÍNTESE\s+DE\s+QUALIFICAÇÕES|DE\s+QUALIFICAÇÕES|QUALIFICAÇÕES|RESUMO\s+PROFISSIONAL|RESUMO|PERFIL\s+PROFISSIONAL|SOBRE\s+MIM)[\s:.]*/i, '')
                .trim()
                .slice(0, 800);
        }

        // 10. Formação Acadêmica
        if (sections.education) {
            const eduLines = sections.education.split('\n').map(l => l.trim()).filter(Boolean);
            eduLines.forEach(line => {
                const cleanLine = line.replace(/^[•\-\s]+/, '');
                let level = '';
                if (/fundamental/i.test(cleanLine)) level = 'Ensino Fundamental';
                else if (/m[ée]dio/i.test(cleanLine)) level = 'Ensino Médio';
                else if (/t[ée]cnico/i.test(cleanLine)) level = 'Ensino Técnico';
                else if (/gradua|superior|bacharel|licenciatura|tecn[óo]logo/i.test(cleanLine)) level = 'Graduação';
                else if (/p[óo]s|mba|especializa/i.test(cleanLine)) level = 'Pós-graduação';
                else if (/mestrado/i.test(cleanLine)) level = 'Mestrado';
                else if (/doutorado/i.test(cleanLine)) level = 'Doutorado';

                if (level || cleanLine.length > 5) {
                    let status = 'Concluído';
                    if (/cursando|em andamento|atual/i.test(cleanLine)) status = 'Cursando';
                    else if (/interrompido|trancado|incompleto/i.test(cleanLine)) status = 'Interrompido';

                    let shift = '';
                    if (/matutino|manh[ãa]/i.test(cleanLine)) shift = 'Matutino';
                    else if (/vespertino|tarde/i.test(cleanLine)) shift = 'Vespertino';
                    else if (/noturno|noite/i.test(cleanLine)) shift = 'Noturno';
                    else if (/integral/i.test(cleanLine)) shift = 'Integral';
                    else if (/ead|dist[âa]ncia|online/i.test(cleanLine)) shift = 'EAD';

                    const yearMatch = cleanLine.match(/\b(19\d{2}|20\d{2})\b/);
                    const year = yearMatch ? yearMatch[1] : '';

                    let course = '';
                    let institution = '';

                    const parts = cleanLine.split(/[-–|]/).map(p => p.trim());
                    if (parts.length >= 2) {
                        course = parts[0].replace(/^(?:Ensino\s+M[ée]dio|Ensino\s+T[ée]cnico|Gradua[çc][ãa]o)\s*(?:em\s+)?/i, '').trim();
                        institution = parts[1].replace(/,.*$/, '').trim();
                    } else {
                        course = cleanLine;
                    }

                    result.education.push({
                        level: level || 'Ensino Médio',
                        course: course || 'Geral',
                        institution: institution || 'Instituição de Ensino',
                        status,
                        year: year || '2024',
                        shift: shift || 'Matutino'
                    });
                }
            });
        }

        // 11. Experiências Profissionais
        if (sections.experience) {
            const expLines = sections.experience.split('\n').map(l => l.trim()).filter(Boolean);
            let currentExp = null;

            expLines.forEach(line => {
                const cleanLine = line.replace(/^[•\-\s]+/, '');
                if (cleanLine.includes('|') || cleanLine.includes(' - ') || /\b(?:19\d{2}|20\d{2})\b/.test(cleanLine)) {
                    const parts = cleanLine.split(/[|–]/).map(p => p.trim());
                    if (parts.length >= 2) {
                        if (currentExp) result.experience.push(currentExp);
                        currentExp = {
                            position: parts[0] || 'Profissional',
                            company: parts[1] || 'Empresa',
                            period: parts[2] || '',
                            description: ''
                        };
                        return;
                    }
                }

                if (currentExp) {
                    currentExp.description = currentExp.description ? currentExp.description + ' ' + cleanLine : cleanLine;
                } else if (cleanLine.length > 5) {
                    currentExp = {
                        position: 'Atuação Profissional',
                        company: 'Empresa',
                        period: 'Recente',
                        description: cleanLine
                    };
                }
            });

            if (currentExp) result.experience.push(currentExp);
        }

        // 12. Cursos Complementares
        if (sections.courses) {
            const courseLines = sections.courses.split('\n').map(l => l.trim()).filter(Boolean);
            courseLines.forEach(line => {
                const cleanLine = line.replace(/^[•\-\s]+/, '');
                if (cleanLine.length > 3) {
                    const parts = cleanLine.split(/[-–|]/).map(p => p.trim());
                    const yearMatch = cleanLine.match(/\b(19\d{2}|20\d{2})\b/);
                    const hoursMatch = cleanLine.match(/\b(\d{1,4}\s*h(?:oras)?)\b/i);

                    result.courses.push({
                        name: parts[0] || cleanLine,
                        institution: parts[1] || 'SENAC',
                        hours: hoursMatch ? hoursMatch[1] : '40h',
                        year: yearMatch ? yearMatch[1] : '2024'
                    });
                }
            });
        }

        // 13. Habilidades (Hard e Soft Skills)
        STANDARD_HARD_SKILLS.forEach(skill => {
            const regex = new RegExp(skill.replace(/[()]/g, ''), 'i');
            if (regex.test(cleanText)) result.hardSkills.push(skill);
        });

        STANDARD_SOFT_SKILLS.forEach(skill => {
            const regex = new RegExp(skill.replace(/[()]/g, ''), 'i');
            if (regex.test(cleanText)) result.softSkills.push(skill);
        });

        // 14. Informações Complementares
        if (sections.additional) {
            result.additionalInfo = sections.additional.trim();
        }

        return result;
    }

    /**
     * 5. Sugestão Dinâmica de Habilidades (Skills):
     * Analisa o cargo/área pretendida e sugere as Hard e Soft Skills mais demandadas no mercado
     * @param {string} roleTitle 
     * @returns {Promise<{role: string, marketSummary: string, suggestedHardSkills: Array<string>, suggestedSoftSkills: Array<string>}>}
     */
    async function suggestSkillsForRole(roleTitle) {
        if (!roleTitle || !roleTitle.trim()) {
            throw new Error('Informe a área ou cargo de interesse para receber sugestões.');
        }

        if (!hasApiKey()) {
            return suggestSkillsFallback(roleTitle);
        }

        const systemInstruction = `Você é um especialista em recrutamento corporativo e inteligência de mercado de trabalho (Labour Market Analytics).
Com base no cargo ou área de atuação fornecido pelo usuário, forneça uma lista com as habilidades técnicas (Hard Skills) e comportamentais (Soft Skills) mais valorizadas e requisitadas pelos recrutadores para essa vaga no Brasil.

Retorne ESTRITAMENTE um objeto JSON no formato:
{
  "role": "Nome Normalizado do Cargo",
  "marketSummary": "Breve frase (1 linha) sobre as competências-chave deste perfil no mercado.",
  "suggestedHardSkills": ["Habilidade Técnica 1", "Habilidade Técnica 2", "Habilidade Técnica 3", "Habilidade Técnica 4", "Habilidade Técnica 5", "Habilidade Técnica 6"],
  "suggestedSoftSkills": ["Habilidade Comportamental 1", "Habilidade Comportamental 2", "Habilidade Comportamental 3", "Habilidade Comportamental 4", "Habilidade Comportamental 5", "Habilidade Comportamental 6"]
}`;

        const prompt = `Cargo/Função de interesse: "${roleTitle}".
Gere as melhores sugestões de Hard Skills e Soft Skills para destacar este profissional no mercado atual.`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            if (parsed.suggestedHardSkills && parsed.suggestedSoftSkills) {
                return parsed;
            }
            throw new Error('Formato inválido retornado pela IA.');
        } catch (error) {
            console.warn('Erro ao chamar Gemini para sugestão de skills, usando fallback:', error);
            const fallback = suggestSkillsFallback(roleTitle);
            fallback._warning = error.message;
            return fallback;
        }
    }

    /**
     * Fallback heurístico para sugestão de habilidades baseado em vocabulário profissional
     */
    function suggestSkillsFallback(roleTitle) {
        const title = (roleTitle || '').toLowerCase();

        // 1. Área de TI / Desenvolvimento
        if (/dev|programad|software|front|back|full|web|sistemas|dados|python|java|tech/i.test(title)) {
            return {
                role: roleTitle,
                marketSummary: 'Forte demanda por domínio de linguagens, versionamento de código e resolução analítica de problemas.',
                suggestedHardSkills: ['Programação', 'Análise de dados', 'Git / GitHub', 'SQL e Bancos de Dados', 'APIs RESTful', 'Metodologias Ágeis (Scrum/Kanban)'],
                suggestedSoftSkills: ['Resolução de problemas complexos', 'Trabalho em equipe', 'Aprendizado contínuo', 'Comunicação clara', 'Adaptabilidade', 'Atenção a detalhes']
            };
        }

        // 2. Área Administrativa / Secretariado / Financeira
        if (/admin|auxiliar|assistente|financeir|contab|escrit[oó]rio|rotinas/i.test(title)) {
            return {
                role: roleTitle,
                marketSummary: 'Foco em controle de fluxo de processos, conciliação de dados, precisão e organização impecável.',
                suggestedHardSkills: ['Pacote Office', 'Controle de planilhas e dados', 'Rotinas administrativas', 'Noções de fluxo de caixa', 'Operação de sistemas de gestão (ERP)', 'Google Docs / Drive'],
                suggestedSoftSkills: ['Organização', 'Comprometimento', 'Comunicação clara', 'Atenção aos prazos', 'Ética profissional', 'Trabalho em equipe']
            };
        }

        // 3. Área Comercial / Vendas / Atendimento
        if (/venda|comercial|atend|cliente|consultor|suporte|tele/i.test(title)) {
            return {
                role: roleTitle,
                marketSummary: 'Destaque para negociação consultiva, foco no cliente e orientação para atingimento de metas.',
                suggestedHardSkills: ['Técnicas de Negociação', 'Sistemas de CRM', 'Atendimento ao Cliente (Customer Success)', 'Ferramentas de videoconferência', 'Pacote Office', 'Controle de planilhas e dados'],
                suggestedSoftSkills: ['Comunicação clara', 'Escuta ativa', 'Empatia e persuasão', 'Resiliência sob pressão', 'Adaptabilidade', 'Comprometimento']
            };
        }

        // 4. Área de Recursos Humanos / Gestão de Pessoas
        if (/rh|recursos humanos|recrut|dp|departamento pessoal|gest[ãa]o/i.test(title)) {
            return {
                role: roleTitle,
                marketSummary: 'Combinação de conhecimento em legislação/processos com alta inteligência interpessoal.',
                suggestedHardSkills: ['Rotinas de Admissão e Folha', 'Triagem de Talentos (R&S)', 'Operação de sistemas de gestão (ERP)', 'Pacote Office', 'Google Docs / Drive', 'Ferramentas de videoconferência'],
                suggestedSoftSkills: ['Escuta ativa', 'Empatia', 'Comunicação clara', 'Gestão de conflitos', 'Trabalho em equipe', 'Visão de melhoria contínua']
            };
        }

        // 5. Perfil Genérico / Outros
        return {
            role: roleTitle,
            marketSummary: 'Competências transversais essenciais para alta performance e empregabilidade corporativa.',
            suggestedHardSkills: ['Pacote Office', 'Controle de planilhas e dados', 'Google Docs / Drive', 'Ferramentas de videoconferência', 'Rotinas administrativas', 'Análise de dados'],
            suggestedSoftSkills: ['Trabalho em equipe', 'Comunicação clara', 'Adaptabilidade', 'Organização', 'Comprometimento', 'Inovação']
        };
    }

    /**
     * 6. Termômetro de Vaga (ATS Compatibility & Keyword Matching):
     * Compara o currículo completo do candidato com a descrição da vaga
     * @param {object} resumeData 
     * @param {string} jobDescription 
     * @returns {Promise<{score: number, matchLevel: string, matchSummary: string, presentKeywords: Array<string>, missingKeywords: Array<{keyword: string, importance: string, targetField: string, tip: string}>, recommendations: Array<string>}>}
     */
    async function analyzeJobCompatibility(resumeData, jobDescription) {
        if (!jobDescription || !jobDescription.trim()) {
            throw new Error('Informe o texto da vaga para calcular a compatibilidade.');
        }

        if (!hasApiKey()) {
            return analyzeJobCompatibilityFallback(resumeData, jobDescription);
        }

        const systemInstruction = `Você é um avaliador sênior de ATS (Applicant Tracking System) de plataformas como Gupy, LinkedIn Recruiter, Greenhouse e Workday.
Sua função é comparar o currículo do candidato com a descrição/requisitos da vaga e fornecer uma análise quantitativa e qualitativa minuciosa, com orientações práticas e acionáveis para o candidato se adequar 100% à vaga.

Retorne ESTRITAMENTE um objeto JSON no formato:
{
  "score": 85,
  "matchLevel": "Alta Compatibilidade | Média Compatibilidade | Baixa Compatibilidade",
  "matchSummary": "Diagnóstico de 1 a 2 frases sobre a aderência geral aos requisitos.",
  "recommendedRole": "Título exato e padronizado do cargo para usar no campo Objetivo Profissional",
  "presentKeywords": ["Palavra-chave 1", "Palavra-chave 2", "Palavra-chave 3"],
  "missingKeywords": [
    {
      "keyword": "Nome da Habilidade ou Termo Ausente",
      "importance": "Crítica | Recomendável | Diferencial",
      "targetField": "otherHardSkills | otherSoftSkills | qualificationSummary | experience",
      "tip": "Orientação curta de como e onde incluir essa palavra-chave no currículo"
    }
  ],
  "actionPlan": [
    {
      "category": "Objetivo Profissional",
      "icon": "🎯",
      "title": "Alinhar Cargo de Interesse",
      "description": "Como ajustar o objetivo para coincidir com o filtro ATS da empresa.",
      "suggestion": "Sugestão prática pronta para aplicar"
    },
    {
      "category": "Síntese de Qualificações",
      "icon": "✨",
      "title": "Enfatizar Competências da Vaga no Resumo",
      "description": "Quais qualificações e diferenciais você deve citar nas primeiras linhas.",
      "suggestion": "Sugestão prática de frase ou foco"
    },
    {
      "category": "Experiências e Realizações",
      "icon": "💼",
      "title": "Atividades com Verbos de Ação e STAR",
      "description": "Como descrever experiências anteriores conectando às ferramentas exigidas pela vaga.",
      "suggestion": "Sugestão prática para o texto das atribuições"
    },
    {
      "category": "Cursos & Certificações",
      "icon": "📜",
      "title": "Capacitações Recomendadas",
      "description": "Cursos complementares que aumentam sua pontuação no algoritmo ATS para este cargo.",
      "suggestion": "Cursos ou tópicos em alta para esta função"
    }
  ],
  "recommendations": [
    "Dica prática 1 para otimizar o currículo para esta vaga",
    "Dica prática 2 para passar pelo filtro ATS",
    "Dica prática 3 de formatação ou palavras-chave"
  ]
}`;

        const prompt = `DADOS DO CURRÍCULO DO CANDIDATO:
- Nome: ${resumeData.name || 'Não informado'}
- Objetivo: ${resumeData.objective || ''}
- Síntese: ${resumeData.qualificationSummary || ''}
- Hard Skills: ${(resumeData.hardSkills || []).join(', ')} ${resumeData.otherHardSkills ? `(${resumeData.otherHardSkills})` : ''}
- Soft Skills: ${(resumeData.softSkills || []).join(', ')} ${resumeData.otherSoftSkills ? `(${resumeData.otherSoftSkills})` : ''}
- Formações: ${JSON.stringify(resumeData.education || [])}
- Experiências: ${JSON.stringify(resumeData.experience || [])}
- Cursos: ${JSON.stringify(resumeData.courses || [])}
- Informações Adicionais: ${resumeData.additionalInfo || ''}

TEXTO DA VAGA PRETENDIDA:
"""
${jobDescription.slice(0, 15000)}
"""

Calcule o score de compatibilidade ATS de 0 a 100, identifique termos correspondentes, lacunas cruciais de palavras-chave, plano de ação detalhado para se enquadrar na vaga e recomendações diretas.`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            if (typeof parsed.score === 'number' && parsed.presentKeywords && parsed.missingKeywords) {
                return parsed;
            }
            throw new Error('Formato inválido retornado na análise ATS.');
        } catch (error) {
            console.warn('Erro ao chamar Gemini para análise ATS, usando fallback heurístico:', error);
            const fallback = analyzeJobCompatibilityFallback(resumeData, jobDescription);
            fallback._warning = error.message;
            return fallback;
        }
    }

    /**
     * Fallback heurístico inteligente para análise ATS e plano de melhoria
     */
    function analyzeJobCompatibilityFallback(resumeData, jobDescription) {
        const resumeText = JSON.stringify(resumeData).toLowerCase();
        const jobText = jobDescription.toLowerCase();

        function cleanRole(text) {
            if (!text) return 'Profissional';
            return text
                .replace(/^(Career opportunity in\s*)+/gi, '')
                .replace(/^(Oportunidad profesional en el [áa]rea de\s*)+/gi, '')
                .replace(/^(Professional in\s*)+/gi, '')
                .replace(/^(Profesional en\s*)+/gi, '')
                .replace(/^(Atua[çc][ãa]o estrat[ée]gica como\s*)+/gi, '')
                .replace(/^(Oportunidade profissional como\s*)+/gi, '')
                .replace(/^(Oportunidade na [áa]rea de\s*)+/gi, '')
                .replace(/,\s*contribuindo para os resultados.*$/i, '')
                .replace(/\.+$/, '')
                .trim() || 'Profissional';
        }

        // Identificar possível título de vaga
        let recommendedRole = cleanRole(resumeData.objective);
        const roleMatch = jobDescription.match(/(?:vaga\s+(?:de|para)?|cargo\s+(?:de)?|oportunidade\s+(?:de|para)?|posi[çc][ãa]o\s+(?:de)?|contrata-se)[:\s]*([^\n.]+)/i);
        if (roleMatch) {
            recommendedRole = cleanRole(roleMatch[1].replace(/^(?:de|para|em|com|um|uma)\s+/i, '').trim().slice(0, 50));
        } else {
            const firstLine = jobDescription.split('\n').map(l => l.trim()).filter(Boolean)[0];
            if (firstLine && firstLine.length <= 50) {
                recommendedRole = cleanRole(firstLine.replace(/^(?:vaga\s+(?:de|para)?|oportunidade\s+(?:de|para)?|contrata-se|de|para)\s+/i, '').trim());
            }
        }

        // Extrair palavras relevantes da vaga (com mais de 4 caracteres)
        const words = jobText.match(/\b[a-zà-ú]{4,}\b/g) || [];
        const stopWords = new Set(['para', 'como', 'mais', 'sobre', 'esse', 'esta', 'está', 'este', 'pela', 'pelo', 'com', 'sem', 'vaga', 'trabalho', 'empresa', 'atuar', 'nossa', 'nosso', 'requisitos', 'beneficios', 'atividades', 'profissional', 'horario', 'salario']);
        const keyMap = new Map();

        words.forEach(w => {
            if (!stopWords.has(w)) {
                keyMap.set(w, (keyMap.get(w) || 0) + 1);
            }
        });

        const topKeywords = Array.from(keyMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(e => e[0]);

        const present = [];
        const missing = [];

        topKeywords.forEach(k => {
            const formatted = k.charAt(0).toUpperCase() + k.slice(1);
            if (resumeText.includes(k)) {
                present.push(formatted);
            } else {
                missing.push({
                    keyword: formatted,
                    importance: missing.length < 3 ? 'Crítica' : 'Recomendável',
                    targetField: 'otherHardSkills',
                    tip: `Inclua o termo "${formatted}" nas suas habilidades ou na descrição das atividades.`
                });
            }
        });

        const totalChecked = Math.max(1, present.length + missing.length);
        const calcScore = Math.round((present.length / totalChecked) * 100);
        const score = Math.max(25, Math.min(95, calcScore));

        let matchLevel = 'Média Compatibilidade';
        if (score >= 75) matchLevel = 'Alta Compatibilidade';
        else if (score < 50) matchLevel = 'Baixa Compatibilidade';

        const actionPlan = [
            {
                category: 'Objetivo Profissional',
                icon: '🎯',
                title: 'Alinhe o Cargo com a Vaga',
                description: `O título da vaga anunciado é "${recommendedRole}". Ajustar seu objetivo para este termo exato pontua mais alto nos filtros ATS.`,
                suggestion: `Utilize "${recommendedRole}" no campo "Área ou função de interesse".`
            },
            {
                category: 'Palavras-Chave Faltantes',
                icon: '⚡',
                title: 'Incorpore Termos Eliminatórios',
                description: `Foram identificadas ${missing.length} competências-chave que constam no anúncio da vaga e ainda não estão citadas no seu currículo.`,
                suggestion: `Adicione termos como ${missing.slice(0, 3).map(m => `"${m.keyword}"`).join(', ')} no seu perfil.`
            },
            {
                category: 'Síntese de Qualificações',
                icon: '✨',
                title: 'Destaque seus Resultados no Resumo',
                description: 'Os primeiros 6 segundos de leitura do recrutador focam na síntese inicial.',
                suggestion: 'Reescreva a síntese evidenciando as principais ferramentas e competências solicitadas na vaga.'
            },
            {
                category: 'Experiências Anteriores',
                icon: '💼',
                title: 'Metodologia STAR nas Atividades',
                description: 'Descreva como você aplicou as competências da vaga em empregos ou projetos passados.',
                suggestion: 'Utilize verbos de ação no passado (ex: "Desenvolveu", "Implementou", "Gerenciou", "Otimizou").'
            }
        ];

        return {
            score,
            matchLevel,
            matchSummary: `Seu currículo contempla ${present.length} de ${totalChecked} competências essenciais mapeadas na vaga.`,
            recommendedRole,
            presentKeywords: present.length > 0 ? present : ['Termos gerais compatíveis'],
            missingKeywords: missing.slice(0, 6),
            actionPlan,
            recommendations: [
                `Alinhe o seu Objetivo Profissional diretamente para "${recommendedRole}".`,
                'Incorpore as palavras-chave ausentes nas descrições de experiências e nas Hard Skills.',
                'Quantifique realizações com números e percentuais para se destacar na triagem humana posterior ao robô ATS.'
            ]
        };
    }

    /**
     * 7. Alertas Estratégicos Contextuais (Auditoria de Lacunas no Currículo):
     * Analisa campos essenciais e omissões críticas dependendo da área
     * @param {object} resumeData 
     * @returns {Array<{id: string, type: 'critical'|'warning'|'info'|'success', title: string, description: string, targetSection: string, actionLabel: string}>}
     */
    function auditResumeGaps(resumeData) {
        const alerts = [];
        const role = (resumeData.objective || '').toLowerCase();

        // 1. Verificação de Dados Básicos
        if (!resumeData.name || !resumeData.name.trim()) {
            alerts.push({
                id: 'missing-name',
                type: 'critical',
                title: 'Nome Completo Ausente',
                description: 'O nome do candidato é o identificador principal no sistema ATS.',
                targetSection: 'name',
                actionLabel: 'Preencher Nome'
            });
        }

        if (!resumeData.email || !resumeData.phone1) {
            alerts.push({
                id: 'missing-contact',
                type: 'critical',
                title: 'Contatos Incompletos',
                description: 'Informe ao menos um e-mail válido e telefone com DDD para retorno dos recrutadores.',
                targetSection: 'phone1',
                actionLabel: 'Completar Contatos'
            });
        }

        // 2. Verificação de Objetivo
        if (!resumeData.objective || resumeData.objective.trim().length < 3) {
            alerts.push({
                id: 'missing-objective',
                type: 'critical',
                title: 'Objetivo Profissional Não Especificado',
                description: 'Sistemas ATS descartam currículos sem foco ou área definida.',
                targetSection: 'objective',
                actionLabel: 'Definir Objetivo'
            });
        }

        // 3. Verificação de Síntese
        if (!resumeData.qualificationSummary || resumeData.qualificationSummary.trim().length < 40) {
            alerts.push({
                id: 'missing-synthesis',
                type: 'warning',
                title: 'Síntese de Qualificações Curta ou Vazia',
                description: 'O resumo inicial é lido nos primeiros 6 segundos pelo recrutador. Use a IA para gerar.',
                targetSection: 'qualificationSummary',
                actionLabel: 'Gerar com IA'
            });
        }

        // 4. Verificação Contextual por Área
        const isTech = /dev|programad|software|front|back|full|web|sistemas|dados|python|java|tech|ti|cloud/i.test(role);
        const isAdm = /admin|auxiliar|assistente|financeir|contab|escrit[oó]rio|rotinas|gest[ãa]o/i.test(role);
        const isSales = /venda|comercial|atend|cliente|consultor|suporte|tele/i.test(role);

        if (isTech) {
            if (!resumeData.courses || resumeData.courses.length === 0) {
                alerts.push({
                    id: 'tech-courses-gap',
                    type: 'warning',
                    title: 'Falta de Cursos / Certificações Técnicas',
                    description: 'Na área de Tecnologia, cursos recentes (ex: Alura, Udemy, SENAC, Cloud) aumentam a pontuação ATS.',
                    targetSection: 'courses',
                    actionLabel: '+ Adicionar Curso'
                });
            }
            const totalHard = (resumeData.hardSkills || []).length + (resumeData.otherHardSkills ? resumeData.otherHardSkills.split(',').length : 0);
            if (totalHard < 3) {
                alerts.push({
                    id: 'tech-skills-gap',
                    type: 'critical',
                    title: 'Poucas Hard Skills Técnicas Selecionadas',
                    description: 'Vagas de TI requerem linguagens, frameworks, bancos de dados e ferramentas claras.',
                    targetSection: 'skills',
                    actionLabel: 'Sugerir Skills'
                });
            }
        } else if (isAdm) {
            const hasOffice = (resumeData.hardSkills || []).some(s => /office|planilha|erp/i.test(s));
            if (!hasOffice && (!resumeData.otherHardSkills || !/excel|planilha|office/i.test(resumeData.otherHardSkills))) {
                alerts.push({
                    id: 'adm-excel-gap',
                    type: 'warning',
                    title: 'Destaque de Pacote Office / Planilhas Ausente',
                    description: 'Para cargos administrativos, domínio de Excel/Planilhas e ERP é requisito eliminatório.',
                    targetSection: 'skills',
                    actionLabel: 'Adicionar Excel / ERP'
                });
            }
        } else if (isSales) {
            const hasComm = (resumeData.softSkills || []).some(s => /comunica|escuta|equipe/i.test(s));
            if (!hasComm) {
                alerts.push({
                    id: 'sales-soft-gap',
                    type: 'warning',
                    title: 'Soft Skills de Comunicação Não Destacadas',
                    description: 'Áreas comerciais exigem destaque para comunicação clara, negociação e escuta ativa.',
                    targetSection: 'skills',
                    actionLabel: 'Marcar Soft Skills'
                });
            }
        }

        // 5. Verificação de Experiências
        if (resumeData.experience && resumeData.experience.length > 0) {
            const hasShortDesc = resumeData.experience.some(e => !e.description || e.description.trim().length < 30);
            if (hasShortDesc) {
                alerts.push({
                    id: 'short-exp-desc',
                    type: 'info',
                    title: 'Descrições de Atividades Simples',
                    description: 'Atividades com menos de 2 linhas reduzem o ranqueamento. Experimente o botão "Melhorar com IA (STAR)".',
                    targetSection: 'experience',
                    actionLabel: 'Otimizar com STAR'
                });
            }
        }

        if (alerts.length === 0) {
            alerts.push({
                id: 'all-good',
                type: 'success',
                title: 'Excelente Estrutura de Currículo!',
                description: 'Todos os campos essenciais estão preenchidos e alinhados com as melhores práticas de mercado.',
                targetSection: 'all',
                actionLabel: 'Pronto para Enviar'
            });
        }

        return alerts;
    }

    
    /**
     * 8. Tradução de Todo o Currículo com IA (Inglês, Espanhol ou Português)
     */
    async function translateResume(resumeData, targetLang = 'en') {
        let langName = 'Inglês (English)';
        if (targetLang === 'es') langName = 'Espanhol (Spanish)';
        else if (targetLang === 'pt') langName = 'Português (Brasil)';
        
        if (!hasApiKey()) {
            return translateResumeFallback(resumeData, targetLang);
        }

        const systemInstruction = `Você é um tradutor executivo sênior especializado em currículos profissionais (Resumes/CVs) e mercado de trabalho internacional e brasileiro.
Traduza e adapte todos os campos fornecidos para ${langName}, mantendo termos técnicos, cargos, jargões e metodologias com o vocabulário mais natural e respeitado no mercado corporativo.

Retorne ESTRITAMENTE o mesmo formato JSON de entrada traduzido:
{
  "name": "Nome",
  "birthplace": "Naturalidade",
  "maritalStatus": "Estado Civil",
  "age": "25",
  "neighborhood": "Bairro",
  "city": "Cidade / City",
  "state": "Estado / State",
  "phone1": "Telefone",
  "phone2": "Telefone 2",
  "email": "Email",
  "license": "CNH",
  "objective": "Objetivo / Target Job Title",
  "qualificationSummary": "Resumo / Professional Summary",
  "education": [
    {
      "level": "Nível / Degree",
      "course": "Curso / Course",
      "institution": "Instituição",
      "status": "Status",
      "year": "2024",
      "shift": "Turno / Shift"
    }
  ],
  "experience": [
    {
      "position": "Cargo / Position",
      "company": "Empresa",
      "period": "Período / Period",
      "description": "Atividades e conquistas traduzidas"
    }
  ],
  "courses": [
    {
      "name": "Nome do Curso",
      "institution": "Instituição",
      "hours": "40h",
      "year": "2024"
    }
  ],
  "hardSkills": ["Habilidade 1", "Habilidade 2"],
  "softSkills": ["Soft Skill 1", "Soft Skill 2"],
  "otherHardSkills": "Outras hard skills traduzidas",
  "otherSoftSkills": "Outras soft skills traduzidas",
  "additionalInfo": "Informações adicionais traduzidas"
}`;

        const prompt = `Traduza os seguintes dados de currículo para ${langName}:\n\n${JSON.stringify(resumeData, null, 2)}`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            const parsed = parseJSONResponse(raw);
            return parsed;
        } catch (error) {
            console.warn('Erro ao traduzir com Gemini, usando fallback:', error);
            return translateResumeFallback(resumeData, targetLang);
        }
    }

    function translateResumeFallback(data, targetLang = 'en') {
        const isEs = targetLang === 'es';
        const isPt = targetLang === 'pt';
        const copy = JSON.parse(JSON.stringify(data));

        function cleanRoleTitle(text) {
            if (!text) return '';
            let cleaned = text;
            cleaned = cleaned
                .replace(/(?:Career opportunity in|Oportunidad profesional en el [áa]rea de|Oportunidade profissional na [áa]rea de|Oportunidade na [áa]rea de|Professional in|Profesional en|Profissional na [áa]rea de|Atua[çc][ãa]o estrat[ée]gica como|Oportunidade profissional como)\s*/gi, '')
                .replace(/,\s*contribuindo para os resultados.*$/i, '')
                .replace(/\.+$/, '')
                .trim();
            return cleaned;
        }

        function cleanAdditionalInfo(text) {
            if (!text) return '';
            let cleaned = text;
            cleaned = cleaned
                .replace(/(?:Languages and complementary qualifications|Idiomas y competencias complementarias|Informa[çc][õo]es complementares|Idiomas e qualifica[çc][õo]es complementares)\s*:\s*/gi, '')
                .replace(/(?:\.?\s*(?:Immediate availability|Disponibilidad inmediata|Disponibilidade imediata)\.?)+/gi, '')
                .trim();
            return cleaned;
        }

        // Dicionário de termos comuns (Bidirecional PT <-> EN / ES)
        const dictionary = {
            roles: {
                'desarrollador web': isPt ? 'Desenvolvedor Web' : (isEs ? 'Desarrollador Web' : 'Web Developer'),
                'desarrollador de software': isPt ? 'Desenvolvedor de Software' : (isEs ? 'Desarrollador de Software' : 'Software Developer'),
                'desarrollador': isPt ? 'Desenvolvedor de Software' : (isEs ? 'Desarrollador de Software' : 'Software Developer'),
                'desenvolvedor web': isPt ? 'Desenvolvedor Web' : (isEs ? 'Desarrollador Web' : 'Web Developer'),
                'desenvolvedor': isPt ? 'Desenvolvedor de Software' : (isEs ? 'Desarrollador de Software' : 'Software Developer'),
                'software developer': isPt ? 'Desenvolvedor de Software' : (isEs ? 'Desarrollador de Software' : 'Software Developer'),
                'software engineer': isPt ? 'Engenheiro de Software' : (isEs ? 'Ingeniero de Software' : 'Software Engineer'),
                'web developer': isPt ? 'Desenvolvedor Web' : (isEs ? 'Desarrollador Web' : 'Web Developer'),
                'programador': isPt ? 'Programador' : (isEs ? 'Programador' : 'Software Programmer'),
                'asistente administrativo': isPt ? 'Assistente Administrativo' : (isEs ? 'Asistente Administrativo' : 'Administrative Assistant'),
                'assistente administrativo': isPt ? 'Assistente Administrativo' : (isEs ? 'Asistente Administrativo' : 'Administrative Assistant'),
                'administrative assistant': isPt ? 'Assistente Administrativo' : (isEs ? 'Asistente Administrativo' : 'Administrative Assistant'),
                'auxiliar administrativo': isPt ? 'Auxiliar Administrativo' : (isEs ? 'Auxiliar Administrativo' : 'Administrative Clerk'),
                'administrative clerk': isPt ? 'Auxiliar Administrativo' : (isEs ? 'Auxiliar Administrativo' : 'Administrative Clerk'),
                'vendedor': isPt ? 'Vendedor(a)' : (isEs ? 'Vendedor / Ejecutivo Comercial' : 'Sales Representative'),
                'sales representative': isPt ? 'Vendedor(a)' : (isEs ? 'Vendedor / Ejecutivo Comercial' : 'Sales Representative'),
                'atendente': isPt ? 'Atendente de Relacionamento' : (isEs ? 'Atención al Cliente' : 'Customer Service Specialist'),
                'customer service': isPt ? 'Atendente de Relacionamento' : (isEs ? 'Atención al Cliente' : 'Customer Service Specialist'),
                'recepcionista': isPt ? 'Recepcionista' : (isEs ? 'Recepcionista' : 'Receptionist'),
                'receptionist': isPt ? 'Recepcionista' : (isEs ? 'Recepcionista' : 'Receptionist'),
                'pasante': isPt ? 'Estagiário' : (isEs ? 'Pasante / Practicante' : 'Intern'),
                'practicante': isPt ? 'Estagiário' : (isEs ? 'Pasante / Practicante' : 'Intern'),
                'estagiário': isPt ? 'Estagiário' : (isEs ? 'Pasante / Practicante' : 'Intern'),
                'estagiario': isPt ? 'Estagiário' : (isEs ? 'Pasante / Practicante' : 'Intern'),
                'intern': isPt ? 'Estagiário' : (isEs ? 'Pasante / Practicante' : 'Intern'),
                'gerente': isPt ? 'Gerente' : (isEs ? 'Gerente / Manager' : 'Manager'),
                'manager': isPt ? 'Gerente' : (isEs ? 'Gerente / Manager' : 'Manager'),
                'analista': isPt ? 'Analista' : (isEs ? 'Analista' : 'Analyst'),
                'analyst': isPt ? 'Analista' : (isEs ? 'Analista' : 'Analyst'),
                'designer': isPt ? 'Designer' : (isEs ? 'Diseñador' : 'Designer'),
                'diseñador': isPt ? 'Designer' : (isEs ? 'Diseñador' : 'Designer'),
                'auxiliar': isPt ? 'Auxiliar' : (isEs ? 'Auxiliar' : 'Assistant')
            },
            degrees: {
                'ciência da computação': isPt ? 'Ciência da Computação' : (isEs ? 'Licenciatura en Ciencias de la Computación' : 'Bachelor of Science in Computer Science'),
                'computer science': isPt ? 'Ciência da Computação' : (isEs ? 'Licenciatura en Ciencias de la Computación' : 'Bachelor of Science in Computer Science'),
                'administração': isPt ? 'Administração de Empresas' : (isEs ? 'Administración de Empresas' : 'Business Administration'),
                'business administration': isPt ? 'Administração de Empresas' : (isEs ? 'Administración de Empresas' : 'Business Administration'),
                'engenharia': isPt ? 'Engenharia' : (isEs ? 'Ingeniería' : 'Engineering'),
                'direito': isPt ? 'Direito' : (isEs ? 'Derecho' : 'Law'),
                'enfermagem': isPt ? 'Enfermagem' : (isEs ? 'Enfermería' : 'Nursing'),
                'ensino médio': isPt ? 'Ensino Médio' : (isEs ? 'Educación Secundaria' : 'High School Diploma'),
                'high school': isPt ? 'Ensino Médio' : (isEs ? 'Educación Secundaria' : 'High School Diploma'),
                'ensino superior': isPt ? 'Ensino Superior' : (isEs ? 'Educación Superior' : 'Higher Education')
            },
            skills: {
                'programação': isPt ? 'Programação de Software' : (isEs ? 'Programación' : 'Software Programming'),
                'análise de dados': isPt ? 'Análise de Dados' : (isEs ? 'Análisis de datos' : 'Data Analysis'),
                'data analysis': isPt ? 'Análise de Dados' : (isEs ? 'Análisis de datos' : 'Data Analysis'),
                'pacote office': isPt ? 'Pacote Microsoft Office' : (isEs ? 'Paquete Microsoft Office' : 'Microsoft Office Suite'),
                'microsoft office': isPt ? 'Pacote Microsoft Office' : (isEs ? 'Paquete Microsoft Office' : 'Microsoft Office Suite'),
                'controle de planilhas e dados': isPt ? 'Gestão de Planilhas e Dados' : (isEs ? 'Gestión de hojas de cálculo' : 'Spreadsheet & Data Management'),
                'trabalho em equipe': isPt ? 'Trabalho em Equipe' : (isEs ? 'Trabajo en equipo' : 'Teamwork & Collaboration'),
                'teamwork': isPt ? 'Trabalho em Equipe' : (isEs ? 'Trabajo en equipo' : 'Teamwork & Collaboration'),
                'adaptabilidade': isPt ? 'Adaptabilidade e Resiliência' : (isEs ? 'Adaptabilidad' : 'Adaptability & Resilience'),
                'comunicação clara': isPt ? 'Comunicação Clara e Assertiva' : (isEs ? 'Comunicación asertiva' : 'Clear Communication'),
                'escuta ativa': isPt ? 'Escuta Ativa' : (isEs ? 'Escucha activa' : 'Active Listening'),
                'criatividade': isPt ? 'Criatividade' : (isEs ? 'Creatividad' : 'Creativity'),
                'inovação': isPt ? 'Inovação' : (isEs ? 'Innovación' : 'Innovation'),
                'visão de melhoria contínua': isPt ? 'Visão de Melhoria Contínua' : (isEs ? 'Mejora continua' : 'Continuous Improvement Mindset'),
                'organização': isPt ? 'Organização e Planejamento' : (isEs ? 'Organización' : 'Organization & Planning'),
                'comprometimento': isPt ? 'Comprometimento e Responsabilidade' : (isEs ? 'Compromiso' : 'Commitment & Ownership')
            }
        };

        function translatePhrase(phrase, category) {
            if (!phrase) return '';
            const lower = phrase.toLowerCase().trim();
            const dict = dictionary[category] || {};
            for (let [k, v] of Object.entries(dict)) {
                if (lower.includes(k)) return v;
            }
            return phrase;
        }

        // Marital Status
        if (copy.maritalStatus) {
            const msLower = copy.maritalStatus.toLowerCase();
            if (msLower.includes('solteir') || msLower.includes('singl')) copy.maritalStatus = isPt ? 'Solteiro(a)' : (isEs ? 'Soltero(a)' : 'Single');
            else if (msLower.includes('casad') || msLower.includes('marr')) copy.maritalStatus = isPt ? 'Casado(a)' : (isEs ? 'Casado(a)' : 'Married');
            else if (msLower.includes('divorc')) copy.maritalStatus = isPt ? 'Divorciado(a)' : (isEs ? 'Divorciado(a)' : 'Divorced');
            else if (msLower.includes('viuv') || msLower.includes('viúv') || msLower.includes('wido')) copy.maritalStatus = isPt ? 'Viúvo(a)' : (isEs ? 'Viudo(a)' : 'Widowed');
            else if (msLower.includes('uni') || msLower.includes('civil')) copy.maritalStatus = isPt ? 'União Estável' : (isEs ? 'Unión Libre' : 'Civil Union');
        }

        // Objective
        if (copy.objective) {
            const rawRole = cleanRoleTitle(copy.objective);
            const translatedRole = translatePhrase(rawRole, 'roles') || rawRole;
            if (isEs) {
                copy.objective = `Oportunidad profesional en el área de ${translatedRole}`;
            } else if (isPt) {
                copy.objective = `Oportunidade profissional na área de ${translatedRole}`;
            } else {
                copy.objective = `Career opportunity in ${translatedRole}`;
            }
        }

        // Summary
        if (copy.qualificationSummary) {
            const rawRole = cleanRoleTitle(copy.objective);
            const role = translatePhrase(rawRole, 'roles') || rawRole || (isEs ? 'mi especialidad' : (isPt ? 'minha área de atuação' : 'my specialty'));
            if (isEs) {
                copy.qualificationSummary = `Profesional calificado y proactivo con sólida trayectoria en ${role}. Enfoque en la consecución de objetivos estratégicos, alta capacidad analítica, resolución de problemas y colaboración continua con equipos multidisciplinarios.`;
            } else if (isPt) {
                copy.qualificationSummary = `Profissional qualificado e comprometido com atuação na área de ${role}. Focado em alcançar excelência operacional, melhoria contínua de processos, colaboração multidisciplinar e atingimento de metas.`;
            } else {
                copy.qualificationSummary = `Qualified, results-driven professional with proven expertise in ${role}. Dedicated to achieving operational excellence, continuous improvement, cross-functional collaboration, and exceeding corporate benchmarks.`;
            }
        }

        // Education
        if (Array.isArray(copy.education)) {
            copy.education.forEach(e => {
                if (e.course) e.course = translatePhrase(e.course, 'degrees') || e.course;
                if (e.status) {
                    if (/conclu|graduat/i.test(e.status)) e.status = isPt ? 'Concluído' : (isEs ? 'Completado' : 'Graduated');
                    else if (/curs|ongo|prog/i.test(e.status)) e.status = isPt ? 'Em andamento' : (isEs ? 'En curso' : 'Ongoing');
                    else if (/tranc|incomp/i.test(e.status)) e.status = isPt ? 'Incompleto' : (isEs ? 'Incompleto' : 'Incomplete');
                }
                if (e.level) {
                    if (/superior|bachelor/i.test(e.level)) e.level = isPt ? 'Ensino Superior' : (isEs ? 'Educación Superior' : "Bachelor's Degree");
                    else if (/médio|medio|high school/i.test(e.level)) e.level = isPt ? 'Ensino Médio' : (isEs ? 'Educación Secundaria' : 'High School');
                    else if (/técnico|tecnico|technic/i.test(e.level)) e.level = isPt ? 'Curso Técnico' : (isEs ? 'Técnico' : 'Technical Degree');
                    else if (/pós|pos|especializ|postgrad/i.test(e.level)) e.level = isPt ? 'Pós-Graduação' : (isEs ? 'Posgrado' : 'Postgraduate');
                }
                if (e.shift) {
                    if (/manh|matut|morn/i.test(e.shift)) e.shift = isPt ? 'Matutino' : (isEs ? 'Matutino' : 'Morning');
                    else if (/noit|notur|even/i.test(e.shift)) e.shift = isPt ? 'Noturno' : (isEs ? 'Nocturno' : 'Evening');
                    else if (/tard|vesp|after/i.test(e.shift)) e.shift = isPt ? 'Vespertino' : (isEs ? 'Vespertino' : 'Afternoon');
                    else if (/ead|dist|remot|online/i.test(e.shift)) e.shift = isPt ? 'EAD / A Distância' : (isEs ? 'A distancia / Virtual' : 'Remote / Online');
                }
            });
        }

        // Experience
        if (Array.isArray(copy.experience)) {
            copy.experience.forEach(exp => {
                if (exp.position) {
                    exp.position = translatePhrase(exp.position, 'roles') || exp.position;
                }
                if (exp.period) {
                    if (isPt) {
                        exp.period = exp.period.replace(/present|presente/gi, 'Atual').replace(/to|hasta/gi, 'até');
                    } else if (isEs) {
                        exp.period = exp.period.replace(/atual|present/gi, 'Presente').replace(/até|to/gi, 'hasta');
                    } else {
                        exp.period = exp.period.replace(/atual|presente/gi, 'Present').replace(/até|hasta/gi, 'to');
                    }
                }
                if (exp.description) {
                    const cleanDesc = exp.description.replace(/^[•\s-]+/, '').trim();
                    if (isEs) {
                        exp.description = `• Responsable de la ejecución estratégica y operativa en ${exp.position || 'el departamento'}.\n• ${cleanDesc}.\n• Compromiso con estándares de calidad, cumplimiento de metas y mejora continua.`;
                    } else if (isPt) {
                        exp.description = `• Atuação estratégica e operacional na função de ${exp.position || 'especialista'}.\n• ${cleanDesc}.\n• Foco em garantia de qualidade, colaboração em equipe e alcance de resultados.`;
                    } else {
                        exp.description = `• Led strategic and operational activities as ${exp.position || 'specialist'}.\n• ${cleanDesc}.\n• Ensured compliance with high quality standards, team collaboration, and key performance goals.`;
                    }
                }
            });
        }

        // Courses
        if (Array.isArray(copy.courses)) {
            copy.courses.forEach(c => {
                if (c.name) c.name = translatePhrase(c.name, 'degrees') || c.name;
            });
        }

        // Hard & Soft Skills
        if (Array.isArray(copy.hardSkills)) {
            copy.hardSkills = copy.hardSkills.map(s => translatePhrase(s, 'skills') || s);
        }
        if (Array.isArray(copy.softSkills)) {
            copy.softSkills = copy.softSkills.map(s => translatePhrase(s, 'skills') || s);
        }

        // Additional Info
        if (copy.additionalInfo) {
            const cleanedAdd = cleanAdditionalInfo(copy.additionalInfo);
            if (cleanedAdd) {
                if (isEs) {
                    copy.additionalInfo = `Idiomas y competencias complementarias: ${cleanedAdd}. Disponibilidad inmediata.`;
                } else if (isPt) {
                    copy.additionalInfo = `Informações complementares: ${cleanedAdd}. Disponibilidade imediata.`;
                } else {
                    copy.additionalInfo = `Languages and complementary qualifications: ${cleanedAdd}. Immediate availability.`;
                }
            }
        }

        return copy;
    }

    /**
     * 9. Geração de Carta de Apresentação (Cover Letter) com IA
     */
    async function generateCoverLetter(resumeData, options = {}) {
        const companyName = options.companyName || 'Empresa Contratante';
        const tone = options.tone || 'modern';
        const jobDesc = options.jobDescription || '';

        if (!hasApiKey()) {
            return generateCoverLetterFallback(resumeData, options);
        }

        const systemInstruction = `Você é um consultor executivo de carreira e especialista em redação de cartas de apresentação (Cover Letters) de altíssimo impacto para processos seletivos.
Redija uma carta de apresentação em português, estruturada em 3 a 4 parágrafos:
1. Saudação cordial e apresentação imediata do objetivo profissional e entusiasmo pela oportunidade na empresa "${companyName}".
2. Conexão das principais qualificações, experiências e resultados obtidos pelo candidato com os requisitos da vaga.
3. Competências comportamentais (Soft Skills) e valor agregado que o candidato levará para o time.
4. Fechamento formal, agradecimento e disponibilidade para entrevista.

Tom solicitado: ${tone === 'executive' ? 'Executivo, formal e orientado a métricas/liderança' : tone === 'technical' ? 'Técnico, focado em ferramentas, metodologias e resolução de problemas' : 'Moderno, motivado, dinâmico e inovador'}.

Retorne apenas o texto da carta, pronto para envio.`;

        const prompt = `Dados do Candidato:
Nome: ${resumeData.name || 'Candidato'}
Cargo/Objetivo: ${resumeData.objective || 'Profissional'}
Síntese: ${resumeData.qualificationSummary || ''}
Experiências: ${JSON.stringify(resumeData.experience || [])}
Hard Skills: ${resumeData.otherHardSkills || ''}
Empresa: ${companyName}
Descrição da Vaga: ${jobDesc || 'Vaga alinhada com o perfil do candidato.'}`;

        try {
            const raw = await callGemini(prompt, systemInstruction);
            return raw.trim();
        } catch (error) {
            console.warn('Erro ao gerar carta com Gemini, usando fallback:', error);
            return generateCoverLetterFallback(resumeData, options);
        }
    }

    function generateCoverLetterFallback(resumeData, options = {}) {
        const name = resumeData.name || 'Prezado(a) Recrutador(a)';
        const role = resumeData.objective || 'na sua equipe';
        const company = options.companyName || 'sua conceituada empresa';
        const expSummary = (resumeData.experience && resumeData.experience[0]) 
            ? `minha atuação recente como ${resumeData.experience[0].position} na ${resumeData.experience[0].company}` 
            : 'minha sólida formação e dedicação profissional';

        return `Prezada Equipe de Recursos Humanos da ${company},

Gostaria de apresentar minha candidatura para a oportunidade de ${role}. Acompanho com admiração o trabalho desenvolvido pela empresa e acredito que minha trajetória e competências estão fortemente alinhadas com as metas e valores da organização.

Ao longo do meu desenvolvimento profissional, destaquei-me por ${expSummary}, onde desenvolvi forte capacidade de resolução de problemas, organização e trabalho em equipe. Minha bagagem contempla conhecimentos práticos que me permitem contribuir de forma rápida e assertiva com os desafios do setor.

Além do domínio técnico, priorizo uma comunicação clara, adaptabilidade diante de novos cenários e foco constante em melhoria contínua e resultados de excelência.

Estou à disposição para uma entrevista e aprofundar como posso agregar valor aos projetos da ${company}. Agradeço desde já pela atenção e oportunidade.

Atenciosamente,
${resumeData.name || ''}
${resumeData.phone1 || ''} | ${resumeData.email || ''}`;
    }

    return {
        getApiKey,
        setApiKey,
        hasApiKey,
        STANDARD_HARD_SKILLS,
        STANDARD_SOFT_SKILLS,
        generateSynthesisOptions,
        improveExperienceDescription,
        reviewGrammarAndTone,
        parseResumeText,
        suggestSkillsForRole,
        analyzeJobCompatibility,
        auditResumeGaps,
        translateResume,
        generateCoverLetter
    };
})();

// Disponibilizar globalmente
window.AIService = AIService;
