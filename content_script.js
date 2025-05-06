const buttonOuterHTMLFallback = `<button class="btn flex justify-center gap-2 btn-neutral" id="download-png-button">Try Again</button>`;
let domAdapter;

// 日志函数
function log(...args) {
  if (window.DEBUG_EXTENSION) {
    console.log('[ChatGPT Download]', ...args);
  }
}

// 错误处理函数
function handleError(error, context) {
  console.error(`[ChatGPT Download] Error in ${context}:`, error);
}

// 保护扩展不受站点错误影响的辅助函数
function safeExecute(fn, fallback, context) {
  try {
    return fn();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
}

async function init() {
  try {
    log('初始化扩展...');
    if (window.buttonsInterval) {
      clearInterval(window.buttonsInterval);
      log('清除之前的定时器');
    }
    
    // 初始化DOM适配器
    try {
      domAdapter = new DOMAdapter();
      log('DOM适配器已初始化');
    } catch (error) {
      handleError(error, 'DOMAdapter初始化');
      // 显示持久化的调试面板来帮助诊断问题
      showPersistentDebugPanel();
      return;
    }
    
    // 立即创建备用操作区域和添加按钮
    const actionArea = createFallbackActionsArea();
    if (actionArea) {
      log('立即尝试添加按钮');
      
      // 创建按钮容器 - 修改为竖向排列
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'button-container';
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column'; // 改为竖向排列
      buttonContainer.style.justifyContent = 'center';
      buttonContainer.style.gap = '8px';
      
      // PNG按钮
      const button = document.createElement('button');
      button.className = 'btn action-button';
      button.id = 'download-png-button';
      button.innerText = 'Generate PNG';
      button.setAttribute('share-ext', 'true');
      button.style.padding = '8px 14px';
      button.style.backgroundColor = 'rgba(16, 163, 127, 0.2)';
      button.style.color = 'rgb(16, 163, 127)';
      button.style.fontWeight = '500';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.fontSize = '14px';
      button.style.transition = 'background-color 0.2s ease';
      button.onmouseover = () => { button.style.backgroundColor = 'rgba(16, 163, 127, 0.3)'; };
      button.onmouseout = () => { button.style.backgroundColor = 'rgba(16, 163, 127, 0.2)'; };
      button.onclick = () => downloadThread();
      buttonContainer.appendChild(button);

      // PDF按钮
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
      pdfButton.onclick = () => downloadThread({ as: Format.PDF });
      buttonContainer.appendChild(pdfButton);
      
      // 关闭按钮
      const closeButton = document.createElement('button');
      closeButton.className = 'btn action-button';
      closeButton.id = 'close-extension-button';
      closeButton.innerText = '关闭功能';
      closeButton.setAttribute('share-ext', 'true');
      closeButton.style.padding = '8px 14px';
      closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
      closeButton.style.color = 'rgb(220, 53, 69)';
      closeButton.style.fontWeight = '500';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.fontSize = '14px';
      closeButton.style.transition = 'background-color 0.2s ease';
      closeButton.onmouseover = () => { closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.3)'; };
      closeButton.onmouseout = () => { closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.2)'; };
      closeButton.onclick = closeExtensionFeatures;
      buttonContainer.appendChild(closeButton);
      
      // 添加按钮容器到操作区域
      actionArea.appendChild(buttonContainer);
      
      log('已直接添加按钮到备用操作区域');
    }
    
    window.buttonsInterval = setInterval(() => {
      try {
        const actionsArea = safeExecute(() => domAdapter.getActionsArea(), null, 'getActionsArea');
        if (!actionsArea) {
          log('未找到操作区域，尝试创建一个');
          createFallbackActionsArea();
          return;
        }
        
        if (safeExecute(() => shouldAddButtons(actionsArea), false, 'shouldAddButtons')) {
          log('检测到应该添加按钮');
          let TryAgainButton = safeExecute(() => domAdapter.getTryAgainButton(actionsArea), null, 'getTryAgainButton');
          if (!TryAgainButton) {
            log('未找到基础按钮，创建默认按钮');
            const parentNode = document.createElement("div");
            parentNode.innerHTML = buttonOuterHTMLFallback;
            TryAgainButton = parentNode.querySelector("button");
          }
          addActionsButtons(actionsArea, TryAgainButton);
        } else if(safeExecute(() => shouldRemoveButtons(), false, 'shouldRemoveButtons')) {
          log('检测到应该移除按钮');
          removeButtons();
        }
      } catch (error) {
        handleError(error, 'buttonsInterval');
      }
    }, 1000); // 降低检查间隔，以便更快响应
    
    // 显示重新加载通知
    setTimeout(() => {
      // 检查是否有按钮显示
      const buttons = document.querySelectorAll('button[share-ext="true"]');
      if (buttons.length === 0) {
        showReloadNotification();
      }
    }, 5000); // 5秒后检查
    
    log('扩展初始化完成');
  } catch (error) {
    handleError(error, 'init');
    showPersistentDebugPanel();
  }
}

// 创建一个备用的操作区域
function createFallbackActionsArea() {
  try {
    // 检查是否已存在
    const existingArea = document.querySelector('.custom-chat-actions');
    if (existingArea) {
      log('备用操作区域已存在，返回现有区域');
      return existingArea;
    }
    
    log('创建右下角的备用操作区域...');
    const actionContainer = document.createElement("div");
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
    actionContainer.style.backdropFilter = 'blur(8px)';
    actionContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    
    // 添加关闭按钮
    const closeButton = document.createElement('div');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;'; // × 符号
    closeButton.style.position = 'absolute';
    closeButton.style.top = '2px';
    closeButton.style.right = '6px';
    closeButton.style.fontSize = '18px';
    closeButton.style.lineHeight = '18px';
    closeButton.style.color = 'rgba(0, 0, 0, 0.5)';
    closeButton.style.cursor = 'pointer';
    closeButton.style.zIndex = '100001';
    closeButton.title = '关闭扩展功能';
    closeButton.onclick = closeExtensionFeatures;
    actionContainer.appendChild(closeButton);
    
    document.body.appendChild(actionContainer);
    log('已创建备用操作区域，附加到body');
    return actionContainer;
  } catch (error) {
    handleError(error, 'createFallbackActionsArea');
    return null;
  }
}

// 显示持久性调试面板
function showPersistentDebugPanel() {
  try {
    if (document.getElementById('persistent-debug-panel')) {
      return; // 已存在
    }
    
    const panel = document.createElement('div');
    panel.id = 'persistent-debug-panel';
    panel.style.position = 'fixed';
    panel.style.bottom = '20px';
    panel.style.left = '20px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    panel.style.color = '#fff';
    panel.style.padding = '15px';
    panel.style.borderRadius = '8px';
    panel.style.zIndex = '200000';
    panel.style.fontSize = '14px';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.8)';
    panel.style.border = '2px solid #ff0000';
    panel.style.minWidth = '300px';
    
    // 添加动画效果
    const pulseStyle = document.createElement('style');
    pulseStyle.innerText = `
      @keyframes alertPulse {
        0% { background-color: rgba(255, 0, 0, 0.2); box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); }
        50% { background-color: rgba(255, 0, 0, 0.4); box-shadow: 0 0 40px rgba(255, 0, 0, 1); }
        100% { background-color: rgba(255, 0, 0, 0.2); box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); }
      }
      #persistent-debug-panel {
        animation: alertPulse 2s infinite;
      }
    `;
    document.head.appendChild(pulseStyle);
    
    panel.innerHTML = `
      <h3 style="margin:0 0 15px 0;color:#ff3333;font-size:18px;text-align:center;text-shadow:0 0 5px rgba(255,0,0,0.5);">ChatGPT下载扩展 - 故障排除</h3>
      <div style="margin-bottom:10px;">扩展已加载但遇到问题。</div>
      <div style="margin:10px 0;padding:8px;background-color:rgba(255,255,255,0.1);border-radius:5px;">
        <div style="margin-bottom:5px;font-weight:bold;">问题诊断:</div>
        <div style="margin-top:5px;">状态: <span style="color:#ff9900;font-weight:bold;">按钮可能未正确显示</span></div>
        <div style="margin-top:5px;">可能的原因: <span style="color:#ff9900;">页面结构变化或CSS冲突</span></div>
      </div>
      <div style="margin:15px 0;padding:10px;background-color:rgba(255,255,0,0.1);border-radius:5px;border:1px dashed #ffff00;">
        <strong>重要提示:</strong> 如果您看不到功能按钮，请点击下方红色按钮。
      </div>
      <button id="debug-try-fix" style="margin-top:15px;background:#ff3333;color:white;border:none;padding:12px;cursor:pointer;width:100%;font-weight:bold;font-size:16px;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.3);">
        创建功能按钮区域
      </button>
      <button id="debug-show-panel" style="margin-top:10px;background:#4CAF50;color:white;border:none;padding:12px;cursor:pointer;width:100%;font-weight:bold;font-size:16px;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.3);">
        显示完整诊断面板
      </button>
      <button id="debug-close-extension" style="margin-top:10px;background:#dc3545;color:white;border:none;padding:12px;cursor:pointer;width:100%;font-weight:bold;font-size:16px;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.3);">
        关闭扩展功能
      </button>
    `;
    
    document.body.appendChild(panel);
    
    document.getElementById('debug-try-fix').addEventListener('click', function() {
      try {
        createFallbackActionsArea();
        const actionArea = document.querySelector('.custom-chat-actions');
        if (actionArea) {
          // 创建按钮容器
          const buttonContainer = document.createElement('div');
          buttonContainer.className = 'button-container';
          buttonContainer.style.display = 'flex';
          buttonContainer.style.flexDirection = 'column'; // 改为竖向排列
          buttonContainer.style.justifyContent = 'center';
          buttonContainer.style.gap = '8px';
          
          // PNG按钮
          const button = document.createElement('button');
          button.className = 'btn action-button';
          button.id = 'download-png-button';
          button.innerText = 'Generate PNG';
          button.setAttribute('share-ext', 'true');
          button.style.padding = '8px 14px';
          button.style.backgroundColor = 'rgba(16, 163, 127, 0.2)';
          button.style.color = 'rgb(16, 163, 127)';
          button.style.fontWeight = '500';
          button.style.border = 'none';
          button.style.borderRadius = '4px';
          button.style.cursor = 'pointer';
          button.style.fontSize = '14px';
          button.style.transition = 'background-color 0.2s ease';
          button.onmouseover = () => { button.style.backgroundColor = 'rgba(16, 163, 127, 0.3)'; };
          button.onmouseout = () => { button.style.backgroundColor = 'rgba(16, 163, 127, 0.2)'; };
          button.onclick = () => downloadThread();
          buttonContainer.appendChild(button);

          // PDF按钮
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
          pdfButton.onclick = () => downloadThread({ as: Format.PDF });
          buttonContainer.appendChild(pdfButton);
          
          // 添加按钮容器到操作区域
          actionArea.appendChild(buttonContainer);
        }
        panel.querySelector('span').textContent = '已手动创建按钮和操作区域！';
        panel.querySelector('span').style.color = '#4CAF50';
        
        // 添加提示信息
        alert('功能按钮已创建！请查看页面右下角。');
      } catch (error) {
        handleError(error, 'debug-try-fix onClick');
        alert('创建按钮失败: ' + error.message);
      }
    });
    
    document.getElementById('debug-show-panel').addEventListener('click', function() {
      try {
        // 调用debug_helper.js中的函数显示完整诊断面板
        if (typeof window.analyzeDOM === 'function') {
          window.analyzeDOM();
        } else {
          alert('无法显示完整诊断面板，调试助手脚本可能未加载。请刷新页面重试。');
        }
      } catch (error) {
        handleError(error, 'debug-show-panel onClick');
      }
    });
    
    document.getElementById('debug-close-extension').addEventListener('click', function() {
      try {
        closeExtensionFeatures();
      } catch (error) {
        handleError(error, 'debug-close-extension onClick');
      }
    });
    
    log('已显示持久调试面板');
  } catch (error) {
    handleError(error, 'showPersistentDebugPanel');
  }
}

