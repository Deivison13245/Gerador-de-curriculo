/**
 * Módulo para gerenciar o armazenamento, recuperação e persistência contínua dos dados do currículo
 */
const DataStorage = (function() {
    const STORAGE_KEY = 'resumeData';
    let autoSaveTimeout = null;

    /**
     * Coleta os dados de educação do formulário com segurança contra nulos
     * @returns {Array} Array de objetos com dados de educação
     */
    function getEducationData() {
        const items = document.querySelectorAll('.education-item');
        return Array.from(items).map(item => ({
            level: item.querySelector('.education-level')?.value || '',
            course: item.querySelector('.education-course')?.value || '',
            institution: item.querySelector('.institution')?.value || '',
            status: item.querySelector('.education-status')?.value || '',
            year: item.querySelector('.education-year')?.value || '',
            shift: item.querySelector('.education-shift')?.value || ''
        }));
    }

    /**
     * Coleta os dados de experiência do formulário com segurança contra nulos
     * @returns {Array} Array de objetos com dados de experiência
     */
    function getExperienceData() {
        const items = document.querySelectorAll('.experience-item');
        return Array.from(items).map(item => ({
            position: item.querySelector('.position')?.value || '',
            company: item.querySelector('.company')?.value || '',
            period: item.querySelector('.job-period')?.value || '',
            description: item.querySelector('.job-description')?.value || ''
        }));
    }

    /**
     * Coleta os dados de cursos complementares do formulário com segurança contra nulos
     * @returns {Array} Array de objetos com dados de cursos
     */
    function getCoursesData() {
        const items = document.querySelectorAll('.course-item');
        return Array.from(items).map(item => ({
            name: item.querySelector('.course-name')?.value || '',
            institution: item.querySelector('.course-institution')?.value || '',
            hours: item.querySelector('.course-hours')?.value || '',
            year: item.querySelector('.course-year')?.value || ''
        }));
    }

    /**
     * Obtém um snapshot completo dos dados atuais do formulário
     * @returns {object}
     */
    function getFormDataSnapshot() {
        return {
            name: document.getElementById('name')?.value || '',
            birthplace: document.getElementById('birthplace')?.value || '',
            maritalStatus: document.getElementById('maritalStatus')?.value || '',
            age: document.getElementById('age')?.value || '',
            neighborhood: document.getElementById('neighborhood')?.value || '',
            city: document.getElementById('city')?.value || '',
            state: document.getElementById('state')?.value || '',
            phone1: document.getElementById('phone1')?.value || '',
            phone2: document.getElementById('phone2')?.value || '',
            email: document.getElementById('email')?.value || '',
            license: document.getElementById('license')?.value || '',
            objective: document.getElementById('objective')?.value || '',
            qualificationSummary: document.getElementById('qualificationSummary')?.value || '',
            additionalInfo: document.getElementById('additionalInfo')?.value || '',
            otherHardSkills: document.getElementById('otherHardSkills')?.value || '',
            otherSoftSkills: document.getElementById('otherSoftSkills')?.value || '',
            hardSkills: Array.from(document.querySelectorAll('.hard-skill:checked')).map(el => el.value),
            softSkills: Array.from(document.querySelectorAll('.soft-skill:checked')).map(el => el.value),
            education: getEducationData(),
            experience: getExperienceData(),
            courses: getCoursesData()
        };
    }

    /**
     * Salva os dados no localStorage de forma silenciosa (para auto-save)
     */
    function saveFormDataSilently() {
        try {
            const formData = getFormDataSnapshot();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        } catch (e) {
            console.warn('Erro ao salvar dados no localStorage:', e);
        }
    }

    /**
     * Salva os dados do formulário com notificação visual explícita
     */
    function saveFormData() {
        saveFormDataSilently();
        if (typeof window.showNotification === 'function') {
            window.showNotification('Dados do currículo salvos com sucesso!', 'success');
        }
    }

    /**
     * Dispara salvamento automático com debounce de 500ms
     */
    function triggerAutoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveFormDataSilently();
        }, 500);
    }

    /**
     * Carrega os dados salvos do localStorage para o formulário
     */
    function loadFormData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return;
        
        try {
            const formData = JSON.parse(savedData);
            
            // Preencher informações pessoais com sanitização de resquícios
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined) el.value = val;
            };

            let cleanCity = formData.city || '';
            let cleanState = formData.state || '';
            if (/s[íi]ntese|objetivo|educa|experi|curr[íi]culo|nome/i.test(cleanCity)) cleanCity = '';
            if (cleanState.toUpperCase() === 'DE' || cleanState.toUpperCase() === 'EM') cleanState = '';

            setVal('name', formData.name);
            setVal('birthplace', formData.birthplace);
            setVal('maritalStatus', formData.maritalStatus);
            setVal('age', formData.age);
            setVal('neighborhood', formData.neighborhood);
            setVal('city', cleanCity);
            setVal('state', cleanState);
            setVal('phone1', formData.phone1);
            setVal('phone2', formData.phone2);
            setVal('email', formData.email);
            setVal('license', formData.license);
            setVal('objective', formData.objective);
            setVal('qualificationSummary', formData.qualificationSummary);
            setVal('additionalInfo', formData.additionalInfo);
            setVal('otherHardSkills', formData.otherHardSkills);
            setVal('otherSoftSkills', formData.otherSoftSkills);
            
            // Marcar habilidades selecionadas
            document.querySelectorAll('.hard-skill, .soft-skill').forEach(cb => cb.checked = false);

            if (Array.isArray(formData.hardSkills)) {
                formData.hardSkills.forEach(skill => {
                    const checkbox = document.querySelector(`.hard-skill[value="${skill}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            if (Array.isArray(formData.softSkills)) {
                formData.softSkills.forEach(skill => {
                    const checkbox = document.querySelector(`.soft-skill[value="${skill}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            // Carregar educação, experiência e cursos
            if (typeof FormHandlers !== 'undefined') {
                loadComplexData('education', formData.education, FormHandlers.createEducationItem);
                loadComplexData('experience', formData.experience, FormHandlers.createExperienceItem);
                loadComplexData('courses', formData.courses, FormHandlers.createCourseItem);
            }
            
            // Atualizar a visualização em tempo real
            setTimeout(() => {
                if (typeof RealtimePreview !== 'undefined') {
                    RealtimePreview.updateFullPreview();
                    RealtimePreview.addListenersToAllItems();
                }
            }, 100);

        } catch (e) {
            console.error('Erro ao carregar dados salvos do localStorage:', e);
        }
    }

    /**
     * Função auxiliar para carregar dados complexos (educação, experiência, cursos)
     * @param {string} type - Tipo de dados (education, experience, courses)
     * @param {Array} data - Array de objetos com dados
     * @param {Function} createItemFunc - Função para criar novos itens
     */
    function loadComplexData(type, data, createItemFunc) {
        if (!data || !data.length) return;
        
        const container = document.getElementById(`${type === 'courses' ? 'courses' : type}-container`);
        if (!container) return;

        container.innerHTML = '';
        
        data.forEach(itemData => {
            const newItem = createItemFunc();
            
            Object.keys(itemData).forEach(key => {
                const element = newItem.querySelector(`.${key}`) || 
                                newItem.querySelector(`.${type}-${key}`) ||
                                newItem.querySelector(`.education-${key}`) ||
                                newItem.querySelector(`.course-${key}`) ||
                                newItem.querySelector(`.job-${key}`);
                if (element && itemData[key] !== undefined) {
                    element.value = itemData[key];
                }
            });
        });
    }

    /**
     * Limpa todos os dados salvos no localStorage
     */
    function clearSavedData() {
        if (confirm('Tem certeza que deseja limpar todos os dados salvos? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem(STORAGE_KEY);
            if (typeof window.showNotification === 'function') {
                window.showNotification('Dados limpos com sucesso!', 'success');
            }
            location.reload();
        }
    }

    // Inicializa listeners globais para auto-save contínuo
    function initializeAutoSave() {
        const form = document.getElementById('resumeForm');
        if (form) {
            form.addEventListener('input', triggerAutoSave);
            form.addEventListener('change', triggerAutoSave);
        }
    }

    // API pública
    return {
        saveFormData,
        saveFormDataSilently,
        triggerAutoSave,
        loadFormData,
        getFormDataSnapshot,
        getFormData: getFormDataSnapshot,
        getEducationData,
        getExperienceData,
        getCoursesData,
        clearSavedData,
        initializeAutoSave
    };
})();

window.DataStorage = DataStorage;
