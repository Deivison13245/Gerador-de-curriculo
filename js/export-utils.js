/**
 * Módulo para exportar o currículo para diferentes formatos
 */
const ExportUtils = (function() {
    /**
     * Exporta o currículo para o formato Word (.docx)
     */
    async function exportToWord() {
        // Verificar se o currículo foi gerado
        const resumePreview = document.getElementById('resumePreview');
        if (!resumePreview.innerHTML.trim()) {
            alert('Por favor, gere o currículo antes de exportar para Word.');
            return;
        }
        
        // Obter os dados do currículo
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
        const objective = document.getElementById('objective').value;
        const qualificationSummary = document.getElementById('qualificationSummary').value;
        const additionalInfo = document.getElementById('additionalInfo').value;
        
        try {
            // Criar um novo documento
            const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;
            
            const lang = (typeof RealtimePreview !== 'undefined' && typeof RealtimePreview.getLanguage === 'function')
                ? RealtimePreview.getLanguage()
                : (window.currentResumeLanguage || 'pt');

            const SECTION_TITLES = {
                pt: {
                    objective: "OBJETIVO",
                    qualificationSummary: "SÍNTESE DE QUALIFICAÇÕES",
                    education: "EDUCAÇÃO",
                    experience: "EXPERIÊNCIAS PROFISSIONAIS/ACADÊMICAS",
                    courses: "CURSOS COMPLEMENTARES",
                    skills: "HABILIDADES",
                    additionalInfo: "INFORMAÇÕES COMPLEMENTARES",
                    hardSkillsLabel: "Hard Skills (Técnicas):",
                    softSkillsLabel: "Soft Skills (Comportamentais):"
                },
                en: {
                    objective: "CAREER OBJECTIVE",
                    qualificationSummary: "SUMMARY OF QUALIFICATIONS",
                    education: "EDUCATION",
                    experience: "PROFESSIONAL EXPERIENCE",
                    courses: "COURSES & CERTIFICATIONS",
                    skills: "SKILLS",
                    additionalInfo: "ADDITIONAL INFORMATION",
                    hardSkillsLabel: "Hard Skills (Technical):",
                    softSkillsLabel: "Soft Skills (Interpersonal):"
                },
                es: {
                    objective: "OBJETIVO PROFESIONAL",
                    qualificationSummary: "RESUMEN DE CUALIFICACIONES",
                    education: "EDUCACIÓN",
                    experience: "EXPERIENCIA PROFESIONAL",
                    courses: "CURSOS Y CERTIFICACIONES",
                    skills: "HABILIDADES",
                    additionalInfo: "INFORMACIÓN ADICIONAL",
                    hardSkillsLabel: "Hard Skills (Técnicas):",
                    softSkillsLabel: "Soft Skills (Habilidades Blandas):"
                }
            };
            const t = SECTION_TITLES[lang] || SECTION_TITLES.pt;

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Cabeçalho - Nome
                        new Paragraph({
                            text: name,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER
                        }),
                        
                        // Informações pessoais
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: `${birthplace ? `${lang === 'en' ? 'From ' : 'Natural de '}${birthplace}` : ''}${birthplace && maritalStatus ? ', ' : ''}${maritalStatus || ''}${(birthplace || maritalStatus) && age ? ', ' : ''}${age ? `${age} ${lang === 'en' ? 'years old' : lang === 'es' ? 'años' : 'anos'}` : ''}`,
                                }),
                            ]
                        }),
                        
                        // Endereço
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: `${neighborhood || ''}${neighborhood && (city || state) ? ', ' : ''}${city || ''}${(neighborhood || city) && state ? ' - ' : ''}${state || ''}`,
                                }),
                            ]
                        }),
                        
                        // Contato
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: `${phone1 || ''}${phone1 && phone2 ? '; ' : ''}${phone2 ? `${phone2}` : ''}`,
                                }),
                            ]
                        }),
                        
                        // Email
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: email || '' }),
                            ]
                        }),
                        
                        // CNH
                        license ? new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: `CNH: ${license}` }),
                            ]
                        }) : null,
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // Objetivo
                        new Paragraph({
                            text: t.objective,
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        new Paragraph({
                            text: objective,
                        }),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // Síntese de Qualificações
                        new Paragraph({
                            text: t.qualificationSummary,
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        new Paragraph({
                            text: qualificationSummary,
                        }),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // Educação
                        new Paragraph({
                            text: t.education,
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        // Adicionar itens de educação
                        ...getEducationParagraphs(),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // Experiências Profissionais
                        new Paragraph({
                            text: t.experience,
                            heading: HeadingLevel.HEADING_2,
                        }),
                        
                        // Adicionar itens de experiência
                        ...getExperienceParagraphs(),
                        
                        // Espaçamento
                        new Paragraph({}),
                        
                        // Cursos Complementares (se houver)
                        ...getCoursesParagraphs(t.courses),
                        
                        // Habilidades (se houver)
                        ...getSkillsParagraphs(t),
                        
                        // Informações Complementares (se houver)
                        ...(additionalInfo ? [
                            new Paragraph({
                                text: t.additionalInfo,
                                heading: HeadingLevel.HEADING_2,
                            }),
                            new Paragraph({
                                text: additionalInfo,
                            }),
                            new Paragraph({})
                        ] : []),
                    ].filter(Boolean) // Remove null items
                }]
            });
            
            // Gerar e baixar o documento
            docx.Packer.toBlob(doc).then(blob => {
                saveAs(blob, `Currículo - ${name}.docx`);
            });
            
        } catch (error) {
            console.error('Erro ao exportar para Word:', error);
            alert('Ocorreu um erro ao exportar para Word. Por favor, tente novamente.');
        }
    }

    /**
     * Obtém parágrafos para a seção de educação
     * @returns {Array} Array de parágrafos
     */
    function getEducationParagraphs() {
        const educationItems = document.querySelectorAll('.education-item');
        const paragraphs = [];
        
        educationItems.forEach(item => {
            const level = item.querySelector('.education-level').value;
            const course = item.querySelector('.education-course').value;
            const institution = item.querySelector('.institution').value;
            const status = item.querySelector('.education-status').value;
            const year = item.querySelector('.education-year').value;
            const shift = item.querySelector('.education-shift').value;
            
            if (level && institution && status && year) {
                let educationText = `● ${level}`;
                if (course) educationText += ` em ${course}`;
                educationText += ` – ${institution} – ${status}`;
                if (year) educationText += `, ${year}`;
                if (shift) educationText += `, ${shift}`;
                
                paragraphs.push(
                    new docx.Paragraph({
                        text: educationText,
                    })
                );
            }
        });
        
        return paragraphs;
    }

    /**
     * Obtém parágrafos para a seção de experiência
     * @returns {Array} Array de parágrafos
     */
    function getExperienceParagraphs() {
        const experienceItems = document.querySelectorAll('.experience-item');
        const paragraphs = [];
        
        if (experienceItems.length === 0 || 
            (experienceItems.length === 1 && 
             !experienceItems[0].querySelector('.position').value)) {
            paragraphs.push(
                new docx.Paragraph({
                    text: "Sem experiências profissionais anteriores.",
                })
            );
            return paragraphs;
        }
        
        experienceItems.forEach(item => {
            const position = item.querySelector('.position').value;
            const company = item.querySelector('.company').value;
            const period = item.querySelector('.job-period').value;
            const description = item.querySelector('.job-description').value;
            
            if (position && company && period) {
                paragraphs.push(
                    new docx.Paragraph({
                        text: `● ${position} | ${company} | ${period}`,
                    }),
                    new docx.Paragraph({
                        text: description,
                    }),
                    new docx.Paragraph({}) // Espaçamento
                );
            }
        });
        
        return paragraphs;
    }

    /**
     * Obtém parágrafos para a seção de cursos
     * @returns {Array} Array de parágrafos
     */
    function getCoursesParagraphs(headingText = "CURSOS COMPLEMENTARES") {
        const courseItems = document.querySelectorAll('.course-item');
        if (courseItems.length === 0 || 
            (courseItems.length === 1 && 
             !courseItems[0].querySelector('.course-name').value)) {
            return [];
        }
        
        const paragraphs = [
            new docx.Paragraph({
                text: headingText,
                heading: docx.HeadingLevel.HEADING_2,
            })
        ];
        
        courseItems.forEach(item => {
            const courseName = item.querySelector('.course-name').value;
            const institution = item.querySelector('.course-institution').value;
            const hours = item.querySelector('.course-hours').value;
            const year = item.querySelector('.course-year').value;
            
            if (courseName && institution) {
                let courseText = `● ${courseName} | ${institution}`;
                if (hours || year) {
                    courseText += ' | ';
                    if (hours) courseText += hours;
                    if (hours && year) courseText += ' ';
                    if (year) courseText += `(${year})`;
                }
                
                paragraphs.push(
                    new docx.Paragraph({
                        text: courseText,
                    })
                );
            }
        });
        
        paragraphs.push(new docx.Paragraph({})); // Espaçamento
        return paragraphs;
    }

    /**
     * Obtém parágrafos para a seção de habilidades
     * @returns {Array} Array de parágrafos
     */
    function getSkillsParagraphs(t = { skills: "HABILIDADES", hardSkillsLabel: "Hard Skills (Técnicas):", softSkillsLabel: "Soft Skills (Comportamentais):" }) {
        const hardSkills = [];
        document.querySelectorAll('.hard-skill:checked').forEach(checkbox => {
            hardSkills.push(checkbox.value);
        });
        
        const softSkills = [];
        document.querySelectorAll('.soft-skill:checked').forEach(checkbox => {
            softSkills.push(checkbox.value);
        });
        
        // Adicionar outras habilidades
        const otherHardSkills = document.getElementById('otherHardSkills').value;
        if (otherHardSkills) {
            otherHardSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    hardSkills.push(trimmedSkill);
                }
            });
        }
        
        const otherSoftSkills = document.getElementById('otherSoftSkills').value;
        if (otherSoftSkills) {
            otherSoftSkills.split(',').forEach(skill => {
                const trimmedSkill = skill.trim();
                if (trimmedSkill) {
                    softSkills.push(trimmedSkill);
                }
            });
        }
        
        if (hardSkills.length === 0 && softSkills.length === 0) {
            return [];
        }
        
        const paragraphs = [
            new docx.Paragraph({
                text: t.skills || "HABILIDADES",
                heading: docx.HeadingLevel.HEADING_2,
            })
        ];
        
        if (hardSkills.length > 0) {
            paragraphs.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: t.hardSkillsLabel || "Hard Skills (Técnicas):",
                            bold: true
                        })
                    ]
                }),
                new docx.Paragraph({
                    text: hardSkills.join(", "),
                })
            );
        }
        
        if (softSkills.length > 0) {
            paragraphs.push(
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: t.softSkillsLabel || "Soft Skills (Comportamentais):",
                            bold: true
                        })
                    ]
                }),
                new docx.Paragraph({
                    text: softSkills.join(", "),
                })
            );
        }
        
        paragraphs.push(new docx.Paragraph({})); // Espaçamento
        return paragraphs;
    }

    /**
     * Imprime o currículo usando a função nativa do navegador
     */
    function printResume() {
        window.print();
    }

    // API pública
    return {
        exportToWord,
        printResume
    };
})();