function shouldRemoveButtons() {
  try {
    log('防止按钮被移除，始终返回false');
    return false;
  } catch (error) {
    handleError(error, 'shouldRemoveButtons');
    return false;
  }
}

function shouldAddButtons(actionsArea) {
  try {
    log('强制添加按钮，忽略其他检查条件');

    // 检查是否已经存在我们的按钮
    const hasDownloadButtons = document.getElementById("download-png-button") || 
                              document.getElementById("download-pdf-button");
    if (hasDownloadButtons) {
      log('按钮已存在，不需要再次添加');
      return false;
    }

    return true;
  } catch (error) {
    handleError(error, 'shouldAddButtons');
    return true; // 即使出错也返回true，确保按钮能添加
  }
}

const Format = {
  PNG: "png",
  PDF: "pdf",
};

function removeButtons() {
  try {
    const downloadButton = document.getElementById("download-png-button");
    const downloadPdfButton = document.getElementById("download-pdf-button");
    const closeButton = document.getElementById("close-extension-button");
    if (downloadButton) {
      downloadButton.remove();
      log('已移除PNG按钮');
    }
    if (downloadPdfButton) {
      downloadPdfButton.remove();
      log('已移除PDF按钮');
    }
    if (closeButton) {
      closeButton.remove();
      log('已移除关闭按钮');
    }
  } catch (error) {
    handleError(error, 'removeButtons');
  }
}

