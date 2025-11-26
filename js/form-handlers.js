/**
 * Módulo para gerenciar os manipuladores de formulário e interações do usuário
 */
const FormHandlers = (function() {
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
       
        // Modal de síntese
        initializeSynthesisModal();
       
        // Formulário principal
        document.getElementById('resumeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            ResumeGenerator.generateResume();
        });
       
        // Botão de limpar
        document.getElementById('clearBtn').addEventListener('click', function(e) {
            if (confirm('Tem certeza que deseja limpar o formulário? Todos os dados não salvos serão perdidos.')) {
                return true; // Permite que o reset padrão ocorra
            }
            e.preventDefault(); // Cancela o reset se o usuário não confirmar
        });
    }
 
    /**
     * Inicializa o modal de síntese de qualificações
     */
    function initializeSynthesisModal() {
        const modal = document.getElementById('synthesisModal');
        const generateSynthesisBtn = document.getElementById('generateSynthesis');
        const closeBtn = document.getElementsByClassName('close')[0];
       
        // Abrir modal
        generateSynthesisBtn.addEventListener('click', function() {
            modal.style.display = 'block';
        });
       
        // Fechar modal
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
       
        // Fechar modal ao clicar fora dele
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
               
                document.getElementById('qualificationSummary').value = synthesisText;
                modal.style.display = 'none';
            });
        });
       
        // Gerar síntese personalizada
        document.getElementById('generateCustomSynthesis').addEventListener('click', function() {
            // Coletar hard skills selecionadas
            const selectedHardSkills = [];
            document.querySelectorAll('.modal-hard-skill:checked').forEach(checkbox => {
                selectedHardSkills.push(checkbox.value);
            });
           
            // Coletar soft skills selecionadas
            const selectedSoftSkills = [];
            document.querySelectorAll('.modal-soft-skill:checked').forEach(checkbox => {
                selectedSoftSkills.push(checkbox.value);
            });
           
            // Verificar se foram selecionadas skills suficientes
            if (selectedHardSkills.length < 1 || selectedSoftSkills.length < 1) {
                alert('Por favor, selecione pelo menos uma hard skill e uma soft skill.');
                return;
            }
           
            // Limitar a 5 skills de cada tipo
            const hardSkills = selectedHardSkills.slice(0, 5);
            const softSkills = selectedSoftSkills.slice(0, 5);
           
            // Obter informações do formulário para personalizar a síntese
            const educationLevel = document.querySelector('.education-level') ?
                                document.querySelector('.education-level').value : '';
            const course = document.querySelector('.education-course') ?
                        document.querySelector('.education-course').value : '';
            const institution = document.querySelector('.institution') ?
                            document.querySelector('.institution').value : '';
           
            // Gerar texto de síntese personalizada
            let synthesisText = '';
           
            // Primeira parte - formação
            if (educationLevel && course && institution) {
                synthesisText += `Estudante do curso ${educationLevel} em ${course} pelo(a) ${institution}, `;
            } else {
                synthesisText += 'Profissional ';
            }
           
            // Segunda parte - hard skills
            synthesisText += `com conhecimentos em ${formatSkillsList(hardSkills)}. `;
           
            // Terceira parte - soft skills
            synthesisText += `Destaca-se por ${formatSkillsList(softSkills)}, `;
           
            // Conclusão
            synthesisText += 'demonstrando interesse em se desenvolver profissionalmente e contribuir para o crescimento da organização.';
           
            // Atualizar o campo de síntese
            document.getElementById('qualificationSummary').value = synthesisText;
           
            // Fechar o modal
            modal.style.display = 'none';
        });
    }
 
    /**
     * Formata uma lista de habilidades para texto natural
     * @param {Array} skills - Lista de habilidades
     * @returns {string} Lista formatada
     */
    function formatSkillsList(skills) {
        if (skills.length === 1) {
            return skills[0];
        } else if (skills.length === 2) {
            return `${skills[0]} e ${skills[1]}`;
        } else {
            const lastSkill = skills.pop();
            return `${skills.join(', ')} e ${lastSkill}`;
        }
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
       
        // Adicionar evento para remover
        newItem.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
       
        return newItem;
    }
 
    /**
     * Cria um novo item de experiência
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
                <label>Descrição das atividades (mínimo duas linhas)</label>
                <textarea class="job-description" rows="3" required></textarea>
            </div>
            <button type="button" class="remove-btn">Remover</button>
        `;
        container.appendChild(newItem);
       
        // Adicionar evento para remover
        newItem.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
       
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
       
        // Adicionar evento para remover
        newItem.querySelector('.remove-btn').addEventListener('click', handleRemoveItem);
       
        return newItem;
    }
 
    // API pública
    return {
        initializeFormHandlers,
        createEducationItem,
        createExperienceItem,
        createCourseItem
    };
})();