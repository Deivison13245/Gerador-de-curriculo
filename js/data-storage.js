/**
 * Módulo para gerenciar o armazenamento e recuperação de dados do currículo
 */
const DataStorage = (function() {
    /**
     * Salva os dados do formulário no localStorage
     */
    function saveFormData() {
        const formData = {
            // Informações pessoais
            name: document.getElementById('name').value,
            birthplace: document.getElementById('birthplace').value,
            maritalStatus: document.getElementById('maritalStatus').value,
            age: document.getElementById('age').value,
            neighborhood: document.getElementById('neighborhood').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            phone1: document.getElementById('phone1').value,
            phone2: document.getElementById('phone2').value,
            email: document.getElementById('email').value,
            license: document.getElementById('license').value,
           
            // Objetivo e síntese
            objective: document.getElementById('objective').value,
            qualificationSummary: document.getElementById('qualificationSummary').value,
           
            // Informações adicionais
            additionalInfo: document.getElementById('additionalInfo').value,
           
            // Outras habilidades
            otherHardSkills: document.getElementById('otherHardSkills').value,
            otherSoftSkills: document.getElementById('otherSoftSkills').value,
           
            // Habilidades selecionadas
            hardSkills: Array.from(document.querySelectorAll('.hard-skill:checked')).map(el => el.value),
            softSkills: Array.from(document.querySelectorAll('.soft-skill:checked')).map(el => el.value),
           
            // Educação, experiência e cursos (estruturas mais complexas)
            education: getEducationData(),
            experience: getExperienceData(),
            courses: getCoursesData()
        };
       
        localStorage.setItem('resumeData', JSON.stringify(formData));
        showNotification('Dados do currículo salvos com sucesso!');
    }
 
    /**
     * Coleta os dados de educação do formulário
     * @returns {Array} Array de objetos com dados de educação
     */
    function getEducationData() {
        const items = document.querySelectorAll('.education-item');
        return Array.from(items).map(item => ({
            level: item.querySelector('.education-level').value,
            course: item.querySelector('.education-course').value,
            institution: item.querySelector('.institution').value,
            status: item.querySelector('.education-status').value,
            year: item.querySelector('.education-year').value,
            shift: item.querySelector('.education-shift').value
        }));
    }
 
    /**
     * Coleta os dados de experiência do formulário
     * @returns {Array} Array de objetos com dados de experiência
     */
    function getExperienceData() {
        const items = document.querySelectorAll('.experience-item');
        return Array.from(items).map(item => ({
            position: item.querySelector('.position').value,
            company: item.querySelector('.company').value,
            period: item.querySelector('.job-period').value,
            description: item.querySelector('.job-description').value
        }));
    }
 
    /**
     * Coleta os dados de cursos complementares do formulário
     * @returns {Array} Array de objetos com dados de cursos
     */
    function getCoursesData() {
        const items = document.querySelectorAll('.course-item');
        return Array.from(items).map(item => ({
            name: item.querySelector('.course-name').value,
            institution: item.querySelector('.course-institution').value,
            hours: item.querySelector('.course-hours').value,
            year: item.querySelector('.course-year').value
        }));
    }
 
    /**
     * Carrega os dados salvos do localStorage para o formulário
     */
    function loadFormData() {
        const savedData = localStorage.getItem('resumeData');
        if (!savedData) return;
       
        const formData = JSON.parse(savedData);
       
        // Preencher informações pessoais
        document.getElementById('name').value = formData.name || '';
        document.getElementById('birthplace').value = formData.birthplace || '';
        document.getElementById('maritalStatus').value = formData.maritalStatus || '';
        document.getElementById('age').value = formData.age || '';
        document.getElementById('neighborhood').value = formData.neighborhood || '';
        document.getElementById('city').value = formData.city || '';
        document.getElementById('state').value = formData.state || '';
        document.getElementById('phone1').value = formData.phone1 || '';
        document.getElementById('phone2').value = formData.phone2 || '';
        document.getElementById('email').value = formData.email || '';
        document.getElementById('license').value = formData.license || '';
       
        // Preencher objetivo e síntese
        document.getElementById('objective').value = formData.objective || '';
        document.getElementById('qualificationSummary').value = formData.qualificationSummary || '';
       
        // Preencher informações adicionais
        document.getElementById('additionalInfo').value = formData.additionalInfo || '';
       
        // Preencher outras habilidades
        document.getElementById('otherHardSkills').value = formData.otherHardSkills || '';
        document.getElementById('otherSoftSkills').value = formData.otherSoftSkills || '';
       
        // Marcar habilidades selecionadas
        if (formData.hardSkills) {
            formData.hardSkills.forEach(skill => {
                const checkbox = document.querySelector(`.hard-skill[value="${skill}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
       
        if (formData.softSkills) {
            formData.softSkills.forEach(skill => {
                const checkbox = document.querySelector(`.soft-skill[value="${skill}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
       
        // Carregar educação, experiência e cursos
        loadComplexData('education', formData.education, FormHandlers.createEducationItem);
        loadComplexData('experience', formData.experience, FormHandlers.createExperienceItem);
        loadComplexData('courses', formData.courses, FormHandlers.createCourseItem);
    }
 
    /**
     * Função auxiliar para carregar dados complexos (educação, experiência, cursos)
     * @param {string} type - Tipo de dados (education, experience, courses)
     * @param {Array} data - Array de objetos com dados
     * @param {Function} createItemFunc - Função para criar novos itens
     */
    function loadComplexData(type, data, createItemFunc) {
        if (!data || !data.length) return;
       
        // Remover o item inicial vazio
        const container = document.getElementById(`${type}-container`);
        container.innerHTML = '';
       
        // Adicionar os itens salvos
        data.forEach(itemData => {
            const newItem = createItemFunc();
           
            // Preencher os campos com os dados salvos
            Object.keys(itemData).forEach(key => {
                const element = newItem.querySelector(`.${key}`) ||
                                newItem.querySelector(`.${type}-${key}`);
                if (element && itemData[key]) {
                    element.value = itemData[key];
                }
            });
        });
    }
 
    /**
     * Exibe uma notificação temporária
     * @param {string} message - Mensagem a ser exibida
     */
    function showNotification(message) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#2ecc71';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.5s';
       
        // Adicionar ao corpo do documento
        document.body.appendChild(notification);
       
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
 
    /**
     * Limpa todos os dados salvos no localStorage
     */
    function clearSavedData() {
        if (confirm('Tem certeza que deseja limpar todos os dados salvos? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('resumeData');
            showNotification('Dados limpos com sucesso!');
            location.reload(); // Recarregar a página para limpar o formulário
        }
    }
 
    // API pública
    return {
        saveFormData,
        loadFormData,
        clearSavedData
    };
})();