function addActionsButtons(actionsArea, TryAgainButton) {
  try {
    // 检查是否已存在按钮
    if (document.getElementById("download-png-button") || 
        document.getElementById("download-pdf-button")) {
      log('按钮已存在，不重复添加');
      return;
    }
    
    log('开始添加功能按钮');
    
    // 创建竖向排列的按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '8px';
    
    const downloadButton = TryAgainButton.cloneNode(true);
    downloadButton.id = "download-png-button";
    downloadButton.setAttribute("share-ext", "true");
    downloadButton.innerText = "Generate PNG";
    downloadButton.onclick = () => {
      log('点击了PNG按钮');
      downloadThread();
    };
    buttonContainer.appendChild(downloadButton);
    log('已添加PNG按钮');
    
    const downloadPdfButton = TryAgainButton.cloneNode(true);
    downloadPdfButton.id = "download-pdf-button";
    downloadPdfButton.setAttribute("share-ext", "true");
    downloadPdfButton.innerText = "Download PDF";
    downloadPdfButton.onclick = () => {
      log('点击了PDF按钮');
      downloadThread({ as: Format.PDF });
    };
    buttonContainer.appendChild(downloadPdfButton);
    log('已添加PDF按钮');
    
    // 添加关闭按钮
    const closeButton = TryAgainButton.cloneNode(true);
    closeButton.id = "close-extension-button";
    closeButton.setAttribute("share-ext", "true");
    closeButton.innerText = "关闭功能";
    closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
    closeButton.style.color = 'rgb(220, 53, 69)';
    // 添加悬停效果
    closeButton.addEventListener('mouseover', () => { 
      closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.3)';
    });
    closeButton.addEventListener('mouseout', () => { 
      closeButton.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
    });
    closeButton.onclick = () => {
      log('点击了关闭按钮');
      closeExtensionFeatures();
    };
    buttonContainer.appendChild(closeButton);
    log('已添加关闭按钮');
    
    // 添加按钮容器到操作区域
    actionsArea.appendChild(buttonContainer);
  } catch (error) {
    handleError(error, 'addActionsButtons');
  }
}

