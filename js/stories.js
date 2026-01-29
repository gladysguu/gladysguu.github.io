// ========================
// 咖啡故事页面 JavaScript
// ========================

let allStories = [];
let currentFilter = 'all';

// 加载故事数据 (Load stories from Airtable)
async function loadStories() {
    const loadingElement = document.getElementById('stories-loading');
    const containerElement = document.getElementById('stories-container');
    const noStoriesElement = document.getElementById('no-stories');

    try {
        // Fetch stories from Airtable
        const response = await airtableGet(AIRTABLE_CONFIG.TABLES.COFFEE_STORIES, {
            maxRecords: 100,
            view: 'Grid view'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch stories');
        }

        const result = await response.json();

        if (result.records && result.records.length > 0) {
            // Transform Airtable records to our format
            allStories = result.records.map(record => {
                // Handle image - Airtable Attachment field returns array of objects
                let imageUrl = '';
                if (record.fields.image_files) {
                    // Attachment field (array of objects with url property)
                    if (Array.isArray(record.fields.image_files) && record.fields.image_files.length > 0) {
                        imageUrl = record.fields.image_files[0].url;
                    }
                } else if (record.fields.image_url) {
                    // Fallback: URL field (string)
                    imageUrl = record.fields.image_url;
                }

                return {
                    id: record.id,
                    ...record.fields,
                    // Normalize image URL from either field type
                    image_url: imageUrl || 'images/default_story_bg.png', // Fallback image if none
                    // Handle tags - Airtable returns array for multiple select
                    tags: Array.isArray(record.fields.tags)
                        ? record.fields.tags
                        : (record.fields.tags ? record.fields.tags.split(',') : []),
                    // Default fields for premium UI if missing in data
                    date: record.fields.created_time ? new Date(record.fields.created_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    read_time: '5 min read', // Placeholder or calculation based on length
                    participant_role: record.fields.role || 'Scholar',
                    participant_name: record.fields.name || 'Anonymous'
                };
            });
            displayStories(allStories);
            loadingElement.style.display = 'none';
        } else {
            loadingElement.style.display = 'none';
            // Show empty state
            noStoriesElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading stories:', error);
        loadingElement.style.display = 'none';
        noStoriesElement.style.display = 'block';
    }
}

// 显示故事
function displayStories(stories) {
    const container = document.getElementById('stories-container');
    container.innerHTML = '';

    // 添加渐入动画
    container.style.opacity = '0';

    if (stories.length === 0) {
        container.innerHTML = '<p class="no-stories">没有找到符合条件的故事</p>';
        container.style.opacity = '1';
        return;
    }

    stories.forEach((story, index) => {
        const storyCard = createStoryCard(story);
        // 错落动画
        storyCard.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(storyCard);
    });

    // 淡入显示
    setTimeout(() => {
        container.style.transition = 'opacity 0.5s ease';
        container.style.opacity = '1';
    }, 100);
}

// 创建高级感故事卡片
function createStoryCard(story) {
    const card = document.createElement('article');
    card.className = 'story-card reveal';
    card.onclick = () => openStoryModal(story);

    // 提取纯文本简介
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = story.story_content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const excerpt = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;

    // 生成标签HTML
    const tagsHtml = story.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    card.innerHTML = `
        <div class="story-image-wrapper">
            <div class="image-overlay"></div>
            <img src="${story.image_url}" alt="${story.title}" class="story-image">
            <div class="story-card-badges">
                ${tagsHtml}
            </div>
        </div>
        <div class="story-content">
            <div class="story-meta">
                <span class="story-date">${story.date}</span>
                <span class="story-read-time">· ${story.read_time}</span>
            </div>
            <h3 class="story-title-en">${story.title}</h3>
            ${story.title_cn ? `<h4 class="story-title-cn">${story.title_cn}</h4>` : ''}
            <p class="story-excerpt">${excerpt}</p>
            <div class="story-author">
                <div class="author-avatar-placeholder">${story.participant_name.charAt(0)}</div>
                <div class="author-info">
                    <span class="author-name">${story.participant_name}</span>
                    <span class="author-role">${story.participant_role}</span>
                </div>
            </div>
        </div>
    `;

    return card;
}

// 打开故事详情模态框
function openStoryModal(story) {
    const modal = document.getElementById('story-view-modal');

    // 填充数据
    document.getElementById('view-story-title').textContent = story.title;
    document.getElementById('view-story-tags').innerHTML = story.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    document.getElementById('view-story-author').textContent = story.participant_name;
    document.getElementById('view-story-date').textContent = story.date;
    document.getElementById('view-read-time').textContent = story.read_time;

    const imageContainer = document.getElementById('view-story-image');
    imageContainer.style.backgroundImage = `url(${story.image_url})`;

    // 内容填充
    const contentContainer = document.getElementById('view-story-content');
    contentContainer.innerHTML = story.story_content;
    if (story.title_cn) {
        contentContainer.innerHTML = `<h2 class="content-subtitle-cn">${story.title_cn}</h2>` + contentContainer.innerHTML;
    }

    // 显示模态框
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 禁止背景滚动
}

// 关闭故事详情
function closeStoryView() {
    const modal = document.getElementById('story-view-modal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // 恢复滚动
}

// 筛选故事
function filterStories(filterValue) {
    currentFilter = filterValue;
    const stories = filterValue === 'all'
        ? allStories
        : allStories.filter(s => s.tags.includes(filterValue));
    displayStories(stories);
}

// 搜索故事
function searchStories(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const filtered = allStories.filter(story => {
        const fullText = (story.title + story.title_cn + story.story_content + story.participant_name + story.tags.join('')).toLowerCase();
        return fullText.includes(searchTerm);
    });
    displayStories(filtered);
}

// 提交故事表单处理 (Submit story to Airtable)
async function submitStory(formData) {
    try {
        const storyData = {
            submitter_name: formData.get('submitter_name'),
            submitter_email: formData.get('submitter_email'),
            story_title: formData.get('story_title'),
            story_content: formData.get('story_content'),
            allow_publish: formData.get('allow_publish') === 'on',
            anonymous: formData.get('anonymous') === 'on',
            submission_date: new Date().toISOString().split('T')[0],
            status: '待审核'
        };

        const response = await airtableCreate(AIRTABLE_CONFIG.TABLES.STORY_SUBMISSIONS, storyData);

        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            console.error('Airtable error:', errorData);
            throw new Error('提交失败');
        }
    } catch (error) {
        console.error('Error submitting story:', error);
        return false;
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    // 加载故事
    loadStories();

    // 筛选按钮事件
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // 移除所有活动状态
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的活动状态
            this.classList.add('active');
            // 执行筛选
            const filterValue = this.getAttribute('data-filter');
            filterStories(filterValue);
        });
    });

    // 搜索框事件
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchStories(this.value);
        });
    }

    // 打开故事提交模态框
    const openFormBtn = document.getElementById('open-story-form');
    const modal = document.getElementById('story-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancel-story');

    openFormBtn.addEventListener('click', function () {
        modal.classList.add('active');
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', function () {
        modal.classList.remove('active');
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', function () {
        modal.classList.remove('active');
        modal.style.display = 'none';
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    });

    // 故事详情模态框关闭事件
    const storyViewModal = document.getElementById('story-view-modal');
    const closeStoryViewBtn = document.getElementById('close-story-view');

    if (closeStoryViewBtn) {
        closeStoryViewBtn.addEventListener('click', closeStoryView);
    }

    if (storyViewModal) {
        storyViewModal.addEventListener('click', function (e) {
            if (e.target === storyViewModal) {
                closeStoryView();
            }
        });
    }

    // 故事提交表单处理
    const storyForm = document.getElementById('story-submission-form');
    storyForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '提交中...';
        submitBtn.disabled = true;

        const formData = new FormData(this);
        const success = await submitStory(formData);

        if (success) {
            alert('故事提交成功！我们会在审核后发布。\nThank you for sharing your story!');
            this.reset();
            modal.classList.remove('active');
            modal.style.display = 'none';
        } else {
            alert('提交失败，请稍后重试。\nSubmission failed, please try again later.');
        }

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
});
