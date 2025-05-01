/**
 * ChatGPT Download 扩展的后台脚本
 * 用于处理跨页面消息和增强扩展功能
 */

// 全局调试开关
const DEBUG = true;

// 日志记录功能
function log(...args) {
  if (DEBUG) {
    console.log('[ChatGPT Download Background]', ...args);
  }
}

// 错误处理
function handleError(error, context) {
  console.error(`[ChatGPT Download Background] Error in ${context}:`, error);
}

/**
 * 初始化扩展后台功能
 */
function init() {
  log('初始化后台脚本...');
  
  // 监听来自内容脚本的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      log('收到消息:', message);
      
      if (message.action === 'log') {
        // 仅记录日志
        log('内容脚本日志:', message.data);
        sendResponse({ success: true });
      } else if (message.action === 'checkInstall') {
        // 检查扩展是否正确安装
        log('检查扩展安装状态');
        sendResponse({ 
          success: true, 
          version: chrome.runtime.getManifest().version 
        });
      } else if (message.action === 'reloadContentScripts') {
        // 重新加载内容脚本
        reloadContentScripts(sender.tab.id)
          .then(() => {
            sendResponse({ success: true });
          })
          .catch(error => {
            handleError(error, 'reloadContentScripts');
            sendResponse({ success: false, error: error.message });
          });
        return true; // 异步响应
      } else if (message.action === 'openImage') {
        // 在新标签页中打开图片
        chrome.tabs.create({ url: message.data.imageUrl });
        sendResponse({ success: true });
      } else {
        log('未知消息类型:', message.action);
        sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      handleError(error, 'onMessage');
      sendResponse({ success: false, error: error.message });
    }
    return true; // 保持消息通道开放
  });
  
  // 监听扩展安装或更新事件
  chrome.runtime.onInstalled.addListener((details) => {
    try {
      if (details.reason === 'install') {
        log('扩展安装成功');
        showWelcomeMessage();
      } else if (details.reason === 'update') {
        log(`扩展更新成功，新版本: ${chrome.runtime.getManifest().version}`);
        // 可以添加更新后的处理逻辑
      }
    } catch (error) {
      handleError(error, 'onInstalled');
    }
  });
  
  log('后台脚本初始化完成');
}

/**
 * 重新加载内容脚本
 * @param {number} tabId - 目标标签页ID
 * @returns {Promise<void>}
 */
async function reloadContentScripts(tabId) {
  try {
    log(`正在重新加载标签页 ${tabId} 的内容脚本...`);
    
    // 确保有权限操作该标签页
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // 移除之前的按钮
        document.querySelectorAll('[id$="-button"][share-ext]').forEach(btn => btn.remove());
        // 发送清理完成消息
        window.postMessage({ type: 'CHATGPT_DOWNLOAD_CLEANUP_DONE' }, '*');
      }
    });
    
    // 依次注入必要的脚本
    const scripts = [
      'scripts/html2canvas.min.js',
      'scripts/jspdf.umd.min.js',
      'scripts/debug_helper.js',
      'content_script_adapter.js',
      'content_script.js'
    ];
    
    for (const script of scripts) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [script]
      });
      log(`已重新加载脚本: ${script}`);
    }
    
    log('内容脚本重新加载完成');
  } catch (error) {
    handleError(error, 'reloadContentScripts');
    throw error; // 重新抛出错误以便调用者处理
  }
}

/**
 * 显示欢迎消息
 */
function showWelcomeMessage() {
  try {
    // 可以使用通知API或其他方式显示欢迎消息
    log('显示欢迎消息');
    // 这里可以添加欢迎页面、通知等
  } catch (error) {
    handleError(error, 'showWelcomeMessage');
  }
}

// 启动后台脚本
init(); 