// Define SiteType enum that was missing
const SiteType = {
  CHATGPT: 'openai',
  CHATSHARE: 'chatshare',
  UNKNOWN: 'unknown'
};

// 存储替换前的颜色
let originalColors = [];

// 预处理CSS颜色,替换不支持的颜色格式
function preprocessColors() {
  try {
    log('预处理CSS颜色，替换不支持的颜色格式...');
    originalColors = []; // 重置存储
    
    // 处理所有具有计算样式的元素
    const allElements = document.querySelectorAll('*');
    const processedElements = new Set(); // 避免重复处理
    
    // 先处理内联样式
    const elementsWithInlineStyle = document.querySelectorAll('[style*="oklch"]');
    for (let i = 0; i < elementsWithInlineStyle.length; i++) {
      const element = elementsWithInlineStyle[i];
      processedElements.add(element);
      const style = element.getAttribute('style');
      originalColors.push({
        element: element,
        style: style
      });
      
      // 替换内联样式中的oklch
      let newStyle = style.replace(/oklch\([^)]+\)/g, 'rgb(16, 163, 127)');
      element.setAttribute('style', newStyle);
    }
    
    // 处理计算样式中带有oklch的元素
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      if (processedElements.has(element)) continue;
      
      const computedStyle = window.getComputedStyle(element);
      let hasOklch = false;
      
      // 检查所有可能的颜色属性
      const colorProps = [
        'color', 'background-color', 'border-color', 'border-top-color', 
        'border-right-color', 'border-bottom-color', 'border-left-color',
        'outline-color', 'text-decoration-color', 'box-shadow'
      ];
      
      // 临时样式对象，用于存储需要修改的属性
      const tempStyle = {};
      
      for (const prop of colorProps) {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value.includes('oklch')) {
          hasOklch = true;
          tempStyle[prop] = 'rgb(16, 163, 127)';
          
          // 保存原始值以便恢复
          originalColors.push({
            element: element,
            prop: prop,
            value: value
          });
        }
      }
      
      // 如果有oklch颜色，则应用内联样式覆盖
      if (hasOklch) {
        let newInlineStyle = element.getAttribute('style') || '';
        for (const [prop, value] of Object.entries(tempStyle)) {
          newInlineStyle += `${prop}: ${value} !important; `;
        }
        element.setAttribute('style', newInlineStyle);
      }
    }
    
    // 查找所有样式表
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const styleSheet = document.styleSheets[i];
        // 跳过跨域样式表
        if (styleSheet.href && !styleSheet.href.startsWith(window.location.origin) && !styleSheet.href.startsWith('chrome-extension://')) {
          continue;
        }
        
        const rules = styleSheet.cssRules || styleSheet.rules;
        if (!rules) continue;
        
        for (let j = 0; j < rules.length; j++) {
          try {
            const rule = rules[j];
            if (rule.style) {
              // 检查并替换oklch颜色
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                const value = rule.style.getPropertyValue(prop);
                if (value.includes('oklch')) {
                  originalColors.push({
                    rule: rule,
                    prop: prop,
                    value: value
                  });
                  
                  // 替换为适当的RGB颜色
                  let rgbValue = 'rgb(16, 163, 127)'; // 默认绿色
                  
                  // 根据透明度调整
                  if (value.match(/oklch\([^)]*\/\s*0\.\d+\s*\)/)) {
                    const opacityMatch = value.match(/\/\s*(0\.\d+)\s*\)/);
                    if (opacityMatch && opacityMatch[1]) {
                      const opacity = parseFloat(opacityMatch[1]);
                      rgbValue = `rgba(16, 163, 127, ${opacity})`;
                    }
                  }
                  
                  rule.style.setProperty(prop, rgbValue, rule.style.getPropertyPriority(prop));
                }
              }
            }
          } catch (ruleError) {
            // 忽略单个规则的错误
          }
        }
      } catch (styleSheetError) {
        // 忽略单个样式表的错误
      }
    }
    
    log(`已处理 ${originalColors.length} 个颜色定义`);
  } catch (error) {
    handleError(error, 'preprocessColors');
    // 失败时继续，尝试使用现有的颜色完成截图
  }
}

// 恢复原始CSS颜色
function restoreColors() {
  try {
    log('恢复原始CSS颜色...');
    
    // 恢复样式表中的颜色
    for (let i = 0; i < originalColors.length; i++) {
      const item = originalColors[i];
      if (item.rule && item.prop) {
        // 恢复CSS规则中的颜色
        item.rule.style.setProperty(item.prop, item.value, item.rule.style.getPropertyPriority(item.prop));
      } else if (item.element && item.style) {
        // 恢复内联样式
        item.element.setAttribute('style', item.style);
      } else if (item.element && item.prop && item.value) {
        // 恢复通过计算样式发现并修改的元素
        let currentStyle = item.element.getAttribute('style') || '';
        currentStyle = currentStyle.replace(new RegExp(`${item.prop}:\\s*[^;]+;?\\s*`, 'g'), '');
        item.element.setAttribute('style', currentStyle);
      }
    }
    
    originalColors = []; // 清空存储
    log('CSS颜色已恢复');
  } catch (error) {
    handleError(error, 'restoreColors');
  }
}

