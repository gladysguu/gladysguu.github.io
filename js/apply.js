// ========================
// 申请页面 JavaScript
// ========================

// 提交申请表单 (Submit application to Airtable)
async function submitApplication(formData) {
    try {
        const applicationData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || '',
            university: formData.get('university'),
            major: formData.get('major'),
            degree: formData.get('degree'),
            location: formData.get('location'),
            current_status: formData.get('current_status'),
            interest_topics: formData.get('interest_topics'),
            career_direction: formData.get('career_direction') || '',
            preferred_meeting: formData.get('preferred_meeting'),
            preferred_time: formData.get('preferred_time') || '',
            message: formData.get('message') || '',
            status: '待处理'
        };

        const response = await airtableCreate(AIRTABLE_CONFIG.TABLES.APPLICATIONS, applicationData);

        if (response.ok) {
            return await response.json();
        } else {
            const errorData = await response.json();
            console.error('Airtable error:', errorData);
            throw new Error('提交失败');
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        return null;
    }
}

// 表单验证
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#e74c3c';
        } else {
            field.style.borderColor = '#E5E0D8';
        }
    });

    // 验证邮箱格式
    const emailField = form.querySelector('#email');
    if (emailField && emailField.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
            isValid = false;
            emailField.style.borderColor = '#e74c3c';
            alert('请输入有效的邮箱地址 / Please enter a valid email address');
        }
    }

    return isValid;
}

// 显示成功消息
function showSuccessMessage() {
    const form = document.getElementById('application-form');
    const successMessage = document.getElementById('success-message');

    form.style.display = 'none';
    successMessage.style.display = 'block';

    // 滚动到成功消息
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    const applicationForm = document.getElementById('application-form');

    if (applicationForm) {
        applicationForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // 验证表单
            if (!validateForm(this)) {
                alert('请填写所有必填字段 / Please fill in all required fields');
                return;
            }

            // 禁用提交按钮，防止重复提交
            const submitBtn = document.getElementById('submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '提交中... Submitting...';
            submitBtn.disabled = true;

            // 提交表单数据
            const formData = new FormData(this);
            const result = await submitApplication(formData);

            if (result) {
                // 提交成功
                showSuccessMessage();
            } else {
                // 提交失败
                alert('提交失败，请稍后重试 / Submission failed, please try again later');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });

        // 实时移除错误标记
        const inputs = applicationForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function () {
                if (this.value.trim()) {
                    this.style.borderColor = '#E5E0D8';
                }
            });

            input.addEventListener('change', function () {
                if (this.value.trim()) {
                    this.style.borderColor = '#E5E0D8';
                }
            });
        });
    }
});
