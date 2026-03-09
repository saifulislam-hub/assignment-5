const API_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issues";
const SEARCH_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=";
const SINGLE_ISSUE_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issue/";

let allIssues = [];

// --- Authentication Logic ---
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === 'admin' && pass === 'admin123') {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-page').classList.remove('hidden');
        fetchIssues();
    } else {
        alert('Invalid credentials!');
    }
});

function handleLogout() {
    location.reload();
}

// --- Data Fetching ---
// async function fetchIssues() {
//     toggleLoader(true);
//     try {
//         const res = await fetch(API_URL);
//         const data = await res.json();
//         allIssues = data.data; // Assuming API response format
//         renderIssues(allIssues);
//         updateCounts(allIssues);
//     } catch (err) {
//         console.error("Error fetching issues:", err);
//     } finally {
//         toggleLoader(false);
//     }
// }
async function fetchIssues() {
    toggleLoader(true);
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        allIssues = data.data || [];

        renderIssues(allIssues);
        updateCounts(allIssues);

    } catch (err) {
        console.error("Error fetching issues:", err);
    } finally {
        toggleLoader(false);
    }
}

async function handleSearch() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    toggleLoader(true);
    try {
        const res = await fetch(`${SEARCH_URL}${query}`);
        const data = await res.json();
        renderIssues(data.data);
    } catch (err) {
        console.error("Search error:", err);
    } finally {
        toggleLoader(false);
    }
}

document.getElementById('search-btn').addEventListener('click', handleSearch);

function renderIssues(issues) {
    const container = document.getElementById('issues-grid');
    container.innerHTML = '';

    issues.forEach(issue => {
        const card = document.createElement('div');
        
        let priorityClass = "bg-blue-100 text-blue-600"; 
        if (issue.priority?.toLowerCase() === 'high') {
            priorityClass = "bg-red-100 text-red-600";
        }
        
        const status = issue.status.toLowerCase();
        const borderTopColor = status === 'open' ? 'border-t-green-500' : 'border-t-purple-500';

        card.className = `card bg-base-100 shadow-md hover:shadow-xl border-t-4 transition-shadow cursor-pointer p-5 ${borderTopColor}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div class="w-4 h-4 rounded-full border-2 border-green-400 border-dashed"></div>
                <span class="${priorityClass} text-[10px] px-3 py-1 rounded-full font-bold uppercase">
                    ${issue.priority}
                </span>
            </div>

            <h2 class="text-lg font-semibold mb-2 text-gray-800">${issue.title}</h2>
            <p class="text-gray-500 text-sm mb-4 line-clamp-2">${issue.description}</p>

            <div class="flex flex-wrap gap-2 mb-4">
                ${renderDynamicLabels(issue)}
            </div>

            <div class="flex justify-between text-xs text-gray-400 border-t pt-3">
                <span>#${issue.author}</span>
                <span>${new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
        `;
        
        card.onclick = () => showDetails(issue._id || issue.id);
        container.appendChild(card);
    });
}


function renderDynamicLabels(issue) {
    const labels = Array.isArray(issue.labels) ? issue.labels : (issue.label ? [issue.label] : []);
    
    if (labels.length === 0) {
        return `<span class="bg-gray-100 text-gray-400 text-[10px] px-2 py-1 rounded font-bold uppercase">NO LABEL</span>`;
    }

   
    const colorMap = {
        'bug': 'bg-red-50 text-red-500 border-red-100',
        'enhancement': 'bg-blue-50 text-blue-600 border-blue-100',
        'help wanted': 'bg-yellow-50 text-yellow-600 border-yellow-100',
        'documentation': 'bg-green-50 text-green-600 border-green-100',
        'good first issue': 'bg-purple-50 text-purple-600 border-purple-100'
    };

    return labels.map(label => {
        
        const cleanLabel = label.toLowerCase().trim();
        const colorClass = colorMap[cleanLabel] || 'bg-gray-50 text-gray-500 border-gray-200'; 

        return `
            <span class="${colorClass} text-[10px] px-2 py-1 rounded font-bold uppercase border shadow-sm">
                ${label}
            </span>
        `;
    }).join('');
}


function filterData(category, element) {

    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
    element.classList.add('tab-active');

    let filteredIssues = [];

    if (category === 'all') {
        filteredIssues = allIssues;
    } else {
        filteredIssues = allIssues.filter(issue =>
            issue.status.toLowerCase() === category
        );
    }

    
    renderIssues(filteredIssues);

    
    document.getElementById('issue-count').innerText = filteredIssues.length;

    
    const open = allIssues.filter(i => i.status.toLowerCase() === 'open').length;
    const closed = allIssues.filter(i => i.status.toLowerCase() === 'closed').length;
    window.issueStats = { open, closed };
}


async function showDetails(id) {
    try {
        const res = await fetch(`${SINGLE_ISSUE_URL}${id}`);
        const data = await res.json();
        const issue = data.data;

       
        document.getElementById('modal-title').innerText = issue.title;
        document.getElementById('modal-title').className = "text-2xl font-bold text-gray-800 mb-2";

       
        document.getElementById('modal-content').innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center gap-2 text-xs text-gray-500">
                    <span class="bg-green-500 text-white px-3 py-0.5 rounded-full font-bold capitalize">
                        ${issue.status}
                    </span>
                    <span>• Opened by <span class="font-semibold text-gray-700">${issue.author}</span></span>
                    <span>• ${new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>

                <div class="flex flex-wrap gap-2 py-2">
                    ${renderDynamicLabels(issue)}
                </div>

                <p class="text-gray-600 text-sm leading-relaxed border-t pt-4">
                    ${issue.description}
                </p>

                <div class="bg-gray-50 rounded-xl p-5 grid grid-cols-2 gap-6 mt-6">
                    <div>
                        <p class="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider mb-2">Assignee:</p>
                        <p class="text-sm font-bold text-gray-800">${issue.author}</p> 
                    </div>
                    <div>
                        <p class="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider mb-2">Priority:</p>
                        <span class="bg-red-500 text-white text-[10px] px-4 py-1 rounded font-black uppercase inline-block">
                            ${issue.priority}
                        </span>
                    </div>
                </div>

                <div class="flex justify-end pt-6">
                    <form method="dialog">
                        <button class="bg-[#641ae3] hover:bg-[#5215c0] text-white px-8 py-2 rounded-lg font-bold text-sm transition-all shadow-lg active:scale-95">
                            Close
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('issue_modal').showModal();
    } catch (err) {
        console.error("Error loading single issue:", err);
    }
}


function toggleLoader(show) {
    document.getElementById('loader').classList.toggle('hidden', !show);
    document.getElementById('issues-grid').classList.toggle('hidden', show);
}


function updateCounts(issues) {
    const open = issues.filter(i => i.status.toLowerCase() === 'open').length;
    const closed = issues.filter(i => i.status.toLowerCase() === 'closed').length;

    
    window.issueStats = { open, closed };

    
    document.getElementById('issue-count').innerText = issues.length;
}