function downloadThread({ as = Format.PNG } = {}) {
  try {
    log(`开始下载${as === Format.PDF ? 'PDF' : 'PNG'}...`);
    const elements = new Elements();
    
    // 预处理CSS颜色,替换不支持的颜色格式
    preprocessColors();
    
    elements.fixLocation();
    const pixelRatio = window.devicePixelRatio;
    // 提高PDF的分辨率，大幅增加DPI，但提供动态调整机制
    const minRatio = as === Format.PDF ? 5 : 2.5; // 增加到5，相当于大约500 DPI
    window.devicePixelRatio = Math.max(pixelRatio, minRatio);

    // 估算内存使用并确保不会崩溃
    const estimatedBytes = estimateMemoryUsage(elements.thread, minRatio);
    const maxAllowedBytes = 1.5 * 1024 * 1024 * 1024; // 1.5 GB 作为安全上限
    
    // 如果估计内存超出安全值，动态调整分辨率
    let actualRatio = minRatio;
    if (estimatedBytes > maxAllowedBytes) {
      actualRatio = Math.max(3, minRatio * (maxAllowedBytes / estimatedBytes));
      log(`内存使用过高，降低DPI从${minRatio}到${actualRatio.toFixed(2)}`);
      window.devicePixelRatio = Math.max(pixelRatio, actualRatio);
    }

    log(`使用html2canvas截图，DPI比率：${actualRatio.toFixed(2)}...`);
    html2canvas(elements.thread, {
      letterRendering: true,
      allowTaint: true,
      useCORS: true,
      logging: window.DEBUG_EXTENSION,
      backgroundColor: '#ffffff', // 确保背景是白色
      scale: actualRatio, // 使用动态调整后的缩放比例
      // 优化字体渲染
      fontDisplay: 'swap',
      imageTimeout: 30000, // 增加图片加载超时时间
      // 为长对话增加超时时间
      timeout: 120000 // 120秒超时，适应更长的对话
    }).then(async function (canvas) {
      try {
        elements.restoreLocation();
        window.devicePixelRatio = pixelRatio;
        
        // 恢复原始CSS颜色
        restoreColors();
        
        // 使用更高质量的图像格式
        const imgData = canvas.toDataURL("image/png", 1.0);
        log('截图完成，处理结果...');
        requestAnimationFrame(() => {
          if (as === Format.PDF) {
            log('开始生成PDF...');
            return handlePdf(imgData, canvas, pixelRatio, actualRatio);
          } else {
            log('开始处理PNG...');
            handleImg(imgData);
          }
        });
      } catch (error) {
        handleError(error, 'html2canvas callback');
        elements.restoreLocation();
        restoreColors();
        alert(`处理截图时出错: ${error.message}\n请尝试缩短对话或使用PNG格式。`);
      }
    }).catch(error => {
      handleError(error, 'html2canvas');
      elements.restoreLocation();
      restoreColors();
      
      // 如果是内存错误，尝试以较低分辨率重试
      if (error.message.includes('memory') || error.message.includes('allocation') || error.message.includes('heap')) {
        if (actualRatio > 2) {
          log('检测到内存错误，尝试以较低分辨率重试...');
          alert('图像分辨率过高导致内存不足，正在尝试以较低分辨率重试...');
          window.setTimeout(() => {
            const lowerRatio = Math.max(2, actualRatio * 0.6);
            window.devicePixelRatio = Math.max(pixelRatio, lowerRatio);
            downloadThread({ as: as });
          }, 1000);
          return;
        }
      }
      
      alert(`生成截图时出错: ${error.message}\n请尝试缩短对话或使用PNG格式。`);
    });
  } catch (error) {
    handleError(error, 'downloadThread');
    restoreColors();
    alert(`下载过程出错: ${error.message}\n请尝试缩短对话或使用PNG格式。`);
  }
}

// 估算内存使用量
function estimateMemoryUsage(element, ratio) {
  try {
    if (!element) return 0;
    
    // 获取元素尺寸
    const rect = element.getBoundingClientRect();
    const width = rect.width * ratio;
    const height = rect.height * ratio;
    
    // 每个像素4字节 (RGBA)
    const bytesPerPixel = 4;
    
    // 估算画布内存 (像素数 * 字节/像素 * 3 用于缓冲区和临时存储)
    const estimatedBytes = width * height * bytesPerPixel * 3;
    
    log(`估算内存使用: ${(estimatedBytes / (1024 * 1024)).toFixed(2)} MB，元素尺寸: ${width.toFixed(0)}x${height.toFixed(0)}`);
    
    return estimatedBytes;
  } catch (error) {
    handleError(error, 'estimateMemoryUsage');
    return 0;
  }
}

