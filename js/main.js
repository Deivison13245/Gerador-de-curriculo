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
 * Exibe uma notificação temporária no topo (toast)
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Remover notificações anteriores se existirem
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = '✓';
    let bgColor = '#10b981';
    if (type === 'error') {
        icon = '⚠️';
        bgColor = '#ef4444';
    } else if (type === 'info') {
        icon = 'ℹ️';
        bgColor = '#155491';
    }

    notification.innerHTML = `<span style="font-size: 15px;">${icon}</span> <span>${message}</span>`;
    notification.style.backgroundColor = bgColor;
    notification.style.color = '#ffffff';

    document.body.appendChild(notification);
    
    // Remover suavemente após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -20px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Tornar a função showNotification global
window.showNotification = showNotification;