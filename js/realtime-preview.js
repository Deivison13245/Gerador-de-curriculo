/**
 * Módulo responsável por atualizar o currículo em tempo real,
 * sempre que qualquer campo for alterado.
 */
const RealtimePreviewSetup = (function () {

    let updateTimer = null;

    /**
     * Inicializa listeners em todos os campos para atualizar o preview
     */
    function initialize() {
        const form = document.getElementById('resumeForm');

        if (!form) return;

        // Listener geral: qualquer mudança → atualiza o preview
        form.addEventListener('input', debounceRealtimeUpdate);
        form.addEventListener('change', debounceRealtimeUpdate);

        // Primeiro carregamento já gera o preview
        generatePreview();
    }

    /**
     * Evita que o preview gere 100 vezes por segundo
     */
    function debounceRealtimeUpdate() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(generatePreview, 150);
    }

    /**
     * Chama o gerador de currículo
     */
    function generatePreview() {
        if (typeof ResumeGenerator !== 'undefined' &&
            ResumeGenerator.generateResume) {
            ResumeGenerator.generateResume();
        }
    }

    return {
        initialize
    };

})();