function handleImg(imgData) {
  try {
    log('处理PNG图像数据...');
    const binaryData = atob(imgData.split("base64,")[1]);
    const data = [];
    for (let i = 0; i < binaryData.length; i++) {
      data.push(binaryData.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(data)], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    log('在新标签页打开PNG...');
    window.open(url, "_blank");
  } catch (error) {
    handleError(error, 'handleImg');
    alert('生成PNG图像失败，请查看控制台获取更多信息。');
  }
}

function handlePdf(imgData, canvas, pixelRatio, dpiRatio) {
  try {
    log('处理PDF数据...');
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      throw new Error('jsPDF library not loaded');
    }
    
    // 检查画布尺寸是否过大
    const maxDimension = 10000; // 设置合理的最大尺寸
    if (canvas.width > maxDimension || canvas.height > maxDimension) {
      log(`画布尺寸过大 (${canvas.width}x${canvas.height})，缩放处理`);
      // 创建较小的画布，但保持较高的分辨率
      const scaleFactor = Math.min(maxDimension / canvas.width, maxDimension / canvas.height);
      // 使用稍大一些的缩放比例保持清晰度
      const scaledWidth = Math.floor(canvas.width * scaleFactor);
      const scaledHeight = Math.floor(canvas.height * scaleFactor);
      
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = scaledWidth;
      scaledCanvas.height = scaledHeight;
      
      const ctx = scaledCanvas.getContext('2d');
      // 使用高质量图像渲染
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, scaledWidth, scaledHeight);
      ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
      
      // 使用缩放后的画布
      canvas = scaledCanvas;
      imgData = canvas.toDataURL("image/png", 1.0);
      log(`已缩放到 ${scaledWidth}x${scaledHeight}`);
    }
    
    const orientation = canvas.width > canvas.height ? "l" : "p";
    
    try {
      // 对于特别大的对话，分块处理
      let pdf;
      const maxPdfHeight = 14000; // PDF的最大尺寸限制
      
      if (canvas.height > maxPdfHeight) {
        log('对话过长，进行分页处理');
        // 创建适合页面大小的PDF，使用较高DPI
        const pageHeight = 841.89; // A4高度(pt)
        const pageWidth = 595.28; // A4宽度(pt)
        const margin = 20; // 页边距
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);
        
        // 根据画布宽高比缩放，增加清晰度
        // 使用更高的缩放因子，基于提供的DPI比率
        const scale = contentWidth / canvas.width * 1.6; // 增加60%的缩放比例
        const scaledHeight = canvas.height * scale;
        
        pdf = new jsPDF('p', 'pt', 'a4');
        // 设置PDF压缩级别和质量 - 优化文本质量
        pdf.setProperties({
          title: 'ChatGPT Conversation',
          compress: true,
          quality: 1.0, // 最高质量
          precision: 16 // 增加精度
        });
        
        // 计算需要的页数
        const pageCount = Math.ceil(scaledHeight / contentHeight);
        
        // 对每页进行处理
        for (let i = 0; i < pageCount; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const sourceY = (i * contentHeight / scale);
          const sourceHeight = Math.min(contentHeight / scale, canvas.height - sourceY);
          
          // 创建用于当前页的临时画布
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          
          const ctx = tempCanvas.getContext('2d');
          // 使用高质量图像渲染
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(
            canvas, 
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );
          
          const pageImgData = tempCanvas.toDataURL('image/png', 1.0);
          // 使用更高质量的插入方式
          pdf.addImage(
            pageImgData, 'PNG', 
            margin, margin, 
            contentWidth, (sourceHeight * scale),
            null, 'FAST',
            0 // 无旋转
          );
        }
      } else {
        // 正常处理单页PDF，使用较高DPI
        // 使用更精确的尺寸设置
        pdf = new jsPDF(orientation, "pt", [
          Math.ceil(canvas.width / (pixelRatio * 0.75)), // 增加25%的分辨率
          Math.ceil(canvas.height / (pixelRatio * 0.75)),
        ]);
        
        // 设置PDF压缩级别和质量
        pdf.setProperties({
          title: 'ChatGPT Conversation',
          compress: true,
          quality: 1.0, // 最高质量
          precision: 16 // 增加精度
        });
        
        var pdfWidth = pdf.internal.pageSize.getWidth();
        var pdfHeight = pdf.internal.pageSize.getHeight();
        
        // 使用更高质量的图像插入选项
        pdf.addImage(
          imgData, "PNG", 
          0, 0, 
          pdfWidth, pdfHeight, 
          null, 'FAST',
          0 // 无旋转
        );
      }
      
      log('保存PDF文件...');
      pdf.save("chat-gpt-high-res.pdf");
    } catch (pdfError) {
      handleError(pdfError, 'PDF generation');
      
      // 尝试简化处理作为备选方案
      log('尝试简化方法生成PDF');
      const pdf = new jsPDF(orientation, "pt", 'a4');
      var pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      // 使用更清晰的图像质量
      pdf.addImage(
        imgData, "PNG", 
        10, 10, 
        pdfWidth, pdfWidth * (canvas.height / canvas.width), 
        null, 'FAST',
        0 // 无旋转
      );
      pdf.save("chat-gpt-simplified.pdf");
    }
  } catch (error) {
    handleError(error, 'handlePdf');
    alert('生成PDF文件失败: ' + error.message + '\n请尝试缩短对话或使用PNG格式。');
  }
}

