/**
 * Módulo para gerenciar os manipuladores de formulário e interações do usuário com IA
 */
const FormHandlers = (function() {
    // Referência para o item de experiência sendo editado atualmente pela IA
    let activeExperienceTextarea = null;
    let currentReviewSuggestions = [];
    let parsedImportData = null;
    let activeSuggestedSkills = { hard: [], soft: [] };
    let lastAtsAnalysisData = null;

    /**
     * Função auxiliar para escapar caracteres HTML prevenindo erros e XSS
     */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Inicializa todos os manipuladores de eventos do formulário
     */
    function initializeFormHandlers() {
        // Botões de adicionar itens
        document.getElementById('addEducation').addEventListener('click', function() {
            createEducationItem();
        });
        
        document.getElementById('addExperience').addEventListener('click', function() {
            createExperienceItem();
        });
        
        document.getElementById('addCourse').addEventListener('click', function() {
            createCourseItem();
        });
        
        // Botões de remover para itens iniciais
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', handleRemoveItem);
        });

        // Botões de melhoria de experiência iniciais
        document.querySelectorAll('.btn-improve-exp').forEach(button => {
            button.addEventListener('click', handleOpenExperienceAi);
        });
        
        // Inicializar modais de IA e clássicos
        initializeClassicSynthesisModal();
        initializeAiSynthesisModal();
        initializeAiExperienceModal();
        initializeAiReviewModal();
        initializeAiSettingsModal();
        initializeAiImportModal();
        initializeSkillSuggestions();
        initializeAiAtsModal();
        initializeResumeHealthBanner();
        initializeSkillExplainerModal();
        initializeCustomSkillAdders();
        initializeSkillCategoryFilters();
        initializeAiTranslateModal();
        initializeAiCoverLetterModal();
        initializePreviewToolbar();
        initializeMobileTabs();
        initializeFormAccordions();
        initializeMobileQuickActions();
        
        // Botão de limpar
        document.getElementById('clearBtn').addEventListener('click', function(e) {
            if (confirm('Tem certeza que deseja limpar o formulário? Todos os dados não salvos serão perdidos.')) {
                setTimeout(() => {
                    if (typeof RealtimePreview !== 'undefined') {
                        RealtimePreview.updateFullPreview();
                    }
                }, 100);
                return true;
            }
            e.preventDefault();
        });

        // Atualizar indicador de status de IA no cabeçalho
        updateAiHeaderStatus();
    }

    /**
     * Atualiza o visual do botão de status da IA no cabeçalho
     */
    function updateAiHeaderStatus() {
        const statusText = document.getElementById('aiStatusText');
        const configBtn = document.getElementById('openAiSettingsBtn');
        if (!statusText || !configBtn) return;

        if (AIService.hasApiKey()) {
            statusText.textContent = 'IA Ativa (Gemini Conectado)';
            configBtn.classList.add('ai-active');
        } else {
            statusText.textContent = 'Configurar IA (Gemini)';
            configBtn.classList.remove('ai-active');
        }
    }

    /**
     * Inicializa o modal clássico de síntese de qualificações (Exemplos)
     */
    function initializeClassicSynthesisModal() {
        const modal = document.getElementById('synthesisModal');
        const generateSynthesisBtn = document.getElementById('generateSynthesis');
        const closeBtn = document.querySelector('.close-synthesis-classic');
        
        if (generateSynthesisBtn && modal) {
            generateSynthesisBtn.addEventListener('click', function() {
                modal.style.display = 'block';
            });
        }
        
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
        
        // Usar exemplo de síntese
        document.querySelectorAll('.use-example').forEach(button => {
            button.addEventListener('click', function() {
                const exampleNum = this.getAttribute('data-example');
                let synthesisText = '';
                
                if (exampleNum === '1') {
                    synthesisText = 'Estudante do curso Técnico em Recursos Humanos pelo Senac, com experiência em atividades administrativas e atendimento ao público. Possui domínio básico de informática e se destaca pela comunicação, organização e facilidade em aprender novas tarefas. Demonstra responsabilidade e bom relacionamento interpessoal.';
                } else if (exampleNum === '2') {
                    synthesisText = 'Estudante do curso Técnico em Administração, com conhecimentos básicos em informática e rotinas administrativas. É comunicativo, proativo e comprometido, demonstrando interesse em desenvolver novas habilidades e contribuir para o crescimento da equipe e da organização.';
                }
                
                applySynthesisText(synthesisText);
                modal.style.display = 'none';
            });
        });
        
        // Gerar síntese personalizada
        const customBtn = document.getElementById('generateCustomSynthesis');
        if (customBtn) {
            customBtn.addEventListener('click', function() {
                const selectedHardSkills = [];
                document.querySelectorAll('.modal-hard-skill:checked').forEach(cb => selectedHardSkills.push(cb.value));
                
                const selectedSoftSkills = [];
                document.querySelectorAll('.modal-soft-skill:checked').forEach(cb => selectedSoftSkills.push(cb.value));
                
                if (selectedHardSkills.length < 1 || selectedSoftSkills.length < 1) {
                    alert('Por favor, selecione pelo menos uma hard skill e uma soft skill.');
                    return;
                }
                
                const hardSkills = selectedHardSkills.slice(0, 5);
                const softSkills = selectedSoftSkills.slice(0, 5);
                
                const educationLevel = document.querySelector('.education-level')?.value || '';
                const course = document.querySelector('.education-course')?.value || '';
                const institution = document.querySelector('.institution')?.value || '';
                
                let synthesisText = '';
                if (educationLevel && course && institution) {
                    synthesisText += `Estudante do curso ${educationLevel} em ${course} pelo(a) ${institution}, `;
                } else {
                    synthesisText += 'Profissional ';
                }
                
                synthesisText += `com conhecimentos em ${formatSkillsList(hardSkills)}. `;
                synthesisText += `Destaca-se por ${formatSkillsList(softSkills)}, `;
                synthesisText += 'demonstrando interesse em se desenvolver profissionalmente e contribuir para o crescimento da organização.';
                
                applySynthesisText(synthesisText);
                modal.style.display = 'none';
            });
        }
    }

    /**
     * Inicializa o modal de Síntese Inteligente com IA (3 Opções: Executivo, Técnico, Criativo)
     */
    function initializeAiSynthesisModal() {
        const modal = document.getElementById('aiSynthesisModal');
        const openBtn = document.getElementById('aiGenerateSynthesisBtn');
        const closeBtn = document.querySelector('.close-ai-synthesis');
        const regenBtn = document.getElementById('btnRegenerateSynthesis');
        
        if (openBtn && modal) {
            openBtn.addEventListener('click', function() {
                modal.style.display = 'block';
                runAiSynthesis();
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }

        if (regenBtn) {
            regenBtn.addEventListener('click', function() {
                runAiSynthesis();
            });
        }

        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });

        document.querySelectorAll('.btn-use-ai-synthesis').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                let text = '';
                if (type === 'executive') text = document.getElementById('textExecutive').textContent;
                if (type === 'technical') text = document.getElementById('textTechnical').textContent;
                if (type === 'creative') text = document.getElementById('textCreative').textContent;

                if (text && text.trim() && !text.includes('Clique em gerar')) {
                    applySynthesisText(text);
                    modal.style.display = 'none';
                    window.showNotification('Síntese de qualificações aplicada com sucesso!', 'success');
                }
            });
        });
    }

    /**
     * Executa a chamada do gerador de síntese de IA
     */
    async function runAiSynthesis() {
        const loading = document.getElementById('aiSynthesisLoading');
        const cards = document.getElementById('aiSynthesisCards');
        const textExecutive = document.getElementById('textExecutive');
        const textTechnical = document.getElementById('textTechnical');
        const textCreative = document.getElementById('textCreative');

        loading.style.display = 'block';
        cards.style.opacity = '0.4';

        const resumeData = DataStorage.getFormDataSnapshot();

        try {
            const options = await AIService.generateSynthesisOptions(resumeData);
            textExecutive.textContent = options.executive;
            textTechnical.textContent = options.technical;
            textCreative.textContent = options.creative;

            if (options._warning) {
                window.showNotification(`Aviso: ${options._warning}. Modo inteligente offline utilizado.`, 'info');
            }
        } catch (error) {
            console.error('Erro ao gerar síntese:', error);
            window.showNotification(`Erro: ${error.message}`, 'error');
        } finally {
            loading.style.display = 'none';
            cards.style.opacity = '1';
        }
    }

    /**
     * Aplica um texto no campo de síntese e dispara eventos de atualização
     */
    function applySynthesisText(text) {
        const summaryInput = document.getElementById('qualificationSummary');
        summaryInput.value = text;
        summaryInput.dispatchEvent(new Event('input', { bubbles: true }));

        const previewElem = document.getElementById('preview-qualification-summary');
        if (previewElem) {
            previewElem.textContent = text;
        }
    }

    /**
     * Inicializa o modal de Aprimoramento de Experiência com Metodologia STAR
     */
    function initializeAiExperienceModal() {
        const modal = document.getElementById('aiExperienceModal');
        const closeBtn = document.querySelector('.close-ai-exp');
        const cancelBtn = document.querySelector('.close-ai-exp-btn');
        const applyBtn = document.getElementById('btnApplyExpAi');

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        window.addEventListener('click', function(event) {
            if (event.target == modal) modal.style.display = 'none';
        });

        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                const improvedText = document.getElementById('expImprovedText').value;
                if (activeExperienceTextarea && improvedText) {
                    activeExperienceTextarea.value = improvedText;
                    activeExperienceTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    if (typeof RealtimePreview !== 'undefined') {
                        RealtimePreview.updateFullPreview();
                    }

                    modal.style.display = 'none';
                    window.showNotification('Descrição da experiência atualizada com sucesso!', 'success');
                }
            });
        }
    }

    /**
     * Manipulador para abrir o aprimoramento de experiência via IA
     */
    async function handleOpenExperienceAi(e) {
        const btn = e.currentTarget;
        const item = btn.closest('.experience-item');
        if (!item) return;

        const position = item.querySelector('.position')?.value || '';
        const company = item.querySelector('.company')?.value || '';
        const descTextarea = item.querySelector('.job-description');

        activeExperienceTextarea = descTextarea;
        const currentDesc = descTextarea ? descTextarea.value : '';

        const modal = document.getElementById('aiExperienceModal');
        const loading = document.getElementById('aiExpLoading');
        const content = document.getElementById('aiExpContent');
        const origBox = document.getElementById('expOriginalText');
        const impTextarea = document.getElementById('expImprovedText');
        const expExplanation = document.getElementById('expExplanation');

        origBox.textContent = currentDesc || '(Nenhuma descrição preenchida no momento)';
        impTextarea.value = '';
        expExplanation.textContent = '';

        modal.style.display = 'block';
        loading.style.display = 'block';
        content.style.display = 'none';

        try {
            const result = await AIService.improveExperienceDescription(position, company, currentDesc);
            impTextarea.value = result.improvedText;
            expExplanation.textContent = `💡 Metodologia STAR: ${result.methodologyExplanation}`;
        } catch (error) {
            console.error('Erro na melhoria de experiência:', error);
            window.showNotification(`Erro ao aprimorar texto: ${error.message}`, 'error');
        } finally {
            loading.style.display = 'none';
            content.style.display = 'grid';
        }
    }

    /**
     * Inicializa o modal de Revisão Ortográfica e de Tom Corporativo
     */
    function initializeAiReviewModal() {
        const modal = document.getElementById('aiReviewModal');
        const openBtn = document.getElementById('aiReviewBtn');
        const closeBtn = document.querySelector('.close-ai-review');
        const closeBtn2 = document.querySelector('.close-ai-review-btn');
        const applyAllBtn = document.getElementById('btnApplyAllReview');

        if (openBtn && modal) {
            openBtn.addEventListener('click', function() {
                modal.style.display = 'block';
                runAiReview();
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        if (closeBtn2 && modal) {
            closeBtn2.addEventListener('click', () => modal.style.display = 'none');
        }

        window.addEventListener('click', function(event) {
            if (event.target == modal) modal.style.display = 'none';
        });

        if (applyAllBtn) {
            applyAllBtn.addEventListener('click', function() {
                applyAllReviewSuggestions();
                modal.style.display = 'none';
            });
        }
    }

    /**
     * Executa a análise completa de gramática e tom corporativo
     */
    async function runAiReview() {
        const loading = document.getElementById('aiReviewLoading');
        const list = document.getElementById('aiReviewList');
        const applyAllBtn = document.getElementById('btnApplyAllReview');

        loading.style.display = 'block';
        list.innerHTML = '';
        applyAllBtn.style.display = 'none';

        const resumeData = DataStorage.getFormDataSnapshot();

        try {
            const results = await AIService.reviewGrammarAndTone(resumeData);
            currentReviewSuggestions = results;

            if (results.length === 0) {
                list.innerHTML = `
                    <div class="ai-empty-state">
                        <p>Nenhum texto preenchido para revisar. Preencha seu objetivo, síntese ou experiências primeiro.</p>
                    </div>
                `;
                return;
            }

            applyAllBtn.style.display = 'inline-block';

            results.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'ai-review-item';
                card.innerHTML = `
                    <div class="review-header">
                        <h4>${escapeHtml(item.label || 'Campo')}</h4>
                        <span class="review-reason">✨ ${escapeHtml(item.reason || 'Melhoria sugerida')}</span>
                    </div>
                    <div class="review-comparison">
                        <div class="review-original">
                            <strong>Original:</strong>
                            <p>${escapeHtml(item.original || '')}</p>
                        </div>
                        <div class="review-improved">
                            <strong>Revisão Corporativa:</strong>
                            <p>${escapeHtml(item.improved || '')}</p>
                        </div>
                    </div>
                    <button type="button" class="btn-apply-single-review" data-index="${index}">
                        <span>✨</span> Aplicar esta correção
                    </button>
                `;
                list.appendChild(card);
            });

            list.querySelectorAll('.btn-apply-single-review').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = parseInt(this.getAttribute('data-index'), 10);
                    applySingleReviewSuggestion(currentReviewSuggestions[idx]);
                    this.disabled = true;
                    this.classList.add('applied');
                    this.innerHTML = '<span>✓</span> Aplicado';
                });
            });

        } catch (error) {
            console.error('Erro na revisão:', error);
            list.innerHTML = `<div class="error-msg" style="padding: 14px; background: #fee2e2; color: #991b1b; border-radius: 8px; font-size: 13px;">Erro na revisão: ${error.message}</div>`;
        } finally {
            loading.style.display = 'none';
        }
    }

    /**
     * Aplica uma única sugestão de revisão no campo correspondente
     */
    function applySingleReviewSuggestion(suggestion) {
        if (!suggestion) return;

        if (suggestion.key === 'objective') {
            const el = document.getElementById('objective');
            if (el) {
                el.value = suggestion.improved;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (suggestion.key === 'qualificationSummary') {
            applySynthesisText(suggestion.improved);
        } else if (suggestion.key === 'additionalInfo') {
            const el = document.getElementById('additionalInfo');
            if (el) {
                el.value = suggestion.improved;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else if (suggestion.key.startsWith('experience_')) {
            const expItems = document.querySelectorAll('.experience-item');
            const expIndex = suggestion.expIndex !== undefined ? suggestion.expIndex : parseInt(suggestion.key.split('_')[1], 10);
            if (expItems[expIndex]) {
                const desc = expItems[expIndex].querySelector('.job-description');
                if (desc) {
                    desc.value = suggestion.improved;
                    desc.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }

        if (typeof RealtimePreview !== 'undefined') {
            RealtimePreview.updateFullPreview();
        }
        window.showNotification(`Campo "${suggestion.label}" atualizado!`, 'success');
    }

    /**
     * Aplica todas as sugestões de revisão de uma vez
     */
    function applyAllReviewSuggestions() {
        if (!currentReviewSuggestions || currentReviewSuggestions.length === 0) return;

        currentReviewSuggestions.forEach(sugg => {
            applySingleReviewSuggestion(sugg);
        });

        window.showNotification('Todas as correções foram aplicadas ao currículo!', 'success');
    }

    /**
     * 2.1 Importação Inteligente (Resume Parsing):
     * Inicializa o modal, abas de upload/colagem e processamento de arquivos
     */
    function initializeAiImportModal() {
        const modal = document.getElementById('aiImportModal');
        const openBtn = document.getElementById('openAiImportBtn');
        const closeBtn = document.querySelector('.close-ai-import');
        const closeBtn2 = document.querySelector('.close-ai-import-btn');
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('resumeFileInput');
        const processPastedBtn = document.getElementById('btnProcessPastedText');
        const confirmHydrateBtn = document.getElementById('btnConfirmHydrateForm');

        if (openBtn && modal) {
            openBtn.addEventListener('click', function() {
                resetImportModal();
                modal.style.display = 'block';
            });
        }

        if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.style.display = 'none');
        if (closeBtn2 && modal) closeBtn2.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', function(event) {
            if (event.target == modal) modal.style.display = 'none';
        });

        // Alternância de Abas
        document.querySelectorAll('.import-tab-btn').forEach(tabBtn => {
            tabBtn.addEventListener('click', function() {
                document.querySelectorAll('.import-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.import-tab-pane').forEach(p => p.style.display = 'none');

                this.classList.add('active');
                const targetPane = document.getElementById(this.getAttribute('data-tab'));
                if (targetPane) targetPane.style.display = 'block';
            });
        });

        // Clique na dropzone para abrir seletor
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());

            // Drag and drop events
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.add('dragover');
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.remove('dragover');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                }
            });
        }

        // Botão para processar texto colado
        if (processPastedBtn) {
            processPastedBtn.addEventListener('click', function() {
                const text = document.getElementById('pasteResumeText').value.trim();
                if (!text) {
                    alert('Por favor, cole o texto do seu currículo ou LinkedIn.');
                    return;
                }
                processExtractedResumeText(text);
            });
        }

        // Botão para aplicar dados extraídos ao formulário
        if (confirmHydrateBtn) {
            confirmHydrateBtn.addEventListener('click', function() {
                if (parsedImportData) {
                    hydrateFormWithParsedData(parsedImportData);
                    modal.style.display = 'none';
                    window.showNotification('🎉 Currículo preenchido automaticamente pela IA!', 'success');
                }
            });
        }
    }

    function resetImportModal() {
        parsedImportData = null;
        const uploadStatus = document.getElementById('fileUploadStatus');
        const loading = document.getElementById('aiImportLoading');
        const preview = document.getElementById('aiImportPreview');
        const pasteText = document.getElementById('pasteResumeText');
        const fileInput = document.getElementById('resumeFileInput');

        if (uploadStatus) uploadStatus.style.display = 'none';
        if (loading) loading.style.display = 'none';
        if (preview) preview.style.display = 'none';
        if (pasteText) pasteText.value = '';
        if (fileInput) fileInput.value = '';
    }

    /**
     * Processa o arquivo selecionado (PDF, DOCX ou TXT)
     */
    async function handleFileUpload(file) {
        const loading = document.getElementById('aiImportLoading');
        const loadingText = document.getElementById('aiImportLoadingText');
        const uploadStatus = document.getElementById('fileUploadStatus');

        loading.style.display = 'block';
        loadingText.textContent = `Lendo arquivo "${file.name}"...`;
        uploadStatus.style.display = 'block';
        uploadStatus.innerHTML = `<span>Arquivo selecionado: <strong>${file.name}</strong> (${Math.round(file.size / 1024)} KB)</span>`;

        try {
            let extractedText = '';
            const fileExt = file.name.split('.').pop().toLowerCase();

            if (fileExt === 'pdf') {
                extractedText = await extractTextFromPDF(file);
            } else if (fileExt === 'docx') {
                extractedText = await extractTextFromDOCX(file);
            } else {
                extractedText = await file.text();
            }

            if (!extractedText || !extractedText.trim()) {
                throw new Error('Não foi possível extrair texto legível do arquivo enviado.');
            }

            loadingText.textContent = 'Mapeando dados e estruturando currículo com IA...';
            await processExtractedResumeText(extractedText);

        } catch (error) {
            console.error('Erro na extração do arquivo:', error);
            loading.style.display = 'none';
            alert(`Falha ao ler o arquivo: ${error.message}`);
        }
    }

    /**
     * Extrai texto de um PDF usando PDF.js com preservação fiel de linhas e estrutura
     */
    async function extractTextFromPDF(file) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('Biblioteca PDF.js não carregada.');
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY = null;
            let pageText = '';

            for (const item of textContent.items) {
                const str = item.str || '';
                const y = (item.transform && item.transform[5] !== undefined) ? item.transform[5] : null;

                if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
                    pageText += '\n';
                } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n') && str.trim()) {
                    pageText += ' ';
                }

                pageText += str;

                if (item.hasEOL) {
                    pageText += '\n';
                }

                if (y !== null) {
                    lastY = y;
                }
            }

            fullText += pageText + '\n\n';
        }

        return fullText;
    }

    /**
     * Extrai texto de um arquivo DOCX usando Mammoth.js
     */
    async function extractTextFromDOCX(file) {
        if (typeof mammoth === 'undefined') {
            throw new Error('Biblioteca Mammoth não carregada.');
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }

    /**
     * Envia o texto extraído para o AIService e renderiza o preview de confirmação
     */
    async function processExtractedResumeText(rawText) {
        const loading = document.getElementById('aiImportLoading');
        const preview = document.getElementById('aiImportPreview');
        const summaryCards = document.getElementById('aiImportSummaryCards');

        loading.style.display = 'block';
        preview.style.display = 'none';

        try {
            const parsed = await AIService.parseResumeText(rawText);
            parsedImportData = parsed;

            summaryCards.innerHTML = `
                <div class="summary-card">
                    <h4>👤 Dados Pessoais</h4>
                    <p><strong>Nome:</strong> ${parsed.name || 'Não identificado'}</p>
                    <p><strong>Email:</strong> ${parsed.email || 'Não identificado'}</p>
                    <p><strong>Telefone:</strong> ${parsed.phone1 || 'Não identificado'}</p>
                    <p><strong>Localização:</strong> ${[parsed.city, parsed.state].filter(Boolean).join(' - ') || 'Não identificado'}</p>
                </div>
                <div class="summary-card">
                    <h4>🎯 Objetivo & Síntese</h4>
                    <p><strong>Objetivo:</strong> ${parsed.objective || 'Profissional'}</p>
                    <p><strong>Síntese:</strong> ${parsed.qualificationSummary ? parsed.qualificationSummary.slice(0, 140) + '...' : 'Será gerada'}</p>
                </div>
                <div class="summary-card">
                    <h4>🎓 Formação & Experiência</h4>
                    <p><strong>Educação:</strong> ${parsed.education?.length || 0} registro(s) encontrado(s)</p>
                    <p><strong>Experiências:</strong> ${parsed.experience?.length || 0} cargo(s) encontrado(s)</p>
                    <p><strong>Cursos:</strong> ${parsed.courses?.length || 0} curso(s) extra(s)</p>
                </div>
                <div class="summary-card">
                    <h4>⚡ Competências Detectadas</h4>
                    <p><strong>Hard Skills:</strong> ${(parsed.hardSkills || []).concat(parsed.otherHardSkills ? [parsed.otherHardSkills] : []).join(', ') || 'Nenhuma detectada'}</p>
                    <p><strong>Soft Skills:</strong> ${(parsed.softSkills || []).concat(parsed.otherSoftSkills ? [parsed.otherSoftSkills] : []).join(', ') || 'Nenhuma detectada'}</p>
                </div>
            `;

            preview.style.display = 'block';

        } catch (error) {
            console.error('Erro no parsing do currículo:', error);
            alert(`Erro ao analisar currículo: ${error.message}`);
        } finally {
            loading.style.display = 'none';
        }
    }

    /**
     * Preenche automaticamente todos os campos do formulário com os dados importados ou traduzidos
     */
    function hydrateFormWithParsedData(data) {
        if (!data) return;

        // 1. Helpers para preenchimento seguro
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && val !== undefined && val !== null) {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        const setSelectVal = (selectElem, val) => {
            if (!selectElem || !val) return;
            const vLower = String(val).toLowerCase().trim();

            // Mapeamentos multilíngues para selects comuns
            const mapKeywords = [
                { match: /solteir|single|soltero/i, target: 'Solteiro(a)' },
                { match: /casad|married/i, target: 'Casado(a)' },
                { match: /divorc/i, target: 'Divorciado(a)' },
                { match: /viuv|viúv|widow/i, target: 'Viúvo(a)' },
                { match: /uni|civil/i, target: 'União Estável' },
                { match: /conclu|graduat|complet|finish/i, target: 'Concluído' },
                { match: /curs|ongo|progress|estud/i, target: 'Cursando' },
                { match: /tranc|incomp|paus/i, target: 'Trancado/Incompleto' },
                { match: /superior|bachelor|gradua|licenciatura|universit/i, target: 'Ensino Superior Completo' },
                { match: /médio|medio|high school|secundaria/i, target: 'Ensino Médio Completo' },
                { match: /técnico|tecnico|technical/i, target: 'Ensino Técnico' },
                { match: /pós|pos|master|posgrado|especializ/i, target: 'Pós-Graduação' },
                { match: /fundamental/i, target: 'Ensino Fundamental Completo' },
                { match: /manh|matut|morning/i, target: 'Manhã' },
                { match: /noit|notur|evening|night/i, target: 'Noite' },
                { match: /tard|vesp|afternoon/i, target: 'Tarde' },
                { match: /integral|full/i, target: 'Integral' },
                { match: /ead|dist|remote|online|virtual/i, target: 'EAD / A distância' }
            ];

            let matchedVal = '';
            for (let mk of mapKeywords) {
                if (mk.match.test(vLower)) {
                    matchedVal = mk.target;
                    break;
                }
            }

            for (let opt of selectElem.options) {
                const optLower = opt.value.toLowerCase();
                if (
                    opt.value === val ||
                    optLower === vLower ||
                    (matchedVal && opt.value === matchedVal) ||
                    optLower.includes(vLower) ||
                    vLower.includes(optLower)
                ) {
                    selectElem.value = opt.value;
                    selectElem.dispatchEvent(new Event('change', { bubbles: true }));
                    return;
                }
            }
        };

        let cleanCity = data.city || '';
        if (/s[íi]ntese|objetivo|educa|experi|curr[íi]culo|nome|idade|telefone|email/i.test(cleanCity)) cleanCity = '';
        let cleanState = (data.state || '').toUpperCase().trim();
        if (cleanState.length > 2 || /DE|EM|DO|DA|NO|NA/i.test(cleanState)) cleanState = '';

        setVal('name', data.name);
        setVal('birthplace', data.birthplace);
        setSelectVal(document.getElementById('maritalStatus'), data.maritalStatus);
        setVal('age', data.age);
        setVal('neighborhood', data.neighborhood);
        setVal('city', cleanCity);
        setVal('state', cleanState);
        setVal('phone1', data.phone1);
        setVal('phone2', data.phone2);
        setVal('email', data.email);
        setVal('license', data.license);
        setVal('objective', data.objective);
        setVal('qualificationSummary', data.qualificationSummary);
        setVal('additionalInfo', data.additionalInfo);
        setVal('otherHardSkills', data.otherHardSkills);
        setVal('otherSoftSkills', data.otherSoftSkills);

        // 2. Checkboxes de Skills
        document.querySelectorAll('.hard-skill, .soft-skill').forEach(cb => cb.checked = false);

        if (Array.isArray(data.hardSkills)) {
            data.hardSkills.forEach(skill => {
                const sClean = skill.toLowerCase().trim();
                document.querySelectorAll('.hard-skill').forEach(cb => {
                    if (cb.value.toLowerCase().trim() === sClean || cb.value.toLowerCase().includes(sClean) || sClean.includes(cb.value.toLowerCase())) {
                        cb.checked = true;
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            });
        }

        if (Array.isArray(data.softSkills)) {
            data.softSkills.forEach(skill => {
                const sClean = skill.toLowerCase().trim();
                document.querySelectorAll('.soft-skill').forEach(cb => {
                    if (cb.value.toLowerCase().trim() === sClean || cb.value.toLowerCase().includes(sClean) || sClean.includes(cb.value.toLowerCase())) {
                        cb.checked = true;
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            });
        }

        // 3. Educação
        const eduContainer = document.getElementById('education-container');
        eduContainer.innerHTML = '';
        if (data.education && data.education.length > 0) {
            data.education.forEach(edu => {
                const item = createEducationItem();
                if (edu.level) setSelectVal(item.querySelector('.education-level'), edu.level);
                if (edu.course) item.querySelector('.education-course').value = edu.course;
                if (edu.institution) item.querySelector('.institution').value = edu.institution;
                if (edu.status) setSelectVal(item.querySelector('.education-status'), edu.status);
                if (edu.year) item.querySelector('.education-year').value = edu.year;
                if (edu.shift) setSelectVal(item.querySelector('.education-shift'), edu.shift);
            });
        } else {
            createEducationItem();
        }

        // 4. Experiências
        const expContainer = document.getElementById('experience-container');
        expContainer.innerHTML = '';
        if (data.experience && data.experience.length > 0) {
            data.experience.forEach(exp => {
                const item = createExperienceItem();
                if (exp.position) item.querySelector('.position').value = exp.position;
                if (exp.company) item.querySelector('.company').value = exp.company;
                if (exp.period) item.querySelector('.job-period').value = exp.period;
                if (exp.description) item.querySelector('.job-description').value = exp.description;
            });
        } else {
            createExperienceItem();
        }

        // 5. Cursos
        const courseContainer = document.getElementById('courses-container');
        courseContainer.innerHTML = '';
        if (data.courses && data.courses.length > 0) {
            data.courses.forEach(c => {
                const item = createCourseItem();
                if (c.name) item.querySelector('.course-name').value = c.name;
                if (c.institution) item.querySelector('.course-institution').value = c.institution;
                if (c.hours) item.querySelector('.course-hours').value = c.hours;
                if (c.year) item.querySelector('.course-year').value = c.year;
            });
        } else {
            createCourseItem();
        }

        // Re-vincular ouvintes de tempo real nos novos elementos criados
        if (typeof RealtimePreview !== 'undefined') {
            RealtimePreview.addListenersToAllItems();
            RealtimePreview.updateFullPreview();
        }

        // Salvar imediatamente os dados importados no localStorage
        if (typeof DataStorage !== 'undefined') {
            DataStorage.saveFormDataSilently();
        }

        // Se tiver objetivo, disparar sugestões de skills automaticamente
        if (data.objective) {
            fetchAndRenderSkillSuggestions(data.objective);
        }
    }

    const applyParsedDataToForm = hydrateFormWithParsedData;
    window.applyParsedDataToForm = hydrateFormWithParsedData;

    /**
     * 2.2 Sugestão Dinâmica de Habilidades (Skills):
     * Inicializa eventos e gerenciamento de chips sugeridos
     */
    function initializeSkillSuggestions() {
        const refreshBtn = document.getElementById('btnRefreshSkills');
        const objectiveBtn = document.getElementById('btnSuggestSkillsFromObjective');
        const selectAllBtn = document.getElementById('btnSelectAllSuggestedSkills');
        const objectiveInput = document.getElementById('objective');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => fetchAndRenderSkillSuggestions());
        }

        if (objectiveBtn) {
            objectiveBtn.addEventListener('click', () => {
                fetchAndRenderSkillSuggestions();
                const panel = document.getElementById('aiSkillSuggestionsPanel');
                if (panel) {
                    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }

        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', applyAllSuggestedSkills);
        }

        // Sugerir automaticamente quando o usuário digitar e sair do campo de objetivo
        if (objectiveInput) {
            let timer = null;
            objectiveInput.addEventListener('blur', function() {
                if (this.value.trim().length > 3) {
                    fetchAndRenderSkillSuggestions(this.value.trim());
                }
            });
        }
    }

    /**
     * Busca sugestões de habilidades via IA para o cargo informado
     */
    async function fetchAndRenderSkillSuggestions(customRole) {
        const objectiveInput = document.getElementById('objective');
        const role = customRole || (objectiveInput ? objectiveInput.value.trim() : '');

        if (!role) {
            window.showNotification('Preencha o campo "Área ou função de interesse" para receber sugestões de skills.', 'info');
            if (objectiveInput) objectiveInput.focus();
            return;
        }

        const loading = document.getElementById('aiSkillsLoading');
        const content = document.getElementById('aiSkillsContent');
        const summary = document.getElementById('aiSkillsMarketSummary');
        const hardList = document.getElementById('suggestedHardSkillsList');
        const softList = document.getElementById('suggestedSoftSkillsList');

        loading.style.display = 'block';
        content.style.display = 'none';

        try {
            const data = await AIService.suggestSkillsForRole(role);
            activeSuggestedSkills = {
                hard: data.suggestedHardSkills || [],
                soft: data.suggestedSoftSkills || []
            };

            summary.textContent = `💡 Tendência de mercado para "${data.role || role}": ${data.marketSummary}`;

            // Renderizar Chips de Hard Skills
            hardList.innerHTML = '';
            (data.suggestedHardSkills || []).forEach(skill => {
                const chip = createSkillChip(skill, 'hard');
                hardList.appendChild(chip);
            });

            // Renderizar Chips de Soft Skills
            softList.innerHTML = '';
            (data.suggestedSoftSkills || []).forEach(skill => {
                const chip = createSkillChip(skill, 'soft');
                softList.appendChild(chip);
            });

            content.style.display = 'block';

        } catch (error) {
            console.error('Erro na sugestão de skills:', error);
            window.showNotification(`Erro ao sugerir habilidades: ${error.message}`, 'error');
        } finally {
            loading.style.display = 'none';
        }
    }

    /**
     * Cria um chip interativo de habilidade
     */
    function createSkillChip(skillName, type) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'skill-chip';
        chip.innerHTML = `<span class="chip-plus">+</span> <span class="chip-label">${skillName}</span>`;

        // Verifica se já está selecionada
        const isChecked = isSkillAlreadySelected(skillName, type);
        if (isChecked) {
            chip.classList.add('chip-selected');
            chip.querySelector('.chip-plus').textContent = '✓';
        }

        chip.addEventListener('click', function() {
            toggleSkillFromChip(skillName, type, chip);
        });

        return chip;
    }

    /**
     * Verifica se uma skill já está ativa no formulário
     */
    function isSkillAlreadySelected(skillName, type) {
        const selector = type === 'hard' ? '.hard-skill' : '.soft-skill';
        let found = false;

        document.querySelectorAll(`${selector}:checked`).forEach(cb => {
            if (cb.value.toLowerCase() === skillName.toLowerCase()) found = true;
        });

        if (!found) {
            const otherInput = document.getElementById(type === 'hard' ? 'otherHardSkills' : 'otherSoftSkills');
            if (otherInput && otherInput.value.toLowerCase().includes(skillName.toLowerCase())) {
                found = true;
            }
        }

        return found;
    }

    /**
     * Alterna ou adiciona uma skill a partir do clique no chip
     */
    function toggleSkillFromChip(skillName, type, chipElement) {
        const checkboxSelector = type === 'hard' ? `.hard-skill[value="${skillName}"]` : `.soft-skill[value="${skillName}"]`;
        const matchingCheckbox = document.querySelector(checkboxSelector);
        const otherInput = document.getElementById(type === 'hard' ? 'otherHardSkills' : 'otherSoftSkills');

        if (matchingCheckbox) {
            matchingCheckbox.checked = !matchingCheckbox.checked;
            matchingCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (matchingCheckbox.checked) {
                chipElement.classList.add('chip-selected');
                chipElement.querySelector('.chip-plus').textContent = '✓';
                window.showNotification(`Habilidade "${skillName}" marcada!`, 'success');
            } else {
                chipElement.classList.remove('chip-selected');
                chipElement.querySelector('.chip-plus').textContent = '+';
            }
        } else if (otherInput) {
            let current = otherInput.value.split(',').map(s => s.trim()).filter(Boolean);
            const existsIndex = current.findIndex(s => s.toLowerCase() === skillName.toLowerCase());

            if (existsIndex === -1) {
                current.push(skillName);
                otherInput.value = current.join(', ');
                otherInput.dispatchEvent(new Event('input', { bubbles: true }));
                chipElement.classList.add('chip-selected');
                chipElement.querySelector('.chip-plus').textContent = '✓';
                window.showNotification(`Habilidade "${skillName}" adicionada!`, 'success');
            } else {
                current.splice(existsIndex, 1);
                otherInput.value = current.join(', ');
                otherInput.dispatchEvent(new Event('input', { bubbles: true }));
                chipElement.classList.remove('chip-selected');
                chipElement.querySelector('.chip-plus').textContent = '+';
            }
        }

        if (typeof RealtimePreview !== 'undefined') {
            RealtimePreview.updateFullPreview();
        }
    }

    /**
     * Aplica todas as skills sugeridas em lote
     */
    function applyAllSuggestedSkills() {
        let addedCount = 0;

        // Hard skills
        activeSuggestedSkills.hard.forEach(skill => {
            const cb = document.querySelector(`.hard-skill[value="${skill}"]`);
            if (cb) {
                if (!cb.checked) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                    addedCount++;
                }
            } else {
                const other = document.getElementById('otherHardSkills');
                if (other) {
                    let cur = other.value.split(',').map(s => s.trim()).filter(Boolean);
                    if (!cur.some(s => s.toLowerCase() === skill.toLowerCase())) {
                        cur.push(skill);
                        other.value = cur.join(', ');
                        other.dispatchEvent(new Event('input', { bubbles: true }));
                        addedCount++;
                    }
                }
            }
        });

        // Soft skills
        activeSuggestedSkills.soft.forEach(skill => {
            const cb = document.querySelector(`.soft-skill[value="${skill}"]`);
            if (cb) {
                if (!cb.checked) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                    addedCount++;
                }
            } else {
                const other = document.getElementById('otherSoftSkills');
                if (other) {
                    let cur = other.value.split(',').map(s => s.trim()).filter(Boolean);
                    if (!cur.some(s => s.toLowerCase() === skill.toLowerCase())) {
                        cur.push(skill);
                        other.value = cur.join(', ');
                        other.dispatchEvent(new Event('input', { bubbles: true }));
                        addedCount++;
                    }
                }
            }
        });

        // Atualizar todos os chips visuais para selecionados
        document.querySelectorAll('.skill-chip').forEach(chip => {
            chip.classList.add('chip-selected');
            chip.querySelector('.chip-plus').textContent = '✓';
        });

        if (typeof RealtimePreview !== 'undefined') {
            RealtimePreview.updateFullPreview();
        }

        window.showNotification(`Todas as habilidades recomendadas foram aplicadas!`, 'success');
    }

    /**
     * Inicializa o modal de Configuração da API do Gemini
     */
    function initializeAiSettingsModal() {
        const modal = document.getElementById('aiSettingsModal');
        const openBtn = document.getElementById('openAiSettingsBtn');
        const closeBtn = document.querySelector('.close-ai-settings');
        const saveBtn = document.getElementById('btnSaveApiKey');
        const removeBtn = document.getElementById('btnRemoveApiKey');
        const keyInput = document.getElementById('geminiApiKeyInput');
        const statusDiv = document.getElementById('apiKeyTestStatus');

        if (openBtn && modal) {
            openBtn.addEventListener('click', function() {
                keyInput.value = AIService.getApiKey();
                updateSettingsStatusDisplay();
                modal.style.display = 'block';
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }

        window.addEventListener('click', function(event) {
            if (event.target == modal) modal.style.display = 'none';
        });

        function updateSettingsStatusDisplay() {
            if (AIService.hasApiKey()) {
                statusDiv.innerHTML = '<span class="status-badge active">● Conectado à API do Google Gemini</span>';
            } else {
                statusDiv.innerHTML = '<span class="status-badge inactive">○ Chave não configurada (usando gerador inteligente offline)</span>';
            }
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                const key = keyInput.value.trim();
                if (!key) {
                    alert('Por favor, informe a chave de API ou clique em Remover.');
                    return;
                }
                AIService.setApiKey(key);
                updateAiHeaderStatus();
                updateSettingsStatusDisplay();
                window.showNotification('Chave da API Gemini salva com sucesso!', 'success');
                modal.style.display = 'none';
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                if (confirm('Deseja remover a chave salva do seu navegador?')) {
                    AIService.setApiKey('');
                    keyInput.value = '';
                    updateAiHeaderStatus();
                    updateSettingsStatusDisplay();
                    window.showNotification('Chave de API removida.', 'info');
                }
            });
        }
    }

    /**
     * Formata uma lista de habilidades para texto natural
     * @param {Array} skills - Lista de habilidades
     * @returns {string} Lista formatada
     */
    function formatSkillsList(skills) {
        if (!skills || skills.length === 0) return '';
        if (skills.length === 1) return skills[0];
        if (skills.length === 2) return `${skills[0]} e ${skills[1]}`;
        const copy = [...skills];
        const lastSkill = copy.pop();
        return `${copy.join(', ')} e ${lastSkill}`;
    }

    /**
     * Manipulador para remover um item (educação, experiência, curso)
     */
    function handleRemoveItem() {
        const parent = this.parentElement;
        const container = parent.parentElement;
        container.removeChild(parent);
    }

    /**
     * Cria um novo item de educação
     * @returns {HTMLElement} O novo item criado
     */
    function createEducationItem() {
        const container = document.getElementById('education-container');
        const newItem = document.createElement('div');
        newItem.className = 'education-item';
        newItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Nível de escolaridade</label>
                    <select class="education-level" required>
                        <option value="">Selecione</option>
                        <option value="Ensino Fundamental">Ensino Fundamental</option>
                        <option value="Ensino Médio">Ensino Médio</option>
                        <option value="Ensino Técnico">Ensino Técnico</option>
                        <option value="Graduação">Graduação</option>
                        <option value="Pós-graduação">Pós-graduação</option>
                        <option value="Mestrado">Mestrado</option>
                        <option value="Doutorado">Doutorado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Curso/Área</label>
                    <input type="text" class="education-course">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Instituição</label>
                    <input type="text" class="institution" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select class="education-status" required>
                        <option value="">Selecione</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cursando">Cursando</option>
                        <option value="Interrompido">Interrompido</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Ano de conclusão/previsão</label>
                    <input type="number" class="education-year" min="1950" max="2050" required>
                </div>
                <div class="form-group">
                    <label>Turno</label>
                    <select class="education-shift">
                        <option value="">Selecione</option>
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                        <option value="Noturno">Noturno</option>
                        <option value="Integral">Integral</option>
                        <option value="EAD">EAD</option>
                    </select>
                </div>
            </div>
            <button type="button" class="remove-btn">Remover</button>
        `;
        container.appendChild(newItem);
        newItem.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
        return newItem;
    }

    /**
     * Cria um novo item de experiência com suporte ao botão de IA
     * @returns {HTMLElement} O novo item criado
     */
    function createExperienceItem() {
        const container = document.getElementById('experience-container');
        const newItem = document.createElement('div');
        newItem.className = 'experience-item';
        newItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Cargo</label>
                    <input type="text" class="position" required>
                </div>
                <div class="form-group">
                    <label>Empresa</label>
                    <input type="text" class="company" required>
                </div>
            </div>
            <div class="form-group">
                <label>Período</label>
                <input type="text" class="job-period" placeholder="ex: Jan 2020 - Atual" required>
            </div>
            <div class="form-group">
                <div class="label-with-ai">
                    <label>Descrição das atividades (mínimo duas linhas)</label>
                    <button type="button" class="btn-ai-small btn-improve-exp" title="Reescrever usando verbos de ação e metodologia STAR">✨ Melhorar texto com IA</button>
                </div>
                <textarea class="job-description" rows="3" placeholder="Descreva sucintamente suas atribuições ou clique em 'Melhorar texto com IA'..." required></textarea>
            </div>
            <button type="button" class="remove-btn">Remover</button>
        `;
        container.appendChild(newItem);
        
        newItem.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
        newItem.querySelector('.btn-improve-exp').addEventListener('click', handleOpenExperienceAi);
        
        return newItem;
    }

    /**
     * Cria um novo item de curso
     * @returns {HTMLElement} O novo item criado
     */
    function createCourseItem() {
        const container = document.getElementById('courses-container');
        const newItem = document.createElement('div');
        newItem.className = 'course-item';
        newItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Curso</label>
                    <input type="text" class="course-name" required>
                </div>
                <div class="form-group">
                    <label>Instituição</label>
                    <input type="text" class="course-institution" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Carga horária</label>
                    <input type="text" class="course-hours" placeholder="Ex: 40h">
                </div>
                <div class="form-group">
                    <label>Ano</label>
                    <input type="number" class="course-year" min="1950" max="2050">
                </div>
            </div>
            <button type="button" class="remove-btn">Remover</button>
        `;
        container.appendChild(newItem);
        newItem.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
        return newItem;
    }

    /**
     * Inicializa o modal do Termômetro de Vaga (ATS)
     */
    function initializeAiAtsModal() {
        const modal = document.getElementById('aiAtsModal');
        const openBtn = document.getElementById('openAiAtsBtn');
        const openBottomBtn = document.getElementById('btnOpenAtsBottom');
        const closeBtn = document.querySelector('.close-ai-ats');
        const closeFooterBtn = document.querySelector('.close-ai-ats-btn');
        const runBtn = document.getElementById('btnRunAtsAnalysis');
        const reanalyzeBtn = document.getElementById('btnReanalyzeAts');
        const jobDescTextarea = document.getElementById('atsJobDescription');

        if (!modal) return;

        function openModal() {
            modal.style.display = 'block';
            if (jobDescTextarea && !jobDescTextarea.value.trim()) {
                jobDescTextarea.focus();
            }
        }

        function closeModal() {
            modal.style.display = 'none';
        }

        if (openBtn) openBtn.addEventListener('click', openModal);
        if (openBottomBtn) openBottomBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeModal);

        window.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });

        if (runBtn) {
            runBtn.addEventListener('click', async function() {
                const jobText = jobDescTextarea?.value?.trim() || '';
                if (!jobText) {
                    alert('Por favor, cole a descrição ou requisitos da vaga antes de executar a análise ATS.');
                    jobDescTextarea?.focus();
                    return;
                }
                await runAtsAnalysis(jobText);
            });
        }

        if (reanalyzeBtn) {
            reanalyzeBtn.addEventListener('click', async function() {
                const jobText = jobDescTextarea?.value?.trim() || '';
                if (!jobText) {
                    alert('Cole o texto da vaga para reavaliar.');
                    return;
                }
                await runAtsAnalysis(jobText);
            });
        }
    }

    /**
     * Executa a análise de compatibilidade ATS e renderiza o dashboard
     */
    async function runAtsAnalysis(jobText) {
        const loading = document.getElementById('atsLoadingState');
        const results = document.getElementById('atsResultsContainer');
        const scoreCircle = document.getElementById('atsScoreCircle');
        const scoreValue = document.getElementById('atsScoreValue');
        const levelTag = document.getElementById('atsLevelTag');
        const summaryText = document.getElementById('atsDiagnosisSummary');
        const presentList = document.getElementById('atsPresentKeywordsList');
        const missingList = document.getElementById('atsMissingKeywordsList');
        const tipsList = document.getElementById('atsRecommendationsList');

        if (loading) loading.style.display = 'block';
        if (results) results.style.display = 'none';

        try {
            const formData = (typeof DataStorage !== 'undefined') ? DataStorage.getFormData() : {};
            const analysis = await AIService.analyzeJobCompatibility(formData, jobText);
            lastAtsAnalysisData = analysis;

            if (loading) loading.style.display = 'none';
            if (results) results.style.display = 'block';

            // Atualizar Score e Visual do Gauge
            const score = analysis.score || 0;
            if (scoreValue) scoreValue.textContent = `${score}%`;

            if (scoreCircle) {
                scoreCircle.classList.remove('score-high', 'score-medium', 'score-low');
                if (score >= 75) {
                    scoreCircle.classList.add('score-high');
                } else if (score >= 50) {
                    scoreCircle.classList.add('score-medium');
                } else {
                    scoreCircle.classList.add('score-low');
                }
            }

            // Nível e Resumo
            if (levelTag) {
                levelTag.textContent = analysis.matchLevel || 'Avaliação Concluída';
                levelTag.className = 'ats-level-tag';
                if (score >= 75) levelTag.classList.add('level-high');
                else if (score >= 50) levelTag.classList.add('level-medium');
                else levelTag.classList.add('level-low');
            }

            if (summaryText) {
                summaryText.textContent = analysis.matchSummary || 'Análise concluída com sucesso.';
            }

            // Sugestão de Cargo Alinhado
            const roleBanner = document.getElementById('atsRoleSuggestionBanner');
            if (roleBanner) {
                if (analysis.recommendedRole) {
                    roleBanner.style.display = 'block';
                    roleBanner.innerHTML = `
                        <div class="ats-role-content">
                            <div class="ats-role-info">
                                <span class="badge-role">🎯 Cargo Ideal para a Vaga</span>
                                <h4>${escapeHtml(analysis.recommendedRole)}</h4>
                                <p>Alinhe seu campo "Área ou Função de Interesse (Objetivo)" com este cargo exato para maximizar a pontuação no robô ATS.</p>
                            </div>
                            <button type="button" id="btnApplyAtsRole" class="btn-apply-role" data-role="${escapeHtml(analysis.recommendedRole)}">
                                🎯 Aplicar Cargo no Currículo
                            </button>
                        </div>
                    `;
                    const applyBtn = roleBanner.querySelector('#btnApplyAtsRole');
                    if (applyBtn) {
                        applyBtn.addEventListener('click', function() {
                            const objInput = document.getElementById('objective');
                            if (objInput) {
                                objInput.value = analysis.recommendedRole;
                                objInput.dispatchEvent(new Event('input', { bubbles: true }));
                                objInput.dispatchEvent(new Event('change', { bubbles: true }));
                                this.textContent = '✓ Cargo Aplicado!';
                                this.classList.add('applied');
                                this.disabled = true;
                                if (typeof showNotification === 'function') {
                                    showNotification(`Objetivo atualizado para "${analysis.recommendedRole}"!`, 'success');
                                }
                                updateResumeHealthBanner();
                            }
                        });
                    }
                } else {
                    roleBanner.style.display = 'none';
                }
            }

            // Palavras-chave presentes
            if (presentList) {
                presentList.innerHTML = '';
                const presentWords = analysis.presentKeywords || [];
                if (presentWords.length === 0) {
                    presentList.innerHTML = '<span class="empty-keywords-note">Nenhuma correspondência exata detectada ainda.</span>';
                } else {
                    presentWords.forEach(kw => {
                        const tag = document.createElement('span');
                        tag.className = 'keyword-tag-present';
                        tag.innerHTML = `<span class="kw-check">✓</span> ${escapeHtml(kw)}`;
                        presentList.appendChild(tag);
                    });
                }
            }

            // Palavras-chave ausentes
            if (missingList) {
                missingList.innerHTML = '';
                const missingWords = analysis.missingKeywords || [];
                if (missingWords.length === 0) {
                    missingList.innerHTML = '<span class="all-matched-note">🎉 Fantástico! Todas as principais palavras-chave da vaga foram encontradas no seu currículo!</span>';
                } else {
                    missingWords.forEach(item => {
                        const kwText = typeof item === 'string' ? item : item.keyword;
                        const importance = (typeof item === 'object' && item.importance) ? item.importance : 'Recomendável';
                        const tip = (typeof item === 'object' && item.tip) ? item.tip : '';

                        const card = document.createElement('div');
                        card.className = 'missing-kw-card';
                        
                        let impClass = 'imp-rec';
                        if (/cr[ií]tic/i.test(importance)) impClass = 'imp-crit';
                        else if (/dif/i.test(importance)) impClass = 'imp-dif';

                        card.innerHTML = `
                            <div class="missing-kw-info">
                                <div class="missing-kw-header-row">
                                    <span class="missing-kw-name">${escapeHtml(kwText)}</span>
                                    <span class="missing-kw-imp ${impClass}">${escapeHtml(importance)}</span>
                                </div>
                                ${tip ? `<p class="missing-kw-tip">${escapeHtml(tip)}</p>` : ''}
                            </div>
                            <button type="button" class="btn-add-keyword" data-keyword="${escapeHtml(kwText)}" title="Adicionar às suas habilidades">
                                + Adicionar
                            </button>
                        `;

                        card.querySelector('.btn-add-keyword').addEventListener('click', function() {
                            addMissingKeywordToResume(kwText, this);
                        });

                        missingList.appendChild(card);
                    });
                }
            }

            // Plano de Ação Passo a Passo para se Adequar à Vaga
            const actionPlanContainer = document.getElementById('atsActionPlanCards');
            if (actionPlanContainer) {
                actionPlanContainer.innerHTML = '';
                const planItems = analysis.actionPlan || [];
                if (planItems.length === 0) {
                    actionPlanContainer.innerHTML = '<p class="empty-keywords-note">Nenhum ajuste crítico necessário para esta vaga.</p>';
                } else {
                    planItems.forEach((item, index) => {
                        const card = document.createElement('div');
                        card.className = 'action-plan-card';
                        
                        const icon = item.icon || '📌';
                        const title = item.title || `Passo ${index + 1}`;
                        const desc = item.description || '';
                        const suggestion = item.suggestion || '';
                        const targetSection = item.targetSection || '';

                        card.innerHTML = `
                            <div class="action-plan-header">
                                <span class="action-plan-icon">${icon}</span>
                                <h5 class="action-plan-title">${escapeHtml(title)}</h5>
                            </div>
                            <p class="action-plan-desc">${escapeHtml(desc)}</p>
                            ${suggestion ? `
                                <div class="action-plan-suggestion">
                                    <strong>💡 Sugestão Prática:</strong>
                                    <span>${escapeHtml(suggestion)}</span>
                                </div>
                            ` : ''}
                            ${targetSection ? `
                                <button type="button" class="btn-plan-action" data-target="${escapeHtml(targetSection)}">
                                    Editar esta seção no formulário &rarr;
                                </button>
                            ` : ''}
                        `;

                        const planBtn = card.querySelector('.btn-plan-action');
                        if (planBtn) {
                            planBtn.addEventListener('click', function() {
                                const modal = document.getElementById('aiAtsModal');
                                if (modal) modal.style.display = 'none';
                                handleAlertActionClick(targetSection);
                            });
                        }

                        actionPlanContainer.appendChild(card);
                    });
                }
            }

            // Dicas e Recomendações
            if (tipsList) {
                tipsList.innerHTML = '';
                const tips = analysis.recommendations || [];
                tips.forEach(t => {
                    const li = document.createElement('li');
                    li.textContent = t;
                    tipsList.appendChild(li);
                });
            }

        } catch (error) {
            console.error('Erro ao analisar vaga:', error);
            if (loading) loading.style.display = 'none';
            alert(`Erro ao analisar a vaga: ${error.message}`);
        }
    }

    /**
     * Adiciona uma palavra-chave ausente ao campo 'otherHardSkills' do formulário
     */
    function addMissingKeywordToResume(keyword, buttonEl) {
        if (!keyword) return;
        const otherHardInput = document.getElementById('otherHardSkills');
        if (!otherHardInput) return;

        const currentVal = otherHardInput.value.trim();
        const terms = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];

        // Evitar duplicatas
        if (!terms.some(t => t.toLowerCase() === keyword.toLowerCase())) {
            terms.push(keyword);
            otherHardInput.value = terms.join(', ');
            
            // Disparar eventos para salvar e atualizar preview
            otherHardInput.dispatchEvent(new Event('input', { bubbles: true }));
            otherHardInput.dispatchEvent(new Event('change', { bubbles: true }));

            if (buttonEl) {
                buttonEl.textContent = '✓ Adicionada!';
                buttonEl.classList.add('added');
                buttonEl.disabled = true;
            }

            if (typeof showNotification === 'function') {
                showNotification(`"${keyword}" adicionada com sucesso às suas Hard Skills!`, 'success');
            }

            // Atualizar auditoria de saúde em tempo real
            updateResumeHealthBanner();
        } else {
            if (buttonEl) {
                buttonEl.textContent = '✓ Já no currículo';
                buttonEl.disabled = true;
            }
        }
    }

    /**
     * Inicializa a barra de Alertas Estratégicos & Saúde do Currículo
     */
    function initializeResumeHealthBanner() {
        const toggleBtn = document.getElementById('btnToggleHealthAlerts');
        const list = document.getElementById('healthAlertsList');
        const form = document.getElementById('resumeForm');

        if (toggleBtn && list) {
            toggleBtn.addEventListener('click', function() {
                const isOpen = list.style.display === 'block';
                list.style.display = isOpen ? 'none' : 'block';
                const arrow = toggleBtn.querySelector('.toggle-arrow');
                if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
            });
        }

        // Atualizar quando houver digitação/mudança no formulário
        if (form) {
            let auditTimer = null;
            form.addEventListener('input', function() {
                clearTimeout(auditTimer);
                auditTimer = setTimeout(updateResumeHealthBanner, 400);
            });
            form.addEventListener('change', function() {
                clearTimeout(auditTimer);
                auditTimer = setTimeout(updateResumeHealthBanner, 200);
            });
        }

        // Execução inicial
        setTimeout(updateResumeHealthBanner, 500);
    }

    /**
     * Atualiza o banner de saúde e alertas estratégicos
     */
    function updateResumeHealthBanner() {
        const badge = document.getElementById('healthScoreBadge');
        const valueEl = document.getElementById('healthScoreValue');
        const titleEl = document.getElementById('healthScoreTitle');
        const subtitleEl = document.getElementById('healthScoreSubtitle');
        const countBadge = document.getElementById('healthAlertCountBadge');
        const list = document.getElementById('healthAlertsList');

        if (!badge || !valueEl) return;

        const formData = (typeof DataStorage !== 'undefined') ? DataStorage.getFormData() : {};
        const alerts = AIService.auditResumeGaps(formData);

        const criticalCount = alerts.filter(a => a.type === 'critical').length;
        const warningCount = alerts.filter(a => a.type === 'warning').length;
        const isAllGood = alerts.some(a => a.type === 'success');

        // Calcular pontuação de saúde estrutural (0 - 100)
        let healthScore = 100 - (criticalCount * 25) - (warningCount * 10);
        healthScore = Math.max(20, Math.min(100, healthScore));

        valueEl.textContent = `${healthScore}%`;

        // Cores e status
        badge.classList.remove('health-high', 'health-medium', 'health-low');
        if (healthScore >= 80) {
            badge.classList.add('health-high');
            if (titleEl) titleEl.textContent = isAllGood ? 'Currículo Pronto & Competitivo' : 'Estrutura Sólida do Currículo';
            if (subtitleEl) subtitleEl.textContent = `${warningCount > 0 ? `${warningCount} recomendação(ões) para pontuação máxima` : 'Seu currículo atende aos requisitos fundamentais para ATS.'}`;
        } else if (healthScore >= 50) {
            badge.classList.add('health-medium');
            if (titleEl) titleEl.textContent = 'Atenção aos Campos Estratégicos';
            if (subtitleEl) subtitleEl.textContent = `Existem ${criticalCount + warningCount} pontos cruciais que podem prejudicar sua triagem automática.`;
        } else {
            badge.classList.add('health-low');
            if (titleEl) titleEl.textContent = 'Currículo Incompleto para ATS';
            if (subtitleEl) subtitleEl.textContent = `Preencha os dados essenciais para permitir que recrutadores entrem em contato.`;
        }

        const actionableAlerts = alerts.filter(a => a.type !== 'success');
        if (countBadge) {
            countBadge.textContent = `${actionableAlerts.length} ${actionableAlerts.length === 1 ? 'Alerta' : 'Alertas'}`;
            countBadge.className = 'alert-count-pill';
            if (criticalCount > 0) countBadge.classList.add('pill-critical');
            else if (warningCount > 0) countBadge.classList.add('pill-warning');
            else countBadge.classList.add('pill-success');
        }

        if (list) {
            list.innerHTML = '';
            alerts.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `health-alert-item alert-type-${item.type}`;
                
                let icon = 'ℹ️';
                if (item.type === 'critical') icon = '🔴';
                else if (item.type === 'warning') icon = '🟡';
                else if (item.type === 'success') icon = '🟢';

                itemDiv.innerHTML = `
                    <div class="alert-icon">${icon}</div>
                    <div class="alert-body">
                        <strong>${escapeHtml(item.title)}</strong>
                        <p>${escapeHtml(item.description)}</p>
                    </div>
                    ${item.actionLabel && item.targetSection !== 'all' ? `
                        <button type="button" class="btn-alert-action" data-target="${escapeHtml(item.targetSection)}">
                            ${escapeHtml(item.actionLabel)} &rarr;
                        </button>
                    ` : ''}
                `;

                const actionBtn = itemDiv.querySelector('.btn-alert-action');
                if (actionBtn) {
                    actionBtn.addEventListener('click', function() {
                        handleAlertActionClick(item.targetSection);
                    });
                }

                list.appendChild(itemDiv);
            });
        }
    }

    /**
     * Rola suavemente e dá foco no campo ou seção relacionada ao alerta
     */
    function handleAlertActionClick(targetSection) {
        let elementToFocus = null;
        let cardToHighlight = null;

        if (targetSection === 'name') {
            elementToFocus = document.getElementById('name');
            cardToHighlight = document.getElementById('section-personal');
        } else if (targetSection === 'phone1') {
            elementToFocus = document.getElementById('phone1');
            cardToHighlight = document.getElementById('section-personal');
        } else if (targetSection === 'objective') {
            elementToFocus = document.getElementById('objective');
            cardToHighlight = document.getElementById('section-objective-synthesis');
        } else if (targetSection === 'qualificationSummary') {
            elementToFocus = document.getElementById('qualificationSummary');
            cardToHighlight = document.getElementById('section-objective-synthesis');
        } else if (targetSection === 'courses') {
            elementToFocus = document.getElementById('addCourse');
            cardToHighlight = document.getElementById('section-courses');
        } else if (targetSection === 'skills') {
            elementToFocus = document.getElementById('btnRefreshSkills');
            cardToHighlight = document.getElementById('section-skills');
        } else if (targetSection === 'experience') {
            elementToFocus = document.querySelector('.btn-improve-exp') || document.getElementById('addExperience');
            cardToHighlight = document.getElementById('section-experience');
        }

        if (cardToHighlight) {
            cardToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardToHighlight.classList.add('highlight-section-pulse');
            setTimeout(() => cardToHighlight.classList.remove('highlight-section-pulse'), 1800);
        }

        if (elementToFocus) {
            setTimeout(() => {
                try { elementToFocus.focus(); } catch (e) {}
            }, 300);
        }
    }

    
    /**
     * Inicializa a toolbar superior da pré-visualização A4
     */
    function initializePreviewToolbar() {
        const btnWord = document.getElementById('btnPreviewExportWord');
        const btnGenerate = document.getElementById('generateBtn');

        if (btnWord) {
            btnWord.addEventListener('click', function() {
                if (typeof ExportUtils !== 'undefined' && typeof ExportUtils.exportToWord === 'function') {
                    ExportUtils.exportToWord();
                }
            });
        }

        if (btnGenerate) {
            btnGenerate.addEventListener('click', function() {
                if (typeof RealtimePreview !== 'undefined') {
                    RealtimePreview.updateFullPreview();
                }
                const previewEl = document.getElementById('resumePreview');
                if (previewEl) {
                    previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                if (typeof showNotification === 'function') {
                    showNotification('Currículo atualizado na visualização!', 'success');
                }
            });
        }
    }

    /**
     * Inicializa o pop-up explicativo de Hard vs Soft Skills
     */
    function initializeSkillExplainerModal() {
        const modal = document.getElementById('skillsExplainerModal');
        const openBtn = document.getElementById('btnExplainSkills');
        const closeBtn = document.querySelector('.close-skills-explainer');
        const closeActionBtn = document.querySelector('.close-skills-explainer-btn');

        if (!modal) return;
        if (openBtn) openBtn.addEventListener('click', () => modal.style.display = 'block');
        if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
        if (closeActionBtn) closeActionBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    /**
     * Inicializa os seletores e criadores de Hard Skills e Soft Skills personalizadas
     */
    function initializeCustomSkillAdders() {
        const hardInput = document.getElementById('customHardSkillInput');
        const hardAddBtn = document.getElementById('btnAddCustomHardSkill');
        const hardContainer = document.getElementById('customHardSkillsChipsContainer');
        const hardHidden = document.getElementById('otherHardSkills');

        const softInput = document.getElementById('customSoftSkillInput');
        const softAddBtn = document.getElementById('btnAddCustomSoftSkill');
        const softContainer = document.getElementById('customSoftSkillsChipsContainer');
        const softHidden = document.getElementById('otherSoftSkills');

        function addChip(type, text) {
            const val = (text || '').trim();
            if (!val) return;
            const container = type === 'hard' ? hardContainer : softContainer;
            const hidden = type === 'hard' ? hardHidden : softHidden;
            if (!container || !hidden) return;

            const existing = Array.from(container.querySelectorAll('.chip-label')).map(el => el.textContent.trim().toLowerCase());
            if (existing.includes(val.toLowerCase())) return;

            const tag = document.createElement('span');
            tag.className = 'custom-skill-tag checked';
            tag.innerHTML = `
                <span class="chip-label">${escapeHtml(val)}</span>
                <button type="button" class="btn-remove-custom-chip" title="Remover">&times;</button>
            `;

            tag.querySelector('.btn-remove-custom-chip').addEventListener('click', function(e) {
                e.stopPropagation();
                tag.remove();
                syncHiddenInput(type);
            });

            tag.addEventListener('click', function() {
                tag.classList.toggle('checked');
                syncHiddenInput(type);
            });

            container.appendChild(tag);
            syncHiddenInput(type);
        }

        function syncHiddenInput(type) {
            const container = type === 'hard' ? hardContainer : softContainer;
            const hidden = type === 'hard' ? hardHidden : softHidden;
            if (!container || !hidden) return;
            const activeChips = Array.from(container.querySelectorAll('.custom-skill-tag.checked .chip-label')).map(el => el.textContent.trim());
            hidden.value = activeChips.join(', ');
            hidden.dispatchEvent(new Event('input', { bubbles: true }));
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
            updateSkillCountBadges();
        }

        if (hardAddBtn && hardInput) {
            hardAddBtn.addEventListener('click', () => {
                addChip('hard', hardInput.value);
                hardInput.value = '';
                hardInput.focus();
            });
            hardInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addChip('hard', hardInput.value);
                    hardInput.value = '';
                }
            });
        }

        if (softAddBtn && softInput) {
            softAddBtn.addEventListener('click', () => {
                addChip('soft', softInput.value);
                softInput.value = '';
                softInput.focus();
            });
            softInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addChip('soft', softInput.value);
                    softInput.value = '';
                }
            });
        }

        document.querySelectorAll('.hard-skill, .soft-skill').forEach(cb => {
            cb.addEventListener('change', updateSkillCountBadges);
        });
        updateSkillCountBadges();
    }

    function updateSkillCountBadges() {
        const hardCount = document.querySelectorAll('.hard-skill:checked').length;
        const customHardCount = document.querySelectorAll('#customHardSkillsChipsContainer .custom-skill-tag.checked').length;
        const softCount = document.querySelectorAll('.soft-skill:checked').length;
        const customSoftCount = document.querySelectorAll('#customSoftSkillsChipsContainer .custom-skill-tag.checked').length;

        const hardBadge = document.getElementById('hardSkillsCount');
        const softBadge = document.getElementById('softSkillsCount');
        if (hardBadge) hardBadge.textContent = `${hardCount + customHardCount} selecionadas`;
        if (softBadge) softBadge.textContent = `${softCount + customSoftCount} selecionadas`;
    }

    /**
     * Inicializa o filtro por categorias nas Hard e Soft Skills
     */
    function initializeSkillCategoryFilters() {
        const tabChips = document.querySelectorAll('.skills-filter-tabs .tab-chip');
        tabChips.forEach(chip => {
            chip.addEventListener('click', function() {
                tabChips.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const category = this.getAttribute('data-category') || 'all';

                document.querySelectorAll('#hardSkillsGrid .skill-checkbox-item').forEach(item => {
                    const itemCat = item.getAttribute('data-cat') || 'all';
                    if (category === 'all' || itemCat === category || itemCat === 'all') {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    /**
     * Inicializa o modal de Tradução em 1 Clique
     */
    function initializeAiTranslateModal() {
        const modal = document.getElementById('aiTranslateModal');
        const openBtn = document.getElementById('openAiTranslateBtn');
        const openPreviewBtn = document.getElementById('btnPreviewTranslate');
        const closeBtn = document.querySelector('.close-ai-translate');
        const runBtn = document.getElementById('btnRunTranslation');
        const loading = document.getElementById('aiTranslateLoading');
        const previewBox = document.getElementById('aiTranslatePreviewContainer');
        const applyBtn = document.getElementById('btnApplyTranslationToForm');
        const wordBtn = document.getElementById('btnDownloadTranslatedWord');
        const restoreBtn = document.getElementById('btnRestoreOriginalResume');
        const diffContainer = document.getElementById('translateSummaryDiff');

        let translatedDataCache = null;
        let originalDataBackup = null;

        if (!modal) return;

        function openModal() {
            modal.style.display = 'block';
        }
        function closeModal() {
            modal.style.display = 'none';
        }

        if (openBtn) openBtn.addEventListener('click', openModal);
        if (openPreviewBtn) openPreviewBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        document.querySelectorAll('.lang-option-card').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.lang-option-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
            });
        });

        if (runBtn) {
            runBtn.addEventListener('click', async function() {
                const selectedLang = document.querySelector('input[name="translateTargetLang"]:checked')?.value || 'en';
                const formData = (typeof DataStorage !== 'undefined') ? DataStorage.getFormData() : {};
                
                if (loading) loading.style.display = 'block';
                if (previewBox) previewBox.style.display = 'none';

                try {
                    const result = await AIService.translateResume(formData, selectedLang);
                    translatedDataCache = result;

                    if (diffContainer) {
                        const objLabel = selectedLang === 'pt' ? 'Objetivo' : (selectedLang === 'es' ? 'Objetivo' : 'Objective');
                        const sumLabel = selectedLang === 'pt' ? 'Síntese' : (selectedLang === 'es' ? 'Resumen' : 'Summary');
                        const expLabel = selectedLang === 'pt' ? 'Experiências' : (selectedLang === 'es' ? 'Experiencias' : 'Experience');
                        const eduLabel = selectedLang === 'pt' ? 'Formação' : (selectedLang === 'es' ? 'Formación' : 'Education');
                        const itemsSuffix = selectedLang === 'pt' ? 'cargos adaptados' : (selectedLang === 'es' ? 'cargos adaptados' : 'translated roles');
                        const eduSuffix = selectedLang === 'pt' ? 'cursos adaptados' : (selectedLang === 'es' ? 'títulos adaptados' : 'translated degrees');

                        diffContainer.innerHTML = `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f2; border-radius: 10px; padding: 14px; margin-bottom: 12px; font-size: 13px;">
                                <p><strong>🎯 ${objLabel}:</strong> ${escapeHtml(result.objective || '')}</p>
                                <p style="margin-top: 6px;"><strong>✨ ${sumLabel}:</strong> ${escapeHtml((result.qualificationSummary || '').slice(0, 160))}...</p>
                                <p style="margin-top: 6px;"><strong>💼 ${expLabel}:</strong> ${result.experience?.length || 0} ${itemsSuffix}</p>
                                <p style="margin-top: 6px;"><strong>🎓 ${eduLabel}:</strong> ${result.education?.length || 0} ${eduSuffix}</p>
                            </div>
                        `;
                    }

                    if (loading) loading.style.display = 'none';
                    if (previewBox) previewBox.style.display = 'block';

                } catch (err) {
                    console.error(err);
                    if (loading) loading.style.display = 'none';
                    alert('Erro ao traduzir: ' + err.message);
                }
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                if (!translatedDataCache) return;
                const selectedLang = document.querySelector('input[name="translateTargetLang"]:checked')?.value || 'en';
                if (!originalDataBackup) {
                    originalDataBackup = (typeof DataStorage !== 'undefined') ? DataStorage.getFormDataSnapshot() : null;
                }
                applyParsedDataToForm(translatedDataCache);
                if (typeof RealtimePreview !== 'undefined' && typeof RealtimePreview.setLanguage === 'function') {
                    RealtimePreview.setLanguage(selectedLang);
                }
                if (restoreBtn) restoreBtn.style.display = 'inline-block';
                if (typeof showNotification === 'function') {
                    showNotification('Currículo atualizado no idioma traduzido com sucesso!', 'success');
                }
                closeModal();
            });
        }

        if (restoreBtn) {
            restoreBtn.addEventListener('click', function() {
                if (!originalDataBackup) return;
                applyParsedDataToForm(originalDataBackup);
                if (typeof RealtimePreview !== 'undefined' && typeof RealtimePreview.setLanguage === 'function') {
                    RealtimePreview.setLanguage('pt');
                }
                restoreBtn.style.display = 'none';
                if (typeof showNotification === 'function') {
                    showNotification('Versão original em Português restaurada!', 'info');
                }
                closeModal();
            });
        }

        if (wordBtn) {
            wordBtn.addEventListener('click', function() {
                if (typeof ExportUtils !== 'undefined' && typeof ExportUtils.exportToWord === 'function') {
                    ExportUtils.exportToWord();
                }
            });
        }
    }

    /**
     * Inicializa o modal de Carta de Apresentação
     */
    function initializeAiCoverLetterModal() {
        const modal = document.getElementById('aiCoverLetterModal');
        const openBtn = document.getElementById('openAiCoverLetterBtn');
        const openPreviewBtn = document.getElementById('btnPreviewCoverLetter');
        const closeBtn = document.querySelector('.close-ai-cover');
        const pullAtsBtn = document.getElementById('btnPullJobFromAts');
        const generateBtn = document.getElementById('btnGenerateCoverLetter');
        const loading = document.getElementById('aiCoverLoading');
        const previewBox = document.getElementById('aiCoverPreviewContainer');
        const outputTextarea = document.getElementById('coverLetterOutputText');
        const copyBtn = document.getElementById('btnCopyCoverLetter');
        const exportWordBtn = document.getElementById('btnExportCoverWord');
        const printBtn = document.getElementById('btnPrintCoverLetter');

        if (!modal) return;

        function openModal() {
            modal.style.display = 'block';
        }
        function closeModal() {
            modal.style.display = 'none';
        }

        if (openBtn) openBtn.addEventListener('click', openModal);
        if (openPreviewBtn) openPreviewBtn.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        if (pullAtsBtn) {
            pullAtsBtn.addEventListener('click', function() {
                const atsJobText = document.getElementById('atsJobDescription')?.value || '';
                const coverJobText = document.getElementById('coverJobDescription');
                if (coverJobText) {
                    coverJobText.value = atsJobText;
                    if (atsJobText) {
                        if (typeof showNotification === 'function') showNotification('Descrição importada do Termômetro ATS!', 'success');
                    } else {
                        alert('Nenhuma descrição preenchida no Termômetro ATS ainda.');
                    }
                }
            });
        }

        if (generateBtn) {
            generateBtn.addEventListener('click', async function() {
                const formData = (typeof DataStorage !== 'undefined') ? DataStorage.getFormData() : {};
                const companyName = document.getElementById('coverCompanyName')?.value || '';
                const tone = document.getElementById('coverToneSelect')?.value || 'modern';
                const jobDesc = document.getElementById('coverJobDescription')?.value || '';

                if (loading) loading.style.display = 'block';
                if (previewBox) previewBox.style.display = 'none';

                try {
                    const coverLetter = await AIService.generateCoverLetter(formData, { companyName, tone, jobDescription: jobDesc });
                    if (outputTextarea) outputTextarea.value = coverLetter;
                    if (loading) loading.style.display = 'none';
                    if (previewBox) previewBox.style.display = 'block';
                } catch (err) {
                    console.error(err);
                    if (loading) loading.style.display = 'none';
                    alert('Erro ao gerar carta: ' + err.message);
                }
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                if (outputTextarea && outputTextarea.value) {
                    navigator.clipboard.writeText(outputTextarea.value).then(() => {
                        if (typeof showNotification === 'function') {
                            showNotification('Carta de apresentação copiada para a área de transferência!', 'success');
                        }
                        copyBtn.textContent = '✓ Copiado!';
                        setTimeout(() => copyBtn.textContent = '📋 Copiar Texto', 2000);
                    });
                }
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', function() {
                const printWindow = window.open('', '_blank');
                const name = document.getElementById('name')?.value || 'Candidato';
                const letter = outputTextarea?.value || '';
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Carta de Apresentação - ${name}</title>
                        <style>
                            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; line-height: 1.6; color: #1a2340; }
                            h1 { color: #155491; margin-bottom: 20px; font-size: 22px; }
                            p { white-space: pre-wrap; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <h1>Carta de Apresentação</h1>
                        <p>${letter}</p>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            });
        }

        if (exportWordBtn) {
            exportWordBtn.addEventListener('click', function() {
                if (typeof ExportUtils !== 'undefined' && typeof ExportUtils.exportToWord === 'function') {
                    ExportUtils.exportToWord();
                }
            });
        }
    }

    /**
     * Inicializa a navegação simplificada por abas para dispositivos móveis
     */
    function initializeMobileTabs() {
        const workspace = document.querySelector('.app-workspace');
        const tabForm = document.getElementById('mobileTabForm');
        const tabPreview = document.getElementById('mobileTabPreview');
        if (!workspace || !tabForm || !tabPreview) return;

        tabForm.addEventListener('click', function() {
            tabForm.classList.add('active');
            tabPreview.classList.remove('active');
            workspace.classList.remove('show-mobile-preview');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        tabPreview.addEventListener('click', function() {
            tabPreview.classList.add('active');
            tabForm.classList.remove('active');
            workspace.classList.add('show-mobile-preview');
            if (typeof RealtimePreview !== 'undefined' && typeof RealtimePreview.updateFullPreview === 'function') {
                RealtimePreview.updateFullPreview();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * Inicializa os accordions retráteis do formulário para foco e usabilidade em telas menores
     */
    function initializeFormAccordions() {
        const triggers = document.querySelectorAll('.section-accordion-trigger');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                // Se clicou em um botão dentro do cabeçalho (como o botão de ajuda de skills), não colapsa
                if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) {
                    return;
                }

                const card = this.closest('.form-section-card');
                if (card) {
                    card.classList.toggle('collapsed');
                }
            });
        });
    }

    /**
     * Inicializa os botões da barra fixa inferior mobile no modo de visualização
     */
    function initializeMobileQuickActions() {
        const btnWord = document.getElementById('btnMobileWordQuick');
        const btnTranslate = document.getElementById('btnMobileTranslateQuick');
        const translateModal = document.getElementById('aiTranslateModal');

        if (btnWord) {
            btnWord.addEventListener('click', function() {
                if (typeof ExportUtils !== 'undefined' && typeof ExportUtils.exportToWord === 'function') {
                    ExportUtils.exportToWord();
                }
            });
        }

        if (btnTranslate && translateModal) {
            btnTranslate.addEventListener('click', function() {
                translateModal.style.display = 'block';
            });
        }
    }

    return {
        initializeFormHandlers,
        createEducationItem,
        createExperienceItem,
        createCourseItem,
        handleOpenExperienceAi,
        updateAiHeaderStatus,
        fetchAndRenderSkillSuggestions,
        updateResumeHealthBanner,
        hydrateFormWithParsedData,
        applyParsedDataToForm
    };
})();