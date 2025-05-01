/**
 * 调试辅助脚本 - 帮助诊断扩展程序问题
 */

(function() {
  // 全局调试开关
  window.DEBUG_EXTENSION = true;
  
  // 记录日志的函数
  function debugLog(...args) {
    if (window.DEBUG_EXTENSION) {
      console.log('[Debug Helper]', ...args);
    }
  }
  
  // 错误处理函数
  function logError(error, context) {
    console.error(`[Debug Helper] Error in ${context}:`, error);
  }
  
  // 检查DOM是否加载完成
  function checkDOMLoaded() {
    debugLog('检查DOM加载情况...');
    if (document.readyState === 'loading') {
      debugLog('DOM正在加载中...');
      document.addEventListener('DOMContentLoaded', analyzeDOM);
    } else {
      debugLog('DOM已加载完成');
      analyzeDOM();
    }
  }
  
  // 分析DOM结构
  function analyzeDOM() {
    try {
      debugLog('开始分析DOM结构...');
      
      // 检查body是否存在
      const bodyExists = !!document.body;
      debugLog('Body存在: ', bodyExists);
      
      // 检查main元素
      const mainElement = document.querySelector('main');
      debugLog('Main元素存在: ', !!mainElement);
      
      // 检查可能的操作区域
      const possibleActionAreas = [
        { selector: '.chat-actions', exists: !!document.querySelector('.chat-actions') },
        { selector: '.custom-chat-actions', exists: !!document.querySelector('.custom-chat-actions') },
        { selector: '.action-buttons', exists: !!document.querySelector('.action-buttons') },
        { selector: 'form>div>div', exists: !!document.querySelector('form>div>div') },
        { selector: 'main>div>div:last-child', exists: !!document.querySelector('main>div>div:last-child') }
      ];
      
      debugLog('可能的操作区域: ', possibleActionAreas);
      
      // 检查页面特征
      const pageFeatures = {
        isLoginPage: !!document.querySelector('form[action*="login"]'),
        hasTextField: !!document.querySelector('textarea'),
        hasChat: !!document.querySelector('.message, .chat-message'),
        urlPath: window.location.pathname
      };
      
      debugLog('页面特征: ', pageFeatures);
      
      // 检查脚本是否加载
      const scriptsLoaded = {
        adapter: typeof window.DOMAdapter === 'function',
        html2canvas: typeof window.html2canvas === 'function',
        jspdf: typeof window.jspdf === 'object'
      };
      
      debugLog('脚本加载情况: ', scriptsLoaded);
      
      // 创建诊断信息
      const diagnosticInfo = {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        bodyExists,
        mainElementExists: !!mainElement,
        possibleActionAreas,
        pageFeatures,
        scriptsLoaded
      };
      
      // 显示诊断信息
      displayDiagnosticInfo(diagnosticInfo);
      
      // 注册MutationObserver以监视DOM变化
      setupMutationObserver();
    } catch (error) {
      logError(error, 'analyzeDOM');
      // 即使出错，也尝试显示诊断面板
      try {
        displayDiagnosticInfo({
          error: error.toString(),
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      } catch (displayError) {
        logError(displayError, 'displayErrorPanel');
      }
    }
  }
  
  // 监视DOM变化
  function setupMutationObserver() {
    try {
      debugLog('设置DOM变化监视器...');
      
      // 创建观察器实例
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 检查是否有新的操作区域添加
            const addedActionsArea = Array.from(mutation.addedNodes).some(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                return node.classList?.contains('chat-actions') || 
                       node.classList?.contains('custom-chat-actions') ||
                       node.querySelector?.('.chat-actions, .custom-chat-actions');
              }
              return false;
            });
            
            if (addedActionsArea) {
              debugLog('检测到新的操作区域添加，重新分析DOM');
              analyzeDOM();
            }
          }
        }
      });
      
      // 开始观察document.body
      observer.observe(document.body, { childList: true, subtree: true });
      debugLog('DOM变化监视器已设置');
    } catch (error) {
      logError(error, 'setupMutationObserver');
    }
  }
  
  // 显示诊断信息
  function displayDiagnosticInfo(info) {
    try {
      debugLog('诊断信息: ', info);
      
      // 如果已存在面板，先移除
      const existingPanel = document.getElementById('debug-helper-panel');
      if (existingPanel) {
        existingPanel.remove();
      }
      
      // 创建诊断信息面板
      const panel = document.createElement('div');
      panel.id = 'debug-helper-panel';
      panel.style.position = 'fixed';
      panel.style.bottom = '10px';
      panel.style.left = '10px';
      panel.style.width = '350px'; // 更宽的面板
      panel.style.maxHeight = '500px'; // 更高的最大高度
      panel.style.overflow = 'auto';
      panel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; // 更深的背景色
      panel.style.color = '#fff';
      panel.style.padding = '15px';
      panel.style.borderRadius = '8px';
      panel.style.zIndex = '100001'; // 比操作区域更高的z-index
      panel.style.fontSize = '14px'; // 更大的字体
      panel.style.fontFamily = 'Arial, sans-serif'; // 更易读的字体
      panel.style.boxShadow = '0 0 20px rgba(255, 153, 0, 0.8)'; // 醒目的橙色阴影
      panel.style.border = '2px solid #ff9900'; // 橙色边框
      
      // 创建标题
      const title = document.createElement('h3');
      title.textContent = '扩展诊断面板';
      title.style.margin = '0 0 15px 0';
      title.style.color = '#ff9900';
      title.style.fontSize = '18px';
      title.style.textAlign = 'center';
      title.style.textShadow = '0 0 5px rgba(255, 153, 0, 0.5)';
      panel.appendChild(title);
      
      // URL 信息
      addDiagnosticItem(panel, 'URL', info.url);
      
      // 时间戳
      addDiagnosticItem(panel, '时间', info.timestamp);
      
      // Body状态
      addDiagnosticItem(panel, 'Body存在', info.bodyExists ? '✅ 是' : '❌ 否');
      
      // Main元素状态
      addDiagnosticItem(panel, 'Main元素存在', info.mainElementExists ? '✅ 是' : '❌ 否');
      
      // 页面特征，如果有
      if (info.pageFeatures) {
        const featuresEl = document.createElement('div');
        featuresEl.innerHTML = '<strong>页面特征: </strong>';
        const featuresList = document.createElement('ul');
        featuresList.style.margin = '5px 0';
        featuresList.style.paddingLeft = '20px';
        
        Object.entries(info.pageFeatures).forEach(([name, value]) => {
          const item = document.createElement('li');
          item.textContent = `${name}: ${value}`;
          featuresList.appendChild(item);
        });
        
        featuresEl.appendChild(featuresList);
        panel.appendChild(featuresEl);
      }
      
      // 可能的操作区域
      if (info.possibleActionAreas) {
        const actionAreasEl = document.createElement('div');
        actionAreasEl.innerHTML = '<strong>操作区域: </strong>';
        const list = document.createElement('ul');
        list.style.margin = '5px 0';
        list.style.paddingLeft = '20px';
        
        info.possibleActionAreas.forEach(area => {
          const item = document.createElement('li');
          item.textContent = `${area.selector}: ${area.exists ? '✅ 找到' : '❌ 未找到'}`;
          list.appendChild(item);
        });
        
        actionAreasEl.appendChild(list);
        panel.appendChild(actionAreasEl);
      }
      
      // 脚本加载情况
      if (info.scriptsLoaded) {
        const scriptsEl = document.createElement('div');
        scriptsEl.innerHTML = '<strong>脚本加载: </strong>';
        const scriptsList = document.createElement('ul');
        scriptsList.style.margin = '5px 0';
        scriptsList.style.paddingLeft = '20px';
        
        Object.entries(info.scriptsLoaded).forEach(([name, loaded]) => {
          const item = document.createElement('li');
          item.textContent = `${name}: ${loaded ? '✅ 已加载' : '❌ 未加载'}`;
          scriptsList.appendChild(item);
        });
        
        scriptsEl.appendChild(scriptsList);
        panel.appendChild(scriptsEl);
      }
      
      // 错误信息，如果有
      if (info.error) {
        const errorEl = document.createElement('div');
        errorEl.style.color = '#ff4444';
        errorEl.style.marginTop = '10px';
        errorEl.style.padding = '5px';
        errorEl.style.border = '1px solid #ff4444';
        errorEl.style.borderRadius = '3px';
        errorEl.innerHTML = `<strong>错误: </strong>${info.error}`;
        panel.appendChild(errorEl);
      }
      
      // 添加特殊提示
      const noteEl = document.createElement('div');
      noteEl.style.marginTop = '15px';
      noteEl.style.padding = '10px';
      noteEl.style.backgroundColor = 'rgba(255, 153, 0, 0.2)';
      noteEl.style.borderRadius = '5px';
      noteEl.style.border = '1px dashed #ff9900';
      noteEl.innerHTML = '<strong>重要提示:</strong> 如果未看到功能按钮，请使用下方的"创建操作区域"和"创建功能按钮"选项。';
      panel.appendChild(noteEl);
      
      // 添加操作按钮区域
      const actionsContainer = document.createElement('div');
      actionsContainer.style.marginTop = '15px';
      actionsContainer.style.display = 'flex';
      actionsContainer.style.flexDirection = 'column';
      actionsContainer.style.gap = '10px';
      
      // 添加创建自定义操作区域的按钮
      const createActionBtn = document.createElement('button');
      createActionBtn.textContent = '创建操作区域';
      createActionBtn.style.backgroundColor = '#4CAF50';
      createActionBtn.style.color = 'white';
      createActionBtn.style.padding = '10px 15px';
      createActionBtn.style.border = 'none';
      createActionBtn.style.borderRadius = '5px';
      createActionBtn.style.cursor = 'pointer';
      createActionBtn.style.fontWeight = 'bold';
      createActionBtn.style.fontSize = '16px';
      createActionBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      createActionBtn.onclick = function() {
        try {
          // 使用content_script.js中的函数创建自定义操作区域
          if (typeof window.createFallbackActionsArea === 'function') {
            window.createFallbackActionsArea();
          } else {
            // 备用创建方法
            const actionContainer = document.createElement('div');
            actionContainer.className = 'custom-chat-actions';
            actionContainer.style.position = 'fixed';
            actionContainer.style.bottom = '100px';
            actionContainer.style.left = '0';
            actionContainer.style.right = '0';
            actionContainer.style.display = 'flex';
            actionContainer.style.justifyContent = 'center';
            actionContainer.style.padding = '15px';
            actionContainer.style.backgroundColor = '#f0f0f0';
            actionContainer.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';
            actionContainer.style.borderTop = '2px solid #ff9900';
            actionContainer.style.zIndex = '100000';
            document.body.appendChild(actionContainer);
          }
          
          debugLog('已创建自定义操作区域');
          alert('已创建操作区域！现在请点击"创建功能按钮"添加功能按钮。');
          
          // 刷新面板
          setTimeout(analyzeDOM, 500);
        } catch (error) {
          logError(error, 'createActionArea');
          alert('创建操作区域失败: ' + error.message);
        }
      };
      
      actionsContainer.appendChild(createActionBtn);
      
      // 添加创建按钮的按钮
      const createButtonsBtn = document.createElement('button');
      createButtonsBtn.textContent = '创建功能按钮';
      createButtonsBtn.style.backgroundColor = '#2196F3';
      createButtonsBtn.style.color = 'white';
      createButtonsBtn.style.padding = '10px 15px';
      createButtonsBtn.style.border = 'none';
      createButtonsBtn.style.borderRadius = '5px';
      createButtonsBtn.style.cursor = 'pointer';
      createButtonsBtn.style.fontWeight = 'bold';
      createButtonsBtn.style.fontSize = '16px';
      createButtonsBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      createButtonsBtn.onclick = function() {
        try {
          const actionArea = document.querySelector('.custom-chat-actions');
          if (actionArea) {
            createActionButtons(actionArea);
            debugLog('已创建功能按钮');
            alert('功能按钮已创建！如果您仍然看不到按钮，尝试滚动页面或刷新。');
          } else {
            alert('未找到操作区域，请先点击"创建操作区域"按钮');
          }
          
          // 刷新面板
          setTimeout(analyzeDOM, 500);
        } catch (error) {
          logError(error, 'createButtons');
          alert('创建按钮失败: ' + error.message);
        }
      };
      
      actionsContainer.appendChild(createButtonsBtn);
      
      // 添加手动注入适配器的按钮
      const injectAdapterBtn = document.createElement('button');
      injectAdapterBtn.textContent = '注入适配器';
      injectAdapterBtn.style.backgroundColor = '#FF9800';
      injectAdapterBtn.style.color = 'white';
      injectAdapterBtn.style.padding = '10px 15px';
      injectAdapterBtn.style.border = 'none';
      injectAdapterBtn.style.borderRadius = '5px';
      injectAdapterBtn.style.cursor = 'pointer';
      injectAdapterBtn.style.fontWeight = 'bold';
      injectAdapterBtn.style.fontSize = '16px';
      injectAdapterBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      injectAdapterBtn.onclick = function() {
        try {
          window.DOMAdapter = function() {
            this.siteType = 'chatshare';
            this.getActionsArea = function() {
              const area = document.querySelector('.custom-chat-actions');
              if (area) return area;
              
              // 创建固定位置的区域
              const actionContainer = document.createElement('div');
              actionContainer.className = 'custom-chat-actions';
              actionContainer.style.position = 'fixed';
              actionContainer.style.bottom = '20px';
              actionContainer.style.right = '20px';
              actionContainer.style.display = 'flex';
              actionContainer.style.flexDirection = 'column';
              actionContainer.style.justifyContent = 'center';
              actionContainer.style.alignItems = 'center';
              actionContainer.style.padding = '12px';
              actionContainer.style.backgroundColor = 'rgba(247, 247, 248, 0.9)';
              actionContainer.style.border = '1px solid rgba(0, 0, 0, 0.1)';
              actionContainer.style.borderRadius = '8px';
              actionContainer.style.zIndex = '100000';
              actionContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
              document.body.appendChild(actionContainer);
              return actionContainer;
            };
            this.getTryAgainButton = function() { return null; };
            this.isOpenScreen = function() { return false; };
            this.isInConversation = function() { return false; };
            this.isConversationFinished = function() { return true; };
            this.getThreadElement = function() { return document.querySelector('main') || document.body; };
            this.getFormPositionElement = function() { return document.querySelector('form') || null; };
            this.getScrollerElements = function() { return document.body; };
            this.getHiddenElements = function() { return []; };
            this.getMainElement = function() { return document.querySelector('main') || document.body; };
            this.getSpacerElement = function() { return null; };
          };
          debugLog('已注入简化适配器');
          alert('已注入简化适配器，请按顺序点击"创建操作区域"和"创建功能按钮"');
        } catch (error) {
          logError(error, 'injectAdapter');
          alert('注入适配器失败: ' + error.message);
        }
      };
      
      actionsContainer.appendChild(injectAdapterBtn);
      
      // 添加刷新按钮
      const refreshBtn = document.createElement('button');
      refreshBtn.textContent = '刷新分析';
      refreshBtn.style.backgroundColor = '#9C27B0';
      refreshBtn.style.color = 'white';
      refreshBtn.style.padding = '10px 15px';
      refreshBtn.style.border = 'none';
      refreshBtn.style.borderRadius = '5px';
      refreshBtn.style.cursor = 'pointer';
      refreshBtn.style.fontWeight = 'bold';
      refreshBtn.style.fontSize = '16px';
      refreshBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      refreshBtn.onclick = function() {
        analyzeDOM();
        alert('已刷新分析！');
      };
      
      actionsContainer.appendChild(refreshBtn);
      
      // 添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭面板';
      closeBtn.style.backgroundColor = '#f44336';
      closeBtn.style.color = 'white';
      closeBtn.style.padding = '10px 15px';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '5px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontWeight = 'bold';
      closeBtn.style.fontSize = '16px';
      closeBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      
      closeBtn.onclick = function() {
        panel.remove();
      };
      
      actionsContainer.appendChild(closeBtn);
      panel.appendChild(actionsContainer);
      
      // 将面板添加到页面
      document.body.appendChild(panel);
      
      // 添加脉冲动画效果
      const pulse = document.createElement('style');
      pulse.innerText = `
        @keyframes pulse {
          0% { box-shadow: 0 0 20px rgba(255, 153, 0, 0.8); }
          50% { box-shadow: 0 0 30px rgba(255, 153, 0, 1); }
          100% { box-shadow: 0 0 20px rgba(255, 153, 0, 0.8); }
        }
        #debug-helper-panel {
          animation: pulse 2s infinite;
        }
      `;
      document.head.appendChild(pulse);
      
      // 确保面板不会被移除
      preservePanel(panel);
    } catch (error) {
      logError(error, 'displayDiagnosticInfo');
    }
  }
  
  // 创建功能按钮
  function createActionButtons(container) {
    try {
      // 移除旧按钮
      container.querySelectorAll('button[share-ext]').forEach(btn => btn.remove());
      
      // 创建按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '8px';
      
      // 创建PNG按钮
      const pngButton = document.createElement('button');
      pngButton.className = 'btn action-button';
      pngButton.id = 'download-png-button';
      pngButton.innerText = 'Generate PNG';
      pngButton.setAttribute('share-ext', 'true');
      pngButton.style.padding = '8px 14px';
      pngButton.style.backgroundColor = 'rgba(16, 163, 127, 0.2)';
      pngButton.style.color = 'rgb(16, 163, 127)';
      pngButton.style.fontWeight = '500';
      pngButton.style.border = 'none';
      pngButton.style.borderRadius = '4px';
      pngButton.style.cursor = 'pointer';
      pngButton.style.fontSize = '14px';
      pngButton.style.transition = 'background-color 0.2s ease';
      
      pngButton.onmouseover = () => { pngButton.style.backgroundColor = 'rgba(16, 163, 127, 0.3)'; };
      pngButton.onmouseout = () => { pngButton.style.backgroundColor = 'rgba(16, 163, 127, 0.2)'; };
      
      pngButton.onclick = function() {
        debugLog('PNG按钮被点击');
        try {
          if (typeof window.downloadThread === 'function') {
            window.downloadThread();
          } else {
            alert('Generate PNG按钮已点击。请等待处理...');
          }
        } catch (error) {
          logError(error, 'pngButton.onclick');
          alert('调用PNG下载函数时发生错误: ' + error.message);
        }
      };
      
      buttonContainer.appendChild(pngButton);
      
      // 创建PDF按钮
      const pdfButton = document.createElement('button');
      pdfButton.className = 'btn action-button';
      pdfButton.id = 'download-pdf-button';
      pdfButton.innerText = 'Download PDF';
      pdfButton.setAttribute('share-ext', 'true');
      pdfButton.style.padding = '8px 14px';
      pdfButton.style.backgroundColor = 'rgba(16, 163, 127, 0.2)';
      pdfButton.style.color = 'rgb(16, 163, 127)';
      pdfButton.style.fontWeight = '500';
      pdfButton.style.border = 'none';
      pdfButton.style.borderRadius = '4px';
      pdfButton.style.cursor = 'pointer';
      pdfButton.style.fontSize = '14px';
      pdfButton.style.transition = 'background-color 0.2s ease';
      
      pdfButton.onmouseover = () => { pdfButton.style.backgroundColor = 'rgba(16, 163, 127, 0.3)'; };
      pdfButton.onmouseout = () => { pdfButton.style.backgroundColor = 'rgba(16, 163, 127, 0.2)'; };
      
      pdfButton.onclick = function() {
        debugLog('PDF按钮被点击');
        try {
          if (typeof window.downloadThread === 'function') {
            window.downloadThread({ as: 'pdf' });
          } else {
            alert('Download PDF按钮已点击。请等待处理...');
          }
        } catch (error) {
          logError(error, 'pdfButton.onclick');
          alert('调用PDF下载函数时发生错误: ' + error.message);
        }
      };
      
      buttonContainer.appendChild(pdfButton);
      
      // 添加按钮容器到操作区域
      container.appendChild(buttonContainer);
      
      debugLog('已创建功能按钮');
    } catch (error) {
      logError(error, 'createActionButtons');
    }
  }
  
  // 确保面板不会被移除
  function preservePanel(panel) {
    try {
      // 使用MutationObserver来监视面板是否被移除
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
            for (const node of mutation.removedNodes) {
              if (node === panel || (node.nodeType === Node.ELEMENT_NODE && node.contains(panel))) {
                debugLog('检测到面板被移除，重新添加');
                document.body.appendChild(panel);
                break;
              }
            }
          }
        }
      });
      
      // 监视document.body的子节点变化
      observer.observe(document.body, { childList: true, subtree: true });
      
      // 定期检查面板是否还在DOM中
      const intervalId = setInterval(() => {
        if (!document.body.contains(panel) && document.body) {
          debugLog('面板不在DOM中，重新添加');
          document.body.appendChild(panel);
        }
      }, 2000);
      
      // 存储intervalId以备后用
      panel._intervalId = intervalId;
      
      // 当面板被关闭时清除interval
      const originalRemove = panel.remove;
      panel.remove = function() {
        if (panel._intervalId) {
          clearInterval(panel._intervalId);
        }
        observer.disconnect();
        originalRemove.call(panel);
      };
    } catch (error) {
      logError(error, 'preservePanel');
    }
  }
  
  // 添加诊断项目
  function addDiagnosticItem(panel, label, value) {
    const item = document.createElement('div');
    item.style.marginBottom = '5px';
    item.innerHTML = `<strong>${label}: </strong><span>${value}</span>`;
    panel.appendChild(item);
  }
  
  // 初始化
  function init() {
    debugLog('调试辅助脚本已加载');
    
    // 延迟一下，确保页面其他部分已加载
    setTimeout(checkDOMLoaded, 1000);
    
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
      logError(event.error, `全局错误: ${event.message}`);
    });
    
    // 添加未处理的Promise拒绝处理
    window.addEventListener('unhandledrejection', (event) => {
      logError(event.reason, '未处理的Promise拒绝');
    });
  }
  
  // 开始执行
  init();
})(); 