/**
 * Arquivo principal que inicializa a aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Inicializar manipuladores de formulário e carregar dados
    if (typeof FormHandlers !== 'undefined' && FormHandlers.initializeFormHandlers) {
        FormHandlers.initializeFormHandlers();
    }
    
    DataStorage.loadFormData();
    
    // 2. NOVO PASSO: Configurar o preview em tempo real
    if (typeof RealtimePreviewSetup !== 'undefined' && RealtimePreviewSetup.initialize) {
        RealtimePreviewSetup.initialize();
    }
    
    // 3. Adicionar eventos para botões de ação
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', DataStorage.saveFormData);
    }
    
    const exportWordBtn = document.getElementById('exportWordBtn');
    if (exportWordBtn && typeof ExportUtils !== 'undefined' && ExportUtils.exportToWord) {
        // Mantenha o type="button" no HTML para não submeter
        exportWordBtn.addEventListener('click', ExportUtils.exportToWord); 
    }

    // 4. Se você seguiu o passo anterior, o generateBtn é type="button" 
    // e não precisa de um listener extra, pois o RealtimePreviewSetup.initialize 
    // já lida com as mudanças.
    
    // (Lógica de notificação mantida)
    if (localStorage.getItem('resumeData')) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'Dados carregados do armazenamento local';
        // ... Estilos e timeout
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#3498db';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        notification.style.zIndex = '1000';
        notification.style.transition = 'opacity 0.5s';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
    // RealtimePreview
if (typeof RealtimePreviewSetup !== 'undefined' && RealtimePreviewSetup.initialize) {
    RealtimePreviewSetup.initialize();
}

});