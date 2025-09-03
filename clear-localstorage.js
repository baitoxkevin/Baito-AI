// 在浏览器控制台运行以下命令清除展开状态：
// Clear all spotlight card expanded states
Object.keys(localStorage).filter(key => key.startsWith('spotlight-expanded-')).forEach(key => localStorage.removeItem(key));
console.log('已清除所有卡片展开状态');
