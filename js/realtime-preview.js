/**
 * Módulo para gerenciar a visualização em tempo real do currículo
 */
const RealtimePreview = (function() {
    // Armazenar referências a elementos DOM frequentemente acessados
    let elements = {};
    
    // Armazenar timers para debounce
    let debounceTimers = {};
    
    let currentLanguage = 'pt';

    const SECTION_TITLES = {
        pt: {
            objective: 'Objetivo',
            qualificationSummary: 'Síntese de Qualificações',
            education: 'Educação',
            experience: 'Experiências Profissionais/Acadêmicas',
            courses: 'Cursos Complementares',
            skills: 'Habilidades',
            additionalInfo: 'Informações Complementares',
            hardSkillsLabel: 'Hard Skills (Técnicas)',
            softSkillsLabel: 'Soft Skills (Comportamentais)',
            noExperience: 'Sem experiências profissionais anteriores.',
            objectivePlaceholder: 'Seu objetivo profissional aparecerá aqui.',
            summaryPlaceholder: 'Sua síntese de qualificações aparecerá aqui.',
            educationPlaceholder: 'Sua formação acadêmica aparecerá aqui.',
            experiencePlaceholder: 'Suas experiências profissionais aparecerão aqui.'
        },
        en: {
            objective: 'Career Objective',
            qualificationSummary: 'Summary of Qualifications',
            education: 'Education',
            experience: 'Professional Experience',
            courses: 'Courses & Certifications',
            skills: 'Skills',
            additionalInfo: 'Additional Information',
            hardSkillsLabel: 'Hard Skills (Technical)',
            softSkillsLabel: 'Soft Skills (Interpersonal)',
            noExperience: 'No previous professional experience listed.',
            objectivePlaceholder: 'Your career objective will appear here.',
            summaryPlaceholder: 'Your professional summary will appear here.',
            educationPlaceholder: 'Your educational background will appear here.',
            experiencePlaceholder: 'Your work experience will appear here.'
        },
        es: {
            objective: 'Objetivo Profesional',
            qualificationSummary: 'Resumen de Cualificaciones',
            education: 'Educación',
            experience: 'Experiencia Profesional',
            courses: 'Cursos y Certificaciones',
            skills: 'Habilidades',
            additionalInfo: 'Información Adicional',
            hardSkillsLabel: 'Hard Skills (Técnicas)',
            softSkillsLabel: 'Soft Skills (Habilidades Blandas)',
            noExperience: 'Sin experiencia laboral previa registrada.',
            objectivePlaceholder: 'Su objetivo profesional aparecerá aquí.',
            summaryPlaceholder: 'Su resumen profesional aparecerá aquí.',
            educationPlaceholder: 'Su formación académica aparecerá aquí.',
            experiencePlaceholder: 'Sus experiencias profesionales aparecerán aquí.'
        }
    };

    /**
     * Inicializa a visualização em tempo real
     */
    function initialize() {
        // Criar a estrutura básica do currículo na visualização
        createInitialPreview();
        
        // Armazenar referências a elementos DOM
        cacheElements();
        
        // Adicionar listeners para todos os campos do formulário
        setupEventListeners();
        
        // Atualizar a visualização com os dados atuais (se houver)
        updateFullPreview();
    }
    
    /**
     * Define o idioma da pré-visualização (pt, en, es)
     */
    function setLanguage(lang) {
        if (SECTION_TITLES[lang]) {
            currentLanguage = lang;
            updateSectionTitles();
            updateFullPreview();
        }
    }

    /**
     * Atualiza os títulos das seções com base no idioma atual
     */
    function updateSectionTitles() {
        const t = SECTION_TITLES[currentLanguage] || SECTION_TITLES.pt;
        const setHeading = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        setHeading('heading-objective', t.objective);
        setHeading('heading-qualification-summary', t.qualificationSummary);
        setHeading('heading-education', t.education);
        setHeading('heading-experience', t.experience);
        setHeading('heading-courses', t.courses);
        setHeading('heading-skills', t.skills);
        setHeading('heading-additional-info', t.additionalInfo);
    }
    
    /**
     * Cria a estrutura inicial do currículo na área de visualização
     */
    function createInitialPreview() {
        const previewContainer = document.getElementById('resumePreview');
        const t = SECTION_TITLES[currentLanguage] || SECTION_TITLES.pt;
        
        previewContainer.innerHTML = `
            <div class="resume">
                <div class="resume-header">
                    <h1 id="preview-name">Nome Completo</h1>
                    <p id="preview-personal-info"></p>
                    <p id="preview-address"></p>
                </div>
                
                <div class="resume-contact">
                    <p id="preview-phones"></p>
                    <p id="preview-email"></p>
                    <p id="preview-license"></p>
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-objective">${t.objective}</h2>
                    <p id="preview-objective">${t.objectivePlaceholder}</p>
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-qualification-summary">${t.qualificationSummary}</h2>
                    <p id="preview-qualification-summary">${t.summaryPlaceholder}</p>
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-education">${t.education}</h2>
                    <div id="preview-education">
                        <p class="placeholder-text">${t.educationPlaceholder}</p>
                    </div>
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-experience">${t.experience}</h2>
                    <div id="preview-experience">
                        <p class="placeholder-text">${t.experiencePlaceholder}</p>
                    </div>
                </div>
                
                <div class="resume-section" id="preview-courses-section" style="display: none;">
                    <h2 id="heading-courses">${t.courses}</h2>
                    <div id="preview-courses"></div>
                </div>
                
                <div class="resume-section" id="preview-skills-section" style="display: none;">
                    <h2 id="heading-skills">${t.skills}</h2>
                    <div id="preview-skills"></div>
                </div>
                
                <div class="resume-section" id="preview-additional-info-section" style="display: none;">
                    <h2 id="heading-additional-info">${t.additionalInfo}</h2>
                    <p id="preview-additional-info"></p>
                </div>
            </div>
        `;
    }
    
    /**
     * Armazena referências a elementos DOM frequentemente acessados
     */
    function cacheElements() {
        elements = {
            // Campos de informações pessoais
            name: document.getElementById('name'),
            birthplace: document.getElementById('birthplace'),
            maritalStatus: document.getElementById('maritalStatus'),
            age: document.getElementById('age'),
            neighborhood: document.getElementById('neighborhood'),
            city: document.getElementById('city'),
            state: document.getElementById('state'),
            phone1: document.getElementById('phone1'),
            phone2: document.getElementById('phone2'),
            email: document.getElementById('email'),
            license: document.getElementById('license'),
            
            // Objetivo e síntese
            objective: document.getElementById('objective'),
            qualificationSummary: document.getElementById('qualificationSummary'),
            
            // Informações adicionais
            additionalInfo: document.getElementById('additionalInfo'),
            
            // Outras habilidades
            otherHardSkills: document.getElementById('otherHardSkills'),
            otherSoftSkills: document.getElementById('otherSoftSkills'),
            
            // Elementos de visualização
            previewName: document.getElementById('preview-name'),
            previewPersonalInfo: document.getElementById('preview-personal-info'),
            previewAddress: document.getElementById('preview-address'),
            previewPhones: document.getElementById('preview-phones'),
            previewEmail: document.getElementById('preview-email'),
            previewLicense: document.getElementById('preview-license'),
            previewObjective: document.getElementById('preview-objective'),
            previewQualificationSummary: document.getElementById('preview-qualification-summary'),
            previewEducation: document.getElementById('preview-education'),
            previewExperience: document.getElementById('preview-experience'),
            previewCourses: document.getElementById('preview-courses'),
            previewCoursesSection: document.getElementById('preview-courses-section'),
            previewSkills: document.getElementById('preview-skills'),
            previewSkillsSection: document.getElementById('preview-skills-section'),
            previewAdditionalInfo: document.getElementById('preview-additional-info'),
            previewAdditionalInfoSection: document.getElementById('preview-additional-info-section')
        };
    }
    
    /**
     * Configura os listeners de eventos para todos os campos do formulário
     */
    function setupEventListeners() {
        // Informações pessoais
        elements.name.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.birthplace.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.maritalStatus.addEventListener('change', () => updatePersonalInfo());
        elements.age.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.neighborhood.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.city.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.state.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.phone1.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.phone2.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.email.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        elements.license.addEventListener('input', debounce(() => updatePersonalInfo(), 300));
        
        // Objetivo e síntese
        elements.objective.addEventListener('input', debounce(() => {
            elements.previewObjective.textContent = elements.objective.value || 'Seu objetivo profissional aparecerá aqui.';
        }, 300));
        
        elements.qualificationSummary.addEventListener('input', debounce(() => {
            elements.previewQualificationSummary.textContent = elements.qualificationSummary.value || 'Sua síntese de qualificações aparecerá aqui.';
        }, 300));
        
        // Informações adicionais
        elements.additionalInfo.addEventListener('input', debounce(() => {
            const value = elements.additionalInfo.value;
            elements.previewAdditionalInfo.textContent = value;
            elements.previewAdditionalInfoSection.style.display = value ? 'block' : 'none';
        }, 300));
        
        // Habilidades
        document.querySelectorAll('.hard-skill, .soft-skill').forEach(checkbox => {
            checkbox.addEventListener('change', debounce(() => updateSkills(), 300));
        });
        
        elements.otherHardSkills.addEventListener('input', debounce(() => updateSkills(), 300));
        elements.otherSoftSkills.addEventListener('input', debounce(() => updateSkills(), 300));
        
        // Configurar observadores para seções dinâmicas
        setupMutationObservers();
        
        // Adicionar listeners para botões de adicionar/remover
        document.getElementById('addEducation').addEventListener('click', () => {
            setTimeout(() => {
                addListenersToLastItem('education');
                updateEducation();
            }, 10);
        });
        
        document.getElementById('addExperience').addEventListener('click', () => {
            setTimeout(() => {
                addListenersToLastItem('experience');
                updateExperience();
            }, 10);
        });
        
        document.getElementById('addCourse').addEventListener('click', () => {
            setTimeout(() => {
                addListenersToLastItem('course');
                updateCourses();
            }, 10);
        });
        
        // Adicionar listeners aos itens iniciais
        addListenersToAllItems();
    }
    
    /**
     * Adiciona listeners a todos os itens existentes (educação, experiência, cursos)
     */
    function addListenersToAllItems() {
        // Educação
        document.querySelectorAll('.education-item').forEach(item => {
            addListenersToEducationItem(item);
        });
        
        // Experiência
        document.querySelectorAll('.experience-item').forEach(item => {
            addListenersToExperienceItem(item);
        });
        
        // Cursos
        document.querySelectorAll('.course-item').forEach(item => {
            addListenersToCourseItem(item);
        });
    }
    
    /**
     * Adiciona listeners ao último item adicionado de um determinado tipo
     * @param {string} type - Tipo de item (education, experience, course)
     */
    function addListenersToLastItem(type) {
        let container, selector, addListenersFunc;
        
        switch (type) {
            case 'education':
                container = document.getElementById('education-container');
                selector = '.education-item';
                addListenersFunc = addListenersToEducationItem;
                break;
            case 'experience':
                container = document.getElementById('experience-container');
                selector = '.experience-item';
                addListenersFunc = addListenersToExperienceItem;
                break;
            case 'course':
                container = document.getElementById('courses-container');
                selector = '.course-item';
                addListenersFunc = addListenersToCourseItem;
                break;
            default:
                return;
        }
        
        const items = container.querySelectorAll(selector);
        if (items.length > 0) {
            const lastItem = items[items.length - 1];
            addListenersFunc(lastItem);
        }
    }
    
    /**
     * Adiciona listeners a um item de educação
     * @param {HTMLElement} item - O item de educação
     */
    function addListenersToEducationItem(item) {
        const inputs = item.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => updateEducation(), 300));
            input.addEventListener('change', () => updateEducation());
        });
        
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                setTimeout(() => updateEducation(), 10);
            });
        }
    }
    
    /**
     * Adiciona listeners a um item de experiência
     * @param {HTMLElement} item - O item de experiência
     */
    function addListenersToExperienceItem(item) {
        const inputs = item.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => updateExperience(), 300));
            input.addEventListener('change', () => updateExperience());
        });
        
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                setTimeout(() => updateExperience(), 10);
            });
        }
    }
    
    /**
     * Adiciona listeners a um item de curso
     * @param {HTMLElement} item - O item de curso
     */
    function addListenersToCourseItem(item) {
        const inputs = item.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(() => updateCourses(), 300));
            input.addEventListener('change', () => updateCourses());
        });
        
        const removeBtn = item.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                setTimeout(() => updateCourses(), 10);
            });
        }
    }
    
    /**
     * Configura observadores de mutação para detectar alterações nas seções dinâmicas
     */
    function setupMutationObservers() {
        // Observador para o container de educação
        const educationObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    updateEducation();
                }
            }
        });
        
        educationObserver.observe(document.getElementById('education-container'), {
            childList: true
        });
        
        // Observador para o container de experiência
        const experienceObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    updateExperience();
                }
            }
        });
        
        experienceObserver.observe(document.getElementById('experience-container'), {
            childList: true
        });
        
        // Observador para o container de cursos
        const coursesObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    updateCourses();
                }
            }
        });
        
        coursesObserver.observe(document.getElementById('courses-container'), {
            childList: true
        });
    }
    
    /**
     * Atualiza todas as seções do currículo na visualização
     */
    function updateFullPreview() {
        updatePersonalInfo();
        
        // Objetivo e síntese
        elements.previewObjective.textContent = elements.objective.value || 'Seu objetivo profissional aparecerá aqui.';
        elements.previewQualificationSummary.textContent = elements.qualificationSummary.value || 'Sua síntese de qualificações aparecerá aqui.';
        
        // Seções dinâmicas
        updateEducation();
        updateExperience();
        updateCourses();
        updateSkills();
        
        // Informações adicionais
        const additionalInfo = elements.additionalInfo.value;
        elements.previewAdditionalInfo.textContent = additionalInfo;
        elements.previewAdditionalInfoSection.style.display = additionalInfo ? 'block' : 'none';
    }
    
    /**
     * Atualiza as informações pessoais na visualização
     */
    function updatePersonalInfo() {
        // Nome
        const name = elements.name.value;
        elements.previewName.textContent = name || 'Nome Completo';
        
        // Linha de naturalidade, estado civil e idade
        let personalInfoLine = '';
        const birthplace = elements.birthplace.value;
        const maritalStatus = elements.maritalStatus.value;
        const age = elements.age.value;
        
        if (birthplace) personalInfoLine += `Natural de ${birthplace}`;
        if (birthplace && (maritalStatus || age)) personalInfoLine += ', ';
        if (maritalStatus) personalInfoLine += `${maritalStatus}`;
        if ((birthplace || maritalStatus) && age) personalInfoLine += ', ';
        if (age) personalInfoLine += `${age} anos`;
        
        elements.previewPersonalInfo.textContent = personalInfoLine;
        
        // Linha de endereço
        let addressLine = '';
        const neighborhood = elements.neighborhood.value;
        const city = elements.city.value;
        const state = elements.state.value;
        
        if (neighborhood) addressLine += neighborhood;
        if (neighborhood && (city || state)) addressLine += ', ';
        if (city) addressLine += city;
        if ((neighborhood || city) && state) addressLine += ' - ';
        if (state) addressLine += state;
        
        elements.previewAddress.textContent = addressLine;
        
        // Linha de telefones
        let phoneLine = '';
        const phone1 = elements.phone1.value;
        const phone2 = elements.phone2.value;
        
        if (phone1) phoneLine += phone1;
        if (phone1 && phone2) phoneLine += '; ';
        if (phone2) phoneLine += `${phone2} (ligação, WhatsApp ou recado)`;
        
        elements.previewPhones.textContent = phoneLine;
        
        // Email
        elements.previewEmail.textContent = elements.email.value;
        
        // CNH
        const license = elements.license.value;
        elements.previewLicense.textContent = license ? `CNH: ${license}` : '';
    }
    
    /**
     * Atualiza a seção de educação na visualização
     */
        function updateEducation() {
        const educationItems = document.querySelectorAll('.education-item');
        let educationHTML = '';
        
        educationItems.forEach(item => {
            const level = item.querySelector('.education-level')?.value?.trim() || '';
            const course = item.querySelector('.education-course')?.value?.trim() || '';
            const institution = item.querySelector('.institution')?.value?.trim() || '';
            const status = item.querySelector('.education-status')?.value?.trim() || '';
            const year = item.querySelector('.education-year')?.value?.trim() || '';
            const shift = item.querySelector('.education-shift')?.value?.trim() || '';
            
            const parts = [];
            if (level && course) parts.push(`${level} em ${course}`);
            else if (level) parts.push(level);
            else if (course) parts.push(course);

            if (institution) parts.push(institution);
            if (status) parts.push(status);
            if (year) parts.push(year);
            if (shift) parts.push(shift);

            if (parts.length > 0) {
                educationHTML += `
                    <div class="resume-item">
                        <p>● ${parts.join(' – ')}</p>
                    </div>
                `;
            }
        });
        
        if (educationHTML) {
            elements.previewEducation.innerHTML = educationHTML;
        } else {
            elements.previewEducation.innerHTML = '<p class="placeholder-text">Sua formação acadêmica aparecerá aqui.</p>';
        }
    }
    
    /**
     * Atualiza a seção de experiência na visualização
     */
        function updateExperience() {
        const experienceItems = document.querySelectorAll('.experience-item');
        let experienceHTML = '';
        
        if (experienceItems.length === 0) {
            elements.previewExperience.innerHTML = '<p>Sem experiências profissionais anteriores.</p>';
            return;
        }
        
        let hasValidExperience = false;
        
        experienceItems.forEach(item => {
            const position = item.querySelector('.position')?.value?.trim() || '';
            const company = item.querySelector('.company')?.value?.trim() || '';
            const period = item.querySelector('.job-period')?.value?.trim() || '';
            const description = item.querySelector('.job-description')?.value?.trim() || '';
            
            const headerParts = [position, company, period].filter(Boolean);
            if (headerParts.length > 0 || description) {
                hasValidExperience = true;
                experienceHTML += `
                    <div class="resume-item">
                        ${headerParts.length > 0 ? `<p><strong>● ${headerParts.join(' | ')}</strong></p>` : ''}
                        ${description ? `<p>${description}</p>` : ''}
                    </div>
                `;
            }
        });
        
        if (hasValidExperience) {
            elements.previewExperience.innerHTML = experienceHTML;
        } else {
            elements.previewExperience.innerHTML = '<p>Sem experiências profissionais anteriores.</p>';
        }
    }
    
    /**
     * Atualiza a seção de cursos na visualização
     */
    function updateCourses() {
        const courseItems = document.querySelectorAll('.course-item');
        let coursesHTML = '';
        
        if (courseItems.length === 0) {
            elements.previewCoursesSection.style.display = 'none';
            return;
        }
        
        let hasValidCourse = false;
        
        courseItems.forEach(item => {
            const courseName = item.querySelector('.course-name').value;
            const institution = item.querySelector('.course-institution').value;
            const hours = item.querySelector('.course-hours').value;
            const year = item.querySelector('.course-year').value;
            
            if (courseName || institution) {
                hasValidCourse = true;
                let courseText = `${courseName || 'Curso não especificado'} | ${institution || 'Instituição não especificada'}`;
                if (hours || year) {
                    courseText += ' | ';
                    if (hours) courseText += hours;
                    if (hours && year) courseText += ' ';
                    if (year) courseText += `(${year})`;
                }
                
                coursesHTML += `
                    <div class="resume-item">
                        <p>● ${courseText}</p>
                    </div>
                `;
            }
        });
        
        if (hasValidCourse) {
            elements.previewCourses.innerHTML = coursesHTML;
            elements.previewCoursesSection.style.display = 'block';
        } else {
            elements.previewCoursesSection.style.display = 'none';
        }
    }
    
    /**
     * Atualiza a seção de habilidades na visualização
     */
        function updateSkills() {
        const hardSkills = [];
        document.querySelectorAll('.hard-skill:checked').forEach(checkbox => {
            if (checkbox.value) hardSkills.push(checkbox.value.trim());
        });
        
        const softSkills = [];
        document.querySelectorAll('.soft-skill:checked').forEach(checkbox => {
            if (checkbox.value) softSkills.push(checkbox.value.trim());
        });
        
        const otherHard = elements.otherHardSkills?.value || '';
        if (otherHard) {
            otherHard.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (!hardSkills.includes(s)) hardSkills.push(s);
            });
        }
        
        const otherSoft = elements.otherSoftSkills?.value || '';
        if (otherSoft) {
            otherSoft.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (!softSkills.includes(s)) softSkills.push(s);
            });
        }
        
        let skillsHTML = '';
        const t = SECTION_TITLES[currentLanguage] || SECTION_TITLES.pt;
        if (hardSkills.length > 0 || softSkills.length > 0) {
            if (hardSkills.length > 0) {
                skillsHTML += `<p style="margin-bottom: 6px;"><strong>${t.hardSkillsLabel}:</strong> ${hardSkills.join(', ')}</p>`;
            }
            if (softSkills.length > 0) {
                skillsHTML += `<p><strong>${t.softSkillsLabel}:</strong> ${softSkills.join(', ')}</p>`;
            }
            elements.previewSkills.innerHTML = skillsHTML;
            elements.previewSkillsSection.style.display = 'block';
        } else {
            elements.previewSkillsSection.style.display = 'none';
        }
    }
    
    /**
     * Função de debounce para limitar a frequência de execução de uma função
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em milissegundos
     * @param {string} [id] - Identificador opcional para o timer
     * @returns {Function} Função com debounce
     */
    function debounce(func, wait, id) {
        return function() {
            const context = this;
            const args = arguments;
            const timerId = id || func.toString();
            
            clearTimeout(debounceTimers[timerId]);
            
            debounceTimers[timerId] = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // API pública
    return {
        initialize,
        updateFullPreview,
        addListenersToAllItems,
        setLanguage,
        getLanguage: () => currentLanguage
    };
})();