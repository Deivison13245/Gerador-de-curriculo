/**
 * Arquivo principal que inicializa a aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar manipuladores de formulário
    FormHandlers.initializeFormHandlers();
    
    // Carregar dados salvos
    DataStorage.loadFormData();
    
    // Inicializar auto-save contínuo
    DataStorage.initializeAutoSave();
    
    // Adicionar eventos para botões de ação
    document.getElementById('saveBtn').addEventListener('click', DataStorage.saveFormData);
    document.getElementById('exportWordBtn').addEventListener('click', ExportUtils.exportToWord);
    
    // Inicializar a visualização em tempo real
    RealtimePreview.initialize();
    
    // Verificar se há dados salvos e mostrar notificação
    if (localStorage.getItem('resumeData')) {
        showNotification('Dados carregados com sucesso!', 'info');
    }
});

/**
 * Exibe uma notificação temporária
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.transition = 'opacity 0.5s';
    
    // Definir cor com base no tipo
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#2ecc71';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            notification.style.color = 'white';
            break;
        case 'info':
            notification.style.backgroundColor = '#3498db';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2ecc71';
            notification.style.color = 'white';
    }
    
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

// Tornar a função showNotification global
window.showNotification = showNotification;