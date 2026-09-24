/**
 * Módulo para gerar o currículo a partir dos dados do formulário
 */
const ResumeGenerator = (function() {
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
            noExperience: 'Sem experiências profissionais anteriores.'
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
            noExperience: 'No previous professional experience listed.'
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
            noExperience: 'Sin experiencia laboral previa registrada.'
        }
    };

    /**
     * Gera o currículo HTML com base nos dados do formulário
     */
    function generateResume() {
        const lang = (typeof RealtimePreview !== 'undefined' && typeof RealtimePreview.getLanguage === 'function')
            ? RealtimePreview.getLanguage()
            : (window.currentResumeLanguage || 'pt');
        const t = SECTION_TITLES[lang] || SECTION_TITLES.pt;

        // Coletar informações pessoais
        const name = document.getElementById('name').value;
        const birthplace = document.getElementById('birthplace').value;
        const maritalStatus = document.getElementById('maritalStatus').value;
        const age = document.getElementById('age').value;
        const neighborhood = document.getElementById('neighborhood').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const phone1 = document.getElementById('phone1').value;
        const phone2 = document.getElementById('phone2').value;
        const email = document.getElementById('email').value;
        const license = document.getElementById('license').value;
        
        // Coletar objetivo e síntese
        const objective = document.getElementById('objective').value;
        const qualificationSummary = document.getElementById('qualificationSummary').value;
        
        // Coletar formação acadêmica
        const educationHTML = generateEducationHTML();
        
        // Coletar experiência profissional
        const experienceHTML = generateExperienceHTML();
        
        // Coletar cursos complementares
        const coursesHTML = generateCoursesHTML();
        
        // Coletar habilidades
        const skillsHTML = generateSkillsHTML(lang);
        
        // Coletar informações complementares
        const additionalInfo = document.getElementById('additionalInfo').value;
        
        // Construir o cabeçalho do currículo
        let headerHTML = `<h1>${name}</h1>`;
        
        // Linha de naturalidade, estado civil e idade
        let personalInfoLine = '';
        if (birthplace) personalInfoLine += (lang === 'en' ? `From ${birthplace}` : lang === 'es' ? `Natural de ${birthplace}` : `Natural de ${birthplace}`);
        if (birthplace && (maritalStatus || age)) personalInfoLine += ', ';
        if (maritalStatus) personalInfoLine += `${maritalStatus}`;
        if ((birthplace || maritalStatus) && age) personalInfoLine += ', ';
        if (age) personalInfoLine += (lang === 'en' ? `${age} years old` : lang === 'es' ? `${age} años` : `${age} anos`);
        
        // Linha de endereço
        let addressLine = '';
        if (neighborhood) addressLine += neighborhood;
        if (neighborhood && (city || state)) addressLine += ', ';
        if (city) addressLine += city;
        if ((neighborhood || city) && state) addressLine += ' - ';
        if (state) addressLine += state;
        
        // Linha de telefones
        let phoneLine = '';
        if (phone1) phoneLine += phone1;
        if (phone1 && phone2) phoneLine += '; ';
        if (phone2) phoneLine += `${phone2}`;
        
        // Montar o currículo
        const resumeHTML = `
            <div class="resume">
                <div class="resume-header">
                    ${headerHTML}
                    ${personalInfoLine ? `<p>${personalInfoLine}</p>` : ''}
                    ${addressLine ? `<p>${addressLine}</p>` : ''}
                </div>
                
                <div class="resume-contact">
                    ${phoneLine ? `<p>${phoneLine}</p>` : ''}
                    ${email ? `<p>${email}</p>` : ''}
                    ${license ? `<p>CNH: ${license}</p>` : ''}
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-objective">${t.objective}</h2>
                    <p>${objective}</p>
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-qualification-summary">${t.qualificationSummary}</h2>
                    <p>${qualificationSummary}</p>
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-education">${t.education}</h2>
                    ${educationHTML}
                </div>
                
                <div class="resume-section">
                    <h2 id="heading-experience">${t.experience}</h2>
                    ${experienceHTML || `<p>${t.noExperience}</p>`}
                </div>
                
                ${coursesHTML ? `
                <div class="resume-section">
                    <h2 id="heading-courses">${t.courses}</h2>
                    ${coursesHTML}
                </div>
                ` : ''}
                
                ${skillsHTML ? `
                <div class="resume-section">
                    <h2 id="heading-skills">${t.skills}</h2>
                    ${skillsHTML}
                </div>
                ` : ''}
                
                ${additionalInfo ? `
                <div class="resume-section">
                    <h2 id="heading-additional-info">${t.additionalInfo}</h2>
                    <p>${additionalInfo}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        // Exibir o currículo gerado
        document.getElementById('resumePreview').innerHTML = resumeHTML;
        
        // Rolar até a visualização do currículo
        document.getElementById('resumePreview').scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Gera o HTML para a seção de educação
     * @returns {string} HTML formatado
     */
        function generateEducationHTML() {
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
        
        return educationHTML;
    }

    /**
     * Gera o HTML para a seção de experiência
     * @returns {string} HTML formatado
     */
        function generateExperienceHTML() {
        const experienceItems = document.querySelectorAll('.experience-item');
        let experienceHTML = '';
        
        experienceItems.forEach(item => {
            const position = item.querySelector('.position')?.value?.trim() || '';
            const company = item.querySelector('.company')?.value?.trim() || '';
            const period = item.querySelector('.job-period')?.value?.trim() || '';
            const description = item.querySelector('.job-description')?.value?.trim() || '';
            
            const headerParts = [position, company, period].filter(Boolean);
            if (headerParts.length > 0 || description) {
                experienceHTML += `
                    <div class="resume-item">
                        ${headerParts.length > 0 ? `<p><strong>● ${headerParts.join(' | ')}</strong></p>` : ''}
                        ${description ? `<p>${description}</p>` : ''}
                    </div>
                `;
            }
        });
        
        return experienceHTML;
    }

    /**
     * Gera o HTML para a seção de cursos complementares
     * @returns {string} HTML formatado
     */
    function generateCoursesHTML() {
        const courseItems = document.querySelectorAll('.course-item');
        let coursesHTML = '';
        
        courseItems.forEach(item => {
            const courseName = item.querySelector('.course-name').value;
            const institution = item.querySelector('.course-institution').value;
            const hours = item.querySelector('.course-hours').value;
            const year = item.querySelector('.course-year').value;
            
            if (courseName && institution) {
                let courseText = `${courseName} | ${institution}`;
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
        
        return coursesHTML;
    }

    /**
     * Gera o HTML para a seção de habilidades
     * @returns {string} HTML formatado
     */
    function generateSkillsHTML(lang = 'pt') {
        const hardSkills = [];
        document.querySelectorAll('.hard-skill:checked').forEach(checkbox => {
            if (checkbox.value) hardSkills.push(checkbox.value.trim());
        });
        
        const softSkills = [];
        document.querySelectorAll('.soft-skill:checked').forEach(checkbox => {
            if (checkbox.value) softSkills.push(checkbox.value.trim());
        });
        
        const otherHard = document.getElementById('otherHardSkills')?.value || '';
        if (otherHard) {
            otherHard.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (!hardSkills.includes(s)) hardSkills.push(s);
            });
        }
        
        const otherSoft = document.getElementById('otherSoftSkills')?.value || '';
        if (otherSoft) {
            otherSoft.split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
                if (!softSkills.includes(s)) softSkills.push(s);
            });
        }
        
        const t = SECTION_TITLES[lang] || SECTION_TITLES.pt;
        let skillsHTML = '';
        if (hardSkills.length > 0 || softSkills.length > 0) {
            if (hardSkills.length > 0) {
                skillsHTML += `<p style="margin-bottom: 6px;"><strong>${t.hardSkillsLabel}:</strong> ${hardSkills.join(', ')}</p>`;
            }
            if (softSkills.length > 0) {
                skillsHTML += `<p><strong>${t.softSkillsLabel}:</strong> ${softSkills.join(', ')}</p>`;
            }
        }
        
        return skillsHTML;
    }

    // API pública
    return {
        generateResume
    };
})();