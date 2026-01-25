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
                    image_url: imageUrl,
                    // Handle tags - Airtable returns array for multiple select
                    tags: Array.isArray(record.fields.tags)
                        ? record.fields.tags.join(',')
                        : record.fields.tags || ''
                };
            });
            displayStories(allStories);
            loadingElement.style.display = 'none';
        } else {
            loadingElement.style.display = 'none';
            containerElement.style.display = 'none';
            noStoriesElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading stories:', error);
        loadingElement.style.display = 'none';
        containerElement.style.display = 'none';
        noStoriesElement.style.display = 'block';
    }
}

// 显示故事
function displayStories(stories) {
    const container = document.getElementById('stories-container');
    container.innerHTML = '';

    if (stories.length === 0) {
        container.innerHTML = '<p class="no-stories">没有找到符合条件的故事</p>';
        return;
    }

    stories.forEach(story => {
        const storyCard = createStoryCard(story);
        container.appendChild(storyCard);
    });
}

// 创建故事卡片
function createStoryCard(story) {
    const card = document.createElement('div');
    card.className = 'story-card';

    // 处理故事内容，去除HTML标签，截取前150字
    const contentText = (story.story_content || '').replace(/<[^>]*>/g, '');
    const excerpt = contentText.length > 150 ? contentText.substring(0, 150) + '...' : contentText;

    // 处理标签
    const tags = story.tags ? story.tags.split(',').map(tag => tag.trim()) : [];
    const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    card.innerHTML = `
        ${story.image_url ? `<img src="${story.image_url}" alt="${story.title}" class="story-image">` : '<div class="story-image"></div>'}
        <div class="story-content">
            <div class="story-meta">
                <span>${story.participant_role || '学者'}</span>
                <span>${story.date || ''}</span>
            </div>
            <h3>${story.title || ''}</h3>
            <p class="story-excerpt">${excerpt}</p>
            ${tagsHtml ? `<div class="story-tags">${tagsHtml}</div>` : ''}
        </div>
    `;

    return card;
}

// 筛选故事
function filterStories(filterValue) {
    currentFilter = filterValue;

    if (filterValue === 'all') {
        displayStories(allStories);
    } else {
        const filtered = allStories.filter(story => {
            return story.tags && story.tags.includes(filterValue);
        });
        displayStories(filtered);
    }
}

// 搜索故事
function searchStories(searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    let stories = currentFilter === 'all' ? allStories : allStories.filter(story => {
        return story.tags && story.tags.includes(currentFilter);
    });

    if (searchTerm) {
        stories = stories.filter(story => {
            return (story.title && story.title.toLowerCase().includes(searchTerm)) ||
                (story.story_content && story.story_content.toLowerCase().includes(searchTerm)) ||
                (story.participant_name && story.participant_name.toLowerCase().includes(searchTerm));
        });
    }

    displayStories(stories);
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