class Elements {
  constructor() {
    this.init();
  }
  
  init() {
    try {
      log('初始化DOM元素...');
      // 使用适配器获取元素
      this.spacer = domAdapter.getSpacerElement();
      this.thread = domAdapter.getThreadElement();
      this.positionForm = domAdapter.getFormPositionElement();
      this.scroller = domAdapter.getScrollerElements();
      this.hiddens = domAdapter.getHiddenElements();
      this.images = domAdapter.getImages();
      
      if (!this.thread) {
        log('警告: 未找到聊天线程元素，将使用body');
        this.thread = document.body;
      }
      
      log('DOM元素初始化完成');
    } catch (error) {
      handleError(error, 'Elements.init');
    }
  }
  
  fixLocation() {
    try {
      log('开始调整DOM元素以准备截图...');
      this.hiddens.forEach((el) => {
        el.classList.remove("overflow-hidden");
        // 为chatshare网站添加额外的类处理
        if (el.classList.contains("hide-scrollbar")) {
          el.setAttribute("data-had-hide-scrollbar", "true");
          el.classList.remove("hide-scrollbar");
        }
      });
      
      if (this.spacer) {
        this.spacer.style.display = "none";
      }
      
      if (this.thread) {
        this.thread.style.maxWidth = "960px";
        this.thread.style.marginInline = "auto";
        // 设置背景颜色以确保截图清晰
        this.thread.style.backgroundColor = "#ffffff";
      }
      
      if (this.positionForm) {
        this.positionForm.style.display = "none";
      }
      
      if (this.scroller) {
        if (this.scroller.classList.contains("h-full")) {
          this.scroller.classList.remove("h-full");
        }
        this.scroller.style.minHeight = "100vh";
      }
      
      this.images.forEach((img) => {
        const srcset = img.getAttribute("srcset");
        if (srcset) {
          img.setAttribute("srcset_old", srcset);
          img.setAttribute("srcset", "");
        }
      });
      
      // 修复文本偏移
      document.body.style.lineHeight = "0.5";
      log('DOM元素已准备好截图');
    } catch (error) {
      handleError(error, 'Elements.fixLocation');
    }
  }
  
  restoreLocation() {
    try {
      log('开始恢复DOM元素...');
      this.hiddens.forEach((el) => {
        el.classList.add("overflow-hidden");
        // 对于chatshare网站，恢复额外的类
        if (el.getAttribute("data-had-hide-scrollbar")) {
          el.classList.add("hide-scrollbar");
          el.removeAttribute("data-had-hide-scrollbar");
        }
      });
      
      if (this.spacer) {
        this.spacer.style.display = null;
      }
      
      if (this.thread) {
        this.thread.style.maxWidth = null;
        this.thread.style.marginInline = null;
        this.thread.style.backgroundColor = null;
      }
      
      if (this.positionForm) {
        this.positionForm.style.display = null;
      }
      
      if (this.scroller) {
        if (!this.scroller.classList.contains("h-full") && domAdapter.siteType === SiteType.CHATGPT) {
          this.scroller.classList.add("h-full");
        }
        this.scroller.style.minHeight = null;
      }
      
      this.images.forEach((img) => {
        const srcset = img.getAttribute("srcset_old");
        if (srcset) {
          img.setAttribute("srcset", srcset);
          img.setAttribute("srcset_old", "");
        }
      });
      
      document.body.style.lineHeight = null;
      log('DOM元素已恢复');
    } catch (error) {
      handleError(error, 'Elements.restoreLocation');
    }
  }
}

function selectElementByClassPrefix(classPrefix) {
  try {
    const element = document.querySelector(`[class^='${classPrefix}']`);
    return element;
  } catch (error) {
    handleError(error, 'selectElementByClassPrefix');
    return null;
  }
}

