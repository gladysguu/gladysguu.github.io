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
document.addEventListener('DOMContentLoaded', function () {
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

                    switch (id) {
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

    // 平滑滚动并更新活动状态
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    // 更新活动状态
                    navLinks.forEach(link => link.classList.remove('active'));
                    this.classList.add('active');

                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // 滚动监测自动更新导航活动状态
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current) && current !== '') {
                link.classList.add('active');
            }
        });

        // 如果在顶部，第一个设为 active
        if (window.pageYOffset < 100 && document.querySelector('.nav-menu a[href="index.html"]')) {
            document.querySelector('.nav-menu a[href="index.html"]').classList.add('active');
        }
    });

    // 导航栏滚动效果
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Reveal 动画 - 支持交错显示
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.classList.add('active');

                // 处理交错子元素
                const staggeredChildren = el.querySelectorAll('.join-step, .value-card, .story-card');
                staggeredChildren.forEach((child, index) => {
                    setTimeout(() => {
                        child.classList.add('active');
                    }, index * 100);
                });

                revealObserver.unobserve(el);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));

    // 背景鼠标交互
    const shapes = document.querySelectorAll('.bg-shape');
    document.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth - 0.5) * 40;
        const y = (clientY / window.innerHeight - 0.5) * 40;

        shapes.forEach((shape, index) => {
            const factor = (index + 1) * 0.5;
            shape.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });
    });
});
