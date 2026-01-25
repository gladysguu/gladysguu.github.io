// ========================
// 主页面 JavaScript
// ========================

// 数字动画函数
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 当页面加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
    // 统计数字动画
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        // 使用 Intersection Observer 在元素可见时触发动画
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const id = element.id;
                    let targetValue = 0;
                    
                    switch(id) {
                        case 'stat-conversations':
                            targetValue = 127;
                            break;
                        case 'stat-stories':
                            targetValue = 89;
                            break;
                        case 'stat-countries':
                            targetValue = 15;
                            break;
                        case 'stat-scholars':
                            targetValue = 127;
                            break;
                    }
                    
                    animateValue(element, 0, targetValue, 2000);
                    observer.unobserve(element);
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => observer.observe(stat));
    }
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});