async function sendRequest() {
  try {
    log('准备发送分享请求...');
    const data = getData();
    
    log('获取上传URL...');
    const uploadUrlResponse = await fetch(
      "https://chatgpt-static.s3.amazonaws.com/url.txt"
    ).catch(error => {
      throw new Error(`获取上传URL失败: ${error.message}`);
    });
    
    if (!uploadUrlResponse.ok) {
      throw new Error(`获取上传URL失败: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`);
    }
    
    const uploadUrl = await uploadUrlResponse.text();
    log('上传URL获取成功，准备上传数据...');
    
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).catch(error => {
      throw new Error(`上传数据失败: ${error.message}`);
    });
    
    if (!response.ok) {
      throw new Error(`上传数据失败: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    log('数据上传成功，打开分享链接...');
    window.open(responseData.url, "_blank");
  } catch (error) {
    handleError(error, 'sendRequest');
    alert('生成分享链接失败，请查看控制台获取更多信息。');
  }
}

function getData() {
  try {
    log('获取要分享的数据...');
    const globalCss = getCssFromSheet(domAdapter.getStylesheet());
    const localCss = getCssFromSheet(domAdapter.getStyledData()) || "body{}";
    const mainElement = domAdapter.getMainElement();
    
    if (!mainElement) {
      throw new Error('未找到主内容元素');
    }
    
    const data = {
      main: mainElement.outerHTML,
      globalCss,
      localCss,
    };
    return data;
  } catch (error) {
    handleError(error, 'getData');
    throw error; // 重新抛出以便上层处理
  }
}

function getCssFromSheet(sheet) {
  try {
    if (!sheet) return "";
    return Array.from(sheet.cssRules)
      .map((rule) => rule.cssText)
      .join("");
  } catch (error) {
    handleError(error, 'getCssFromSheet');
    return "";
  }
}

// 显示重新加载通知
function showReloadNotification() {
  try {
    if (document.getElementById('reload-notification')) {
      return; // 已存在
    }
    
    const notification = document.createElement('div');
    notification.id = 'reload-notification';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '20px';
    notification.style.backgroundColor = 'rgba(255, 153, 0, 0.95)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '300000';
    notification.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    notification.style.fontFamily = 'Arial, sans-serif';
    notification.style.fontSize = '16px';
    notification.style.fontWeight = 'bold';
    notification.style.textAlign = 'center';
    notification.style.maxWidth = '80%';
    notification.style.minWidth = '300px';
    
    notification.innerHTML = `
      <div style="margin-bottom:10px;">⚠️ 请重新加载页面以应用更新 ⚠️</div>
      <div style="font-size:14px;font-weight:normal;margin-bottom:15px;">
        重新加载页面后，请刷新扩展右下角的调试面板并点击"创建功能按钮区域"按钮。
      </div>
      <button id="reload-page-btn" style="background:#ffffff;color:#ff9900;border:none;padding:10px 20px;cursor:pointer;font-weight:bold;border-radius:5px;">
        重新加载页面
      </button>
      <button id="dismiss-notification-btn" style="background:transparent;color:white;border:1px solid white;margin-left:10px;padding:10px 20px;cursor:pointer;font-weight:bold;border-radius:5px;">
        稍后手动刷新
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // 添加动画效果
    const notificationStyle = document.createElement('style');
    notificationStyle.innerText = `
      @keyframes slideDown {
        0% { transform: translate(-50%, -100%); }
        100% { transform: translate(-50%, 0); }
      }
      #reload-notification {
        animation: slideDown 0.5s ease-out;
      }
    `;
    document.head.appendChild(notificationStyle);
    
    // 添加点击事件
    document.getElementById('reload-page-btn').addEventListener('click', function() {
      window.location.reload();
    });
    
    document.getElementById('dismiss-notification-btn').addEventListener('click', function() {
      notification.style.display = 'none';
    });
    
    log('已显示重新加载通知');
  } catch (error) {
    handleError(error, 'showReloadNotification');
  }
}

// 添加关闭扩展功能的函数
function closeExtensionFeatures() {
  try {
    log('开始关闭扩展功能...');
    
    // 移除所有按钮
    const extButtons = document.querySelectorAll('[share-ext="true"]');
    extButtons.forEach(button => button.remove());
    
    // 移除调试面板
    const debugPanel = document.getElementById('persistent-debug-panel');
    if (debugPanel) {
      debugPanel.remove();
    }
    
    // 移除诊断面板
    const diagnosticPanel = document.getElementById('debug-helper-panel');
    if (diagnosticPanel) {
      diagnosticPanel.remove();
    }
    
    // 移除通知
    const notification = document.getElementById('reload-notification');
    if (notification) {
      notification.remove();
    }
    
    // 移除自定义操作区域
    const customActionArea = document.querySelector('.custom-chat-actions');
    if (customActionArea) {
      customActionArea.remove();
    }
    
    // 清除定时器
    if (window.buttonsInterval) {
      clearInterval(window.buttonsInterval);
      window.buttonsInterval = null;
    }
    
    // 恢复CSS颜色
    restoreColors();
    
    // 创建一个新的Elements实例来恢复位置
    try {
      const elements = new Elements();
      elements.restoreLocation();
    } catch (restoreError) {
      handleError(restoreError, 'closeExtensionFeatures.restoreLocation');
    }
    
    log('扩展功能已关闭，页面已恢复原样');
    
    // 显示短暂确认信息
    const confirmationMsg = document.createElement('div');
    confirmationMsg.style.position = 'fixed';
    confirmationMsg.style.bottom = '20px';
    confirmationMsg.style.left = '20px';
    confirmationMsg.style.padding = '10px 15px';
    confirmationMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    confirmationMsg.style.color = '#fff';
    confirmationMsg.style.borderRadius = '4px';
    confirmationMsg.style.zIndex = '100000';
    confirmationMsg.style.fontSize = '14px';
    confirmationMsg.innerText = '扩展功能已关闭';
    document.body.appendChild(confirmationMsg);
    
    // 3秒后移除确认信息
    setTimeout(() => {
      confirmationMsg.remove();
    }, 3000);
    
    // 重置一些全局状态
    originalColors = [];
    
  } catch (error) {
    handleError(error, 'closeExtensionFeatures');
    alert('关闭扩展功能时出错: ' + error.message);
  }
}

// 运行初始化
log('开始运行扩展...');
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  log('页面已加载，立即初始化');
  window.setTimeout(init, 1000); // 延迟初始化，给网站更多时间加载
} else {
  log('页面未完全加载，等待DOMContentLoaded事件');
  document.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(init, 1000);
  });
}
