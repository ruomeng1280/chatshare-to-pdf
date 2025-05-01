/**
 * 网站适配器 - 用于处理不同网站之间的DOM结构和样式差异
 */

(function() {
  // 全局调试开关，使用window属性以确保全局可访问
  window.DEBUG_EXTENSION = true;
  
  // 日志函数
  function debugLog(...args) {
    if (window.DEBUG_EXTENSION) {
      console.log('[DOM Adapter]', ...args);
    }
  }
  
  // 错误处理函数
  function logError(error, context) {
    console.error(`[DOM Adapter] Error in ${context}:`, error);
  }
  
  /**
   * DOM元素选择器适配器类
   * 用于处理不同网站DOM差异的适配器
   */
  window.DOMAdapter = class DOMAdapter {
    constructor() {
      debugLog('初始化DOM适配器');
      
      // 确定当前站点类型
      const hostname = window.location.hostname;
      if (hostname === 'chat.openai.com') {
        this.siteType = 'openai';
        debugLog('检测到OpenAI ChatGPT网站');
      } else if (hostname === 'sass-node2.chatshare.biz') {
        this.siteType = 'chatshare';
        debugLog('检测到ChatShare网站');
      } else {
        this.siteType = 'unknown';
        debugLog('未知网站类型:', hostname);
      }
      
      // 不同网站的选择器映射
      this.selectors = {
        openai: {
          actionsArea: ".chat-actions, form>div>div, main>div>div:last-child div.absolute",
          tryAgainButton: "button:not([id*='download'])",
          openScreen: "nav",
          conversationFinished: ".result-streaming"
        },
        chatshare: {
          actionsArea: ".chat-actions, .custom-chat-actions, form>div>div, main>div>div:last-child div.absolute",
          tryAgainButton: "button:not([id*='download'])",
          openScreen: "nav, .landing-page",
          conversationFinished: ".result-streaming, .chat-container"
        }
      };
      
      // 创建高级选择器函数
      this.createQueryAllSelectors();
    }
    
    /**
     * 创建更强大的DOM查询函数，可以尝试多个选择器直到找到元素
     */
    createQueryAllSelectors() {
      try {
        // 用于查询文档的所有选择器
        this.queryDocumentAll = (selectorsString) => {
          if (!selectorsString) return null;
          
          const selectors = selectorsString.split(',').map(s => s.trim());
          
          for (const selector of selectors) {
            try {
              const elements = document.querySelectorAll(selector);
              if (elements && elements.length > 0) {
                return elements;
              }
            } catch (error) {
              logError(error, `查询选择器失败: ${selector}`);
            }
          }
          return null;
        };
        
        // 用于查询文档的第一个匹配选择器
        this.queryDocument = (selectorsString) => {
          if (!selectorsString) return null;
          
          const selectors = selectorsString.split(',').map(s => s.trim());
          
          for (const selector of selectors) {
            try {
              const element = document.querySelector(selector);
              if (element) {
                return element;
              }
            } catch (error) {
              logError(error, `查询选择器失败: ${selector}`);
            }
          }
          return null;
        };
        
        // 用于查询特定元素内的所有选择器
        this.queryElementAll = (element, selectorsString) => {
          if (!element || !selectorsString) return null;
          
          const selectors = selectorsString.split(',').map(s => s.trim());
          
          for (const selector of selectors) {
            try {
              const elements = element.querySelectorAll(selector);
              if (elements && elements.length > 0) {
                return elements;
              }
            } catch (error) {
              logError(error, `查询元素内选择器失败: ${selector}`);
            }
          }
          return null;
        };
        
        // 用于查询特定元素内的第一个匹配选择器
        this.queryElement = (element, selectorsString) => {
          if (!element || !selectorsString) return null;
          
          const selectors = selectorsString.split(',').map(s => s.trim());
          
          for (const selector of selectors) {
            try {
              const matchedElement = element.querySelector(selector);
              if (matchedElement) {
                return matchedElement;
              }
            } catch (error) {
              logError(error, `查询元素内选择器失败: ${selector}`);
            }
          }
          return null;
        };
      } catch (error) {
        logError(error, 'createQueryAllSelectors');
      }
    }
    
    /**
     * 获取操作区域元素
     */
    getActionsArea() {
      try {
        const selectors = this.selectors[this.siteType]?.actionsArea;
        if (!selectors) {
          debugLog('无效的网站类型选择器');
          return this._createFallbackActionsArea();
        }
        
        debugLog('尝试查找操作区域:', selectors);
        const element = this.queryDocument(selectors);
        
        if (element) {
          debugLog('找到操作区域');
          return element;
        }
        
        debugLog('未找到操作区域，尝试创建备用区域');
        return this._createFallbackActionsArea();
      } catch (error) {
        logError(error, 'getActionsArea');
        return this._createFallbackActionsArea();
      }
    }
    
    /**
     * 创建备用的操作区域
     */
    _createFallbackActionsArea() {
      try {
        // 检查是否已存在
        const existingArea = document.querySelector('.custom-chat-actions');
        if (existingArea) {
          debugLog('使用已存在的备用操作区域');
          return existingArea;
        }
        
        debugLog('创建备用操作区域');
        const mainElement = document.querySelector('main') || document.body;
        const actionContainer = document.createElement("div");
        actionContainer.className = 'custom-chat-actions';
        actionContainer.style.display = 'flex';
        actionContainer.style.justifyContent = 'center';
        actionContainer.style.margin = '10px 0';
        actionContainer.style.padding = '10px';
        actionContainer.style.borderTop = '1px solid #e5e5e5';
        actionContainer.style.zIndex = '9999'; // 确保显示在上层
        
        mainElement.appendChild(actionContainer);
        debugLog('已创建备用操作区域');
        return actionContainer;
      } catch (error) {
        logError(error, '_createFallbackActionsArea');
        return null;
      }
    }
    
    /**
     * 获取重试按钮
     */
    getTryAgainButton(actionsArea) {
      try {
        if (!actionsArea) return null;
        
        const selectors = this.selectors[this.siteType]?.tryAgainButton;
        if (!selectors) {
          debugLog('无效的重试按钮选择器');
          return null;
        }
        
        debugLog('尝试查找重试按钮:', selectors);
        return this.queryElement(actionsArea, selectors);
      } catch (error) {
        logError(error, 'getTryAgainButton');
        return null;
      }
    }
    
    /**
     * 检查是否在开始屏幕
     * 修改此函数以始终返回false，强制显示按钮
     */
    isOpenScreen() {
      try {
        // 强制返回false以确保按钮可以显示
        debugLog('isOpenScreen被调用，强制返回false');
        return false;
      } catch (error) {
        logError(error, 'isOpenScreen');
        return false;
      }
    }
    
    /**
     * 检查是否在对话中
     */
    isInConversation() {
      try {
        // 同样返回false以确保按钮可以显示
        debugLog('isInConversation被调用，返回false');
        return false;
      } catch (error) {
        logError(error, 'isInConversation');
        return false;
      }
    }
    
    /**
     * 检查对话是否已完成
     */
    isConversationFinished() {
      try {
        // 修改为始终返回true，表示对话已完成，可以显示按钮
        debugLog('isConversationFinished被调用，返回true');
        return true;
      } catch (error) {
        logError(error, 'isConversationFinished');
        return true; // 出错时默认返回true
      }
    }

    // 获取聊天线程元素
    getThreadElement() {
      if (this.siteType === 'openai') {
        return document.querySelector("[class*='react-scroll-to-bottom']>[class*='react-scroll-to-bottom']>div");
      } else {
        const selectors = [
          ".conversation-thread",
          ".chat-thread",
          ".message-list",
          ".chat-messages",
          "main .messages",
          "main>div>div",
          "[class*='scroll-to-bottom']>[class*='scroll-to-bottom']>div"
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            debugLog('找到聊天线程元素:', selector, element);
            return element;
          }
        }
        
        // 如果找不到，使用主内容区域
        debugLog('未找到聊天线程元素，使用main');
        return document.querySelector("main") || document.body;
      }
    }

    // 获取表单位置元素
    getFormPositionElement() {
      if (this.siteType === 'openai') {
        return document.querySelector("form")?.parentNode;
      } else {
        const selectors = [
          ".input-area",
          ".chat-input-container",
          "form",
          ".message-composer"
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            debugLog('找到表单位置元素:', selector, element);
            return element?.parentNode || element;
          }
        }
        
        debugLog('未找到表单位置元素');
        return null;
      }
    }

    // 获取滚动元素
    getScrollerElements() {
      if (this.siteType === 'openai') {
        return Array.from(document.querySelectorAll('[class*="react-scroll-to"]'))
          .filter(el => el.classList.contains("h-full"))[0];
      } else {
        const selectors = [
          ".conversation-scroller",
          ".chat-scroller",
          ".message-list-container",
          "[class*='scroll-to']",
          "main>div"
        ];
        
        for (const selector of selectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          if (elements.length > 0) {
            debugLog('找到滚动元素:', selector, elements[0]);
            return elements[0];
          }
        }
        
        debugLog('未找到滚动元素，使用body');
        return document.body;
      }
    }

    // 获取需要处理overflow的元素
    getHiddenElements() {
      if (this.siteType === 'openai') {
        return Array.from(document.querySelectorAll(".overflow-hidden"));
      } else {
        return Array.from(document.querySelectorAll(".overflow-hidden, .hide-scrollbar, [style*='overflow: hidden']"));
      }
    }

    // 获取带有srcset的图像
    getImages() {
      return Array.from(document.querySelectorAll("img[srcset]"));
    }

    // 获取主内容元素
    getMainElement() {
      const main = document.querySelector("main");
      if (main) return main;
      
      // 如果找不到main元素，使用body或第一个大容器
      debugLog('未找到main元素，使用body或第一个大容器');
      return document.querySelector(".conversation-container") || 
             document.querySelector("#root>div") ||
             document.body;
    }

    // 获取间隔元素
    getSpacerElement() {
      if (this.siteType === 'openai') {
        return document.querySelector(".w-full.h-48.flex-shrink-0");
      } else {
        const selectors = [
          ".conversation-spacer",
          ".chat-spacer",
          ".spacer",
          ".w-full.h-48.flex-shrink-0"
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            debugLog('找到间隔元素:', selector, element);
            return element;
          }
        }
        
        // 如果找不到，创建一个虚拟元素
        debugLog('未找到间隔元素，创建虚拟元素');
        const virtualSpacer = document.createElement('div');
        virtualSpacer.style.display = 'none';
        document.body.appendChild(virtualSpacer);
        return virtualSpacer;
      }
    }

    // 获取样式表
    getStylesheet() {
      return document.querySelector("link[rel=stylesheet]")?.sheet;
    }

    // 获取样式数据
    getStyledData() {
      return document.querySelector(`style[data-styled][data-styled-version]`)?.sheet;
    }
  };
  
  debugLog('DOM适配器已加载');
})(); 